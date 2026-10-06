/**
 * Stable props: cobbled apron with a gutter, loose straw, hay bales, water
 * trough with pump, tack rack with saddle, oat bin and wheelbarrow.
 * All native 1x tile detail (32px per tile); light from the upper left.
 */
import { P } from "./palette";
import { discCrisp, hline, p, r, vline } from "./pixel";
import { ellipse, floorShadow, IRON, seeded, WOOD } from "./furnitureKit";
import type { ProceduralSpriteDef } from "./types";

const STRAW = ["#a89868", "#c4b480", "#b8a66e", "#8e7e50", "#d4c690"];
const LEATHER = { d: "#2e1a0e", m: "#4a2c18", l: "#6a4026", h: "#8a5834" };

// ---------------------------------------------------------------------------
// Floor decor
// ---------------------------------------------------------------------------

/** Cobbled apron along the stall fronts with a drainage gutter (w x 64). */
function drawCobbleApron(ctx: CanvasRenderingContext2D, w: number): void {
    const h = 64;
    r(ctx, 0, 0, w, h, "#2e2a26");
    const rand = seeded(4021);
    const tones = ["#6a645c", "#5c5650", "#746c62", "#625a50", "#56524c"];
    const rowH = 8;
    for (let row = 0; row * rowH < h - 12; row++) {
        const y = row * rowH + 1;
        let x = row % 2 ? -5 : 0;
        while (x < w) {
            const sw = 8 + Math.floor(rand() * 5);
            const c = tones[Math.floor(rand() * tones.length)];
            r(ctx, x + 1, y, sw - 2, rowH - 2, c);
            r(ctx, x, y + 1, sw, rowH - 4, c);
            hline(ctx, x + 1, y, sw - 3, "#8a8276"); // lit top edge
            p(ctx, x + 1, y + 1, "#8a8276");
            hline(ctx, x + 2, y + rowH - 2, sw - 3, "#3e3a34"); // shadowed underside
            if (rand() < 0.15) p(ctx, x + 3 + Math.floor(rand() * (sw - 5)), y + 2 + Math.floor(rand() * 3), "#4a5a3a"); // moss
            x += sw;
        }
    }
    // Kerb and gutter at the aisle edge
    const gy = h - 12;
    r(ctx, 0, gy, w, 3, "#7a7368");
    hline(ctx, 0, gy, w, "#948c80");
    r(ctx, 0, gy + 3, w, 6, "#22201e");
    r(ctx, 0, gy + 4, w, 3, "#2a3238");
    for (let x = 6; x < w; x += 23) hline(ctx, x, gy + 5, 6 + (x % 5), "#4a5a66"); // wet glints
    r(ctx, 0, gy + 9, w, 3, "#6a645c");
    hline(ctx, 0, gy + 9, w, "#827a6e");
    // Straw blown onto the stones
    for (let i = 0; i < w / 6; i++) {
        const x = Math.floor(rand() * w);
        const y = Math.floor(rand() * (gy - 2));
        const c = STRAW[Math.floor(rand() * STRAW.length)];
        if (rand() < 0.5) hline(ctx, x, y, 2 + Math.floor(rand() * 4), c);
        else for (let k = 0; k < 4; k++) p(ctx, x + k, y + (k >> 1), c);
    }
}

/** Loose straw on the floor; transparent background, denser in the middle. */
function drawStrawScatter(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number): void {
    const rand = seeded(seed);
    const cx = w / 2;
    const cy = h / 2;
    for (let i = 0; i < 150; i++) {
        // Approximate a soft blob: average two randoms per axis
        const x = Math.floor(cx + ((rand() + rand()) / 2 - 0.5) * w * 0.95);
        const y = Math.floor(cy + ((rand() + rand()) / 2 - 0.5) * h * 0.9);
        const len = 3 + Math.floor(rand() * 5);
        const c = STRAW[Math.floor(rand() * STRAW.length)];
        const dir = Math.floor(rand() * 4);
        for (let k = 0; k < len; k++) {
            const px = dir === 0 ? x + k : dir === 1 ? x + k : dir === 2 ? x + (k >> 1) : x - k;
            const py = dir === 0 ? y : dir === 1 ? y + (k >> 1) : y + k;
            if (px >= 0 && py >= 0 && px < w && py < h) p(ctx, px, py, c);
        }
        if (rand() < 0.3) p(ctx, x + 1, y + 1, "rgba(40,30,16,0.35)");
    }
}

