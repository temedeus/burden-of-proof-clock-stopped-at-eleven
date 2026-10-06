import { spriteLoader } from "../assets/SpriteLoader";
import {
    rockFloorSpriteName,
    rockWallSpriteName,
    paleRockFloorSpriteName,
    paleRockWallSpriteName,
    paleRockNorthWallSpriteName,
    atticFloorSpriteName,
    atticWallSpriteName,
    atticNorthWallSpriteName,
    woodNorthWallSpriteName,
    manorInteriorWallDraw,
    northWallSpriteName
} from "../assets/procedural/tiles";
import { manorWallSpriteName, gateWestSpriteName, gateEastSpriteName } from "../assets/procedural/exterior";
import { TILE_TO_SPRITE } from "../assets/SpriteMap";
import { ballroomFloorSpriteName } from "../assets/procedural/ballroom";
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
    TILE_SAND,
    TILE_ROCK,
    TILE_WALL,
    TILE_ROCK_WALL,
    TILE_PALE_ROCK,
    TILE_PALE_ROCK_WALL,
    TILE_MANOR_WALL,
    TILE_GATE_WALL,
    TILE_ATTIC_FLOOR,
    TILE_ATTIC_WALL,
    TILE_MARBLE,
    TILE_PALE_WALL,
    TILE_WOOD_WALL,
    TILE_INVISIBLE_WALL,
    TILE_WOOD_FENCE,
    TILE_WOOD_FENCE_POST,
    TILE_WOOD_FENCE_V
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
    drawWallEdges(ctx, map);
}

const SOLID_WALLS = new Set<number>([
    TILE_WALL,
    TILE_WOOD_WALL,
    TILE_ROCK_WALL,
    TILE_PALE_ROCK_WALL,
    TILE_MANOR_WALL,
    TILE_ATTIC_WALL,
    TILE_PALE_WALL
]);

const NO_EDGE_TILES = new Set<number>([
    TILE_DOOR,
    TILE_INVISIBLE_WALL,
    TILE_FENCE,
    TILE_FENCE_POST,
    TILE_BANISTER,
    TILE_BANISTER_POST,
    TILE_WOOD_FENCE,
    TILE_WOOD_FENCE_POST,
    TILE_WOOD_FENCE_V,
    TILE_GATE_WALL
]);

/** Shadow alpha per pixel row/column stepping away from a wall, by wall side. */
const EDGE_SHADOW: Record<"north" | "west" | "east" | "south", number[]> = {
    north: [0.34, 0.24, 0.15, 0.08, 0.03],
    west: [0.28, 0.18, 0.1, 0.04],
    east: [0.16, 0.09, 0.04],
    south: [0.14, 0.07]
};

/**
 * Where walls meet the floor: a soft contact shadow on the floor (strongest
 * under the north wall, light from the upper left) and a lit lip on the wall's
 * inner edge so wall tops read as solid masonry rather than flat tiles.
 */
