import { P } from "./palette";
import { grid, r } from "./pixel";
import type { ProceduralSpriteDef } from "./types";

export interface HorsePalette {
    coat: string;
    light: string;
    mid: string;
    dark: string;
    mane: string;
    blaze?: string;
    socks?: boolean;
}

export const HORSE_PALETTES: Record<string, HorsePalette> = {
    stable_booth: {
        coat: P.horseCoat,
        light: P.horseCoatLight,
        mid: P.horseCoatMid,
        dark: P.horseCoatDark,
        mane: P.horseMane
    },
    stable_booth_bay: {
        coat: P.horseBay,
        light: P.horseBayLight,
        mid: P.horseCoatMid,
        dark: P.horseCoatDark,
        mane: P.horseMane,
        blaze: P.cream,
        socks: true
    },
    stable_booth_gray: {
        coat: P.horseGray,
        light: P.horseGrayLight,
        mid: P.horseGrayMid,
        dark: P.horseGrayDark,
        mane: P.horseManeLight,
        blaze: P.white
    }
};

const BOOTH_NATIVE_W = 96;
const BOOTH_NATIVE_H = 128;

/** Stable phase offset from tile position so each horse animates on its own schedule. */
export function horseAnimPhase(tileX: number, tileY: number): number {
    return (tileX * 2.17 + tileY * 3.71) % (Math.PI * 2);
}

export function getHorseAnimOffsets(
    animTime: number,
    phase: number
): { jumpY: number; tailX: number; tailY: number } {
    const jumpCycle = 3.8 + (Math.sin(phase * 1.7) + 1) * 1.4;
    const localT = (animTime + phase * 0.31) % jumpCycle;
    let jumpY = 0;
    const hopDuration = 0.42;
    if (localT < hopDuration) {
        jumpY = -Math.sin((localT / hopDuration) * Math.PI) * 5;
    }

    const tailPhase = animTime * 2.1 + phase;
    return {
        jumpY,
        tailX: Math.sin(tailPhase) * 4,
        tailY: Math.sin(tailPhase * 0.9 + 0.6) * 2
    };
}

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

