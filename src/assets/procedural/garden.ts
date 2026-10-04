import { P } from "./palette";
import { drawFountainStone, FOUNTAIN_H, FOUNTAIN_W } from "./fountain";
import { r } from "./pixel";
import { drawBush, drawOak } from "./furnitureOutdoor";
import type { ProceduralSpriteDef } from "./types";

export const GARDEN_SPRITES: Record<string, ProceduralSpriteDef> = {
    fountain: {
        nativeWidth: FOUNTAIN_W,
        nativeHeight: FOUNTAIN_H,
        draw: drawFountainStone
    },

    tree: {
        nativeWidth: 64,
        nativeHeight: 80,
        draw(ctx) {
            drawOak(ctx);
        }
    },

    bush: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            drawBush(ctx);
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
