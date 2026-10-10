/**
 * Interior furniture redrawn at uniform integer scale (see furnitureKit.ts).
 * Each export lists its native size and the in-game draw scale.
 */
import { P } from "./palette";
import { discCrisp, hline, p, r, rrCrisp, shade, vline } from "./pixel";
import {
    bookcase,
    bookRow,
    ellipse,
    floorShadow,
    IRON,
    leg,
    line,
    MAHOGANY,
    panel,
    recess,
    seeded,
    tabletop,
    WOOD
} from "./furnitureKit";
import { drawRug } from "./furnitureBedBath";

// ---------------------------------------------------------------------------
// Shelving (1x)
// ---------------------------------------------------------------------------

/** 32x64 @1x — library/study bookcase. */
export function drawBookshelf(ctx: CanvasRenderingContext2D): void {
    bookcase(ctx, 1, 0, 30, 64, 7);
}

/** 96x64 @1x — three bookcases; one volume pulled loose on the centre unit. */
export function drawSecretBookshelf(ctx: CanvasRenderingContext2D): void {
    bookcase(ctx, 1, 0, 30, 64, 7);
    const { shelfYs } = bookcase(ctx, 33, 0, 30, 64, 11);
    bookcase(ctx, 65, 0, 30, 64, 13);
    // Loose red volume tilted forward out of the middle shelf
    const sy = shelfYs[1];
    r(ctx, 45, sy - 12, 6, 12, "#1e140c");
    r(ctx, 44, sy - 11, 5, 11, "#7a2424");
    vline(ctx, 44, sy - 11, 11, "#a84038");
    hline(ctx, 44, sy - 9, 5, P.gold);
    hline(ctx, 44, sy - 3, 5, P.gold);
    r(ctx, 49, sy - 10, 2, 10, P.cream);
    hline(ctx, 43, sy + 2, 8, "rgba(0,0,0,0.35)");
}

/** 32x64 @1x — shabby open shelf in the maid's room. */
export function drawOldShelf(ctx: CanvasRenderingContext2D): void {
    const ramp = { ...WOOD, l: shade(WOOD.l, -0.1), h: shade(WOOD.h, -0.15) };
    r(ctx, 1, 0, 30, 64, ramp.o);
    r(ctx, 2, 1, 28, 4, ramp.m);
    hline(ctx, 2, 1, 28, ramp.l);
    r(ctx, 2, 5, 2, 58, ramp.l);
    r(ctx, 28, 5, 2, 58, ramp.d);
    r(ctx, 4, 5, 24, 58, "#22180e");
    const shelves = [20, 36, 52, 62];
    for (const sy of shelves) {
        hline(ctx, 4, sy, 24, ramp.l);
        hline(ctx, 4, sy + 1, 24, ramp.d);
    }
    // Top shelf: chipped jug + folded linen
    r(ctx, 6, 12, 6, 8, "#8a8478");
    r(ctx, 7, 11, 4, 1, "#a8a296");
    vline(ctx, 6, 12, 8, "#a8a296");
    r(ctx, 12, 14, 2, 3, "#6a645c");
    r(ctx, 16, 15, 10, 5, P.cream);
    hline(ctx, 16, 15, 10, P.white);
    hline(ctx, 16, 17, 10, "#c8bca8");
    // Middle shelf: tin box + two books lying flat
    r(ctx, 6, 29, 9, 7, "#4a5058");
    hline(ctx, 6, 29, 9, "#6a727a");
    p(ctx, 10, 32, P.gold);
    r(ctx, 17, 32, 10, 2, "#26385a");
    r(ctx, 18, 30, 8, 2, "#7a2424");
    // Lower shelf: medicine bottle + candle stub
    r(ctx, 8, 46, 3, 6, "#3a5a4a");
    p(ctx, 9, 45, "#6a645c");
    vline(ctx, 8, 46, 6, "#5a8a6a");
    r(ctx, 20, 48, 3, 4, P.cream);
    p(ctx, 21, 47, P.candle);
    // Cobweb in the corner + chipped edge
    p(ctx, 26, 6, P.light);
    p(ctx, 25, 7, P.light);
    p(ctx, 26, 8, P.light);
    r(ctx, 28, 40, 2, 3, ramp.o);
}

// ---------------------------------------------------------------------------
// Tables (2x)
// ---------------------------------------------------------------------------

