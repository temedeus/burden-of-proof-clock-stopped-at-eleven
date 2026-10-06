/**
 * Staircases (96x64 @1x, 3x2 tiles) in context-specific variants.
 *
 * - "up": stairs climb into the north wall (hall, landing_east, cellar).
 * - "down": a stairwell opening at the south edge (landing, attic), flanked by
 *   banisters that continue the landing balustrade.
 *
 * Material follows the floor: carpeted manor oak, rough attic boards, or cellar stone.
 */
import { P } from "./palette";
import { hline, p, r, shade, vline } from "./pixel";
import type { ProceduralSpriteDef } from "./types";

export type StairMaterial = "manor" | "attic" | "stone";
export type StairDirection = "up" | "down";

interface StairPalette {
    tread: string;
    treadLit: string;
    nosing: string;
    riser: string;
    void: string;
    rail: string;
    railLit: string;
    railDark: string;
    runner?: { base: string; lit: string; dark: string; rod: string };
}

const PALETTES: Record<StairMaterial, StairPalette> = {
    manor: {
        tread: P.wood,
        treadLit: P.woodLight,
        nosing: P.woodHi,
        riser: P.woodDark,
        void: "#120a06",
        rail: P.wood,
        railLit: P.woodHi,
        railDark: P.woodDark,
        runner: { base: "#6a1c22", lit: "#8a2c30", dark: "#4a1016", rod: P.gold }
    },
    attic: {
        tread: P.atticWood,
        treadLit: P.atticWoodLight,
        nosing: P.atticWoodHi,
        riser: P.atticWoodDark,
        void: "#0c0806",
        rail: P.atticWoodAlt,
        railLit: P.atticWoodLight,
        railDark: P.atticWoodSeam
    },
    stone: {
        // Matches the cellar's rock walls and floor
        tread: P.rockMid,
        treadLit: P.rockLight,
        nosing: "#5a5860",
        riser: P.rockDark,
        void: P.rockVoid,
        rail: "#2a2e32",
        railLit: "#5a6268",
        railDark: "#141618"
    }
};

/** Darken toward the void as steps get further away. */
function depthShade(color: string, depth: number): string {
    return shade(color, -0.55 * depth);
}

function drawTreads(
    ctx: CanvasRenderingContext2D,
    pal: StairPalette,
    material: StairMaterial,
    x0: number,
    x1: number,
    top: number,
    bottom: number,
    steps: number,
    farIsTop: boolean
): void {
    const pitch = (bottom - top) / steps;
    for (let i = 0; i < steps; i++) {
        // depth 0 = nearest/brightest step, 1 = furthest/darkest
        const depth = farIsTop ? (steps - 1 - i) / (steps - 1) : i / (steps - 1);
        const y = Math.round(top + i * pitch);
        const h = Math.round(top + (i + 1) * pitch) - y;
        const tread = depthShade(pal.tread, depth);
        r(ctx, x0, y, x1 - x0, h, tread);
        // Lit nosing on the near edge of each tread, riser shadow on the far edge
        const nosingY = farIsTop ? y + h - 2 : y;
        const riserY = farIsTop ? y : y + h - 1;
        hline(ctx, x0, nosingY, x1 - x0, depthShade(pal.nosing, depth));
        hline(ctx, x0, nosingY + 1, x1 - x0, depthShade(pal.treadLit, depth));
        hline(ctx, x0, riserY, x1 - x0, depthShade(pal.riser, depth));
        // Material texture
        if (material === "attic") {
            for (let x = x0 + 9 + (i % 2) * 7; x < x1 - 2; x += 17) vline(ctx, x, y + 1, h - 2, depthShade(P.atticWoodSeam, depth));
            p(ctx, x0 + 14 + i * 9, y + Math.floor(h / 2), depthShade(P.atticWoodKnot, depth));
        } else if (material === "stone") {
            for (let x = x0 + 12 + (i % 2) * 10; x < x1 - 2; x += 22) vline(ctx, x, y + 1, h - 2, depthShade(P.rockShadow, depth));
            p(ctx, x0 + 20 + i * 11, y + 2, depthShade(P.rockHi, depth));
            p(ctx, x0 + 33 + i * 7, y + h - 3, depthShade(P.rockFleck, depth));
        } else {
            for (let x = x0 + 6; x < x1 - 2; x += 14) hline(ctx, x, y + Math.floor(h / 2), 3, depthShade(pal.riser, depth * 0.6 + 0.2));
        }
        // Carpet runner with brass stair rods
        if (pal.runner) {
            const cx = Math.round((x0 + x1) / 2);
            const half = 18;
            r(ctx, cx - half, y, half * 2, h, depthShade(pal.runner.base, depth));
            vline(ctx, cx - half, y, h, depthShade(pal.runner.dark, depth));
            vline(ctx, cx + half - 1, y, h, depthShade(pal.runner.dark, depth));
            hline(ctx, cx - half + 2, nosingY + 1, half * 2 - 4, depthShade(pal.runner.lit, depth));
            hline(ctx, cx - half + 2, y + Math.floor(h / 2), half * 2 - 4, depthShade(P.goldDark, depth));
            hline(ctx, cx - half - 1, riserY, half * 2 + 2, depthShade(pal.runner.rod, depth));
            p(ctx, cx - half - 1, riserY, depthShade(P.goldDark, depth));
            p(ctx, cx + half, riserY, depthShade(P.goldDark, depth));
        }
    }
}

