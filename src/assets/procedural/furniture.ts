import { P } from "./palette";
import { grid, mirrorH, mirrorV, r } from "./pixel";
import { drawFireplaceStone } from "./fireplace";
import { drawOilLampNorthBase } from "./oil_lamp";
import type { ProceduralSpriteDef } from "./types";

/** Top-down oak cask drawn at a pixel origin (shared by single and clustered barrels). */
function drawWineBarrelTopDown(ctx: CanvasRenderingContext2D, ox: number, oy: number, cell = 2): void {
    grid(
        ctx,
        ox,
        oy,
        cell,
        [
            "....dddddddd....",
            "..ddhhhhhhll..",
            ".ddhhhhhhhlll.",
            "ddhhhhhhhhllll",
            "ddhhhhhhhhllll",
            "ddhhhhhhhhllll",
            "ddhhhhhhhhllll",
            ".ddhhhhhhhlll.",
            "..ddhhhhhhll..",
            "....dddddddd...."
        ],
        { d: P.woodDark, h: P.wood, l: P.woodLight }
    );
    r(ctx, ox - cell, oy + 3 * cell, 16 * cell, cell, P.silverDark);
    r(ctx, ox - cell, oy + 5 * cell, 16 * cell, cell, P.silver);
    r(ctx, ox - cell, oy + 7 * cell, 16 * cell, cell, P.silverDark);
    r(ctx, ox + 3 * cell, oy + 2 * cell, cell, 8 * cell, P.woodHi);
    r(ctx, ox + 7 * cell, oy + cell, cell, 9 * cell, P.woodDark);
    r(ctx, ox + 6 * cell, oy + 4 * cell, 2 * cell, 2 * cell, P.shadow);
}

const COBWEB_COLORS = { l: P.light, c: P.cream, h: P.highlight, m: P.mid };

/** Pre-baked top-left corner cobweb (px=1, transparent background). */
const COBWEB_TL_ROWS = [
    "ccccccccccccccccccccccccccccccccccccccccccccccccc...............",
    "cllllllc.llllllllllllllcll.h....................................",
    "cllllllclllll......h...c..llllllllllllllll......................",
    "clll.lcllllh.lllll.h...c...h..............lllllllll.............",
    "cllllcclllhlll....lllllc...h....................................",
    "clllcc..l.ll..lll..h..clllll....................................",
    "cllccll..ll.ll...lll..c...h.lllll...............................",
    "ccclll.l.h.ll.ll..h.llc...h......lllll..........................",
    "cllll.l.l....ll.ll....clll............lllll.....................",
    "clllllhl.l..m.lllllll.c..hll...............lllll................",
    "c.lhlll.l.l.....l.lllcl..h..lll.................lll.............",
    "chlllll.l..l....hll.cllll......lll..............................",
    "c.lll.ll.l..l.hh...cl..llll.......lll...........................",
    "c.ll.lll..l..l.....cml..h..ll........lll........................",
    "c.ll.l.ll..l.hl...c...ll.....ll.........lll.....................",
    "c.l.ll.lc..lh..l.c....h.ll.....ll..........lll..................",
    "c..ll.l.lcc.l...c.....h...l......ll...........lll...............",
    "c..ll.lhl.lc.l.c.l...h.....ll......ll............ll.............",
    "c..llhl..ll.ccc...l.h........l.......ll.........................",
    "chhlhl.l.l.lc.c....l..........ll.......ll.......................",
    "c..l.l.l..lc...c..h.l...........ll.......ll.....................",
    "c..l.l..lcc.l...cc...l............l........ll...................",
    "c...ccccc..ll..hhlc...l............ll........ll.................",
    "ccccll..l..l.lh..l.....l.............l.........ll...............",
    "c...l.l..l.hll....l.....l.............ll.........ll.............",
    "c...l.l.hlh.l.l....l.....l..............ll......................",
    "c...lhlh.l...l.l....l.....l...............l.....................",
    "chhhl.l...l..l.l.....l.....l...............ll...................",
    "c...l..l..l...l.l....l......l................l..................",
    "c....l.l..l...l.l.....l.......................ll................",
    "c....l.l...l...l.l.....l........................ll..............",
    "c....l.l...l...l.l......l.........................l.............",
    "c....l..l...l...l.l.....l.......................................",
    "c....l..l...l...l.l......l......................................",
    "c....l..l...l....l.l......l.....................................",
    "c.....l.l....l...l..l......l....................................",
    "c.....l..l...l....l.l......l....................................",
    "c.....l..l...l.......l......l...................................",
    "c.....l..l....l......l.......l..................................",
    "c.....l..l....l.......l.......l.................................",
    "c.....l...l...l.......l.......l.................................",
    "c......l..l....l.......l.......l................................",
    "c......l..l....l........l.......l...............................",
    "c......l.......l........l........l..............................",
    "c......l........l........l.......l..............................",
    "c......l........l........l........l.............................",
    "c......l.........l........l........l............................",
    "c.......l........l........l.........l...........................",
    "c.......l........l.........l........l...........................",
    "........l.........l........l.........l..........................",
    "........l.........l.........l.........l.........................",
    "................................................................",
    "................................................................",
    "................................................................",
    "................................................................",
    "................................................................",
    "................................................................",
    "................................................................",
    "................................................................",
    "................................................................",
    "................................................................",
    "................................................................",
    "................................................................",
    "................................................................"
];

function drawCobwebGrid(ctx: CanvasRenderingContext2D): void {
    grid(ctx, 0, 0, 1, COBWEB_TL_ROWS, COBWEB_COLORS);
}

/** Squat horizontal roof timber (runs east–west under the ridge). */
function drawAtticRoofBeamH(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const beamH = Math.min(28, Math.floor(h * 0.45));
    const top = 4;
    r(ctx, 2, top, w - 4, beamH, P.woodDark);
    r(ctx, 4, top + 2, w - 8, beamH - 4, P.wood);
    r(ctx, 4, top + 2, w - 8, 4, P.woodLight);
    r(ctx, 4, top + beamH - 6, w - 8, 2, P.woodDark);
    // Iron strap at each end
    for (const bx of [2, w - 10]) {
        r(ctx, bx, top, 8, beamH + 2, P.silverDark);
        r(ctx, bx + 1, top + 2, 6, beamH - 2, P.silver);
    }
    // Wood grain
    for (let gx = 12; gx < w - 12; gx += 14) {
        r(ctx, gx, top + 8, 2, beamH - 12, P.woodHi);
    }
    // Shadow cast below the beam
    r(ctx, 6, top + beamH + 2, w - 12, Math.max(4, h - top - beamH - 4), P.shadow);
}

/** Short vertical brace hanging from a roof beam. */
function drawAtticRoofBeamV(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const cx = Math.floor(w / 2) - 5;
    r(ctx, cx, 0, 10, h - 8, P.woodDark);
    r(ctx, cx + 2, 2, 6, h - 12, P.wood);
    r(ctx, cx + 2, 2, 2, h - 12, P.woodLight);
    r(ctx, cx + 1, 0, 8, 6, P.woodDark);
    r(ctx, cx + 2, 1, 6, 4, P.woodHi);
    // Bottom peg
    r(ctx, cx - 2, h - 10, 14, 6, P.woodDark);
    r(ctx, cx, h - 8, 10, 4, P.wood);
}