// ---------------------------------------------------------------------------
// Hay bales (96x96)
// ---------------------------------------------------------------------------

function bale(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, frontH: number, topH: number): void {
    // Top face (lit)
    r(ctx, x + 2, y, w - 2, topH, "#c8b67a");
    hline(ctx, x + 2, y, w - 2, "#ddd0a0");
    // Front face
    const fy = y + topH;
    r(ctx, x, fy, w, frontH, "#a89462");
    vline(ctx, x + w - 1, fy, frontH, "#7a6a40");
    hline(ctx, x, fy + frontH - 1, w, "#6e5e38");
    // Straw texture
    const rand = seeded(x * 31 + y * 7);
    for (let i = 0; i < (w * frontH) / 9; i++) {
        const sx = x + 1 + Math.floor(rand() * (w - 3));
        const sy = fy + 1 + Math.floor(rand() * (frontH - 2));
        hline(ctx, sx, sy, 2 + Math.floor(rand() * 3), rand() < 0.5 ? "#c4b480" : "#8e7e50");
    }
    for (let i = 0; i < (w * topH) / 10; i++) {
        p(ctx, x + 3 + Math.floor(rand() * (w - 5)), y + 1 + Math.floor(rand() * (topH - 1)), rand() < 0.5 ? "#e0d4a4" : "#b0a06a");
    }
    // Twine bands over the top and down the front
    for (const k of [0.3, 0.7]) {
        const tx = x + Math.round(w * k);
        vline(ctx, tx + 1, y, topH, "#6a4e2a");
        vline(ctx, tx, fy, frontH - 1, "#5a4022");
    }
    // Stray ends sticking out of the sides
    for (let i = 0; i < 4; i++) {
        p(ctx, x - 1, fy + 2 + i * 4, "#c4b480");
        p(ctx, x + w, fy + 3 + i * 4, "#a89868");
    }
}

function drawHayBales(ctx: CanvasRenderingContext2D): void {
    floorShadow(ctx, 2, 88, 92, 5);
    bale(ctx, 4, 52, 42, 26, 10);
    bale(ctx, 48, 54, 42, 24, 10);
    bale(ctx, 22, 26, 44, 24, 10);
    // Loose straw at the foot of the stack
    const rand = seeded(88);
    for (let i = 0; i < 40; i++) {
        const x = 2 + Math.floor(rand() * 90);
        const y = 86 + Math.floor(rand() * 8);
        hline(ctx, x, y, 2 + Math.floor(rand() * 3), STRAW[Math.floor(rand() * STRAW.length)]);
    }
    // Pitchfork leaning on the stack
    for (let i = 0; i < 70; i++) {
        const x = Math.round(84 - i * 0.12);
        const y = 22 + i;
        p(ctx, x, y, i < 4 ? WOOD.l : "#8a6440");
        p(ctx, x + 1, y, "#5a3e24");
    }
    // Tines
    r(ctx, 80, 18, 9, 2, IRON.m);
    for (const tx of [80, 84, 88]) vline(ctx, tx, 8, 10, IRON.l);
    p(ctx, 84, 7, IRON.h);
}

// ---------------------------------------------------------------------------
// Water trough with pump (128x96)
// ---------------------------------------------------------------------------

