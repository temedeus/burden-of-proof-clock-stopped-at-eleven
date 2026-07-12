import { describe, expect, it } from "vitest";
import { buildClueCatalog, getInventoryClueIds } from "./clueCatalog";
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
