import { P } from "./palette";
import { r } from "./pixel";
import type { ProceduralSpriteDef } from "./types";

export const POND_SPRITES: Record<string, ProceduralSpriteDef> = {
    pond: {
        nativeWidth: 80,
        nativeHeight: 100,
        draw(ctx) {
            // Grass rim
            r(ctx, 4, 8, 72, 84, P.grass);
            r(ctx, 8, 4, 64, 8, P.grassLight);
            r(ctx, 8, 88, 64, 8, P.grassLight);
            r(ctx, 4, 12, 8, 76, P.grassDark);
            r(ctx, 68, 12, 8, 76, P.grassDark);

            // Water ellipse-ish
            r(ctx, 12, 16, 56, 68, P.waterDark);
            r(ctx, 16, 20, 48, 60, P.water);
            r(ctx, 20, 28, 40, 44, P.waterLight);
            r(ctx, 28, 36, 24, 24, P.waterHi);

            // Ripples
            r(ctx, 18, 40, 20, 2, P.water);
            r(ctx, 42, 52, 16, 2, P.waterLight);
            r(ctx, 30, 60, 12, 2, P.water);

            // Lily
            r(ctx, 48, 44, 12, 8, P.grass);
            r(ctx, 52, 42, 4, 6, P.gold);

            // Rocks
            r(ctx, 14, 72, 10, 8, P.stone);
            r(ctx, 56, 70, 12, 10, P.stoneLight);
        }
    }
};
