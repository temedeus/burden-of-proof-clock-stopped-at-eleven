import { P } from "./palette";
import { discCrisp, hline, p, r, vline } from "./pixel";
import { ellipse, floorShadow } from "./furnitureKit";

/** Native size; drawn at 2x into the 4x3-tile fountain box. */
export const FOUNTAIN_W = 64;
export const FOUNTAIN_H = 48;

const RIM = { o: "#4a4640", d: "#7a766c", m: "#9a958a", l: "#b8b3a6", h: "#d4d0c4" };
const WATER = { deep: "#2a5a7a", mid: "#3a7a9a", light: "#6aaac8", hi: "#c8ecf8" };

/** Stone basin, pedestal and upper bowl (no moving water). */
export function drawFountainStone(ctx: CanvasRenderingContext2D): void {
    const cx = 32;
    floorShadow(ctx, 3, 45, 58, 2);
    // Basin outer wall (front face) below the rim
    ellipse(ctx, cx, 36, 30, 9, RIM.o);
    r(ctx, 2, 36, 60, 6, RIM.o);
    ellipse(ctx, cx, 41, 30, 4, RIM.o);
    r(ctx, 3, 36, 58, 6, RIM.d);
    ellipse(ctx, cx, 41, 29, 3, RIM.d);
    for (let x = 6; x < 60; x += 8) vline(ctx, x, 37, 6, RIM.o);
    hline(ctx, 3, 36, 58, RIM.m);
    // Rim top
    ellipse(ctx, cx, 34, 30, 9, RIM.m);
    ellipse(ctx, cx, 33.5, 30, 8.5, RIM.l);
    ellipse(ctx, cx - 1, 33, 26, 6.5, RIM.h);
    // Water surface
    ellipse(ctx, cx, 34, 26, 6.5, WATER.deep);
    ellipse(ctx, cx, 33.5, 24, 5.5, WATER.mid);
    // Pedestal rising from the water
    r(ctx, cx - 3, 16, 6, 18, RIM.o);
    r(ctx, cx - 2, 16, 4, 18, RIM.m);
    vline(ctx, cx - 2, 16, 18, RIM.h);
    ellipse(ctx, cx, 33, 5, 2, RIM.d);
    // Upper bowl
    ellipse(ctx, cx, 14, 11, 4, RIM.o);
    ellipse(ctx, cx, 13.5, 10, 3, RIM.l);
    ellipse(ctx, cx, 13, 8, 2, WATER.mid);
    r(ctx, cx - 10, 14, 21, 2, RIM.d);
    ellipse(ctx, cx, 16, 9, 2, RIM.d);
    // Finial / spout
    r(ctx, cx - 1, 4, 3, 9, RIM.o);
    vline(ctx, cx, 4, 9, RIM.l);
    discCrisp(ctx, cx, 4, 2, RIM.m);
    p(ctx, cx - 1, 3, RIM.h);
}

function drawFountainWater(ctx: CanvasRenderingContext2D, t: number): void {
    const cx = 32;
    // Jet above the finial
    const jet = 3 + Math.round(Math.sin(t * 5) * 1);
    vline(ctx, cx, 2 - jet, jet, WATER.hi);
    p(ctx, cx - 1, 2 - jet, WATER.light);
    p(ctx, cx + 1, 2 - jet, WATER.light);
    // Overflow sheets from the upper bowl into the basin
    for (const side of [-1, 1]) {
        const x0 = cx + side * 10;
        for (let y = 15; y < 32; y++) {
            const k = (y - 15) / 17;
            const x = x0 + side * Math.round(k * k * 4);
            const flick = (Math.floor(t * 14) + y) % 5 === 0;
            p(ctx, x, y, flick ? WATER.hi : WATER.light);
        }
    }
    // Falling drops
    const phase = (t * 1.6) % 1;
    for (let i = 0; i < 4; i++) {
        const k = (phase + i * 0.25) % 1;
        const side = i % 2 === 0 ? -1 : 1;
        const y = 15 + Math.floor(k * 17);
        p(ctx, cx + side * (7 + Math.round(k * 3)), y, WATER.hi);
    }
    // Ripple rings where the water lands
    const rip = (t * 0.8) % 1;
    for (const side of [-1, 1]) {
        const rx = 2 + Math.round(rip * 5);
        hline(ctx, cx + side * 14 - rx, 33, rx * 2, rip < 0.7 ? WATER.light : WATER.mid);
    }
    // Sparkles
    const seed = Math.floor(t * 8);
    for (let i = 0; i < 4; i++) {
        if ((seed + i) % 3 !== 0) continue;
        p(ctx, 12 + ((seed * 7 + i * 13) % 40), 31 + ((seed * 3 + i * 5) % 5), WATER.hi);
    }
}

/** Stone fountain with trickling water (game runtime). */
export function drawFountainAnimated(
    ctx: CanvasRenderingContext2D,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
    animTime: number
): void {
    const prev = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    ctx.translate(dx, dy);
    ctx.scale(dw / FOUNTAIN_W, dh / FOUNTAIN_H);
    drawFountainStone(ctx);
    drawFountainWater(ctx, animTime);
    ctx.restore();
    ctx.imageSmoothingEnabled = prev;
}
