import { createServer } from "node:http";
import { mkdir, readFile, readdir, rename, rm, writeFile, copyFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { STORY_CLUE_COUNT } from "../packages/content-schema/src/story.ts";
import { isStoryCasePacketValid, validateStoryCasePacket } from "../packages/content-schema/src/validateStory.ts";

const PORT = Number(process.env.EDITOR_BACKEND_PORT ?? 8787);
const ROOT = process.cwd();

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

function safeCaseId(caseId) {
    return /^[a-z0-9_-]+$/i.test(caseId);
}

function roomPath(roomId) {
    return resolve(ROOMS_DIR, `${roomId}.json`);
}

function casePath(caseId) {
    return resolve(STORY_FILES_DIR, `${caseId}.json`);
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

function createCaseId() {
    const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
    return `case_${stamp}`;
}

function storyValidationContext(rooms, npcs, clues, packet = null) {
    const clueIds = Object.keys(clues);
    if (packet?.generatedClues) {
        for (const clue of packet.generatedClues) {
            if (clue?.id) clueIds.push(clue.id);
        }
    }
    return {
        roomIds: Object.keys(rooms),
        npcIds: Object.keys(npcs),
        clueIds,
        rooms
    };
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
        await copyFile(filePath, `${filePath}.${Date.now()}.bak`);
    } catch {
        // ignore missing file
    }
}

function blankCasePacket(npcIds, defaultRoomId = "hall") {
    const suspects = npcIds
        .filter((id) => !id.startsWith("police"))
        .map((npcId) => ({
            npcId,
            motive: "Unknown motive.",
            opportunity: "Was near the manor that evening.",
            alibi: "Claims to have been elsewhere."
        }));

    const generatedClues = Array.from({ length: STORY_CLUE_COUNT }, (_, i) => ({
        id: `clue_${i + 1}`,
        name: `Clue ${i + 1}`,
        description: "Describe what the player discovers."
    }));

    return {
        title: "New Case",
        victim: { name: "The victim", roomId: defaultRoomId, time: "eleven o'clock" },
        culpritNpcId: suspects.find((s) => s.npcId === "cook")?.npcId ?? suspects[0]?.npcId ?? npcIds[0],
        suspects,
        roomNarratives: [],
        generatedClues,
        clueAssignments: generatedClues.map((clue) => ({
            clueId: clue.id,
            roomId: defaultRoomId,
            furnitureId: "table",
            furnitureIndex: 0,
            hint: "Something here seems suspicious."
        })),
        npcDialogOverrides: npcIds.map((npcId) => ({
            npcId,
            default: "I have nothing more to say."
        }))
    };
}

async function upsertManifestEntry(caseId, packet, seed = 0) {
    const manifest = await readStoryManifest();
    const rooms = await readRooms();
    const npcs = await readNpcs();
    const clues = await readClues();
    const validationCtx = storyValidationContext(rooms, npcs, clues, packet);
    const isValid = isStoryCasePacketValid(caseId, packet, validationCtx);

    const existing = (manifest.stories ?? []).filter((s) => s.id !== caseId);
    existing.push({
        id: caseId,
        title: packet.title ?? caseId,
        seed,
        createdAt: new Date().toISOString(),
        files: { story: `generated/stories/${caseId}.json` },
        qualityTier: "authored",
        isValid
    });
    existing.sort((a, b) => a.id.localeCompare(b.id));

    await backupFileIfExists(STORY_MANIFEST_FILE);
    await writeFile(STORY_MANIFEST_FILE, JSON.stringify({ version: 1, stories: existing }, null, 2) + "\n", "utf8");
    return { manifest: { version: 1, stories: existing }, isValid, issues: validateStoryCasePacket(caseId, packet, validationCtx) };
}

async function writeCase(caseId, packet) {
    if (!safeCaseId(caseId)) throw new Error(`Invalid case id '${caseId}'.`);
    await ensureStoryDirs();
    const filePath = casePath(caseId);
    await backupFileIfExists(filePath);
    await writeFile(filePath, JSON.stringify(packet, null, 2) + "\n", "utf8");
    return upsertManifestEntry(caseId, packet);
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
            sendJson(res, 200, { ok: true, features: ["rooms", "cases"] });
            return;
        }

        if (req.method === "GET" && pathname === "/api/rooms") {
            sendJson(res, 200, { rooms: await readRooms() });
            return;
        }

        if (req.method === "GET" && pathname === "/api/clues") {
            sendJson(res, 200, { clues: await readClues() });
            return;
        }

        if (req.method === "GET" && pathname === "/api/cases") {
            const manifest = await readStoryManifest();
            sendJson(res, 200, { manifest });
            return;
        }

        if (req.method === "GET" && pathname.startsWith("/api/cases/")) {
            const caseId = pathname.replace("/api/cases/", "");
            if (!safeCaseId(caseId)) {
                sendJson(res, 400, { error: "Invalid case id." });
                return;
            }
            try {
                const packet = await readJson(casePath(caseId));
                sendJson(res, 200, { id: caseId, packet });
            } catch {
                sendJson(res, 404, { error: "Case not found." });
            }
            return;
        }

        if (req.method === "POST" && pathname === "/api/cases") {
            const payload = await readBody(req);
            const caseId = payload.id && safeCaseId(payload.id) ? payload.id : createCaseId();
            const npcs = await readNpcs();
            const rooms = await readRooms();
            const defaultRoomId = Object.keys(rooms)[0] ?? "hall";
            const packet = payload.packet ?? blankCasePacket(Object.keys(npcs), defaultRoomId);
            const result = await writeCase(caseId, packet);
            sendJson(res, 200, { ok: true, id: caseId, ...result });
            return;
        }

        if (req.method === "PUT" && pathname.startsWith("/api/cases/")) {
            const caseId = pathname.replace("/api/cases/", "");
            if (!safeCaseId(caseId)) {
                sendJson(res, 400, { error: "Invalid case id." });
                return;
            }
            const payload = await readBody(req);
            const packet = payload.packet;
            if (!packet || typeof packet !== "object") {
                sendJson(res, 400, { error: "Missing packet payload." });
                return;
            }
            const result = await writeCase(caseId, packet);
            sendJson(res, 200, { ok: true, id: caseId, ...result });
            return;
        }

        if (req.method === "DELETE" && pathname.startsWith("/api/cases/")) {
            const caseId = pathname.replace("/api/cases/", "");
            if (!safeCaseId(caseId)) {
                sendJson(res, 400, { error: "Invalid case id." });
                return;
            }
            const manifest = await readStoryManifest();
            const nextStories = (manifest.stories ?? []).filter((s) => s.id !== caseId);
            await rm(casePath(caseId), { force: true });
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
            const { fromId, toId } = payload;
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
