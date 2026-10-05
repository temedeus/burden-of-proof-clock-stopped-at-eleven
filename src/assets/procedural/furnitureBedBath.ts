/**
 * Bathroom + bedroom furniture at uniform 2x scale (see furnitureKit.ts).
 */
import { P } from "./palette";
import { discCrisp, hline, p, r, shade, vline } from "./pixel";
import { ellipse, floorShadow, leg, line, MAHOGANY, panel, recess, seeded, tabletop } from "./furnitureKit";

const PORCELAIN = { o: "#6a747c", d: "#b4c0c8", m: "#dfe6ea", l: "#f2f6f8", h: "#ffffff" };
const BRASS = { d: P.goldDark, m: P.gold, h: "#ecd27a" };
const COPPER = { o: "#4a2010", d: "#8a4422", m: "#b4643a", l: "#d08a58", h: "#f0b888" };

// ---------------------------------------------------------------------------
// Bathroom
// ---------------------------------------------------------------------------

/** 48x32 @2x — roll-top claw-foot bathtub, taps at the left end. */
export function drawBathtub(ctx: CanvasRenderingContext2D): void {
    floorShadow(ctx, 4, 29, 40, 3);
    // Claw feet
    for (const x of [8, 37]) {
        r(ctx, x, 25, 4, 4, BRASS.d);
        hline(ctx, x, 25, 3, BRASS.m);
        hline(ctx, x - 1, 28, 6, BRASS.d);
    }
    // Outer body (front face below the rim)
    ellipse(ctx, 24, 15, 22, 11, PORCELAIN.o);
    ellipse(ctx, 24, 15, 21, 10, PORCELAIN.d);
    ellipse(ctx, 23, 13, 20, 9, PORCELAIN.m);
    // Rolled rim
    ellipse(ctx, 24, 11, 21, 8, PORCELAIN.o);
    ellipse(ctx, 24, 11, 20, 7, PORCELAIN.l);
    hline(ctx, 10, 5, 16, PORCELAIN.h);
    // Interior + water
    ellipse(ctx, 25, 11, 17, 5, PORCELAIN.d);
    ellipse(ctx, 25, 11.5, 16, 4.5, "#4a86a8");
    ellipse(ctx, 26, 12, 13, 3, "#3a7090");
    hline(ctx, 15, 9, 6, "#9acbe0");
    hline(ctx, 28, 11, 4, "#9acbe0");
    // Taps + spout at the head end
    r(ctx, 5, 6, 2, 4, BRASS.d);
    r(ctx, 9, 6, 2, 4, BRASS.d);
    hline(ctx, 4, 5, 3, BRASS.h);
    hline(ctx, 8, 5, 3, BRASS.h);
    r(ctx, 7, 8, 2, 3, BRASS.m);
    p(ctx, 8, 11, "#9acbe0");
    // Shading on the front face
    for (let x = 30; x < 44; x += 3) vline(ctx, x, 18, 4, PORCELAIN.d);
}

/** 32x32 @2x — pedestal water closet with a mahogany seat and cistern. */
export function drawToilet(ctx: CanvasRenderingContext2D): void {
    const M = MAHOGANY;
    floorShadow(ctx, 7, 29, 18, 2);
    // Cistern (mahogany-cased) at the back
    panel(ctx, 8, 2, 16, 10, M);
    recess(ctx, 10, 4, 12, 5, M);
    r(ctx, 21, 5, 4, 1, BRASS.m);
    p(ctx, 24, 6, BRASS.d);
    // Flush pipe down to the bowl
    vline(ctx, 15, 12, 2, BRASS.d);
    vline(ctx, 16, 12, 2, BRASS.m);
    // Pedestal
    r(ctx, 12, 18, 8, 11, PORCELAIN.o);
    r(ctx, 13, 18, 6, 10, PORCELAIN.m);
    vline(ctx, 13, 18, 10, PORCELAIN.l);
    vline(ctx, 18, 18, 10, PORCELAIN.d);
    hline(ctx, 11, 28, 10, PORCELAIN.o);
    // Bowl + mahogany seat ring, tucked against the cistern
    ellipse(ctx, 16, 16, 9, 5, PORCELAIN.o);
    ellipse(ctx, 16, 16, 8, 4, M.m);
    hline(ctx, 10, 13, 12, M.l);
    ellipse(ctx, 16, 16, 5, 2.5, PORCELAIN.l);
    ellipse(ctx, 16, 16.5, 4, 1.5, "#6aa0bc");
    p(ctx, 14, 16, "#b8e0f0");
}