/** 48x32 @2x — library reading table with banker's lamp and an open book. */
export function drawReadingTable(ctx: CanvasRenderingContext2D): void {
    floorShadow(ctx, 3, 29, 42);
    leg(ctx, 5, 17, 31, 3, WOOD);
    leg(ctx, 40, 17, 31, 3, WOOD);
    tabletop(ctx, 1, 9, 46, 6, 3, WOOD, 3);

    // Banker's lamp: brass base, green glass shade
    r(ctx, 6, 9, 7, 2, P.goldDark);
    hline(ctx, 6, 9, 7, P.gold);
    vline(ctx, 9, 4, 5, P.goldDark);
    r(ctx, 4, 1, 11, 4, "#1e4a2a");
    hline(ctx, 5, 1, 9, "#3a7a46");
    hline(ctx, 4, 4, 11, "#14301c");
    p(ctx, 6, 2, "#6aaa6a");
    // Warm pool of light on the desk
    hline(ctx, 4, 6, 11, "rgba(255,220,140,0.25)");

    // Open book
    r(ctx, 18, 6, 15, 6, "#2a1c10");
    r(ctx, 18, 5, 7, 6, P.cream);
    r(ctx, 26, 5, 7, 6, P.white);
    vline(ctx, 25, 5, 6, "#b8ae9c");
    for (const ly of [6, 8]) {
        hline(ctx, 19, ly, 5, "#8a8070");
        hline(ctx, 27, ly, 5, "#8a8070");
    }
    // Stack of books
    r(ctx, 37, 7, 8, 2, "#7a2424");
    r(ctx, 38, 5, 7, 2, "#26385a");
    r(ctx, 37, 3, 7, 2, "#2e4a2c");
    hline(ctx, 37, 3, 7, "#466a3e");
}

function drawPlate(ctx: CanvasRenderingContext2D, cx: number, cy: number, food: string): void {
    ellipse(ctx, cx, cy, 3, 2, "#c8c4bc");
    ellipse(ctx, cx, cy, 2, 1.4, P.white);
    p(ctx, cx, cy, food);
}

function drawGoblet(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    r(ctx, x, y, 2, 2, P.wine);
    hline(ctx, x, y, 2, "#c8c4bc");
    p(ctx, x, y + 2, "#a8a4a0");
}

function drawCandle(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    vline(ctx, x, y, 4, P.cream);
    p(ctx, x, y - 1, P.fireYellow);
    p(ctx, x, y - 2, "rgba(255,200,80,0.6)");
}

/** 128x64 @2x — long dining table dressed for a formal dinner. */
export function drawDiningTable(ctx: CanvasRenderingContext2D): void {
    const cloth = P.cream;
    const clothShade = "#c8bca8";
    const clothDeep = "#a89c88";

    // Carver chairs at either end (high backs seen past the table)
    for (const x of [1, 119]) {
        panel(ctx, x, 6, 8, 34, MAHOGANY);
        r(ctx, x + 2, 9, 4, 10, "#7a2424");
        hline(ctx, x + 2, 9, 4, "#9a3a32");
        leg(ctx, x + 1, 40, 58, 2, MAHOGANY);
        leg(ctx, x + 5, 40, 58, 2, MAHOGANY);
    }

    floorShadow(ctx, 12, 60, 104, 3);
    // Legs under the drape
    leg(ctx, 16, 44, 61, 4, MAHOGANY);
    leg(ctx, 108, 44, 61, 4, MAHOGANY);
    leg(ctx, 60, 46, 61, 4, MAHOGANY);

    // Table top under the cloth (only the front edge shows)
    r(ctx, 10, 14, 108, 26, MAHOGANY.o);
    // Cloth top surface
    r(ctx, 11, 15, 106, 24, cloth);
    hline(ctx, 11, 15, 106, P.white);
    // Drape down the front with scalloped hem
    r(ctx, 11, 39, 106, 6, clothShade);
    hline(ctx, 11, 39, 106, cloth);
    for (let x = 11; x < 117; x += 8) {
        r(ctx, x, 45, 6, 1, clothShade);
        vline(ctx, x + 6, 40, 5, clothDeep);
    }
    // Side drapes
    r(ctx, 10, 16, 2, 30, clothShade);
    r(ctx, 116, 16, 2, 30, clothDeep);

    // Runner down the centre
    r(ctx, 14, 24, 100, 6, "#7a2424");
    hline(ctx, 14, 24, 100, "#9a3a32");
    hline(ctx, 14, 29, 100, P.goldDark);

    // Candelabra (two), roast and fruit bowl on the runner
    for (const cx of [38, 90]) {
        hline(ctx, cx - 4, 22, 9, P.goldDark);
        vline(ctx, cx, 22, 5, P.goldDark);
        r(ctx, cx - 1, 26, 3, 1, P.gold);
        drawCandle(ctx, cx - 4, 18);
        drawCandle(ctx, cx, 17);
        drawCandle(ctx, cx + 4, 18);
    }
    ellipse(ctx, 64, 27, 8, 3, "#c8c4bc");
    ellipse(ctx, 64, 26.5, 5, 2, "#8a4a24");
    hline(ctx, 61, 25, 4, "#aa6a3a");
    ellipse(ctx, 22, 27, 3, 2, "#a8a4a0");
    p(ctx, 21, 26, P.red);
    p(ctx, 23, 26, P.foodGreen);
    ellipse(ctx, 106, 27, 3, 2, "#a8a4a0");
    p(ctx, 105, 26, P.gold);
    p(ctx, 107, 26, P.red);

    // Place settings: far side and near side
    for (const cx of [24, 46, 72, 98]) {
        drawPlate(ctx, cx, 19, P.foodBrown);
        drawGoblet(ctx, cx + 4, 17);
    }
    for (const cx of [18, 36, 54, 74, 92, 110]) {
        drawPlate(ctx, cx, 34, cx % 4 === 0 ? P.foodGreen : P.foodBrown);
        drawGoblet(ctx, cx + 4, 31);
        vline(ctx, cx - 4, 33, 3, "#a8a4a0");
    }
}

