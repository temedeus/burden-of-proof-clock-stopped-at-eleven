import { P } from "./palette";
import { r } from "./pixel";

const NATIVE_W = 48;
const NATIVE_H = 52;

/** Stone basin and pedestal (no moving water). */
export function drawFountainStone(ctx: CanvasRenderingContext2D): void {
    r(ctx, 8, 40, 32, 10, P.stone);
    r(ctx, 12, 32, 24, 10, P.stoneLight);
    r(ctx, 20, 16, 8, 18, P.stone);
    r(ctx, 18, 8, 12, 10, P.stoneLight);
    r(ctx, 4, 44, 40, 6, P.water);
    r(ctx, 8, 46, 32, 3, P.waterLight);
}

function drawFountainWater(ctx: CanvasRenderingContext2D, t: number): void {
    const sway = Math.sin(t * 3.2) * 1.2;
    const spoutX = 22 + Math.floor(sway);
    const spoutH = 5 + Math.floor(Math.sin(t * 5) * 1.5);

    r(ctx, spoutX, 6 - spoutH, 4, spoutH + 2, P.waterHi);
    r(ctx, spoutX + 1, 8, 2, 10, P.waterLight);

    const dropPhase = (t * 9) % 1;
    for (let i = 0; i < 3; i++) {
        const phase = (dropPhase + i * 0.33) % 1;
        const dy = 10 + Math.floor(phase * 28);
        const dx = spoutX + 1 + (i === 1 ? 1 : 0);
        if (phase < 0.92) {
            r(ctx, dx, dy, 2, 2, P.waterHi);
        }
    }

    const rippleOffset = Math.floor(Math.sin(t * 4) * 3);
    const ripples = [
        { y: 47, w: 28, phase: 0 },
        { y: 49, w: 22, phase: 1.4 }
    ];
    for (const rip of ripples) {
        const x = 10 + rippleOffset + Math.floor(Math.sin(t * 6 + rip.phase) * 2);
        r(ctx, x, rip.y, rip.w, 1, P.waterHi);
        r(ctx, x + 4, rip.y + 1, rip.w - 8, 1, P.waterLight);
    }

    const sparkleSeed = Math.floor(t * 10);
    for (let i = 0; i < 4; i++) {
        if ((sparkleSeed + i * 2) % 4 !== 0) continue;
        const sx = 10 + ((sparkleSeed * 5 + i * 13) % 26);
        const sy = 45 + ((sparkleSeed * 3 + i * 7) % 3);
        r(ctx, sx, sy, 2, 1, P.waterHi);
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
    ctx.scale(dw / NATIVE_W, dh / NATIVE_H);
    drawFountainStone(ctx);
    drawFountainWater(ctx, animTime);
    ctx.restore();
    ctx.imageSmoothingEnabled = prev;
}