/** Newel post seen from above, matching the landing banister newels. */
function newel(ctx: CanvasRenderingContext2D, pal: StairPalette, material: StairMaterial, x: number, y: number, h: number): void {
    r(ctx, x, y, 8, h, pal.railDark);
    r(ctx, x + 1, y, 6, h - 1, pal.rail);
    vline(ctx, x + 1, y, h - 1, pal.railLit);
    r(ctx, x, y, 8, 3, pal.railLit);
    if (material === "manor") {
        r(ctx, x + 2, y - 2, 4, 3, P.woodHi);
        p(ctx, x + 3, y - 2, shade(P.woodHi, 0.25));
    } else if (material === "stone") {
        p(ctx, x + 3, y + 1, P.gold);
    }
}

/** Handrail with balusters running north-south beside the stairs. */
function sideRail(
    ctx: CanvasRenderingContext2D,
    pal: StairPalette,
    material: StairMaterial,
    x: number,
    top: number,
    bottom: number,
    faceRight: boolean
): void {
    // Outer stringer (side wall of the stairwell)
    r(ctx, x, top, 6, bottom - top, pal.railDark);
    vline(ctx, faceRight ? x + 5 : x, top, bottom - top, shade(pal.railDark, -0.3));
    // Handrail on top
    r(ctx, x + 1, top, 3, bottom - top, pal.rail);
    vline(ctx, x + 1, top, bottom - top, pal.railLit);
    // Balusters
    if (material !== "stone") {
        for (let y = top + 3; y < bottom - 2; y += 5) {
            hline(ctx, x + (faceRight ? 4 : 0), y, 2, pal.railLit);
        }
    } else {
        for (let y = top + 6; y < bottom - 2; y += 10) p(ctx, x + 2, y, P.silver);
    }
}

/**
 * Down stairwell at the south edge. The top row lines up with the landing
 * balustrade (rails at y 6..21 of a tile), so the newels stand in the rail line.
 */
function drawStairsDown(ctx: CanvasRenderingContext2D, material: StairMaterial): void {
    const pal = PALETTES[material];
    const W = 96;
    const H = 64;
    // Landing floor lip the stairs drop from
    r(ctx, 8, 0, W - 16, 4, pal.tread);
    hline(ctx, 8, 3, W - 16, pal.nosing);
    // Stairwell void behind the side walls
    r(ctx, 6, 4, W - 12, H - 4, pal.void);
    drawTreads(ctx, pal, material, 8, W - 8, 4, H, 5, false);
    // Shadow cast by the landing edge onto the first tread
    hline(ctx, 8, 4, W - 16, "rgba(0,0,0,0.35)");
    sideRail(ctx, pal, material, 0, 10, H, true);
    sideRail(ctx, pal, material, W - 6, 10, H, false);
    // Newels where the landing balustrade turns down the stairs
    newel(ctx, pal, material, 0, 4, 18);
    newel(ctx, pal, material, W - 8, 4, 18);
    // Stub of balustrade rail meeting the newels (matches banister tiles)
    if (material !== "stone") {
        r(ctx, 0, 6, 2, 3, P.woodDark);
        r(ctx, W - 2, 6, 2, 3, P.woodDark);
    }
}