function drawWaterTrough(ctx: CanvasRenderingContext2D): void {
    floorShadow(ctx, 6, 88, 120, 5);
    // Stone trough: rim, water, front face
    r(ctx, 6, 48, 118, 14, "#6a645c");
    hline(ctx, 6, 48, 118, "#948c80");
    r(ctx, 11, 51, 108, 8, "#24343e");
    r(ctx, 12, 52, 106, 6, "#2e4a5a");
    for (const [x, len] of [[20, 14], [56, 22], [96, 10]] as const) hline(ctx, x, 53, len, "#5a7a8a");
    hline(ctx, 30, 56, 8, "#3e5e6e");
    r(ctx, 6, 62, 118, 26, "#5c564e");
    hline(ctx, 6, 62, 118, "#3e3a34");
    for (let y = 68; y < 88; y += 7) hline(ctx, 7, y, 116, "#4e4942");
    for (const [x, y] of [[30, 63], [70, 70], [100, 63], [50, 77]] as const) vline(ctx, x, y, 6, "#4e4942");
    vline(ctx, 123, 48, 40, "#4a453e");
    vline(ctx, 6, 48, 40, "#7a7368");
    // Moss and damp stain along the base
    for (let x = 8; x < 122; x += 3) p(ctx, x, 86 - (x % 2), x % 9 === 0 ? "#4a5a3a" : "#3a3832");
    // Spill puddle in front
    ellipse(ctx, 40, 92, 14, 2, "rgba(60,90,110,0.35)");

    // Cast-iron pump at the left end
    r(ctx, 14, 14, 8, 36, IRON.d);
    r(ctx, 15, 14, 3, 36, IRON.l);
    r(ctx, 12, 12, 12, 4, IRON.m);
    hline(ctx, 12, 12, 12, IRON.h);
    discCrisp(ctx, 18, 10, 3, IRON.m);
    r(ctx, 12, 44, 12, 5, IRON.o);
    // Spout over the water, with a drip
    r(ctx, 22, 24, 10, 4, IRON.m);
    hline(ctx, 22, 24, 10, IRON.h);
    r(ctx, 30, 28, 3, 3, IRON.d);
    p(ctx, 31, 34, "#7aa0b4");
    p(ctx, 31, 42, "#5a8094");
    // Handle cranked up
    for (let i = 0; i < 13; i++) p(ctx, 10 - Math.round(i * 0.3), 15 - i, IRON.d);
    for (let i = 0; i < 13; i++) p(ctx, 11 - Math.round(i * 0.3), 15 - i, IRON.l);
    r(ctx, 5, 1, 4, 3, IRON.o);
}

// ---------------------------------------------------------------------------
// Tack rack and saddle (96x128)
// ---------------------------------------------------------------------------

function bridle(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Peg, headstall loop, browband, reins hanging in a curve, steel bit
    r(ctx, x + 6, y, 4, 3, WOOD.l);
    for (let i = 0; i < 22; i++) {
        p(ctx, x + 3 - Math.round(Math.sin((i / 22) * Math.PI) * 3), y + 3 + i, LEATHER.m);
        p(ctx, x + 12 + Math.round(Math.sin((i / 22) * Math.PI) * 3), y + 3 + i, LEATHER.d);
    }
    hline(ctx, x + 2, y + 8, 12, LEATHER.l);
    r(ctx, x + 3, y + 25, 10, 2, IRON.l);
    discCrisp(ctx, x + 3, y + 26, 2, IRON.h);
    discCrisp(ctx, x + 12, y + 26, 2, IRON.m);
    for (let i = 0; i < 16; i++) p(ctx, x + 7 + Math.round(Math.sin((i / 16) * Math.PI) * 4), y + 27 + i, LEATHER.m);
}

