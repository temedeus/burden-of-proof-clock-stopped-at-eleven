import { TILE_SIZE } from "../../../world/constants";
import { resolveNpcPlacementTile } from "../../../render/roomScene";
import { hitTestNpc } from "../hitTest";
import type { ActiveDrag, LayoutTargetHandler, LayoutTargetHost, PointerContext } from "./types";

export const npcHandler: LayoutTargetHandler = {
    target: "npc",

    hitTest(ctx, host) {
        return hitTestNpc(ctx.room, ctx.tile.x, ctx.tile.y, ctx.grid);
    },

    hasHover(ctx, host) {
        return this.hitTest(ctx, host) >= 0;
    },

    deleteAt(ctx, index, host) {
        ctx.room.npcs?.splice(index, 1);
        host.setSelectedIndex("npc", null);
        host.markDirty(ctx.room);
        host.syncTextarea(ctx.room.id);
    },

    deleteSelection(host) {
        const room = host.currentRoom();
        const index = host.getSelectedIndex("npc");
        if (!room?.npcs || index == null || index < 0 || index >= room.npcs.length) return;
        room.npcs.splice(index, 1);
        host.setSelectedIndex("npc", null);
        host.markDirty(room);
        host.syncTextarea(room.id);
    },

    addAt(ctx, host) {
        const npcId = host.npcSelect.value;
        const existingRoomId = host.findNpcPlacementRoomId(npcId);
        if (existingRoomId) {
            host.reportIssue(`Cannot add '${npcId}': already placed in room '${existingRoomId}'.`);
            return;
        }
        if (!ctx.room.npcs) ctx.room.npcs = [];
        ctx.room.npcs.push({ npcId, x: ctx.tile.x, y: ctx.tile.y });
        host.clearSelectionsExcept("npc");
        host.setSelectedIndex("npc", ctx.room.npcs.length - 1);
        host.markDirty(ctx.room);
        host.syncTextarea(ctx.room.id);
        host.switchToSelectTool();
    },

    addAtCenter(host) {
        const room = host.currentRoom();
        const npcId = host.npcSelect.value;
        if (!room || !host.npcConfigs[npcId]) return;
        const existingRoomId = host.findNpcPlacementRoomId(npcId);
        if (existingRoomId) {
            host.reportIssue(`Cannot add '${npcId}': already placed in room '${existingRoomId}'.`);
            return;
        }
        if (!room.npcs) room.npcs = [];
        const grid = host.gridSize();
        const x = Math.max(0, Math.floor((grid.width - 2) / 2));
        const y = Math.max(0, Math.floor((grid.height - 2) / 2));
        room.npcs.push({ npcId, x, y });
        host.clearSelectionsExcept("npc");
        host.setSelectedIndex("npc", room.npcs.length - 1);
        host.markDirty(room);
        host.syncTextarea(room.id);
    },

    selectAt(ctx, hit, host) {
        host.clearSelectionsExcept("npc");
        host.setSelectedIndex("npc", hit >= 0 ? hit : null);
        if (hit < 0 || !ctx.room.npcs) return;

        host.capturePointer(ctx.event);
        const npc = ctx.room.npcs[hit];
        const x = resolveNpcPlacementTile(npc.x, "width", ctx.grid);
        const y = resolveNpcPlacementTile(npc.y, "height", ctx.grid);
        host.setActiveDrag({
            kind: "npc",
            index: hit,
            offsetX: ctx.tile.x - x,
            offsetY: ctx.tile.y - y
        });
    },

    clearSelection(host) {
        host.setSelectedIndex("npc", null);
    },

    updateDrag(ctx, drag, host) {
        if (drag.kind !== "npc") return;
        if (!ctx.room.npcs) return;
        const npc = ctx.room.npcs[drag.index];
        if (!npc) return;
        const maxX = Math.max(0, ctx.grid.width - 2);
        const maxY = Math.max(0, ctx.grid.height - 2);
        npc.x = Math.max(0, Math.min(maxX, ctx.tile.x - drag.offsetX));
        npc.y = Math.max(0, Math.min(maxY, ctx.tile.y - drag.offsetY));
        host.markDirty(ctx.room);
    },

    drawSelectionHighlight(ctx, room, grid, host) {
        const index = host.getSelectedIndex("npc");
        if (index == null || !room.npcs?.[index]) return;
        const npc = room.npcs[index];
        const nx = resolveNpcPlacementTile(npc.x, "width", grid);
        const ny = resolveNpcPlacementTile(npc.y, "height", grid);
        ctx.strokeStyle = "rgba(255, 220, 0, 0.95)";
        ctx.lineWidth = 2;
        ctx.strokeRect(nx * TILE_SIZE + 1, ny * TILE_SIZE + 1, TILE_SIZE * 2 - 2, TILE_SIZE * 2 - 2);
        ctx.lineWidth = 1;
    }
};
