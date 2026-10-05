import { P } from "./palette";
import { discCrisp, hline, p, r, vline } from "./pixel";
import { seeded } from "./furnitureKit";
import { TILE_SIZE } from "../../world/constants";

const WINDOW_COUNT = 6;
/** Pilaster width between windows; window widths are whole pixels. */
const PILASTER = 22;

// Daytime: the story plays out in daylight
const SKY = { top: "#4a86c4", mid: "#6aa2d6", low: "#94c0e4", horizon: "#c4dcee" };
const GLAZING = "#c8b878";
const GILT = { d: P.goldDark, m: P.gold, h: "#ecd27a" };
const PLASTER = { o: "#8a8070", d: "#b8ae9c", m: P.paleWall, l: P.cream };
const VELVET = { o: "#2a060a", d: "#4a0c14", m: "#6e1620", l: "#922a32" };

/** Half-width of a semicircular-ish arch at `row` rows below its crown. */
function archHalf(row: number, archH: number, halfW: number): number {
    const t = Math.min(1, (row + 0.5) / archH);
    return Math.round(halfW * Math.sqrt(1 - (1 - t) * (1 - t)));
}

function drawPilaster(ctx: CanvasRenderingContext2D, x: number, w: number, top: number, bottom: number): void {
    r(ctx, x, top, w, bottom - top, PLASTER.m);
    vline(ctx, x, top, bottom - top, PLASTER.o);
    vline(ctx, x + w - 1, top, bottom - top, PLASTER.d);
    // Fluting
    for (let fx = x + 4; fx < x + w - 3; fx += 4) {
        vline(ctx, fx, top + 10, bottom - top - 16, PLASTER.d);
        vline(ctx, fx + 1, top + 10, bottom - top - 16, PLASTER.l);
    }
    // Gilt capital + base
    r(ctx, x - 1, top + 4, w + 2, 5, GILT.d);
    hline(ctx, x - 1, top + 4, w + 2, GILT.h);
    hline(ctx, x, top + 6, w, GILT.m);
    r(ctx, x - 1, bottom - 5, w + 2, 5, PLASTER.d);
    hline(ctx, x - 1, bottom - 5, w + 2, PLASTER.l);
}

function drawWindow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, index: number): void {
    const half = w / 2;
    const cx = x + half;
    const archH = Math.round(half * 0.7);
    // Gilt frame silhouette, then the glass
    for (let row = 0; row < h; row++) {
        const hw = row < archH ? archHalf(row, archH, half) : half;
        hline(ctx, Math.round(cx - hw), y + row, hw * 2, GILT.d);
    }
    const gx = x + 4;
    const gw = w - 8;
    const gh = h - 8;
    const gHalf = gw / 2;
    const gArch = Math.round(gHalf * 0.7);
    for (let row = 0; row < gh; row++) {
        const hw = row < gArch ? archHalf(row, gArch, gHalf) : gHalf;
        const t = row / gh;
        const sky = t < 0.35 ? SKY.top : t < 0.65 ? SKY.mid : t < 0.88 ? SKY.low : SKY.horizon;
        hline(ctx, Math.round(cx - hw), y + 4 + row, hw * 2, sky);
    }
    // Clouds drifting across the sky, and the sun in one window
    const rand = seeded(index * 17 + 3);
    for (let i = 0; i < 3; i++) {
        const cxl = Math.round(gx + 6 + rand() * (gw - 16));
        const cyl = Math.round(y + 4 + gArch * 0.7 + rand() * (gh * 0.45));
        const len = 6 + Math.floor(rand() * 8);
        hline(ctx, cxl, cyl, len, "#ffffff");
        hline(ctx, cxl + 2, cyl - 1, len - 4, "#ffffff");
        hline(ctx, cxl - 1, cyl + 1, len + 2, "#dce8f2");
    }
    if (index === 1) {
        const sx = gx + Math.round(gw * 0.7);
        const sy = y + 4 + gArch + 4;
        discCrisp(ctx, sx, sy, 6, "#f4ecc0");
        discCrisp(ctx, sx, sy, 4, "#fff8dc");
        discCrisp(ctx, sx, sy, 2, "#ffffff");
    }
    // Sunlit treeline at the bottom
    for (let i = 0; i < gw; i++) {
        const hgt = 3 + Math.round(Math.abs(Math.sin((i + index * 13) * 0.45)) * 3);
        vline(ctx, gx + i, y + 4 + gh - hgt, hgt, "#2e5a2a");
        p(ctx, gx + i, y + 4 + gh - hgt, i % 3 === 0 ? "#6aa04a" : "#4a7a36");
    }
    // Glazing bars: mullions + transoms, radiating bars in the fanlight
    const springY = y + 4 + gArch;
    for (const k of [1, 2, 3]) vline(ctx, Math.round(gx + (gw * k) / 4), springY, gh - gArch, GLAZING);
    for (let yy = springY + 10; yy < y + 4 + gh - 2; yy += 10) hline(ctx, gx, yy, gw, GLAZING);
    hline(ctx, gx, springY, gw, GILT.m);
    for (const a of [-0.9, -0.45, 0, 0.45, 0.9]) {
        for (let k = 3; k < gArch; k++) {
            p(ctx, Math.round(cx + Math.sin(a) * k * 1.4), springY - Math.round(Math.cos(a) * k), GLAZING);
        }
    }
    // Reflection streak
    for (let i = 0; i < 10; i++) p(ctx, gx + 4 + i, springY + 14 - i, "rgba(255,255,255,0.45)");
    // Frame highlight on the arch + stone sill
    for (let row = 0; row < archH; row++) {
        const hw = archHalf(row, archH, half);
        p(ctx, Math.round(cx - hw), y + row, GILT.h);
    }
    r(ctx, x - 2, y + h - 3, w + 4, 4, PLASTER.d);
    hline(ctx, x - 2, y + h - 3, w + 4, PLASTER.l);

    // Velvet drapes tied back at each side
    const tieY = y + Math.round(h * 0.62);
    for (const side of [-1, 1]) {
        for (let yy = y + 6; yy < y + h - 2; yy++) {
            const pinch = Math.abs(yy - tieY) < 3 ? 2 : 0;
            const flare = yy > tieY ? Math.min(3, Math.floor((yy - tieY) / 3)) : 0;
            const dw = 9 - pinch + flare;
            const x0 = side < 0 ? x - 2 : x + w + 2 - dw;
            hline(ctx, x0, yy, dw, VELVET.m);
            for (let f = 1; f < dw; f += 3) p(ctx, x0 + f, yy, (f + yy) % 2 ? VELVET.l : VELVET.d);
            p(ctx, side < 0 ? x0 + dw - 1 : x0, yy, VELVET.o);
        }
        const tx = side < 0 ? x - 2 : x + w - 6;
        hline(ctx, tx, tieY, 8, GILT.m);
        p(ctx, side < 0 ? tx + 7 : tx, tieY + 1, GILT.d);
        p(ctx, side < 0 ? tx + 7 : tx, tieY + 2, GILT.m);
    }
    // Pelmet with gold fringe
    r(ctx, x - 3, y + 2, w + 6, 5, VELVET.o);
    r(ctx, x - 2, y + 2, w + 4, 4, VELVET.m);
    hline(ctx, x - 2, y + 2, w + 4, VELVET.l);
    for (let fx = x - 2; fx < x + w + 2; fx += 2) p(ctx, fx, y + 6, GILT.m);
}

