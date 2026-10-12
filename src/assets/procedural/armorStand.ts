import { P } from "./palette";
import { discCrisp, grid, hline, p, r, vline } from "./pixel";
import { floorShadow, panel, WOOD } from "./furnitureKit";

/** Native size; drawn at 2x into the 2x3-tile box (same pixel density as characters). */
export const ARMOR_STAND_W = 32;
export const ARMOR_STAND_H = 48;

/**
 * Left half (x 0..15) of a suit of plate armour facing the viewer; mirrored for
 * the right half with one-step-darker shading (light from the upper left).
 */
const ARMOR_LEFT_HALF = [
    "................",
    "..............RR",
    ".............rRR",
    "............ooor",
    "...........ohhll",
    "...........ohlll",
    "...........olmmm",
    "...........okkkk",
    "...........olmmk",
    "...........olmml",
    "............odmm",
    "...........oddmd",
    "......ooooodmmdd",
    ".....ohhllodllhl",
    "....ohhlllodlllh",
    "....ohllmmodllhh",
    "....olmmmdodllhh",
    "....oddddoodllhh",
    ".....olmo.odllhh",
    ".....olmo.odllhh",
    ".....oddo.odlllh",
    ".....ohlo..odllh",
    ".....olmo..odllh",
    ".....olmo..oddmm",
    ".....oddo.ogggmg",
    "....ohlmo.olllld",
    "....olmmo.oddddd",
    ".....ooo..olllld",
    "..........oddddk",
    "..........olllok",
    "..........ohllok",
    "..........olmmok",
    "..........ohhhok",
    "..........olddok",
    "..........olmmok",
    "..........ohlmok",
    "..........olmmok",
    "..........olmmok",
    "..........oddmok",
    ".........olllmok",
    ".........oooooo."
];

/** Right half is a mirror, one step darker. */
const SHADE_RIGHT: Record<string, string> = { h: "l", l: "m", m: "d", R: "r" };

function armorRows(): string[] {
    return ARMOR_LEFT_HALF.map((left) => {
        const right = [...left]
            .reverse()
            .map((ch) => SHADE_RIGHT[ch] ?? ch)
            .join("");
        return left + right;
    });
}

const ARMOR_COLORS: Record<string, string> = {
    o: "#141618",
    d: "#3a4048",
    m: "#6a727c",
    l: "#9aa4ae",
    h: "#d0d8e0",
    k: "#08090a",
    g: P.gold,
    r: "#8a1c1c",
    R: "#c03a32"
};

function drawPlinth(ctx: CanvasRenderingContext2D): void {
    floorShadow(ctx, 4, 46, 24, 2);
    // Oak plinth
    panel(ctx, 6, 40, 20, 6, WOOD);
    hline(ctx, 7, 41, 18, WOOD.h);
}

function drawSuit(ctx: CanvasRenderingContext2D): void {
    grid(ctx, 0, 0, 1, armorRows(), ARMOR_COLORS);
    // Breastplate ridge and rivets
    vline(ctx, 15, 13, 9, ARMOR_COLORS.h);
    for (const [x, y] of [[6, 14], [25, 14], [12, 25], [19, 25]] as const) p(ctx, x, y, P.goldDark);
}

function drawHalberd(ctx: CanvasRenderingContext2D): void {
    // Halberd held at the right side: shaft, axe blade, spike and langets
    const sx = 28;
    vline(ctx, sx, 7, 38, WOOD.o);
    vline(ctx, sx + 1, 7, 38, WOOD.m);
    p(ctx, sx + 1, 20, WOOD.l);
    // Spear point
    vline(ctx, sx, 0, 3, ARMOR_COLORS.l);
    vline(ctx, sx + 1, 0, 3, ARMOR_COLORS.m);
    p(ctx, sx, 0, ARMOR_COLORS.h);
    // Axe blade (crescent) facing outward, back spike inward
    r(ctx, sx + 2, 3, 2, 6, ARMOR_COLORS.m);
    vline(ctx, sx + 3, 2, 8, ARMOR_COLORS.l);
    p(ctx, sx + 3, 2, ARMOR_COLORS.h);
    hline(ctx, sx - 2, 5, 2, ARMOR_COLORS.d);
    p(ctx, sx - 3, 5, ARMOR_COLORS.m);
    r(ctx, sx, 3, 2, 5, ARMOR_COLORS.d);
    // Gauntlet gripping the shaft
    r(ctx, sx - 1, 25, 3, 3, ARMOR_COLORS.m);
    p(ctx, sx - 1, 25, ARMOR_COLORS.l);
}

/** 32x48 @2x — suit of plate armour on a plinth, halberd at its side. */
export function drawArmorStand(ctx: CanvasRenderingContext2D): void {
    drawPlinth(ctx);
    drawSuit(ctx);
    drawHalberd(ctx);
    // Brass finial on the plinth corner
    discCrisp(ctx, 29, 44, 1, P.goldDark);
}

// ============================================================================
// Collapse easter egg — shake, then the suit falls apart into a heap
// ============================================================================

/** Seconds of rattling before pieces start to fall. */
export const ARMOR_SHAKE_END = 0.9;

