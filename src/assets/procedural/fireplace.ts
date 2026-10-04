import { P } from "./palette";
import { discCrisp, grid, hline, p, r, vline } from "./pixel";
import { floorShadow, panel, seeded, STONE } from "./furnitureKit";

/** Native frame of the legacy flame art reused for the character-on-fire cutscene. */
const CHAR_FIRE_W = 48;
const CHAR_FIRE_H = 56;

/** Fireplace native size; drawn at 2x into its 6x7-tile box. */
export const FIREPLACE_W = 96;
export const FIREPLACE_H = 112;

const MARBLE = { o: "#4a443e", d: "#9a928a", m: "#c4bcb2", l: "#d8d2c8", h: "#ece8e0" };
const BRICK = "#4a2018";
const BRICK_LINE = "#2a120c";

/** Marble chimneypiece, gilt mirror, brick firebox, grate and hearth (no flames). */
export function drawFireplaceStone(ctx: CanvasRenderingContext2D): void {
    const W = FIREPLACE_W;
    const S = STONE;
    floorShadow(ctx, 2, 109, W - 4, 3);

    // Chimney breast (stone) rising into the wall
    panel(ctx, 10, 0, W - 20, 40, S);
    for (let y = 6; y < 38; y += 6) {
        const off = (y / 6) % 2 === 0 ? 0 : 7;
        hline(ctx, 11, y, W - 22, S.d);
        for (let x = 11 + off; x < W - 11; x += 14) vline(ctx, x, y - 5, 5, S.d);
    }
    // Gilt mirror over the mantel
    r(ctx, 30, 6, 36, 26, "#5a4418");
    r(ctx, 31, 7, 34, 24, P.gold);
    hline(ctx, 31, 7, 34, "#e8c860");
    r(ctx, 34, 10, 28, 18, "#3a4a56");
    r(ctx, 35, 11, 26, 16, "#4a5e6c");
    for (let i = 0; i < 6; i++) p(ctx, 38 + i, 12 + i, "#7a90a0");
    r(ctx, 45, 4, 6, 3, P.gold);

    // Mantel shelf
    r(ctx, 2, 38, W - 4, 7, MARBLE.o);
    r(ctx, 3, 39, W - 6, 4, MARBLE.l);
    hline(ctx, 3, 39, W - 6, MARBLE.h);
    hline(ctx, 3, 43, W - 6, MARBLE.d);
    // Candlesticks + vase on the mantel
    for (const x of [8, 86]) {
        r(ctx, x - 1, 35, 3, 3, P.goldDark);
        vline(ctx, x, 29, 6, P.cream);
        p(ctx, x, 28, P.fireYellow);
    }
    r(ctx, 70, 31, 5, 7, "#26385a");
    hline(ctx, 70, 31, 5, "#3a5078");
    p(ctx, 72, 30, "#2e4a2c");

    // Pilasters + frieze
    panel(ctx, 6, 45, 18, 54, MARBLE);
    panel(ctx, W - 24, 45, 18, 54, MARBLE);
    for (const x of [10, W - 20]) {
        vline(ctx, x, 49, 46, MARBLE.d);
        vline(ctx, x + 5, 49, 46, MARBLE.d);
        vline(ctx, x + 10, 49, 46, MARBLE.d);
    }
    panel(ctx, 24, 45, W - 48, 10, MARBLE);
    r(ctx, 44, 47, 8, 6, MARBLE.h);
    p(ctx, 47, 49, MARBLE.d);
    p(ctx, 48, 50, MARBLE.d);

    // Firebox: brick back wall, angled cheeks, soot
    const fx = 24;
    const fy = 55;
    const fw = W - 48;
    const fh = 42;
    r(ctx, fx, fy, fw, fh, "#120806");
    r(ctx, fx + 6, fy + 2, fw - 12, fh - 8, BRICK);
    for (let y = fy + 4; y < fy + fh - 6; y += 4) {
        hline(ctx, fx + 6, y, fw - 12, BRICK_LINE);
        const off = ((y - fy) / 4) % 2 === 0 ? 0 : 4;
        for (let x = fx + 6 + off; x < fx + fw - 6; x += 8) vline(ctx, x, y - 3, 3, BRICK_LINE);
    }
    for (let i = 0; i < fh - 6; i++) {
        const cheek = Math.max(0, 6 - Math.floor(i / 6));
        hline(ctx, fx, fy + i, cheek, "#2a1410");
        hline(ctx, fx + fw - cheek, fy + i, cheek, "#1e0e0a");
    }
    r(ctx, fx + 6, fy + 2, fw - 12, 6, "rgba(0,0,0,0.55)");

    // Iron grate with logs
    const gy = fy + fh - 10;
    r(ctx, fx + 8, gy + 4, fw - 16, 2, "#1a1a1e");
    for (let x = fx + 10; x < fx + fw - 10; x += 4) vline(ctx, x, gy, 6, "#2a2a30");
    for (const [x, w] of [[fx + 9, 14], [fx + 22, 16]] as const) {
        r(ctx, x, gy - 3, w, 4, "#3a2414");
        hline(ctx, x, gy - 3, w, "#5a3a20");
        p(ctx, x, gy - 2, "#8a6a40");
        p(ctx, x + w - 1, gy - 2, "#8a6a40");
    }
    // Andirons with brass finials
    for (const x of [fx + 6, fx + fw - 8]) {
        r(ctx, x, gy - 2, 2, 8, "#1a1a1e");
        discCrisp(ctx, x + 1, gy - 4, 1, P.gold);
        p(ctx, x, gy - 4, P.gold);
    }

    // Hearth slab + brass fender
    r(ctx, 2, 97, W - 4, 12, MARBLE.o);
    r(ctx, 3, 98, W - 6, 10, MARBLE.m);
    hline(ctx, 3, 98, W - 6, MARBLE.h);
    hline(ctx, 3, 107, W - 6, MARBLE.d);
    const rand = seeded(17);
    for (let i = 0; i < 10; i++) {
        p(ctx, 6 + Math.floor(rand() * (W - 12)), 100 + Math.floor(rand() * 6), MARBLE.d);
    }
    r(ctx, 20, 99, W - 40, 2, P.goldDark);
    hline(ctx, 20, 99, W - 40, P.gold);
    r(ctx, 20, 99, 2, 6, P.goldDark);
    r(ctx, W - 22, 99, 2, 6, P.goldDark);
}

