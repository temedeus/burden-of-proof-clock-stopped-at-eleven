/**
 * Ballroom set: oak parquet floor + wall tiles, inlaid border and marquetry
 * medallion, daylight/lighting layer, chandeliers, palms, harp, settee,
 * side tables and gilt chairs (2x unless noted).
 */
import { P } from "./palette";
import { discCrisp, hline, p, r, vline } from "./pixel";
import { ellipse, floorShadow, line, seeded } from "./furnitureKit";
import type { ProceduralSpriteDef } from "./types";

const GILT = { o: "#5a4418", d: P.goldDark, m: P.gold, h: "#ecd27a" };
const VELVET = { o: "#2a060a", d: "#4a0c14", m: "#6e1620", l: "#922a32", h: "#b4444a" };

// ---------------------------------------------------------------------------
// Tiles (1x)
// ---------------------------------------------------------------------------

const OAK = {
    gap: "#6a4424",
    tones: ["#8e5e34", "#946238", "#8a5a32", "#966840", "#8c5c34"],
    grain: "#80522e",
    polish: "#a87444"
};

/** Sprite names for the parquet variants, chosen by tile position. */
export const BALLROOM_FLOOR_SPRITES = ["floor_marble", "floor_marble_b", "floor_marble_c", "floor_marble_d"] as const;

export function ballroomFloorSpriteName(x: number, y: number): string {
    return BALLROOM_FLOOR_SPRITES[(((x * 7 + y * 13) % 4) + 4) % 4];
}

/**
 * 32x32 — polished oak basketweave parquet: 8px squares of two 4px slats,
 * alternating direction. Slat tones/grain vary per variant so no grid repeats.
 */
export function drawBallroomFloorTile(ctx: CanvasRenderingContext2D, variant = 0): void {
    const rand = seeded(101 + variant * 37);
    for (let sy = 0; sy < 4; sy++) {
        for (let sx = 0; sx < 4; sx++) {
            const x0 = sx * 8;
            const y0 = sy * 8;
            const horizontal = (sx + sy) % 2 === 0;
            for (let k = 0; k < 2; k++) {
                const tone = OAK.tones[Math.floor(rand() * OAK.tones.length)];
                const [x, y, w, h] = horizontal ? [x0, y0 + k * 4, 8, 4] : [x0 + k * 4, y0, 4, 8];
                r(ctx, x, y, w, h, tone);
                // Grain streak along the slat
                if (horizontal) hline(ctx, x + 1 + Math.floor(rand() * 3), y + 1 + Math.floor(rand() * 2), 3 + Math.floor(rand() * 3), OAK.grain);
                else vline(ctx, x + 1 + Math.floor(rand() * 2), y + 1 + Math.floor(rand() * 3), 3 + Math.floor(rand() * 3), OAK.grain);
                // Seam on the slat's far long edge
                if (horizontal) hline(ctx, x, y + h - 1, w, OAK.gap);
                else vline(ctx, x + w - 1, y, h, OAK.gap);
                // Occasional polish glint
                if (rand() < 0.15) p(ctx, x + 1, y + 1, OAK.polish);
            }
            // Square border seam (darker end grain)
            if (horizontal) vline(ctx, x0 + 7, y0, 8, "#5e3c20");
            else hline(ctx, x0, y0 + 7, 8, "#5e3c20");
        }
    }
}

/** 32x32 — side/bottom wall top: smooth cream stone coping (seamless). */
export function drawBallroomWallTile(ctx: CanvasRenderingContext2D): void {
    r(ctx, 0, 0, 32, 32, "#d8d0c2");
    const rand = seeded(5);
    for (let i = 0; i < 14; i++) {
        p(ctx, Math.floor(rand() * 32), Math.floor(rand() * 32), rand() < 0.5 ? "#cec6b6" : "#e2dccf");
    }
}

// ---------------------------------------------------------------------------
// Dance-floor medallion (2x) — 144x112 native for a 9x7-tile inlay
// ---------------------------------------------------------------------------

