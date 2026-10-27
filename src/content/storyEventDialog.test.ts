import { describe, expect, it } from "vitest";
import type { ScriptedSceneId } from "@cse/content-schema";
import { loadGameContent } from "./loadGameContent";
import { applyStoryDialogOverrides, resolveActiveStory } from "./loadStoryContent";
import { getRequiredClueIds } from "./applyStoryToGame";
import { ClueSystem } from "../systems/ClueSystem";
import { DialogSystem } from "../systems/DialogSystem";

/** Mid-game reactions to the dining fire, attic scare and late evidence (active.json `requiresScenes` lines). */
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

    const fire: ScriptedSceneId[] = ["ledger_scare"];
    const fireAndAttic: ScriptedSceneId[] = ["ledger_scare", "attic_scare"];

    it("Ytte explains the rescue after the fire, the bandages after the attic, then panics from the apron on", () => {
        expect(say("cook", "burned_ledger_page", fire)).toMatch(/^You: Why did you help me/);
        expect(say("cook", "manor_floor_plans", fireAndAttic)).toMatch(/tumble down the attic stairs/);
        expect(say("cook", "bloody_apron", fireAndAttic)).toMatch(/apron isn't mine/);
    });

    it("points baroness, maid, and thompson to restless horses after smuggling papers", () => {
        for (const npcId of ["baroness", "maid", "butler"]) {
            expect(say(npcId, "smuggling_documents", fireAndAttic), npcId).toMatch(/horses/i);
        }
    });

    it("prefers later evidence over fire acknowledgment", () => {
        expect(say("baroness", "bloody_apron", fireAndAttic)).toMatch(/apron/i);
    });

    it("gives Walsh mid-game dining and attic beats, then the confront line with the full set", () => {
        expect(say("police", "burned_ledger_page", fire)).toMatch(/dining room/i);
        expect(say("police", "manor_floor_plans", fireAndAttic)).toMatch(/attic/i);
        expect(say("police", "murder_weapon", fireAndAttic)).toMatch(/You have the evidence/);
    });

    it("updates butler, reed, and stable boy after the fire", () => {
        expect(say("butler", "burned_ledger_page", fire)).toMatch(/dining room/i);
        expect(say("police2", "burned_ledger_page", fire)).toMatch(/dining room/i);
        expect(say("worker_boy", "burned_ledger_page", fire)).toMatch(/dining room/i);
        expect(say("worker_boy", "manor_floor_plans", fireAndAttic)).toMatch(/attic/i);
    });

    it("keeps the stable boy's evidence tips over his scare chatter", () => {
        expect(say("worker_boy", "bloody_apron", fireAndAttic)).toMatch(/Ytte came through here/);
    });

    it("keeps the early-game lines before any scene", () => {
        expect(say("police2", null)).toBe(content.npcs.police2.dialog.default);
        expect(say("baroness", "maid_statement")).toMatch(/Poor Mrs. Clarke/);
    });
});