function drawTackRack(ctx: CanvasRenderingContext2D): void {
    floorShadow(ctx, 10, 122, 80, 5);
    // Plank board fixed to the wall
    r(ctx, 4, 6, 88, 60, WOOD.o);
    for (let y = 8; y < 64; y += 9) {
        r(ctx, 6, y, 84, 8, y % 18 === 8 ? WOOD.m : "#563a22");
        hline(ctx, 6, y, 84, WOOD.l);
    }
    for (const x of [8, 86]) for (const y of [12, 56]) p(ctx, x, y, IRON.h);
    // Two bridles, a padded horse collar, coiled rope
    bridle(ctx, 8, 12);
    bridle(ctx, 26, 12);
    ellipse(ctx, 60, 34, 13, 18, LEATHER.d);
    ellipse(ctx, 60, 33, 11, 16, LEATHER.l);
    ellipse(ctx, 60, 35, 6, 11, WOOD.o);
    for (let i = 0; i < 6; i++) p(ctx, 51 + i, 22 + i * 2, LEATHER.h);
    r(ctx, 57, 14, 6, 4, P.goldDark);
    hline(ctx, 58, 15, 4, P.gold);
    for (let ring = 0; ring < 3; ring++) {
        const rr = 8 - ring * 2;
        for (let a = 0; a < 24; a++) {
            const ang = (a / 24) * Math.PI * 2;
            p(ctx, Math.round(82 + Math.cos(ang) * rr * 0.6), Math.round(34 + Math.sin(ang) * rr), ring % 2 ? "#a08a5a" : "#c8b48a");
        }
    }

    // Saddle stand: A-frame trestle
    const leg = "#6a4a2c";
    for (const [x0, x1] of [[18, 26], [78, 70]] as const) {
        for (let y = 82; y < 122; y++) {
            const k = (y - 82) / 40;
            const x = Math.round(x1 + (x0 - x1) * k);
            r(ctx, x, y, 4, 1, leg);
            p(ctx, x, y, WOOD.l);
        }
    }
    r(ctx, 22, 78, 54, 6, WOOD.m);
    hline(ctx, 22, 78, 54, WOOD.l);
    r(ctx, 30, 102, 38, 3, WOOD.d);

    // Saddle blanket draped over the stand, hanging below the rail
    r(ctx, 20, 76, 58, 20, "#7a2a22");
    r(ctx, 20, 94, 58, 2, P.cream);
    vline(ctx, 20, 76, 20, "#5a1c16");
    vline(ctx, 77, 76, 20, "#5a1c16");
    for (let x = 22; x < 76; x += 4) p(ctx, x, 96, P.cream); // fringe
    hline(ctx, 20, 76, 58, "#9a3a2e");

    // Saddle: deep seat dipping between a raised pommel (left) and cantle (right)
    for (let x = 22; x < 76; x++) {
        const k = (x - 22) / 54;
        const top = Math.round(70 + Math.sin(k * Math.PI) * 5 - (k < 0.12 ? (0.12 - k) * 50 : 0) - (k > 0.82 ? (k - 0.82) * 45 : 0));
        const bottom = 80 + Math.round(Math.sin(k * Math.PI) * 2);
        vline(ctx, x, top, bottom - top, k < 0.15 || k > 0.8 ? LEATHER.m : LEATHER.l);
        p(ctx, x, top, LEATHER.h);
        p(ctx, x, bottom - 1, LEATHER.d);
    }
    // Seat stitching and the skirt
    for (let x = 32; x < 66; x += 3) p(ctx, x, 77, LEATHER.h);
    // Flap hanging over the blanket, with stirrup
    r(ctx, 40, 80, 18, 14, LEATHER.m);
    vline(ctx, 40, 80, 14, LEATHER.h);
    hline(ctx, 40, 93, 18, LEATHER.d);
    hline(ctx, 41, 80, 16, LEATHER.d);
    vline(ctx, 50, 94, 8, LEATHER.d); // stirrup leather
    r(ctx, 46, 104, 9, 2, IRON.l);
    vline(ctx, 46, 100, 5, IRON.m);
    vline(ctx, 54, 100, 5, IRON.m);
    hline(ctx, 47, 100, 7, IRON.m);
}

// ---------------------------------------------------------------------------
// Oat bin (64x64) and wheelbarrow (64x64)
// ---------------------------------------------------------------------------

