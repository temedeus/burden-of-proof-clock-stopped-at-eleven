import { describe, expect, it } from "vitest";
import { loadGameContent } from "../content/loadGameContent";
import { NPC } from "../entities/NPC";
import { TILE_SIZE } from "./constants";
import { ChaseField, feetBlocked } from "./pathfinding";
import { createRoomFromConfig } from "./Rooms";

const BOX = TILE_SIZE * 2;

/** Deterministic PRNG so failures reproduce. */
function rng(seed: number): () => number {
    return () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 2 ** 32;
    };
}

describe("chase pathfinding in real rooms", () => {
    const content = loadGameContent();
    for (const [id, config] of Object.entries(content.rooms)) {
        it(`reaches the player anywhere reachable in ${id}`, () => {
            const room = createRoomFromConfig(config);
            const map = room.map;
            const open: { x: number; y: number }[] = [];
            for (let ty = 0; ty < map.height; ty++) {
                for (let tx = 0; tx < map.width; tx++) {
                    if (!feetBlocked(map, tx * TILE_SIZE, ty * TILE_SIZE, BOX, BOX)) {
                        open.push({ x: tx * TILE_SIZE, y: ty * TILE_SIZE });
                    }
                }
            }
            expect(open.length).toBeGreaterThan(0);
            const rand = rng(id.length * 7919);
            const failures: string[] = [];
            for (let trial = 0; trial < 40; trial++) {
                const from = open[Math.floor(rand() * open.length)];
                const goal = open[Math.floor(rand() * open.length)];
                const field = new ChaseField();
                field.update(0, map, goal.x, goal.y, BOX, BOX);
                // Skip pairs in disconnected pockets of the room
                if (!field.reaches(from.x, from.y)) continue;
                const npc = new NPC("cook", from.x, from.y, "Chef Ytte");
                npc.setChasing(true);
                npc.setChaseSpeed(120);
                let reached = false;
                let stillFor = 0;
                for (let t = 0; t < 25 && !reached; t += 1 / 60) {
                    const px = npc.x;
                    const py = npc.y;
                    field.update(1 / 60, map, goal.x, goal.y, BOX, BOX);
                    npc.updateChase(1 / 60, goal.x + BOX / 2, goal.y + BOX / 2, map, field);
                    reached = Math.abs(npc.x - goal.x) < 4 && Math.abs(npc.y - goal.y) < 4;
                    stillFor = npc.x === px && npc.y === py ? stillFor + 1 / 60 : 0;
                    if (stillFor > 0.5) break;
                }
                if (!reached) {
                    failures.push(`(${from.x / 32},${from.y / 32}) -> (${goal.x / 32},${goal.y / 32}) stuck at (${(npc.x / 32).toFixed(2)},${(npc.y / 32).toFixed(2)})`);
                }
            }
            expect(failures).toEqual([]);
        });
    }
});

