import { spriteLoader } from "../assets/SpriteLoader";
import { TILE_TO_SPRITE } from "../assets/SpriteMap";
import { TILE_SIZE } from "../world/constants";
import {
    TILE_CERAMIC,
    TILE_DOOR,
    TILE_FENCE,
    TILE_FENCE_POST,
    TILE_FLOOR,
    TILE_FURNITURE,
    TILE_GRASS,
    TILE_GRAVEL,
    TILE_ROCK
} from "../world/TileTypes";
import type { TileMap } from "../world/TileMap";

/** Draw tile grid for a room map. */
export function renderTileMap(ctx: CanvasRenderingContext2D, map: TileMap): void {
    for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
            const tile = map.tiles[y * map.width + x];
            drawTile(ctx, map, tile, x, y);
        }
    }
}

function spriteUnderFurniture(map: TileMap, x: number, y: number): string {
    const idx = y * map.width + x;
    const snap = map.terrainBeforeFurniture;
    if (snap && idx >= 0 && idx < snap.length) {
        const t = snap[idx];
        if (t === TILE_GRASS) return "grass";
        if (t === TILE_GRAVEL) return "gravel";
        if (t === TILE_CERAMIC) return "ceramic";
        if (t === TILE_ROCK) return "rock";
        if (t === TILE_FLOOR) return "floor";
    }
    return map.furnitureUnderlay === "grass"
        ? "grass"
        : map.furnitureUnderlay === "gravel"
          ? "gravel"
          : map.furnitureUnderlay === "ceramic"
            ? "ceramic"
            : map.furnitureUnderlay === "rock"
              ? "rock"
              : "floor";
}

function drawTile(ctx: CanvasRenderingContext2D, map: TileMap, tile: number, x: number, y: number): void {
    const tileX = x * TILE_SIZE;
    const tileY = y * TILE_SIZE;

    const spriteName =
        tile === TILE_DOOR
            ? "floor"
            : tile === TILE_GRASS
              ? "grass"
              : tile === TILE_GRAVEL
                ? "gravel"
                : tile === TILE_CERAMIC
                  ? "ceramic"
                  : tile === TILE_ROCK
                    ? "rock"
                    : tile === TILE_FURNITURE
                      ? spriteUnderFurniture(map, x, y)
                      : tile === TILE_FENCE
                        ? "fence"
                        : tile === TILE_FENCE_POST
                          ? "fence_post"
                          : TILE_TO_SPRITE[tile];

    if (spriteName) {
        spriteLoader.drawSprite(ctx, spriteName, tileX, tileY, TILE_SIZE, TILE_SIZE);
    } else {
        spriteLoader.drawSprite(ctx, "floor", tileX, tileY, TILE_SIZE, TILE_SIZE);
    }
}
