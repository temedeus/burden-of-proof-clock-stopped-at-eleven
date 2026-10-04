/**
 * Garden / courtyard pieces redrawn at uniform 2x scale (see furnitureKit.ts).
 */
import { P } from "./palette";
import { hline, p, r, shade, vline } from "./pixel";
import { ellipse, floorShadow, line, seeded, STONE, WOOD } from "./furnitureKit";

const LEAF = {
    deep: "#12280f",
    dark: P.leafDark,
    mid: P.leaf,
    light: P.leafLight,
    hi: "#7cc870"
};

/** Wobbly-edged blob (deterministic) for foliage masses. */
function blob(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, color: string, seed: number): void {
    const rand = seeded(seed);
    const wob: number[] = [];
    for (let i = 0; i < 16; i++) wob.push(0.86 + rand() * 0.22);
    ctx.fillStyle = color;
    for (let y = Math.floor(cy - ry * 1.1); y <= Math.ceil(cy + ry * 1.1); y++) {
        for (let x = Math.floor(cx - rx * 1.1); x <= Math.ceil(cx + rx * 1.1); x++) {
            const dx = (x + 0.5 - cx) / rx;
            const dy = (y + 0.5 - cy) / ry;
            const a = Math.atan2(dy, dx);
            const k = Math.floor(((a + Math.PI) / (Math.PI * 2)) * 16) % 16;
            if (dx * dx + dy * dy <= wob[k] * wob[k]) ctx.fillRect(x, y, 1, 1);
        }
    }
}

/** Scatter small leaf-cluster dabs over a lit region to break up flat fills. */
function leafTexture(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    color: string,
    count: number,
    seed: number
): void {
    const rand = seeded(seed);
    for (let i = 0; i < count; i++) {
        const a = rand() * Math.PI * 2;
        const d = Math.sqrt(rand());
        const x = Math.round(cx + Math.cos(a) * rx * d);
        const y = Math.round(cy + Math.sin(a) * ry * d);
        hline(ctx, x, y, 2, color);
        p(ctx, x, y - 1, color);
    }
}

/** 64x80 @2x — mature oak: trunk with root flare under a layered crown. */
export function drawOak(ctx: CanvasRenderingContext2D): void {
    // Ground shadow under the crown
    ellipse(ctx, 34, 72, 22, 5, "rgba(0,0,0,0.25)");
    // Trunk
    const bark = { o: "#2a1a0e", d: "#4a3018", m: "#6a4a2a", l: "#8a6440" };
    r(ctx, 27, 44, 10, 28, bark.o);
    r(ctx, 28, 44, 8, 28, bark.m);
    vline(ctx, 28, 44, 28, bark.l);
    vline(ctx, 29, 46, 22, bark.l);
    vline(ctx, 34, 44, 28, bark.d);
    vline(ctx, 35, 44, 28, bark.d);
    for (const [x, y, h] of [[31, 52, 6], [32, 61, 5], [30, 66, 3]] as const) vline(ctx, x, y, h, bark.d);
    // Root flare
    r(ctx, 23, 69, 18, 3, bark.o);
    r(ctx, 24, 69, 16, 2, bark.m);
    hline(ctx, 24, 69, 5, bark.l);
    p(ctx, 22, 71, bark.o);
    p(ctx, 41, 71, bark.o);
    // Branch stubs into the crown
    line(ctx, 30, 46, 24, 38, bark.m);
    line(ctx, 34, 46, 41, 37, bark.d);

    // Crown — dark core, mid lobes, lit top-left
    blob(ctx, 32, 30, 29, 22, LEAF.deep, 1);
    blob(ctx, 20, 30, 15, 13, LEAF.dark, 2);
    blob(ctx, 44, 31, 15, 13, LEAF.dark, 3);
    blob(ctx, 32, 20, 20, 15, LEAF.dark, 4);
    blob(ctx, 22, 25, 13, 11, LEAF.mid, 5);
    blob(ctx, 40, 24, 13, 11, LEAF.mid, 6);
    blob(ctx, 30, 15, 15, 11, LEAF.mid, 7);
    blob(ctx, 24, 15, 10, 8, LEAF.light, 8);
    blob(ctx, 38, 18, 8, 6, LEAF.light, 9);
    blob(ctx, 21, 11, 5, 4, LEAF.hi, 10);
    leafTexture(ctx, 32, 32, 24, 14, LEAF.deep, 26, 11);
    leafTexture(ctx, 28, 20, 16, 10, LEAF.light, 18, 12);
    leafTexture(ctx, 24, 13, 8, 5, LEAF.hi, 8, 13);
    // Underside shadow line where the crown meets the trunk
    hline(ctx, 22, 44, 20, LEAF.deep);
}

