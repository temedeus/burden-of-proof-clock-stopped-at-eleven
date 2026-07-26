import { P } from "./palette";
import { r } from "./pixel";

const NATIVE_W = 56;
const NATIVE_H = 40;

/** Stable 0..1 phase from tile position (varies pan timing per stove). */
export function kitchenStoveAnimPhase(tileX: number, tileY: number): number {
    return ((tileX * 17 + tileY * 31) % 100) / 100;
}

function hash01(n: number): number {
    const x = Math.sin(n * 127.1) * 43758.5453;
    return x - Math.floor(x);
}

/** Iron range body (no pans / steam). */
function drawStoveBody(ctx: CanvasRenderingContext2D): void {
    // Cast-iron back plate
    r(ctx, 4, 2, 48, 14, P.shadow);
    r(ctx, 6, 4, 44, 10, P.outline);
    r(ctx, 8, 6, 40, 6, P.black);

    // Warm ember glow under the cooktop
    r(ctx, 10, 12, 14, 3, P.fireRed);
    r(ctx, 32, 12, 14, 3, P.fireRed);
    r(ctx, 12, 13, 10, 1, P.fireOrange);
    r(ctx, 34, 13, 10, 1, P.fireOrange);

    // Cooktop
    r(ctx, 2, 14, 52, 8, P.outline);
    r(ctx, 4, 15, 48, 6, P.shadow);
    r(ctx, 6, 16, 20, 4, P.black);
    r(ctx, 30, 16, 20, 4, P.black);

    // Burner rings
    r(ctx, 10, 16, 12, 4, P.outline);
    r(ctx, 12, 17, 8, 2, P.black);
    r(ctx, 34, 16, 12, 4, P.outline);
    r(ctx, 36, 17, 8, 2, P.black);

    // Oven body
    r(ctx, 6, 22, 44, 16, P.shadow);
    r(ctx, 8, 24, 40, 12, P.outline);
    r(ctx, 10, 26, 36, 8, P.black);
    r(ctx, 12, 28, 14, 4, P.shadow);
    r(ctx, 30, 28, 14, 4, P.shadow);
    // Handle
    r(ctx, 24, 30, 8, 2, P.stoneHi);
    r(ctx, 26, 29, 4, 1, P.cream);

    // Feet
    r(ctx, 8, 37, 4, 3, P.black);
    r(ctx, 44, 37, 4, 3, P.black);
}

function drawPan(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    flip: number,
    tint: string
): void {
    const lift = Math.floor(flip * 5);
    const tilt = Math.floor(flip * 3);
    const y = cy - lift;
    const x = cx + (tilt % 2 === 0 ? tilt : -tilt);

    // Pan body
    r(ctx, x - 5, y, 11, 3, P.outline);
    r(ctx, x - 4, y + 1, 9, 2, tint);
    r(ctx, x - 3, y + 1, 7, 1, P.black);
    // Handle
    r(ctx, x + 5, y + 1, 6, 1, P.woodDark);
    r(ctx, x + 10, y, 2, 3, P.wood);
    // Food blob when not mid-flip
    if (flip < 0.45) {
        r(ctx, x - 2, y, 4, 1, P.fireOrange);
    }
}

/**
 * Pan flip progress 0..1. Each stove flips on its own 2–3s cadence.
 */
function panFlipProgress(animTime: number, phase: number, panIndex: number): number {
    const interval = 2.05 + phase * 0.95 + panIndex * 0.35; // ~2–3.3s
    const offset = phase * 7.3 + panIndex * 1.7;
    const local = (animTime + offset) % interval;
    const flipDur = 0.38;
    if (local < flipDur) {
        return Math.sin((local / flipDur) * Math.PI);
    }
    return 0;
}

function drawSteam(
    ctx: CanvasRenderingContext2D,
    animTime: number,
    phase: number,
    originX: number,
    originY: number
): void {
    const steam = ["#d8dce4", "#c4c8d0", "#e8ecf2"];
    for (let i = 0; i < 5; i++) {
        const seed = phase * 40 + i * 9.1;
        const cycle = 1.4 + hash01(seed) * 0.9;
        const t = (animTime * (0.55 + hash01(seed + 1) * 0.35) + seed) % cycle;
        const rise = t / cycle;
        const alpha = Math.max(0, 1 - rise);
        if (alpha < 0.08) continue;
        const sway = Math.sin(animTime * 2.2 + seed) * 2;
        const x = Math.floor(originX + sway + (hash01(seed + 2) - 0.5) * 4);
        const y = Math.floor(originY - rise * 14);
        const w = 2 + (i % 2);
        const h = 2 + Math.floor((1 - rise) * 2);
        ctx.globalAlpha = alpha * 0.55;
        r(ctx, x, y, w, h, steam[i % steam.length]);
    }
    ctx.globalAlpha = 1;
}

function drawStoveAnimated(ctx: CanvasRenderingContext2D, animTime: number, phase: number): void {
    drawStoveBody(ctx);

    const flipL = panFlipProgress(animTime, phase, 0);
    const flipR = panFlipProgress(animTime, phase, 1);
    drawPan(ctx, 16, 15, flipL, P.shadow);
    drawPan(ctx, 40, 15, flipR, P.outline);

    drawSteam(ctx, animTime, phase, 14, 12);
    drawSteam(ctx, animTime, phase + 0.37, 38, 11);
}

/** Full kitchen stove with flipping pans and steam (game runtime). */
export function drawKitchenStoveAnimated(
    ctx: CanvasRenderingContext2D,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
    animTime: number,
    phase = 0
): void {
    const prev = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    ctx.translate(dx, dy);
    ctx.scale(dw / NATIVE_W, dh / NATIVE_H);
    drawStoveAnimated(ctx, animTime, phase);
    ctx.restore();
    ctx.imageSmoothingEnabled = prev;
}
