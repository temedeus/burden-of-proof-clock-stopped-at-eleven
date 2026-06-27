import { P } from "./palette";
import { r } from "./pixel";

export const OIL_LAMP_NATIVE_W = 32;
export const OIL_LAMP_NATIVE_H = 64;

/** Per-lamp phase offset so flames don't flicker in sync. */
export function oilLampAnimPhase(tileX: number, tileY: number): number {
    return (tileX * 1.83 + tileY * 2.71) % (Math.PI * 2);
}

/** Wall sconce + reservoir (no flame). */
export function drawOilLampBase(ctx: CanvasRenderingContext2D): void {
    // Warm floor pool (static base tint)
    r(ctx, 4, 50, 24, 12, P.rockFloorShadow);
    r(ctx, 8, 52, 16, 8, P.rockFloorDark);

    // Wall bracket
    r(ctx, 12, 28, 8, 6, P.iron);
    r(ctx, 14, 24, 4, 6, P.ironDark);
    r(ctx, 13, 22, 6, 3, P.copper);

    // Reservoir bowl
    r(ctx, 10, 32, 12, 8, P.copper);
    r(ctx, 11, 33, 10, 6, P.goldDark);
    r(ctx, 12, 34, 8, 4, P.gold);

    // Glass chimney
    r(ctx, 11, 8, 10, 18, P.glass);
    r(ctx, 12, 9, 8, 16, P.glassHi);
    r(ctx, 11, 8, 1, 18, P.glassShine);
    r(ctx, 20, 10, 1, 14, P.glassShine);
    r(ctx, 10, 8, 12, 2, P.iron);
    r(ctx, 10, 24, 12, 2, P.ironDark);
}

function drawOilLampFlame(ctx: CanvasRenderingContext2D, t: number): void {
    const flicker = 0.82 + 0.18 * Math.sin(t * 9.5);
    const sway = Math.sin(t * 4.2) * 1.2;
    const cx = 15 + Math.floor(sway);

    const h = Math.floor((10 + Math.sin(t * 7.3) * 3) * flicker);
    const y = 26 - h;

    r(ctx, cx - 2, y + 2, 6, 4, P.fireRed);
    r(ctx, cx - 1, y, 4, h, P.fireOrange);
    r(ctx, cx, y + 1, 2, Math.max(3, h - 2), P.fireYellow);
    r(ctx, cx, y, 2, 2, P.candle);

    if (Math.sin(t * 14) > 0.6) {
        r(ctx, cx + 3, y + 2, 1, 1, P.fireYellow);
    }
}

function drawOilLampGlow(
    ctx: CanvasRenderingContext2D,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
    t: number
): void {
    const pulse = 0.65 + 0.35 * Math.sin(t * 3.1);
    const prevAlpha = ctx.globalAlpha;
    const prevSmooth = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;

    const cx = dx + dw / 2;
    const cy = dy + dh * 0.55;

    ctx.globalAlpha = 0.1 * pulse;
    ctx.fillStyle = P.fireYellow;
    ctx.fillRect(cx - dw * 1.1, cy - dh * 0.1, dw * 2.2, dh * 0.85);

    ctx.globalAlpha = 0.06 * pulse;
    ctx.fillRect(cx - dw * 1.6, cy - dh * 0.05, dw * 3.2, dh * 1.05);

    ctx.globalAlpha = 0.03 * pulse;
    ctx.fillStyle = P.fireOrange;
    ctx.fillRect(cx - dw * 2, cy, dw * 4, dh * 0.7);

    ctx.globalAlpha = prevAlpha;
    ctx.imageSmoothingEnabled = prevSmooth;
}

/** Oil lamp with flickering flame and soft floor glow (game runtime). */
export function drawOilLampAnimated(
    ctx: CanvasRenderingContext2D,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
    animTime: number,
    phase = 0
): void {
    const t = animTime + phase;
    const prev = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;

    drawOilLampGlow(ctx, dx, dy, dw, dh, t);

    ctx.save();
    ctx.translate(dx, dy);
    ctx.scale(dw / OIL_LAMP_NATIVE_W, dh / OIL_LAMP_NATIVE_H);
    drawOilLampBase(ctx);
    drawOilLampFlame(ctx, t);
    ctx.restore();

    ctx.imageSmoothingEnabled = prev;
}