/** 128x64 @2x — scrubbed pine kitchen table with prep on top. */
export function drawKitchenTable(ctx: CanvasRenderingContext2D): void {
    const pine = { o: "#3a2614", d: "#7a5a36", m: "#9a7648", l: "#b8925e", h: "#d0ac78" };
    floorShadow(ctx, 6, 60, 116, 3);
    leg(ctx, 8, 30, 61, 5, pine);
    leg(ctx, 115, 30, 61, 5, pine);
    leg(ctx, 12, 28, 52, 4, { ...pine, d: shade(pine.d, -0.2), m: pine.d });
    leg(ctx, 112, 28, 52, 4, { ...pine, d: shade(pine.d, -0.2), m: pine.d });
    // Stretcher between back legs
    hline(ctx, 16, 48, 96, pine.d);
    tabletop(ctx, 2, 8, 124, 18, 5, pine, 9);
    // Knife scores on the scrubbed top
    const rand = seeded(5);
    for (let i = 0; i < 14; i++) {
        const x = 8 + Math.floor(rand() * 110);
        const y = 11 + Math.floor(rand() * 13);
        hline(ctx, x, y, 3, pine.m);
    }

    // Chopping board with carrots and a cleaver
    r(ctx, 14, 12, 26, 11, "#5a3a20");
    r(ctx, 15, 12, 24, 10, "#8a6036");
    hline(ctx, 15, 12, 24, "#a87848");
    for (const [x, y] of [[18, 15], [24, 17], [20, 19]] as const) {
        hline(ctx, x, y, 4, "#d07028");
        p(ctx, x + 4, y, P.foodGreen);
    }
    r(ctx, 30, 14, 7, 4, "#a8b0b8");
    hline(ctx, 30, 14, 7, "#d0d8e0");
    r(ctx, 37, 15, 4, 2, "#3a2614");

    // Earthenware mixing bowl
    ellipse(ctx, 62, 15, 9, 4, "#8a4a2a");
    ellipse(ctx, 62, 14, 7, 2.5, "#e8dcc8");
    hline(ctx, 58, 13, 4, P.white);
    hline(ctx, 54, 18, 16, "#6a3420");

    // Flour sack slumped on the end
    rrCrisp(ctx, 96, 4, 18, 16, 4, "#c8bca0");
    hline(ctx, 99, 5, 12, "#e0d6bc");
    vline(ctx, 112, 7, 10, "#a89c80");
    r(ctx, 102, 3, 6, 2, "#8a7a5a");
    p(ctx, 100, 14, P.white);
    p(ctx, 104, 15, P.white);

    // Loaf + eggs
    ellipse(ctx, 82, 16, 6, 3, "#a86a30");
    hline(ctx, 78, 14, 6, "#c88a48");
    p(ctx, 80, 16, "#7a4a20");
    p(ctx, 84, 16, "#7a4a20");
    for (const x of [88, 91]) {
        r(ctx, x, 19, 2, 2, "#f0e8d8");
    }
}

// ---------------------------------------------------------------------------
// Carpet (2x)
// ---------------------------------------------------------------------------

/** 144x96 @2x — Persian-style rug under the dining table. */
export function drawCarpet(ctx: CanvasRenderingContext2D): void {
    drawRug(ctx, 144, 96, {
        field: P.carpetPlum,
        fieldLight: P.carpetPlumLight,
        border: "#3a1a2a",
        borderMid: "#7a2a3a",
        accent: P.gold,
        accentDark: P.goldDark,
        cream: "#d8c8a8",
        fringe: "#d8ccb0"
    });
}

