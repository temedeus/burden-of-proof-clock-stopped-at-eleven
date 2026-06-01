import { P } from "./palette";
import { r } from "./pixel";
import type { ProceduralSpriteDef } from "./types";

export const EXTERIOR_SPRITES: Record<string, ProceduralSpriteDef> = {
    manor_gate: {
        nativeWidth: 48,
        nativeHeight: 40,
        draw(ctx) {
            r(ctx, 4, 0, 6, 40, P.stone);
            r(ctx, 38, 0, 6, 40, P.stone);
            r(ctx, 4, 0, 40, 6, P.stoneLight);
            r(ctx, 14, 8, 20, 32, P.black);
            r(ctx, 16, 10, 16, 28, P.woodDark);
            r(ctx, 18, 12, 12, 24, P.wood);
            r(ctx, 28, 20, 4, 4, P.gold);
        }
    },

    manor_building: {
        nativeWidth: 200,
        nativeHeight: 120,
        draw(ctx) {
            // Sky band
            r(ctx, 0, 0, 200, 40, P.coatNavy);
            r(ctx, 0, 30, 200, 10, P.shadow);

            // Main facade
            r(ctx, 20, 40, 160, 70, P.brickDark);
            r(ctx, 24, 44, 152, 62, P.brick);
            for (let row = 0; row < 6; row++) {
                for (let col = 0; col < 8; col++) {
                    const ox = (col % 2) * 2;
                    r(ctx, 28 + col * 18 + ox, 48 + row * 10, 16, 8, row % 2 ? P.brickLight : P.brick);
                }
            }

            // Roof
            r(ctx, 10, 28, 180, 16, P.shadow);
            r(ctx, 16, 22, 168, 12, P.outline);
            r(ctx, 30, 16, 140, 10, P.brickDark);

            // Windows
            for (const wx of [44, 88, 132]) {
                r(ctx, wx, 56, 20, 24, P.black);
                r(ctx, wx + 2, 58, 16, 20, P.waterLight);
                r(ctx, wx + 4, 60, 4, 16, P.outline);
            }

            // Door
            r(ctx, 88, 78, 32, 32, P.woodDark);
            r(ctx, 92, 82, 24, 26, P.wood);
            r(ctx, 108, 92, 4, 4, P.gold);

            // Tower hints
            r(ctx, 24, 20, 24, 28, P.stone);
            r(ctx, 152, 20, 24, 28, P.stone);
            r(ctx, 26, 22, 20, 8, P.stoneLight);
            r(ctx, 154, 22, 20, 8, P.stoneLight);

            // Ground
            r(ctx, 0, 108, 200, 12, P.grassDark);
            r(ctx, 0, 110, 200, 10, P.grass);
        }
    }
};
