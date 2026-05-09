import { createServer } from "node:http";
import { mkdir, readFile, readdir, rename, rm, writeFile, copyFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const PORT = Number(process.env.EDITOR_BACKEND_PORT ?? 8787);
const ROOT = process.cwd();
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const AI_MODEL_DEFAULT = process.env.AI_MODEL_DEFAULT ?? "mistral";
const AI_MODEL_QUALITY = process.env.AI_MODEL_QUALITY ?? "mistral";
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS ?? 120000);
const AI_MAX_RETRIES = Number(process.env.AI_MAX_RETRIES ?? 1);

const ROOMS_DIR = join(ROOT, "src", "data", "rooms");
const NPCS_DIR = join(ROOT, "src", "data", "npcs");
const FURNITURE_DIR = join(ROOT, "src", "data", "furniture");
const CLUES_FILE = join(ROOT, "src", "data", "clues.json");
const STORY_DIR = join(ROOT, "src", "data", "story", "generated");
const STORY_FILES_DIR = join(STORY_DIR, "stories");
const STORY_MANIFEST_FILE = join(STORY_DIR, "story_manifest.json");

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end(JSON.stringify(payload));
}

function safeRoomId(roomId) {
    return /^[a-z0-9_-]+$/i.test(roomId);
}

function safeStoryId(storyId) {
    return /^[a-z0-9_-]+$/i.test(storyId);
}

function roomPath(roomId) {
    return resolve(ROOMS_DIR, `${roomId}.json`);
}

function storyPath(storyId) {
    return resolve(STORY_FILES_DIR, `${storyId}.json`);
}

async function readJson(filePath) {
    return JSON.parse(await readFile(filePath, "utf8"));
}

async function readJsonDir(dirPath) {
    await mkdir(dirPath, { recursive: true });
    const entries = await readdir(dirPath);
    const jsonFiles = entries.filter((entry) => entry.endsWith(".json"));
    const parsed = await Promise.all(
        jsonFiles.map(async (entry) => ({
            id: entry.replace(".json", ""),
            value: await readJson(join(dirPath, entry))
        }))
    );
    return Object.fromEntries(parsed.map((item) => [item.id, item.value]));
}

async function readRooms() {
    return await readJsonDir(ROOMS_DIR);
}

async function readNpcs() {
    return await readJsonDir(NPCS_DIR);
}

async function readFurniture() {
    const table = await readJson(join(FURNITURE_DIR, "table.json"));
    const bookshelves = await readJson(join(FURNITURE_DIR, "bookshelves.json"));
    const decorations = await readJson(join(FURNITURE_DIR, "decorations.json"));
    return { table, bookshelves, ...decorations };
}

async function readClues() {
    return await readJson(CLUES_FILE);
}

async function syncRooms(nextRooms) {
    await mkdir(ROOMS_DIR, { recursive: true });
    const existingEntries = await readdir(ROOMS_DIR);
    const existingJson = new Set(existingEntries.filter((entry) => entry.endsWith(".json")));

    for (const [roomId, room] of Object.entries(nextRooms)) {
        if (!safeRoomId(roomId)) {
            throw new Error(`Invalid room id '${roomId}' in sync payload.`);
        }
        room.id = roomId;
        await writeFile(roomPath(roomId), JSON.stringify(room, null, 2) + "\n", "utf8");
        existingJson.delete(`${roomId}.json`);
    }

    for (const staleFile of existingJson) {
        await rm(join(ROOMS_DIR, staleFile), { force: true });
    }
}

async function readBody(req) {
    let data = "";
    for await (const chunk of req) data += chunk;
    return data.length ? JSON.parse(data) : {};
}

function createStoryId(index) {
    const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
    return `story_${stamp}_${String(index + 1).padStart(2, "0")}`;
}