/** 32x48 @2x — copper water heater (geyser) on an iron burner stand. */
export function drawWaterBoiler(ctx: CanvasRenderingContext2D): void {
    floorShadow(ctx, 6, 45, 20, 3);
    // Flue pipe up to the ceiling
    r(ctx, 14, 0, 4, 4, "#3e444a");
    vline(ctx, 14, 0, 4, "#5a6268");
    // Domed top
    for (let y = 3; y <= 8; y++) {
        const half = Math.round(8 * Math.sqrt(1 - ((8 - y) / 6) ** 2));
        hline(ctx, 16 - half, y, half * 2, y === 3 ? COPPER.o : COPPER.l);
        p(ctx, 16 - half, y, COPPER.o);
        p(ctx, 15 + half, y, COPPER.o);
    }
    p(ctx, 13, 5, COPPER.h);
    // Cylinder
    r(ctx, 8, 8, 16, 26, COPPER.o);
    r(ctx, 9, 8, 14, 26, COPPER.m);
    r(ctx, 10, 8, 3, 26, COPPER.l);
    vline(ctx, 11, 9, 24, COPPER.h);
    r(ctx, 20, 8, 3, 26, COPPER.d);
    // Riveted seams
    for (const y of [12, 22, 32]) {
        hline(ctx, 9, y, 14, COPPER.d);
        for (let x = 10; x < 23; x += 3) p(ctx, x, y - 1, COPPER.h);
    }
    // Pressure gauge
    discCrisp(ctx, 16, 17, 3, "#2a2e32");
    discCrisp(ctx, 16, 17, 2, P.cream);
    line(ctx, 16, 17, 17, 16, P.red);
    // Pipes out to the side + tap
    r(ctx, 23, 26, 6, 2, "#8a9098");
    hline(ctx, 23, 26, 6, "#b8c0c8");
    r(ctx, 27, 28, 2, 4, "#8a9098");
    r(ctx, 26, 31, 4, 1, BRASS.m);
    // Burner box with flame window
    r(ctx, 7, 34, 18, 9, "#141618");
    r(ctx, 8, 35, 16, 7, "#2a2e32");
    hline(ctx, 8, 35, 16, "#5a6268");
    r(ctx, 13, 37, 6, 3, "#1a0a06");
    hline(ctx, 14, 39, 4, P.fireOrange);
    p(ctx, 15, 38, P.fireYellow);
    p(ctx, 17, 38, P.fireRed);
    // Legs
    for (const x of [8, 22]) r(ctx, x, 43, 2, 3, "#141618");
}

// ---------------------------------------------------------------------------
// Bedroom
// ---------------------------------------------------------------------------

const PLUM = { o: "#1e0a1a", d: "#3a1432", m: "#5a2250", l: "#7a3468", h: "#9a4a84" };

/** Draped curtain hanging from (x, top) to bottom, tied back with a gold cord at tieY. */
function drape(ctx: CanvasRenderingContext2D, x: number, top: number, bottom: number, w: number, tieY: number, flip: boolean): void {
    for (let y = top; y < bottom; y++) {
        const pinch = y > tieY - 3 && y < tieY + 3 ? 2 : 0;
        const flare = y > tieY ? Math.min(3, Math.floor((y - tieY) / 4)) : 0;
        const width = w - pinch + flare;
        const x0 = flip ? x + w - width : x;
        hline(ctx, x0, y, width, PLUM.m);
        p(ctx, x0, y, PLUM.o);
        p(ctx, x0 + width - 1, y, PLUM.o);
        // Vertical folds
        for (let f = 2; f < width - 1; f += 3) p(ctx, x0 + f, y, (f + (flip ? 1 : 0)) % 2 ? PLUM.l : PLUM.d);
    }
    hline(ctx, x, tieY, w, BRASS.m);
    p(ctx, flip ? x : x + w - 1, tieY + 1, BRASS.d);
    p(ctx, flip ? x : x + w - 1, tieY + 2, BRASS.m);
}

function finialPost(ctx: CanvasRenderingContext2D, x: number, top: number, bottom: number): void {
    const M = MAHOGANY;
    r(ctx, x, top + 3, 5, bottom - top - 3, M.o);
    r(ctx, x + 1, top + 3, 3, bottom - top - 4, M.m);
    vline(ctx, x + 1, top + 3, bottom - top - 4, M.l);
    // Turned rings
    for (let y = top + 8; y < bottom - 4; y += 10) {
        hline(ctx, x, y, 5, M.d);
        hline(ctx, x, y + 1, 5, M.l);
    }
    discCrisp(ctx, x + 2, top + 1, 2, BRASS.d);
    p(ctx, x + 1, top, BRASS.h);
}