/** 80x224 @2x — long crimson runner down the entrance hall (hall only). */
export function drawHallRunner(ctx: CanvasRenderingContext2D): void {
    const W = 80;
    const H = 224;
    const red = P.carpetRed;
    const redLight = P.carpetRedLight;
    const redDark = "#4a0f1c";
    const navy = "#1a2236";
    const cream = "#d8c8a8";
    const rand = seeded(11);

    // Fringe at both short ends
    for (let x = 6; x < W - 6; x += 2) {
        vline(ctx, x, 0, 4, "#d8ccb0");
        vline(ctx, x, H - 4, 4, "#d8ccb0");
    }
    // Woven body: border band, gold pinstripes, field
    r(ctx, 4, 4, W - 8, H - 8, navy);
    r(ctx, 6, 6, W - 12, H - 12, P.goldDark);
    r(ctx, 7, 7, W - 14, H - 14, navy);
    r(ctx, 11, 11, W - 22, H - 22, P.gold);
    r(ctx, 12, 12, W - 24, H - 24, red);

    // Border motif: little gold diamonds with cream centres between the stripes
    for (let y = 14; y < H - 12; y += 8) {
        for (const x of [9, W - 10]) {
            p(ctx, x, y - 1, P.gold);
            hline(ctx, x - 1, y, 3, P.gold);
            p(ctx, x, y + 1, P.gold);
            p(ctx, x, y, cream);
        }
    }

    // Field: fine diagonal weave texture
    const fx = 12;
    const fy = 12;
    const fw = W - 24;
    const fh = H - 24;
    for (let y = fy; y < fy + fh; y++) {
        for (let x = fx; x < fx + fw; x++) {
            if ((x + y) % 6 === 0) p(ctx, x, y, redDark);
            else if ((x - y + 600) % 12 === 0) p(ctx, x, y, redLight);
        }
    }

    // Repeating central medallions linked by a gold vine
    const cx = W / 2;
    const step = 40;
    for (let cy = fy + 20; cy < fy + fh - 12; cy += step) {
        for (let dy = -12; dy <= 12; dy++) {
            const half = Math.round(13 * (1 - Math.abs(dy) / 13));
            if (half > 0) hline(ctx, cx - half, cy + dy, half * 2, Math.abs(dy) % 5 === 0 ? P.goldDark : navy);
        }
        for (let dy = -8; dy <= 8; dy++) {
            const half = Math.round(8.5 * (1 - Math.abs(dy) / 9));
            if (half > 0) hline(ctx, cx - half, cy + dy, half * 2, redLight);
        }
        for (let dy = -3; dy <= 3; dy++) {
            const half = 4 - Math.abs(dy);
            if (half > 0) hline(ctx, cx - half, cy + dy, half * 2, P.gold);
        }
        p(ctx, cx, cy, cream);
        // Side rosettes
        for (const sx of [-1, 1]) {
            const px = cx + sx * 20;
            r(ctx, px - 1, cy - 1, 3, 3, P.gold);
            p(ctx, px, cy, cream);
        }
        // Vine to the next medallion
        if (cy + step < fy + fh - 12) {
            vline(ctx, cx, cy + 13, step - 26, P.goldDark);
            p(ctx, cx - 1, cy + step / 2, P.gold);
            p(ctx, cx + 1, cy + step / 2, P.gold);
        }
    }

    // Wear: lighter trodden patches and faint speckle
    for (let i = 0; i < 90; i++) {
        p(ctx, fx + Math.floor(rand() * fw), fy + Math.floor(rand() * fh), "rgba(255,255,255,0.06)");
    }
    for (let i = 0; i < 40; i++) {
        p(ctx, fx + Math.floor(rand() * fw), fy + Math.floor(rand() * fh), "rgba(0,0,0,0.12)");
    }
}

// ---------------------------------------------------------------------------
// Storage (2x)
// ---------------------------------------------------------------------------

/** 32x32 @2x — riveted iron cabinet with a brass keyhole plate. */
export function drawLockedCabinet(ctx: CanvasRenderingContext2D): void {
    floorShadow(ctx, 4, 30, 24);
    panel(ctx, 5, 1, 22, 29, IRON);
    // Cornice
    r(ctx, 4, 0, 24, 3, IRON.o);
    hline(ctx, 5, 1, 22, IRON.h);
    // Two doors
    recess(ctx, 7, 4, 8, 23, IRON);
    recess(ctx, 17, 4, 8, 23, IRON);
    vline(ctx, 16, 4, 23, IRON.o);
    // Rivets
    for (const y of [5, 15, 25]) {
        for (const x of [8, 14, 18, 24]) p(ctx, x, y, IRON.h);
    }
    // Brass escutcheon + keyhole
    r(ctx, 14, 13, 5, 6, P.goldDark);
    hline(ctx, 14, 13, 5, P.gold);
    p(ctx, 16, 15, IRON.o);
    p(ctx, 16, 16, IRON.o);
    // Feet
    r(ctx, 6, 29, 3, 2, IRON.o);
    r(ctx, 23, 29, 3, 2, IRON.o);
}

/** 48x32 @2x — domed attic trunk with iron straps and a hasp. */
export function drawAtticOldChest(ctx: CanvasRenderingContext2D): void {
    const wood = { ...WOOD, l: shade(WOOD.l, -0.08) };
    floorShadow(ctx, 3, 29, 42);
    // Body
    panel(ctx, 3, 13, 42, 16, wood);
    for (const y of [17, 21, 25]) hline(ctx, 4, y, 40, wood.d);
    // Domed lid
    for (let y = 4; y <= 13; y++) {
        const t = (13 - y) / 9;
        const inset = Math.round(4 * t * t);
        r(ctx, 3 + inset, y, 42 - inset * 2, 1, y === 4 ? wood.o : wood.m);
        p(ctx, 3 + inset, y, wood.o);
        p(ctx, 44 - inset, y, wood.o);
        if (y < 9) p(ctx, 4 + inset, y, wood.l);
    }
    hline(ctx, 6, 6, 36, wood.l);
    hline(ctx, 3, 13, 42, wood.o);
    // Iron straps over lid and body
    for (const x of [9, 36]) {
        r(ctx, x, 5, 3, 24, IRON.d);
        vline(ctx, x, 5, 24, IRON.l);
        p(ctx, x + 1, 8, IRON.h);
        p(ctx, x + 1, 20, IRON.h);
    }
    // Corner caps
    for (const x of [3, 41]) r(ctx, x, 25, 4, 4, IRON.m);
    // Hasp + padlock (rusty)
    r(ctx, 22, 11, 4, 5, IRON.d);
    rrCrisp(ctx, 21, 15, 6, 6, 1, "#8a5a2a");
    hline(ctx, 22, 15, 4, "#aa7a3a");
    p(ctx, 24, 17, IRON.o);
    p(ctx, 24, 18, IRON.o);
    // Dust on the lid
    for (const [x, y] of [[14, 6], [20, 5], [30, 6], [27, 8]] as const) p(ctx, x, y, "#a89c88");
}

