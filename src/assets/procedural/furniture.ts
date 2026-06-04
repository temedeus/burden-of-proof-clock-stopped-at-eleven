import { P } from "./palette";
import { grid, r } from "./pixel";
import { drawFireplaceStone } from "./fireplace";
import type { ProceduralSpriteDef } from "./types";

/** Single place setting: plate, cutlery, goblet, garnish */
function drawPlaceSetting(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    // Goblet
    r(ctx, cx + 2, cy - 4, 4, 3, P.wine);
    r(ctx, cx + 1, cy - 1, 6, 2, P.silver);
    r(ctx, cx + 2, cy + 1, 4, 2, P.silverDark);

    // Plate
    r(ctx, cx, cy + 4, 8, 6, P.silver);
    r(ctx, cx + 1, cy + 5, 6, 4, P.white);
    r(ctx, cx + 2, cy + 6, 4, 2, P.foodBrown);
    r(ctx, cx + 5, cy + 6, 2, 2, P.foodGreen);

    // Fork (left)
    r(ctx, cx - 3, cy + 5, 2, 6, P.silver);
    r(ctx, cx - 4, cy + 5, 1, 3, P.silverDark);
    r(ctx, cx - 3, cy + 4, 2, 1, P.silverDark);

    // Knife (right)
    r(ctx, cx + 9, cy + 5, 2, 6, P.silver);
    r(ctx, cx + 10, cy + 5, 1, 4, P.silverDark);
}

/** Center serving: roast, bowls, candles */
function drawCenterFeast(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    // Candles
    r(ctx, cx - 14, cy, 2, 8, P.cream);
    r(ctx, cx - 14, cy - 2, 2, 2, P.candle);
    r(ctx, cx + 12, cy, 2, 8, P.cream);
    r(ctx, cx + 12, cy - 2, 2, 2, P.candle);

    // Large platter
    r(ctx, cx - 12, cy + 6, 24, 10, P.silver);
    r(ctx, cx - 10, cy + 8, 20, 7, P.white);

    // Roast
    grid(ctx, cx - 6, cy + 9, 1, [
        "..bbbb..",
        ".bbbbbb.",
        "bbbbbbbb",
        ".bbbbbb.",
        "..bbbb.."
    ], { b: P.foodBrown });

    r(ctx, cx - 2, cy + 10, 4, 2, P.foodBrown);
    r(ctx, cx + 1, cy + 9, 2, 2, P.highlight);

    // Side bowls
    r(ctx, cx - 18, cy + 10, 6, 5, P.silver);
    r(ctx, cx - 17, cy + 11, 4, 3, P.foodGreen);
    r(ctx, cx + 12, cy + 10, 6, 5, P.silver);
    r(ctx, cx + 13, cy + 11, 4, 3, P.gold);
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
            const topY = 6;
            const topH = 26;
            const apronY = topY + topH;
            const legY = apronY + 5;

            // Chair backs (ends + mid hints)
            for (const cx of [2, 86]) {
                r(ctx, cx, 2, 8, 16, P.wood);
                r(ctx, cx + 1, 0, 6, 6, P.woodHi);
            }
            r(ctx, 44, 4, 8, 10, P.woodDark);

            // Thick tabletop block (wood frame)
            r(ctx, 0, topY, 96, topH, P.woodLight);
            r(ctx, 0, topY, 96, 4, P.woodHi);
            r(ctx, 0, topY + topH - 3, 96, 3, P.woodDark);

            // Tablecloth — deep band for food
            r(ctx, 3, topY + 3, 90, topH - 6, P.cream);
            r(ctx, 3, topY + 3, 90, 2, P.white);
            r(ctx, 3, topY + topH - 5, 90, 1, P.highlight);

            // Center feast on the inner row
            drawCenterFeast(ctx, 48, topY + 6);

            // Place settings on outer row (along long edges of the cloth)
            const settingY = topY + 14;
            for (const cx of [6, 20, 34, 58, 72, 84]) {
                drawPlaceSetting(ctx, cx, settingY);
            }

            // Bread rolls flanking the roast
            for (const cx of [40, 56]) {
                r(ctx, cx, topY + 20, 5, 4, P.foodBrown);
                r(ctx, cx + 1, topY + 19, 3, 2, P.highlight);
            }

            // Apron + legs
            r(ctx, 2, apronY, 92, 5, P.wood);
            r(ctx, 2, apronY, 92, 1, P.woodDark);
            for (const x of [8, 26, 44, 62, 80]) {
                r(ctx, x, legY, 6, 56 - legY, P.woodDark);
                r(ctx, x + 1, legY, 4, 3, P.wood);
            }
        }
    },

    kitchen_table: {
        nativeWidth: 64,
        nativeHeight: 40,
        draw(ctx) {
            r(ctx, 2, 14, 60, 6, P.woodLight);
            r(ctx, 2, 14, 60, 2, P.woodHi);
            r(ctx, 10, 20, 6, 16, P.wood);
            r(ctx, 48, 20, 6, 16, P.wood);
            r(ctx, 24, 6, 16, 10, P.stoneLight);
            r(ctx, 26, 8, 4, 4, P.fireOrange);
            r(ctx, 34, 8, 4, 4, P.waterLight);
        }
    },

    booze_table: {
        nativeWidth: 32,
        nativeHeight: 36,
        draw(ctx) {
            r(ctx, 2, 14, 28, 5, P.wood);
            r(ctx, 6, 19, 4, 14, P.woodDark);
            r(ctx, 22, 19, 4, 14, P.woodDark);
            r(ctx, 8, 4, 6, 12, P.water);
            r(ctx, 18, 6, 6, 10, P.gold);
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
            // Outer border — gold fringe, not wood-toned
            r(ctx, 1, 3, 46, 26, P.carpetBorder);
            r(ctx, 3, 5, 42, 22, P.carpetPlum);
            r(ctx, 5, 7, 38, 18, P.carpetPlumLight);

            // Central medallion (distinct from table rectangles)
            r(ctx, 14, 10, 20, 12, P.carpetPlum);
            r(ctx, 18, 12, 12, 8, P.carpetRedLight);
            r(ctx, 20, 14, 8, 4, P.gold);

            // Corner flourishes — small diamonds, not grid of squares
            const corner = (cx: number, cy: number) => {
                r(ctx, cx, cy, 4, 4, P.gold);
                r(ctx, cx + 1, cy + 1, 2, 2, P.carpetPlumLight);
            };
            corner(6, 8);
            corner(38, 8);
            corner(6, 20);
            corner(38, 20);

            // Inner border stitch
            r(ctx, 7, 6, 34, 1, P.goldDark);
            r(ctx, 7, 25, 34, 1, P.goldDark);
            r(ctx, 6, 7, 1, 18, P.goldDark);
            r(ctx, 41, 7, 1, 18, P.goldDark);
        }
    }
};