/** 128x128 @2x — the lord's four-poster bed with canopy valance and tied drapes. */
export function drawLordBed(ctx: CanvasRenderingContext2D): void {
    const M = MAHOGANY;
    const W = 128;
    floorShadow(ctx, 6, 122, W - 12, 4);

    // Back posts + canopy valance
    finialPost(ctx, 4, 0, 44);
    finialPost(ctx, W - 9, 0, 44);
    r(ctx, 6, 4, W - 12, 7, PLUM.o);
    r(ctx, 7, 5, W - 14, 5, PLUM.m);
    hline(ctx, 7, 5, W - 14, PLUM.h);
    for (let x = 8; x < W - 8; x += 6) {
        // Scalloped fringe
        hline(ctx, x, 10, 4, PLUM.d);
        p(ctx, x + 1, 11, BRASS.d);
        p(ctx, x + 2, 11, BRASS.m);
    }
    hline(ctx, 7, 4, W - 14, BRASS.m);

    // Carved headboard with arched crest
    for (let y = 12; y <= 34; y++) {
        const t = Math.max(0, (20 - y) / 8);
        const inset = Math.round(26 * t * t);
        r(ctx, 9 + inset, y, W - 18 - inset * 2, 1, M.m);
        p(ctx, 9 + inset, y, M.o);
        p(ctx, W - 10 - inset, y, M.o);
        if (y < 20) p(ctx, 10 + inset, y, M.l);
    }
    recess(ctx, 18, 20, 40, 12, M);
    recess(ctx, 70, 20, 40, 12, M);
    discCrisp(ctx, W / 2, 16, 3, BRASS.d);
    discCrisp(ctx, W / 2, 16, 2, BRASS.m);
    p(ctx, W / 2 - 1, 15, BRASS.h);

    // Mattress body: side faces of the coverlet hanging over the frame
    r(ctx, 8, 32, W - 16, 74, PLUM.o);
    r(ctx, 9, 33, W - 18, 72, PLUM.d);
    // Bed top
    r(ctx, 12, 32, W - 24, 66, "#efe8da");
    // Pillows: two square + a bolster
    for (const x of [16, 66]) {
        r(ctx, x, 34, 46, 14, "#c8bca8");
        r(ctx, x + 1, 34, 44, 13, P.white);
        hline(ctx, x + 2, 35, 40, "#ffffff");
        hline(ctx, x + 1, 44, 44, "#dcd2c0");
        p(ctx, x + 22, 40, "#dcd2c0");
        p(ctx, x + 23, 41, "#dcd2c0");
    }
    r(ctx, 14, 47, W - 28, 5, "#d8ccb4");
    hline(ctx, 14, 47, W - 28, P.cream);
    // Turned-down sheet
    r(ctx, 12, 52, W - 24, 6, P.white);
    hline(ctx, 12, 57, W - 24, "#c8bca8");
    for (let x = 18; x < W - 18; x += 14) p(ctx, x, 54, "#dcd2c0");
    // Coverlet with quilted diamond pattern + gold border
    r(ctx, 12, 58, W - 24, 40, PLUM.m);
    hline(ctx, 12, 58, W - 24, PLUM.h);
    for (let y = 62; y < 96; y += 6) {
        for (let x = 16 + ((y / 6) % 2) * 6; x < W - 14; x += 12) {
            p(ctx, x, y, PLUM.l);
            p(ctx, x - 1, y + 1, PLUM.d);
            p(ctx, x + 1, y + 1, PLUM.d);
        }
    }
    hline(ctx, 14, 60, W - 28, BRASS.d);
    hline(ctx, 14, 95, W - 28, BRASS.d);
    vline(ctx, 14, 60, 36, BRASS.d);
    vline(ctx, W - 15, 60, 36, BRASS.d);
    // Light across the upper-left, shadow along the right
    r(ctx, 15, 61, 24, 2, PLUM.l);
    r(ctx, W - 22, 62, 6, 32, PLUM.d);
    // Coverlet drop over the foot
    r(ctx, 9, 98, W - 18, 8, PLUM.d);
    for (let x = 12; x < W - 12; x += 8) vline(ctx, x, 99, 7, PLUM.o);
    hline(ctx, 9, 105, W - 18, BRASS.d);

    // Footboard + front posts
    panel(ctx, 8, 104, W - 16, 12, M);
    recess(ctx, 14, 107, W - 28, 6, M);
    finialPost(ctx, 3, 90, 122);
    finialPost(ctx, W - 8, 90, 122);

    // Drapes tied back against the back posts
    drape(ctx, 0, 11, 64, 8, 36, false);
    drape(ctx, W - 8, 11, 64, 8, 36, true);
}

