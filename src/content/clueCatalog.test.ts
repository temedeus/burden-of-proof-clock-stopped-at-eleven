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
    it("uses clue-specific inventory icons", () => {
        expect(resolveClueIconSprite("torn_appointment_note")).toBe("clue_torn_note");
        expect(resolveClueIconSprite("murder_weapon")).toBe("clue_murder_weapon");
        expect(resolveClueIconSprite("rusty_old_key")).toBe("rusty_old_key");
    });

    it("falls back to generic icon for unknown clues", () => {
        expect(resolveClueIconSprite("unknown")).toBe("clue_generic");
    });
});
