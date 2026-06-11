import { P } from "./palette";
import { r } from "./pixel";
import type { ProceduralSpriteDef } from "./types";

/** Water fill only — returns null (transparent) outside the pond so tile grass shows through. */
function pondWaterColor(
    x: number,
    y: number,
    cx: number,
    cy: number,
    rx: number,
    ry: number
): string | null {
    const dx = (x - cx) / rx;
    const dy = (y - cy) / ry;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const ripple =
        Math.sin(x * 0.62 + y * 0.18) * 0.07 +
        Math.cos(x * 0.28 - y * 0.41) * 0.06 +
        Math.sin((x + y) * 0.15) * 0.05 +
        Math.cos(x * 0.11 - y * 0.55) * 0.04;
    const d = dist + ripple;

    if (d < 0.52) return P.waterHi;
    if (d < 0.68) return P.waterLight;
    if (d < 0.86) return P.water;
    if (d < 1.0) return P.waterDark;
    return null;
}

export const POND_SPRITES: Record<string, ProceduralSpriteDef> = {
    pond: {
        nativeWidth: 80,
        nativeHeight: 100,
        draw(ctx) {
            const cx = 40;
            const cy = 52;
            const rx = 30;
            const ry = 34;

            for (let y = 0; y < 100; y++) {
                for (let x = 0; x < 80; x++) {
                    const color = pondWaterColor(x, y, cx, cy, rx, ry);
                    if (color) r(ctx, x, y, 1, 1, color);
                }
            }

            // Ripples on open water
            r(ctx, 22, 38, 18, 2, P.waterLight);
            r(ctx, 44, 50, 14, 2, P.water);
            r(ctx, 30, 62, 12, 2, P.waterLight);
            r(ctx, 48, 44, 10, 2, P.waterHi);

            // Lily pad (leaf tones — not lawn grass)
            r(ctx, 50, 42, 12, 8, P.leaf);
            r(ctx, 52, 40, 6, 6, P.leafLight);
            r(ctx, 56, 38, 4, 5, P.gold);

            // Rocks along the uneven shore
            r(ctx, 10, 72, 10, 7, P.stone);
            r(ctx, 12, 74, 6, 4, P.stoneLight);
            r(ctx, 58, 78, 12, 8, P.stone);
            r(ctx, 60, 80, 8, 5, P.stoneLight);
            r(ctx, 34, 18, 8, 5, P.stone);
            r(ctx, 36, 19, 4, 3, P.stoneHi);
        }
    }
};