function buildAiPrompt(input, seed) {
    return `
You are generating a murder-mystery game story pack in strict JSON.
Use ONLY existing ids from input:
- room ids
- npc ids
- clue ids

Rules:
1) Output valid JSON only, no markdown.
2) Keep every NPC placed exactly once in narrative roles.
3) Keep clues grounded to existing clue ids.
4) Ensure story is coherent with room graph and NPC presence.
5) Keep content concise and game-ready.

Seed: ${seed}

JSON shape:
{
  "title": "string",
  "victim": {"name":"string","roomId":"existingRoomId","time":"string"},
  "suspects":[{"npcId":"existingNpcId","motive":"string","opportunity":"string","alibi":"string"}],
  "roomNarratives":[{"roomId":"existingRoomId","summary":"string"}],
  "clueAssignments":[{"clueId":"existingClueId","roomId":"existingRoomId","hint":"string"}],
  "npcDialogOverrides":[
    {
      "npcId":"existingNpcId",
      "default":"string",
      "conditions":[{"requiresClue":"existingClueId","dialog":"string"}]
    }
  ]
}

Input:
${JSON.stringify(input)}
`;
}

async function callOllama({ model, prompt, seed }) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
                model,
                stream: false,
                format: "json",
                options: { seed },
                messages: [{ role: "user", content: prompt }]
            })
        });
        if (!response.ok) {
            throw new Error(`Ollama request failed with HTTP ${response.status}`);
        }
        const payload = await response.json();
        const content = payload?.message?.content;
        if (typeof content !== "string") throw new Error("Ollama response missing message content.");
        return content;
    } finally {
        clearTimeout(timeout);
    }
}

function parseModelJson(content) {
    try {
        return JSON.parse(content);
    } catch {
        const first = content.indexOf("{");
        const last = content.lastIndexOf("}");
        if (first >= 0 && last > first) {
            return JSON.parse(content.slice(first, last + 1));
        }
        throw new Error("Model output is not valid JSON.");
    }
}

function validateCasePacket(packet, context) {
    const issues = [];
    const roomIds = new Set(Object.keys(context.rooms));
    const npcIds = new Set(Object.keys(context.npcs));
    const clueIds = new Set(Object.keys(context.clues));

    if (!packet || typeof packet !== "object") issues.push("Packet is not an object.");
    if (!packet.title) issues.push("Missing title.");
    if (!packet.victim?.roomId || !roomIds.has(packet.victim.roomId)) issues.push("Victim roomId missing/invalid.");

    const suspectNpcIds = new Set();
    for (const suspect of packet.suspects ?? []) {
        if (!npcIds.has(suspect.npcId)) issues.push(`Invalid suspect npcId '${suspect.npcId}'.`);
        if (suspectNpcIds.has(suspect.npcId)) issues.push(`Duplicate suspect npcId '${suspect.npcId}'.`);
        suspectNpcIds.add(suspect.npcId);
    }

    for (const entry of packet.roomNarratives ?? []) {
        if (!roomIds.has(entry.roomId)) issues.push(`Invalid roomNarratives roomId '${entry.roomId}'.`);
    }
    for (const assignment of packet.clueAssignments ?? []) {
        if (!clueIds.has(assignment.clueId)) issues.push(`Invalid clueAssignments clueId '${assignment.clueId}'.`);
        if (!roomIds.has(assignment.roomId)) issues.push(`Invalid clueAssignments roomId '${assignment.roomId}'.`);
    }
    const seenDialogNpcs = new Set();
    for (const dialog of packet.npcDialogOverrides ?? []) {
        if (!npcIds.has(dialog.npcId)) issues.push(`Invalid npcDialogOverrides npcId '${dialog.npcId}'.`);
        if (seenDialogNpcs.has(dialog.npcId)) issues.push(`Duplicate npcDialogOverrides npcId '${dialog.npcId}'.`);
        seenDialogNpcs.add(dialog.npcId);
        for (const condition of dialog.conditions ?? []) {
            if (condition.requiresClue && !clueIds.has(condition.requiresClue)) {
                issues.push(`Invalid requiresClue '${condition.requiresClue}' for npc '${dialog.npcId}'.`);
            }
        }
    }

    return issues;
}