/**
 * Rug with medallion, border and fringe at any size (used by both carpets).
 */
export interface RugColors {
    field: string;
    fieldLight: string;
    border: string;
    borderMid: string;
    accent: string;
    accentDark: string;
    cream: string;
    fringe: string;
}

export const MANOR_RUG: RugColors = {
    field: "#5a1820",
    fieldLight: "#7a2a30",
    border: "#1a2236",
    borderMid: "#2e3a5a",
    accent: P.gold,
    accentDark: P.goldDark,
    cream: "#d8c8a8",
    fringe: "#d8ccb0"
};

export function drawRug(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    c: RugColors,
    seed = 1,
    medallion = true
): void {
    for (let y = 4; y < H - 4; y += 2) {
        hline(ctx, 0, y, 4, c.fringe);
        hline(ctx, W - 4, y, 4, c.fringe);
    }
    const x0 = 4;
    const x1 = W - 4;
    r(ctx, x0, 2, x1 - x0, H - 4, c.border);
    r(ctx, x0 + 2, 4, x1 - x0 - 4, H - 8, c.accent);
    r(ctx, x0 + 3, 5, x1 - x0 - 6, H - 10, c.borderMid);
    const bx0 = x0 + 3;
    const by0 = 5;
    const bw = x1 - x0 - 6;
    const bh = H - 10;
    const motif = (x: number, y: number) => {
        p(ctx, x, y - 1, c.cream);
        hline(ctx, x - 1, y, 3, c.accent);
        p(ctx, x, y + 1, c.cream);
    };
    for (let x = bx0 + 4; x < bx0 + bw - 4; x += 8) {
        motif(x, by0 + 4);
        motif(x, by0 + bh - 5);
    }
    for (let y = by0 + 8; y < by0 + bh - 6; y += 8) {
        motif(bx0 + 4, y);
        motif(bx0 + bw - 5, y);
    }
    const fx = bx0 + 9;
    const fy = by0 + 9;
    const fw = bw - 18;
    const fh = bh - 18;
    r(ctx, fx - 1, fy - 1, fw + 2, fh + 2, c.accentDark);
    r(ctx, fx, fy, fw, fh, c.field);
    // Field: diamond lattice with small rosettes at the cells
    for (let y = fy; y < fy + fh; y++) {
        for (let x = fx; x < fx + fw; x++) {
            const u = x - fx;
            const v = y - fy;
            if ((u + v) % 12 === 0 || (u - v + 1200) % 12 === 0) p(ctx, x, y, c.fieldLight);
        }
    }
    for (let y = fy + 6; y < fy + fh - 3; y += 12) {
        for (let x = fx + 12; x < fx + fw - 3; x += 12) {
            p(ctx, x, y, c.accent);
            p(ctx, x - 1, y, c.accentDark);
            p(ctx, x + 1, y, c.accentDark);
            p(ctx, x, y - 1, c.cream);
            p(ctx, x, y + 1, c.accentDark);
        }
    }
    // Medallion
    if (medallion) drawRugMedallion(ctx, W, H, fw, fh, c);
    // Corner spandrels
    const span = Math.min(10, Math.round(Math.min(fw, fh) * 0.16));
    for (const [sx, sy] of [[fx, fy], [fx + fw, fy], [fx, fy + fh], [fx + fw, fy + fh]] as const) {
        const dx = sx === fx ? 1 : -1;
        const dy = sy === fy ? 1 : -1;
        for (let i = 0; i < span; i++) {
            hline(ctx, dx > 0 ? sx : sx - (span - i), sy + dy * i - (dy < 0 ? 1 : 0), span - i, c.borderMid);
        }
        p(ctx, sx + dx * 2, sy + dy * 2 - (dy < 0 ? 1 : 0), c.accent);
    }
    // Subtle wear
    const rand = seeded(seed);
    for (let i = 0; i < Math.floor((fw * fh) / 300); i++) {
        p(ctx, fx + Math.floor(rand() * fw), fy + Math.floor(rand() * fh), "rgba(255,255,255,0.06)");
    }
}

