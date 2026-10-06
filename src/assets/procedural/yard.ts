/**
 * Courtyard props: woodpile with chopping block, washing line, rain barrel
 * and the kitchen herb bed. Native 1x tile detail
 * (32px per tile), light from the upper left.
 */
import { P } from "./palette";
import { discCrisp, hline, p, r, vline } from "./pixel";
import { ellipse, floorShadow, IRON, seeded, WOOD } from "./furnitureKit";
import type { ProceduralSpriteDef } from "./types";

const BARK = { d: "#3a2818", m: "#5a4028", l: "#7a5a38" };
const END_GRAIN = { d: "#a07a4a", m: "#c49a62", l: "#dcb880", ring: "#8a6438" };

// ---------------------------------------------------------------------------
// Woodpile with chopping block (96x96)
// ---------------------------------------------------------------------------

function logEnd(ctx: CanvasRenderingContext2D, cx: number, cy: number, rad: number): void {
    discCrisp(ctx, cx, cy, rad, BARK.d);
    discCrisp(ctx, cx, cy, rad - 1, END_GRAIN.m);
    discCrisp(ctx, cx - 1, cy - 1, rad - 2, END_GRAIN.l);
    if (rad > 3) discCrisp(ctx, cx, cy, Math.max(1, rad - 3), END_GRAIN.m);
    p(ctx, cx, cy, END_GRAIN.ring);
    p(ctx, cx + 1, cy - 1, END_GRAIN.d); // split check
}

function drawWoodpile(ctx: CanvasRenderingContext2D): void {
    floorShadow(ctx, 2, 88, 92, 5);
    // Lean-to roof sheltering the stack
    for (const x of [4, 60]) {
        r(ctx, x, 14, 4, 74, BARK.d);
        vline(ctx, x + 1, 14, 74, BARK.l);
    }
    for (let i = 0; i < 12; i++) hline(ctx, 0, 6 + i, 68, i % 4 === 0 ? "#2a2018" : i < 2 ? "#5a4a3a" : "#3e3228");
    for (let x = 4; x < 68; x += 8) vline(ctx, x, 6, 12, "#2a2018");
    hline(ctx, 0, 6, 68, "#6a5a48");
    // Stacked split logs: end grain facing us, rows offset like masonry
    const rand = seeded(61);
    for (let row = 0; row < 6; row++) {
        const y = 82 - row * 11;
        for (let col = 0; col < 5; col++) {
            const x = 13 + col * 11 + (row % 2) * 5;
            if (x > 58) continue;
            logEnd(ctx, x, y, 5 + Math.floor(rand() * 2));
        }
    }
    // Chopping block with the axe bitten into it
    ellipse(ctx, 80, 90, 12, 3, "rgba(0,0,0,0.3)");
    r(ctx, 70, 70, 20, 18, BARK.m);
    vline(ctx, 70, 70, 18, BARK.d);
    vline(ctx, 89, 70, 18, BARK.d);
    for (let y = 73; y < 88; y += 4) hline(ctx, 72, y, 2, BARK.d);
    ellipse(ctx, 80, 70, 10, 4, END_GRAIN.m);
    ellipse(ctx, 79, 69, 7, 2, END_GRAIN.l);
    hline(ctx, 74, 70, 12, END_GRAIN.ring);
    // Axe: head buried at an angle, haft rising to the right
    r(ctx, 76, 63, 7, 6, IRON.m);
    hline(ctx, 76, 63, 7, IRON.h);
    p(ctx, 76, 68, IRON.d);
    for (let i = 0; i < 18; i++) {
        p(ctx, 82 + Math.round(i * 0.55), 64 - i, "#8a6440");
        p(ctx, 83 + Math.round(i * 0.55), 64 - i, "#5a3e24");
    }
    // Wood chips scattered in front
    for (let i = 0; i < 18; i++) {
        const x = 62 + Math.floor(rand() * 32);
        const y = 88 + Math.floor(rand() * 7);
        hline(ctx, x, y, 2, rand() < 0.5 ? END_GRAIN.l : END_GRAIN.d);
    }
}

// ---------------------------------------------------------------------------
// Washing line (128x96)
// ---------------------------------------------------------------------------

function garment(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, base: string, shadow: string, stripe?: string): void {
    // Hangs from the line with a soft fold and a slightly ragged hem
    r(ctx, x, y, w, h, base);
    vline(ctx, x + w - 1, y, h, shadow);
    vline(ctx, x + Math.floor(w / 3), y + 2, h - 4, shadow);
    if (stripe) for (let sx = x + 2; sx < x + w - 1; sx += 4) vline(ctx, sx, y, h, stripe);
    for (let i = 0; i < w; i += 2) p(ctx, x + i, y + h, base);
    // Pegs
    for (const px of [x + 1, x + w - 2]) {
        r(ctx, px, y - 2, 1, 3, "#a08060");
        p(ctx, px, y - 2, "#c8a880");
    }
}

