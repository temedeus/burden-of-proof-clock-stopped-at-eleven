/**
 * Ballroom set: marble floor + wall tiles, inlaid dance-floor medallion,
 * crystal chandeliers, potted palms, harp and gilt chairs (2x unless noted).
 */
import { P } from "./palette";
import { discCrisp, hline, p, r, vline } from "./pixel";
import { ellipse, floorShadow, line, seeded } from "./furnitureKit";
import type { ProceduralSpriteDef } from "./types";

const GILT = { o: "#5a4418", d: P.goldDark, m: P.gold, h: "#ecd27a" };
const MARBLE = { grout: "#9a9084", cream: "#e0d8cb", creamShade: "#d0c6b6", vein: "#bcb0a0", hi: "#f2ede4" };
const SLATE = { d: "#2a2e36", m: "#3e4450", h: "#6a7280" };
/** Softer cabochon tones for the floor inserts. */
const CABOCHON = { d: "#7a7468", m: "#8a8478", h: "#a49e92" };
const VELVET = { o: "#2a060a", d: "#4a0c14", m: "#6e1620", l: "#922a32", h: "#b4444a" };

// ---------------------------------------------------------------------------
// Tiles (1x)
// ---------------------------------------------------------------------------

/** 32x32 — cream marble octagon; corner cuts form slate cabochons with neighbours. */
export function drawBallroomFloorTile(ctx: CanvasRenderingContext2D): void {
    const cut = 4;
    r(ctx, 0, 0, 32, 32, MARBLE.grout);
    for (let y = 0; y < 32; y++) {
        const inset = y < cut ? cut - y : y > 31 - cut ? y - (31 - cut) : 0;
        r(ctx, inset + 1, y, 31 - inset * 2, 1, MARBLE.cream);
    }
    // Slate cabochon quarters in each corner
    for (let i = 0; i < cut; i++) {
        r(ctx, 0, i, cut - i, 1, CABOCHON.m);
        r(ctx, 32 - (cut - i), i, cut - i, 1, CABOCHON.m);
        r(ctx, 0, 31 - i, cut - i, 1, CABOCHON.d);
        r(ctx, 32 - (cut - i), 31 - i, cut - i, 1, CABOCHON.d);
    }
    p(ctx, 1, 1, CABOCHON.h);
    // Veining + polish
    line(ctx, 6, 22, 14, 13, MARBLE.vein);
    line(ctx, 14, 13, 19, 15, MARBLE.vein);
    line(ctx, 19, 15, 26, 8, MARBLE.vein);
    p(ctx, 20, 22, MARBLE.vein);
    r(ctx, 8, 6, 8, 1, MARBLE.hi);
    r(ctx, 8, 7, 3, 1, MARBLE.hi);
    // Thin shaded bevel on the lower/right edges so slabs read as polished stone
    r(ctx, 31 - 0, 5, 1, 22, MARBLE.creamShade);
    r(ctx, 5, 31, 22, 1, MARBLE.creamShade);
}

/** 32x32 — side/bottom wall top: smooth cream stone coping (seamless). */
export function drawBallroomWallTile(ctx: CanvasRenderingContext2D): void {
    r(ctx, 0, 0, 32, 32, "#d8d0c2");
    r(ctx, 0, 0, 32, 1, "#e8e2d6");
    r(ctx, 0, 0, 1, 32, "#e8e2d6");
    r(ctx, 0, 31, 32, 1, "#bcb2a2");
    const rand = seeded(5);
    for (let i = 0; i < 14; i++) {
        p(ctx, Math.floor(rand() * 32), Math.floor(rand() * 32), rand() < 0.5 ? "#cec6b6" : "#e2dccf");
    }
    // Gilt fillet inlaid along the centre of the coping
    r(ctx, 15, 0, 2, 32, "#c8bca4");
    r(ctx, 0, 15, 32, 2, "#c8bca4");
    p(ctx, 15, 15, GILT.m);
    p(ctx, 16, 16, GILT.d);
}

// ---------------------------------------------------------------------------
// Dance-floor medallion (2x) — 144x112 native for a 9x7-tile inlay
// ---------------------------------------------------------------------------