/** 32x(h) @1x — attic support post; collision only at the footing. */
export function drawAtticPost(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const cx = Math.floor(w / 2) - 4;
    const footH = 14;
    const top = 0;
    const bottom = h - footH;
    // Post
    r(ctx, cx, top, 8, bottom - top, WOOD.o);
    r(ctx, cx + 1, top, 6, bottom - top, WOOD.m);
    vline(ctx, cx + 1, top, bottom - top, WOOD.l);
    vline(ctx, cx + 6, top, bottom - top, WOOD.d);
    const rand = seeded(h);
    for (let y = top + 6; y < bottom - 4; y += 9 + Math.floor(rand() * 8)) {
        vline(ctx, cx + 3 + Math.floor(rand() * 2), y, 3 + Math.floor(rand() * 4), WOOD.d);
    }
    // Iron nails
    for (let y = top + 12; y < bottom - 8; y += 30) p(ctx, cx + 5, y, IRON.l);
    // Footing block
    floorShadow(ctx, cx - 6, h - 2, 20);
    panel(ctx, cx - 4, bottom, 16, footH - 2, WOOD);
}

// ---------------------------------------------------------------------------
// Hall clock (1x) — the clock stopped at eleven
// ---------------------------------------------------------------------------

/** 64x160 @1x — mahogany longcase clock frozen at 11:00, hood glass shattered. */
export function drawHallClock(ctx: CanvasRenderingContext2D): void {
    const M = MAHOGANY;
    const cx = 32;
    floorShadow(ctx, 12, 157, 40, 3);

    // Plinth with bracket feet
    panel(ctx, 12, 136, 40, 20, M);
    recess(ctx, 16, 140, 32, 11, M);
    r(ctx, 12, 155, 6, 3, M.o);
    r(ctx, 46, 155, 6, 3, M.o);

    // Trunk
    panel(ctx, 16, 66, 32, 72, M);
    // Long trunk door with cracked pendulum window
    panel(ctx, 20, 72, 24, 58, M);
    r(ctx, 24, 80, 16, 36, "#140a06");
    // Pendulum rod + brass bob, stopped off-centre
    vline(ctx, 32, 80, 26, P.goldDark);
    discCrisp(ctx, 33, 108, 4, P.goldDark);
    discCrisp(ctx, 32, 107, 3, P.gold);
    p(ctx, 31, 106, P.white);
    // Weights
    r(ctx, 26, 82, 3, 10, P.goldDark);
    r(ctx, 35, 86, 3, 10, P.goldDark);
    // Glass with a crack
    r(ctx, 24, 80, 16, 36, "rgba(170,200,220,0.12)");
    line(ctx, 25, 82, 31, 94, "rgba(230,240,250,0.8)");
    line(ctx, 31, 94, 28, 101, "rgba(230,240,250,0.8)");
    line(ctx, 31, 94, 38, 98, "rgba(230,240,250,0.6)");
    // Brass keyhole
    p(ctx, 42, 100, P.gold);

    // Waist moulding
    r(ctx, 13, 62, 38, 5, M.o);
    hline(ctx, 14, 63, 36, M.l);
    hline(ctx, 14, 65, 36, M.d);

    // Hood
    panel(ctx, 12, 14, 40, 49, M);
    // Columns either side of the dial
    for (const x of [14, 46]) {
        r(ctx, x, 18, 4, 42, M.d);
        vline(ctx, x + 1, 18, 42, M.l);
        r(ctx, x - 1, 18, 6, 2, P.goldDark);
        r(ctx, x - 1, 58, 6, 2, P.goldDark);
    }
    // Broken-arch pediment with brass finials
    for (let y = 2; y <= 14; y++) {
        const t = (14 - y) / 12;
        const inset = Math.round(18 * t * t);
        r(ctx, 10 + inset, y, 44 - inset * 2, 1, y < 4 ? M.o : M.m);
        p(ctx, 10 + inset, y, M.o);
        p(ctx, 53 - inset, y, M.o);
        if (y < 12) p(ctx, 11 + inset, y, M.l);
    }
    r(ctx, 29, 0, 6, 6, M.o);
    r(ctx, 30, 1, 4, 5, M.m);
    for (const x of [cx - 1, 9, 53]) {
        discCrisp(ctx, x, x === cx - 1 ? 0 : 11, 1, P.gold);
        p(ctx, x, x === cx - 1 ? 0 : 11, P.gold);
        r(ctx, x - 1, x === cx - 1 ? 1 : 12, 3, 2, P.goldDark);
    }

    // Dial: brass spandrels, cream chapter ring, black ticks
    const dy = 37;
    r(ctx, 19, 19, 26, 38, "#140a06");
    r(ctx, 20, 20, 24, 36, P.goldDark);
    discCrisp(ctx, cx, dy, 11, P.gold);
    discCrisp(ctx, cx, dy, 10, "#efe6cf");
    discCrisp(ctx, cx, dy, 6, "#f7f0dc");
    for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const tx = cx + Math.round(Math.sin(a) * 8);
        const ty = dy - Math.round(Math.cos(a) * 8);
        p(ctx, tx, ty, "#2a1a10");
        if (i % 3 === 0) p(ctx, cx + Math.round(Math.sin(a) * 9), dy - Math.round(Math.cos(a) * 9), "#2a1a10");
    }
    // Moon-phase arch above the dial
    r(ctx, 26, 21, 12, 4, "#26385a");
    p(ctx, 30, 22, P.cream);
    p(ctx, 34, 23, P.cream);
    // Hands stopped at eleven: hour → 11, minute → 12
    line(ctx, cx, dy, cx - 3, dy - 5, "#140a06");
    line(ctx, cx, dy, cx, dy - 9, "#140a06");
    p(ctx, cx, dy, P.gold);
    // Subsidiary seconds/date window
    r(ctx, 30, 45, 4, 2, "#2a1a10");

    // Shattered hood glass: jagged shards left clinging to the frame
    const glass = "rgba(190,220,235,0.4)";
    const edge = "rgba(245,250,255,0.9)";
    const shard = (pts: [number, number][]) => {
        ctx.fillStyle = glass;
        for (let y = 20; y < 56; y++) {
            for (let x = 20; x < 44; x++) {
                if (insidePolygon(x + 0.5, y + 0.5, pts)) ctx.fillRect(x, y, 1, 1);
            }
        }
        for (let i = 0; i < pts.length; i++) {
            const [ax, ay] = pts[i];
            const [bx, by] = pts[(i + 1) % pts.length];
            line(ctx, ax, ay, bx, by, edge);
        }
    };
    shard([[20, 20], [29, 20], [22, 27], [20, 31]]);
    shard([[44, 20], [37, 20], [41, 24], [44, 29]]);
    shard([[20, 56], [20, 46], [24, 51], [27, 56]]);
    shard([[44, 56], [44, 49], [40, 53], [36, 56]]);
    // Bent hood door frame, hanging slightly open
    r(ctx, 19, 19, 1, 38, P.gold);
    hline(ctx, 19, 19, 26, P.gold);
    hline(ctx, 19, 56, 26, P.goldDark);
    vline(ctx, 44, 19, 38, P.goldDark);
}

