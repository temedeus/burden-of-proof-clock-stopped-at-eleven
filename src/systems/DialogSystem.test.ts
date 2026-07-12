import { describe, expect, it } from "vitest";
import { DialogSystem } from "./DialogSystem";
import { ClueSystem } from "./ClueSystem";
import type { NPCDialogConfig } from "@cse/content-schema";

describe("DialogSystem", () => {
    it("returns blockedDialog when gate clues are missing", () => {
        const clues = new ClueSystem();
        const dialog = new DialogSystem(clues);
        const config: NPCDialogConfig = {
            default: "Tell me everything.",
            requiresClues: ["key_clue"],
            blockedDialog: "Come back when you have evidence."
        };
        expect(dialog.getDialog(config)).toBe("Come back when you have evidence.");
        clues.addClue("key_clue");
        expect(dialog.getDialog(config)).toBe("Tell me everything.");
    });

    it("supports requiresClues on conditions", () => {
        const clues = new ClueSystem();
        const dialog = new DialogSystem(clues);
        const config: NPCDialogConfig = {
            default: "Hello.",
            conditions: [
                {
                    requiresClues: ["a", "b"],
                    dialog: "Advanced line."
                },
                {
                    requiresClue: "a",
                    dialog: "Partial line."
                }
            ]
        };
        expect(dialog.getDialog(config)).toBe("Hello.");
        clues.addClue("a");
        expect(dialog.getDialog(config)).toBe("Partial line.");
        clues.addClue("b");
        expect(dialog.getDialog(config)).toBe("Advanced line.");
    });

    it("prefers conditions with more required clues", () => {
        const clues = new ClueSystem();
        const dialog = new DialogSystem(clues);
        clues.addClue("a");
        clues.addClue("b");
        clues.addClue("c");
        const config: NPCDialogConfig = {
            default: "Default.",
            conditions: [
                { requiresClue: "a", dialog: "Early line." },
                { requiresClues: ["a", "b", "c"], dialog: "Late line." }
            ]
        };
        expect(dialog.getDialog(config)).toBe("Late line.");
    });
});
