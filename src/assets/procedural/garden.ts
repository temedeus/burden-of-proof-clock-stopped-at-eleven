import { P } from "./palette";
import { drawFountainStone } from "./fountain";
import { grid, r } from "./pixel";
import type { ProceduralSpriteDef } from "./types";

const leafC = {
    d: P.leafDark,
    m: P.grassDark,
    l: P.leaf,
    L: P.leafLight,
    h: P.grassHi
};

/** Irregular edge noise so canopy blobs are not perfect ellipses. */
function canopyEdgeNoise(x: number, y: number): number {
    return (((x * 17) ^ (y * 31)) & 7) / 14;
}

/** Soft organic foliage blob for top-down tree crowns. */
function drawCanopyBlob(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    color: string,
    edgeWobble = 0.12
): void {
    const x0 = Math.floor(cx - rx);
    const x1 = Math.ceil(cx + rx);
    const y0 = Math.floor(cy - ry);
    const y1 = Math.ceil(cy + ry);
    for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
            const dx = (x - cx) / rx;
            const dy = (y - cy) / ry;
            const dist = dx * dx + dy * dy;
            if (dist <= 1 + canopyEdgeNoise(x, y) * edgeWobble) {
                r(ctx, x, y, 1, 1, color);
            }
        }
    }
}

/** Mature oak — top-down with layered crown, trunk flare, and ground shadow. */
function drawOakTree(ctx: CanvasRenderingContext2D): void {
    // Ground shadow beneath crown
    drawCanopyBlob(ctx, 24, 58, 17, 5, P.grassDark, 0.08);
    r(ctx, 14, 59, 20, 2, P.leafDark);

    // Deep interior shadow
    drawCanopyBlob(ctx, 24, 30, 13, 11, P.leafDark, 0.1);
    drawCanopyBlob(ctx, 20, 34, 9, 8, P.grassDark, 0.14);

    // Main crown mass — offset lobes for natural asymmetry
    drawCanopyBlob(ctx, 24, 26, 18, 15, P.leaf, 0.16);
    drawCanopyBlob(ctx, 16, 30, 11, 10, P.leaf, 0.18);
    drawCanopyBlob(ctx, 32, 28, 10, 11, P.leaf, 0.18);
    drawCanopyBlob(ctx, 24, 16, 12, 9, P.leaf, 0.15);
    drawCanopyBlob(ctx, 12, 22, 8, 7, P.leafDark, 0.12);
    drawCanopyBlob(ctx, 36, 24, 7, 8, P.leafDark, 0.12);

    // Mid-tone leaf clusters
    drawCanopyBlob(ctx, 22, 24, 10, 8, P.leafLight, 0.14);
    drawCanopyBlob(ctx, 30, 30, 9, 7, P.leafLight, 0.14);
    drawCanopyBlob(ctx, 18, 18, 7, 6, P.leafLight, 0.12);

    // Sunlit highlights (upper-left)
    drawCanopyBlob(ctx, 14, 14, 6, 5, P.leafLight, 0.1);
    drawCanopyBlob(ctx, 20, 10, 5, 4, P.grassHi, 0.08);
    drawCanopyBlob(ctx, 30, 16, 5, 4, P.leafLight, 0.1);
    r(ctx, 12, 12, 2, 2, P.grassHi);
    r(ctx, 18, 8, 2, 2, P.grassHi);
    r(ctx, 28, 14, 2, 2, P.grassHi);
    r(ctx, 34, 20, 2, 1, P.leafLight);

    // Trunk — tapered with root flare and bark grain
    r(ctx, 19, 46, 10, 4, P.woodDark);
    r(ctx, 20, 42, 8, 18, P.wood);
    r(ctx, 21, 44, 6, 16, P.woodLight);
    r(ctx, 22, 46, 2, 12, P.woodHi);
    r(ctx, 25, 48, 1, 10, P.woodDark);
    r(ctx, 23, 50, 2, 8, P.woodDark);
    r(ctx, 18, 58, 4, 2, P.woodDark);
    r(ctx, 26, 58, 4, 2, P.woodDark);
    r(ctx, 20, 60, 8, 2, P.wood);
    // Bark knots and fissures
    r(ctx, 24, 48, 1, 4, P.woodDark);
    r(ctx, 21, 54, 2, 2, P.woodDark);
    r(ctx, 27, 52, 1, 3, P.woodDark);
    r(ctx, 22, 42, 3, 2, P.woodHi);
}

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
            drawOakTree(ctx);
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
