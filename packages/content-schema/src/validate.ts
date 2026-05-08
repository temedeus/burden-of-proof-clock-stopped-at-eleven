import type { NPCConfig } from "./npcs";
import type { RoomConfig } from "./rooms";
import { VALID_SPRITE_NAMES } from "./sprites";

interface FurnitureConfig {
    id: string;
    width: number;
    height: number;
    spriteName?: string;
}

export interface ValidationIssue {
    roomId: string;
    message: string;
}

const VALID_POSITION_TOKENS = new Set(["center", "top", "bottom"]);
const VALID_EXIT_Y_TOKENS = new Set(["top", "bottom", "center"]);
const VALID_SPAWN_Y_TOKENS = new Set(["center", "bottom-1", "bottom-2", "bottom-3"]);
const VALID_SPRITES = new Set<string>(VALID_SPRITE_NAMES);

function isNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
}

function isPositionToken(value: unknown): boolean {
    return isNumber(value) || (typeof value === "string" && VALID_POSITION_TOKENS.has(value));
}

function isSpawnYToken(value: unknown): boolean {
    return isNumber(value) || (typeof value === "string" && VALID_SPAWN_Y_TOKENS.has(value));
}

function isExitYToken(value: unknown): boolean {
    return typeof value === "string" && VALID_EXIT_Y_TOKENS.has(value);
}

function resolvePosition(value: number | "center" | "top" | "bottom", roomDimension: number): number {
    if (typeof value === "number") return value;
    if (value === "center") return Math.floor(roomDimension / 2);
    if (value === "top") return 0;
    return roomDimension - 1;
}

function resolveSpawnY(value: number | "bottom-1" | "bottom-2" | "bottom-3" | "center", roomHeight: number): number {
    if (typeof value === "number") return value;
    if (value === "center") return Math.floor(roomHeight / 2) - 1;
    if (value === "bottom-1") return roomHeight - 2;
    if (value === "bottom-2") return roomHeight - 3;
    return roomHeight - 4;
}

export function validateRooms(
    rooms: RoomConfig[],
    furnitureById: Record<string, FurnitureConfig>,
    npcsById: Record<string, NPCConfig>
): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const roomIds = new Set(rooms.map((room) => room.id));

    for (const room of rooms) {
        if (!room.id || !isNumber(room.width) || !isNumber(room.height)) {
            issues.push({ roomId: room.id ?? "unknown", message: "Room is missing id/width/height." });
            continue;
        }

        for (const exit of room.exits ?? []) {
            if (!roomIds.has(exit.targetRoom)) {
                issues.push({ roomId: room.id, message: `Exit targetRoom '${exit.targetRoom}' does not exist.` });
            }
            if (!isPositionToken(exit.x)) {
                issues.push({ roomId: room.id, message: "Exit x must be a number or 'center'." });
            }
            if (!isExitYToken(exit.y)) {
                issues.push({ roomId: room.id, message: `Exit y '${String(exit.y)}' is invalid.` });
            }
            if (!(isNumber(exit.spawnX) || exit.spawnX === "center")) {
                issues.push({ roomId: room.id, message: "Exit spawnX must be a number or 'center'." });
            }
            if (!isSpawnYToken(exit.spawnY)) {
                issues.push({ roomId: room.id, message: `Exit spawnY '${String(exit.spawnY)}' is invalid.` });
            }
            const exitX = resolvePosition(exit.x, room.width);
            const exitY = resolvePosition(exit.y, room.height);
            if (exitX < 0 || exitX >= room.width || exitY < 0 || exitY >= room.height) {
                issues.push({ roomId: room.id, message: `Exit '${exit.targetRoom}' resolves out of room bounds.` });
            }
            const spawnX = typeof exit.spawnX === "number" ? exit.spawnX : Math.floor(room.width / 2);
            const spawnY = resolveSpawnY(exit.spawnY, room.height);
            if (spawnX < 0 || spawnX >= room.width || spawnY < 0 || spawnY >= room.height) {
                issues.push({ roomId: room.id, message: `Exit spawn point for '${exit.targetRoom}' resolves out of room bounds.` });
            }
        }

        for (const placement of room.furniture ?? []) {
            const furniture = furnitureById[placement.furnitureId];
            if (!furniture) {
                issues.push({
                    roomId: room.id,
                    message: `Furniture '${placement.furnitureId}' is referenced but not defined.`
                });
                continue;
            }
            if (!(isNumber(placement.x) || placement.x === "center")) {
                issues.push({ roomId: room.id, message: `Furniture '${placement.furnitureId}' has invalid x token.` });
            }
            if (!isPositionToken(placement.y)) {
                issues.push({ roomId: room.id, message: `Furniture '${placement.furnitureId}' has invalid y token.` });
            }
            const x = typeof placement.x === "number" ? placement.x : Math.floor(room.width / 2);
            const y = resolvePosition(placement.y, room.height);
            if (x < 0 || x >= room.width || y < 0 || y >= room.height) {
                issues.push({
                    roomId: room.id,
                    message: `Furniture '${placement.furnitureId}' placement resolves out of room bounds.`
                });
            }
            if (furniture.spriteName && !VALID_SPRITES.has(furniture.spriteName)) {
                issues.push({
                    roomId: room.id,
                    message: `Furniture '${placement.furnitureId}' references unknown sprite '${furniture.spriteName}'.`
                });
            }
        }

        for (const placement of room.npcs ?? []) {
            const npc = npcsById[placement.npcId];
            if (!npc) {
                issues.push({ roomId: room.id, message: `NPC '${placement.npcId}' is referenced but not defined.` });
            }
            if (!(isNumber(placement.x) || placement.x === "center")) {
                issues.push({ roomId: room.id, message: `NPC '${placement.npcId}' has invalid x token.` });
            }
            if (!isPositionToken(placement.y)) {
                issues.push({ roomId: room.id, message: `NPC '${placement.npcId}' has invalid y token.` });
            }
            const x = typeof placement.x === "number" ? placement.x : Math.floor(room.width / 2);
            const y = resolvePosition(placement.y, room.height);
            if (x < 0 || x >= room.width || y < 0 || y >= room.height) {
                issues.push({
                    roomId: room.id,
                    message: `NPC '${placement.npcId}' placement resolves out of room bounds.`
                });
            }
            if (npc?.spriteName && !VALID_SPRITES.has(npc.spriteName)) {
                issues.push({
                    roomId: room.id,
                    message: `NPC '${placement.npcId}' references unknown sprite '${npc.spriteName}'.`
                });
            }
        }
    }

    return issues;
}