const MARQUETRY = { walnut: "#5a3820", walnutL: "#6e482a", maple: "#b08050", mapleL: "#c09060", cherry: "#9a5a36", cherryD: "#8a4e2e" };

/** 144x112 @2x — marquetry compass star: maple field, walnut/cherry points, brass stringing. */
export function drawBallroomMedallion(ctx: CanvasRenderingContext2D): void {
    const W = 144;
    const H = 112;
    const cx = W / 2;
    const cy = H / 2;
    const ring = (rx: number, color: string) => ellipse(ctx, cx, cy, rx, rx * 0.74, color);
    ring(48, MARQUETRY.walnut);
    ring(46, GILT.d);
    ring(45, MARQUETRY.walnut);
    ring(42, MARQUETRY.maple);
    // Subtle radial grain in the maple field
    for (let k = 0; k < 24; k++) {
        const a = (k / 24) * Math.PI * 2;
        line(ctx, cx + Math.cos(a) * 30, cy + Math.sin(a) * 22, cx + Math.cos(a) * 40, cy + Math.sin(a) * 29.6, MARQUETRY.mapleL);
    }
    for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        const long = k % 2 === 0;
        const len = long ? 30 : 17;
        const half = long ? 4 : 3;
        const tipX = cx + Math.cos(a) * len;
        const tipY = cy + Math.sin(a) * len * 0.74;
        const lx = cx + Math.cos(a + Math.PI / 2) * half;
        const ly = cy + Math.sin(a + Math.PI / 2) * half * 0.74;
        const rx = cx + Math.cos(a - Math.PI / 2) * half;
        const ry = cy + Math.sin(a - Math.PI / 2) * half * 0.74;
        fillTri(ctx, cx, cy, tipX, tipY, lx, ly, long ? "#d0a46c" : MARQUETRY.cherry);
        fillTri(ctx, cx, cy, tipX, tipY, rx, ry, long ? "#9a7046" : MARQUETRY.cherryD);
    }
    ellipse(ctx, cx, cy, 6, 4.5, MARQUETRY.walnut);
    ellipse(ctx, cx, cy, 4, 3, GILT.m);
    p(ctx, cx - 1, cy - 1, GILT.h);
}

/**
 * 608x320 @1x (19x10 tiles) — walnut border with maple stringing and corner
 * rosettes framing the dance floor; interior transparent.
 */
export function drawBallroomFloorBorder(ctx: CanvasRenderingContext2D, w = 608, h = 320): void {
    const band = 12;
    const inset = 4;
    const x0 = inset;
    const y0 = inset;
    const x1 = w - inset;
    const y1 = h - inset;
    const frame = (x: number, y: number, fw: number, fh: number, thick: number, color: string) => {
        r(ctx, x, y, fw, thick, color);
        r(ctx, x, y + fh - thick, fw, thick, color);
        r(ctx, x, y, thick, fh, color);
        r(ctx, x + fw - thick, y, thick, fh, color);
    };
    frame(x0, y0, x1 - x0, y1 - y0, band, MARQUETRY.walnut);
    // Maple stringing lines inside the walnut band + brass fillet
    frame(x0 + 2, y0 + 2, x1 - x0 - 4, y1 - y0 - 4, 1, MARQUETRY.maple);
    frame(x0 + band - 3, y0 + band - 3, x1 - x0 - (band - 3) * 2, y1 - y0 - (band - 3) * 2, 1, MARQUETRY.maple);
    frame(x0 + 5, y0 + 5, x1 - x0 - 10, y1 - y0 - 10, 1, GILT.d);
    // Walnut band grain
    const rand = seeded(9);
    for (let i = 0; i < 80; i++) {
        const along = rand() < 0.5;
        const t = rand();
        const off = 3 + Math.floor(rand() * (band - 6));
        if (along) {
            const yy = rand() < 0.5 ? y0 + off : y1 - band + off;
            hline(ctx, Math.round(x0 + band + t * (x1 - x0 - band * 2 - 6)), yy, 4, MARQUETRY.walnutL);
        } else {
            const xx = rand() < 0.5 ? x0 + off : x1 - band + off;
            vline(ctx, xx, Math.round(y0 + band + t * (y1 - y0 - band * 2 - 6)), 4, MARQUETRY.walnutL);
        }
    }
    // Corner rosettes (inlaid squares with a brass dot)
    for (const [cx, cy] of [[x0, y0], [x1 - band, y0], [x0, y1 - band], [x1 - band, y1 - band]] as const) {
        r(ctx, cx, cy, band, band, MARQUETRY.maple);
        r(ctx, cx + 2, cy + 2, band - 4, band - 4, MARQUETRY.cherry);
        r(ctx, cx + 4, cy + 4, band - 8, band - 8, MARQUETRY.mapleL);
        p(ctx, cx + band / 2, cy + band / 2, GILT.m);
    }
}