/** Static (baked) fire for previews/editor. */
export function drawFireplaceStatic(ctx: CanvasRenderingContext2D): void {
    drawFireplaceStone(ctx);
    drawHearthFire(ctx, 0.4);
}

/** Crisp layered flame tongues over the logs (native fireplace pixels). */
function drawHearthFire(ctx: CanvasRenderingContext2D, t: number): void {
    const baseY = 84;
    // Ember bed glow
    r(ctx, 32, baseY, 32, 3, P.fireRed);
    hline(ctx, 34, baseY + 1, 28, P.fireOrange);
    ctx.fillStyle = "rgba(255,140,40,0.12)";
    ctx.fillRect(26, 60, 44, 26);

    const tongues = [
        { x: 36, w: 7, h: 18, ph: 0 },
        { x: 42, w: 9, h: 26, ph: 1.3 },
        { x: 50, w: 8, h: 22, ph: 2.1 },
        { x: 57, w: 6, h: 15, ph: 0.6 }
    ];
    for (const g of tongues) {
        const h = Math.round(g.h * (0.82 + 0.18 * Math.sin(t * 9 + g.ph)) + Math.sin(t * 23 + g.ph * 3));
        const sway = Math.round(Math.sin(t * 5 + g.ph) * 1.5);
        for (let i = 0; i < h; i++) {
            const k = i / h;
            const half = Math.max(0, Math.round((g.w / 2) * (1 - k * k)));
            const cx = g.x + Math.round(sway * k);
            const y = baseY - i;
            if (half <= 0) {
                p(ctx, cx, y, P.fireRed);
                continue;
            }
            hline(ctx, cx - half, y, half * 2, P.fireRed);
            if (half > 1) hline(ctx, cx - half + 1, y, half * 2 - 2, P.fireOrange);
            if (half > 2 && k < 0.7) hline(ctx, cx - half + 2, y, half * 2 - 4, P.fireYellow);
        }
    }
    // Sparks
    const seed = Math.floor(t * 12);
    for (let i = 0; i < 4; i++) {
        if ((seed + i * 3) % 4 !== 0) continue;
        const sx = 34 + ((seed * 7 + i * 11) % 28);
        const sy = 58 + ((seed * 5 + i * 9) % 18);
        p(ctx, sx, sy, P.fireYellow);
    }
}