function drawRugMedallion(ctx: CanvasRenderingContext2D, W: number, H: number, fw: number, fh: number, c: RugColors): void {
    const cx = Math.round(W / 2);
    const cy = Math.round(H / 2);
    const mw = Math.round(fw * 0.32);
    const mh = Math.round(fh * 0.34);
    const lozenge = (rw: number, rh: number, color: (dy: number) => string) => {
        for (let dy = -rh; dy <= rh; dy++) {
            const half = Math.round(rw * (1 - Math.abs(dy) / (rh + 1)));
            if (half > 0) hline(ctx, cx - half, cy + dy, half * 2, color(dy));
        }
    };
    lozenge(mw, mh, (dy) => (Math.abs(dy) % 4 === 0 ? c.accentDark : c.borderMid));
    lozenge(Math.round(mw * 0.6), Math.round(mh * 0.62), () => c.fieldLight);
    lozenge(Math.round(mw * 0.26), Math.round(mh * 0.3), () => c.accent);
    r(ctx, cx - 1, cy - 1, 2, 2, c.border);
    for (const sx of [-1, 1]) {
        const px = cx + sx * (mw + 6);
        r(ctx, px - 2, cy - 2, 4, 4, c.accent);
        p(ctx, px - sx * 3, cy, c.accentDark);
    }
}

/** 240x176 @2x — the large rug under the lord's bed. */
export function drawManorCarpet(ctx: CanvasRenderingContext2D): void {
    drawRug(ctx, 240, 176, MANOR_RUG, 3, false);
}

/** 64x80 @2x — dressing table with an oval gilt mirror and toiletries. */
export function drawManorVanity(ctx: CanvasRenderingContext2D): void {
    const M = MAHOGANY;
    floorShadow(ctx, 6, 77, 52, 3);
    // Mirror stand + oval gilt frame
    r(ctx, 12, 30, 3, 12, M.d);
    r(ctx, 49, 30, 3, 12, M.d);
    ellipse(ctx, 32, 20, 18, 19, "#5a4418");
    ellipse(ctx, 32, 20, 17, 18, BRASS.m);
    ellipse(ctx, 32, 20, 14, 15, "#5a4418");
    ellipse(ctx, 32, 20, 13, 14, "#3a4a56");
    ellipse(ctx, 30, 18, 10, 11, "#4a5e6c");
    for (let i = 0; i < 7; i++) p(ctx, 24 + i, 10 + i, "#8aa0b0");
    for (let i = 0; i < 4; i++) p(ctx, 26 + i, 9 + i, "#a8bccb");
    // Gilt crest on top of the frame
    r(ctx, 29, 0, 6, 3, BRASS.m);
    p(ctx, 32, 0, BRASS.h);
    // Table top + drawers
    tabletop(ctx, 4, 40, 56, 6, 3, M, 4);
    panel(ctx, 6, 49, 52, 12, M);
    for (const x of [8, 25, 42]) {
        recess(ctx, x, 51, 14, 8, M);
        p(ctx, x + 7, 55, BRASS.m);
    }
    // Cabriole legs
    for (const x of [7, 53]) {
        leg(ctx, x, 61, 78, 4, M);
        p(ctx, x + (x < 32 ? -1 : 4), 76, M.o);
    }
    // Toiletries on the top
    r(ctx, 9, 37, 3, 4, "#7a4a8a");
    p(ctx, 10, 36, BRASS.m);
    r(ctx, 14, 38, 2, 3, "#3a7a6a");
    p(ctx, 14, 37, BRASS.m);
    r(ctx, 40, 37, 10, 4, M.d);
    hline(ctx, 40, 37, 10, BRASS.m);
    p(ctx, 45, 39, BRASS.h);
    r(ctx, 24, 39, 8, 2, "#c8bca8");
    r(ctx, 31, 38, 3, 4, M.l);
    vline(ctx, 55, 34, 6, P.cream);
    p(ctx, 55, 33, P.fireYellow);
    r(ctx, 54, 40, 3, 1, BRASS.d);
}

