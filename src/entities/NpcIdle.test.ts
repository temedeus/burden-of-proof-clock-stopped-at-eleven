import { describe, expect, it } from "vitest";
import { TILE_SIZE } from "../world/constants";
import { TileMap } from "../world/TileMap";
import { NPC } from "./NPC";
import { NpcIdle, WANDER_RADIUS } from "./NpcIdle";

const openMap = () => {
    const w = 20;
    const h = 20;
    const tiles = new Array(w * h).fill(0);
    return new TileMap(w, h, tiles);
};

/** Small seeded LCG so long runs are deterministic but varied. */
function seeded(seed: number): () => number {
    let x = seed;
    return () => {
        x = (x * 1664525 + 1013904223) % 4294967296;
        return x / 4294967296;
    };
}

/** Cycles through fixed rolls so the behaviour is deterministic. */
function rolls(...values: number[]): () => number {
    let i = 0;
    return () => values[i++ % values.length];
}

describe("NpcIdle", () => {
    it("strolls but never strays past the wander radius", () => {
        const map = openMap();
        const npc = new NPC("maid", 8 * TILE_SIZE, 8 * TILE_SIZE, "Maid", "staff", "maid");
        const idle = new NpcIdle(seeded(7));
        const startX = npc.x;
        const startY = npc.y;
        let moved = false;
        for (let t = 0; t < 120; t += 0.05) {
            idle.update(0.05, npc, map, []);
            if (npc.x !== startX || npc.y !== startY) moved = true;
            expect(Math.hypot(npc.x - startX, npc.y - startY)).toBeLessThanOrEqual(WANDER_RADIUS + 1);
        }
        expect(moved).toBe(true);
    });

    it("scratches when the roll says so, then returns to the authored facing", () => {
        const map = openMap();
        const npc = new NPC("butler", 8 * TILE_SIZE, 8 * TILE_SIZE, "Butler", "staff", "npc_male");
        npc.setFacing("down");
        // pause length, scratch roll, butt, turn away
        const idle = new NpcIdle(rolls(0, 0.01, 0.9, 0.1));
        idle.update(0.01, npc, map, []);
        idle.update(3, npc, map, []);
        expect(idle.pose).toMatch(/^scratch_butt_/);
        expect(npc.getFacing()).toBe("up");

        idle.update(2, npc, map, []);
        expect(idle.pose).toBeNull();
        expect(npc.getFacing()).toBe("down");
    });

    it("will not walk into the player", () => {
        const map = openMap();
        const npc = new NPC("maid", 8 * TILE_SIZE, 8 * TILE_SIZE, "Maid", "staff", "maid");
        const player = { x: npc.x + TILE_SIZE * 1.6, y: npc.y, width: TILE_SIZE * 2, height: TILE_SIZE * 2 };
        // Always pick the stroll heading straight right, toward the player
        const idle = new NpcIdle(rolls(0, 0.5, 0, 1));
        for (let t = 0; t < 10; t += 0.05) idle.update(0.05, npc, map, [player]);
        expect(Math.abs(npc.x + npc.width / 2 - (player.x + player.width / 2))).toBeGreaterThanOrEqual(TILE_SIZE * 1.5 - 1);
    });

    it("anchors to a new spot after being moved by a scene", () => {
        const map = openMap();
        const npc = new NPC("maid", 4 * TILE_SIZE, 4 * TILE_SIZE, "Maid", "staff", "maid");
        const idle = new NpcIdle(seeded(11));
        idle.update(0.05, npc, map, []);
        npc.x = 12 * TILE_SIZE;
        npc.y = 12 * TILE_SIZE;
        for (let t = 0; t < 60; t += 0.05) {
            idle.update(0.05, npc, map, []);
            expect(Math.hypot(npc.x - 12 * TILE_SIZE, npc.y - 12 * TILE_SIZE)).toBeLessThanOrEqual(WANDER_RADIUS + 1);
        }
    });
});