function drawAnimatedFire(ctx: CanvasRenderingContext2D, t: number): void {
    const flicker = 0.88 + 0.12 * Math.sin(t * 11);
    const sway = Math.sin(t * 4.5) * 1.5;

    r(ctx, 13, 32, 22, 4, P.fireRed);

    const flames = [
        { x: 14, phase: 0, w: 4 },
        { x: 19, phase: 1.1, w: 5 },
        { x: 25, phase: 2.2, w: 4 },
        { x: 30, phase: 0.7, w: 3 }
    ];

    for (const f of flames) {
        const h = Math.floor((10 + Math.sin(t * 8 + f.phase) * 5) * flicker);
        const y = 34 - h;
        const x = f.x + Math.floor(sway * (f.phase > 1 ? -1 : 1));
        r(ctx, x, y, f.w, h, P.fireOrange);
        r(ctx, x + 1, y + 1, Math.max(1, f.w - 2), Math.max(2, h - 3), P.fireYellow);
    }

    const fireC = { y: P.fireYellow, o: P.fireOrange, r: P.fireRed, k: P.black };
    const frame = Math.floor(t * 6) % 4;
    const grids = [
        [
            "...ror...",
            "..roror..",
            ".roroyor.",
            "roroyoyor",
            ".oyoyoyo.",
            "..oyoyo.."
        ],
        [
            "...oro...",
            "..oyror..",
            ".oyoyor.",
            ".royoyor.",
            "..oyoyo..",
            "...oy..."
        ],
        [
            "...oyr...",
            "..roroy..",
            ".oyoyro.",
            "royoyor.",
            ".oyoyoy.",
            "..oyo.."
        ],
        [
            "...oro...",
            "..oyoy..",
            ".royoro.",
            "oroyoyr.",
            "..oyoy..",
            "...oy..."
        ]
    ];
    grid(ctx, 14 + Math.floor(sway), 20 + (frame % 2), 2, grids[frame], fireC);

    const sparkSeed = Math.floor(t * 14);
    for (let i = 0; i < 3; i++) {
        if ((sparkSeed + i * 3) % 5 !== 0) continue;
        const sx = 16 + ((sparkSeed * 7 + i * 11) % 14);
        const sy = 16 + ((sparkSeed * 5 + i * 9) % 12);
        r(ctx, sx, sy, 2, 2, P.fireYellow);
    }
}

/** Full fireplace with flickering fire (game runtime). */
export function drawFireplaceAnimated(
    ctx: CanvasRenderingContext2D,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
    animTime: number
): void {
    const prev = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    ctx.translate(dx, dy);
    ctx.scale(dw / FIREPLACE_W, dh / FIREPLACE_H);
    drawFireplaceStone(ctx);
    drawHearthFire(ctx, animTime);
    ctx.restore();
    ctx.imageSmoothingEnabled = prev;
}

/** Fireplace-style flames attached to a character (cutscene — Ytte on fire). */
export function drawCharacterFire(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    animTime: number
): void {
    const prev = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    const fw = width * 0.95;
    const fh = height * 0.85;
    ctx.save();
    ctx.translate(x + (width - fw) / 2, y + height * 0.15);
    ctx.scale(fw / CHAR_FIRE_W, fh / CHAR_FIRE_H);
    drawAnimatedFire(ctx, animTime * 1.15);
    ctx.restore();
    ctx.imageSmoothingEnabled = prev;
}
