import { SIDE_OPENING_HEIGHT } from "../assets/procedural/doors";
import { TILE_SIZE } from "../world/constants";
import type { DoorExit, Room } from "../world/Room";
import type { DepthActor } from "./roomScene";

const WOOD = "#6e4526";
const WOOD_LIGHT = "#946036";
const WOOD_DARK = "#3c2414";
const IRON = "#2b2a2e";
const IRON_LIGHT = "#55545c";

/** Horizontal plank with iron brackets at each end (north/south doors). */
function drawHorizontalBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
    const h = 8;
    ctx.fillStyle = WOOD_DARK;
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = WOOD;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = WOOD_LIGHT;
    ctx.fillRect(x, y, w, 2);
    // Grain streaks
    ctx.fillStyle = WOOD_DARK;
    for (let gx = x + 7; gx < x + w - 6; gx += 13) ctx.fillRect(gx, y + 4, 6, 1);
    for (const bx of [x + 4, x + w - 10]) {
        ctx.fillStyle = IRON;
        ctx.fillRect(bx, y - 3, 6, h + 6);
        ctx.fillStyle = IRON_LIGHT;
        ctx.fillRect(bx + 1, y - 2, 1, h + 4);
    }
}

/** Vertical plank across a side doorway, seen edge-on from the room. */
function drawVerticalBar(ctx: CanvasRenderingContext2D, x: number, y: number, h: number): void {
    const w = 8;
    ctx.fillStyle = WOOD_DARK;
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = WOOD;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = WOOD_LIGHT;
    ctx.fillRect(x, y, 2, h);
    ctx.fillStyle = WOOD_DARK;
    for (let gy = y + 7; gy < y + h - 6; gy += 13) ctx.fillRect(x + 4, gy, 1, 6);
    for (const by of [y + 4, y + h - 10]) {
        ctx.fillStyle = IRON;
        ctx.fillRect(x - 3, by, w + 6, 6);
        ctx.fillStyle = IRON_LIGHT;
        ctx.fillRect(x - 2, by + 1, w + 4, 1);
    }
}

/** Where the bar sits across this door, as a draw rect in room pixels. */
function doorBarRect(room: Room, exit: DoorExit): { x: number; y: number; w: number; h: number; vertical: boolean } {
    const T = TILE_SIZE;
    const H = room.map.height;
    if (exit.y === 0 || exit.y === H - 1) {
        const isNorth = exit.y !== H - 1;
        const depth = isNorth ? Math.max(1, room.northWallThickness) : 1;
        const y0 = exit.y * T;
        const y = isNorth ? y0 + Math.round(depth * T * 0.55) : y0 + Math.round(T * 0.3);
        return { x: (exit.x - 1) * T - 3, y, w: 3 * T + 6, h: 8, vertical: false };
    }
    const y0 = (exit.y - 1) * T;
    const oy = y0 + Math.round((3 * T - SIDE_OPENING_HEIGHT) / 2);
    return { x: exit.x * T + Math.round(T / 2) - 4, y: oy - 5, w: 8, h: SIDE_OPENING_HEIGHT + 10, vertical: true };
}

/** Centre of the bar's resting spot across this door (room pixels). */
export function doorBarCenter(room: Room, exit: DoorExit): { x: number; y: number } {
    const r = doorBarRect(room, exit);
    return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

/**
 * The bar in Ytte's hands, centred at (cx, cy): held level, swinging upright as
 * `settleT` (0..1) carries it into a side door's slot.
 */
export function carriedDoorBarActor(
    room: Room,
    exit: DoorExit,
    cx: number,
    cy: number,
    settleT: number,
    sortY: number
): DepthActor {
    const r = doorBarRect(room, exit);
    const length = r.vertical ? r.h : r.w;
    const angle = r.vertical ? (Math.PI / 2) * settleT : 0;
    return {
        y: sortY,
        height: 0,
        render: (ctx) => {
            ctx.save();
            ctx.translate(Math.round(cx), Math.round(cy));
            ctx.rotate(angle);
            drawHorizontalBar(ctx, -Math.round(length / 2), -4, length);
            ctx.restore();
        }
    };
}

/**
 * Depth actor for the wooden bar Ytte drops across a door. `shake` (0..1) rattles it
 * while the detective pries it loose.
 */
export function doorBarActor(room: Room, exit: DoorExit, shake: number, time: number): DepthActor {
    const T = TILE_SIZE;
    const H = room.map.height;
    const jitter = shake > 0 ? Math.round(Math.sin(time * 55) * (0.6 + shake * 1.6)) : 0;
    const r = doorBarRect(room, exit);
    const isTopOrBottom = exit.y === 0 || exit.y === H - 1;
    const depth = exit.y === 0 ? Math.max(1, room.northWallThickness) : 1;
    const sort = isTopOrBottom ? { y: exit.y * T, height: depth * T } : { y: (exit.y - 1) * T, height: 3 * T };
    return {
        ...sort,
        render: (ctx) =>
            r.vertical
                ? drawVerticalBar(ctx, r.x, r.y + jitter, r.h)
                : drawHorizontalBar(ctx, r.x + jitter, r.y, r.w)
    };
}