/** Panelled dado with gilt mouldings and a skirting board along the bottom of the face. */
function drawDado(ctx: CanvasRenderingContext2D, left: number, width: number, top: number, bottom: number): void {
    r(ctx, left, top, width, bottom - top, PLASTER.m);
    // Chair rail
    r(ctx, left, top, width, 3, PLASTER.d);
    hline(ctx, left, top, width, PLASTER.l);
    hline(ctx, left, top + 2, width, GILT.d);
    // Raised panels
    for (let x = left + 4; x < left + width - 20; x += 24) {
        r(ctx, x, top + 5, 20, bottom - top - 11, PLASTER.d);
        r(ctx, x + 1, top + 6, 18, bottom - top - 13, PLASTER.l);
        hline(ctx, x + 1, top + 6, 18, "#fbf8f2");
        r(ctx, x + 2, top + 7, 16, 1, GILT.m);
    }
    // Skirting
    r(ctx, left, bottom - 5, width, 5, "#a89c88");
    hline(ctx, left, bottom - 5, width, PLASTER.l);
    hline(ctx, left, bottom - 1, width, PLASTER.o);
}

/** Tall arched windows with drapes above a panelled dado along the ballroom's north wall. */
export function drawBallroomClerestoryWindows(
    ctx: CanvasRenderingContext2D,
    roomWidth: number,
    northWallRow: number
): void {
    const left = TILE_SIZE;
    const right = roomWidth * TILE_SIZE - TILE_SIZE;
    // The face covers the clerestory rows plus the wall row beneath them
    const faceBottom = (northWallRow + 1) * TILE_SIZE;
    const dadoH = 22;
    const dadoTop = faceBottom - dadoH;
    const innerW = right - left;

    // Pale wall behind with a gilt cornice
    r(ctx, left, 0, innerW, faceBottom, PLASTER.m);
    hline(ctx, left, 0, innerW, PLASTER.o);
    hline(ctx, left, 1, innerW, GILT.d);
    hline(ctx, left, 2, innerW, GILT.h);
    drawDado(ctx, left, innerW, dadoTop, faceBottom);

    const winW = Math.floor((innerW - PILASTER * (WINDOW_COUNT + 1)) / WINDOW_COUNT);
    const used = winW * WINDOW_COUNT + PILASTER * (WINDOW_COUNT + 1);
    const x0 = left + Math.floor((innerW - used) / 2);
    const winTop = 4;
    const winH = dadoTop - winTop;

    for (let i = 0; i <= WINDOW_COUNT; i++) {
        drawPilaster(ctx, x0 + i * (winW + PILASTER), PILASTER, 3, dadoTop);
    }
    for (let i = 0; i < WINDOW_COUNT; i++) {
        drawWindow(ctx, x0 + PILASTER + i * (winW + PILASTER), winTop, winW, winH, i);
    }

    // Daylight falling through the windows onto the floor, fading with distance
    const shaftTop = faceBottom;
    const shaftLen = TILE_SIZE * 4;
    for (let i = 0; i < WINDOW_COUNT; i++) {
        const wx = x0 + PILASTER + i * (winW + PILASTER) + 10;
        const sw = winW - 20;
        for (let dy = 0; dy < shaftLen; dy++) {
            const a = 0.22 * (1 - dy / shaftLen);
            ctx.fillStyle = `rgba(255,244,214,${a.toFixed(3)})`;
            ctx.fillRect(wx + Math.floor(dy / 6), shaftTop + dy, sw, 1);
        }
    }
}
