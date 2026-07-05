import { TILE_SIZE } from "../../../world/constants";
import { snapWallMountAnchor } from "../../../assets/procedural/wall_align";
import { hitTestFurniture } from "../hitTest";
import type { ActiveDrag, LayoutTargetHandler, LayoutTargetHost, PointerContext } from "./types";

export const furnitureHandler: LayoutTargetHandler = {
    target: "furniture",

    hitTest(ctx, host) {
        return hitTestFurniture(ctx.room, ctx.tile.x, ctx.tile.y, host.furnitureById, ctx.grid);
    },

    hasHover(ctx, host) {
        return this.hitTest(ctx, host) >= 0;
    },

    deleteAt(ctx, index, host) {
        ctx.room.furniture.splice(index, 1);
        host.setSelectedIndex("furniture", null);
        host.onFurnitureSelectionChanged();
        host.markDirty(ctx.room);
        host.syncTextarea(ctx.room.id);
    },

    deleteSelection(host) {
        const room = host.currentRoom();
        const index = host.getSelectedIndex("furniture");
        if (!room || index == null || index < 0 || index >= room.furniture.length) return;
        room.furniture.splice(index, 1);
        host.setSelectedIndex("furniture", null);
        host.onFurnitureSelectionChanged();
        host.markDirty(room);
        host.syncTextarea(room.id);
    },

    addAt(ctx, host) {
        const furnitureId = host.furnitureSelect.value;
        if (!host.furnitureById[furnitureId]) return;
        ctx.room.furniture.push({ furnitureId, x: ctx.tile.x, y: ctx.tile.y, anchor: "top-left" });
        host.setSelectedIndex("furniture", ctx.room.furniture.length - 1);
        host.markDirty(ctx.room);
        host.syncTextarea(ctx.room.id);
        host.switchToSelectTool();
    },

    addAtCenter(host) {
        const room = host.currentRoom();
        const furnitureId = host.furnitureSelect.value;
        const config = host.furnitureById[furnitureId];
        if (!room || !config) return;
        const grid = host.gridSize();
        const x = Math.max(0, Math.floor((grid.width - config.width) / 2));
        const y = Math.max(0, Math.floor((grid.height - config.height) / 2));
        room.furniture.push({ furnitureId, x, y, anchor: "top-left" });
        host.clearSelectionsExcept("furniture");
        host.setSelectedIndex("furniture", room.furniture.length - 1);
        host.markDirty(room);
        host.syncTextarea(room.id);
    },

    selectAt(ctx, hit, host) {
        host.clearSelectionsExcept("furniture");
        host.setSelectedIndex("furniture", hit >= 0 ? hit : null);
        host.onFurnitureSelectionChanged();

        if (!ctx.allowDrag && hit < 0) {
            host.setActiveDrag(null);
            return;
        }
        if (hit < 0 || !ctx.allowDrag) return;

        host.capturePointer(ctx.event);
        const rect = host.furniturePlacementRect(ctx.room.furniture[hit]);
        if (rect) {
            host.setActiveDrag({
                kind: "furniture",
                index: hit,
                offsetX: ctx.tile.x - rect.x,
                offsetY: ctx.tile.y - rect.y
            });
        }
    },

    clearSelection(host) {
        host.setSelectedIndex("furniture", null);
        host.onFurnitureSelectionChanged();
    },

    updateDrag(ctx, drag, host) {
        if (drag.kind !== "furniture") return;
        const placement = ctx.room.furniture[drag.index];
        if (!placement) return;
        const config = host.furnitureById[placement.furnitureId];
        if (!config) return;

        if (config.wallMount) {
            const tileW = config.drawWidth ?? 1;
            const tileH = config.drawHeight ?? 1;
            const anchorX = ctx.tile.x - drag.offsetX;
            const anchorY = ctx.tile.y - drag.offsetY;
            const snapped = snapWallMountAnchor(
                anchorX,
                anchorY,
                ctx.grid.width,
                ctx.grid.height,
                tileW,
                tileH
            );
            placement.x = snapped.x;
            placement.y = snapped.y;
            placement.anchor = "top-left";
            host.markDirty(ctx.room);
            return;
        }

        const maxX = Math.max(0, ctx.grid.width - config.width);
        const maxY = Math.max(0, ctx.grid.height - config.height);
        placement.x = Math.max(0, Math.min(maxX, ctx.tile.x - drag.offsetX));
        placement.y = Math.max(0, Math.min(maxY, ctx.tile.y - drag.offsetY));
        placement.anchor = "top-left";
        host.markDirty(ctx.room);
    },

    drawSelectionHighlight(ctx, room, _grid, host) {
        const index = host.getSelectedIndex("furniture");
        if (index == null) return;
        const placement = room.furniture[index];
        const rect = placement ? host.furniturePlacementRect(placement) : null;
        if (!rect) return;
        ctx.strokeStyle = "rgba(0, 220, 255, 0.95)";
        ctx.lineWidth = 2;
        ctx.strokeRect(
            rect.x * TILE_SIZE + 1,
            rect.y * TILE_SIZE + 1,
            rect.w * TILE_SIZE - 2,
            rect.h * TILE_SIZE - 2
        );
        ctx.lineWidth = 1;
    }
};