async function ensureStoryDirs() {
    await mkdir(STORY_FILES_DIR, { recursive: true });
}

async function readStoryManifest() {
    await ensureStoryDirs();
    try {
        return await readJson(STORY_MANIFEST_FILE);
    } catch {
        return { version: 1, stories: [] };
    }
}

async function backupFileIfExists(filePath) {
    try {
        const backupPath = `${filePath}.${Date.now()}.bak`;
        await copyFile(filePath, backupPath);
    } catch {
        // ignore if file doesn't exist
    }
}

async function writeStoryArtifacts(storyItems) {
    await ensureStoryDirs();
    const manifest = await readStoryManifest();
    const existingById = new Map((manifest.stories ?? []).map((s) => [s.id, s]));

    for (const item of storyItems) {
        if (!safeStoryId(item.id)) throw new Error(`Invalid story id '${item.id}'.`);
        const filePath = storyPath(item.id);
        await backupFileIfExists(filePath);
        await writeFile(filePath, JSON.stringify(item.payload, null, 2) + "\n", "utf8");
        existingById.set(item.id, {
            id: item.id,
            title: item.payload.title ?? item.id,
            seed: item.seed,
            createdAt: item.createdAt,
            files: { story: `generated/stories/${item.id}.json` },
            qualityTier: item.qualityTier,
            isValid: true
        });
    }

    const nextManifest = {
        version: 1,
        stories: Array.from(existingById.values()).sort((a, b) => a.id.localeCompare(b.id))
    };
    await backupFileIfExists(STORY_MANIFEST_FILE);
    await writeFile(STORY_MANIFEST_FILE, JSON.stringify(nextManifest, null, 2) + "\n", "utf8");
    return nextManifest;
}

async function generateStories({ variantCount = 1, qualityMode = "fast", seedBase = Date.now(), dryRun = false }) {
    const rooms = await readRooms();
    const npcs = await readNpcs();
    const furniture = await readFurniture();
    const clues = await readClues();
    const context = { rooms, npcs, furniture, clues };
    const model = qualityMode === "quality" ? AI_MODEL_QUALITY : AI_MODEL_DEFAULT;

    const generated = [];
    for (let i = 0; i < variantCount; i++) {
        const seed = Number(seedBase) + i;
        const prompt = buildAiPrompt(context, seed);
        let parsed = null;
        let lastErr = null;

        for (let attempt = 0; attempt <= AI_MAX_RETRIES; attempt++) {
            try {
                const raw = await callOllama({ model, prompt, seed: seed + attempt });
                parsed = parseModelJson(raw);
                const issues = validateCasePacket(parsed, context);
                if (issues.length > 0) {
                    throw new Error(`Validation failed: ${issues.join("; ")}`);
                }
                break;
            } catch (error) {
                lastErr = error;
            }
        }
        if (!parsed) throw lastErr ?? new Error("Failed to generate case packet.");

        generated.push({
            id: createStoryId(i),
            seed,
            qualityTier: qualityMode,
            createdAt: new Date().toISOString(),
            payload: parsed
        });
    }

    if (dryRun) {
        return { generated, manifest: null };
    }
    const manifest = await writeStoryArtifacts(generated);
    return { generated, manifest };
}