/**
 * 736x448 @1x (23x14 tiles) — daylight + ambient occlusion over the ballroom
 * floor: window-shaped light pools with glazing-bar shadows, reflections of
 * the windows near the wall, and darker corners/edges away from the light.
 */
export function drawBallroomLighting(ctx: CanvasRenderingContext2D, w = 736, h = 448): void {
    // Matches ballroom_windows.ts layout: 6 windows, 22px pilasters, 97px windows
    const pil = 22;
    const winW = Math.floor((w - pil * 7) / 6);
    // Light pools cast through each window, fading with distance
    const poolLen = 200;
    for (let i = 0; i < 6; i++) {
        const wx = pil + i * (winW + pil);
        for (let dy = 0; dy < poolLen; dy++) {
            const t = dy / poolLen;
            const a = 0.34 * (1 - t) * (1 - t);
            const spread = Math.round(t * 10);
            const x0 = wx + 6 - spread;
            const pw = winW - 12 + spread * 2;
            // Glazing-bar shadows: skip transom rows and mullion columns
            const transom = Math.floor(dy / 24) % 1 === 0 && dy % 24 < 2;
            if (transom) continue;
            ctx.fillStyle = `rgba(255,230,176,${a.toFixed(3)})`;
            const bar = (pw / 4) | 0;
            for (let k = 0; k < 4; k++) {
                const sx = x0 + k * bar + (k > 0 ? 2 : 0);
                ctx.fillRect(sx, dy, bar - (k > 0 ? 2 : 0), 1);
            }
        }
        // Mirror-like reflection of the window frame in the polish right below the wall
        for (let dy = 0; dy < 10; dy++) {
            ctx.fillStyle = `rgba(200,225,255,${(0.16 * (1 - dy / 10)).toFixed(3)})`;
            ctx.fillRect(wx + 10, dy, winW - 20, 1);
        }
    }
    // Ambient occlusion: darker toward the side walls, the south wall and the corners
    for (let i = 0; i < 64; i++) {
        const a = 0.2 * (1 - i / 64) ** 2;
        ctx.fillStyle = `rgba(30,16,4,${a.toFixed(3)})`;
        ctx.fillRect(i, 0, 1, h);
        ctx.fillRect(w - 1 - i, 0, 1, h);
    }
    for (let i = 0; i < 120; i++) {
        const a = 0.22 * (i / 120) ** 2;
        ctx.fillStyle = `rgba(30,16,4,${a.toFixed(3)})`;
        ctx.fillRect(0, h - 120 + i, w, 1);
    }
}

