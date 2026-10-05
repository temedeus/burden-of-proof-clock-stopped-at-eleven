import { P } from "./palette";
import { r } from "./pixel";

/** Native size; drawn at 2x into the 4x3-tile stove box. */
const NATIVE_W = 64;
const NATIVE_H = 48;

/** Stable 0..1 phase from tile position (varies pan timing per stove). */
export function kitchenStoveAnimPhase(tileX: number, tileY: number): number {
    return ((tileX * 17 + tileY * 31) % 100) / 100;
}

function hash01(n: number): number {
    const x = Math.sin(n * 127.1) * 43758.5453;
    return x - Math.floor(x);
}

const IRON = { o: "#0c0c0e", d: "#1c1c20", m: "#2c2c32", l: "#44444c", h: "#6a6a74" };
const STEEL = { d: "#6a7078", m: "#9aa2aa", h: "#d0d6dc" };
const BRASS = { d: P.goldDark, m: P.gold, h: "#ecd27a" };

/** Victorian cast-iron range: plate rack, hob with hotplates, two ovens and a firebox. */
function drawStoveBody(ctx: CanvasRenderingContext2D, animTime: number, phase: number): void {
    // Floor shadow
    r(ctx, 3, 45, 58, 2, "rgba(0,0,0,0.3)");
    r(ctx, 6, 47, 52, 1, "rgba(0,0,0,0.3)");

    // Back plate / warming shelf with hanging utensils
    r(ctx, 6, 0, 52, 13, IRON.o);
    r(ctx, 7, 1, 50, 11, IRON.d);
    r(ctx, 7, 1, 50, 2, IRON.l);
    r(ctx, 7, 3, 50, 1, IRON.m);
    // Copper pans and a ladle hanging from the rail
    r(ctx, 12, 5, 6, 5, "#8a4422");
    r(ctx, 13, 5, 4, 1, "#d08a58");
    r(ctx, 14, 4, 2, 1, IRON.h);
    r(ctx, 22, 4, 1, 6, STEEL.m);
    r(ctx, 21, 9, 3, 2, STEEL.m);
    r(ctx, 44, 5, 8, 5, "#8a4422");
    r(ctx, 45, 5, 6, 1, "#d08a58");
    r(ctx, 47, 4, 2, 1, IRON.h);
    r(ctx, 36, 4, 1, 5, STEEL.d);
    r(ctx, 35, 8, 3, 1, STEEL.m);

    // Hob top (seen from above) with a polished steel front rail
    r(ctx, 3, 13, 58, 9, IRON.o);
    r(ctx, 4, 14, 56, 7, IRON.m);
    r(ctx, 4, 14, 56, 1, IRON.l);
    r(ctx, 3, 21, 58, 2, STEEL.m);
    r(ctx, 3, 21, 58, 1, STEEL.h);
    // Hotplates with a breathing ember glow
    const glow = 0.55 + 0.45 * Math.sin(animTime * 3 + phase * 6.28);
    for (const cx of [16, 32, 48]) {
        r(ctx, cx - 6, 15, 12, 5, IRON.o);
        r(ctx, cx - 5, 16, 10, 3, IRON.d);
        r(ctx, cx - 3, 17, 6, 1, glow > 0.5 ? P.fireRed : "#5a1a10");
    }

    // Front: left oven, central firebox, right oven
    r(ctx, 4, 23, 56, 20, IRON.o);
    r(ctx, 5, 23, 54, 19, IRON.d);
    for (const ox of [6, 40]) {
        r(ctx, ox, 25, 18, 15, IRON.o);
        r(ctx, ox + 1, 25, 16, 14, IRON.m);
        r(ctx, ox + 1, 25, 16, 1, IRON.h);
        r(ctx, ox + 3, 28, 12, 8, IRON.d);
        r(ctx, ox + 3, 28, 12, 1, IRON.l);
        // Brass door bar + temperature dial
        r(ctx, ox + 3, 37, 12, 1, BRASS.m);
        r(ctx, ox + 8, 26, 2, 1, BRASS.d);
        r(ctx, ox + 8, 31, 2, 2, BRASS.m);
    }
    // Firebox with glowing coals behind a grille
    r(ctx, 25, 25, 14, 15, IRON.o);
    r(ctx, 26, 26, 12, 7, "#1a0806");
    const flick = Math.floor(animTime * 8 + phase * 10) % 3;
    r(ctx, 27, 29, 10, 3, P.fireRed);
    r(ctx, 28 + flick, 29, 4, 2, P.fireOrange);
    r(ctx, 30 - flick, 30, 3, 1, P.fireYellow);
    for (let x = 27; x < 38; x += 2) r(ctx, x, 26, 1, 7, IRON.l);
    // Ash pit door
    r(ctx, 26, 34, 12, 5, IRON.m);
    r(ctx, 26, 34, 12, 1, IRON.h);
    r(ctx, 31, 36, 2, 1, BRASS.m);

    // Brass towel rail with a tea towel
    r(ctx, 4, 41, 56, 1, BRASS.m);
    r(ctx, 4, 41, 56, 1, BRASS.h);
    r(ctx, 12, 41, 7, 4, "#e8dcc8");
    r(ctx, 12, 43, 7, 1, "#a83a32");

    // Plinth + feet
    r(ctx, 4, 42, 56, 2, IRON.o);
    r(ctx, 5, 44, 4, 2, IRON.o);
    r(ctx, 55, 44, 4, 2, IRON.o);
}

function drawPan(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    flip: number,
    tint: string
): void {
    const lift = Math.floor(flip * 6);
    const y = cy - lift;
    // Iron frying pan seen from above-front
    r(ctx, cx - 5, y, 11, 4, IRON.o);
    r(ctx, cx - 4, y, 9, 3, tint);
    r(ctx, cx - 3, y + 1, 7, 1, IRON.d);
    r(ctx, cx + 6, y + 1, 6, 1, "#5a3a1e");
    r(ctx, cx + 11, y, 2, 2, "#7a5230");
    // Food: tossed when flipping
    if (flip < 0.35) {
        r(ctx, cx - 2, y + 1, 4, 1, "#d8a040");
    } else {
        r(ctx, cx - 1, y - 3 - Math.floor(flip * 3), 3, 1, "#d8a040");
    }
}

/** Stock pot with a rattling lid on the right hotplate. */
function drawPot(ctx: CanvasRenderingContext2D, cx: number, cy: number, animTime: number, phase: number): void {
    const rattle = Math.sin(animTime * 18 + phase * 9) > 0.7 ? 1 : 0;
    r(ctx, cx - 6, cy - 6, 12, 8, "#8a4422");
    r(ctx, cx - 5, cy - 6, 3, 8, "#d08a58");
    r(ctx, cx - 6, cy + 1, 12, 1, "#4a2010");
    r(ctx, cx - 7, cy - 7 - rattle, 14, 2, STEEL.m);
    r(ctx, cx - 1, cy - 9 - rattle, 2, 2, STEEL.h);
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
    drawStoveBody(ctx, animTime, phase);

    const flipL = panFlipProgress(animTime, phase, 0);
    const flipM = panFlipProgress(animTime, phase, 1);
    drawPan(ctx, 15, 15, flipL, IRON.l);
    drawPan(ctx, 31, 15, flipM, IRON.m);
    drawPot(ctx, 48, 18, animTime, phase);

    drawSteam(ctx, animTime, phase, 47, 8);
    drawSteam(ctx, animTime, phase + 0.37, 16, 12);
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
