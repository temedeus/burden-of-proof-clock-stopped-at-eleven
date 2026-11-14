import { describe, expect, it } from "vitest";
import type { ScriptedSceneId } from "@cse/content-schema";
import { loadGameContent } from "./loadGameContent";
import { applyStoryDialogOverrides, resolveActiveStory } from "./loadStoryContent";
import { getRequiredClueIds } from "./applyStoryToGame";
import { ClueSystem } from "../systems/ClueSystem";
import { DialogSystem } from "../systems/DialogSystem";

/**
 * Mid-game reactions to the dining fire, attic scare and late evidence (active.json `requiresScenes` lines).
 * Asserts WHICH dialog condition wins (identified by its trigger), never the wording,
 * so rewriting lines in active.json doesn't break these tests; only rewiring does.
 */
describe("active story event dialog", () => {
    const content = loadGameContent();
    const story = resolveActiveStory()!.casePacket;
    const dialogs = applyStoryDialogOverrides(
        Object.fromEntries(Object.entries(content.npcs).map(([id, npc]) => [id, npc.dialog])),
        story
    );
    const chain = getRequiredClueIds(story);

    /** What `npcId` says holding every chain clue up to `lastClue`, with `scenes` finished. */
    function say(npcId: string, lastClue: string | null, scenes: ScriptedSceneId[] = []): string {
        const clues = new ClueSystem();
        for (const id of lastClue ? chain.slice(0, chain.indexOf(lastClue) + 1) : []) clues.addClue(id);
        return new DialogSystem(clues, (id) => scenes.includes(id)).getDialog(dialogs[npcId]);
    }

    /** Trigger of the condition that wins, e.g. `clue:bloody_apron`, `scenes:ledger_scare`, or `default`. */
    function winner(npcId: string, lastClue: string | null, scenes: ScriptedSceneId[] = []): string {
        const line = say(npcId, lastClue, scenes);
        const cfg = dialogs[npcId];
        const hit = (cfg.conditions ?? []).find((c) => c.dialog === line);
        if (!hit) {
            if (line !== cfg.default) throw new Error(`${npcId}: line matches no condition or default`);
            return "default";
        }
        const clues = [...(hit.requiresClue ? [hit.requiresClue] : []), ...(hit.requiresClues ?? [])];
        const last = clues.sort((x, y) => chain.indexOf(x) - chain.indexOf(y)).pop();
        return [last && `clue:${last}`, hit.requiresScenes?.length && `scenes:${hit.requiresScenes.join("+")}`]
            .filter(Boolean)
            .join(" ");
    }


    const fire: ScriptedSceneId[] = ["ledger_scare"];
    const fireAndAttic: ScriptedSceneId[] = ["ledger_scare", "attic_scare"];
    const FIRE = "scenes:ledger_scare";
    const ATTIC = "scenes:ledger_scare+attic_scare";

    it("Ytte explains the rescue after the fire, the bandages after the attic, then panics from the apron on", () => {
        expect(winner("cook", "burned_ledger_page", fire)).toBe(FIRE);
        expect(winner("cook", "manor_floor_plans", fireAndAttic)).toBe(ATTIC);
        expect(winner("cook", "bloody_apron", fireAndAttic)).toBe("clue:bloody_apron");
    });

    it("points baroness, maid, and butler to restless horses after smuggling papers", () => {
        for (const npcId of ["baroness", "maid", "butler"]) {
            expect(winner(npcId, "smuggling_documents", fireAndAttic), npcId).toBe("clue:smuggling_documents");
        }
    });

    it("prefers later evidence over fire acknowledgment", () => {
        expect(winner("baroness", "bloody_apron", fireAndAttic)).toBe("clue:bloody_apron");
    });

    it("gives Walsh mid-game dining and attic beats, then the confront line with the full set", () => {
        expect(winner("police", "burned_ledger_page", fire)).toBe(FIRE);
        expect(winner("police", "manor_floor_plans", fireAndAttic)).toBe("scenes:attic_scare");
        expect(winner("police", "murder_weapon", fireAndAttic)).toBe("clue:murder_weapon");
    });

    it("updates butler, reed, and stable boy after the fire", () => {
        for (const npcId of ["butler", "police2", "worker_boy"]) {
            expect(winner(npcId, "burned_ledger_page", fire), npcId).toBe(FIRE);
        }
        expect(winner("worker_boy", "manor_floor_plans", fireAndAttic)).toBe("scenes:attic_scare");
    });

    it("keeps the stable boy's evidence tips over his scare chatter", () => {
        expect(winner("worker_boy", "bloody_apron", fireAndAttic)).toBe("clue:bloody_apron");
    });

    it("keeps the early-game lines before any scene", () => {
        expect(say("police2", null)).toBe(content.npcs.police2.dialog.default);
        expect(winner("baroness", "maid_statement")).toBe("clue:maid_statement");
    });
});