function fillTri(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    color: string
): void {
    const minX = Math.floor(Math.min(x1, x2, x3));
    const maxX = Math.ceil(Math.max(x1, x2, x3));
    const minY = Math.floor(Math.min(y1, y2, y3));
    const maxY = Math.ceil(Math.max(y1, y2, y3));
    const e = (ax: number, ay: number, bx: number, by: number, px: number, py: number) =>
        (bx - ax) * (py - ay) - (by - ay) * (px - ax);
    const area = e(x1, y1, x2, y2, x3, y3);
    if (area === 0) return;
    ctx.fillStyle = color;
    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            const sx = x + 0.5;
            const sy = y + 0.5;
            if (
                e(x2, y2, x3, y3, sx, sy) * area >= 0 &&
                e(x3, y3, x1, y1, sx, sy) * area >= 0 &&
                e(x1, y1, x2, y2, sx, sy) * area >= 0
            ) {
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Chandelier (2x, overhead) — 48x48 native
// ---------------------------------------------------------------------------

/** Open gilt ring (ellipse outline) for chandelier tiers. */
function giltRing(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number): void {
    const steps = Math.ceil(rx * 7);
    for (let i = 0; i < steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        const x = Math.round(cx + Math.cos(a) * rx);
        const y = Math.round(cy + Math.sin(a) * ry);
        p(ctx, x, y, Math.sin(a) > 0 ? GILT.m : GILT.d);
    }
    // Lit front edge
    for (let i = 0; i < steps / 2; i++) {
        const a = (i / steps) * Math.PI * 2 + 0.3;
        if (Math.sin(a) > 0.6) p(ctx, Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), GILT.h);
    }
}

/** 48x64 @2x — open crystal chandelier hanging on a long chain from a ceiling rose. */
export function drawChandelier(ctx: CanvasRenderingContext2D): void {
    const cx = 24;
    const crystal = ["#f4fbff", "#c8e4f0", "#9ccbe0"];
    // Ceiling rose at the top: plaster boss with a gilt centre
    ellipse(ctx, cx, 3, 7, 3, "#c8bca4");
    ellipse(ctx, cx, 2.5, 5, 2, "#e2d8c4");
    ellipse(ctx, cx, 3, 2, 1, GILT.m);
    // Long chain (alternating links) down to the stem
    for (let y = 5; y < 24; y++) p(ctx, cx, y, y % 2 ? GILT.m : GILT.d);
    for (let y = 6; y < 24; y += 4) {
        p(ctx, cx - 1, y, GILT.d);
        p(ctx, cx + 1, y, GILT.d);
    }
    ctx.save();
    ctx.translate(0, 16);
    // Central baluster stem
    for (let y = 8; y < 36; y++) {
        const bulge = y > 14 && y < 20 ? 1 : y > 26 && y < 30 ? 1 : 0;
        r(ctx, cx - bulge, y, 1 + bulge * 2, 1, GILT.m);
        p(ctx, cx - bulge, y, GILT.h);
    }
    // Three tiers of open rings with crystal strands hanging from them
    const tiers: [number, number, number][] = [
        [14, 8, 8],
        [22, 15, 12],
        [30, 20, 16]
    ];
    for (const [ry, rx, n] of tiers) {
        for (const side of [-1, 1]) line(ctx, cx, ry - 2, cx + side * rx, ry, GILT.d);
        giltRing(ctx, cx, ry, rx, rx * 0.28);
        for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2;
            const x = Math.round(cx + Math.cos(a) * rx);
            const y = Math.round(ry + Math.sin(a) * rx * 0.28);
            const len = 2 + ((i * 7) % 3);
            for (let k = 1; k <= len; k++) p(ctx, x, y + k, crystal[(i + k) % 3]);
            if (i % 2 === 0) p(ctx, x, y + len + 1, "#ffffff");
        }
    }
    // Candles on the middle tier
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const x = Math.round(cx + Math.cos(a) * 15);
        const y = Math.round(22 + Math.sin(a) * 4);
        vline(ctx, x, y - 4, 4, P.cream);
        p(ctx, x, y - 5, P.fireYellow);
    }
    // Hanging pendant drop
    vline(ctx, cx, 36, 4, GILT.d);
    discCrisp(ctx, cx, 42, 2, crystal[1]);
    p(ctx, cx - 1, 41, "#ffffff");
    ctx.restore();
}

// ---------------------------------------------------------------------------
// Potted palm (2x) — 32x48 native, 2x3 tiles
// ---------------------------------------------------------------------------

