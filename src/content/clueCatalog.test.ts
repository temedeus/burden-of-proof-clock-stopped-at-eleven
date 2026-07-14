import { describe, expect, it } from "vitest";
import { buildClueCatalog, getInventoryClueIds, resolveClueIconSprite } from "./clueCatalog";
import type { GeneratedClue } from "@cse/content-schema";

describe("clueCatalog inventory visibility", () => {
    it("omits hideFromInventory clues from inventory list", () => {
        const generated: GeneratedClue[] = [
            { id: "examined_body", name: "Body", description: "d", hideFromInventory: true },
            { id: "murder_weapon", name: "Knife", description: "d" }
        ];
        const catalog = buildClueCatalog(generated);
        const visible = getInventoryClueIds(
            ["examined_body", "murder_weapon"],
            catalog
        );
        expect(visible).toEqual(["murder_weapon"]);
    });
});

describe("resolveClueIconSprite", () => {
    const furniture = {
        reading_table: { id: "reading_table", spriteName: "reading_table" },
        hall_clock: { id: "hall_clock", spriteName: "hall_clock" }
    };
    const npcs = {
        maid: { id: "maid", name: "Maid", spriteName: "maid" }
    };

    it("uses furniture sprite from clue assignment", () => {
        const sprite = resolveClueIconSprite(
            "torn_appointment_note",
            [{ clueId: "torn_appointment_note", roomId: "library", furnitureId: "reading_table", hint: "" }],
            furniture,
            npcs
        );
        expect(sprite).toBe("reading_table");
    });

    it("uses npc sprite from clue assignment", () => {
        const sprite = resolveClueIconSprite(
            "maid_statement",
            [{ clueId: "maid_statement", roomId: "maid_room", npcId: "maid", hint: "" }],
            furniture,
            npcs
        );
        expect(sprite).toBe("maid");
    });

    it("falls back when assignment is missing", () => {
        expect(resolveClueIconSprite("unknown", [], furniture, npcs)).toBe("reading_table");
    });
});
