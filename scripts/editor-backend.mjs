import { createServer } from "node:http";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const PORT = Number(process.env.EDITOR_BACKEND_PORT ?? 8787);
const ROOT = process.cwd();
const ROOMS_DIR = join(ROOT, "src", "data", "rooms");

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

async function readRooms() {
    await mkdir(ROOMS_DIR, { recursive: true });
    const entries = await readdir(ROOMS_DIR);
    const jsonFiles = entries.filter((entry) => entry.endsWith(".json"));
    const rooms = {};
    for (const fileName of jsonFiles) {
        const filePath = join(ROOMS_DIR, fileName);
        const raw = await readFile(filePath, "utf8");
        const room = JSON.parse(raw);
        const roomId = fileName.replace(".json", "");
        rooms[roomId] = room;
    }
    return rooms;
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
