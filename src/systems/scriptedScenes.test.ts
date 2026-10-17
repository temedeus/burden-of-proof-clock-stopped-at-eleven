import { describe, expect, it } from "vitest";
import { resolveActiveStory } from "../content/loadStoryContent";
import { cluesForRetry, SCRIPTED_SCENES, scenesTriggeredBy, type SceneId } from "./scriptedScenes";

describe("scriptedScenes", () => {
    it("every trigger clue exists in the active story", () => {
        const clueIds = new Set(resolveActiveStory()!.casePacket.generatedClues.map((c) => c.id));
        for (const scene of SCRIPTED_SCENES) expect(clueIds).toContain(scene.triggerClue);
    });

    it.each(SCRIPTED_SCENES.map((s) => [s.id, s.triggerClue] as const))(
        "%s: an unfinished scene's trigger clue is dropped so it replays; kept once finished",
        (id, clue) => {
            const held = ["examined_body", clue];
            expect(cluesForRetry(held, new Set())).toEqual(["examined_body"]);
            expect(cluesForRetry(held, new Set<SceneId>([id]))).toEqual(held);
            expect(scenesTriggeredBy([clue])).toEqual([id]);
        }
    );
});
