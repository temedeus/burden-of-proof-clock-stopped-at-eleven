export const TILE_SIZE = 32;

export function roomViewportOffset(
    canvasWidth: number,
    canvasHeight: number,
    roomWidthTiles: number,
    roomHeightTiles: number
): { x: number; y: number } {
    return {
        x: Math.max(0, Math.floor((canvasWidth - roomWidthTiles * TILE_SIZE) / 2)),
        y: Math.max(0, Math.floor((canvasHeight - roomHeightTiles * TILE_SIZE) / 2))
    };
}
