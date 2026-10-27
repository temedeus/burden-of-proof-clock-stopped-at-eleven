import type { ScriptedSceneId } from "./story";

/**
 * A conditional line. Conditions are checked in listed order and the first one
 * whose requirements are all met is spoken, so list later-game lines first.
 */
export interface DialogCondition {
    /** @deprecated Prefer requiresClues */
    requiresClue?: string;
    /** All listed clues must be discovered for this line to be chosen. */
    requiresClues?: string[];
    /** All listed scripted scenes must have finished (e.g. `ledger_scare` = the dining fire). */
    requiresScenes?: ScriptedSceneId[];
    /**
     * The NPC's name is prepended; start with `You: ` to have the detective speak first,
     * or with the NPC's own name for narration about them (no prefix, no voice).
     */
    dialog: string;
}

export interface NPCDialogConfig {
    default: string;
    /** All listed clues must be discovered before default dialog is shown. */
    requiresClues?: string[];
    /** Shown when requiresClues gate is not satisfied (dialog mode only). Same prefix rules as `dialog`. */
    blockedDialog?: string;
    conditions?: DialogCondition[];
}

export interface NPCConfig {
    id: string;
    name: string;
    role?: string;
    spriteName?: string;
    /** When "examine", interaction shows dialog text as a description (no speaker prefix). */
    interactionMode?: "dialog" | "examine";
    /** When false, the name label is not drawn above the sprite. */
    showNameLabel?: boolean;
    /** When set with interactionMode \"examine\", grants this clue on first examine. */
    examineClueId?: string;
    /** When set with interactionMode \"dialog\", grants this clue on first successful dialog (after requiresClues gate). */
    dialogClueId?: string;
    /** Floor body / rug-like NPC: player walks over, drawn beneath actors. */
    walkable?: boolean;
    /** Footstep variant when walking over this walkable NPC (e.g. `squish`). */
    footstepSound?: string;
    dialog: NPCDialogConfig;
}
