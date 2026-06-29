import type { FurniturePlacement, PositionToken, RoomConfig, SpawnYToken } from "./rooms";

/** Default room size for new rooms / game viewport (800×600 at 32px per tile). */
export const DEFAULT_ROOM_TILE_WIDTH = 25;
export const DEFAULT_ROOM_TILE_HEIGHT = 18;

/** @deprecated Use DEFAULT_ROOM_TILE_WIDTH */
export const GAME_CANVAS_TILE_WIDTH = DEFAULT_ROOM_TILE_WIDTH;
/** @deprecated Use DEFAULT_ROOM_TILE_HEIGHT */
export const GAME_CANVAS_TILE_HEIGHT = DEFAULT_ROOM_TILE_HEIGHT;

export interface FurnitureBoundsConfig {
    width: number;
    height: number;
    /** Horizontal extent of collision rows; defaults to `width`, centered on the placement footprint. */
    collisionWidth?: number;
    collisionRowsFromBottom?: number;
    /** Solid rows from the top of the footprint (e.g. tall fireplace mantle). */
    collisionRowsFromTop?: number;
    /** Skip footprint rows before top-row collision begins. */
    collisionInsetTop?: number;
    walkableDecor?: boolean;
    wallMount?: boolean;
}

/** Resolve furniture/exit anchor tokens to tile coordinates (edge-aligned). */
export function resolvePosition(value: PositionToken, roomDimension: number): number {
    if (typeof value === "number") return value;
    if (value === "center") return Math.floor(roomDimension / 2);
    if (value === "top") return 0;
    return roomDimension - 1;
}

/**
 * Resolve NPC spawn tile — inset one tile from walls so 2×2 sprites stay inside the room.
 * Matches runtime spawn and editor hit-testing.
 */
export function resolveNpcPlacementTile(value: PositionToken, roomDimension: number): number {
    if (typeof value === "number") return value;
    if (value === "center") return Math.floor(roomDimension / 2);
    if (value === "top") return 1;
    return roomDimension - 2;
}

export function resolveSpawnY(value: SpawnYToken, roomHeight: number): number {
    if (typeof value === "number") return value;
    if (value === "center") return Math.floor(roomHeight / 2) - 1;
    if (value === "bottom-1") return roomHeight - 2;
    if (value === "bottom-2") return roomHeight - 3;
    if (value === "bottom-3") return roomHeight - 4;
    return roomHeight - 4;
}

export function getCollisionTileRange(
    startX: number,
    startY: number,
    furniture: FurnitureBoundsConfig
): { startX: number; endX: number; startY: number; endY: number } {
    const collisionW = furniture.collisionWidth ?? furniture.width;
    const collisionStartX = startX + Math.floor((furniture.width - collisionW) / 2);

    let collisionStartY: number;
    let collisionEndY: number;
    if (furniture.collisionRowsFromTop != null) {
        const rows = Math.min(Math.max(1, furniture.collisionRowsFromTop), furniture.height);
        const insetTop = Math.max(0, furniture.collisionInsetTop ?? 0);
        collisionStartY = startY + insetTop;
        collisionEndY = startY + insetTop + rows;
    } else {
        const collisionRows =
            furniture.collisionRowsFromBottom != null
                ? Math.min(Math.max(1, furniture.collisionRowsFromBottom), furniture.height)
                : furniture.height;
        collisionStartY = startY + furniture.height - collisionRows;
        collisionEndY = startY + furniture.height;
    }

    return {
        startX: collisionStartX,
        endX: collisionStartX + collisionW,
        startY: collisionStartY,
        endY: collisionEndY
    };
}

export function getGameTileGridSize(room: RoomConfig): { width: number; height: number } {
    return { width: room.width, height: room.height };
}

export function resolveFurnitureOrigin(
    placement: FurniturePlacement,
    furniture: FurnitureBoundsConfig,
    gridWidth: number,
    gridHeight: number
): { startX: number; startY: number } {
    let startX = resolvePosition(placement.x, gridWidth);
    let startY = resolvePosition(placement.y, gridHeight);
    if (placement.anchor === "center") {
        startX -= Math.floor(furniture.width / 2);
        startY -= Math.floor(furniture.height / 2);
    }
    return { startX, startY };
}

/** Matches game placement: at least one footprint tile inside the playable grid (walls excluded). */
export function isFurniturePlacementInBounds(
    placement: FurniturePlacement,
    furniture: FurnitureBoundsConfig,
    gridWidth: number = DEFAULT_ROOM_TILE_WIDTH,
    gridHeight: number = DEFAULT_ROOM_TILE_HEIGHT
): boolean {
    const { startX, startY } = resolveFurnitureOrigin(placement, furniture, gridWidth, gridHeight);

    if (furniture.wallMount) {
        return startX >= 0 && startX < gridWidth && startY >= 0 && startY < gridHeight;
    }

    if (furniture.walkableDecor) {
        for (let tileY = startY; tileY < startY + furniture.height; tileY++) {
            for (let tileX = startX; tileX < startX + furniture.width; tileX++) {
                if (tileX >= 1 && tileX < gridWidth - 1 && tileY >= 1 && tileY < gridHeight - 1) {
                    return true;
                }
            }
        }
        return false;
    }

    const { startX: collisionStartX, endX: collisionEndX, startY: collisionStartY, endY: collisionEndY } =
        getCollisionTileRange(startX, startY, furniture);

    for (let tileY = collisionStartY; tileY < collisionEndY; tileY++) {
        for (let tileX = collisionStartX; tileX < collisionEndX; tileX++) {
            if (tileX >= 0 && tileX < gridWidth && tileY >= 0 && tileY < gridHeight) {
                return true;
            }
        }
    }
    return false;
}
