export interface DialogCondition {
    requiresClue?: string;
    dialog: string;
}

export interface NPCDialogConfig {
    default: string;
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
    /** Floor body / rug-like NPC: player walks over, drawn beneath actors. */
    walkable?: boolean;
    /** Footstep variant when walking over this walkable NPC (e.g. `squish`). */
    footstepSound?: string;
    dialog: NPCDialogConfig;
}
