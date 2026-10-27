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

    it("speaks the first listed condition that is met", () => {
        const clues = new ClueSystem();
        const dialog = new DialogSystem(clues);
        clues.addClue("a");
        clues.addClue("b");
        const config: NPCDialogConfig = {
            default: "Default.",
            conditions: [
                { requiresClues: ["c"], dialog: "Late line." },
                { requiresClue: "a", dialog: "Early line." },
                { requiresClues: ["a", "b"], dialog: "Never reached." }
            ]
        };
        expect(dialog.getDialog(config)).toBe("Early line.");
        clues.addClue("c");
        expect(dialog.getDialog(config)).toBe("Late line.");
    });

    it("gates conditions on finished scripted scenes", () => {
        const clues = new ClueSystem();
        const finished = new Set<string>();
        const dialog = new DialogSystem(clues, (id) => finished.has(id));
        const config: NPCDialogConfig = {
            default: "Default.",
            conditions: [
                { requiresScenes: ["ledger_scare", "attic_scare"], dialog: "After both." },
                { requiresScenes: ["ledger_scare"], dialog: "After the fire." }
            ]
        };
        expect(dialog.getDialog(config)).toBe("Default.");
        finished.add("ledger_scare");
        expect(dialog.getDialog(config)).toBe("After the fire.");
        finished.add("attic_scare");
        expect(dialog.getDialog(config)).toBe("After both.");
    });

    it("defaults to no scenes finished", () => {
        const config: NPCDialogConfig = {
            default: "Default.",
            conditions: [{ requiresScenes: ["confrontation"], dialog: "Later." }]
        };
        expect(new DialogSystem(new ClueSystem()).getDialog(config)).toBe("Default.");
    });
});
