import { describe, expect, it } from "vitest";
import { ClueSystem } from "./ClueSystem";
import type { GeneratedClue } from "@cse/content-schema";

describe("ClueSystem", () => {
    it("tracks discovered clues", () => {
        const system = new ClueSystem();
        expect(system.hasClue("a")).toBe(false);
        system.addClue("a");
        expect(system.hasClue("a")).toBe(true);
        expect(system.getAllClues()).toEqual(["a"]);
    });

    it("checks prerequisite chains before collection", () => {
        const system = new ClueSystem();
        const clues: GeneratedClue[] = [
            { id: "first", name: "First", description: "first" },
            { id: "second", name: "Second", description: "second", requiresClues: ["first"] }
        ];

        expect(system.canCollectClue("second", clues)).toBe(false);
        system.addClue("first");
        expect(system.canCollectClue("second", clues)).toBe(true);
        system.addClue("second");
        expect(system.canCollectClue("second", clues)).toBe(false);
    });
});
