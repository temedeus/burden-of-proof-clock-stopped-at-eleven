import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = process.cwd();
const ROOMS_DIR = join(ROOT, "src", "data", "rooms");
const NPCS_DIR = join(ROOT, "src", "data", "npcs");
const VALID_SPRITES = new Set([
    "wall", "floor", "door", "table", "bookshelf", "npc_male", "npc_female", "player",
    "female_detective", "male_detective", "baron", "baroness", "maid", "worker_man", "worker_boy",
    "police", "police2", "fountain", "tree", "bush", "pond_corner_flower", "pond_corner_plain",
    "pond_corner_grass", "pond_corner_rock", "water_reeds", "water_ripple", "water_lily", "pond",
    "grass", "gravel", "manor_gate", "manor_building", "fireplace", "dining_table", "kitchen_table",
    "booze_table", "drinking_chair", "carpet"
]);

function validateRooms(rooms, furnitureById, npcsById) {
    const issues = [];
    const roomIds = new Set(rooms.map((room) => room.id));
    const npcPlacementCounts = new Map();
    const posTokens = new Set(["center", "top", "bottom"]);
    const exitYTokens = new Set(["center", "top", "bottom"]);
    const spawnYTokens = new Set(["center", "bottom-1", "bottom-2", "bottom-3"]);

    for (const room of rooms) {
        const resolvePosition = (value, roomDimension) => {
            if (typeof value === "number") return value;
            if (value === "center") return Math.floor(roomDimension / 2);
            if (value === "top") return 0;
            return roomDimension - 1;
        };
        const resolveSpawnY = (value) => {
            if (typeof value === "number") return value;
            if (value === "center") return Math.floor(room.height / 2) - 1;
            if (value === "bottom-1") return room.height - 2;
            if (value === "bottom-2") return room.height - 3;
            return room.height - 4;
        };

        for (const exit of room.exits ?? []) {
            if (!roomIds.has(exit.targetRoom)) issues.push({ roomId: room.id, message: `Unknown targetRoom '${exit.targetRoom}'.` });
            if (!(typeof exit.x === "number" || (typeof exit.x === "string" && posTokens.has(exit.x)))) {
                issues.push({ roomId: room.id, message: "Exit x is invalid." });
            }
            if (!(typeof exit.y === "string" && exitYTokens.has(exit.y))) issues.push({ roomId: room.id, message: "Exit y is invalid." });
            if (!(typeof exit.spawnX === "number" || exit.spawnX === "center")) issues.push({ roomId: room.id, message: "Exit spawnX is invalid." });
            if (!(typeof exit.spawnY === "number" || (typeof exit.spawnY === "string" && spawnYTokens.has(exit.spawnY)))) {
                issues.push({ roomId: room.id, message: "Exit spawnY is invalid." });
            }
            const exitX = resolvePosition(exit.x, room.width);
            const exitY = resolvePosition(exit.y, room.height);
            if (exitX < 0 || exitX >= room.width || exitY < 0 || exitY >= room.height) {
                issues.push({ roomId: room.id, message: `Exit '${exit.targetRoom}' resolves out of room bounds.` });
            }
            const spawnX = typeof exit.spawnX === "number" ? exit.spawnX : Math.floor(room.width / 2);
            const spawnY = resolveSpawnY(exit.spawnY);
            if (spawnX < 0 || spawnX >= room.width || spawnY < 0 || spawnY >= room.height) {
                issues.push({ roomId: room.id, message: `Exit spawn point for '${exit.targetRoom}' resolves out of room bounds.` });
            }
        }

        for (const placement of room.furniture ?? []) {
            const furniture = furnitureById[placement.furnitureId];
            if (!furniture) {
                issues.push({ roomId: room.id, message: `Unknown furniture '${placement.furnitureId}'.` });
                continue;
            }
            if (!(typeof placement.x === "number" || placement.x === "center")) issues.push({ roomId: room.id, message: `Furniture '${placement.furnitureId}' has invalid x.` });
            if (!(typeof placement.y === "number" || posTokens.has(placement.y))) issues.push({ roomId: room.id, message: `Furniture '${placement.furnitureId}' has invalid y.` });
            const x = typeof placement.x === "number" ? placement.x : Math.floor(room.width / 2);
            const y = resolvePosition(placement.y, room.height);
            if (x < 0 || x >= room.width || y < 0 || y >= room.height) {
                issues.push({ roomId: room.id, message: `Furniture '${placement.furnitureId}' placement resolves out of room bounds.` });
            }
            if (furniture.spriteName && !VALID_SPRITES.has(furniture.spriteName)) {
                issues.push({ roomId: room.id, message: `Furniture '${placement.furnitureId}' uses unknown sprite '${furniture.spriteName}'.` });
            }
        }

        for (const placement of room.npcs ?? []) {
            npcPlacementCounts.set(placement.npcId, (npcPlacementCounts.get(placement.npcId) ?? 0) + 1);
            const npc = npcsById[placement.npcId];
            if (!npc) issues.push({ roomId: room.id, message: `Unknown npc '${placement.npcId}'.` });
            if (!(typeof placement.x === "number" || placement.x === "center")) issues.push({ roomId: room.id, message: `NPC '${placement.npcId}' has invalid x.` });
            if (!(typeof placement.y === "number" || posTokens.has(placement.y))) issues.push({ roomId: room.id, message: `NPC '${placement.npcId}' has invalid y.` });
            const x = typeof placement.x === "number" ? placement.x : Math.floor(room.width / 2);
            const y = resolvePosition(placement.y, room.height);
            if (x < 0 || x >= room.width || y < 0 || y >= room.height) {
                issues.push({ roomId: room.id, message: `NPC '${placement.npcId}' placement resolves out of room bounds.` });
            }
            if (npc?.spriteName && !VALID_SPRITES.has(npc.spriteName)) {
                issues.push({ roomId: room.id, message: `NPC '${placement.npcId}' uses unknown sprite '${npc.spriteName}'.` });
            }
        }
    }

    for (const npcId of Object.keys(npcsById)) {
        const count = npcPlacementCounts.get(npcId) ?? 0;
        if (count === 0) {
            issues.push({ roomId: "global", message: `NPC '${npcId}' is not placed in any room.` });
        } else if (count > 1) {
            issues.push({ roomId: "global", message: `NPC '${npcId}' is placed ${count} times; expected exactly once.` });
        }
    }

    return issues;
}

async function readJson(filePath) {
    const content = await readFile(filePath, "utf8");
    return JSON.parse(content);
}

async function readJsonDir(dirPath) {
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

async function loadFurnitureMap() {
    const table = await readJson(join(ROOT, "src", "data", "furniture", "table.json"));
    const bookshelves = await readJson(join(ROOT, "src", "data", "furniture", "bookshelves.json"));
    const decorations = await readJson(join(ROOT, "src", "data", "furniture", "decorations.json"));
    return {
        table,
        bookshelves,
        ...decorations
    };
}

async function main() {
    const roomsById = await readJsonDir(ROOMS_DIR);
    const npcsById = await readJsonDir(NPCS_DIR);
    const furnitureById = await loadFurnitureMap();
    const issues = validateRooms(Object.values(roomsById), furnitureById, npcsById);

    if (issues.length === 0) {
        console.log("Content validation passed.");
        return;
    }

    console.error("Content validation failed:");
    for (const issue of issues) {
        console.error(`- [${issue.roomId}] ${issue.message}`);
    }
    process.exitCode = 1;
}

main().catch((error) => {
    console.error("Validation script crashed:", error);
    process.exitCode = 1;
});
