import type { Interactable } from "./Interactable";

export type TileCoord = { x: number; y: number };

/** Tiles used for examine / clue targeting (defaults to collision tiles if unset). */
export function getInteractionTiles(obj: Interactable): TileCoord[] {
    if (obj.interactionTiles && obj.interactionTiles.length > 0) {
        return obj.interactionTiles;
    }
    return obj.tiles;
}

export function tileBounds(tiles: TileCoord[]): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
} | null {
    if (tiles.length === 0) return null;
    return {
        minX: Math.min(...tiles.map((t) => t.x)),
        maxX: Math.max(...tiles.map((t) => t.x)),
        minY: Math.min(...tiles.map((t) => t.y)),
        maxY: Math.max(...tiles.map((t) => t.y))
    };
}