/** 32x32 @2x — rounded garden shrub. */
export function drawBush(ctx: CanvasRenderingContext2D): void {
    ellipse(ctx, 16, 28, 13, 3, "rgba(0,0,0,0.25)");
    blob(ctx, 16, 18, 14, 11, LEAF.deep, 21);
    blob(ctx, 12, 18, 9, 8, LEAF.dark, 22);
    blob(ctx, 21, 17, 9, 8, LEAF.dark, 23);
    blob(ctx, 14, 14, 9, 7, LEAF.mid, 24);
    blob(ctx, 21, 13, 6, 5, LEAF.mid, 25);
    blob(ctx, 12, 11, 5, 4, LEAF.light, 26);
    leafTexture(ctx, 16, 20, 11, 6, LEAF.deep, 10, 27);
    leafTexture(ctx, 14, 12, 7, 4, LEAF.light, 6, 28);
    p(ctx, 10, 9, LEAF.hi);
    p(ctx, 13, 8, LEAF.hi);
}

/** 48x80 @2x — garden pond with stone shore, lily pads and reeds. */
export function drawPond(ctx: CanvasRenderingContext2D): void {
    const cx = 24;
    const cy = 41;
    const rand = seeded(31);
    // Damp soil ring, then water depth bands
    blob(ctx, cx, cy, 22, 37, "#2a3a1c", 40);
    blob(ctx, cx, cy, 20, 35, P.waterDark, 41);
    blob(ctx, cx + 1, cy + 1, 16, 30, P.water, 42);
    blob(ctx, cx + 2, cy + 2, 11, 22, "#3a72a4", 43);
    // Sky reflection streaks
    for (let i = 0; i < 9; i++) {
        const y = 14 + Math.floor(rand() * 54);
        const x = cx - 8 + Math.floor(rand() * 14);
        hline(ctx, x, y, 3 + Math.floor(rand() * 5), P.waterLight);
    }
    hline(ctx, cx - 6, 20, 6, P.waterHi);
    hline(ctx, cx - 4, 21, 3, P.waterHi);
    // Shore stones
    const stones: [number, number, number][] = [
        [6, 14, 3], [4, 34, 4], [5, 58, 3], [12, 74, 4], [30, 76, 3], [40, 64, 4], [42, 40, 3], [38, 10, 4], [22, 4, 3]
    ];
    for (const [x, y, rr] of stones) {
        ellipse(ctx, x, y, rr, rr * 0.7, STONE.d);
        ellipse(ctx, x - 0.5, y - 0.5, rr - 1, rr * 0.5, STONE.l);
        p(ctx, x - 1, y - 1, STONE.h);
    }
    // Lily pads with one flower
    for (const [x, y] of [[30, 30], [16, 50], [28, 58]] as const) {
        ellipse(ctx, x, y, 3, 2, LEAF.mid);
        p(ctx, x, y, P.waterDark);
        p(ctx, x - 1, y - 1, LEAF.light);
    }
    p(ctx, 30, 29, "#e8a0b8");
    p(ctx, 31, 29, P.white);
    // Reeds on the near bank
    for (const x of [8, 10, 13, 36, 39]) {
        const h = 6 + ((x * 7) % 5);
        const base = x < 20 ? 70 : 68;
        vline(ctx, x, base - h, h, "#5a7a2a");
        p(ctx, x, base - h, "#6a4a24");
        p(ctx, x, base - h + 1, "#6a4a24");
    }
}

/**
 * 160x96 @2x — west end of the timber stable; the east edge is cut by the
 * courtyard wall. Door sits over the stable exit tile.
 */