function drawFeedBin(ctx: CanvasRenderingContext2D): void {
    floorShadow(ctx, 4, 58, 56, 4);
    // Lid propped open against the wall
    r(ctx, 6, 4, 52, 14, WOOD.d);
    r(ctx, 7, 5, 50, 12, WOOD.m);
    for (let x = 16; x < 56; x += 10) vline(ctx, x, 5, 12, WOOD.o);
    hline(ctx, 7, 5, 50, WOOD.l);
    // Interior with oats
    r(ctx, 6, 18, 52, 10, WOOD.o);
    const rand = seeded(17);
    r(ctx, 8, 20, 48, 7, "#b89a58");
    for (let i = 0; i < 60; i++) p(ctx, 8 + Math.floor(rand() * 48), 20 + Math.floor(rand() * 7), rand() < 0.5 ? "#d4b870" : "#94783e");
    // Tin scoop resting in the oats
    r(ctx, 36, 20, 9, 5, IRON.l);
    hline(ctx, 36, 20, 9, IRON.h);
    r(ctx, 45, 21, 6, 2, WOOD.l);
    // Front: planks with iron corner straps
    r(ctx, 4, 28, 56, 30, WOOD.d);
    for (let y = 30; y < 56; y += 7) {
        r(ctx, 5, y, 54, 6, y % 14 === 2 ? WOOD.m : "#563a22");
        hline(ctx, 5, y, 54, WOOD.l);
    }
    for (const x of [4, 55]) {
        r(ctx, x, 28, 5, 30, IRON.d);
        vline(ctx, x + 1, 28, 30, IRON.m);
        p(ctx, x + 2, 32, IRON.h);
        p(ctx, x + 2, 52, IRON.h);
    }
    // Stencilled "OATS"-ish mark
    r(ctx, 24, 40, 16, 6, "#3a2414");
    hline(ctx, 25, 42, 14, "#c8b48a");
}

function drawWheelbarrow(ctx: CanvasRenderingContext2D): void {
    floorShadow(ctx, 6, 56, 54, 4);
    // Handles and leg (behind the tray)
    for (let i = 0; i < 18; i++) p(ctx, 44 + i, 34 + Math.round(i * 0.2), WOOD.d);
    for (let i = 0; i < 18; i++) p(ctx, 44 + i, 35 + Math.round(i * 0.2), WOOD.m);
    vline(ctx, 46, 44, 12, WOOD.d);
    vline(ctx, 47, 44, 12, WOOD.m);
    // Tray: trapezoid of planks, wider at the top
    for (let y = 22; y < 44; y++) {
        const k = (y - 22) / 22;
        const x0 = Math.round(8 + k * 8);
        const x1 = Math.round(52 - k * 6);
        hline(ctx, x0, y, x1 - x0, (y - 22) % 7 === 0 ? WOOD.o : y < 24 ? WOOD.l : WOOD.m);
    }
    vline(ctx, 30, 23, 20, WOOD.d);
    // Load of soiled straw heaped above the rim
    const rand = seeded(51);
    ellipse(ctx, 30, 22, 20, 5, "#8e7e50");
    for (let i = 0; i < 50; i++) {
        const x = 12 + Math.floor(rand() * 38);
        const y = 17 + Math.floor(rand() * 8);
        hline(ctx, x, y, 2 + Math.floor(rand() * 3), rand() < 0.25 ? "#5a4a2a" : STRAW[Math.floor(rand() * STRAW.length)]);
    }
    // Iron-shod wheel with spokes, at the front
    discCrisp(ctx, 13, 48, 8, IRON.d);
    discCrisp(ctx, 13, 48, 6, WOOD.m);
    for (let a = 0; a < 4; a++) {
        const ang = (a / 4) * Math.PI + 0.3;
        for (let d = -5; d <= 5; d++) p(ctx, Math.round(13 + Math.cos(ang) * d), Math.round(48 + Math.sin(ang) * d), WOOD.d);
    }
    discCrisp(ctx, 13, 48, 1, IRON.l);
    p(ctx, 8, 42, IRON.h);
}

// ---------------------------------------------------------------------------

function def(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): ProceduralSpriteDef {
    return { nativeWidth: w, nativeHeight: h, draw };
}

export const STABLE_SPRITES: Record<string, ProceduralSpriteDef> = {
    stable_cobbles: def(23 * 32, 64, (ctx) => drawCobbleApron(ctx, 23 * 32)),
    straw_scatter: def(96, 64, (ctx) => drawStrawScatter(ctx, 96, 64, 7)),
    straw_scatter_b: def(64, 64, (ctx) => drawStrawScatter(ctx, 64, 64, 23)),
    hay_bales: def(96, 96, drawHayBales),
    water_trough: def(128, 96, drawWaterTrough),
    tack_rack: def(96, 128, drawTackRack),
    feed_bin: def(64, 64, drawFeedBin),
    wheelbarrow: def(64, 64, drawWheelbarrow)
};
