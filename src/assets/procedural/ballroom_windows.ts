import { P } from "./palette";
import { r } from "./pixel";
import { TILE_SIZE } from "../../world/constants";

const WINDOW_COUNT = 6;
const FRAME = 4;
const MULLION = 5;

function drawBarrelArchTop(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    archH: number,
    color: string
): void {
    const cx = x + w / 2;
    const rx = w / 2;
    for (let row = 0; row < archH; row++) {
        const t = row / Math.max(1, archH - 1);
        const span = rx * Math.sqrt(Math.max(0, 1 - (1 - t) * (1 - t)));
        const left = Math.ceil(cx - span);
        const right = Math.floor(cx + span);
        if (right >= left) {
            r(ctx, left, y + row, right - left + 1, 1, color);
        }
    }
}

function drawArchedWindow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
): void {
    const archH = Math.floor(h * 0.42);
    const bodyTop = y + archH - 2;
    const bodyH = h - archH + 2;

    r(ctx, x, bodyTop, w, bodyH, P.paleWallTrim);
    r(ctx, x + 1, bodyTop + 1, w - 2, bodyH - 2, P.paleWallGold);

    drawBarrelArchTop(ctx, x, y, w, archH, P.paleWallTrim);
    drawBarrelArchTop(ctx, x + 1, y + 1, w - 2, Math.max(2, archH - 2), P.paleWallGold);

    const glassX = x + FRAME;
    const glassW = w - FRAME * 2;
    const glassY = y + Math.floor(archH * 0.35);
    const glassH = bodyTop + bodyH - FRAME - glassY;

    r(ctx, glassX, glassY, glassW, glassH, "#5a6a78");
    r(ctx, glassX + 2, glassY + 2, glassW - 4, Math.max(2, Math.floor(glassH * 0.25)), "#7a8a98");
    r(ctx, glassX + Math.floor(glassW * 0.15), glassY + 4, 2, glassH - 8, "#9aaab0");
    r(ctx, glassX + Math.floor(glassW * 0.55), glassY + 6, 1, glassH - 12, "#9aaab0");

    drawBarrelArchTop(ctx, glassX, glassY - Math.floor(archH * 0.35), glassW, archH, "#5a6a78");
    drawBarrelArchTop(ctx, glassX + 2, glassY - Math.floor(archH * 0.35) + 2, glassW - 4, Math.max(2, archH - 4), "#7a8a98");

    r(ctx, x + Math.floor(w / 2) - 1, glassY, 2, glassH, P.paleWallTrim);
    r(ctx, x, bodyTop + bodyH - FRAME, w, FRAME, P.paleWallGold);
}

/** Six large arched clerestory windows above the ballroom north wall. */
export function drawBallroomClerestoryWindows(
    ctx: CanvasRenderingContext2D,
    roomWidth: number,
    northWallRow: number
): void {
    const left = TILE_SIZE;
    const right = roomWidth * TILE_SIZE - TILE_SIZE;
    const bandTop = 0;
    const bandBottom = northWallRow * TILE_SIZE;
    const innerW = right - left;

    r(ctx, left, bandTop, innerW, bandBottom, P.black);

    const winW = (innerW - MULLION * (WINDOW_COUNT - 1)) / WINDOW_COUNT;
    const winH = bandBottom + 6;

    for (let i = 0; i < WINDOW_COUNT; i++) {
        const x = left + i * (winW + MULLION);
        drawArchedWindow(ctx, x, bandTop + 2, winW, winH);
    }
}