function insidePolygon(x: number, y: number, pts: [number, number][]): boolean {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i];
        const [xj, yj] = pts[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
}

// ---------------------------------------------------------------------------
// Wine barrel (1x)
// ---------------------------------------------------------------------------

/** 64x64 @1x — cask on its side, head facing the viewer, on a timber cradle. */
export function drawWineBarrel(ctx: CanvasRenderingContext2D): void {
    const oak = { o: "#24160c", d: "#5a3a1e", m: "#7a5230", l: "#9a6a3e", h: "#b8844e" };
    const hoop = IRON;
    floorShadow(ctx, 8, 60, 48, 3);

    // Cradle
    for (const x of [12, 46]) {
        r(ctx, x, 46, 6, 14, oak.o);
        r(ctx, x + 1, 47, 4, 12, oak.d);
        vline(ctx, x + 1, 47, 12, oak.m);
    }
    r(ctx, 8, 56, 48, 4, oak.o);
    hline(ctx, 9, 57, 46, oak.d);

    // Barrel body (top of the cask receding behind the head)
    for (let y = 6; y <= 30; y++) {
        const t = (y - 6) / 24;
        const bulge = Math.round(Math.sin(t * Math.PI) * 3);
        r(ctx, 9 - bulge, y, 46 + bulge * 2, 1, oak.m);
        p(ctx, 9 - bulge, y, oak.o);
        p(ctx, 54 + bulge, y, oak.o);
        p(ctx, 10 - bulge, y, oak.l);
        p(ctx, 53 + bulge, y, oak.d);
    }
    hline(ctx, 10, 5, 44, oak.o);
    // Staves (vertical seams) on the top
    for (const x of [16, 23, 30, 37, 44, 50]) vline(ctx, x, 7, 23, oak.d);
    hline(ctx, 12, 8, 14, oak.h);
    // Hoops across the top
    for (const y of [10, 25]) {
        hline(ctx, 7, y, 50, hoop.o);
        hline(ctx, 7, y + 1, 50, hoop.m);
        hline(ctx, 8, y + 1, 10, hoop.l);
    }

    // Head (end grain) facing the viewer
    const hx = 32;
    const hy = 38;
    // Chime (stave ends) ring, then the recessed head
    ellipse(ctx, hx, hy, 23, 16, oak.o);
    ellipse(ctx, hx, hy, 22, 15, oak.l);
    ellipse(ctx, hx + 1, hy + 1, 21, 14, oak.d);
    ellipse(ctx, hx, hy, 19, 12.5, oak.o);
    ellipse(ctx, hx, hy, 18.5, 12, oak.m);
    // Head boards
    for (const x of [22, 29, 36, 43]) {
        for (let y = hy - 12; y <= hy + 12; y++) {
            const dy = (y - hy) / 12.5;
            const half = 19 * Math.sqrt(Math.max(0, 1 - dy * dy));
            if (Math.abs(x - hx) < half - 1) p(ctx, x, y, oak.d);
        }
    }
    // Lit upper-left of the head
    ellipse(ctx, hx - 5, hy - 5, 9, 4, oak.l);
    ellipse(ctx, hx - 3, hy - 3, 9, 4, oak.m);
    // Painted vintage mark + spigot
    r(ctx, 27, 33, 10, 1, "#d8ccb0");
    r(ctx, 27, 36, 10, 1, "#d8ccb0");
    r(ctx, 30, 48, 4, 3, oak.o);
    r(ctx, 31, 51, 2, 3, P.goldDark);
    p(ctx, 31, 51, P.gold);
}

