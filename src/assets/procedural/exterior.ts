import { P } from "./palette";
import { grid, r } from "./pixel";
import type { ProceduralSpriteDef } from "./types";

export const EXTERIOR_SPRITES: Record<string, ProceduralSpriteDef> = {
    manor_gate: {
        nativeWidth: 96,
        nativeHeight: 64,
        draw(ctx) {
            // Stone gate posts
            r(ctx, 2, 0, 16, 64, P.stone);
            r(ctx, 78, 0, 16, 64, P.stone);
            r(ctx, 2, 0, 16, 8, P.stoneLight);
            r(ctx, 78, 0, 16, 8, P.stoneLight);
            r(ctx, 0, 0, 2, 64, P.stoneHi);
            r(ctx, 94, 0, 2, 64, P.stoneHi);
            r(ctx, 4, 10, 4, 44, P.stoneLight);
            r(ctx, 88, 10, 4, 44, P.stoneLight);

            // Gravel path through the opening (top-down)
            r(ctx, 18, 50, 60, 14, P.gravel);
            r(ctx, 22, 52, 52, 10, P.gravelLight);

            // Stone threshold across the base
            r(ctx, 0, 58, 96, 6, P.stone);
            r(ctx, 18, 58, 60, 2, P.stoneLight);

            // Wrought-iron rails (horizontal, seen from above)
            r(ctx, 18, 10, 60, 3, P.silverDark);
            r(ctx, 18, 10, 60, 1, P.silver);
            r(ctx, 18, 22, 60, 2, P.silverDark);
            r(ctx, 18, 34, 60, 2, P.silverDark);
            r(ctx, 18, 44, 60, 3, P.silverDark);

            // Vertical bars between posts
            for (let x = 22; x <= 70; x += 6) {
                r(ctx, x, 12, 2, 36, P.silverDark);
                r(ctx, x, 12, 1, 36, P.silver);
            }

            // Decorative arch / finial along the top rail
            grid(ctx, 40, 4, 2, [
                "...ss...",
                "..slls..",
                ".slllls.",
                "slllllls"
            ], { s: P.silverDark, l: P.silver });

            // Hinges and latch hardware on the posts
            r(ctx, 14, 26, 5, 6, P.goldDark);
            r(ctx, 77, 26, 5, 6, P.goldDark);
            r(ctx, 44, 28, 8, 4, P.gold);
            r(ctx, 46, 30, 4, 2, P.goldDark);

            // Spear-point finials on post caps
            r(ctx, 8, 0, 4, 4, P.silver);
            r(ctx, 84, 0, 4, 4, P.silver);
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
