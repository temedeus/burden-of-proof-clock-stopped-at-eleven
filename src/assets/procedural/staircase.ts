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