/** Full-width attic cross-beam (scales to room interior width). */
function drawAtticRoofBar(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const beamH = Math.min(20, Math.max(12, Math.floor(h * 0.65)));
    const top = Math.max(0, Math.floor((h - beamH) / 2));
    r(ctx, 0, top, w, beamH, P.woodDark);
    r(ctx, 2, top + 2, w - 4, beamH - 4, P.wood);
    r(ctx, 2, top + 2, w - 4, 3, P.woodLight);
    r(ctx, 2, top + beamH - 5, w - 4, 2, P.woodDark);
    for (let gx = 10; gx < w - 10; gx += 16) {
        r(ctx, gx, top + 6, 2, beamH - 10, P.woodHi);
    }
    // Iron straps where posts meet the beam (tile offsets from bar origin)
    for (const tileOff of [5, 17]) {
        const bx = tileOff * 32 - 4;
        if (bx > 4 && bx < w - 12) {
            r(ctx, bx, top - 1, 8, beamH + 2, P.silverDark);
            r(ctx, bx + 1, top + 1, 6, beamH - 2, P.silver);
        }
    }
}

/** Tall support post — collision only at the floor footing. */
function drawAtticFloorPost(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const cx = Math.floor(w / 2) - 5;
    const footingH = Math.min(28, Math.floor(h * 0.12));
    const postTop = Math.floor(h * 0.06);
    const postBottom = h - footingH;
    r(ctx, cx, postTop, 10, postBottom - postTop, P.woodDark);
    r(ctx, cx + 2, postTop + 2, 6, postBottom - postTop - 4, P.wood);
    r(ctx, cx + 2, postTop + 2, 2, postBottom - postTop - 4, P.woodLight);
    r(ctx, cx + 1, postTop, 8, 6, P.woodHi);
    r(ctx, cx - 4, h - footingH, 18, footingH, P.woodDark);
    r(ctx, cx - 2, h - footingH + 4, 14, footingH - 6, P.wood);
    r(ctx, cx - 2, h - footingH + 4, 14, 3, P.woodLight);
    for (let ny = postTop + 12; ny < postBottom - 8; ny += 28) {
        r(ctx, cx + 6, ny, 2, 2, P.silverDark);
    }
}

function pitEllipseDist(x: number, y: number, cx: number, cy: number, rx: number, ry: number): number {
    return Math.hypot((x - cx) / rx, (y - cy) / ry);
}

/** Rocky pit entrance with a wooden ladder descending into darkness. */
function drawCellarHatch(ctx: CanvasRenderingContext2D, w = 128, h = 128): void {
    const cx = w * 0.5;
    const pitCy = h * 0.62;
    const rxOuter = w * 0.44;
    const ryOuter = h * 0.3;
    const rxInner = w * 0.3;
    const ryInner = h * 0.2;

    // Worn grass lip around the hole
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const d = pitEllipseDist(x, y, cx + 2, pitCy + 4, rxOuter + 10, ryOuter + 6);
            if (d > 1.02 && d < 1.22) r(ctx, x, y, 1, 1, d > 1.12 ? P.grassDark : P.grass);
        }
    }

    // Rocky rim — lit NW, shadowed SE (top-down oblique)
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const dOut = pitEllipseDist(x, y, cx, pitCy, rxOuter, ryOuter);
            const dIn = pitEllipseDist(x, y, cx, pitCy + 4, rxInner, ryInner);
            if (dOut > 1 || dIn < 1) continue;

            const angle = Math.atan2((y - pitCy) / ryOuter, (x - cx) / rxOuter);
            const lit = Math.cos(angle + Math.PI * 0.55);
            const depth = (dOut - dIn) / (1 - dIn);
            const fleck = ((x * 7 + y * 13) & 15) < 2;

            let color: string;
            if (depth > 0.82) {
                color = lit > 0.35 ? P.rockHi : lit > 0 ? P.rockLight : P.rock;
            } else if (lit > 0.25) {
                color = fleck ? P.rockFleck : P.rockLight;
            } else if (lit > -0.15) {
                color = fleck ? P.rockFleck : P.rock;
            } else {
                color = fleck ? P.rockVoid : P.rockDark;
            }
            r(ctx, x, y, 1, 1, color);
        }
    }

    // Chunky boulder accents on the rim
    r(ctx, 10, pitCy - ryOuter * 0.5, 18, 10, P.rockLight);
    r(ctx, 12, pitCy - ryOuter * 0.45, 8, 4, P.rockHi);
    r(ctx, w - 30, pitCy - ryOuter * 0.35, 20, 12, P.rock);
    r(ctx, w - 26, pitCy - ryOuter * 0.3, 10, 4, P.rockDark);
    r(ctx, 16, pitCy + ryOuter * 0.15, 22, 14, P.rockDark);
    r(ctx, w - 34, pitCy + ryOuter * 0.25, 20, 12, P.rockVoid);
    r(ctx, cx - 14, pitCy - ryOuter * 0.75, 28, 8, P.rockHi);

    // Pit void — graded depth
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const d = pitEllipseDist(x, y, cx, pitCy + 6, rxInner, ryInner);
            if (d >= 1) continue;
            const depth = 1 - d;
            const color =
                depth > 0.7 ? P.rockVoid : depth > 0.45 ? P.rockShadow : depth > 0.2 ? P.rockDark : P.black;
            r(ctx, x, y, 1, 1, color);
        }
    }

    // Wooden ladder — converging rails, rungs spaced for depth
    const ladderTop = h * 0.28;
    const ladderBottom = h * 0.94;
    const rungYs = [0, 0.12, 0.26, 0.42, 0.58, 0.74, 0.88];

    for (let i = 0; i < rungYs.length; i++) {
        const t = rungYs[i];
        const y = ladderTop + (ladderBottom - ladderTop) * t;
        const nextT = i < rungYs.length - 1 ? rungYs[i + 1] : 1;
        const nextY = ladderTop + (ladderBottom - ladderTop) * nextT;
        const inset = t * t * w * 0.1;
        const railW = Math.max(2, 4 - t * 2);
        const left = cx - w * 0.12 + inset;
        const right = cx + w * 0.12 - inset;
        const segH = nextY - y;

        r(ctx, left, y, railW, segH, P.woodDark);
        r(ctx, right - railW, y, railW, segH, P.woodDark);
        if (i === 0) {
            r(ctx, left + 1, y, railW - 2, 2, P.woodHi);
            r(ctx, right - railW + 1, y, railW - 2, 2, P.woodHi);
        }

        const rungH = Math.max(2, 4 - t * 1.5);
        r(ctx, left + railW, y, right - left - railW * 2, rungH, P.wood);
        r(ctx, left + railW, y, right - left - railW * 2, 1, P.woodHi);
        r(ctx, left + railW, y + rungH - 1, right - left - railW * 2, 1, P.woodDark);
    }

    r(ctx, cx - w * 0.1, ladderTop + 1, 3, 3, P.iron);
    r(ctx, cx + w * 0.1 - 3, ladderTop + 1, 3, 3, P.iron);
}

