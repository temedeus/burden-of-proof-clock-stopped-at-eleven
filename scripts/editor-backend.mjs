import { createServer } from "node:http";
import { mkdir, readFile, readdir, rename, rm, writeFile, copyFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { ACTIVE_STORY_ID } from "../packages/content-schema/src/story.ts";
import { buildFurnitureCatalog, validateRooms } from "../packages/content-schema/src/index.ts";
import { isStoryCasePacketValid, validateStoryCasePacket } from "../packages/content-schema/src/validateStory.ts";

const PORT = Number(process.env.EDITOR_BACKEND_PORT ?? 8787);
const ROOT = process.cwd();

const ROOMS_DIR = join(ROOT, "src", "data", "rooms");
const NPCS_DIR = join(ROOT, "src", "data", "npcs");
const FURNITURE_DIR = join(ROOT, "src", "data", "furniture");
const CLUES_FILE = join(ROOT, "src", "data", "clues.json");
const STORY_DIR = join(ROOT, "src", "data", "story", "generated");
const STORY_FILES_DIR = join(STORY_DIR, "stories");
const STORY_ARCHIVE_DIR = join(STORY_FILES_DIR, "archive");
const STORY_MANIFEST_FILE = join(STORY_DIR, "story_manifest.json");
const LEGACY_STORY_ID = "default";

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

async function readClues() {
    return await readJson(CLUES_FILE);
}

async function loadFurnitureMap() {
    const table = await readJson(join(FURNITURE_DIR, "table.json"));
    const bookshelves = await readJson(join(FURNITURE_DIR, "bookshelves.json"));
    const decorations = await readJson(join(FURNITURE_DIR, "decorations.json"));
    return buildFurnitureCatalog(table, bookshelves, decorations);
}

async function validateRoomPayload(room, allRooms, furnitureById, npcsById) {
    const roomsList = Object.values({ ...allRooms, [room.id]: room });
    return validateRooms(roomsList, furnitureById, npcsById);
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
    await mkdir(STORY_ARCHIVE_DIR, { recursive: true });
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

    const generatedClues = [
        {
            id: "clue_1",
            name: "Clue 1",
            description: "Describe what the player discovers."
        }
    ];

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

async function readActiveStoryPacket() {
    await ensureStoryDirs();
    try {
        return await readJson(storyPath(ACTIVE_STORY_ID));
    } catch {
        try {
            return await readJson(storyPath(LEGACY_STORY_ID));
        } catch {
            const npcs = await readNpcs();
            const rooms = await readRooms();
            const defaultRoomId = Object.keys(rooms)[0] ?? "hall";
            return blankCasePacket(Object.keys(npcs), defaultRoomId);
        }
    }
}

async function archiveCurrentActiveStory() {
    const activePath = storyPath(ACTIVE_STORY_ID);
    try {
        await readFile(activePath);
    } catch {
        try {
            await readFile(storyPath(LEGACY_STORY_ID));
        } catch {
            return null;
        }
    }

    const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
    const archiveDir = join(STORY_ARCHIVE_DIR, stamp);
    await mkdir(archiveDir, { recursive: true });

    try {
        await copyFile(activePath, join(archiveDir, `${ACTIVE_STORY_ID}.json`));
    } catch {
        await copyFile(storyPath(LEGACY_STORY_ID), join(archiveDir, `${LEGACY_STORY_ID}.json`));
    }

    try {
        await copyFile(STORY_MANIFEST_FILE, join(archiveDir, "story_manifest.json"));
    } catch {
        // no manifest yet
    }

    return relative(ROOT, archiveDir);
}

async function purgeNonActiveStoryFiles() {
    await ensureStoryDirs();
    const entries = await readdir(STORY_FILES_DIR, { withFileTypes: true });
    for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
        const storyId = entry.name.replace(/\.json$/, "");
        if (storyId !== ACTIVE_STORY_ID) {
            await rm(join(STORY_FILES_DIR, entry.name), { force: true });
        }
    }
}

async function writeActiveManifest(packet) {
    const rooms = await readRooms();
    const npcs = await readNpcs();
    const clues = await readClues();
    const validationCtx = storyValidationContext(rooms, npcs, clues, packet);
    const isValid = isStoryCasePacketValid(ACTIVE_STORY_ID, packet, validationCtx);
    const manifest = {
        version: 1,
        stories: [
            {
                id: ACTIVE_STORY_ID,
                title: packet.title ?? ACTIVE_STORY_ID,
                seed: 0,
                createdAt: new Date().toISOString(),
                files: { story: `generated/stories/${ACTIVE_STORY_ID}.json` },
                qualityTier: "authored",
                isValid
            }
        ]
    };
    await writeFile(STORY_MANIFEST_FILE, JSON.stringify(manifest, null, 2) + "\n", "utf8");
    return {
        manifest,
        isValid,
        issues: validateStoryCasePacket(ACTIVE_STORY_ID, packet, validationCtx)
    };
}

async function saveActiveStory(packet) {
    const archivedTo = await archiveCurrentActiveStory();
    await ensureStoryDirs();
    await writeFile(storyPath(ACTIVE_STORY_ID), JSON.stringify(packet, null, 2) + "\n", "utf8");
    await purgeNonActiveStoryFiles();
    const result = await writeActiveManifest(packet);
    return { ...result, archivedTo };
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
            sendJson(res, 200, { ok: true, features: ["rooms", "story", "cases"] });
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

        if (req.method === "GET" && pathname === "/api/story") {
            const packet = await readActiveStoryPacket();
            const manifest = await readJson(STORY_MANIFEST_FILE).catch(() => ({
                version: 1,
                stories: []
            }));
            sendJson(res, 200, { id: ACTIVE_STORY_ID, packet, manifest });
            return;
        }

        if (req.method === "PUT" && pathname === "/api/story") {
            const payload = await readBody(req);
            const packet = payload.packet;
            if (!packet || typeof packet !== "object") {
                sendJson(res, 400, { error: "Missing packet payload." });
                return;
            }
            const result = await saveActiveStory(packet);
            sendJson(res, 200, {
                ok: true,
                id: ACTIVE_STORY_ID,
                isValid: result.isValid,
                issues: result.issues,
                archivedTo: result.archivedTo
            });
            return;
        }

        // Legacy aliases (older editor-backend process compatibility)
        if (req.method === "GET" && pathname === "/api/cases") {
            const manifest = await readJson(STORY_MANIFEST_FILE).catch(() => ({
                version: 1,
                stories: []
            }));
            sendJson(res, 200, { manifest });
            return;
        }

        if (req.method === "GET" && pathname === `/api/cases/${ACTIVE_STORY_ID}`) {
            const packet = await readActiveStoryPacket();
            sendJson(res, 200, { id: ACTIVE_STORY_ID, packet });
            return;
        }

        if (req.method === "PUT" && pathname === `/api/cases/${ACTIVE_STORY_ID}`) {
            const payload = await readBody(req);
            const packet = payload.packet;
            if (!packet || typeof packet !== "object") {
                sendJson(res, 400, { error: "Missing packet payload." });
                return;
            }
            const result = await saveActiveStory(packet);
            sendJson(res, 200, {
                ok: true,
                id: ACTIVE_STORY_ID,
                isValid: result.isValid,
                issues: result.issues,
                archivedTo: result.archivedTo
            });
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
            const [allRooms, furnitureById, npcsById] = await Promise.all([
                readRooms(),
                loadFurnitureMap(),
                readNpcs()
            ]);
            const issues = await validateRoomPayload(
                room,
                { ...allRooms, [roomId]: room },
                furnitureById,
                npcsById
            );
            if (issues.length > 0) {
                sendJson(res, 400, {
                    error: "Room validation failed.",
                    issues
                });
                return;
            }
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
