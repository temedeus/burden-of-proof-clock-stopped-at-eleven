import { TILE_SIZE } from "../../../world/constants";
import { hitTestDoor, resolveExitPosition } from "../hitTest";
import { exitFromNearestWall, spawnForExit } from "../doorPlacement";
import type { ActiveDrag, LayoutTargetHandler, LayoutTargetHost, PointerContext } from "./types";

export const doorsHandler: LayoutTargetHandler = {
    target: "doors",

    hitTest(ctx, host) {
        return hitTestDoor(ctx.room, ctx.tile.x, ctx.tile.y, ctx.grid);
    },

    hasHover(ctx, host) {
        return this.hitTest(ctx, host) >= 0;
    },

    deleteAt(ctx, index, host) {
        ctx.room.exits.splice(index, 1);
        host.setSelectedIndex("doors", null);
        host.markDirty(ctx.room);
        host.syncTextarea(ctx.room.id);
    },

    deleteSelection(host) {
        const room = host.currentRoom();
        const index = host.getSelectedIndex("doors");
        if (!room || index == null || index < 0 || index >= room.exits.length) return;
        room.exits.splice(index, 1);
        host.setSelectedIndex("doors", null);
        host.markDirty(room);
        host.syncTextarea(room.id);
    },

    addAt(ctx, host) {
        if (host.doorPlacementIsArmed()) {
            const ghost = host.getDoorGhost();
            if (ghost) {
                host.addDoorFromGhost(ghost);
                host.cancelDoorPlacement();
                host.reportIssue("Door added.");
                host.switchToSelectTool();
                return;
            }
        }
        host.addDoorAtTile(ctx.tile.x, ctx.tile.y);
        host.switchToSelectTool();
    },

    addAtCenter(_host) {
        // Doors are placed on walls via canvas click or armed ghost, not at center.
    },

    selectAt(ctx, hit, host) {
        if (hit < 0) return;
        host.clearSelectionsExcept("doors");
        host.setSelectedIndex("doors", hit);
        host.doorTargetRoomSelect.value = ctx.room.exits[hit].targetRoom;
        host.capturePointer(ctx.event);

        const exit = ctx.room.exits[hit];
        const x = resolveExitPosition(exit.x as number | "center" | "top" | "bottom", ctx.grid.width);
        const y = resolveExitPosition(exit.y as number | "center" | "top" | "bottom", ctx.grid.height);
        const isHorizontal = y === 0 || y === ctx.grid.height - 1;
        const wall = y === 0 ? "top" : y === ctx.grid.height - 1 ? "bottom" : x === 0 ? "left" : "right";
        host.setActiveDrag({
            kind: "door",
            index: hit,
            orientation: isHorizontal ? "horizontal" : "vertical",
            wall
        });
    },

    clearSelection(host) {
        host.setSelectedIndex("doors", null);
    },

    updateDrag(ctx, drag, host) {
        if (drag.kind !== "door") return;
        const exit = ctx.room.exits[drag.index];
        if (!exit) return;
        if (drag.orientation === "horizontal") {
            const x = Math.max(1, Math.min(ctx.grid.width - 2, ctx.tile.x));
            exit.x = x as any;
            exit.y = (drag.wall === "top" ? "top" : "bottom") as any;
        } else {
            const y = Math.max(1, Math.min(ctx.grid.height - 2, ctx.tile.y));
            exit.y = y as any;
            exit.x = (drag.wall === "left" ? "top" : "bottom") as any;
        }
        host.refreshDoorSpawn(drag.index);
        host.markDirty(ctx.room);
    },

    drawSelectionHighlight(ctx, room, grid, host) {
        const index = host.getSelectedIndex("doors");
        if (index == null || !room.exits[index]) return;
        const exit = room.exits[index];
        const x = resolveExitPosition(exit.x as number | "center" | "top" | "bottom", grid.width);
        const y = resolveExitPosition(exit.y as number | "center" | "top" | "bottom", grid.height);
        const isTopOrBottom = y === 0 || y === grid.height - 1;
        ctx.strokeStyle = "rgba(255, 120, 0, 0.95)";
        ctx.lineWidth = 2;
        if (isTopOrBottom) {
            ctx.strokeRect((x - 1) * TILE_SIZE + 1, y * TILE_SIZE + 1, TILE_SIZE * 3 - 2, TILE_SIZE - 2);
        } else {
            ctx.strokeRect(x * TILE_SIZE + 1, (y - 1) * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE * 3 - 2);
        }
        ctx.lineWidth = 1;
    }
};

/** Used by setSelectedDoorTarget on RoomCanvas — kept here for cohesion. */
export function applyDoorTarget(
    host: LayoutTargetHost,
    targetRoomId: string
): void {
    const room = host.currentRoom();
    const index = host.getSelectedIndex("doors");
    if (!room || index == null || !targetRoomId) return;
    const exit = room.exits[index];
    if (!exit) return;
    exit.targetRoom = targetRoomId;
    const spawn = spawnForExit(exit, host.workingRooms[targetRoomId], host.gridSize());
    exit.spawnX = spawn.spawnX;
    exit.spawnY = spawn.spawnY;
    host.markDirty(room);
    host.syncTextarea(room.id);
}

/** Used by addDoorAtTile on RoomCanvas. */
export function pushDoorAtTile(host: LayoutTargetHost, tileX: number, tileY: number): void {
    const room = host.currentRoom();
    const targetRoomId = host.doorTargetRoomSelect.value;
    if (!room || !targetRoomId) return;
    room.exits.push(
        exitFromNearestWall(tileX, tileY, host.gridSize(), targetRoomId, host.workingRooms[targetRoomId])
    );
    host.clearSelectionsExcept("doors");
    host.setSelectedIndex("doors", room.exits.length - 1);
    host.markDirty(room);
    host.syncTextarea(room.id);
}
