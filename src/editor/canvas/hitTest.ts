import type { FurniturePlacement, RoomConfig } from "@cse/content-schema";
import { resolveDecorDrawOrigin, resolveFurnitureOrigin, resolveNpcPlacementTile, resolvePosition } from "@cse/content-schema";
import { wallMountTileRect } from "../../assets/procedural/wall_align";
import { TILE_SIZE } from "../../world/constants";

export type FurnitureBounds = {
    width: number;
    height: number;
    drawWidth?: number;
    drawHeight?: number;
    renderAnchor?: import("@cse/content-schema").RenderAnchor;
    wallMount?: boolean;
};

export function gridSizeFromCanvas(canvasWidth: number, canvasHeight: number): { width: number; height: number } {
    return {
        width: Math.floor(canvasWidth / TILE_SIZE),
        height: Math.floor(canvasHeight / TILE_SIZE)
    };
}

export function resizeCanvasForRoom(
    canvas: HTMLCanvasElement,
    room: { width: number; height: number }
): void {
    canvas.width = room.width * TILE_SIZE;
    canvas.height = room.height * TILE_SIZE;
}

export function resolveExitPosition(
    value: number | "center" | "top" | "bottom",
    dimension: number
): number {
    return resolvePosition(value, dimension);
}

export function getPlacementRect(
    placement: FurniturePlacement,
    furniture: FurnitureBounds,
    grid: { width: number; height: number }
): { x: number; y: number; w: number; h: number } {
    const { startX, startY } = resolveFurnitureOrigin(placement, furniture, grid.width, grid.height);

    if (furniture.wallMount) {
        const tileW = furniture.drawWidth ?? 1;
        const tileH = furniture.drawHeight ?? 1;
        const rect = wallMountTileRect(startX, startY, grid.width, grid.height, tileW, tileH);
        return { x: rect.x, y: rect.y, w: rect.w, h: rect.h };
    }

    const hasDecorDraw =
        (furniture.drawWidth != null && furniture.drawWidth !== furniture.width) ||
        (furniture.drawHeight != null && furniture.drawHeight !== furniture.height) ||
        (furniture.renderAnchor != null && furniture.renderAnchor !== "bottom" && furniture.renderAnchor !== "center");

    if (hasDecorDraw) {
        const { ix, iy, iw, ih } = resolveDecorDrawOrigin(startX, startY, furniture);
        return { x: ix, y: iy, w: iw, h: ih };
    }

    return { x: startX, y: startY, w: furniture.width, h: furniture.height };
}

export function hitTestFurniture(
    room: RoomConfig,
    tileX: number,
    tileY: number,
    furnitureById: Record<string, FurnitureBounds>,
    grid: { width: number; height: number }
): number {
    for (let i = room.furniture.length - 1; i >= 0; i--) {
        const placement = room.furniture[i];
        const config = furnitureById[placement.furnitureId];
        if (!config) continue;
        const rect = getPlacementRect(placement, config, grid);
        if (tileX >= rect.x && tileX < rect.x + rect.w && tileY >= rect.y && tileY < rect.y + rect.h) {
            return i;
        }
    }
    return -1;
}

export function hitTestNpc(
    room: RoomConfig,
    tileX: number,
    tileY: number,
    grid: { width: number; height: number }
): number {
    for (let i = (room.npcs?.length ?? 0) - 1; i >= 0; i--) {
        const npc = room.npcs![i];
        const x = resolveNpcPlacementTile(npc.x, grid.width);
        const y = resolveNpcPlacementTile(npc.y, grid.height);
        if (tileX >= x && tileX <= x + 1 && tileY >= y && tileY <= y + 1) return i;
    }
    return -1;
}

export function hitTestDoor(
    room: RoomConfig,
    tileX: number,
    tileY: number,
    grid: { width: number; height: number }
): number {
    for (let i = room.exits.length - 1; i >= 0; i--) {
        const exit = room.exits[i];
        const x = resolveExitPosition(exit.x as number | "center" | "top" | "bottom", grid.width);
        const y = resolveExitPosition(exit.y as number | "center" | "top" | "bottom", grid.height);
        const isTopOrBottom = y === 0 || y === grid.height - 1;
        if (isTopOrBottom) {
            if (tileY === y && tileX >= x - 1 && tileX <= x + 1) return i;
        } else {
            if (tileX === x && tileY >= y - 1 && tileY <= y + 1) return i;
        }
    }
    return -1;
}