/** Wood tabletop with edge highlights (shared by all tables). */
function drawWoodTabletop(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    r(ctx, x, y, w, h, P.woodLight);
    r(ctx, x, y, w, 2, P.woodHi);
    r(ctx, x, y + h - 2, w, 2, P.woodDark);
    r(ctx, x, y, 2, h, P.woodHi);
    r(ctx, x + w - 2, y, 2, h, P.woodDark);
    for (const [gx, gy] of [
        [x + 8, y + 4],
        [x + w / 2, y + 6],
        [x + w - 12, y + 5]
    ]) {
        r(ctx, gx, gy, 1, 1, P.wood);
    }
}

/** Table legs — four corners or explicit x positions. */
function drawTableLegs(
    ctx: CanvasRenderingContext2D,
    legXs: number[],
    topY: number,
    bottomY: number
): void {
    for (const x of legXs) {
        r(ctx, x, topY, 5, bottomY - topY, P.woodDark);
        r(ctx, x + 1, topY, 3, 2, P.wood);
        r(ctx, x, bottomY - 2, 5, 2, P.outline);
    }
}

function drawRoundPlate(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    grid(
        ctx,
        cx - 4,
        cy - 3,
        1,
        ["..ssss..", ".sswwss.", "sswwwwss", "sswwwwss", ".sswwss.", "..ssss.."],
        { s: P.silver, w: P.white }
    );
    r(ctx, cx - 1, cy, 3, 2, P.foodBrown);
    r(ctx, cx + 1, cy - 1, 2, 2, P.foodGreen);
}

function drawGoblet(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    r(ctx, cx, cy - 3, 3, 2, P.wine);
    r(ctx, cx - 1, cy - 1, 5, 1, P.silver);
    r(ctx, cx, cy, 3, 3, P.silver);
    r(ctx, cx + 1, cy + 3, 1, 2, P.silverDark);
}

function drawPlaceSetting(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    drawGoblet(ctx, cx + 1, cy - 2);
    drawRoundPlate(ctx, cx, cy + 4);
    r(ctx, cx - 4, cy + 5, 1, 5, P.silver);
    r(ctx, cx + 8, cy + 5, 1, 5, P.silver);
    r(ctx, cx + 8, cy + 5, 2, 1, P.silverDark);
}

function drawCenterFeast(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    r(ctx, cx - 2, cy - 6, 2, 7, P.cream);
    r(ctx, cx - 2, cy - 8, 2, 2, P.candle);
    r(ctx, cx + 12, cy - 6, 2, 7, P.cream);
    r(ctx, cx + 12, cy - 8, 2, 2, P.candle);

    grid(ctx, cx - 10, cy + 4, 1, ["..ssssss..", ".sswwwwss.", "sswwwwwwss", "sswwwwwwss", ".sswwwwss.", "..ssssss.."], {
        s: P.silver,
        w: P.white
    });

    grid(ctx, cx - 5, cy + 7, 1, ["..bb..", ".bbbb.", "bbbbbb", "bbbbbb", ".bbbb.", "..bb.."], { b: P.foodBrown });

    r(ctx, cx + 1, cy + 9, 2, 1, P.highlight);
    r(ctx, cx - 14, cy + 8, 5, 4, P.silver);
    r(ctx, cx - 13, cy + 9, 3, 2, P.foodGreen);
    r(ctx, cx + 10, cy + 8, 5, 4, P.silver);
    r(ctx, cx + 11, cy + 9, 3, 2, P.gold);
}

