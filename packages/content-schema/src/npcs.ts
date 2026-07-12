export interface DialogCondition {
    /** @deprecated Prefer requiresClues */
    requiresClue?: string;
    /** All listed clues must be discovered for this line to be chosen. */
    requiresClues?: string[];
    dialog: string;
}

export interface NPCDialogConfig {
    default: string;
    /** All listed clues must be discovered before default dialog is shown. */
    requiresClues?: string[];
    /** Shown when requiresClues gate is not satisfied (dialog mode only). */
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
