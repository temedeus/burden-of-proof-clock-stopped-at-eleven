import type { FurniturePlacement, RoomConfig } from "./rooms";

/** Game/editor canvas tile grid (800×600 at 32px per tile). Placement coords are stored in this space. */
export const GAME_CANVAS_TILE_WIDTH = 25;
export const GAME_CANVAS_TILE_HEIGHT = 18;

export interface FurnitureBoundsConfig {
    width: number;
    height: number;
    /** Horizontal extent of collision rows; defaults to `width`, centered on the placement footprint. */
    collisionWidth?: number;
    collisionRowsFromBottom?: number;
    /** Solid rows from the top of the footprint (e.g. tall fireplace mantle). */
    collisionRowsFromTop?: number;
    walkableDecor?: boolean;
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
        collisionStartY = startY;
        collisionEndY = startY + rows;
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

export function getGameTileGridSize(_room?: RoomConfig): { width: number; height: number } {
    return { width: GAME_CANVAS_TILE_WIDTH, height: GAME_CANVAS_TILE_HEIGHT };
}

function resolvePosition(value: number | "center" | "top" | "bottom", roomDimension: number): number {
    if (typeof value === "number") return value;
    if (value === "center") return Math.floor(roomDimension / 2);
    if (value === "top") return 0;
    return roomDimension - 1;
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
    gridWidth: number = GAME_CANVAS_TILE_WIDTH,
    gridHeight: number = GAME_CANVAS_TILE_HEIGHT
): boolean {
    const { startX, startY } = resolveFurnitureOrigin(placement, furniture, gridWidth, gridHeight);

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
