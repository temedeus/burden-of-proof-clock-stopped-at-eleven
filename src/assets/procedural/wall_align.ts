import { TILE_SIZE } from "../../world/constants";

export type WallAlign = "north" | "south";

/** Snap a tall/wide decor sprite flush to the north or south wall. */
export function decorWallDrawBounds(
    align: WallAlign,
    minX: number,
    maxX: number,
    drawW: number,
    drawH: number,
    roomH: number
): { drawX: number; drawY: number } {
    const footW = (maxX - minX + 1) * TILE_SIZE;
    const drawX = minX * TILE_SIZE + (footW - drawW) / 2;
    const drawTiles = drawH / TILE_SIZE;
    const drawY = align === "north" ? 0 : (roomH - drawTiles) * TILE_SIZE;
    return { drawX, drawY };
}

/** Infer north/south wall alignment from placement center. */
export function inferWallAlign(startY: number, furnitureHeight: number, roomHeight: number): WallAlign | undefined {
    const centerY = startY + furnitureHeight / 2;
    if (centerY <= roomHeight / 3) return "north";
    if (centerY >= (roomHeight * 2) / 3) return "south";
    return undefined;
}
