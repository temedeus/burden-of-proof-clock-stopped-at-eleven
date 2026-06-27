import { P } from "./palette";
import { grid, r } from "./pixel";

const NATIVE_W = 48;
const NATIVE_H = 56;

/** Stone mantle + hearth (no fire). */
export function drawFireplaceStone(ctx: CanvasRenderingContext2D): void {
    r(ctx, 0, 0, 48, 10, P.stoneHi);
    r(ctx, 2, 8, 44, 6, P.stoneLight);
    r(ctx, 4, 12, 40, 38, P.stone);
    r(ctx, 6, 14, 36, 34, P.stoneLight);

    r(ctx, 10, 18, 28, 28, P.shadow);
    r(ctx, 12, 20, 24, 24, P.black);
    r(ctx, 14, 16, 20, 4, P.shadow);

    r(ctx, 14, 34, 20, 6, P.woodDark);
    r(ctx, 16, 32, 8, 4, P.wood);
    r(ctx, 26, 32, 8, 4, P.woodLight);

    r(ctx, 12, 40, 24, 2, P.stoneHi);
    r(ctx, 4, 48, 40, 8, P.stone);
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
    ctx.scale(dw / NATIVE_W, dh / NATIVE_H);
    drawFireplaceStone(ctx);
    drawAnimatedFire(ctx, animTime);
    ctx.restore();
    ctx.imageSmoothingEnabled = prev;
}
