import { describe, expect, it } from "vitest";
import { resolveActiveStory } from "../content/loadStoryContent";
import { cluesForRetry, SCENE_IDS, scenesTriggeredBy, type SceneId, type SceneTriggers } from "./scriptedScenes";

describe("scriptedScenes", () => {
    const triggers: SceneTriggers = resolveActiveStory()!.casePacket.sceneTriggers ?? {};

    it("the active story triggers every scene with one of its clues", () => {
        const clueIds = new Set(resolveActiveStory()!.casePacket.generatedClues.map((c) => c.id));
        for (const id of SCENE_IDS) expect(clueIds).toContain(triggers[id]);
    });

    it.each(SCENE_IDS.map((id) => [id, triggers[id]!] as const))(
        "%s: an unfinished scene's trigger clue is dropped so it replays; kept once finished",
        (id, clue) => {
            const held = ["examined_body", clue];
            expect(cluesForRetry(triggers, held, new Set())).toEqual(["examined_body"]);
            expect(cluesForRetry(triggers, held, new Set<SceneId>([id]))).toEqual(held);
            expect(scenesTriggeredBy(triggers, [clue])).toEqual([id]);
        }
    );

    it("a scene without a trigger never starts and never holds clues back", () => {
        const partial: SceneTriggers = { confrontation: "murder_weapon" };
        expect(scenesTriggeredBy(partial, ["burned_ledger_page"])).toEqual([]);
        expect(cluesForRetry(partial, ["burned_ledger_page"], new Set())).toEqual(["burned_ledger_page"]);
    });
});