/** 32x32 @2x — nightstand with a candle, the baron's diary and a key. */
export function drawBedsideTable(ctx: CanvasRenderingContext2D): void {
    const M = MAHOGANY;
    floorShadow(ctx, 5, 29, 22, 3);
    leg(ctx, 6, 18, 30, 3, M);
    leg(ctx, 23, 18, 30, 3, M);
    panel(ctx, 5, 15, 22, 8, M);
    recess(ctx, 7, 17, 18, 4, M);
    p(ctx, 16, 19, BRASS.m);
    hline(ctx, 7, 26, 18, M.d);
    tabletop(ctx, 3, 9, 26, 4, 3, M, 2);
    // Candle in a brass holder
    ellipse(ctx, 7, 11, 2, 1, BRASS.d);
    vline(ctx, 7, 4, 7, P.cream);
    p(ctx, 7, 3, P.fireYellow);
    p(ctx, 7, 2, "rgba(255,200,80,0.6)");
    // Diary: dark leather with a ribbon
    r(ctx, 11, 7, 9, 5, "#3a1a10");
    r(ctx, 11, 6, 9, 5, "#5a2a1c");
    hline(ctx, 11, 6, 9, "#7a3c28");
    vline(ctx, 19, 6, 5, P.cream);
    p(ctx, 15, 11, P.red);
    p(ctx, 15, 12, P.red);
    // Key
    discCrisp(ctx, 23, 9, 1, "#8a9098");
    p(ctx, 23, 9, "#5a6268");
    hline(ctx, 24, 9, 3, "#8a9098");
    p(ctx, 26, 10, "#8a9098");
    p(ctx, 24, 10, shade("#8a9098", 0.2));
}

// ---------------------------------------------------------------------------
// Guest + maid beds (2x)
// ---------------------------------------------------------------------------

const WALNUT = { o: "#1e140c", d: "#3e2a18", m: "#5a3e24", l: "#7a5634", h: "#9a7046" };
const SAGE = { o: "#14241c", d: "#22382a", m: "#2e4e3a", l: "#42684e", h: "#5e8a66" };

/** Turned bedpost with a round knob. */
function bedPost(ctx: CanvasRenderingContext2D, x: number, top: number, bottom: number, wood: typeof WALNUT, knob: string): void {
    r(ctx, x, top + 2, 4, bottom - top - 2, wood.o);
    r(ctx, x + 1, top + 2, 2, bottom - top - 3, wood.m);
    vline(ctx, x + 1, top + 2, bottom - top - 3, wood.l);
    for (let y = top + 7; y < bottom - 3; y += 9) hline(ctx, x, y, 4, wood.d);
    discCrisp(ctx, x + 2, top + 1, 2, knob);
    p(ctx, x + 1, top, shade(knob, 0.35));
}

/** 96x96 @2x — walnut double bed for the guest rooms. */
export function drawGuestBed(ctx: CanvasRenderingContext2D): void {
    const Wd = WALNUT;
    const W = 96;
    floorShadow(ctx, 6, 91, W - 12, 3);

    // Headboard: arched crest between two posts
    bedPost(ctx, 6, 2, 40, Wd, Wd.l);
    bedPost(ctx, W - 10, 2, 40, Wd, Wd.l);
    for (let y = 6; y <= 30; y++) {
        const t = Math.max(0, (14 - y) / 8);
        const inset = Math.round(30 * t * t);
        r(ctx, 10 + inset, y, W - 20 - inset * 2, 1, Wd.m);
        p(ctx, 10 + inset, y, Wd.o);
        p(ctx, W - 11 - inset, y, Wd.o);
        if (y < 14) p(ctx, 11 + inset, y, Wd.l);
    }
    recess(ctx, 16, 14, 28, 13, Wd);
    recess(ctx, 52, 14, 28, 13, Wd);
    discCrisp(ctx, W / 2, 9, 2, Wd.h);

    // Bed body with the coverlet hanging over the sides
    r(ctx, 8, 28, W - 16, 52, SAGE.o);
    r(ctx, 9, 29, W - 18, 50, SAGE.d);
    r(ctx, 12, 28, W - 24, 46, "#efe8da");
    // Pillows
    for (const x of [14, 50]) {
        r(ctx, x, 30, 32, 12, "#c8bca8");
        r(ctx, x + 1, 30, 30, 11, P.white);
        hline(ctx, x + 2, 31, 26, "#ffffff");
        hline(ctx, x + 1, 39, 30, "#dcd2c0");
        p(ctx, x + 15, 35, "#dcd2c0");
    }
    // Turned-down sheet
    r(ctx, 12, 43, W - 24, 5, P.white);
    hline(ctx, 12, 47, W - 24, "#c8bca8");
    // Quilted sage coverlet with a cream border
    r(ctx, 12, 48, W - 24, 26, SAGE.m);
    hline(ctx, 12, 48, W - 24, SAGE.h);
    for (let y = 52; y < 72; y += 5) {
        for (let x = 16 + ((y / 5) % 2) * 5; x < W - 14; x += 10) {
            p(ctx, x, y, SAGE.l);
            p(ctx, x - 1, y + 1, SAGE.d);
            p(ctx, x + 1, y + 1, SAGE.d);
        }
    }
    r(ctx, 14, 50, W - 28, 1, "#d8ccb0");
    r(ctx, 14, 71, W - 28, 1, "#d8ccb0");
    r(ctx, 15, 51, 14, 2, SAGE.l);
    r(ctx, W - 20, 52, 5, 18, SAGE.d);
    // Drop over the foot with folds
    r(ctx, 9, 74, W - 18, 6, SAGE.d);
    for (let x = 12; x < W - 12; x += 7) vline(ctx, x, 75, 5, SAGE.o);
    hline(ctx, 9, 79, W - 18, "#d8ccb0");

    // Footboard between short posts
    panel(ctx, 8, 78, W - 16, 10, Wd);
    recess(ctx, 14, 81, W - 28, 4, Wd);
    bedPost(ctx, 5, 70, 92, Wd, Wd.l);
    bedPost(ctx, W - 9, 70, 92, Wd, Wd.l);
}

