import { TILE_SIZE } from "../../world/constants";
import { P } from "./palette";
import { r } from "./pixel";

export type OilLampWallSide = "north" | "south" | "east" | "west";

export const OIL_LAMP_NORTH_W = 32;
export const OIL_LAMP_NORTH_H = 64;
export const OIL_LAMP_SIDE_W = 64;
export const OIL_LAMP_SIDE_H = 32;

/** Per-lamp phase offset so flames don't flicker in sync. */
export function oilLampAnimPhase(tileX: number, tileY: number): number {
    return (tileX * 1.83 + tileY * 2.71) % (Math.PI * 2);
}

export function detectOilLampWallSide(
    anchorX: number,
    anchorY: number,
    roomW: number,
    roomH: number
): OilLampWallSide {
    if (anchorY === 0) return "north";
    if (anchorY === roomH - 1) return "south";
    if (anchorX === 0) return "west";
    if (anchorX === roomW - 1) return "east";

    const distNorth = anchorY;
    const distSouth = roomH - 1 - anchorY;
    const distWest = anchorX;
    const distEast = roomW - 1 - anchorX;
    const min = Math.min(distNorth, distSouth, distWest, distEast);
    if (min === distNorth) return "north";
    if (min === distSouth) return "south";
    if (min === distWest) return "west";
    return "east";
}

export function oilLampDrawBounds(
    anchorX: number,
    anchorY: number,
    wallSide: OilLampWallSide,
    roomW: number,
    roomH: number
): { drawX: number; drawY: number; drawW: number; drawH: number } {
    const ts = TILE_SIZE;
    switch (wallSide) {
        case "north":
            return { drawX: anchorX * ts, drawY: 0, drawW: ts, drawH: ts * 2 };
        case "south":
            return { drawX: anchorX * ts, drawY: (roomH - 2) * ts, drawW: ts, drawH: ts * 2 };
        case "west":
            return { drawX: 0, drawY: anchorY * ts, drawW: ts * 2, drawH: ts };
        case "east":
            return { drawX: (roomW - 2) * ts, drawY: anchorY * ts, drawW: ts * 2, drawH: ts };
    }
}

function drawBracketNorth(ctx: CanvasRenderingContext2D): void {
    r(ctx, 12, 28, 8, 6, P.iron);
    r(ctx, 14, 24, 4, 6, P.ironDark);
    r(ctx, 13, 22, 6, 3, P.copper);
}

function drawReservoir(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    r(ctx, x, y, 12, 8, P.copper);
    r(ctx, x + 1, y + 1, 10, 6, P.goldDark);
    r(ctx, x + 2, y + 2, 8, 4, P.gold);
}

function drawChimneyVertical(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    r(ctx, x, y, 10, 18, P.glass);
    r(ctx, x + 1, y + 1, 8, 16, P.glassHi);
    r(ctx, x, y, 1, 18, P.glassShine);
    r(ctx, x + 9, y + 2, 1, 14, P.glassShine);
    r(ctx, x - 1, y, 12, 2, P.iron);
    r(ctx, x - 1, y + 16, 12, 2, P.ironDark);
}

function drawChimneyHorizontal(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    r(ctx, x, y, 18, 10, P.glass);
    r(ctx, x + 1, y + 1, 16, 8, P.glassHi);
    r(ctx, x, y, 18, 1, P.glassShine);
    r(ctx, x, y + 9, 18, 1, P.ironDark);
    r(ctx, x - 2, y, 2, 10, P.iron);
}

export function drawOilLampNorthBase(ctx: CanvasRenderingContext2D): void {
    drawChimneyVertical(ctx, 11, 8);
    drawBracketNorth(ctx);
    drawReservoir(ctx, 10, 32);
}

function drawOilLampSouthBase(ctx: CanvasRenderingContext2D): void {
    drawReservoir(ctx, 10, 24);
    drawBracketNorth(ctx);
    r(ctx, 12, 28, 8, 6, P.iron);
    drawChimneyVertical(ctx, 11, 38);
}