function drawWallEdges(ctx: CanvasRenderingContext2D, map: TileMap): void {
    const T = TILE_SIZE;
    const at = (x: number, y: number) =>
        x < 0 || y < 0 || x >= map.width || y >= map.height ? -1 : map.tiles[y * map.width + x];
    const lip = "rgba(255,240,220,0.14)";
    const lipDark = "rgba(0,0,0,0.25)";
    for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
            const tile = at(x, y);
            if (SOLID_WALLS.has(tile) || NO_EDGE_TILES.has(tile)) continue;
            const px = x * T;
            const py = y * T;
            if (SOLID_WALLS.has(at(x, y - 1))) {
                EDGE_SHADOW.north.forEach((a, i) => {
                    ctx.fillStyle = `rgba(0,0,0,${a})`;
                    ctx.fillRect(px, py + i, T, 1);
                });
            }
            if (SOLID_WALLS.has(at(x - 1, y))) {
                EDGE_SHADOW.west.forEach((a, i) => {
                    ctx.fillStyle = `rgba(0,0,0,${a})`;
                    ctx.fillRect(px + i, py, 1, T);
                });
                ctx.fillStyle = lip;
                ctx.fillRect(px - 2, py, 1, T);
                ctx.fillStyle = lipDark;
                ctx.fillRect(px - 1, py, 1, T);
            }
            if (SOLID_WALLS.has(at(x + 1, y))) {
                EDGE_SHADOW.east.forEach((a, i) => {
                    ctx.fillStyle = `rgba(0,0,0,${a})`;
                    ctx.fillRect(px + T - 1 - i, py, 1, T);
                });
                ctx.fillStyle = lip;
                ctx.fillRect(px + T, py, 1, T);
            }
            if (SOLID_WALLS.has(at(x, y + 1))) {
                EDGE_SHADOW.south.forEach((a, i) => {
                    ctx.fillStyle = `rgba(0,0,0,${a})`;
                    ctx.fillRect(px, py + T - 1 - i, T, 1);
                });
                ctx.fillStyle = lip;
                ctx.fillRect(px, py + T, T, 1);
            }
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
        if (t === TILE_SAND) return "sand";
        if (t === TILE_CERAMIC) return "ceramic";
        if (t === TILE_ROCK) return rockFloorSpriteName(x, y);
        if (t === TILE_PALE_ROCK) return paleRockFloorSpriteName(x, y);
        if (t === TILE_ATTIC_FLOOR) return atticFloorSpriteName(x, y);
        if (t === TILE_MARBLE) return ballroomFloorSpriteName(x, y);
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
              : map.furnitureUnderlay === "pale_rock"
                ? paleRockFloorSpriteName(x, y)
              : map.furnitureUnderlay === "attic_wood"
                ? atticFloorSpriteName(x, y)
                : map.furnitureUnderlay === "marble"
                  ? ballroomFloorSpriteName(x, y)
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

    if (tile === TILE_INVISIBLE_WALL) {
        spriteLoader.drawSprite(ctx, underlaySpriteName(map, x, y), tileX, tileY, TILE_SIZE, TILE_SIZE);
        return;
    }

    if (
        tile === TILE_FENCE ||
        tile === TILE_FENCE_POST ||
        tile === TILE_BANISTER ||
        tile === TILE_BANISTER_POST ||
        tile === TILE_WOOD_FENCE ||
        tile === TILE_WOOD_FENCE_POST ||
        tile === TILE_WOOD_FENCE_V
    ) {
        spriteLoader.drawSprite(ctx, underlaySpriteName(map, x, y), tileX, tileY, TILE_SIZE, TILE_SIZE);
        const railSprite =
            tile === TILE_FENCE
                ? "fence"
                : tile === TILE_FENCE_POST
                  ? "fence_post"
                  : tile === TILE_BANISTER
                    ? "banister"
                    : tile === TILE_BANISTER_POST
                      ? "banister_post"
                      : tile === TILE_WOOD_FENCE
                        ? "fence_wood"
                        : tile === TILE_WOOD_FENCE_V
                          ? "fence_wood_v"
                          : "fence_wood_post";
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
                : tile === TILE_SAND
                  ? "sand"
                : tile === TILE_CERAMIC
                  ? "ceramic"
                  : tile === TILE_ROCK
                    ? rockFloorSpriteName(x, y)
                    : tile === TILE_PALE_ROCK
                      ? paleRockFloorSpriteName(x, y)
                    : tile === TILE_ATTIC_FLOOR
                      ? atticFloorSpriteName(x, y)
                      : tile === TILE_MARBLE
                        ? ballroomFloorSpriteName(x, y)
                        : tile === TILE_ROCK_WALL
                          ? rockWallSpriteName(x, y)
                          : tile === TILE_PALE_ROCK_WALL
                            ? paleRockWallSpriteName(x, y)
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

    if (tile === TILE_WALL) {
        const onSide = x === 0 || x === map.width - 1;
        const below =
            y + 1 < map.height ? map.tiles[(y + 1) * map.width + x] : -1;
        const above = y > 0 ? map.tiles[(y - 1) * map.width + x] : -1;
        const aboveAbove = y > 1 ? map.tiles[(y - 2) * map.width + x] : -1;

        // Two-tile-thick north wall face: one continuous texture per column.
        if (!onSide && below === TILE_WALL) {
            spriteLoader.drawSprite(
                ctx,
                northWallSpriteName(x, map.northWallAccent),
                tileX,
                tileY,
                TILE_SIZE,
                TILE_SIZE * 2
            );
            return;
        }
        if (!onSide && above === TILE_WALL && aboveAbove !== TILE_WALL) {
            return;
        }

        const { sprite, flipX, flipY } = manorInteriorWallDraw(x, y, map.width, map.height);
        spriteLoader.drawSprite(ctx, sprite, tileX, tileY, TILE_SIZE, TILE_SIZE, flipX, flipY);
        return;
    }

    if (tile === TILE_PALE_ROCK_WALL) {
        const onSide = x === 0 || x === map.width - 1;
        const below =
            y + 1 < map.height ? map.tiles[(y + 1) * map.width + x] : -1;
        const above = y > 0 ? map.tiles[(y - 1) * map.width + x] : -1;
        const aboveAbove = y > 1 ? map.tiles[(y - 2) * map.width + x] : -1;

        if (!onSide && below === TILE_PALE_ROCK_WALL) {
            spriteLoader.drawSprite(
                ctx,
                paleRockNorthWallSpriteName(x),
                tileX,
                tileY,
                TILE_SIZE,
                TILE_SIZE * 2
            );
            return;
        }
        if (!onSide && above === TILE_PALE_ROCK_WALL && aboveAbove !== TILE_PALE_ROCK_WALL) {
            return;
        }
    }

    if (tile === TILE_WOOD_WALL) {
        const onSide = x === 0 || x === map.width - 1;
        const below =
            y + 1 < map.height ? map.tiles[(y + 1) * map.width + x] : -1;
        const above = y > 0 ? map.tiles[(y - 1) * map.width + x] : -1;
        const aboveAbove = y > 1 ? map.tiles[(y - 2) * map.width + x] : -1;

        if (!onSide && below === TILE_WOOD_WALL) {
            spriteLoader.drawSprite(
                ctx,
                woodNorthWallSpriteName(x),
                tileX,
                tileY,
                TILE_SIZE,
                TILE_SIZE * 2
            );
            return;
        }
        if (!onSide && above === TILE_WOOD_WALL && aboveAbove !== TILE_WOOD_WALL) {
            return;
        }
    }

    if (tile === TILE_ATTIC_WALL) {
        const onSide = x === 0 || x === map.width - 1;
        const below =
            y + 1 < map.height ? map.tiles[(y + 1) * map.width + x] : -1;
        const above = y > 0 ? map.tiles[(y - 1) * map.width + x] : -1;
        const aboveAbove = y > 1 ? map.tiles[(y - 2) * map.width + x] : -1;

        if (!onSide && below === TILE_ATTIC_WALL) {
            spriteLoader.drawSprite(
                ctx,
                atticNorthWallSpriteName(x),
                tileX,
                tileY,
                TILE_SIZE,
                TILE_SIZE * 2
            );
            return;
        }
        if (!onSide && above === TILE_ATTIC_WALL && aboveAbove !== TILE_ATTIC_WALL) {
            return;
        }
    }

    if (spriteName) {
        spriteLoader.drawSprite(ctx, spriteName, tileX, tileY, TILE_SIZE, TILE_SIZE);
    } else {
        spriteLoader.drawSprite(ctx, "floor", tileX, tileY, TILE_SIZE, TILE_SIZE);
    }
}
