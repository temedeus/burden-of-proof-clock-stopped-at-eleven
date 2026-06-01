import { P } from "./palette";
import { r } from "./pixel";
import type { ProceduralSpriteDef } from "./types";

export const FURNITURE_SPRITES: Record<string, ProceduralSpriteDef> = {
    fireplace: {
        nativeWidth: 48,
        nativeHeight: 56,
        draw(ctx) {
            r(ctx, 4, 8, 40, 48, P.stone);
            r(ctx, 6, 10, 36, 44, P.stoneLight);
            r(ctx, 10, 20, 28, 28, P.black);
            r(ctx, 12, 28, 24, 16, P.fireRed);
            r(ctx, 14, 26, 20, 14, P.fireOrange);
            r(ctx, 16, 24, 16, 12, P.fireYellow);
            r(ctx, 0, 6, 48, 4, P.stoneHi);
            r(ctx, 2, 0, 44, 8, P.stoneHi);
        }
    },

    dining_table: {
        nativeWidth: 64,
        nativeHeight: 40,
        draw(ctx) {
            r(ctx, 2, 12, 60, 8, P.wood);
            r(ctx, 2, 12, 60, 3, P.woodLight);
            for (let x = 8; x < 56; x += 12) {
                r(ctx, x, 20, 4, 18, P.woodDark);
            }
            r(ctx, 20, 8, 24, 6, P.cream);
            r(ctx, 22, 10, 8, 4, P.gold);
            r(ctx, 34, 10, 8, 4, P.gold);
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
            r(ctx, 2, 4, 44, 24, P.carpetRed);
            r(ctx, 4, 6, 40, 20, P.carpetRedLight);
            for (let x = 8; x < 40; x += 8) {
                for (let y = 8; y < 24; y += 8) {
                    r(ctx, x, y, 4, 4, P.gold);
                }
            }
            r(ctx, 2, 4, 44, 2, P.goldDark);
        }
    }
};
