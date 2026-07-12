import type { RenderAnchor } from "@cse/content-schema";

export interface CollectibleClue {
    clueId: string;
    requiresClues: string[];
    blockedHint: string;
    hint: string;
}

export interface Interactable {
    id: string;
    name: string;
    description: string;
    /** Tiles that block movement (written to the map as solid furniture). */
    tiles: { x: number; y: number }[];
    /** Full placement footprint (width×height); used for sprite anchoring. */
    footprintTiles?: { x: number; y: number }[];
    /** Tiles the player can target to examine or collect clues (union of all facing strips). */
    interactionTiles?: { x: number; y: number }[];
    /** Examine tiles per player facing direction. */
    interactionTilesByFacing?: Partial<
        Record<"up" | "down" | "left" | "right", { x: number; y: number }[]>
    >;
    clues?: string[];
    /** Story-assigned clues with prerequisite metadata (preferred over bare clues[]). */
    collectibleClues?: CollectibleClue[];
    /** When set, Game renders this sprite (garden / exterior / interior atlases) instead of id-based mapping */
    spriteName?: string;
    /** Optional render size in tiles (defaults to collision footprint from tiles) */
    drawWidthTiles?: number;
    drawHeightTiles?: number;
    drawOffsetXPx?: number;
    drawOffsetYPx?: number;
    /** Where the collision footprint sits relative to the drawn sprite */
    renderAnchor?: RenderAnchor;
    /** Floor decal: no blocking; drawn beneath NPCs/player (see Game render pass). */
    walkableDecor?: boolean;
    /** Depth-sorted decor with no blocking tiles (e.g. overhead roof timbers). */
    noCollision?: boolean;
    /** Drawn above player/NPCs (e.g. roof cross-beams). */
    overheadDecor?: boolean;
    /** No examine prompt or clue pickup. */
    nonInteractive?: boolean;
    /** Wall sconce orientation (oil lamps). */
    wallSide?: "north" | "south" | "east" | "west";
    /** Flush against north or south wall when rendering (fireplace, stairs). */
    wallAlign?: "north" | "south";
    /** When set, interaction shows a yes/no confirmation instead of immediate examine. */
    interactionType?: "confirm";
    confirmId?: string;
    confirmPrompt?: string;
    /** All listed clues must be discovered before the confirm prompt is offered. */
    confirmRequiresClues?: string[];
    /** Examine text when confirmRequiresClues are not yet satisfied. */
    blockedConfirmHint?: string;
    /** When set, finding this clue id replaces the confirm prompt with a plain examine. */
    confirmGrantsClueId?: string;
    interactionSound?: string;
    footstepSound?: string;
    /** Walkable footprint used only for footstep sounds; nothing is drawn. */
    footstepOnlyDecor?: boolean;
}
