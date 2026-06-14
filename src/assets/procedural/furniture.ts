import { P } from "./palette";
import { grid, r } from "./pixel";
import { drawFireplaceStone } from "./fireplace";
import type { ProceduralSpriteDef } from "./types";

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
            grid(ctx, 14, 24, 2, [
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
    }
};