function drawWashingLine(ctx: CanvasRenderingContext2D): void {
    floorShadow(ctx, 4, 90, 120, 3);
    // T-posts
    for (const x of [6, 118]) {
        r(ctx, x, 14, 4, 78, BARK.m);
        vline(ctx, x, 14, 78, BARK.l);
        r(ctx, x - 4, 12, 12, 3, BARK.m);
        hline(ctx, x - 4, 12, 12, BARK.l);
        p(ctx, x + 1, 91, BARK.d);
    }
    // Sagging line
    const lineY = (x: number) => 15 + Math.round(Math.sin(((x - 8) / 112) * Math.PI) * 6);
    for (let x = 8; x < 120; x++) p(ctx, x, lineY(x), "#d8d0c0");
    // Sheets and shirts, drying
    garment(ctx, 16, lineY(16) + 1, 26, 34, "#ece6d8", "#c8c0b0");
    garment(ctx, 46, lineY(46) + 1, 14, 18, "#a8b8c8", "#7a8a9a", "#8898aa");
    garment(ctx, 64, lineY(64) + 1, 24, 30, "#f2ece0", "#cec6b4");
    garment(ctx, 92, lineY(92) + 1, 12, 16, "#e8d8b8", "#c0b090");
    // A pair of stockings
    garment(ctx, 108, lineY(108) + 1, 3, 12, "#5a5048", "#3e3630");
    garment(ctx, 112, lineY(112) + 1, 3, 11, "#5a5048", "#3e3630");
    // Peg basket at the foot of a post
    r(ctx, 12, 82, 12, 8, "#8a6a3a");
    hline(ctx, 12, 82, 12, "#a88a52");
    for (let x = 13; x < 23; x += 2) p(ctx, x, 85, "#6a4e28");
}

// ---------------------------------------------------------------------------
// Rain barrel (32x64)
// ---------------------------------------------------------------------------

function drawRainBarrel(ctx: CanvasRenderingContext2D): void {
    floorShadow(ctx, 3, 58, 26, 4);
    // Downpipe from the gutter above
    r(ctx, 20, 0, 4, 26, "#3a3e44");
    vline(ctx, 20, 0, 26, "#5a6068");
    r(ctx, 18, 24, 6, 3, "#3a3e44");
    // Staved barrel
    r(ctx, 4, 28, 24, 30, WOOD.m);
    for (let x = 6; x < 28; x += 4) vline(ctx, x, 28, 30, WOOD.d);
    vline(ctx, 4, 28, 30, WOOD.l);
    vline(ctx, 27, 28, 30, WOOD.o);
    for (const y of [32, 52]) {
        r(ctx, 3, y, 26, 2, IRON.d);
        hline(ctx, 3, y, 26, IRON.l);
    }
    // Open top with dark water
    ellipse(ctx, 16, 28, 12, 3, WOOD.d);
    ellipse(ctx, 16, 28, 10, 2, "#22323c");
    hline(ctx, 12, 28, 5, "#5a7a8a");
    p(ctx, 22, 61, "rgba(80,110,130,0.4)");
}

// ---------------------------------------------------------------------------
// Kitchen herb bed (96x64)
// ---------------------------------------------------------------------------

function drawHerbBed(ctx: CanvasRenderingContext2D): void {
    floorShadow(ctx, 2, 58, 92, 4);
    // Plank-edged raised bed of dark soil
    r(ctx, 2, 8, 92, 50, WOOD.d);
    r(ctx, 5, 11, 86, 44, "#3a2a1c");
    hline(ctx, 2, 8, 92, WOOD.l);
    hline(ctx, 2, 57, 92, WOOD.o);
    const rand = seeded(29);
    for (let i = 0; i < 60; i++) p(ctx, 6 + Math.floor(rand() * 84), 12 + Math.floor(rand() * 42), "#4a3826");
    // Rows of herbs: parsley, sage, chives, and a flowering thyme
    const rows: { y: number; leaf: string; hi: string; flower?: string }[] = [
        { y: 20, leaf: "#3e7a34", hi: "#6aaa50" },
        { y: 32, leaf: "#6a8a6a", hi: "#9ab89a" },
        { y: 44, leaf: "#4a8a3a", hi: "#7ab060", flower: "#b890d0" }
    ];
    for (const row of rows) {
        for (let x = 10; x < 88; x += 9) {
            const cx = x + Math.floor(rand() * 3);
            ellipse(ctx, cx, row.y, 4, 3, row.leaf);
            p(ctx, cx - 1, row.y - 2, row.hi);
            p(ctx, cx + 1, row.y - 1, row.hi);
            p(ctx, cx - 2, row.y, row.hi);
            if (row.flower && rand() < 0.7) {
                p(ctx, cx, row.y - 3, row.flower);
                p(ctx, cx + 2, row.y - 2, row.flower);
            }
        }
    }
    // Trowel stuck in the soil
    r(ctx, 82, 48, 3, 5, IRON.l);
    vline(ctx, 83, 42, 6, "#8a6440");
    p(ctx, 83, 42, P.wood);
}

function def(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): ProceduralSpriteDef {
    return { nativeWidth: w, nativeHeight: h, draw };
}

export const YARD_SPRITES: Record<string, ProceduralSpriteDef> = {
    woodpile: def(96, 96, drawWoodpile),
    washing_line: def(128, 96, drawWashingLine),
    rain_barrel: def(32, 64, drawRainBarrel),
    herb_bed: def(96, 64, drawHerbBed)
};
