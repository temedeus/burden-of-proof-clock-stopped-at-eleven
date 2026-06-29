import type { SpriteName } from "./sprites";

/** Tile strip on one side of the draw footprint used for examine when the player faces that direction. */
export interface InteractionFaceConfig {
    width: number;
    height: number;
    offsetX?: number;
    offsetY?: number;
}

export interface FurnitureConfig {
    id: string;
    name: string;
    description: string;
    width: number;
    height: number;
    clues?: string[];
    spriteName?: SpriteName | string;
    /** Draw size in tiles (optional; defaults to width×height). Collision uses width×height only. */
    drawWidth?: number;
    drawHeight?: number;
    /** Examine/clue area within the draw footprint; defaults to full draw size. */
    interactionWidth?: number;
    interactionHeight?: number;
    interactionOffsetX?: number;
    interactionOffsetY?: number;
    /** Per-side examine strips (north/south/east/west edges of the draw footprint). */
    interactionFaces?: {
        north?: InteractionFaceConfig;
        south?: InteractionFaceConfig;
        east?: InteractionFaceConfig;
        west?: InteractionFaceConfig;
    };
    renderAnchor?: "center" | "bottom";
    /** Horizontal extent of collision rows; defaults to `width`, centered on the placement footprint. */
    collisionWidth?: number;
    /** If set, only the bottom N rows are solid; upper rows stay walkable (e.g. fountain base). */
    collisionRowsFromBottom?: number;
    /** If set, only the top N rows are solid; lower rows stay walkable (e.g. fireplace mantle). */
    collisionRowsFromTop?: number;
    /** Skip this many footprint rows before top-row collision (e.g. mantle above solid hearth). */
    collisionInsetTop?: number;
    /** Render only: no tile blocking (e.g. floor carpet). */
    walkableDecor?: boolean;
    /** Examine / clues disabled (e.g. wall sconces). */
    nonInteractive?: boolean;
    /** Anchored to a perimeter wall tile; no footprint blocking. */
    wallMount?: boolean;
    /** Render flush to north or south wall (fireplace). */
    wallAlign?: "north" | "south";
    /** When set, interaction shows a yes/no confirmation instead of immediate examine. */
    interactionType?: "confirm";
    /** Puzzle or handler id passed to confirmation flow (e.g. `study_secret`). */
    confirmId?: string;
    confirmPrompt?: string;
}

/** Merge table, bookshelves, and decoration map into one furniture catalog. */
export function buildFurnitureCatalog(
    table: FurnitureConfig,
    bookshelves: FurnitureConfig,
    decorations: Record<string, FurnitureConfig>
): Record<string, FurnitureConfig> {
    return {
        [table.id]: table,
        [bookshelves.id]: bookshelves,
        ...decorations
    };
}