// ---------------------------------------------------------------------------
// Cellar rack + broken clock glass (1x)
// ---------------------------------------------------------------------------

/** 96x64 @1x — oak wine rack against the cellar wall, bottle ends facing out. */
export function drawWineRack(ctx: CanvasRenderingContext2D): void {
    const oak = { o: "#1e120a", d: "#4a3018", m: "#6a4626", l: "#86603a", h: "#a07a4c" };
    floorShadow(ctx, 2, 61, 92, 3);
    // Frame
    r(ctx, 2, 4, 92, 58, oak.o);
    r(ctx, 3, 5, 90, 3, oak.m);
    hline(ctx, 3, 5, 90, oak.h);
    r(ctx, 3, 56, 90, 5, oak.m);
    hline(ctx, 3, 56, 90, oak.l);
    r(ctx, 3, 8, 3, 48, oak.l);
    r(ctx, 90, 8, 3, 48, oak.d);
    // Cubbies: 3 rows x 7 columns of bottles lying on their sides
    const rand = seeded(19);
    const cols = 7;
    const rows = 3;
    const cw = 12;
    const ch = 16;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = 6 + col * cw;
            const y = 8 + row * ch;
            r(ctx, x, y, cw, ch, "#0e0806");
            // Shelf + divider
            hline(ctx, x, y + ch - 1, cw, oak.d);
            vline(ctx, x + cw - 1, y, ch, oak.d);
            vline(ctx, x, y, ch, oak.m);
            // Bottle ends (2 per cubby): punt, glass ring, foil on alternate
            if (rand() < 0.12) continue;
            for (const [bx, by] of [[x + 3, y + 5], [x + 8, y + 10]] as const) {
                const foil = rand() < 0.5;
                discCrisp(ctx, bx, by, 2, "#1a3a24");
                p(ctx, bx - 1, by - 1, "#4a7a54");
                p(ctx, bx, by, foil ? P.wine : "#0a1a10");
            }
        }
    }
    // Dust + a chalked tally on the frame
    for (let i = 0; i < 8; i++) p(ctx, 8 + Math.floor(rand() * 80), 5 + Math.floor(rand() * 2), "#8a7a6a");
    for (let i = 0; i < 4; i++) vline(ctx, 80 + i * 2, 57, 3, "#c8c0b0");
    line(ctx, 79, 60, 87, 57, "#c8c0b0");
}

/** 96x64 @1x — shards of the clock's hood glass scattered on the floor. */
export function drawClockGlassShards(ctx: CanvasRenderingContext2D): void {
    const rand = seeded(23);
    const glass = "rgba(190,220,235,0.55)";
    const edge = "rgba(250,252,255,0.95)";
    const shadow = "rgba(0,0,0,0.22)";
    for (let i = 0; i < 16; i++) {
        const cx = 8 + rand() * 80;
        const cy = 18 + rand() * 32;
        const size = 2 + rand() * (i < 5 ? 6 : 3);
        const a = rand() * Math.PI * 2;
        const pts: [number, number][] = [0, 2.1, 4.0].map((o, k) => [
            Math.round(cx + Math.cos(a + o) * size * (k === 0 ? 1.4 : 1)),
            Math.round(cy + Math.sin(a + o) * size * 0.6)
        ]);
        // Drop shadow, fill, glinting edge
        ctx.fillStyle = shadow;
        for (let y = Math.floor(cy - size); y <= cy + size; y++) {
            for (let x = Math.floor(cx - size * 1.5); x <= cx + size * 1.5; x++) {
                if (insidePolygon(x + 0.5, y - 0.5, pts)) ctx.fillRect(x, y, 1, 1);
            }
        }
        ctx.fillStyle = glass;
        for (let y = Math.floor(cy - size); y <= cy + size; y++) {
            for (let x = Math.floor(cx - size * 1.5); x <= cx + size * 1.5; x++) {
                if (insidePolygon(x + 0.5, y + 0.5, pts)) ctx.fillRect(x, y, 1, 1);
            }
        }
        line(ctx, pts[0][0], pts[0][1], pts[1][0], pts[1][1], edge);
    }
    // A bent brass hinge from the hood door
    hline(ctx, 44, 30, 4, P.goldDark);
    p(ctx, 48, 29, P.gold);
}

// ---------------------------------------------------------------------------
// Grand piano (2x)
// ---------------------------------------------------------------------------

