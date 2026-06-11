import { P } from "./palette";
import { drawFountainStone } from "./fountain";
import { grid, r } from "./pixel";
import type { ProceduralSpriteDef } from "./types";

const leafC = {
    d: P.leafDark,
    l: P.leaf,
    L: P.leafLight
};

export const GARDEN_SPRITES: Record<string, ProceduralSpriteDef> = {
    fountain: {
        nativeWidth: 48,
        nativeHeight: 52,
        draw: drawFountainStone
    },

    tree: {
        nativeWidth: 48,
        nativeHeight: 64,
        draw(ctx) {
            // Trunk — tapered with bark variation
            r(ctx, 22, 44, 4, 20, P.woodDark);
            r(ctx, 20, 42, 8, 6, P.wood);
            r(ctx, 21, 48, 2, 12, P.woodLight);
            r(ctx, 25, 50, 1, 8, P.woodDark);

            // Lower canopy lobe (wide)
            grid(ctx, 0, 22, 2, [
                "......dddddd......",
                "....ddlllllldd....",
                "...dlllllllllld...",
                "..dlllllllllllld..",
                ".dlllllllllllllld.",
                ".dlllllllllllllld.",
                "..dlllllllllllld..",
                "...dlllllllllld...",
                "....ddlllllldd....",
                "......dddddd......"
            ], leafC);

            // Upper canopy lobe (offset for asymmetry)
            grid(ctx, 10, 2, 2, [
                "....dddddd......",
                "..ddlllllldd....",
                ".dlllllllllld.",
                "dlllllllllllld",
                "dlllllllllllld",
                ".dlllllllllld.",
                "..ddlllllldd....",
                "....dddddd......"
            ], leafC);

            // Side foliage puff
            grid(ctx, 0, 12, 2, [
                "..dddd..",
                "dlllld.",
                "dlllld.",
                "..dd...."
            ], leafC);

            // Sunlit highlights
            r(ctx, 16, 8, 4, 3, P.leafLight);
            r(ctx, 28, 18, 3, 3, P.leafLight);
            r(ctx, 10, 28, 3, 2, P.leafLight);
        }
    },

    bush: {
        nativeWidth: 32,
        nativeHeight: 24,
        draw(ctx) {
            // Irregular shrub mass — no hard rectangular blocks
            grid(ctx, 0, 2, 2, [
                "......dddddd......",
                "....ddlllllldd....",
                "...dlllllllllld...",
                "..dlllllllllllld..",
                ".dlllllllllllllld.",
                ".dlllllllllllllld.",
                "..dlllllllllllld..",
                "...dlllllllllld...",
                "....ddlllllldd....",
                "......dddddd......"
            ], leafC);

            // Secondary lobe for depth
            grid(ctx, 14, 0, 2, [
                "..dddd..",
                ".dlllld.",
                "dlllllld",
                ".dlllld.",
                "..dddd.."
            ], leafC);

            // Ground shadow / base
            r(ctx, 6, 18, 20, 4, P.leafDark);
            r(ctx, 10, 16, 12, 3, P.leaf);

            // Highlights
            r(ctx, 8, 6, 3, 2, P.leafLight);
            r(ctx, 20, 8, 2, 2, P.leafLight);
        }
    },

    pond_corner_flower: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            r(ctx, 0, 16, 32, 16, P.water);
            r(ctx, 0, 20, 32, 12, P.waterLight);
            r(ctx, 0, 0, 16, 20, P.grass);
            r(ctx, 4, 8, 4, 4, P.red);
            r(ctx, 10, 4, 4, 4, P.gold);
            r(ctx, 2, 12, 4, 4, P.grassLight);
        }
    },

    pond_corner_plain: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            r(ctx, 0, 16, 32, 16, P.water);
            r(ctx, 0, 20, 32, 12, P.waterLight);
            r(ctx, 0, 0, 18, 18, P.gravel);
            r(ctx, 2, 2, 14, 14, P.gravelLight);
        }
    },

    pond_corner_grass: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            r(ctx, 0, 16, 32, 16, P.water);
            r(ctx, 0, 0, 18, 20, P.grass);
            r(ctx, 2, 4, 8, 8, P.grassLight);
            r(ctx, 10, 8, 4, 4, P.grassHi);
        }
    },

    pond_corner_rock: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            r(ctx, 0, 16, 32, 16, P.water);
            r(ctx, 2, 4, 16, 14, P.stone);
            r(ctx, 4, 6, 12, 10, P.stoneLight);
            r(ctx, 6, 8, 6, 6, P.stoneHi);
        }
    },

    water_reeds: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            r(ctx, 0, 8, 32, 24, P.water);
            r(ctx, 0, 14, 32, 18, P.waterLight);
            for (let x = 4; x < 28; x += 6) {
                r(ctx, x, 0, 2, 16, P.grassDark);
                r(ctx, x + 1, 2, 2, 12, P.grass);
            }
        }
    },

    water_ripple: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            r(ctx, 0, 0, 32, 32, P.water);
            r(ctx, 4, 8, 24, 2, P.waterLight);
            r(ctx, 6, 16, 20, 2, P.waterLight);
            r(ctx, 8, 22, 16, 2, P.waterHi);
            r(ctx, 10, 12, 12, 2, P.waterDark);
        }
    },

    water_lily: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            r(ctx, 0, 8, 32, 24, P.water);
            r(ctx, 8, 12, 16, 10, P.grass);
            r(ctx, 10, 14, 12, 6, P.grassLight);
            r(ctx, 14, 10, 4, 6, P.gold);
        }
    }
};
