export interface Interactable {
    id: string;
    name: string;
    description: string;
    tiles: { x: number; y: number }[];
    clues?: string[];
    /** When set, Game renders this sprite (garden / exterior / interior atlases) instead of id-based mapping */
    spriteName?: string;
    /** Optional render size in tiles (defaults to collision footprint from tiles) */
    drawWidthTiles?: number;
    drawHeightTiles?: number;
    /** Where the collision footprint sits relative to the drawn sprite */
    renderAnchor?: "center" | "bottom";
}