/** 80x48 @2x — lacquered grand piano, lid propped open, with its bench. */
export function drawGrandPiano(ctx: CanvasRenderingContext2D): void {
    const lac = { o: "#050406", d: "#121014", m: "#1e1a20", l: "#3a3440", h: "#8a8494" };
    const plate = { d: "#7a5a24", m: "#b8903a", l: "#d8b860" };
    // Case outline: straight spine/front, curved bentside to the tail
    const topEdge = (x: number) => (x <= 50 ? 14 : 14 + Math.round(((x - 50) / 26) ** 2 * 12));
    const frontEdge = (x: number) => (x <= 44 ? 36 : Math.round(36 - ((x - 44) / 32) * 6));
    const X0 = 4;
    const X1 = 76;

    floorShadow(ctx, 6, 44, 70, 3);

    // Legs (behind the case side) with brass casters
    for (const [x, top] of [[7, 36], [40, 36], [69, 31]] as const) {
        r(ctx, x, top, 3, 44 - top, lac.o);
        vline(ctx, x + 1, top, 44 - top - 1, lac.l);
        hline(ctx, x, 38, 3, lac.m);
        r(ctx, x, 44, 3, 1, P.goldDark);
    }

    // Case side (rim depth) below the top surface
    for (let x = X0; x <= X1; x++) {
        const yb = frontEdge(x);
        r(ctx, x, yb, 1, 5, lac.d);
        p(ctx, x, yb + 1, x % 9 < 4 ? lac.l : lac.m);
        p(ctx, x, yb + 4, lac.o);
    }
    vline(ctx, X0, 14, 27, lac.o);

    // Top surface: rim + interior (gold plate, strings)
    for (let x = X0; x <= X1; x++) {
        const yt = topEdge(x);
        const yb = frontEdge(x);
        if (yb <= yt) continue;
        r(ctx, x, yt, 1, yb - yt, lac.m);
        p(ctx, x, yt, lac.o);
        p(ctx, x, yb - 1, lac.o);
        if (x > X0 + 1 && x < X1 - 1 && yb - yt > 5) {
            r(ctx, x, yt + 2, 1, yb - yt - 4, plate.m);
        }
    }
    // Strings and plate holes
    for (let y = 17; y < 27; y += 2) {
        for (let x = 7; x < 74; x++) {
            if (y > topEdge(x) + 2 && y < frontEdge(x) - 9) p(ctx, x, y, plate.l);
        }
    }
    for (const [x, y] of [[22, 19], [34, 19], [48, 21], [58, 22], [66, 24]] as const) {
        discCrisp(ctx, x, y, 2, plate.d);
        p(ctx, x - 1, y - 1, lac.d);
    }
    // Dampers / hammer rail across the front of the strings
    r(ctx, 6, 25, 38, 2, lac.d);
    hline(ctx, 6, 25, 38, lac.l);

    // Music desk with sheet music
    r(ctx, 15, 21, 20, 6, lac.o);
    r(ctx, 16, 22, 18, 4, lac.m);
    r(ctx, 18, 21, 6, 4, P.cream);
    r(ctx, 25, 21, 6, 4, "#f2ece0");
    for (const y of [22, 23]) {
        hline(ctx, 19, y, 4, "#6a6460");
        hline(ctx, 26, y, 4, "#6a6460");
    }

    // Fallboard / name board + keyboard
    r(ctx, 4, 27, 41, 3, lac.o);
    hline(ctx, 5, 28, 39, lac.l);
    p(ctx, 24, 28, P.gold);
    r(ctx, 4, 30, 2, 6, lac.d);
    r(ctx, 43, 30, 2, 6, lac.d);
    r(ctx, 6, 30, 37, 5, "#f2ece0");
    hline(ctx, 6, 34, 37, "#c8c0b0");
    for (let x = 7; x < 43; x += 2) vline(ctx, x, 32, 2, "#c8c0b0");
    // Black keys in groups of 2 and 3
    const pattern = [1, 1, 0, 1, 1, 1, 0];
    for (let i = 0, x = 7; x < 42; i++, x += 2) {
        if (pattern[i % 7]) r(ctx, x, 30, 1, 2, lac.o);
    }

    // Lid propped open above the strings
    for (let y = 2; y < 15; y++) {
        const t = (y - 2) / 13;
        const left = Math.round(10 - t * 6);
        const right = Math.round(58 - t * 8);
        hline(ctx, left, y, right - left, lac.m);
        p(ctx, left, y, lac.o);
        p(ctx, right - 1, y, lac.l);
    }
    hline(ctx, 10, 2, 48, lac.h);
    line(ctx, 14, 4, 22, 12, lac.l);
    line(ctx, 30, 3, 36, 9, lac.l);
    // Lid prop
    line(ctx, 47, 18, 53, 4, lac.h);

    // Bench with a tufted seat
    r(ctx, 15, 38, 20, 4, lac.o);
    r(ctx, 16, 38, 18, 3, "#6a1c22");
    hline(ctx, 16, 38, 18, "#8a2c30");
    for (const x of [19, 25, 31]) p(ctx, x, 39, "#4a1016");
    r(ctx, 16, 42, 2, 4, lac.o);
    r(ctx, 32, 42, 2, 4, lac.o);
}