interface ArmorPiece {
    layer: "suit" | "halberd";
    /** Source rect in native sprite pixels. */
    x: number;
    y: number;
    w: number;
    h: number;
    /** Resting centre (native px, may spill past the sprite box onto the floor). */
    restX: number;
    restY: number;
    /** Quarter turns while falling (+ clockwise). */
    turns: number;
    delay: number;
    flight: number;
    /** Peak hop height in native px. */
    arc: number;
}

/** Draw order back to front; source rects partition the suit so no pixel is drawn twice. */
const ARMOR_PIECES: ArmorPiece[] = [
    { layer: "halberd", x: 24, y: 0, w: 8, h: 46, restX: 52, restY: 50, turns: 1, delay: 0.1, flight: 0.55, arc: 2 },
    { layer: "suit", x: 9, y: 28, w: 7, h: 13, restX: 12, restY: 39, turns: 1, delay: 0.25, flight: 0.3, arc: 3 },
    { layer: "suit", x: 16, y: 28, w: 7, h: 13, restX: 22, restY: 40, turns: -1, delay: 0.3, flight: 0.3, arc: 3 },
    { layer: "suit", x: 10, y: 24, w: 12, h: 4, restX: 31, restY: 58, turns: 0, delay: 0.2, flight: 0.45, arc: 6 },
    { layer: "suit", x: 10, y: 12, w: 12, h: 12, restX: 18, restY: 50, turns: 0, delay: 0.15, flight: 0.45, arc: 5 },
    { layer: "suit", x: 3, y: 12, w: 7, h: 16, restX: 9, restY: 54, turns: -1, delay: 0.05, flight: 0.45, arc: 6 },
    { layer: "suit", x: 22, y: 12, w: 7, h: 16, restX: 58, restY: 56, turns: 1, delay: 0.1, flight: 0.5, arc: 8 },
    { layer: "suit", x: 9, y: 0, w: 14, h: 12, restX: 42, restY: 55, turns: 1, delay: 0, flight: 0.6, arc: 12 }
];

const BOUNCE_TIME = 0.15;

/** When the collapse has fully settled. */
export const ARMOR_COLLAPSE_DURATION =
    ARMOR_SHAKE_END + Math.max(...ARMOR_PIECES.map((pc) => pc.delay + pc.flight)) + BOUNCE_TIME + 0.2;

/** Seconds (from shake start) when each piece hits the floor — one clank each. */
export const ARMOR_LAND_TIMES = ARMOR_PIECES.map((pc) => ARMOR_SHAKE_END + pc.delay + pc.flight);

let layers: { plinth: HTMLCanvasElement; suit: HTMLCanvasElement; halberd: HTMLCanvasElement } | null = null;

function layer(draw: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
    const c = document.createElement("canvas");
    c.width = ARMOR_STAND_W;
    c.height = ARMOR_STAND_H;
    draw(c.getContext("2d")!);
    return c;
}

function getLayers() {
    layers ??= {
        plinth: layer((ctx) => {
            drawPlinth(ctx);
            discCrisp(ctx, 29, 44, 1, P.goldDark);
        }),
        suit: layer(drawSuit),
        halberd: layer(drawHalberd)
    };
    return layers;
}

/** Runtime draw of the shake + collapse at `t` seconds; past the end it is the settled heap. */
export function drawArmorCollapse(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    t: number
): void {
    const sx = w / ARMOR_STAND_W;
    const sy = h / ARMOR_STAND_H;
    const L = getLayers();
    const prevSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(L.plinth, x, y, w, h);

    // Rattle: the whole suit jitters harder and harder on its plinth
    const shaking = t < ARMOR_SHAKE_END;
    const jitter = shaking ? Math.round(Math.sin(t * 45) * (0.5 + (t / ARMOR_SHAKE_END) * 1.5)) : 0;

    for (const pc of ARMOR_PIECES) {
        const startX = pc.x + pc.w / 2 + jitter;
        const startY = pc.y + pc.h / 2;
        const u = Math.max(0, Math.min(1, (t - ARMOR_SHAKE_END - pc.delay) / pc.flight));
        const sinceLand = t - ARMOR_SHAKE_END - pc.delay - pc.flight;
        const bounce = sinceLand > 0 && sinceLand < BOUNCE_TIME ? Math.sin((sinceLand / BOUNCE_TIME) * Math.PI) * 2 : 0;
        const cx = startX + (pc.restX - startX) * u;
        const cy = startY + (pc.restY - startY) * u - pc.arc * 4 * u * (1 - u) - bounce;
        const angle = pc.turns * (Math.PI / 2) * u;
        ctx.save();
        ctx.translate(Math.round(x + cx * sx), Math.round(y + cy * sy));
        if (angle !== 0) ctx.rotate(angle);
        ctx.drawImage(
            L[pc.layer],
            pc.x,
            pc.y,
            pc.w,
            pc.h,
            Math.round((-pc.w / 2) * sx),
            Math.round((-pc.h / 2) * sy),
            pc.w * sx,
            pc.h * sy
        );
        ctx.restore();
    }
    ctx.imageSmoothingEnabled = prevSmoothing;
}

export { ARMOR_LEFT_HALF };
