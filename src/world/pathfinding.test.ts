import { describe, expect, it } from "vitest";
import { NPC } from "../entities/NPC";
import { TILE_SIZE } from "./constants";
import { ChaseField, feetBlocked, hasClearPath } from "./pathfinding";
import { TileMap } from "./TileMap";
import { TILE_FLOOR, TILE_FURNITURE, TILE_WALL } from "./TileTypes";

const BOX = TILE_SIZE * 2;

/** `#` wall, `F` furniture, `.` floor. */
function mapFrom(rows: string[]): TileMap {
    const tiles = rows.flatMap((row) =>
        [...row].map((c) => (c === "#" ? TILE_WALL : c === "F" ? TILE_FURNITURE : TILE_FLOOR))
    );
    return new TileMap(rows[0].length, rows.length, tiles);
}

// A long table splits the room; the only way round is the gap on the right.
const ROOM = [
    "################",
    "#..............#",
    "#..............#",
    "#..............#",
    "#FFFFFFFFFFF...#",
    "#..............#",
    "#..............#",
    "#..............#",
    "################"
];

/** Runs a chaser until it overlaps the target box or time runs out; returns seconds taken. */
function chase(map: TileMap, npc: NPC, goal: { x: number; y: number }, field?: ChaseField): number {
    const dt = 1 / 60;
    for (let t = 0; t < 20; t += dt) {
        field?.update(dt, map, goal.x, goal.y, BOX, BOX);
        npc.updateChase(dt, goal.x + BOX / 2, goal.y + BOX / 2, map, field);
        expect(npc.wouldCollideAt(npc.x, npc.y, map)).toBe(false);
        if (Math.abs(npc.x - goal.x) < BOX && Math.abs(npc.y - goal.y) < BOX / 2) return t;
    }
    return Infinity;
}

function chaser(x: number, y: number): NPC {
    const npc = new NPC("cook", x, y, "Chef Ytte");
    npc.setChasing(true);
    npc.setChaseSpeed(120);
    return npc;
}

describe("pathfinding", () => {
    it("blocks on the feet row only", () => {
        const map = mapFrom(ROOM);
        // Head over the table row, feet on the floor below it
        expect(feetBlocked(map, TILE_SIZE * 2, TILE_SIZE * 4, BOX, BOX)).toBe(false);
        // Feet on the table row
        expect(feetBlocked(map, TILE_SIZE * 2, TILE_SIZE * 3, BOX, BOX)).toBe(true);
    });

    it("sees no straight line through the table", () => {
        const map = mapFrom(ROOM);
        expect(hasClearPath(map, TILE_SIZE * 2, TILE_SIZE, TILE_SIZE * 2, TILE_SIZE * 6, BOX, BOX)).toBe(false);
        expect(hasClearPath(map, TILE_SIZE * 2, TILE_SIZE, TILE_SIZE * 9, TILE_SIZE, BOX, BOX)).toBe(true);
    });

    it("walks straight at the target when nothing is in the way", () => {
        const map = mapFrom(ROOM);
        const field = new ChaseField();
        field.update(0, map, TILE_SIZE * 10, TILE_SIZE, BOX, BOX);
        expect(field.steer(TILE_SIZE * 2, TILE_SIZE)).toEqual({ x: TILE_SIZE * 10, y: TILE_SIZE });
    });

    it("routes around the table where a straight-line chaser gets stuck", () => {
        const map = mapFrom(ROOM);
        const goal = { x: TILE_SIZE * 2, y: TILE_SIZE * 6 };

        expect(chase(map, chaser(TILE_SIZE * 2, TILE_SIZE), goal)).toBe(Infinity);
        expect(chase(map, chaser(TILE_SIZE * 2, TILE_SIZE), goal, new ChaseField())).toBeLessThan(6);
    });

    it("re-routes after the target moves (immediately on hard)", () => {
        const map = mapFrom(ROOM);
        const field = new ChaseField(0);
        field.update(0, map, TILE_SIZE * 2, TILE_SIZE * 6, BOX, BOX);
        const before = field.steer(TILE_SIZE * 2, TILE_SIZE);
        // Target hops back over to the chaser's side: walk straight there
        field.update(0, map, TILE_SIZE * 8, TILE_SIZE, BOX, BOX);
        expect(field.steer(TILE_SIZE * 2, TILE_SIZE)).toEqual({ x: TILE_SIZE * 8, y: TILE_SIZE });
        expect(before).not.toEqual({ x: TILE_SIZE * 8, y: TILE_SIZE });
    });

    it("walks out when wedged inside furniture", () => {
        const map = mapFrom(ROOM);
        const npc = chaser(TILE_SIZE * 4, TILE_SIZE * 3);
        expect(npc.wouldCollideAt(npc.x, npc.y, map)).toBe(true);
        const field = new ChaseField();
        const goal = { x: TILE_SIZE * 4, y: TILE_SIZE * 6 };
        for (let i = 0; i < 120 && npc.wouldCollideAt(npc.x, npc.y, map); i++) {
            field.update(1 / 60, map, goal.x, goal.y, BOX, BOX);
            npc.updateChase(1 / 60, goal.x + BOX / 2, goal.y + BOX / 2, map, field);
        }
        expect(npc.wouldCollideAt(npc.x, npc.y, map)).toBe(false);
    });
});