function drawStrawFloor(ctx: CanvasRenderingContext2D): void {
    r(ctx, 5, 94, 86, 28, P.straw);
    r(ctx, 7, 96, 82, 24, P.strawLight);
    for (let i = 0; i < 8; i++) {
        r(ctx, 10 + i * 10, 98 + (i % 3), 6, 2, P.straw);
    }
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

function drawHorseTail(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    mane: string,
    tailX: number,
    tailY: number
): void {
    const tx = Math.round(tailX);
    const ty = Math.round(tailY);
    r(ctx, ox + 66 + tx, oy + 10 + ty, 5, 16, mane);
    r(ctx, ox + 68 + tx, oy + 6 + ty, 4, 12, mane);
    r(ctx, ox + 70 + tx, oy + 2 + ty, 3, 10, mane);
    r(ctx, ox + 71 + tx, oy + ty, 2, 6, mane);
}

/** Side-profile horse facing left — head west, tail east. */
function drawHorseSideProfile(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    pal: HorsePalette,
    anim: { jumpY: number; tailX: number; tailY: number }
): void {
    const { coat: c, light: l, dark: d, mane: mn, blaze } = pal;
    const hy = oy + Math.round(anim.jumpY);

    drawHindleg(ctx, ox + 54, hy + 44, pal, false);
    drawForeleg(ctx, ox + 30, hy + 46, pal, false);
    drawHorseTail(ctx, ox, hy, mn, anim.tailX, anim.tailY);

    r(ctx, ox + 48, hy + 14, 20, 24, c);
    r(ctx, ox + 50, hy + 16, 16, 18, l);
    r(ctx, ox + 48, hy + 34, 18, 6, d);
    r(ctx, ox + 62, hy + 14, 6, 10, d);

    r(ctx, ox + 30, hy + 18, 22, 22, c);
    r(ctx, ox + 32, hy + 20, 18, 16, l);
    r(ctx, ox + 30, hy + 36, 20, 5, d);

    r(ctx, ox + 20, hy + 22, 12, 20, c);
    r(ctx, ox + 22, hy + 24, 8, 14, l);
    r(ctx, ox + 20, hy + 38, 10, 4, d);

    r(ctx, ox + 28, hy + 16, 8, 5, c);
    r(ctx, ox + 30, hy + 14, 5, 3, l);

    r(ctx, ox + 10, hy + 16, 12, 26, c);
    r(ctx, ox + 12, hy + 18, 8, 20, l);
    r(ctx, ox + 8, hy + 20, 3, 18, d);

    r(ctx, ox + 14, hy + 6, 4, 14, mn);
    r(ctx, ox + 18, hy + 4, 4, 16, mn);
    r(ctx, ox + 22, hy + 8, 3, 12, mn);
    r(ctx, ox + 25, hy + 12, 3, 8, mn);

    grid(
        ctx,
        ox,
        hy + 8,
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
            l: pal.light,
            e: P.black,
            w: blaze ?? P.white,
            m: P.horseMuzzle,
            n: P.horseNostril,
            ".": P.transparent
        }
    );

    r(ctx, ox + 11, hy + 6, 3, 6, c);
    r(ctx, ox + 12, hy + 4, 2, 3, d);
    r(ctx, ox + 15, hy + 7, 3, 5, c);
    r(ctx, ox + 16, hy + 5, 2, 2, d);

    r(ctx, ox + 17, hy + 16, 4, 3, P.horseEyeWhite);
    r(ctx, ox + 18, hy + 17, 2, 2, P.black);
    r(ctx, ox + 18, hy + 17, 1, 1, P.white);

    if (pal.blaze && pal.blaze !== P.horseMuzzle) {
        r(ctx, ox + 13, hy + 12, 5, 8, pal.blaze);
        r(ctx, ox + 11, hy + 18, 7, 10, pal.blaze);
        r(ctx, ox + 9, hy + 24, 9, 8, pal.blaze);
        r(ctx, ox + 17, hy + 16, 4, 3, P.horseEyeWhite);
        r(ctx, ox + 18, hy + 17, 2, 2, P.black);
        r(ctx, ox + 18, hy + 17, 1, 1, P.white);
        r(ctx, ox + 14, hy + 22, 2, 2, P.horseNostril);
    }

    drawHindleg(ctx, ox + 50, hy + 42, pal, true);
    drawForeleg(ctx, ox + 26, hy + 44, pal, true);

    r(ctx, ox + 34, hy + 17, 30, 2, d);
    r(ctx, ox + 32, hy + 38, 24, 2, d);
}

function drawStableBoothContents(
    ctx: CanvasRenderingContext2D,
    horse: HorsePalette,
    animTime: number,
    phase: number
): void {
    drawStallFrame(ctx, BOOTH_NATIVE_W, BOOTH_NATIVE_H);
    drawStrawFloor(ctx);
    const offsets = getHorseAnimOffsets(animTime, phase);
    drawHorseSideProfile(ctx, 6, 18, horse, offsets);
}

export function drawStableBoothAnimated(
    ctx: CanvasRenderingContext2D,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
    animTime: number,
    phase: number,
    spriteName: string
): void {
    const horse = HORSE_PALETTES[spriteName];
    if (!horse) return;

    ctx.save();
    ctx.translate(dx, dy);
    ctx.scale(dw / BOOTH_NATIVE_W, dh / BOOTH_NATIVE_H);
    drawStableBoothContents(ctx, horse, animTime, phase);
    ctx.restore();
}

export const ANIMAL_SPRITES: Record<string, ProceduralSpriteDef> = {
    stable_booth: {
        nativeWidth: BOOTH_NATIVE_W,
        nativeHeight: BOOTH_NATIVE_H,
        draw(ctx) {
            drawStableBoothContents(ctx, HORSE_PALETTES.stable_booth, 0, 0);
        }
    },

    stable_booth_bay: {
        nativeWidth: BOOTH_NATIVE_W,
        nativeHeight: BOOTH_NATIVE_H,
        draw(ctx) {
            drawStableBoothContents(ctx, HORSE_PALETTES.stable_booth_bay, 0, 0);
        }
    },

    stable_booth_gray: {
        nativeWidth: BOOTH_NATIVE_W,
        nativeHeight: BOOTH_NATIVE_H,
        draw(ctx) {
            drawStableBoothContents(ctx, HORSE_PALETTES.stable_booth_gray, 0, 0);
        }
    }
};
