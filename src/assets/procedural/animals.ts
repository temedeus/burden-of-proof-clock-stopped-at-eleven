import { P } from "./palette";
import { grid, r } from "./pixel";
import type { ProceduralSpriteDef } from "./types";

/** Top-down stall rails; horse is a side-profile illustration facing left. */
function drawStallFrame(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    r(ctx, 0, 0, w, 11, P.wood);
    r(ctx, 0, 0, w, 3, P.woodDark);
    r(ctx, 0, 7, w, 3, P.woodHi);

    r(ctx, 0, 9, 7, h - 14, P.woodDark);
    r(ctx, 2, 11, 4, h - 18, P.wood);
    r(ctx, w - 7, 9, 7, h - 14, P.woodDark);
    r(ctx, w - 6, 11, 4, h - 18, P.wood);

    r(ctx, 0, h - 9, w, 7, P.wood);
    r(ctx, 0, h - 9, w, 2, P.woodHi);
    r(ctx, 28, h - 11, 40, 2, P.gravel);
}

interface HorsePalette {
    coat: string;
    light: string;
    mid: string;
    dark: string;
    mane: string;
    blaze?: string;
    socks?: boolean;
}

function drawForeleg(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    pal: HorsePalette,
    near: boolean
): void {
    const c = near ? pal.dark : pal.mid;
    const hi = near ? pal.coat : pal.light;
    const w = near ? 5 : 4;

    r(ctx, x, y, w, 11, c);
    r(ctx, x + (near ? 1 : 0), y + 1, w - 1, 4, hi);
    r(ctx, x - (near ? 1 : 0), y + 10, w + 1, 12, c);
    r(ctx, x, y + 21, w, 5, c);
    if (pal.socks && near) {
        r(ctx, x, y + 21, w, 5, P.horseSock);
    }
    r(ctx, x - 1, y + 25, w + 2, 3, P.horseHoof);
    r(ctx, x, y + 25, w, 1, P.black);
}

function drawHindleg(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    pal: HorsePalette,
    near: boolean
): void {
    const c = near ? pal.dark : pal.mid;
    const hi = near ? pal.coat : pal.light;
    const w = near ? 5 : 4;

    r(ctx, x + 1, y, w, 9, c);
    r(ctx, x - (near ? 2 : 1), y + 7, w + 1, 8, c);
    r(ctx, x, y + 14, w, 11, c);
    r(ctx, x + (near ? 1 : 0), y + 15, w - 1, 4, hi);
    r(ctx, x, y + 24, w, 4, c);
    r(ctx, x - 1, y + 27, w + 2, 3, P.horseHoof);
    r(ctx, x, y + 27, w, 1, P.black);
}

