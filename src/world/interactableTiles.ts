import type { Facing } from "../entities/Player";
import type { Interactable } from "./Interactable";

export type TileCoord = { x: number; y: number };

/** Tiles used for examine / clue targeting (defaults to collision tiles if unset). */
export function getInteractionTiles(obj: Interactable): TileCoord[] {
    if (obj.interactionTiles !== undefined) {
        return obj.interactionTiles;
    }
    return obj.tiles;
}

/** Examine tiles for the direction the player is facing. */
export function getInteractionTilesForFacing(obj: Interactable, facing: Facing): TileCoord[] {
    const facingTiles = obj.interactionTilesByFacing?.[facing];
    if (facingTiles && facingTiles.length > 0) {
        return facingTiles;
    }
    return getInteractionTiles(obj);
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
