/**
 * Formal garden pieces: clipped yew cones lining the avenue. Native 1x tile
 * detail (32px per tile), light from the upper left.
 */
import { p, r } from "./pixel";
import { ellipse, seeded } from "./furnitureKit";
import type { ProceduralSpriteDef } from "./types";

const YEW = { o: "#0e200e", d: "#1a3a1a", m: "#2a5428", l: "#3e6e36", h: "#5a8e4a" };

/** Clipped yew cone, 64x96 (2x3 tiles; footprint is the bottom 2x2). */
function drawTopiary(ctx: CanvasRenderingContext2D): void {
    const cx = 32;
    const base = 84;
    const top = 8;
    ellipse(ctx, cx + 3, base + 4, 20, 5, "rgba(0,0,0,0.3)");
    const rand = seeded(907);
    for (let y = top; y < base; y++) {
        const k = (y - top) / (base - top);
        // Slightly convex cone with a rounded tip
        const half = Math.max(1, Math.round(22 * Math.pow(k, 0.8)));
        for (let x = cx - half; x < cx + half; x++) {
            const u = (x - (cx - half)) / (half * 2); // 0 = left (lit) edge
            let c = u < 0.25 ? YEW.l : u < 0.6 ? YEW.m : u < 0.85 ? YEW.d : YEW.o;
            // Clipped foliage texture: small lit tufts and dark pockets
            const n = rand();
            if (n < 0.12 && u < 0.7) c = YEW.h;
            else if (n > 0.9) c = YEW.o;
            if (y > base - 4) c = YEW.d; // shade under the skirt
            p(ctx, x, y, c);
        }
    }
    // Spiral clipping band winding up the cone
    for (let i = 0; i < 120; i++) {
        const t = i / 120;
        const y = Math.round(base - 6 - t * (base - top - 10));
        const k = (y - top) / (base - top);
        const half = Math.round(22 * Math.pow(k, 0.8));
        const ang = t * Math.PI * 5;
        const front = Math.cos(ang);
        if (front < -0.1) continue;
        const x = Math.round(cx + Math.sin(ang) * (half - 1));
        p(ctx, x, y, YEW.o);
        p(ctx, x, y + 1, YEW.d);
    }
    // Tip highlight and short trunk
    p(ctx, cx - 1, top, YEW.h);
    r(ctx, cx - 2, base, 4, 3, "#4a3020");
}

function def(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): ProceduralSpriteDef {
    return { nativeWidth: w, nativeHeight: h, draw };
}

export const GARDEN_PROP_SPRITES: Record<string, ProceduralSpriteDef> = {
    topiary: def(64, 96, drawTopiary),
};
