import { spriteLoader } from "../assets/SpriteLoader";
import { rockFloorSpriteName, rockWallSpriteName, atticFloorSpriteName, atticWallSpriteName } from "../assets/procedural/tiles";
import { manorWallSpriteName, gateWestSpriteName, gateEastSpriteName } from "../assets/procedural/exterior";
import { TILE_TO_SPRITE } from "../assets/SpriteMap";
import { TILE_SIZE } from "../world/constants";
import {
    TILE_CERAMIC,
    TILE_DOOR,
    TILE_FENCE,
    TILE_FENCE_POST,
    TILE_BANISTER,
    TILE_BANISTER_POST,
    TILE_FLOOR,
    TILE_FURNITURE,
    TILE_GRASS,
    TILE_GRAVEL,
    TILE_ROCK,
    TILE_ROCK_WALL,
    TILE_MANOR_WALL,
    TILE_GATE_WALL,
    TILE_ATTIC_FLOOR,
    TILE_ATTIC_WALL,
    TILE_MARBLE,
    TILE_PALE_WALL,
    TILE_WOOD_WALL
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

function underlaySpriteName(map: TileMap, x: number, y: number): string {
    const idx = y * map.width + x;
    const snap = map.terrainBeforeFurniture;
    if (snap && idx >= 0 && idx < snap.length) {
        const t = snap[idx];
        if (t === TILE_GRASS) return "grass";
        if (t === TILE_GRAVEL) return "gravel";
        if (t === TILE_CERAMIC) return "ceramic";
        if (t === TILE_ROCK) return rockFloorSpriteName(x, y);
        if (t === TILE_ATTIC_FLOOR) return atticFloorSpriteName(x, y);
        if (t === TILE_MARBLE) return "floor_marble";
        if (t === TILE_FLOOR) return "floor";
    }
    return map.furnitureUnderlay === "grass"
        ? "grass"
        : map.furnitureUnderlay === "gravel"
          ? "gravel"
          : map.furnitureUnderlay === "ceramic"
            ? "ceramic"
            : map.furnitureUnderlay === "rock"
              ? rockFloorSpriteName(x, y)
              : map.furnitureUnderlay === "attic_wood"
                ? atticFloorSpriteName(x, y)
                : map.furnitureUnderlay === "marble"
                  ? "floor_marble"
                  : "floor";
}

function spriteUnderFurniture(map: TileMap, x: number, y: number): string {
    return underlaySpriteName(map, x, y);
}

function drawTile(ctx: CanvasRenderingContext2D, map: TileMap, tile: number, x: number, y: number): void {
    const tileX = x * TILE_SIZE;
    const tileY = y * TILE_SIZE;

    if (tile === TILE_GATE_WALL) {
        const gateSprite =
            x === 0
                ? gateWestSpriteName(x, y)
                : x === map.width - 1
                  ? gateEastSpriteName(x, y)
                  : gateWestSpriteName(x, y);
        spriteLoader.drawSprite(ctx, underlaySpriteName(map, x, y), tileX, tileY, TILE_SIZE, TILE_SIZE);
        spriteLoader.drawSprite(ctx, gateSprite, tileX, tileY, TILE_SIZE, TILE_SIZE);
        return;
    }

    if (tile === TILE_FENCE || tile === TILE_FENCE_POST || tile === TILE_BANISTER || tile === TILE_BANISTER_POST) {
        spriteLoader.drawSprite(ctx, underlaySpriteName(map, x, y), tileX, tileY, TILE_SIZE, TILE_SIZE);
        const railSprite =
            tile === TILE_FENCE
                ? "fence"
                : tile === TILE_FENCE_POST
                  ? "fence_post"
                  : tile === TILE_BANISTER
                    ? "banister"
                    : "banister_post";
        spriteLoader.drawSprite(ctx, railSprite, tileX, tileY, TILE_SIZE, TILE_SIZE);
        return;
    }

    const spriteName =
        tile === TILE_DOOR
            ? underlaySpriteName(map, x, y)
            : tile === TILE_GRASS
              ? "grass"
              : tile === TILE_GRAVEL
                ? "gravel"
                : tile === TILE_CERAMIC
                  ? "ceramic"
                  : tile === TILE_ROCK
                    ? rockFloorSpriteName(x, y)
                    : tile === TILE_ATTIC_FLOOR
                      ? atticFloorSpriteName(x, y)
                      : tile === TILE_MARBLE
                        ? "floor_marble"
                        : tile === TILE_ROCK_WALL
                          ? rockWallSpriteName(x, y)
                          : tile === TILE_ATTIC_WALL
                            ? atticWallSpriteName(x, y)
                            : tile === TILE_PALE_WALL
                              ? "wall_pale"
                              : tile === TILE_WOOD_WALL
                                ? "wall_wood"
                                : tile === TILE_MANOR_WALL
                                  ? manorWallSpriteName(x, y)
                                  : tile === TILE_FURNITURE
                                    ? spriteUnderFurniture(map, x, y)
                                    : TILE_TO_SPRITE[tile];

    if (spriteName) {
        spriteLoader.drawSprite(ctx, spriteName, tileX, tileY, TILE_SIZE, TILE_SIZE);
    } else {
        spriteLoader.drawSprite(ctx, "floor", tileX, tileY, TILE_SIZE, TILE_SIZE);
    }
}