/** Side-profile horse facing left — head west, tail east. */
function drawHorseSideProfile(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    pal: HorsePalette
): void {
    const { coat: c, light: l, mid: m, dark: d, mane: mn, blaze } = pal;

    // Far legs (behind body)
    drawHindleg(ctx, ox + 54, oy + 44, pal, false);
    drawForeleg(ctx, ox + 30, oy + 46, pal, false);

    // Tail
    r(ctx, ox + 66, oy + 10, 5, 16, mn);
    r(ctx, ox + 68, oy + 6, 4, 12, mn);
    r(ctx, ox + 70, oy + 2, 3, 10, mn);
    r(ctx, ox + 71, oy + 0, 2, 6, mn);

    // Hindquarters and croup
    r(ctx, ox + 48, oy + 14, 20, 24, c);
    r(ctx, ox + 50, oy + 16, 16, 18, l);
    r(ctx, ox + 48, oy + 34, 18, 6, d);
    r(ctx, ox + 62, oy + 14, 6, 10, d);

    // Barrel
    r(ctx, ox + 30, oy + 18, 22, 22, c);
    r(ctx, ox + 32, oy + 20, 18, 16, l);
    r(ctx, ox + 30, oy + 36, 20, 5, d);

    // Chest and shoulder
    r(ctx, ox + 20, oy + 22, 12, 20, c);
    r(ctx, ox + 22, oy + 24, 8, 14, l);
    r(ctx, ox + 20, oy + 38, 10, 4, d);

    // Withers
    r(ctx, ox + 28, oy + 16, 8, 5, c);
    r(ctx, ox + 30, oy + 14, 5, 3, l);

    // Neck
    r(ctx, ox + 10, oy + 16, 12, 26, c);
    r(ctx, ox + 12, oy + 18, 8, 20, l);
    r(ctx, ox + 8, oy + 20, 3, 18, d);

    // Mane
    r(ctx, ox + 14, oy + 6, 4, 14, mn);
    r(ctx, ox + 18, oy + 4, 4, 16, mn);
    r(ctx, ox + 22, oy + 8, 3, 12, mn);
    r(ctx, ox + 25, oy + 12, 3, 8, mn);

    // Head — fine 1px side profile (facing left)
    grid(
        ctx,
        ox,
        oy + 8,
        1,
        [
            ".......ee.......",
            "......cccc......",
            ".....ccccc......",
            "....ccccccc.....",
            "...ccccccccc....",
            "..cccccllcccc...",
            ".cccccccllcccc..",
            ".ccccccccccccc..",
            "cccccccweeewcccc",
            "ccccccwwwwwcccc.",
            "cccccmmmmmmmccc.",
            "ccccmmmmnnmmmcc.",
            "cccmmmmmmmmmmcc.",
            "ccmmmmmmmmmmmcc.",
            "cmmmmmmmmmmmmmc.",
            "mmmmmmmmmmmmmm..",
            "mmmmmmmmmmmmm...",
            "mmmmmmmmmmmm....",
            "mmmmmmmmmmm.....",
            "mmmmmmmmmm......",
            "mmmmmmmmm......."
        ],
        {
            c,
            l,
            e: P.black,
            w: blaze ?? P.white,
            m: P.horseMuzzle,
            n: P.horseNostril,
            ".": P.transparent
        }
    );

    // Ear (over paint)
    r(ctx, ox + 11, oy + 6, 3, 6, c);
    r(ctx, ox + 12, oy + 4, 2, 3, d);
    r(ctx, ox + 15, oy + 7, 3, 5, c);
    r(ctx, ox + 16, oy + 5, 2, 2, d);

    // Eye highlight
    r(ctx, ox + 17, oy + 16, 4, 3, P.horseEyeWhite);
    r(ctx, ox + 18, oy + 17, 2, 2, P.black);
    r(ctx, ox + 18, oy + 17, 1, 1, P.white);

    // Forehead blaze (bay / grey) — painted after base head
    if (pal.blaze && pal.blaze !== P.horseMuzzle) {
        r(ctx, ox + 13, oy + 12, 5, 8, pal.blaze);
        r(ctx, ox + 11, oy + 18, 7, 10, pal.blaze);
        r(ctx, ox + 9, oy + 24, 9, 8, pal.blaze);
        // Restore eye after blaze
        r(ctx, ox + 17, oy + 16, 4, 3, P.horseEyeWhite);
        r(ctx, ox + 18, oy + 17, 2, 2, P.black);
        r(ctx, ox + 18, oy + 17, 1, 1, P.white);
        r(ctx, ox + 14, oy + 22, 2, 2, P.horseNostril);
    }

    // Near legs (in front of body)
    drawHindleg(ctx, ox + 50, oy + 42, pal, true);
    drawForeleg(ctx, ox + 26, oy + 44, pal, true);

    // Back line and belly shading
    r(ctx, ox + 34, oy + 17, 30, 2, d);
    r(ctx, ox + 32, oy + 38, 24, 2, d);
}

function drawStableBooth(ctx: CanvasRenderingContext2D, horse: HorsePalette): void {
    drawStallFrame(ctx, 96, 128);
    r(ctx, 5, 94, 86, 28, P.straw);
    r(ctx, 7, 96, 82, 24, P.strawLight);
    for (let i = 0; i < 8; i++) {
        r(ctx, 10 + i * 10, 98 + (i % 3), 6, 2, P.straw);
    }
    drawHorseSideProfile(ctx, 6, 18, horse);
}

export const ANIMAL_SPRITES: Record<string, ProceduralSpriteDef> = {
    stable_booth: {
        nativeWidth: 96,
        nativeHeight: 128,
        draw(ctx) {
            drawStableBooth(ctx, {
                coat: P.horseCoat,
                light: P.horseCoatLight,
                mid: P.horseCoatMid,
                dark: P.horseCoatDark,
                mane: P.horseMane
            });
        }
    },

    stable_booth_bay: {
        nativeWidth: 96,
        nativeHeight: 128,
        draw(ctx) {
            drawStableBooth(ctx, {
                coat: P.horseBay,
                light: P.horseBayLight,
                mid: P.horseCoatMid,
                dark: P.horseCoatDark,
                mane: P.horseMane,
                blaze: P.cream,
                socks: true
            });
        }
    },

    stable_booth_gray: {
        nativeWidth: 96,
        nativeHeight: 128,
        draw(ctx) {
            drawStableBooth(ctx, {
                coat: P.horseGray,
                light: P.horseGrayLight,
                mid: P.horseGrayMid,
                dark: P.horseGrayDark,
                mane: P.horseManeLight,
                blaze: P.white
            });
        }
    }
};