/** 64x64 @2x — the maid's narrow iron bed with a thin, worn mattress. */
export function drawMaidBed(ctx: CanvasRenderingContext2D): void {
    const iron = { o: "#0e0e10", d: "#1e1e22", m: "#2e2e34", l: "#4a4a52" };
    const wool = { o: "#2a2a2a", d: "#4a4844", m: "#62605a", l: "#7a776e", h: "#928e84" };
    floorShadow(ctx, 12, 60, 40, 3);

    // Iron headboard: rails and spindles, brass knobs
    for (const x of [12, 49]) {
        r(ctx, x, 2, 3, 28, iron.o);
        vline(ctx, x + 1, 3, 26, iron.l);
        discCrisp(ctx, x + 1, 2, 1, P.goldDark);
        p(ctx, x + 1, 1, P.gold);
    }
    hline(ctx, 14, 5, 36, iron.o);
    hline(ctx, 14, 6, 36, iron.l);
    hline(ctx, 14, 16, 36, iron.o);
    for (let x = 18; x < 48; x += 4) vline(ctx, x, 7, 9, iron.m);

    // Sagging frame + thin mattress
    r(ctx, 14, 16, 36, 36, iron.o);
    r(ctx, 15, 17, 34, 34, "#b8ae98");
    for (let y = 22; y < 50; y += 6) hline(ctx, 16, y, 32, "#a89e88");
    // Flat pillow, slightly askew
    r(ctx, 18, 18, 22, 8, "#c8bca8");
    r(ctx, 19, 18, 20, 7, "#e0d8c8");
    hline(ctx, 20, 19, 14, "#ece6d8");
    p(ctx, 22, 22, "#b8ae98");
    p(ctx, 34, 21, "#b8ae98");
    // Grey wool blanket, rumpled and turned back at one corner
    r(ctx, 15, 28, 34, 22, wool.m);
    hline(ctx, 15, 28, 34, wool.h);
    hline(ctx, 15, 32, 34, "#7a2a2a");
    hline(ctx, 15, 46, 34, "#7a2a2a");
    for (const [x, y, len] of [[18, 36, 9], [28, 39, 12], [20, 43, 6], [36, 34, 8]] as const) {
        hline(ctx, x, y, len, wool.d);
        hline(ctx, x + 1, y - 1, len - 2, wool.l);
    }
    // Darned patch
    r(ctx, 38, 40, 6, 5, wool.l);
    for (let x = 38; x < 44; x += 2) vline(ctx, x, 40, 5, wool.d);
    // Turned-back corner showing the mattress ticking
    for (let i = 0; i < 6; i++) hline(ctx, 43 + i, 28 + i, 6 - i, "#b8ae98");
    line(ctx, 43, 28, 48, 33, wool.d);
    // Blanket edge hanging over the side
    r(ctx, 14, 50, 36, 3, wool.d);
    hline(ctx, 14, 52, 36, wool.o);

    // Iron footboard (lower)
    for (const x of [12, 49]) {
        r(ctx, x, 46, 3, 14, iron.o);
        vline(ctx, x + 1, 47, 12, iron.l);
        discCrisp(ctx, x + 1, 46, 1, P.goldDark);
    }
    hline(ctx, 14, 52, 36, iron.o);
    hline(ctx, 14, 53, 36, iron.l);
    for (let x = 18; x < 48; x += 4) vline(ctx, x, 54, 4, iron.m);
    hline(ctx, 14, 58, 36, iron.o);
}

