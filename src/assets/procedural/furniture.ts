import { P } from "./palette";
import { grid, mirrorH, mirrorV, r } from "./pixel";
import { drawFireplaceStatic, FIREPLACE_H, FIREPLACE_W } from "./fireplace";
import { drawOilLampNorthBase } from "./oil_lamp";
import {
    drawAtticOldChest,
    drawAtticPost,
    drawCarpet,
    drawHallRunner,
    drawClockGlassShards,
    drawDiningTable,
    drawGrandPiano,
    drawHallClock,
    drawKitchenTable,
    drawLockedCabinet,
    drawOldShelf,
    drawReadingTable,
    drawSecretBookshelf,
    drawWineBarrel,
    drawWineRack
} from "./furnitureInterior";
import {
    drawBathtub,
    drawBedsideTable,
    drawGuestBed,
    drawGuestVanity,
    drawLordBed,
    drawMaidBed,
    drawManorCarpet,
    drawManorVanity,
    drawToilet,
    drawWaterBoiler
} from "./furnitureBedBath";
import { drawGiltChair } from "./ballroom";
import { ARMOR_STAND_H, ARMOR_STAND_W, drawArmorStand } from "./armorStand";
import { drawStuffedMoose, STUFFED_MOOSE_H, STUFFED_MOOSE_W } from "./stuffed_moose";
import { BLOOD_CRATE_H, BLOOD_CRATE_W, drawBloodCrate } from "./bloodCrate";
import type { ProceduralSpriteDef } from "./types";

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

/** Lerp two #rrggbb colours. */
function mixHex(a: string, b: string, k: number): string {
    const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
    const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * k).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Old stone spiral stair down to the cellars, seen from above: a round
 * stairwell with a low block kerb, worn wedge steps winding clockwise around
 * a central newel and dropping away into darkness.
 */
