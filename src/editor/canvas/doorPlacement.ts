import type { RoomConfig } from "@cse/content-schema";
import { resolveExitPosition } from "./hitTest";

export type DoorGhost = {
    orientation: "horizontal" | "vertical";
    wall: "top" | "bottom" | "left" | "right";
    x: number;
    y: number;
};

export type WallSide = "top" | "bottom" | "left" | "right";

type RoomExitDraft = RoomConfig["exits"][number];

export function nearestWallPlacement(
    tileX: number,
    tileY: number,
    grid: { width: number; height: number }
): { x: number | "top" | "bottom"; y: number | "center" | "top" | "bottom"; side: WallSide } {
    const dTop = tileY;
    const dBottom = grid.height - 1 - tileY;
    const dLeft = tileX;
    const dRight = grid.width - 1 - tileX;
    const minDist = Math.min(dTop, dBottom, dLeft, dRight);
    if (minDist === dTop) return { x: tileX, y: "top", side: "top" };
    if (minDist === dBottom) return { x: tileX, y: "bottom", side: "bottom" };
    if (minDist === dLeft) return { x: "top", y: "center", side: "left" };
    return { x: "bottom", y: "center", side: "right" };
}

export function autoSpawnForTargetRoom(
    targetRoom: RoomConfig | undefined,
    side: WallSide,
    alignTile: number
): { spawnX: number | "center"; spawnY: number | "center" } {
    if (!targetRoom) return { spawnX: "center", spawnY: "center" };
    const width = targetRoom.width;
    const height = targetRoom.height;
    const clampedX = Math.max(2, Math.min(width - 3, alignTile));
    const clampedY = Math.max(2, Math.min(height - 3, alignTile));
    if (side === "top") return { spawnX: clampedX, spawnY: 2 };
    if (side === "bottom") return { spawnX: clampedX, spawnY: height - 3 };
    if (side === "left") return { spawnX: 2, spawnY: clampedY };
    return { spawnX: width - 3, spawnY: clampedY };
}

export function buildDoorGhost(
    tileX: number,
    tileY: number,
    grid: { width: number; height: number },
    startTile: { x: number; y: number } | null
): DoorGhost {
    const dx = startTile ? tileX - startTile.x : 0;
    const dy = startTile ? tileY - startTile.y : 0;
    const orientation: DoorGhost["orientation"] = Math.abs(dx) >= Math.abs(dy) ? "horizontal" : "vertical";

    if (orientation === "horizontal") {
        const wall: DoorGhost["wall"] = tileY <= grid.height - 1 - tileY ? "top" : "bottom";
        return {
            orientation,
            wall,
            x: Math.max(1, Math.min(grid.width - 2, tileX)),
            y: wall === "top" ? 0 : grid.height - 1
        };
    }

    const wall: DoorGhost["wall"] = tileX <= grid.width - 1 - tileX ? "left" : "right";
    return {
        orientation,
        wall,
        x: wall === "left" ? 0 : grid.width - 1,
        y: Math.max(1, Math.min(grid.height - 2, tileY))
    };
}

export function exitWallSide(
    exitX: number,
    exitY: number,
    grid: { width: number; height: number }
): WallSide {
    if (exitY === 0) return "top";
    if (exitY === grid.height - 1) return "bottom";
    if (exitX === 0) return "left";
    return "right";
}

export function spawnForExit(
    exit: RoomExitDraft,
    targetRoom: RoomConfig | undefined,
    grid: { width: number; height: number }
): { spawnX: RoomExitDraft["spawnX"]; spawnY: RoomExitDraft["spawnY"] } {
    const x = resolveExitPosition(exit.x as number | "center" | "top" | "bottom", grid.width);
    const y = resolveExitPosition(exit.y as number | "center" | "top" | "bottom", grid.height);
    const side = exitWallSide(x, y, grid);
    const align = side === "top" || side === "bottom" ? x : y;
    return autoSpawnForTargetRoom(targetRoom, side, align);
}

export function exitFromNearestWall(
    tileX: number,
    tileY: number,
    grid: { width: number; height: number },
    targetRoomId: string,
    targetRoom: RoomConfig | undefined
): RoomExitDraft {
    const placement = nearestWallPlacement(tileX, tileY, grid);
    const align = placement.side === "top" || placement.side === "bottom" ? tileX : tileY;
    const spawn = autoSpawnForTargetRoom(targetRoom, placement.side, align);
    return {
        x: placement.x as RoomExitDraft["x"],
        y: placement.y as RoomExitDraft["y"],
        targetRoom: targetRoomId,
        spawnX: spawn.spawnX as RoomExitDraft["spawnX"],
        spawnY: spawn.spawnY as RoomExitDraft["spawnY"]
    };
}

export function exitFromGhost(
    ghost: DoorGhost,
    targetRoomId: string,
    targetRoom: RoomConfig | undefined
): RoomExitDraft {
    const align = ghost.orientation === "horizontal" ? ghost.x : ghost.y;
    const spawn = autoSpawnForTargetRoom(targetRoom, ghost.wall, align);
    return {
        x: (ghost.orientation === "horizontal"
            ? ghost.x
            : ghost.wall === "left"
              ? "top"
              : "bottom") as RoomExitDraft["x"],
        y: (ghost.orientation === "horizontal"
            ? ghost.wall === "top"
                ? "top"
                : "bottom"
            : ghost.y) as RoomExitDraft["y"],
        targetRoom: targetRoomId,
        spawnX: spawn.spawnX as RoomExitDraft["spawnX"],
        spawnY: spawn.spawnY as RoomExitDraft["spawnY"]
    };
}