/** 48x64 @2x — guest-room washstand dresser with a swing mirror, jug and basin. */
export function drawGuestVanity(ctx: CanvasRenderingContext2D): void {
    const Wd = WALNUT;
    const marble = { o: "#6a645c", d: "#b0a698", m: "#d8d0c6", l: "#e8e2da" };
    floorShadow(ctx, 4, 61, 40, 3);

    // Swing mirror: arched frame between turned uprights
    for (const x of [8, 37]) {
        r(ctx, x, 6, 3, 24, Wd.o);
        vline(ctx, x + 1, 7, 22, Wd.l);
        discCrisp(ctx, x + 1, 5, 1, Wd.h);
        p(ctx, x + 1, 17, BRASS.m);
    }
    for (let y = 4; y <= 28; y++) {
        const t = Math.max(0, (9 - y) / 5);
        const inset = Math.round(9 * t * t);
        r(ctx, 12 + inset, y, 24 - inset * 2, 1, Wd.m);
        p(ctx, 12 + inset, y, Wd.o);
        p(ctx, 35 - inset, y, Wd.o);
    }
    for (let y = 7; y <= 26; y++) {
        const t = Math.max(0, (11 - y) / 4);
        const inset = Math.round(7 * t * t);
        r(ctx, 14 + inset, y, 20 - inset * 2, 1, y < 16 ? "#4a5e6c" : "#3a4a56");
    }
    for (let i = 0; i < 6; i++) p(ctx, 17 + i, 10 + i, "#8aa0b0");
    for (let i = 0; i < 3; i++) p(ctx, 19 + i, 9 + i, "#a8bccb");
    hline(ctx, 12, 28, 24, Wd.o);

    // Marble top
    r(ctx, 3, 30, 42, 6, marble.o);
    r(ctx, 4, 30, 40, 4, marble.m);
    hline(ctx, 4, 30, 40, marble.l);
    hline(ctx, 4, 34, 40, marble.d);
    for (const [x, y] of [[9, 31], [26, 32], [38, 31]] as const) p(ctx, x, y, marble.d);

    // Porcelain basin + jug with a blue band
    ellipse(ctx, 15, 31, 7, 2.5, "#8a949c");
    ellipse(ctx, 15, 30.5, 6, 2, "#e8eef2");
    ellipse(ctx, 15, 31, 4, 1, "#9ac0d8");
    r(ctx, 12, 21, 6, 9, "#8a949c");
    r(ctx, 13, 21, 4, 8, "#e8eef2");
    vline(ctx, 13, 22, 6, P.white);
    hline(ctx, 12, 25, 6, "#3a5a8a");
    p(ctx, 18, 23, "#8a949c");
    p(ctx, 18, 24, "#8a949c");
    p(ctx, 11, 21, "#e8eef2");
    // Hairbrush, scent bottle, candle
    r(ctx, 26, 30, 6, 2, Wd.l);
    hline(ctx, 26, 30, 6, Wd.h);
    r(ctx, 32, 30, 3, 1, Wd.d);
    r(ctx, 35, 27, 2, 3, "#7a4a8a");
    p(ctx, 35, 26, BRASS.m);
    vline(ctx, 40, 24, 6, P.cream);
    p(ctx, 40, 23, P.fireYellow);
    r(ctx, 39, 29, 3, 1, BRASS.d);

    // Carcass with two drawers
    panel(ctx, 5, 36, 38, 16, Wd);
    for (const y of [38, 44]) {
        recess(ctx, 8, y, 32, 5, Wd);
        hline(ctx, 21, y + 2, 6, BRASS.d);
        p(ctx, 22, y + 2, BRASS.h);
    }
    // Turned legs + stretcher shelf
    leg(ctx, 6, 52, 62, 3, Wd);
    leg(ctx, 39, 52, 62, 3, Wd);
    hline(ctx, 9, 58, 30, Wd.d);
    hline(ctx, 9, 57, 30, Wd.l);
    r(ctx, 26, 55, 6, 2, "#d8ccb0");
}
