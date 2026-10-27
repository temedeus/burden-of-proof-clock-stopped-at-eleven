import { SCRIPTED_SCENE_IDS, type ScriptedSceneId } from "@cse/content-schema";

/**
 * Scripted scenes that start when the detective picks up a clue.
 * The story picks each scene's trigger clue (`sceneTriggers` in the story JSON).
 *
 * The save records which scenes have finished (`completedScenes`). Picking up the
 * trigger clue autosaves before the scene plays, so a save can hold the clue while
 * its scene never finished (died, quit or crashed mid-scene). On load, such a clue
 * is dropped so picking it up again replays the scene.
 */

export type SceneId = ScriptedSceneId;

/** Trigger clue per scene; a scene without one never plays. */
export type SceneTriggers = Partial<Record<SceneId, string>>;

export const SCENE_IDS: readonly SceneId[] = SCRIPTED_SCENE_IDS;

const SCENE_ID_SET = new Set<string>(SCENE_IDS);

export function isSceneId(id: unknown): id is SceneId {
    return typeof id === "string" && SCENE_ID_SET.has(id);
}

/** Scenes whose trigger clue is among `clueIds`. */
export function scenesTriggeredBy(triggers: SceneTriggers, clueIds: readonly string[]): SceneId[] {
    return SCENE_IDS.filter((id) => {
        const clue = triggers[id];
        return clue != null && clueIds.includes(clue);
    });
}

/** Drop trigger clues of unfinished scenes so collecting them replays the scene. */
export function cluesForRetry(
    triggers: SceneTriggers,
    clueIds: readonly string[],
    completed: ReadonlySet<SceneId>
): string[] {
    const pending = new Set<string>();
    for (const id of SCENE_IDS) {
        const clue = triggers[id];
        if (clue != null && !completed.has(id)) pending.add(clue);
    }
    return clueIds.filter((id) => !pending.has(id));
}