export function drawBallroomMedallion(ctx: CanvasRenderingContext2D): void {
    const W = 144;
    const H = 112;
    const cx = W / 2;
    const cy = H / 2;
    // Muted inlay: thin rings and a slim pale star so it reads as part of the floor
    const ring = (rx: number, color: string) => ellipse(ctx, cx, cy, rx, rx * 0.74, color);
    ring(50, "#cfc4b2");
    ring(49, "#bfa978");
    ring(48, "#efe8dc");
    ring(43, "#d4c8b6");
    ring(42, "#efe8dc");
    for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        const long = k % 2 === 0;
        const len = long ? 34 : 18;
        const half = long ? 4 : 3;
        const tipX = cx + Math.cos(a) * len;
        const tipY = cy + Math.sin(a) * len * 0.74;
        const lx = cx + Math.cos(a + Math.PI / 2) * half;
        const ly = cy + Math.sin(a + Math.PI / 2) * half * 0.74;
        const rx = cx + Math.cos(a - Math.PI / 2) * half;
        const ry = cy + Math.sin(a - Math.PI / 2) * half * 0.74;
        fillTri(ctx, cx, cy, tipX, tipY, lx, ly, long ? "#ddcb98" : "#e2d2c8");
        fillTri(ctx, cx, cy, tipX, tipY, rx, ry, long ? "#c9b27e" : "#d2bcb2");
    }
    ellipse(ctx, cx, cy, 5, 4, "#bfa978");
    ellipse(ctx, cx, cy, 3, 2, "#b8c4ae");
    for (const [x, y] of [[48, 40], [92, 66]] as const) hline(ctx, x, y, 3, MARBLE.hi);
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

/** 48x48 @2x — open crystal chandelier: gilt rings hung with crystal strands (floor shows through). */
export function drawChandelier(ctx: CanvasRenderingContext2D): void {
    const cx = 24;
    const crystal = ["#f4fbff", "#c8e4f0", "#9ccbe0"];
    // Gilt ceiling rose + hook bracket on the beam above
    ellipse(ctx, cx, 3, 5, 3, GILT.o);
    ellipse(ctx, cx, 2.5, 4, 2, GILT.m);
    p(ctx, cx - 2, 2, GILT.h);
    p(ctx, cx, 5, GILT.d);
    p(ctx, cx, 6, GILT.m);
    // Chain down to the stem
    p(ctx, cx, 7, GILT.d);
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
}

/**
 * 48x64 @2x — soft shadow the chandelier casts on the floor. The sprite is taller
 * than the shadow so floor-decor sorting layers it above the medallion inlay.
 */
export function drawChandelierShadow(ctx: CanvasRenderingContext2D): void {
    for (const [rx, a] of [[21, 0.06], [16, 0.06], [11, 0.06], [6, 0.05]] as const) {
        ellipse(ctx, 24, 14, rx, rx * 0.4, `rgba(40,28,10,${a})`);
    }
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

/**
 * 1x — gilded coffered ceiling beam spanning the ballroom (overhead decor);
 * the chandeliers hang from it.
 */
export function drawBallroomCeilingBeam(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const beamH = 16;
    const top = Math.floor((h - beamH) / 2);
    const cream = { o: "#8a7e6a", d: "#c8bca4", m: "#e2d8c4", l: "#f2ecde" };
    // Soft shadow under the beam
    r(ctx, 0, top + beamH, w, 2, "rgba(0,0,0,0.12)");
    // Beam body
    r(ctx, 0, top, w, beamH, cream.o);
    r(ctx, 0, top + 1, w, beamH - 2, cream.m);
    r(ctx, 0, top + 1, w, 2, cream.l);
    r(ctx, 0, top + beamH - 3, w, 2, cream.d);
    // Gilt mouldings along both edges
    hline(ctx, 0, top + 3, w, GILT.m);
    hline(ctx, 0, top + beamH - 4, w, GILT.d);
    // Recessed coffers along the soffit
    for (let x = 14; x < w - 30; x += 32) {
        r(ctx, x, top + 5, 24, beamH - 10, cream.d);
        r(ctx, x + 1, top + 6, 22, beamH - 12, cream.l);
        p(ctx, x + 12, top + 7, GILT.m);
    }
    // Scrolled corbels where the beam meets the side walls
    for (const x of [0, w - 12]) {
        r(ctx, x, top - 2, 12, beamH + 6, cream.o);
        r(ctx, x + 1, top - 1, 10, beamH + 4, cream.m);
        hline(ctx, x + 1, top - 1, 10, GILT.m);
        discCrisp(ctx, x + 6, top + beamH, 3, GILT.d);
        discCrisp(ctx, x + 6, top + beamH, 2, GILT.m);
    }
}

export const BALLROOM_SPRITES: Record<string, ProceduralSpriteDef> = {
    ballroom_ceiling_beam: {
        nativeWidth: 736,
        nativeHeight: 32,
        draw: (ctx, w = 736, h = 32) => drawBallroomCeilingBeam(ctx, w, h)
    },
    ballroom_medallion: { nativeWidth: 144, nativeHeight: 112, draw: drawBallroomMedallion },
    chandelier: { nativeWidth: 48, nativeHeight: 48, draw: drawChandelier },
    chandelier_shadow: { nativeWidth: 48, nativeHeight: 64, draw: drawChandelierShadow },
    potted_palm: { nativeWidth: 32, nativeHeight: 48, draw: drawPottedPalm },
    harp: { nativeWidth: 32, nativeHeight: 48, draw: drawHarp }
};