export const FURNITURE_SPRITES: Record<string, ProceduralSpriteDef> = {
    fireplace: {
        nativeWidth: 48,
        nativeHeight: 56,
        draw(ctx) {
            drawFireplaceStone(ctx);
            const fireC = { y: P.fireYellow, o: P.fireOrange, r: P.fireRed, k: P.black };
            grid(ctx, 14, 20, 2, [
                "...ror...",
                "..roror..",
                ".roroyor.",
                "roroyoyor",
                ".oyoyoyo.",
                "..oyoyo..",
                "...oyo..."
            ], fireC);
        }
    },

    manor_lord_bed: {
        nativeWidth: 256,
        nativeHeight: 256,
        draw(ctx) {
            const W = 256;
            const H = 256;

            // Floor shadow under frame
            r(ctx, 18, 28, W - 36, H - 40, P.shadow);

            const drawPost = (px: number, py: number, h: number) => {
                r(ctx, px, py, 12, h, P.woodDark);
                r(ctx, px + 1, py + 1, 10, h - 2, P.wood);
                r(ctx, px + 2, py + 2, 8, 6, P.woodHi);
                r(ctx, px + 3, py + 1, 6, 4, P.goldDark);
            };

            // Four-poster legs
            drawPost(10, 8, H - 28);
            drawPost(W - 22, 8, H - 28);
            drawPost(10, 72, H - 92);
            drawPost(W - 22, 72, H - 92);

            // Side rails
            r(ctx, 16, 72, W - 32, 4, P.woodDark);
            r(ctx, 16, H - 36, W - 32, 4, P.woodDark);
            r(ctx, 16, 72, 4, H - 108, P.wood);
            r(ctx, W - 20, 72, 4, H - 108, P.wood);

            // Mattress base
            r(ctx, 20, 76, W - 40, H - 112, P.woodDark);
            r(ctx, 22, 78, W - 44, H - 116, P.cream);
            r(ctx, 24, 80, W - 48, H - 120, P.highlight);

            // Sheet — soft lengthwise folds toward foot
            for (let i = 0; i < 5; i++) {
                const fx = 32 + i * 38;
                r(ctx, fx, 88, 20, H - 128, P.white);
                r(ctx, fx + 2, 90, 2, H - 132, P.highlight);
            }

            // Coverlet / counterpane (slightly shorter than mattress)
            r(ctx, 26, 96, W - 52, H - 132, P.carpetPlum);
            r(ctx, 28, 98, W - 56, H - 136, P.carpetPlumLight);
            for (let row = 0; row < 5; row++) {
                for (let col = 0; col < 6; col++) {
                    const qx = 34 + col * 32;
                    const qy = 104 + row * 26;
                    r(ctx, qx, qy, 26, 20, (row + col) % 2 ? P.carpetPlum : P.carpetPlumLight);
                    r(ctx, qx + 2, qy + 2, 22, 1, P.goldDark);
                }
            }

            // Pillows at headboard
            const pillow = (px: number) => {
                r(ctx, px, 78, 52, 22, P.cream);
                r(ctx, px + 2, 80, 48, 18, P.white);
                r(ctx, px + 4, 82, 44, 2, P.highlight);
                r(ctx, px + 6, 86, 40, 8, P.highlight);
            };
            pillow(36);
            pillow(W - 88);
            r(ctx, W / 2 - 34, 76, 68, 24, P.cream);
            r(ctx, W / 2 - 32, 78, 64, 20, P.white);

            // Carved headboard (north)
            r(ctx, 14, 56, W - 28, 24, P.woodDark);
            r(ctx, 16, 58, W - 32, 20, P.wood);
            r(ctx, 20, 60, W - 40, 16, P.woodHi);
            for (let i = 0; i < 5; i++) {
                r(ctx, 32 + i * 40, 62, 24, 12, P.woodDark);
                r(ctx, 34 + i * 40, 64, 20, 8, P.goldDark);
            }

            // Canopy cornice along headboard
            r(ctx, 8, 48, W - 16, 10, P.carpetPlum);
            r(ctx, 10, 50, W - 20, 6, P.carpetPlumLight);
            r(ctx, 12, 48, W - 24, 2, P.gold);

            // North drapes tied back to the sides (left bundle)
            r(ctx, 0, 44, 28, 48, P.carpetPlum);
            r(ctx, 2, 46, 24, 44, P.carpetPlumLight);
            r(ctx, 4, 48, 20, 40, P.carpetPlum);
            r(ctx, 22, 52, 8, 10, P.gold);
            r(ctx, 24, 54, 4, 6, P.goldDark);
            // Fold highlights / swag curves
            r(ctx, 6, 56, 14, 3, P.carpetPlumLight);
            r(ctx, 8, 64, 12, 3, P.highlight);
            r(ctx, 10, 72, 10, 3, P.carpetPlumLight);
            r(ctx, 12, 80, 8, 3, P.highlight);
            r(ctx, 0, 88, 18, 24, P.carpetPlum);
            r(ctx, 2, 92, 14, 18, P.carpetPlumLight);

            // North drapes tied back to the sides (right bundle)
            r(ctx, W - 28, 44, 28, 48, P.carpetPlum);
            r(ctx, W - 26, 46, 24, 44, P.carpetPlumLight);
            r(ctx, W - 24, 48, 20, 40, P.carpetPlum);
            r(ctx, W - 30, 52, 8, 10, P.gold);
            r(ctx, W - 28, 54, 4, 6, P.goldDark);
            r(ctx, W - 20, 56, 14, 3, P.carpetPlumLight);
            r(ctx, W - 20, 64, 12, 3, P.highlight);
            r(ctx, W - 18, 72, 10, 3, P.carpetPlumLight);
            r(ctx, W - 16, 80, 8, 3, P.highlight);
            r(ctx, W - 18, 88, 18, 24, P.carpetPlum);
            r(ctx, W - 16, 92, 14, 18, P.carpetPlumLight);

            // Footboard
            r(ctx, 14, H - 40, W - 28, 14, P.woodDark);
            r(ctx, 16, H - 38, W - 32, 10, P.wood);
            r(ctx, 18, H - 36, W - 36, 6, P.woodHi);
            r(ctx, 24, H - 34, W - 48, 2, P.gold);

            // Bed step at foot
            r(ctx, 48, H - 26, W - 96, 12, P.woodDark);
            r(ctx, 50, H - 24, W - 100, 8, P.wood);
            r(ctx, 52, H - 22, W - 104, 4, P.woodLight);
        }
    },

    dining_table: {
        nativeWidth: 96,
        nativeHeight: 56,
        draw(ctx) {
            const topY = 8;
            const topH = 24;
            const apronY = topY + topH;
            const legY = apronY + 4;

            // Chair backs along long sides
            for (const cx of [4, 84]) {
                r(ctx, cx, 4, 8, 12, P.wood);
                r(ctx, cx + 1, 2, 6, 4, P.woodHi);
                r(ctx, cx + 2, 14, 4, 4, P.woodDark);
            }

            // Top — slight perspective (wider at front)
            r(ctx, 4, topY, 88, topH, P.woodLight);
            r(ctx, 2, topY + 2, 92, topH - 2, P.wood);
            r(ctx, 0, topY + 4, 96, topH - 4, P.woodLight);
            r(ctx, 0, topY + 4, 96, 2, P.woodHi);
            r(ctx, 0, topY + topH - 2, 96, 2, P.woodDark);

            // Tablecloth with corner drape hints
            r(ctx, 6, topY + 4, 84, topH - 8, P.cream);
            r(ctx, 6, topY + 4, 84, 2, P.white);
            r(ctx, 6, topY + topH - 6, 84, 1, P.highlight);
            r(ctx, 6, topY + 6, 2, topH - 12, P.highlight);
            r(ctx, 88, topY + 6, 2, topH - 12, P.highlight);
            r(ctx, 4, topY + topH - 5, 3, 3, P.cream);
            r(ctx, 89, topY + topH - 5, 3, 3, P.cream);

            drawCenterFeast(ctx, 44, topY + 6);

            const nearRow = topY + 16;
            const farRow = topY + 8;
            for (const cx of [10, 24, 38, 54, 68, 82]) {
                drawPlaceSetting(ctx, cx, nearRow);
            }
            for (const cx of [18, 42, 66]) {
                drawGoblet(ctx, cx, farRow);
                drawRoundPlate(ctx, cx, farRow + 6);
            }

            r(ctx, 38, topY + 18, 4, 3, P.foodBrown);
            r(ctx, 54, topY + 18, 4, 3, P.foodBrown);

            r(ctx, 4, apronY, 88, 4, P.wood);
            r(ctx, 4, apronY, 88, 1, P.woodDark);
            drawTableLegs(ctx, [10, 81], legY, 54);
        }
    },

    kitchen_table: {
        nativeWidth: 64,
        nativeHeight: 32,
        draw(ctx) {
            const topY = 8;
            const topH = 16;

            // Thick tabletop — two tile rows (y 8–23)
            r(ctx, 2, topY, 60, topH, P.woodLight);
            r(ctx, 2, topY, 60, 3, P.woodHi);
            r(ctx, 2, topY + topH - 4, 60, 4, P.wood);
            r(ctx, 2, topY, 2, topH, P.woodHi);
            r(ctx, 60, topY, 2, topH, P.woodDark);
            r(ctx, 2, topY + topH - 2, 60, 2, P.woodDark);
            // Wood grain on surface
            for (const gx of [10, 22, 34, 46, 54]) {
                r(ctx, gx, topY + 4, 1, 6, P.wood);
            }
            r(ctx, 6, topY + 6, 52, 1, P.wood);

            // Apron under tabletop
            r(ctx, 4, topY + topH, 56, 3, P.wood);
            r(ctx, 4, topY + topH + 2, 56, 1, P.woodDark);

            // Sturdy legs (front two visible)
            drawTableLegs(ctx, [8, 51], topY + topH + 3, 31);

            // Kitchen prep items on surface
            r(ctx, 8, 2, 14, 6, P.stoneLight);
            r(ctx, 9, 3, 12, 1, P.woodHi);
            r(ctx, 10, 4, 10, 3, P.cream);
            r(ctx, 11, 5, 2, 1, P.foodBrown);

            grid(ctx, 28, 1, 1, ["..ss..", ".ssww.", "sswwss", "sswwss", ".ssww.", "..ss.."], {
                s: P.silver,
                w: P.white
            });
            r(ctx, 30, 4, 4, 2, P.foodGreen);

            r(ctx, 46, 3, 10, 5, P.cream);
            r(ctx, 47, 2, 8, 2, P.highlight);
            r(ctx, 48, 4, 6, 3, P.white);
            r(ctx, 4, topY + 2, 4, 2, P.cream);
            r(ctx, 56, topY + 3, 3, 2, P.cream);
        }
    },

    booze_table: {
        nativeWidth: 32,
        nativeHeight: 36,
        draw(ctx) {
            drawWoodTabletop(ctx, 2, 12, 28, 6);
            drawTableLegs(ctx, [6, 21], 18, 34);
            r(ctx, 8, 4, 6, 10, P.water);
            r(ctx, 18, 6, 6, 8, P.gold);
            r(ctx, 9, 3, 4, 2, P.waterLight);
        }
    },

    drinking_chair: {
        nativeWidth: 32,
        nativeHeight: 40,
        draw(ctx) {
            r(ctx, 6, 18, 20, 5, P.wood);
            r(ctx, 8, 8, 16, 12, P.woodLight);
            r(ctx, 6, 23, 4, 14, P.woodDark);
            r(ctx, 22, 23, 4, 14, P.woodDark);
            r(ctx, 4, 8, 4, 22, P.wood);
            r(ctx, 24, 8, 4, 22, P.wood);
            r(ctx, 6, 6, 20, 3, P.woodHi);
        }
    },

    staircase: {
        nativeWidth: 96,
        nativeHeight: 64,
        draw(ctx) {
            // Top-down — 3×2 tiles, treads flush to sprite bounds (aligns with footprint grid)
            const stepCount = 6;
            const sh = 10;
            const top = 2;
            const bottom = 62;

            for (let i = 0; i < stepCount; i++) {
                const t = i / (stepCount - 1);
                const y = top + Math.round(t * (bottom - top - sh));
                const inset = Math.round(t * 10);
                const left = 6 + inset;
                const w = 84 - inset * 2;
                r(ctx, left, y, w, sh - 2, P.stoneLight);
                r(ctx, left, y, w, 1, P.stoneHi);
                r(ctx, left + 1, y + sh - 3, w - 2, 1, P.stone);
            }

            r(ctx, 2, top, 4, bottom - top, P.woodDark);
            r(ctx, 90, top, 4, bottom - top, P.woodDark);
            r(ctx, 2, top, 4, 2, P.woodHi);
            r(ctx, 90, top, 4, 2, P.woodHi);
            r(ctx, 4, bottom - 8, 4, 6, P.wood);
            r(ctx, 88, bottom - 8, 4, 6, P.wood);
        }
    },

    cellar_hatch: {
        nativeWidth: 128,
        nativeHeight: 128,
        draw(ctx, w = 128, h = 128) {
            drawCellarHatch(ctx, w, h);
        }
    },

    carpet: {
        nativeWidth: 48,
        nativeHeight: 32,
        draw(ctx) {
            r(ctx, 1, 3, 46, 26, P.carpetBorder);
            r(ctx, 3, 5, 42, 22, P.carpetPlum);
            r(ctx, 5, 7, 38, 18, P.carpetPlumLight);

            r(ctx, 14, 10, 20, 12, P.carpetPlum);
            r(ctx, 18, 12, 12, 8, P.carpetRedLight);
            r(ctx, 20, 14, 8, 4, P.gold);

            const corner = (cx: number, cy: number) => {
                r(ctx, cx, cy, 4, 4, P.gold);
                r(ctx, cx + 1, cy + 1, 2, 2, P.carpetPlumLight);
            };
            corner(6, 8);
            corner(38, 8);
            corner(6, 20);
            corner(38, 20);

            r(ctx, 7, 6, 34, 1, P.goldDark);
            r(ctx, 7, 25, 34, 1, P.goldDark);
            r(ctx, 6, 7, 1, 18, P.goldDark);
            r(ctx, 41, 7, 1, 18, P.goldDark);
        }
    },

    manor_carpet: {
        nativeWidth: 480,
        nativeHeight: 352,
        draw(ctx) {
            const W = 480;
            const H = 352;
            const border = 14;

            r(ctx, 0, 6, W, H - 12, P.carpetBorder);
            r(ctx, 6, 0, W - 12, H, P.carpetBorder);
            r(ctx, border, border + 4, W - border * 2, H - border * 2 - 8, P.carpetPlum);
            r(ctx, border + 6, border + 10, W - border * 2 - 12, H - border * 2 - 20, P.carpetPlumLight);

            r(ctx, 28, 32, W - 56, H - 64, P.carpetBorder);
            r(ctx, 36, 40, W - 72, H - 80, P.carpetRed);
            r(ctx, 44, 48, W - 88, H - 96, P.carpetRedLight);

            const cornerMedallion = (cx: number, cy: number) => {
                r(ctx, cx, cy, 48, 40, P.carpetPlum);
                r(ctx, cx + 4, cy + 4, 40, 32, P.goldDark);
                r(ctx, cx + 10, cy + 10, 28, 20, P.carpetRedLight);
                r(ctx, cx + 18, cy + 16, 12, 8, P.gold);
            };
            cornerMedallion(52, 56);
            cornerMedallion(W - 100, 56);
            cornerMedallion(52, H - 96);
            cornerMedallion(W - 100, H - 96);

            const cx = W / 2 - 56;
            const cy = H / 2 - 44;
            r(ctx, cx, cy, 112, 88, P.carpetPlum);
            r(ctx, cx + 4, cy + 4, 104, 80, P.goldDark);
            r(ctx, cx + 12, cy + 12, 88, 64, P.carpetRed);
            r(ctx, cx + 20, cy + 20, 72, 48, P.carpetRedLight);
            r(ctx, cx + 36, cy + 32, 40, 24, P.gold);
            r(ctx, cx + 44, cy + 38, 24, 12, P.carpetPlumLight);

            for (let i = 0; i < 8; i++) {
                const ox = 100 + i * 36;
                r(ctx, ox, 60, 20, 6, P.goldDark);
                r(ctx, ox + 2, 62, 16, 2, P.gold);
                r(ctx, ox, H - 66, 20, 6, P.goldDark);
                r(ctx, ox + 2, H - 64, 16, 2, P.gold);
            }
            for (let i = 0; i < 5; i++) {
                const oy = 100 + i * 36;
                r(ctx, 60, oy, 6, 20, P.goldDark);
                r(ctx, 62, oy + 2, 2, 16, P.gold);
                r(ctx, W - 66, oy, 6, 20, P.goldDark);
                r(ctx, W - 64, oy + 2, 2, 16, P.gold);
            }

            for (let row = 0; row < 6; row++) {
                for (let col = 0; col < 10; col++) {
                    if (row > 1 && row < 4 && col > 2 && col < 7) continue;
                    const px = 80 + col * 32;
                    const py = 80 + row * 32;
                    r(ctx, px, py, 12, 12, (row + col) % 2 ? P.carpetPlum : P.carpetRedLight);
                }
            }
        }
    },

    bathtub: {
        nativeWidth: 96,
        nativeHeight: 64,
        draw(ctx) {
            // Claw-foot tub — top-down oval
            r(ctx, 8, 12, 80, 40, P.ceramic);
            r(ctx, 12, 16, 72, 32, P.ceramicLight);
            r(ctx, 14, 18, 68, 28, P.waterLight);
            r(ctx, 16, 20, 64, 24, P.water);
            r(ctx, 8, 12, 80, 4, P.ceramicDark);
            r(ctx, 8, 48, 80, 4, P.ceramicDark);
            r(ctx, 8, 12, 4, 40, P.ceramicDark);
            r(ctx, 84, 12, 4, 40, P.ceramicDark);
            // Rim highlight
            r(ctx, 12, 16, 72, 2, P.white);
            // Claw feet
            for (const fx of [10, 78]) {
                r(ctx, fx, 50, 8, 10, P.silver);
                r(ctx, fx + 1, 58, 6, 2, P.silverDark);
            }
            // Tap at head end
            r(ctx, 44, 10, 8, 6, P.silver);
            r(ctx, 47, 6, 2, 6, P.silverDark);
        }
    },

    toilet: {
        nativeWidth: 64,
        nativeHeight: 64,
        draw(ctx) {
            const C = {
                w: P.white,
                c: P.ceramic,
                l: P.ceramicLight,
                d: P.ceramicDark,
                o: P.outline,
                b: P.water,
                B: P.waterDark,
                m: P.silver
            };

            // Oval seat ring (opens toward north / into the room)
            grid(ctx, 6, 2, 2, [
                "...wwwwwwww...",
                "..wwccccccww..",
                ".wwccccccccww.",
                "wwccccccccccww",
                "wwccbbbbbbccww",
                "wwccbbbbbbccww",
                "wwccccccccccww",
                ".wwccccccccww.",
                "..wwccccccww..",
                "...wwwwwwww..."
            ], C);

            // Water in the bowl
            grid(ctx, 16, 10, 2, [
                "..bbbb..",
                ".bbbbbb.",
                "bbbbbbbb",
                "bbbbbbbb",
                ".bbbbbb.",
                "..bbbb.."
            ], C);
            r(ctx, 22, 14, 20, 8, P.waterDark);

            // Cistern against the wall (south edge of sprite)
            r(ctx, 14, 34, 36, 24, P.ceramic);
            r(ctx, 16, 36, 32, 20, P.ceramicLight);
            r(ctx, 14, 34, 36, 3, P.ceramicDark);
            r(ctx, 14, 55, 36, 3, P.outline);
            r(ctx, 14, 34, 3, 24, P.ceramicDark);
            r(ctx, 47, 34, 3, 24, P.ceramicDark);
            // Lid seam
            r(ctx, 16, 36, 32, 2, P.white);
            // Flush lever
            r(ctx, 40, 42, 8, 3, P.silver);
            r(ctx, 46, 40, 3, 5, P.silverDark);
        }
    },

    water_boiler: {
        nativeWidth: 64,
        nativeHeight: 96,
        draw(ctx) {
            // Wall-mounted copper cylinder
            r(ctx, 18, 8, 28, 72, P.goldDark);
            r(ctx, 20, 10, 24, 68, P.gold);
            r(ctx, 22, 12, 20, 64, P.goldDark);
            r(ctx, 24, 14, 16, 60, P.copper);
            r(ctx, 22, 10, 4, 68, P.highlight);
            // Top dome
            r(ctx, 22, 4, 20, 8, P.gold);
            r(ctx, 26, 2, 12, 4, P.goldDark);
            // Pipes
            r(ctx, 8, 20, 12, 4, P.silver);
            r(ctx, 44, 40, 12, 4, P.silver);
            r(ctx, 46, 44, 4, 16, P.silverDark);
            // Pressure gauge
            r(ctx, 40, 24, 10, 10, P.silver);
            r(ctx, 43, 27, 4, 4, P.white);
            r(ctx, 44, 28, 2, 2, P.red);
            // Wall bracket shadow
            r(ctx, 16, 8, 4, 72, P.shadow);
        }
    },

    secret_bookshelf: {
        nativeWidth: 96,
        nativeHeight: 48,
        draw(ctx) {
            const bookColors = [P.red, P.blue, P.green, P.gold, P.redLight];
            for (let unit = 0; unit < 3; unit++) {
                const ox = unit * 32;
                r(ctx, ox + 2, 0, 28, 48, P.woodDark);
                r(ctx, ox + 4, 2, 24, 44, P.wood);
                for (let y = 6; y < 44; y += 12) {
                    r(ctx, ox + 4, y, 24, 2, P.woodLight);
                }
                for (let shelf = 0; shelf < 3; shelf++) {
                    const by = 8 + shelf * 12;
                    for (let i = 0; i < 5; i++) {
                        r(ctx, ox + 6 + i * 4, by, 3, 8, bookColors[(i + unit) % bookColors.length]);
                    }
                }
                r(ctx, ox + 2, 0, 2, 48, P.outline);
                r(ctx, ox + 28, 0, 2, 48, P.outline);
            }
            // Loose book on the center shelf, pulled partway out
            r(ctx, 42, 18, 6, 10, P.red);
            r(ctx, 48, 16, 10, 12, P.redLight);
            r(ctx, 56, 17, 4, 10, P.cream);
            r(ctx, 58, 18, 2, 8, P.highlight);
        }
    },

    secret_passage_switch: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            r(ctx, 10, 4, 12, 24, P.rockDark);
            r(ctx, 12, 6, 8, 20, P.rock);
            r(ctx, 14, 10, 4, 14, P.silverDark);
            r(ctx, 15, 8, 2, 16, P.silver);
            r(ctx, 12, 22, 8, 4, P.silverDark);
            r(ctx, 13, 23, 6, 2, P.silver);
            r(ctx, 6, 14, 20, 2, P.woodDark);
            r(ctx, 8, 15, 16, 1, P.wood);
        }
    },

    wine_barrel: {
        nativeWidth: 64,
        nativeHeight: 64,
        draw(ctx) {
            drawWineBarrelTopDown(ctx, 14, 10, 2);
        }
    },

    wine_rack: {
        nativeWidth: 96,
        nativeHeight: 64,
        draw(ctx) {
            // Stone alcove with horizontal bottle slots (classic cellar rack)
            r(ctx, 0, 8, 96, 56, P.rockDark);
            r(ctx, 2, 10, 92, 52, P.rock);
            r(ctx, 4, 12, 88, 48, P.rockVoid);

            const drawBottleRow = (y: number) => {
                for (let i = 0; i < 5; i++) {
                    const bx = 8 + i * 17;
                    r(ctx, bx, y, 14, 10, P.woodDark);
                    r(ctx, bx + 1, y + 1, 12, 8, P.wood);
                    // Bottle lying on side
                    r(ctx, bx + 2, y + 3, 10, 4, P.wine);
                    r(ctx, bx + 1, y + 4, 2, 2, P.green);
                    r(ctx, bx + 10, y + 4, 2, 2, P.cream);
                }
            };

            drawBottleRow(16);
            drawBottleRow(34);

            // Stone arch at top
            r(ctx, 0, 0, 96, 12, P.rockLight);
            r(ctx, 4, 0, 88, 10, P.rock);
            r(ctx, 20, 2, 56, 6, P.rockVoid);
            r(ctx, 0, 0, 96, 2, P.rockHi);
            r(ctx, 0, 62, 96, 2, P.outline);
        }
    },

    oil_lamp: {
        nativeWidth: 32,
        nativeHeight: 64,
        draw(ctx) {
            drawOilLampNorthBase(ctx);
            r(ctx, 14, 18, 4, 8, P.fireOrange);
            r(ctx, 15, 16, 2, 4, P.fireYellow);
        }
    },

    spider_web: {
        nativeWidth: 64,
        nativeHeight: 64,
        draw(ctx) {
            drawCobwebGrid(ctx);
        }
    },

    spider_web_tr: {
        nativeWidth: 64,
        nativeHeight: 64,
        draw(ctx, w = 64, h = 64) {
            drawCobwebGrid(ctx);
            mirrorH(ctx, w, h, Math.floor(w / 2));
        }
    },

    spider_web_bl: {
        nativeWidth: 64,
        nativeHeight: 64,
        draw(ctx, w = 64, h = 64) {
            drawCobwebGrid(ctx);
            mirrorV(ctx, w, h, Math.floor(h / 2));
        }
    },

    spider_web_br: {
        nativeWidth: 64,
        nativeHeight: 64,
        draw(ctx, w = 64, h = 64) {
            drawCobwebGrid(ctx);
            mirrorH(ctx, w, h, Math.floor(w / 2));
            mirrorV(ctx, w, h, Math.floor(h / 2));
        }
    },

    attic_roof_beam_h: {
        nativeWidth: 96,
        nativeHeight: 64,
        draw(ctx, w = 96, h = 64) {
            drawAtticRoofBeamH(ctx, w, h);
        }
    },

    attic_roof_bar: {
        nativeWidth: 736,
        nativeHeight: 32,
        draw(ctx, w = 736, h = 32) {
            drawAtticRoofBar(ctx, w, h);
        }
    },

    attic_roof_beam_v: {
        nativeWidth: 32,
        nativeHeight: 128,
        draw(ctx, w = 32, h = 128) {
            drawAtticRoofBeamV(ctx, w, h);
        }
    },

    attic_floor_post: {
        nativeWidth: 32,
        nativeHeight: 224,
        draw(ctx, w = 32, h = 224) {
            drawAtticFloorPost(ctx, w, h);
        }
    },

    guest_bed: {
        nativeWidth: 192,
        nativeHeight: 192,
        draw(ctx) {
            const W = 192;
            const H = 192;

            r(ctx, 12, 24, W - 24, H - 32, P.shadow);

            const leg = (px: number, py: number) => {
                r(ctx, px, py, 8, H - py - 20, P.woodDark);
                r(ctx, px + 1, py + 1, 6, H - py - 22, P.wood);
            };
            leg(16, 32);
            leg(W - 24, 32);
            leg(16, 108);
            leg(W - 24, 108);

            r(ctx, 20, 32, W - 40, 4, P.woodDark);
            r(ctx, 20, H - 36, W - 40, 4, P.woodDark);
            r(ctx, 20, 32, 4, H - 68, P.wood);
            r(ctx, W - 24, 32, 4, H - 68, P.wood);

            r(ctx, 24, 36, W - 48, H - 72, P.cream);
            r(ctx, 26, 38, W - 52, H - 76, P.white);
            r(ctx, 28, 42, W - 56, H - 84, P.highlight);

            r(ctx, 30, 56, W - 60, H - 100, P.carpetPlumLight);
            r(ctx, 32, 58, W - 64, H - 104, P.carpetPlum);
            for (let i = 0; i < 4; i++) {
                r(ctx, 36 + i * 36, 60, 30, H - 108, P.carpetPlumLight);
            }

            r(ctx, 36, 38, 44, 18, P.cream);
            r(ctx, 38, 40, 40, 14, P.white);
            r(ctx, W - 80, 38, 44, 18, P.cream);
            r(ctx, W - 78, 40, 40, 14, P.white);

            r(ctx, 18, 28, W - 36, 8, P.wood);
            r(ctx, 20, 30, W - 40, 4, P.woodHi);
        }
    },

    vanity_table: {
        nativeWidth: 48,
        nativeHeight: 64,
        draw(ctx) {
            drawWoodTabletop(ctx, 6, 28, 36, 8);
            drawTableLegs(ctx, [10, 32], 36, 60);

            r(ctx, 10, 4, 28, 22, P.woodDark);
            r(ctx, 12, 6, 24, 18, P.silverDark);
            r(ctx, 14, 8, 20, 14, P.glass);
            r(ctx, 16, 10, 16, 10, P.glassHi);
            r(ctx, 18, 12, 12, 6, P.highlight);
            r(ctx, 20, 14, 8, 2, P.white);

            r(ctx, 14, 24, 20, 4, P.wood);
            r(ctx, 16, 22, 4, 6, P.goldDark);
            r(ctx, 28, 22, 4, 6, P.goldDark);

            r(ctx, 12, 32, 6, 4, P.cream);
            r(ctx, 30, 33, 5, 3, P.gold);
        }
    },

    manor_vanity: {
        nativeWidth: 64,
        nativeHeight: 80,
        draw(ctx) {
            drawWoodTabletop(ctx, 4, 34, 56, 10);
            drawTableLegs(ctx, [8, 46], 44, 76);

            r(ctx, 6, 2, 52, 30, P.woodDark);
            r(ctx, 8, 4, 48, 26, P.goldDark);
            r(ctx, 10, 6, 44, 22, P.gold);
            r(ctx, 12, 8, 40, 18, P.glass);
            r(ctx, 14, 10, 36, 14, P.glassHi);
            r(ctx, 18, 14, 28, 6, P.highlight);
            r(ctx, 22, 16, 20, 2, P.white);

            for (let i = 0; i < 5; i++) {
                r(ctx, 10 + i * 10, 4, 2, 4, P.gold);
            }

            r(ctx, 8, 30, 48, 4, P.wood);
            r(ctx, 10, 28, 6, 8, P.gold);
            r(ctx, 48, 28, 6, 8, P.gold);

            r(ctx, 10, 36, 8, 5, P.cream);
            r(ctx, 22, 37, 10, 4, P.gold);
            r(ctx, 36, 36, 6, 5, P.wine);
            r(ctx, 46, 37, 8, 4, P.goldDark);
        }
    },

    crummy_bed: {
        nativeWidth: 128,
        nativeHeight: 128,
        draw(ctx) {
            const W = 128;
            const H = 128;

            r(ctx, 10, 20, W - 20, H - 28, P.shadow);

            // Worn iron frame
            const leg = (px: number, py: number) => {
                r(ctx, px, py, 6, H - py - 16, P.ironDark);
                r(ctx, px + 1, py + 1, 4, H - py - 18, P.iron);
            };
            leg(12, 24);
            leg(W - 18, 24);
            leg(12, 72);
            leg(W - 18, 72);

            r(ctx, 14, 24, W - 28, 3, P.ironDark);
            r(ctx, 14, H - 28, W - 28, 3, P.ironDark);
            r(ctx, 14, 24, 3, H - 52, P.iron);
            r(ctx, W - 17, 24, 3, H - 52, P.iron);

            // Thin stained mattress
            r(ctx, 18, 28, W - 36, H - 56, P.woodDark);
            r(ctx, 20, 30, W - 40, H - 60, P.cream);
            r(ctx, 22, 32, W - 44, H - 64, P.highlight);
            r(ctx, 28, 38, 18, 10, P.wood);
            r(ctx, 54, 50, 22, 8, P.woodDark);
            r(ctx, 78, 42, 14, 12, P.wood);

            // Lumpy threadbare blanket
            r(ctx, 22, 44, W - 44, H - 72, P.maidBlack);
            r(ctx, 24, 46, W - 48, H - 76, P.woodDark);
            for (let i = 0; i < 4; i++) {
                r(ctx, 26 + i * 22, 48 + (i % 2) * 4, 18, H - 80, P.maidBlack);
            }

            // Flat pillow
            r(ctx, 28, 30, 36, 14, P.cream);
            r(ctx, 30, 32, 32, 10, P.white);
            r(ctx, 32, 34, 28, 2, P.highlight);
        }
    },

    old_shelf: {
        nativeWidth: 32,
        nativeHeight: 48,
        draw(ctx) {
            r(ctx, 2, 0, 28, 48, P.woodDark);
            r(ctx, 4, 2, 24, 44, P.wood);
            for (let y = 6; y < 44; y += 12) {
                r(ctx, 4, y, 24, 2, P.woodLight);
            }
            // Chipped edges and dust
            r(ctx, 2, 10, 3, 4, P.shadow);
            r(ctx, 26, 30, 4, 3, P.shadow);
            r(ctx, 6, 8, 8, 6, P.cream);
            r(ctx, 7, 9, 6, 4, P.highlight);
            r(ctx, 18, 10, 4, 8, P.water);
            r(ctx, 19, 9, 2, 2, P.waterLight);
            r(ctx, 8, 22, 10, 5, P.woodDark);
            r(ctx, 9, 23, 8, 3, P.cream);
            r(ctx, 20, 34, 6, 6, P.woodLight);
            r(ctx, 21, 35, 4, 4, P.woodDark);
            r(ctx, 2, 0, 2, 48, P.outline);
            r(ctx, 28, 0, 2, 48, P.outline);
        }
    },

    writing_table: {
        nativeWidth: 48,
        nativeHeight: 48,
        draw(ctx) {
            drawWoodTabletop(ctx, 4, 14, 40, 8);
            drawTableLegs(ctx, [8, 34], 22, 46);

            // Ink-stained ledger
            r(ctx, 10, 6, 16, 10, P.cream);
            r(ctx, 11, 7, 14, 8, P.white);
            r(ctx, 12, 9, 10, 1, P.woodDark);
            r(ctx, 12, 11, 8, 1, P.woodDark);
            r(ctx, 13, 13, 6, 1, P.woodDark);
            r(ctx, 18, 8, 6, 6, P.shadow);

            // Inkwell and quill
            r(ctx, 30, 8, 8, 6, P.woodDark);
            r(ctx, 31, 9, 6, 4, P.black);
            r(ctx, 32, 10, 4, 2, P.water);
            r(ctx, 36, 4, 2, 10, P.wood);
            r(ctx, 37, 2, 1, 4, P.highlight);

            // Scuff marks on surface
            r(ctx, 22, 16, 10, 2, P.wood);
            r(ctx, 8, 18, 6, 1, P.woodDark);
        }
    },

    stuffed_moose: {
        nativeWidth: 64,
        nativeHeight: 96,
        draw(ctx) {
            r(ctx, 8, 72, 48, 20, P.woodDark);
            r(ctx, 10, 74, 44, 16, P.wood);
            r(ctx, 12, 76, 40, 2, P.woodHi);

            r(ctx, 14, 44, 36, 30, P.horseCoat);
            r(ctx, 16, 46, 32, 26, P.horseCoatMid);
            r(ctx, 18, 30, 28, 20, P.horseCoatLight);
            r(ctx, 22, 34, 20, 14, P.horseCoat);
            r(ctx, 24, 38, 16, 8, P.horseMuzzle);

            r(ctx, 8, 18, 8, 16, P.woodDark);
            r(ctx, 10, 14, 6, 12, P.wood);
            r(ctx, 46, 18, 8, 16, P.woodDark);
            r(ctx, 48, 14, 6, 12, P.wood);
            r(ctx, 12, 8, 10, 8, P.woodDark);
            r(ctx, 42, 8, 10, 8, P.woodDark);
            r(ctx, 28, 4, 8, 10, P.woodDark);

            r(ctx, 20, 20, 4, 4, P.black);
            r(ctx, 40, 20, 4, 4, P.black);
            r(ctx, 30, 24, 4, 3, P.horseNostril);
        }
    },

    small_bucket: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            // Floor shadow
            r(ctx, 6, 22, 20, 8, P.shadow);

            // Dented tin pail — slightly oval from above
            r(ctx, 8, 10, 16, 18, P.ironDark);
            r(ctx, 9, 11, 14, 16, P.iron);
            r(ctx, 10, 12, 12, 14, P.silverDark);
            r(ctx, 11, 14, 10, 10, P.silver);
            // Rim
            r(ctx, 8, 10, 16, 3, P.iron);
            r(ctx, 9, 10, 14, 1, P.silver);
            // Dent
            r(ctx, 14, 16, 4, 6, P.ironDark);
            r(ctx, 15, 17, 2, 4, P.shadow);
            // Bail handle
            r(ctx, 6, 8, 3, 3, P.ironDark);
            r(ctx, 23, 8, 3, 3, P.ironDark);
            r(ctx, 7, 6, 18, 3, P.iron);
            r(ctx, 8, 7, 16, 1, P.silverDark);
            // Dark interior
            r(ctx, 12, 15, 8, 6, P.ironDark);
            r(ctx, 13, 16, 6, 4, P.shadow);
        }
    },

    armor_stand: {
        nativeWidth: 64,
        nativeHeight: 96,
        draw(ctx) {
            // Wooden display plinth
            r(ctx, 18, 78, 28, 14, P.woodDark);
            r(ctx, 20, 80, 24, 10, P.wood);
            r(ctx, 28, 72, 8, 8, P.woodDark);
            r(ctx, 30, 74, 4, 6, P.woodLight);
            // Poleaxe haft leaning east
            r(ctx, 48, 20, 4, 58, P.woodDark);
            r(ctx, 49, 18, 2, 6, P.iron);
            r(ctx, 44, 12, 12, 10, P.ironDark);
            r(ctx, 46, 10, 8, 4, P.iron);
            r(ctx, 48, 8, 4, 4, P.silver);
            // Leg greaves
            r(ctx, 22, 62, 10, 16, P.ironDark);
            r(ctx, 34, 62, 10, 16, P.iron);
            r(ctx, 24, 64, 6, 12, P.silverDark);
            r(ctx, 36, 64, 6, 12, P.silver);
            // Cuirass / tassets
            r(ctx, 20, 42, 26, 22, P.ironDark);
            r(ctx, 22, 44, 22, 18, P.iron);
            r(ctx, 24, 46, 8, 14, P.silverDark);
            r(ctx, 34, 46, 8, 14, P.silver);
            r(ctx, 30, 50, 4, 10, P.ironDark);
            // Pauldrons
            r(ctx, 14, 34, 14, 14, P.iron);
            r(ctx, 38, 34, 14, 14, P.ironDark);
            r(ctx, 16, 36, 10, 10, P.silver);
            r(ctx, 40, 36, 10, 10, P.silverDark);
            // Gorget ring
            r(ctx, 24, 30, 18, 6, P.iron);
            r(ctx, 26, 31, 14, 4, P.silverDark);
            // Great helm (top-down)
            r(ctx, 22, 10, 22, 22, P.ironDark);
            r(ctx, 24, 12, 18, 18, P.iron);
            r(ctx, 26, 14, 14, 14, P.silverDark);
            r(ctx, 28, 16, 10, 10, P.silver);
            r(ctx, 30, 22, 6, 2, P.ironDark);
            r(ctx, 31, 23, 4, 1, P.black);
            // Crest plume
            r(ctx, 30, 4, 6, 8, P.red);
            r(ctx, 31, 2, 4, 4, P.redLight);
            // West-wall shadow (flush to wall)
            r(ctx, 0, 8, 4, 80, P.shadow);
        }
    }
};