function drawCellarHatch(ctx: CanvasRenderingContext2D, w = 128, h = 128): void {
    const cx = w * 0.5;
    const cy = h * 0.56;
    const SQ = 0.74; // oblique squash of circles
    const outerR = 54;
    const wellR = 42;
    const newelR = 7;
    const STEPS = 12;
    const STEP_ANGLE = (Math.PI * 2) / STEPS;
    const START = -Math.PI / 2 - STEP_ANGLE / 2; // top step sits at 12 o'clock, by the path
    const STONE_TOP = "#8a847a";
    const STONE_LIT = "#a8a296";
    const STONE_DARK = "#4e4a44";
    const DEEP = "#0c0a0a";
    const ell = (x: number, y: number, ox: number, oy: number, R: number) => Math.hypot((x - ox) / R, (y - oy) / (R * SQ));

    // Trodden earth ring and soft shadow around the kerb
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const d = ell(x, y, cx + 1, cy + 3, outerR + 6);
            if (d < 1 && ell(x, y, cx, cy, outerR) >= 1) r(ctx, x, y, 1, 1, d > 0.93 ? "rgba(40,30,20,0.25)" : "rgba(30,22,14,0.4)");
        }
    }

    // Shaft: dark well with the far inner wall face visible as a curved band
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            if (ell(x, y, cx, cy, wellR) >= 1) continue;
            const below = ell(x, y, cx, cy + 16, wellR - 2);
            if (below >= 1) {
                // Wall face: coursed stone, darker with depth
                const k = Math.min(1, (y - (cy - wellR * SQ)) / 22);
                const course = (y + Math.floor(x / 9)) % 6 === 0 || (y % 6 === 3 && x % 9 === 0);
                r(ctx, x, y, 1, 1, course ? DEEP : mixHex("#5c5650", DEEP, 0.25 + k * 0.6));
            } else {
                r(ctx, x, y, 1, 1, DEEP);
            }
        }
    }

    // Steps: draw the deepest first so each higher step overlaps the one below
    for (let k = STEPS - 1; k >= 0; k--) {
        const depth = k / (STEPS - 1);
        const sy = cy + 3 + k * 1.3;
        const R = wellR - 2 - k * 1.8;
        const a0 = START + k * STEP_ANGLE;
        const a1 = a0 + STEP_ANGLE;
        const top = mixHex(STONE_TOP, DEEP, Math.pow(depth, 0.8) * 0.92);
        const lit = mixHex(STONE_LIT, DEEP, Math.pow(depth, 0.8) * 0.92);
        const dark = mixHex(STONE_DARK, DEEP, Math.pow(depth, 0.8) * 0.9);
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const dx = x + 0.5 - cx;
                const dy = (y + 0.5 - sy) / SQ;
                const rad = Math.hypot(dx, dy);
                if (rad < newelR || rad > R) continue;
                let ang = Math.atan2(dy, dx);
                while (ang < a0) ang += Math.PI * 2;
                if (ang > a1) continue;
                const t = (ang - a0) / STEP_ANGLE;
                // Worn hollow in the middle of the tread, lit nosing at the outer edge
                const mid = Math.abs(rad - (newelR + R) / 2) < (R - newelR) * 0.18 && t > 0.25 && t < 0.8;
                let c = mid ? mixHex(top, DEEP, 0.12) : top;
                if (rad > R - 2) c = lit;
                if (t > 0.86) c = dark; // riser edge where it drops to the next step
                if (((x * 5 + y * 11 + k * 3) & 31) === 0) c = dark; // pitting
                r(ctx, x, y, 1, 1, c);
            }
        }
    }

    // Central newel post rising out of the dark
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const d = ell(x, y, cx, cy + 3, newelR);
            if (d >= 1) continue;
            const side = x - cx;
            r(ctx, x, y, 1, 1, side < -2 ? STONE_LIT : side > 2 ? STONE_DARK : STONE_TOP);
        }
    }
    r(ctx, cx - 2, cy + 1, 3, 1, "#c8c2b4");

    // Low kerb of dressed blocks around the well, with an opening at the top step
    const blocks = 20;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const dOut = ell(x, y, cx, cy, outerR);
            const dIn = ell(x, y, cx, cy, wellR);
            if (dOut >= 1 || dIn < 1) continue;
            const ang = Math.atan2((y - cy) / SQ, x - cx);
            if (Math.abs(ang - -Math.PI / 2) < STEP_ANGLE * 0.55) continue; // entry gap
            const bi = Math.floor(((ang + Math.PI) / (Math.PI * 2)) * blocks);
            const bStart = (bi / blocks) * Math.PI * 2 - Math.PI;
            const joint = Math.abs(ang - bStart) * outerR < 1.2;
            const litK = Math.cos(ang + Math.PI * 0.75); // light from the upper left
            const tone = bi % 3 === 0 ? "#7a7368" : bi % 3 === 1 ? "#868074" : "#706a60";
            let c = litK > 0.4 ? mixHex(tone, "#c0b8aa", 0.35) : litK < -0.4 ? mixHex(tone, "#2a2622", 0.35) : tone;
            if (joint) c = "#3a3630";
            if (dIn < 1.06) c = mixHex(c, "#2a2622", 0.4); // inner lip in shadow
            if (((x * 7 + y * 3) & 63) === 0) c = "#4a5a3a"; // moss
            r(ctx, x, y, 1, 1, c);
        }
    }
    // Outer face of the kerb on the near (south) side
    for (let x = 0; x < w; x++) {
        const dx = (x + 0.5 - cx) / outerR;
        if (Math.abs(dx) >= 1) continue;
        const yEdge = Math.round(cy + Math.sqrt(1 - dx * dx) * outerR * SQ);
        for (let i = 0; i < 5; i++) r(ctx, x, yEdge + i, 1, 1, i === 0 ? "#5e584e" : i === 4 ? "#2e2a26" : "#4e4942");
        if (Math.round((x - cx) * 1.6) % 13 === 0) r(ctx, x, yEdge, 1, 5, "#2e2a26");
    }
    // Cheek stones flanking the entry, a couple of fallen leaves on the top step
    for (const sx of [-1, 1]) {
        const ex = Math.round(cx + sx * 13);
        const ey = Math.round(cy - outerR * SQ + 4);
        r(ctx, ex - 4, ey - 2, 8, 9, "#7a7368");
        r(ctx, ex - 4, ey - 2, 8, 2, "#a8a296");
        r(ctx, ex - 4, ey + 6, 8, 1, "#3a3630");
    }
    r(ctx, cx - 6, cy - 30, 3, 2, "#8a5a2a");
    r(ctx, cx + 4, cy - 27, 2, 2, "#a06a2a");
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

