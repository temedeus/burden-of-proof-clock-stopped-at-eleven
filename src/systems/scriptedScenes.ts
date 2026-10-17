/**
 * Scripted scenes that start when the detective picks up a clue.
 *
 * The save records which scenes have finished (`completedScenes`). Picking up the
 * trigger clue autosaves before the scene plays, so a save can hold the clue while
 * its scene never finished (died, quit or crashed mid-scene). On load, such a clue
 * is dropped so picking it up again replays the scene.
 */

export interface ScriptedSceneDef {
    id: string;
    /** Collecting this clue starts the scene. */
    triggerClue: string;
}

export const SCRIPTED_SCENES = [
    /** Hooded attacker in the dining room, ending in the fireplace fire. */
    { id: "ledger_scare", triggerClue: "burned_ledger_page" },
    /** Hooded attacker in the attic, ending at the window. */
    { id: "attic_scare", triggerClue: "manor_floor_plans" },
    /** Ytte's wine-cellar confession, leading into the finale chase. */
    { id: "confrontation", triggerClue: "murder_weapon" }
] as const satisfies readonly ScriptedSceneDef[];

export type SceneId = (typeof SCRIPTED_SCENES)[number]["id"];

const SCENE_IDS = new Set<string>(SCRIPTED_SCENES.map((s) => s.id));

export function isSceneId(id: unknown): id is SceneId {
    return typeof id === "string" && SCENE_IDS.has(id);
}

/** Scenes whose trigger clue is among `clueIds`. */
export function scenesTriggeredBy(clueIds: readonly string[]): SceneId[] {
    return SCRIPTED_SCENES.filter((s) => clueIds.includes(s.triggerClue)).map((s) => s.id);
}

/** Drop trigger clues of unfinished scenes so collecting them replays the scene. */
export function cluesForRetry(clueIds: readonly string[], completed: ReadonlySet<SceneId>): string[] {
    const pending = new Set<string>(
        SCRIPTED_SCENES.filter((s) => !completed.has(s.id)).map((s) => s.triggerClue)
    );
    return clueIds.filter((id) => !pending.has(id));
}