function drawOilLampWestBase(ctx: CanvasRenderingContext2D): void {
    r(ctx, 2, 12, 6, 8, P.iron);
    r(ctx, 4, 10, 4, 4, P.ironDark);
    r(ctx, 3, 9, 6, 3, P.copper);
    drawChimneyHorizontal(ctx, 10, 10);
    drawReservoir(ctx, 38, 12);
}

function drawOilLampEastBase(ctx: CanvasRenderingContext2D): void {
    drawReservoir(ctx, 14, 12);
    drawChimneyHorizontal(ctx, 36, 10);
    r(ctx, 56, 12, 6, 8, P.iron);
    r(ctx, 56, 10, 4, 4, P.ironDark);
    r(ctx, 55, 9, 6, 3, P.copper);
}

function drawFlameAt(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number): void {
    const flicker = 0.82 + 0.18 * Math.sin(t * 9.5);
    const sway = Math.sin(t * 4.2) * 1.2;
    const x = cx + Math.floor(sway);
    const h = Math.floor((8 + Math.sin(t * 7.3) * 3) * flicker);
    const y = cy - h;

    r(ctx, x - 2, y + 2, 6, 4, P.fireRed);
    r(ctx, x - 1, y, 4, h, P.fireOrange);
    r(ctx, x, y + 1, 2, Math.max(3, h - 2), P.fireYellow);
    r(ctx, x, y, 2, 2, P.candle);
}

function drawOilLampGlow(
    ctx: CanvasRenderingContext2D,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
    t: number,
    wallSide: OilLampWallSide
): void {
    const pulse = 0.65 + 0.35 * Math.sin(t * 3.1);
    const prevAlpha = ctx.globalAlpha;
    const prevSmooth = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;

    let cx = dx + dw / 2;
    let cy = dy + dh / 2;
    let gw = dw * 2.2;
    let gh = dh * 1.6;
    let gx = cx - gw / 2;
    let gy = cy - gh / 4;

    if (wallSide === "north") {
        cy = dy + dh * 0.75;
        gy = dy + dh * 0.45;
    } else if (wallSide === "south") {
        cy = dy + dh * 0.25;
        gy = dy - dh * 0.2;
    } else if (wallSide === "west") {
        cx = dx + dw * 0.65;
        gx = dx + dw * 0.2;
    } else if (wallSide === "east") {
        cx = dx + dw * 0.35;
        gx = dx - dw * 0.8;
    }

    ctx.globalAlpha = 0.1 * pulse;
    ctx.fillStyle = P.fireYellow;
    ctx.fillRect(gx, gy, gw, gh);

    ctx.globalAlpha = 0.05 * pulse;
    ctx.fillStyle = P.fireOrange;
    ctx.fillRect(gx - dw * 0.3, gy, gw + dw * 0.6, gh + dh * 0.3);

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
    wallSide: OilLampWallSide,
    phase = 0
): void {
    const t = animTime + phase;
    const prev = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;

    drawOilLampGlow(ctx, dx, dy, dw, dh, t, wallSide);

    ctx.save();
    ctx.translate(dx, dy);
    if (wallSide === "north") {
        ctx.scale(dw / OIL_LAMP_NORTH_W, dh / OIL_LAMP_NORTH_H);
        drawOilLampNorthBase(ctx);
        drawFlameAt(ctx, 15, 26, t);
    } else if (wallSide === "south") {
        ctx.scale(dw / OIL_LAMP_NORTH_W, dh / OIL_LAMP_NORTH_H);
        drawOilLampSouthBase(ctx);
        drawFlameAt(ctx, 15, 38, t);
    } else if (wallSide === "west") {
        ctx.scale(dw / OIL_LAMP_SIDE_W, dh / OIL_LAMP_SIDE_H);
        drawOilLampWestBase(ctx);
        drawFlameAt(ctx, 22, 15, t);
    } else {
        ctx.scale(dw / OIL_LAMP_SIDE_W, dh / OIL_LAMP_SIDE_H);
        drawOilLampEastBase(ctx);
        drawFlameAt(ctx, 42, 15, t);
    }
    ctx.restore();

    ctx.imageSmoothingEnabled = prev;
}