export const FURNITURE_SPRITES: Record<string, ProceduralSpriteDef> = {
    fireplace: {
        nativeWidth: FIREPLACE_W,
        nativeHeight: FIREPLACE_H,
        draw(ctx) {
            drawFireplaceStatic(ctx);
        }
    },

    manor_lord_bed: {
        nativeWidth: 128,
        nativeHeight: 128,
        draw(ctx) {
            drawLordBed(ctx);
        }
    },

    dining_table: {
        nativeWidth: 128,
        nativeHeight: 64,
        draw(ctx) {
            drawDiningTable(ctx);
        }
    },

    kitchen_table: {
        nativeWidth: 128,
        nativeHeight: 64,
        draw(ctx) {
            drawKitchenTable(ctx);
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

    fancy_chair: {
        nativeWidth: 32,
        nativeHeight: 48,
        draw(ctx) {
            drawGiltChair(ctx);
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
        nativeWidth: 144,
        nativeHeight: 96,
        draw(ctx) {
            drawCarpet(ctx);
        }
    },

    hall_runner: {
        nativeWidth: 80,
        nativeHeight: 224,
        draw(ctx) {
            drawHallRunner(ctx);
        }
    },

    manor_carpet: {
        nativeWidth: 240,
        nativeHeight: 176,
        draw(ctx) {
            drawManorCarpet(ctx);
        }
    },

    bathtub: {
        nativeWidth: 48,
        nativeHeight: 32,
        draw(ctx) {
            drawBathtub(ctx);
        }
    },

    toilet: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            drawToilet(ctx);
        }
    },

    water_boiler: {
        nativeWidth: 32,
        nativeHeight: 48,
        draw(ctx) {
            drawWaterBoiler(ctx);
        }
    },

    secret_bookshelf: {
        nativeWidth: 96,
        nativeHeight: 64,
        draw(ctx) {
            drawSecretBookshelf(ctx);
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
            drawWineBarrel(ctx);
        }
    },

    wine_rack: {
        nativeWidth: 96,
        nativeHeight: 64,
        draw(ctx) {
            drawWineRack(ctx);
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
        nativeHeight: 128,
        draw(ctx, w = 32, h = 128) {
            drawAtticPost(ctx, w, h);
        }
    },

    guest_bed: {
        nativeWidth: 96,
        nativeHeight: 96,
        draw(ctx) {
            drawGuestBed(ctx);
        }
    },

    vanity_table: {
        nativeWidth: 48,
        nativeHeight: 64,
        draw(ctx) {
            drawGuestVanity(ctx);
        }
    },

    manor_vanity: {
        nativeWidth: 64,
        nativeHeight: 80,
        draw(ctx) {
            drawManorVanity(ctx);
        }
    },

    crummy_bed: {
        nativeWidth: 64,
        nativeHeight: 64,
        draw(ctx) {
            drawMaidBed(ctx);
        }
    },

    old_shelf: {
        nativeWidth: 32,
        nativeHeight: 64,
        draw(ctx) {
            drawOldShelf(ctx);
        }
    },

    locked_cabinet: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            drawLockedCabinet(ctx);
        }
    },

    blood_crate: {
        nativeWidth: BLOOD_CRATE_W,
        nativeHeight: BLOOD_CRATE_H,
        draw(ctx) {
            drawBloodCrate(ctx);
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

    reading_table: {
        nativeWidth: 48,
        nativeHeight: 32,
        draw(ctx) {
            drawReadingTable(ctx);
        }
    },

    stuffed_moose: {
        nativeWidth: STUFFED_MOOSE_W,
        nativeHeight: STUFFED_MOOSE_H,
        draw(ctx) {
            drawStuffedMoose(ctx);
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

    ash_canister: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            r(ctx, 6, 24, 20, 6, P.shadow);
            // Cylindrical ash tin
            r(ctx, 9, 8, 14, 18, P.ironDark);
            r(ctx, 10, 9, 12, 16, P.iron);
            r(ctx, 11, 10, 10, 14, P.silverDark);
            // Rim
            r(ctx, 8, 8, 16, 3, P.iron);
            r(ctx, 9, 8, 14, 1, P.silver);
            // Ash mound
            r(ctx, 11, 14, 10, 8, P.mid);
            r(ctx, 12, 13, 8, 4, P.light);
            r(ctx, 13, 15, 6, 5, P.shadow);
            // Charred paper scrap
            r(ctx, 14, 12, 5, 3, P.cream);
            r(ctx, 15, 12, 3, 2, P.brickDark);
            r(ctx, 18, 16, 3, 2, P.woodDark);
            // Lid askew
            r(ctx, 16, 6, 10, 3, P.ironDark);
            r(ctx, 17, 6, 8, 2, P.iron);
        }
    },

    armor_stand: {
        nativeWidth: ARMOR_STAND_W,
        nativeHeight: ARMOR_STAND_H,
        draw(ctx) {
            drawArmorStand(ctx);
        }
    },

    hall_clock: {
        nativeWidth: 64,
        nativeHeight: 160,
        draw(ctx) {
            drawHallClock(ctx);
        }
    },

    clock_glass_shards: {
        nativeWidth: 96,
        nativeHeight: 64,
        draw(ctx) {
            drawClockGlassShards(ctx);
        }
    },

    grand_piano: {
        nativeWidth: 80,
        nativeHeight: 48,
        draw(ctx) {
            drawGrandPiano(ctx);
        }
    },

    bedside_table: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            drawBedsideTable(ctx);
        }
    },

    rusty_old_key: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            r(ctx, 10, 8, 10, 10, P.ironDark);
            r(ctx, 11, 9, 8, 8, P.iron);
            r(ctx, 12, 10, 6, 6, P.silverDark);
            r(ctx, 20, 12, 12, 4, P.iron);
            r(ctx, 28, 10, 4, 8, P.ironDark);
            r(ctx, 29, 11, 2, 6, P.silver);
            r(ctx, 13, 12, 2, 2, P.black);
            r(ctx, 11, 16, 2, 2, P.brick);
            r(ctx, 15, 14, 2, 2, P.brick);
        }
    },

    barons_diary: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            r(ctx, 6, 8, 20, 18, P.woodDark);
            r(ctx, 7, 9, 18, 16, P.cream);
            r(ctx, 8, 10, 16, 14, P.white);
            r(ctx, 6, 8, 4, 18, P.wood);
            r(ctx, 7, 9, 2, 16, P.woodLight);
            for (let y = 12; y < 22; y += 3) {
                r(ctx, 11, y, 12, 1, P.highlight);
            }
            r(ctx, 10, 12, 8, 2, P.shadow);
            r(ctx, 22, 8, 2, 18, P.outline);
        }
    },

    attic_old_chest: {
        nativeWidth: 48,
        nativeHeight: 32,
        draw(ctx) {
            drawAtticOldChest(ctx);
        }
    }
};