/** Up staircase climbing into the north wall. */
function drawStairsUp(ctx: CanvasRenderingContext2D, material: StairMaterial): void {
    const pal = PALETTES[material];
    const W = 96;
    const H = 64;
    // Opening in the wall: dark stairwell at the top
    r(ctx, 4, 0, W - 8, H, pal.void);
    // Lintel / arch shadow at the top of the opening
    const lintel = material === "stone" ? P.rockLight : material === "attic" ? P.atticWoodDark : P.woodDark;
    r(ctx, 0, 0, W, 4, lintel);
    hline(ctx, 0, 3, W, shade(lintel, -0.35));
    // Treads: nearest at the bottom, receding into the dark at the top
    drawTreads(ctx, pal, material, 10, W - 10, 6, H, 6, true);
    // Side walls of the stair (stringers) — narrower toward the top for depth
    for (let y = 4; y < H; y++) {
        const t = (y - 4) / (H - 4);
        const w = 4 + Math.round(t * 4);
        hline(ctx, 4, y, w, depthShade(pal.railDark, 1 - t));
        hline(ctx, W - 4 - w, y, w, depthShade(shade(pal.railDark, -0.25), 1 - t));
    }
    // Handrails rising along both sides
    sideRail(ctx, pal, material, 2, 18, H, true);
    sideRail(ctx, pal, material, W - 8, 18, H, false);
    // Newel posts at the foot of the stairs
    newel(ctx, pal, material, 0, H - 18, 18);
    newel(ctx, pal, material, W - 8, H - 18, 18);
}

export const STAIRCASE_VARIANTS = {
    staircase: { direction: "up", material: "manor" },
    staircase_down: { direction: "down", material: "manor" },
    staircase_attic_down: { direction: "down", material: "attic" },
    staircase_stone_up: { direction: "up", material: "stone" }
} as const satisfies Record<string, { direction: StairDirection; material: StairMaterial }>;

export type StaircaseSpriteName = keyof typeof STAIRCASE_VARIANTS;

/** Pick the staircase sprite for a placement from its wall side and floor material. */
export function staircaseSpriteFor(direction: StairDirection, material: StairMaterial): StaircaseSpriteName {
    for (const [name, v] of Object.entries(STAIRCASE_VARIANTS)) {
        if (v.direction === direction && v.material === material) return name as StaircaseSpriteName;
    }
    return direction === "down" ? "staircase_down" : "staircase";
}

function mixHex(a: string, b: string, k: number): string {
    const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
    const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * k).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Foot of the courtyard's spiral stair, seen from the cellar (96x96, 3x3 tiles):
 * a round-headed stone arch in the north wall with daylight falling from above,
 * and worn wedge steps winding up anticlockwise around a newel, the lowest
 * ones fanning out onto the cellar floor. Steps brighten as they climb toward
 * the light. Matches the courtyard's `cellar_hatch`.
 */
