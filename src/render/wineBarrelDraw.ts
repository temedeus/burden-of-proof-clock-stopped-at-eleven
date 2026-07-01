import { spriteLoader } from "../assets/SpriteLoader";
import { TILE_SIZE } from "../world/constants";

export const WINE_BARREL_DRAW_PX = TILE_SIZE * 2;

/** Pixel Y for a wine barrel anchored at `anchorY` with a 2-tile-tall footprint. */
export function wineBarrelDrawY(anchorY: number, footprintHeightTiles = 2): number {
    return (anchorY + footprintHeightTiles) * TILE_SIZE - WINE_BARREL_DRAW_PX;
}

export function drawWineBarrelsAtAnchors(
    ctx: CanvasRenderingContext2D,
    anchorXs: readonly number[],
    anchorY: number,
    nudgeX = 0
): void {
    const drawY = wineBarrelDrawY(anchorY);
    for (const x of anchorXs) {
        spriteLoader.drawSprite(
            ctx,
            "wine_barrel",
            x * TILE_SIZE + nudgeX,
            drawY,
            WINE_BARREL_DRAW_PX,
            WINE_BARREL_DRAW_PX
        );
    }
}