export function drawPottedPalm(ctx: CanvasRenderingContext2D): void {
    floorShadow(ctx, 8, 46, 16, 2);
    // Glazed jardinière on a gilt stand
    r(ctx, 10, 44, 12, 2, GILT.d);
    for (let y = 33; y < 44; y++) {
        const t = (y - 33) / 11;
        const half = Math.round(8 - t * 3);
        hline(ctx, 16 - half, y, half * 2, "#2e5a6a");
        p(ctx, 16 - half, y, "#1e3a46");
        p(ctx, 16 - half + 1, y, "#4a8a9a");
        p(ctx, 15 + half, y, "#1e3a46");
    }
    hline(ctx, 7, 33, 18, "#4a8a9a");
    hline(ctx, 8, 36, 16, GILT.m);
    // Trunk
    for (let y = 18; y < 34; y++) {
        p(ctx, 15, y, "#5a4024");
        p(ctx, 16, y, y % 3 === 0 ? "#3a2814" : "#7a5634");
    }
    // Fronds arching out from the crown
    const fronds: [number, number, number][] = [
        [-1.2, 15, 1], [-0.7, 16, 0], [-0.2, 14, 1], [0.3, 15, 0], [0.8, 16, 1], [1.3, 14, 0], [-1.6, 11, 0], [1.7, 11, 1]
    ];
    for (const [a, len, shade] of fronds) {
        for (let k = 1; k <= len; k++) {
            const t = k / len;
            const x = Math.round(16 + Math.sin(a) * k);
            const y = Math.round(18 - Math.cos(a) * k * 0.9 + t * t * 8);
            p(ctx, x, y, shade ? "#2e6a34" : "#3e8a44");
            if (k % 2 === 0) {
                p(ctx, x - 1, y + 1, "#245a2a");
                p(ctx, x + 1, y + 1, "#4ea054");
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Concert harp (2x) — 32x48 native, 2x3 tiles
// ---------------------------------------------------------------------------

export function drawHarp(ctx: CanvasRenderingContext2D): void {
    floorShadow(ctx, 8, 45, 18, 2);
    // Soundboard (slanted body) from base to the neck
    for (let y = 10; y < 44; y++) {
        const t = (y - 10) / 34;
        const x = Math.round(20 - t * 8);
        const w = 3 + Math.round(t * 3);
        r(ctx, x, y, w, 1, "#7a4a24");
        p(ctx, x, y, "#a06a34");
        p(ctx, x + w - 1, y, "#4a2a14");
    }
    // Gilt column (pillar) up the front
    r(ctx, 8, 6, 3, 38, GILT.d);
    vline(ctx, 8, 6, 38, GILT.h);
    vline(ctx, 9, 6, 38, GILT.m);
    // Carved crown on the column
    ellipse(ctx, 9, 5, 3, 2, GILT.m);
    p(ctx, 8, 3, GILT.h);
    // Curved neck from the column top to the soundboard
    for (let i = 0; i <= 12; i++) {
        const x = 10 + i;
        const y = Math.round(6 + Math.sin((i / 12) * Math.PI) * -2 + i * 0.3);
        r(ctx, x, y, 1, 3, GILT.m);
        p(ctx, x, y, GILT.h);
    }
    // Strings
    for (let i = 0; i < 9; i++) {
        const sx = 11 + i;
        const top = Math.round(9 + i * 0.3);
        const bottom = Math.round(42 - i * 3.6);
        line(ctx, sx, top, Math.round(20 - ((bottom - 10) / 34) * 8), bottom, i % 7 === 0 ? "#c84a3a" : "#e8e0d0");
    }
    // Pedestal base
    r(ctx, 7, 43, 16, 3, GILT.d);
    hline(ctx, 7, 43, 16, GILT.h);
}

// ---------------------------------------------------------------------------
// Gilt chair (2x) — 32x48 native, 2x3 tiles
// ---------------------------------------------------------------------------

export function drawGiltChair(ctx: CanvasRenderingContext2D): void {
    floorShadow(ctx, 7, 45, 18, 2);
    // Back legs
    vline(ctx, 9, 30, 15, GILT.d);
    vline(ctx, 22, 30, 15, GILT.d);
    // Oval medallion back with velvet panel
    ellipse(ctx, 16, 14, 9, 12, GILT.o);
    ellipse(ctx, 16, 14, 8, 11, GILT.m);
    ellipse(ctx, 16, 14, 6, 9, VELVET.m);
    ellipse(ctx, 15, 12, 4, 6, VELVET.l);
    p(ctx, 13, 8, VELVET.h);
    // Carved crest + uprights
    r(ctx, 14, 1, 4, 2, GILT.m);
    p(ctx, 15, 0, GILT.h);
    vline(ctx, 8, 14, 16, GILT.m);
    vline(ctx, 23, 14, 16, GILT.d);
    // Seat (seen from above-front) with a gilt apron
    r(ctx, 6, 26, 20, 7, GILT.o);
    r(ctx, 7, 26, 18, 5, VELVET.m);
    hline(ctx, 7, 26, 18, VELVET.h);
    r(ctx, 8, 27, 6, 2, VELVET.l);
    r(ctx, 6, 31, 20, 3, GILT.m);
    hline(ctx, 6, 31, 20, GILT.h);
    p(ctx, 16, 32, GILT.d);
    // Cabriole front legs
    for (const x of [7, 23]) {
        vline(ctx, x, 34, 9, GILT.m);
        vline(ctx, x + 1, 35, 8, GILT.d);
        p(ctx, x + (x < 16 ? -1 : 2), 43, GILT.d);
        p(ctx, x, 44, GILT.h);
    }
}

// ---------------------------------------------------------------------------
// Side-view gilt chair (2x) — 16x32 native, 1x2 tiles, facing east
// ---------------------------------------------------------------------------

export function drawGiltChairSide(ctx: CanvasRenderingContext2D): void {
    floorShadow(ctx, 2, 30, 13, 2);
    // Back legs + back upright (chair faces right, back on the left)
    vline(ctx, 3, 4, 26, GILT.d);
    vline(ctx, 4, 4, 22, GILT.m);
    p(ctx, 4, 3, GILT.h);
    // Oval velvet back seen obliquely
    ellipse(ctx, 5, 10, 2.5, 6, GILT.o);
    ellipse(ctx, 5, 10, 1.6, 5, VELVET.m);
    vline(ctx, 4, 7, 6, VELVET.l);
    // Seat cushion + gilt apron
    r(ctx, 3, 17, 11, 3, VELVET.m);
    hline(ctx, 3, 17, 11, VELVET.h);
    r(ctx, 3, 20, 11, 2, GILT.m);
    hline(ctx, 3, 20, 11, GILT.h);
    // Cabriole legs
    for (const x of [4, 12]) {
        vline(ctx, x, 22, 8, GILT.m);
        vline(ctx, x + 1, 23, 6, GILT.d);
        p(ctx, x + (x > 8 ? 1 : -1), 29, GILT.d);
    }
}

function mirrored(draw: (ctx: CanvasRenderingContext2D) => void, w: number): (ctx: CanvasRenderingContext2D) => void {
    return (ctx) => {
        ctx.save();
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
        draw(ctx);
        ctx.restore();
    };
}

// ---------------------------------------------------------------------------
// Velvet settee (2x) — 48x32 native, 3x2 tiles, front view
// ---------------------------------------------------------------------------

export function drawSettee(ctx: CanvasRenderingContext2D): void {
    floorShadow(ctx, 3, 29, 42, 3);
    // Carved gilt back crest
    for (let y = 2; y < 14; y++) {
        const t = Math.max(0, (6 - y) / 4);
        const inset = Math.round(14 * t * t);
        r(ctx, 5 + inset, y, 38 - inset * 2, 1, y < 4 ? GILT.m : VELVET.m);
        p(ctx, 5 + inset, y, GILT.d);
        p(ctx, 42 - inset, y, GILT.d);
    }
    discCrisp(ctx, 24, 2, 2, GILT.m);
    // Button tufting on the back
    for (let y = 6; y < 13; y += 3) for (let x = 10 + (y % 2) * 3; x < 39; x += 6) p(ctx, x, y, VELVET.d);
    hline(ctx, 7, 5, 34, VELVET.h);
    // Seat
    r(ctx, 5, 14, 38, 6, VELVET.l);
    hline(ctx, 5, 14, 38, VELVET.h);
    for (const x of [17, 30]) vline(ctx, x, 14, 6, VELVET.m);
    // Rolled arms
    for (const x of [2, 40]) {
        r(ctx, x, 9, 6, 12, VELVET.m);
        r(ctx, x, 9, 6, 2, VELVET.h);
        r(ctx, x + (x < 24 ? 0 : 5), 9, 1, 12, GILT.m);
    }
    // Gilt seat rail + cabriole legs
    r(ctx, 3, 20, 42, 3, GILT.m);
    hline(ctx, 3, 20, 42, GILT.h);
    hline(ctx, 3, 22, 42, GILT.d);
    for (const x of [5, 23, 41]) {
        vline(ctx, x, 23, 6, GILT.m);
        p(ctx, x + 1, 24, GILT.d);
        p(ctx, x + (x < 24 ? -1 : 1), 28, GILT.d);
    }
}

// ---------------------------------------------------------------------------
// Gueridon side table (2x) — 16x32 native, 1x2 tiles
// ---------------------------------------------------------------------------

export function drawGueridon(ctx: CanvasRenderingContext2D): void {
    floorShadow(ctx, 3, 30, 10, 2);
    // Tripod foot + pedestal
    hline(ctx, 3, 29, 10, GILT.d);
    p(ctx, 2, 28, GILT.m);
    p(ctx, 13, 28, GILT.m);
    vline(ctx, 7, 17, 12, GILT.m);
    vline(ctx, 8, 17, 12, GILT.d);
    // Round marble top with gilt gallery rim
    ellipse(ctx, 8, 15, 7, 2.5, GILT.d);
    ellipse(ctx, 8, 14.5, 6, 2, "#e8e2d8");
    hline(ctx, 4, 13, 5, "#ffffff");
    // Vase of flowers
    r(ctx, 7, 9, 3, 5, "#2e5a6a");
    p(ctx, 7, 9, "#4a8a9a");
    for (const [x, y, c] of [[6, 6, "#c8404a"], [8, 5, "#f0d8e0"], [10, 6, "#e8b040"], [7, 4, "#c8404a"], [9, 7, "#3e8a44"], [5, 8, "#3e8a44"], [11, 8, "#3e8a44"]] as const) {
        p(ctx, x, y, c);
    }
}

export const BALLROOM_SPRITES: Record<string, ProceduralSpriteDef> = {
    floor_marble_b: { nativeWidth: 32, nativeHeight: 32, draw: (ctx) => drawBallroomFloorTile(ctx, 1) },
    floor_marble_c: { nativeWidth: 32, nativeHeight: 32, draw: (ctx) => drawBallroomFloorTile(ctx, 2) },
    floor_marble_d: { nativeWidth: 32, nativeHeight: 32, draw: (ctx) => drawBallroomFloorTile(ctx, 3) },
    ballroom_medallion: { nativeWidth: 144, nativeHeight: 112, draw: drawBallroomMedallion },
    ballroom_floor_border: { nativeWidth: 608, nativeHeight: 320, draw: (ctx) => drawBallroomFloorBorder(ctx) },
    ballroom_lighting: { nativeWidth: 736, nativeHeight: 448, draw: (ctx) => drawBallroomLighting(ctx) },
    chandelier: { nativeWidth: 48, nativeHeight: 64, draw: drawChandelier },
    potted_palm: { nativeWidth: 32, nativeHeight: 48, draw: drawPottedPalm },
    harp: { nativeWidth: 32, nativeHeight: 48, draw: drawHarp },
    ballroom_chair_e: { nativeWidth: 16, nativeHeight: 32, draw: drawGiltChairSide },
    ballroom_chair_w: { nativeWidth: 16, nativeHeight: 32, draw: mirrored(drawGiltChairSide, 16) },
    settee: { nativeWidth: 48, nativeHeight: 32, draw: drawSettee },
    gueridon: { nativeWidth: 16, nativeHeight: 32, draw: drawGueridon }
};