function drawSpiralStairUp(ctx: CanvasRenderingContext2D): void {
    const W = 96;
    const H = 96;
    const SQ = 0.72;
    const cx = 48;
    const cy = 30; // newel centre (at the back, inside the arch)
    const newelR = 6;
    const R = 40;
    const STEP = (Math.PI * 2) / 12;
    const RISE = 5;
    const DARK = "#0a0909";
    const STONE = "#7a746a";
    const LIT = "#a8a296";
    const SHADOW = "#3e3a34";
    const DAY = "#e8e0c8";

    // Arch opening in the wall: jambs and voussoirs of dressed stone
    const archL = 18;
    const archR = 78;
    const archTop = 2;
    const archBase = 32;
    const inArch = (x: number, y: number) => {
        if (x < archL || x >= archR || y >= archBase + 2) return false;
        const rx = (archR - archL) / 2;
        const ax = archL + rx;
        const springY = archTop + 12;
        if (y >= springY) return true;
        return Math.hypot((x + 0.5 - ax) / rx, (y + 0.5 - springY) / 12) <= 1;
    };
    for (let y = 0; y < archBase + 2; y++) {
        for (let x = archL - 6; x < archR + 6; x++) {
            if (inArch(x, y)) continue;
            const rx = (archR - archL) / 2 + 6;
            const ax = archL + (archR - archL) / 2;
            const ring = y < archTop + 12 ? Math.hypot((x + 0.5 - ax) / rx, (y + 0.5 - (archTop + 12)) / 18) <= 1 : x < archL || x >= archR;
            if (!ring) continue;
            const ang = Math.atan2(y - (archTop + 12), x - ax);
            const joint = y < archTop + 12 ? Math.abs(((ang + Math.PI) * 4) % 1) < 0.1 : y % 8 === 0;
            const lit = x < ax;
            p(ctx, x, y, joint ? SHADOW : lit ? LIT : STONE);
        }
    }
    // Stairwell interior: dark, with daylight pouring down from the courtyard
    for (let y = 0; y < archBase + 2; y++) {
        for (let x = archL; x < archR; x++) {
            if (!inArch(x, y)) continue;
            const k = Math.min(1, y / 30);
            p(ctx, x, y, mixHex("#5a564c", DARK, 0.35 + k * 0.55));
        }
    }

    // Steps: highest (back, in the arch) drawn first; each lower step overlaps it
    const STEPS = 9;
    const START = Math.PI * 0.42; // lowest step points toward the room, slightly right
    for (let k = STEPS - 1; k >= 0; k--) {
        const sy = cy + 26 - k * RISE; // higher steps sit further up the screen
        const a0 = START + k * STEP;
        const a1 = a0 + STEP;
        const light = 0.5 + (k / (STEPS - 1)) * 0.4; // brighter toward the daylight above
        const tread = mixHex("#2a2724", STONE, light);
        const nosing = mixHex("#3a3630", LIT, light);
        const riser = mixHex(DARK, SHADOW, light * 0.8);
        const outer = R - (k > 5 ? (k - 5) * 4 : 0);
        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                const dx = x + 0.5 - cx;
                const dy = (y + 0.5 - sy) / SQ;
                const rad = Math.hypot(dx, dy);
                if (rad < newelR || rad > outer) continue;
                let ang = Math.atan2(dy, dx);
                while (ang < a0) ang += Math.PI * 2;
                if (ang > a1) continue;
                // Upper steps only show inside the arch; lower ones on the floor
                if (y < archBase + 2 && !inArch(x, y)) continue;
                const t = (ang - a0) / STEP;
                let c = tread;
                if (rad > outer - 2) c = nosing;
                if (t < 0.14) c = nosing; // leading edge catches the light
                const worn = Math.abs(rad - (outer + newelR) / 2) < (outer - newelR) * 0.16 && t > 0.3 && t < 0.8;
                if (worn) c = mixHex(c, DARK, 0.15);
                if (((x * 5 + y * 11 + k * 7) & 31) === 0) c = riser;
                p(ctx, x, y, c);
            }
        }
        // Riser: the drop face under this step's front edge
        for (let i = 0; i < RISE; i++) {
            for (let rr = newelR; rr <= outer; rr++) {
                const x = Math.round(cx + Math.cos(a0) * rr);
                const y = Math.round(sy + Math.sin(a0) * rr * SQ) + 1 + i;
                if (y >= H || x < 0 || x >= W) continue;
                if (y < archBase + 2 && !inArch(x, y)) continue;
                p(ctx, x, y, i === 0 ? riser : mixHex(riser, DARK, 0.3));
            }
        }
    }

    // Newel post rising from the lowest step into the light
    const newelBase = cy + 26;
    for (let y = archTop + 8; y < newelBase; y++) {
        if (!inArch(cx, y) && y < archBase + 2) continue;
        const k = 1 - (y - archTop) / (newelBase - archTop);
        for (let x = cx - newelR + 1; x < cx + newelR - 1; x++) {
            const side = x - cx;
            const base = side < -2 ? LIT : side > 1 ? SHADOW : STONE;
            p(ctx, x, y, mixHex(base, DAY, k * 0.25));
        }
    }
    for (let x = cx - newelR + 1; x < cx + newelR - 1; x++) p(ctx, x, newelBase, SHADOW);

    // Shaft of daylight falling through the arch onto the steps
    for (let y = archTop; y < H - 6; y++) {
        const k = y / (H - 6);
        const half = 10 + k * 12;
        const sx = 44 + k * 6;
        ctx.fillStyle = `rgba(236,226,196,${(0.16 * (1 - k)).toFixed(3)})`;
        ctx.fillRect(Math.round(sx - half), y, Math.round(half * 2), 1);
    }
    // Dust motes in the light
    for (const [x, y] of [[40, 14], [52, 22], [46, 34], [56, 44], [42, 52]] as const) p(ctx, x, y, "rgba(240,232,208,0.7)");
    // Grit and a dead leaf blown down onto the bottom step
    p(ctx, 62, 78, "#8a5a2a");
    p(ctx, 63, 78, "#a06a2a");
    for (const [x, y] of [[30, 84], [70, 72], [56, 88]] as const) p(ctx, x, y, "#5a564c");
}

export const STAIRCASE_SPRITES: Record<string, ProceduralSpriteDef> = Object.fromEntries(
    Object.entries(STAIRCASE_VARIANTS).map(([name, v]) => [
        name,
        {
            nativeWidth: 96,
            nativeHeight: 64,
            draw(ctx: CanvasRenderingContext2D) {
                if (v.direction === "down") drawStairsDown(ctx, v.material);
                else drawStairsUp(ctx, v.material);
            }
        }
    ])
);

STAIRCASE_SPRITES.cellar_spiral_stair = { nativeWidth: 96, nativeHeight: 96, draw: drawSpiralStairUp };