const server = createServer(async (req, res) => {
    try {
        const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
        const pathname = url.pathname;

        if (req.method === "OPTIONS") {
            sendJson(res, 204, {});
            return;
        }

        if (req.method === "GET" && pathname === "/health") {
            sendJson(res, 200, { ok: true });
            return;
        }

        if (req.method === "GET" && pathname === "/api/rooms") {
            sendJson(res, 200, { rooms: await readRooms() });
            return;
        }

        if (req.method === "GET" && pathname === "/api/ai/stories") {
            const manifest = await readStoryManifest();
            sendJson(res, 200, { manifest });
            return;
        }

        if (req.method === "POST" && pathname === "/api/ai/generate-case") {
            const payload = await readBody(req);
            const variantCount = Math.max(1, Math.min(20, Number(payload.variantCount ?? 1)));
            const qualityMode = payload.qualityMode === "quality" ? "quality" : "fast";
            const seedBase = Number(payload.seedBase ?? Date.now());
            const result = await generateStories({ variantCount, qualityMode, seedBase, dryRun: false });
            sendJson(res, 200, {
                ok: true,
                generatedCount: result.generated.length,
                generatedIds: result.generated.map((g) => g.id),
                manifest: result.manifest
            });
            return;
        }

        if (req.method === "POST" && pathname === "/api/ai/preview-case") {
            const payload = await readBody(req);
            const variantCount = Math.max(1, Math.min(5, Number(payload.variantCount ?? 1)));
            const qualityMode = payload.qualityMode === "quality" ? "quality" : "fast";
            const seedBase = Number(payload.seedBase ?? Date.now());
            const result = await generateStories({ variantCount, qualityMode, seedBase, dryRun: true });
            sendJson(res, 200, {
                ok: true,
                generated: result.generated.map((g) => ({
                    id: g.id,
                    title: g.payload.title ?? g.id,
                    victim: g.payload.victim ?? null
                }))
            });
            return;
        }

        if (req.method === "DELETE" && pathname.startsWith("/api/ai/stories/")) {
            const storyId = pathname.replace("/api/ai/stories/", "");
            if (!safeStoryId(storyId)) {
                sendJson(res, 400, { error: "Invalid story id." });
                return;
            }
            const manifest = await readStoryManifest();
            const nextStories = (manifest.stories ?? []).filter((s) => s.id !== storyId);
            await rm(storyPath(storyId), { force: true });
            await writeFile(STORY_MANIFEST_FILE, JSON.stringify({ version: 1, stories: nextStories }, null, 2) + "\n", "utf8");
            sendJson(res, 200, { ok: true });
            return;
        }

        if (req.method === "PUT" && pathname.startsWith("/api/rooms/")) {
            const roomId = pathname.replace("/api/rooms/", "");
            if (!safeRoomId(roomId)) {
                sendJson(res, 400, { error: "Invalid room id." });
                return;
            }
            const payload = await readBody(req);
            const room = payload.room;
            if (!room || typeof room !== "object") {
                sendJson(res, 400, { error: "Missing room payload." });
                return;
            }
            room.id = roomId;
            await writeFile(roomPath(roomId), JSON.stringify(room, null, 2) + "\n", "utf8");
            sendJson(res, 200, { ok: true });
            return;
        }

        if (req.method === "POST" && pathname === "/api/rooms/rename") {
            const payload = await readBody(req);
            const fromId = payload.fromId;
            const toId = payload.toId;
            if (!safeRoomId(fromId) || !safeRoomId(toId)) {
                sendJson(res, 400, { error: "Invalid room id." });
                return;
            }
            await rename(roomPath(fromId), roomPath(toId));
            sendJson(res, 200, { ok: true });
            return;
        }

        if (req.method === "POST" && pathname === "/api/rooms/sync") {
            const payload = await readBody(req);
            const rooms = payload.rooms;
            if (!rooms || typeof rooms !== "object") {
                sendJson(res, 400, { error: "Missing rooms payload." });
                return;
            }
            await syncRooms(rooms);
            sendJson(res, 200, { ok: true });
            return;
        }

        if (req.method === "DELETE" && pathname.startsWith("/api/rooms/")) {
            const roomId = pathname.replace("/api/rooms/", "");
            if (!safeRoomId(roomId)) {
                sendJson(res, 400, { error: "Invalid room id." });
                return;
            }
            await rm(roomPath(roomId), { force: true });
            sendJson(res, 200, { ok: true });
            return;
        }

        sendJson(res, 404, { error: "Not found." });
    } catch (error) {
        sendJson(res, 500, { error: error instanceof Error ? error.message : "Unknown server error." });
    }
});

server.listen(PORT, () => {
    console.log(`Editor backend running at http://localhost:${PORT}`);
});
