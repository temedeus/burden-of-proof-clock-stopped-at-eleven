import { describe, expect, it } from "vitest";
import {
    getCollisionTileRange,
    isFurniturePlacementInBounds,
    resolveFurnitureOrigin,
    resolveNpcPlacementTile,
    resolvePosition,
    resolveSpawnY
} from "./placement";
import { validateRooms } from "./validate";
import type { RoomConfig } from "./rooms";

describe("resolvePosition", () => {
    it("resolves edge tokens", () => {
        expect(resolvePosition("top", 10)).toBe(0);
        expect(resolvePosition("bottom", 10)).toBe(9);
        expect(resolvePosition("center", 10)).toBe(5);
    });

    it("returns numeric values unchanged", () => {
        expect(resolvePosition(3, 10)).toBe(3);
    });
});

describe("resolveNpcPlacementTile", () => {
    it("insets NPCs one tile from walls", () => {
        expect(resolveNpcPlacementTile("top", 18)).toBe(1);
        expect(resolveNpcPlacementTile("bottom", 18)).toBe(16);
    });

    it("centers on the grid midpoint", () => {
        expect(resolveNpcPlacementTile("center", 18)).toBe(9);
    });
});

describe("resolveSpawnY", () => {
    it("resolves spawn tokens", () => {
        expect(resolveSpawnY("bottom-1", 18)).toBe(16);
        expect(resolveSpawnY("bottom-2", 18)).toBe(15);
        expect(resolveSpawnY("bottom-3", 18)).toBe(14);
        expect(resolveSpawnY("center", 18)).toBe(8);
        expect(resolveSpawnY(2, 18)).toBe(2);
    });
});

describe("resolveFurnitureOrigin", () => {
    it("offsets center-anchored placements by half the footprint", () => {
        const origin = resolveFurnitureOrigin(
            { furnitureId: "table", x: "center", y: "center", anchor: "center" },
            { width: 4, height: 2 },
            20,
            10
        );
        expect(origin).toEqual({ startX: 8, startY: 4 });
    });
});

describe("getCollisionTileRange", () => {
    it("uses bottom rows when collisionRowsFromBottom is set", () => {
        const range = getCollisionTileRange(5, 5, {
            width: 4,
            height: 4,
            collisionRowsFromBottom: 1
        });
        expect(range).toEqual({ startX: 5, endX: 9, startY: 8, endY: 9 });
    });

    it("uses top rows when collisionRowsFromTop is set", () => {
        const range = getCollisionTileRange(2, 3, {
            width: 3,
            height: 5,
            collisionRowsFromTop: 2
        });
        expect(range).toEqual({ startX: 2, endX: 5, startY: 3, endY: 5 });
    });

    it("centers a narrower collision width within the footprint", () => {
        const range = getCollisionTileRange(4, 6, {
            width: 4,
            height: 3,
            collisionWidth: 2
        });
        expect(range.startX).toBe(5);
        expect(range.endX).toBe(7);
    });
});

describe("isFurniturePlacementInBounds", () => {
    it("accepts furniture with collision inside the grid", () => {
        const ok = isFurniturePlacementInBounds(
            { furnitureId: "table", x: 5, y: 5, anchor: "top-left" },
            { width: 2, height: 2 },
            25,
            18
        );
        expect(ok).toBe(true);
    });

    it("accepts walkable decor when any tile is on interior floor", () => {
        const ok = isFurniturePlacementInBounds(
            { furnitureId: "carpet", x: 2, y: 2, anchor: "top-left" },
            { width: 3, height: 2, walkableDecor: true },
            10,
            10
        );
        expect(ok).toBe(true);
    });

    it("rejects furniture entirely outside the grid", () => {
        const ok = isFurniturePlacementInBounds(
            { furnitureId: "table", x: 20, y: 20, anchor: "top-left" },
            { width: 4, height: 4 },
            10,
            10
        );
        expect(ok).toBe(false);
    });
});

describe("validateRooms (smoke)", () => {
    it("flags missing furniture definitions", () => {
        const room: RoomConfig = {
            id: "test",
            width: 10,
            height: 10,
            furniture: [{ furnitureId: "missing", x: 2, y: 2, anchor: "top-left" }],
            exits: []
        };
        const issues = validateRooms(
            [room],
            {},
            { npc1: { id: "npc1", name: "N", role: "r", spriteName: "butler", dialog: { default: "Hi" } } }
        );
        expect(issues.some((i) => i.message.includes("missing"))).toBe(true);
    });
});
