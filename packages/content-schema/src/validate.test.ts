import { describe, expect, it } from "vitest";
import type { NPCConfig } from "./npcs";
import type { RoomConfig } from "./rooms";
import { validateRooms } from "./validate";

const butler: NPCConfig = {
    id: "butler",
    name: "Butler",
    role: "staff",
    spriteName: "maid",
    dialog: { default: "Good evening." }
};

const table = {
    id: "table",
    name: "Table",
    description: "Table",
    width: 2,
    height: 2,
    spriteName: "table"
};

function room(overrides: Partial<RoomConfig> & Pick<RoomConfig, "id">): RoomConfig {
    return {
        width: 10,
        height: 10,
        furniture: [],
        exits: [],
        npcs: [],
        ...overrides
    };
}

describe("validateRooms", () => {
    it("passes for a minimal valid room graph", () => {
        const library = room({
            id: "library",
            npcs: [{ npcId: "butler", x: 5, y: 5 }]
        });
        const issues = validateRooms([library], { table }, { butler });
        expect(issues).toEqual([]);
    });

    it("flags exit targetRoom that does not exist", () => {
        const r = room({
            id: "hall",
            exits: [
                {
                    x: "center",
                    y: "bottom",
                    targetRoom: "missing",
                    spawnX: "center",
                    spawnY: 2
                }
            ],
            npcs: [{ npcId: "butler", x: 5, y: 5 }]
        });
        const issues = validateRooms([r], { table }, { butler });
        expect(issues.some((i) => i.message.includes("missing"))).toBe(true);
    });

    it("flags NPC placed more than once globally", () => {
        const a = room({ id: "a", npcs: [{ npcId: "butler", x: 3, y: 3 }] });
        const b = room({ id: "b", npcs: [{ npcId: "butler", x: 4, y: 4 }] });
        const issues = validateRooms([a, b], { table }, { butler });
        expect(issues.some((i) => i.roomId === "global" && i.message.includes("2 times"))).toBe(true);
    });

    it("flags NPC not placed in any room", () => {
        const r = room({ id: "empty" });
        const issues = validateRooms([r], { table }, { butler });
        expect(issues.some((i) => i.roomId === "global" && i.message.includes("butler"))).toBe(true);
    });

    it("flags unknown furniture sprite names", () => {
        const badTable = { ...table, spriteName: "not_a_real_sprite" };
        const r = room({
            id: "room",
            furniture: [{ furnitureId: "table", x: 2, y: 2, anchor: "top-left" }],
            npcs: [{ npcId: "butler", x: 5, y: 5 }]
        });
        const issues = validateRooms([r], { table: badTable }, { butler });
        expect(issues.some((i) => i.message.includes("unknown sprite"))).toBe(true);
    });

    it("validates NPC placement using inset tile coordinates", () => {
        const r = room({
            id: "room",
            height: 5,
            npcs: [{ npcId: "butler", x: "center", y: "bottom" }]
        });
        const issues = validateRooms([r], { table }, { butler });
        expect(issues.filter((i) => i.message.includes("out of room bounds"))).toEqual([]);
    });

    it("flags NPC placement outside room when y token resolves out of bounds", () => {
        const r = room({
            id: "room",
            height: 2,
            npcs: [{ npcId: "butler", x: 0, y: 5 }]
        });
        const issues = validateRooms([r], { table }, { butler });
        expect(issues.some((i) => i.message.includes("out of room bounds"))).toBe(true);
    });
});
