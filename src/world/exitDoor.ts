import { tileBounds } from "./interactableTiles";
import type { Interactable } from "./Interactable";
import type { DoorExit } from "./Room";

function exitOverlapsDecorAtOpening(
    interactables: Interactable[],
    exit: Pick<DoorExit, "x" | "y">,
    roomWidth: number,
    roomHeight: number,
    include: (obj: Interactable) => boolean
): boolean {
    const isTopOrBottom = exit.y === 0 || exit.y === roomHeight - 1;

    for (const obj of interactables) {
        if (!include(obj)) continue;

        const bounds = tileBounds(obj.tiles.length > 0 ? obj.tiles : obj.footprintTiles ?? []);
        if (!bounds) continue;

        if (isTopOrBottom) {
            const onWall =
                (exit.y === 0 && bounds.minY <= 2) || (exit.y === roomHeight - 1 && bounds.maxY >= roomHeight - 2);
            if (!onWall) continue;
            const doorLeft = exit.x - 1;
            const doorRight = exit.x + 1;
            if (bounds.maxX >= doorLeft && bounds.minX <= doorRight) return true;
        } else {
            const onWall =
                (exit.x === 0 && bounds.minX <= 2) || (exit.x === roomWidth - 1 && bounds.maxX >= roomWidth - 2);
            if (!onWall) continue;
            const doorTop = exit.y - 1;
            const doorBottom = exit.y + 1;
            if (bounds.maxY >= doorTop && bounds.minY <= doorBottom) return true;
        }
    }
    return false;
}

/** True when a wall-aligned decor or staircase blocks the door opening. */
export function exitOverlapsWallDecor(
    interactables: Interactable[],
    exit: Pick<DoorExit, "x" | "y">,
    roomWidth: number,
    roomHeight: number
): boolean {
    return exitOverlapsDecorAtOpening(
        interactables,
        exit,
        roomWidth,
        roomHeight,
        (obj) => obj.spriteName === "staircase" || obj.wallAlign === "north" || obj.wallAlign === "south"
    );
}

/** True when solid wall decor (e.g. fireplace) should replace door tiles with wall. */
export function exitSkipsDoorTiles(
    interactables: Interactable[],
    exit: Pick<DoorExit, "x" | "y">,
    roomWidth: number,
    roomHeight: number
): boolean {
    return exitOverlapsDecorAtOpening(
        interactables,
        exit,
        roomWidth,
        roomHeight,
        (obj) => !obj.walkableDecor && (obj.wallAlign === "north" || obj.wallAlign === "south")
    );
}

export function exitSkipsDoorSprite(
    exit: DoorExit,
    interactables: Interactable[],
    roomWidth: number,
    roomHeight: number
): boolean {
    if (exit.skipDoorSprite) return true;
    return exitOverlapsWallDecor(interactables, exit, roomWidth, roomHeight);
}
