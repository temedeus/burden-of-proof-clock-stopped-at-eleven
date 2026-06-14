import { doorsHandler } from "./doorsHandler";
import { furnitureHandler } from "./furnitureHandler";
import { npcHandler } from "./npcHandler";
import type { ActiveDrag, LayoutTarget, LayoutTargetHandler } from "./types";

export type { ActiveDrag, LayoutTarget, LayoutTargetHandler, LayoutTargetHost, PointerContext } from "./types";
export { applyDoorTarget, doorsHandler, pushDoorAtTile } from "./doorsHandler";
export { furnitureHandler } from "./furnitureHandler";
export { npcHandler } from "./npcHandler";

const handlers: Record<LayoutTarget, LayoutTargetHandler> = {
    furniture: furnitureHandler,
    npc: npcHandler,
    doors: doorsHandler
};

export function getLayoutHandler(target: LayoutTarget): LayoutTargetHandler {
    return handlers[target];
}

export function handlerForDrag(drag: ActiveDrag): LayoutTargetHandler {
    if (drag.kind === "furniture") return furnitureHandler;
    if (drag.kind === "npc") return npcHandler;
    return doorsHandler;
}

export function drawAllSelectionHighlights(
    ctx: CanvasRenderingContext2D,
    room: import("@cse/content-schema").RoomConfig,
    grid: { width: number; height: number },
    host: import("./types").LayoutTargetHost
): void {
    for (const handler of Object.values(handlers)) {
        handler.drawSelectionHighlight(ctx, room, grid, host);
    }
}
