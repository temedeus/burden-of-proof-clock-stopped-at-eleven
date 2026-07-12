import { describe, expect, it } from "vitest";
import {
    detectClueDependencyCycles,
    getMissingPrerequisites,
    hasAllPrerequisites,
    mergeRequiredClueIds,
    resolveBlockedHint,
    resolveClueRequirements
} from "./cluePrerequisites";
import type { ClueAssignment, GeneratedClue } from "./story";

describe("cluePrerequisites", () => {
    it("merges requiresClue and requiresClues without duplicates", () => {
        expect(mergeRequiredClueIds("a", ["b", "a"])).toEqual(["b", "a"]);
    });

    it("resolves requirements from clue and assignment", () => {
        const clues: GeneratedClue[] = [
            { id: "b", name: "B", description: "b", requiresClues: ["a"] },
            { id: "c", name: "C", description: "c" }
        ];
        const assignment: ClueAssignment = {
            clueId: "c",
            roomId: "library",
            hint: "hint",
            requiresClues: ["b"]
        };
        expect(resolveClueRequirements("c", clues, assignment)).toEqual(["b"]);
    });

    it("prefers assignment blocked hint over clue blocked hint", () => {
        const clues: GeneratedClue[] = [
            { id: "a", name: "A", description: "a", blockedHint: "from clue" }
        ];
        const assignment: ClueAssignment = {
            clueId: "a",
            roomId: "library",
            hint: "hint",
            blockedHint: "from assignment"
        };
        expect(resolveBlockedHint("a", clues, assignment)).toBe("from assignment");
    });

    it("reports missing prerequisites", () => {
        const has = new Set(["a"]);
        expect(getMissingPrerequisites(["a", "b"], (id) => has.has(id))).toEqual(["b"]);
        expect(hasAllPrerequisites(["a"], (id) => has.has(id))).toBe(true);
    });

    it("detects dependency cycles", () => {
        const clues: GeneratedClue[] = [
            { id: "a", name: "A", description: "a", requiresClues: ["b"] },
            { id: "b", name: "B", description: "b", requiresClues: ["a"] }
        ];
        const cycles = detectClueDependencyCycles(clues);
        expect(cycles.length).toBeGreaterThan(0);
        expect(cycles[0]).toContain("a");
    });
});