export function drawStable(ctx: CanvasRenderingContext2D): void {
    const W = 160;
    const timber = { o: "#24160c", d: "#4a3018", m: "#6a4626", l: "#86603a", h: "#a07a4c" };
    const roof = { o: "#1a1210", d: "#2e2420", m: "#463832", l: "#5e4c44" };

    // Ground shadow
    r(ctx, 0, 90, W, 4, "rgba(0,0,0,0.28)");

    // Roof: ridge running east, west gable (hip) at the left
    r(ctx, 4, 6, W - 4, 34, roof.o);
    for (let y = 7; y < 39; y++) {
        const row = Math.floor((y - 7) / 4);
        const off = row % 2 === 0 ? 0 : 4;
        hline(ctx, 5, y, W - 5, y % 4 === 2 ? roof.d : roof.m);
        if (y % 4 === 3) {
            for (let x = 5 + off; x < W; x += 8) p(ctx, x, y, roof.o);
        }
    }
    hline(ctx, 5, 7, W - 5, roof.l);
    hline(ctx, 5, 39, W - 5, roof.o);
    // Gable end (west): triangular timber face under a barge board
    for (let y = 0; y < 22; y++) {
        const half = Math.floor(y * 0.9);
        r(ctx, 16 - half, 4 + y, half * 2 + 1, 1, timber.m);
        p(ctx, 16 - half, 4 + y, roof.o);
        p(ctx, 16 + half, 4 + y, roof.o);
    }
    line(ctx, 16, 2, 0, 24, roof.l);
    line(ctx, 16, 2, 34, 22, roof.l);
    for (let x = 6; x < 28; x += 4) vline(ctx, x, 14, 12, timber.d);
    // Hayloft door in the gable
    r(ctx, 11, 12, 10, 10, timber.o);
    r(ctx, 12, 13, 8, 9, timber.d);
    line(ctx, 12, 13, 19, 21, timber.l);
    line(ctx, 19, 13, 12, 21, timber.l);
    // Hay hook beam
    r(ctx, 14, 9, 4, 3, timber.o);
    vline(ctx, 16, 12, 3, P.silverDark);
    // Cupola on the ridge
    r(ctx, 60, 0, 12, 8, roof.o);
    r(ctx, 61, 2, 10, 6, timber.m);
    vline(ctx, 66, 2, 6, timber.o);
    hline(ctx, 59, 0, 14, roof.l);

    // Wall: board-and-batten
    r(ctx, 0, 40, W, 46, timber.o);
    r(ctx, 1, 41, W - 1, 44, timber.m);
    for (let x = 4; x < W; x += 6) {
        vline(ctx, x, 41, 44, timber.d);
        vline(ctx, x + 1, 41, 44, timber.l);
    }
    hline(ctx, 1, 41, W - 1, timber.h);
    hline(ctx, 1, 42, W - 1, timber.d);
    // Eave shadow on the wall
    hline(ctx, 1, 43, W - 1, "rgba(0,0,0,0.35)");
    // Stone footing
    r(ctx, 0, 85, W, 6, STONE.o);
    for (let x = 0; x < W; x += 7) {
        r(ctx, x + 1, 86, 5, 4, (x / 7) % 2 === 0 ? STONE.m : STONE.l);
    }

    // Windows (lit lantern glow inside)
    const window = (x: number, y: number) => {
        r(ctx, x - 1, y - 1, 12, 12, timber.o);
        r(ctx, x, y, 10, 10, "#1a1410");
        r(ctx, x + 1, y + 1, 4, 4, "#d8a850");
        r(ctx, x + 5, y + 5, 4, 4, "#a87830");
        vline(ctx, x + 5, y, 10, timber.d);
        hline(ctx, x, y + 5, 10, timber.d);
        hline(ctx, x - 1, y + 10, 12, timber.h);
    };
    window(2, 52);
    window(80, 52);
    window(112, 52);
    window(144, 52);

    // Double door over the stable exit (centre x ≈ 26)
    const dx = 15;
    const dy = 56;
    r(ctx, dx - 2, dy - 3, 26, 32, timber.o);
    hline(ctx, dx - 2, dy - 3, 26, timber.h);
    for (const ox of [0, 11]) {
        r(ctx, dx + ox, dy, 11, 29, timber.d);
        for (let x = dx + ox + 1; x < dx + ox + 11; x += 3) vline(ctx, x, dy, 29, timber.m);
        line(ctx, dx + ox, dy + 28, dx + ox + 10, dy + 1, timber.l);
        hline(ctx, dx + ox, dy + 13, 11, timber.o);
    }
    vline(ctx, dx + 11, dy, 29, timber.o);
    p(ctx, dx + 9, dy + 15, P.gold);
    p(ctx, dx + 13, dy + 15, P.gold);
    // Straw spill at the threshold
    r(ctx, dx - 1, 85, 24, 2, P.sand);
    for (const x of [dx + 2, dx + 8, dx + 15, dx + 20]) p(ctx, x, 84, shade(P.sand, 0.15));

    // Lantern on a bracket by the door
    hline(ctx, 42, 54, 4, WOOD.o);
    r(ctx, 44, 55, 3, 4, "#d8a850");
    p(ctx, 45, 56, P.fireYellow);
}
