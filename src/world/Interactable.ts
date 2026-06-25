export interface Interactable {
    id: string;
    name: string;
    description: string;
    /** Tiles that block movement (written to the map as solid furniture). */
    tiles: { x: number; y: number }[];
    /** Tiles the player can target to examine or collect clues (may cover the full sprite). */
    interactionTiles?: { x: number; y: number }[];
    clues?: string[];
    /** When set, Game renders this sprite (garden / exterior / interior atlases) instead of id-based mapping */
    spriteName?: string;
    /** Optional render size in tiles (defaults to collision footprint from tiles) */
    drawWidthTiles?: number;
    drawHeightTiles?: number;
    /** Where the collision footprint sits relative to the drawn sprite */
    renderAnchor?: "center" | "bottom";
    /** Floor decal: no blocking; drawn beneath NPCs/player (see Game render pass). */
    walkableDecor?: boolean;
    /** When set, interaction shows a yes/no confirmation instead of immediate examine. */
    interactionType?: "confirm";
    confirmId?: string;
    confirmPrompt?: string;
}
