import { describe, expect, it } from "vitest";
import {
    isFurniturePlacementInBounds,
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
});

describe("resolveNpcPlacementTile", () => {
    it("insets NPCs one tile from walls", () => {
        expect(resolveNpcPlacementTile("top", 18)).toBe(1);
        expect(resolveNpcPlacementTile("bottom", 18)).toBe(16);
    });
});

describe("resolveSpawnY", () => {
    it("resolves spawn tokens", () => {
        expect(resolveSpawnY("bottom-2", 18)).toBe(15);
        expect(resolveSpawnY(2, 18)).toBe(2);
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
});

describe("validateRooms", () => {
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
