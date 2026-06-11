import { P } from "./palette";
import { grid, r } from "./pixel";
import type { ProceduralSpriteDef } from "./types";

/** Shared wrought-iron fence rails (top-down segment). */
export function drawIronFenceRails(ctx: CanvasRenderingContext2D, x0: number, x1: number, y0 = 8): void {
    r(ctx, x0, y0, x1 - x0, 2, P.silverDark);
    r(ctx, x0, y0, x1 - x0, 1, P.silver);
    r(ctx, x0, y0 + 8, x1 - x0, 2, P.silverDark);
    r(ctx, x0, y0 + 16, x1 - x0, 2, P.silverDark);
    for (let x = x0 + 4; x < x1 - 2; x += 6) {
        r(ctx, x, y0 + 2, 2, 18, P.silverDark);
        r(ctx, x, y0 + 2, 1, 18, P.silver);
    }
}

/** Iron bars between stone posts — used by gate and matching fence tiles. */
export function drawIronGatePanel(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
): void {
    r(ctx, x, y, w, 3, P.silverDark);
    r(ctx, x, y, w, 1, P.silver);
    r(ctx, x, y + 12, w, 2, P.silverDark);
    r(ctx, x, y + 24, w, 2, P.silverDark);
    r(ctx, x, y + h - 6, w, 3, P.silverDark);
    for (let bx = x + 4; bx < x + w - 4; bx += 6) {
        r(ctx, bx, y + 4, 2, h - 10, P.silverDark);
        r(ctx, bx, y + 4, 1, h - 10, P.silver);
    }
    grid(ctx, x + Math.floor(w / 2) - 8, y - 2, 2, [
        "...ss...",
        "..slls..",
        ".slllls.",
        "slllllls"
    ], { s: P.silverDark, l: P.silver });
    r(ctx, x + Math.floor(w / 2) - 4, y + Math.floor(h / 2), 8, 4, P.gold);
    r(ctx, x + Math.floor(w / 2) - 2, y + Math.floor(h / 2) + 2, 4, 2, P.goldDark);
}

/** Stone gate post (top-down). */
export function drawGatePost(ctx: CanvasRenderingContext2D, x: number, y: number, h: number): void {
    r(ctx, x, y, 16, h, P.stone);
    r(ctx, x, y, 16, 8, P.stoneLight);
    r(ctx, x - 2, y, 2, h, P.stoneHi);
    r(ctx, x + 4, y + 10, 4, h - 14, P.stoneLight);
    r(ctx, x + 6, y, 4, 4, P.silver);
}

/** Full manor / garden gate sprite (top-down). */
export function drawManorGate(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    drawGatePost(ctx, 2, 0, h);
    drawGatePost(ctx, w - 18, 0, h);

    const panelX = 18;
    const panelW = w - 36;
    const panelY = 10;
    const panelH = h - 24;

    drawIronGatePanel(ctx, panelX, panelY, panelW, panelH);

    r(ctx, 12, panelY + 16, 5, 6, P.goldDark);
    r(ctx, w - 18, panelY + 16, 5, 6, P.goldDark);

    r(ctx, 0, h - 6, w, 6, P.stone);
    r(ctx, panelX, h - 6, panelW, 2, P.stoneLight);

    // Path visible through gate opening
    r(ctx, panelX + 4, h - 14, panelW - 8, 12, P.gravel);
    r(ctx, panelX + 8, h - 12, panelW - 16, 8, P.gravelLight);
}

function tile32(draw: (ctx: CanvasRenderingContext2D) => void): ProceduralSpriteDef {
    return { nativeWidth: 32, nativeHeight: 32, draw: (ctx: CanvasRenderingContext2D) => draw(ctx) };
}

export const EXTERIOR_SPRITES: Record<string, ProceduralSpriteDef> = {
    fence: tile32((ctx) => {
        r(ctx, 0, 26, 32, 6, P.stone);
        r(ctx, 0, 26, 32, 2, P.stoneLight);
        drawIronFenceRails(ctx, 0, 32);
    }),

    fence_post: tile32((ctx) => {
        drawGatePost(ctx, 6, 0, 32);
        drawIronFenceRails(ctx, 14, 32);
    }),

    manor_gate: {
        nativeWidth: 96,
        nativeHeight: 64,
        draw(ctx, w = 96, h = 64) {
            drawManorGate(ctx, w, h);
        }
    },

    manor_building: {
        nativeWidth: 200,
        nativeHeight: 120,
        draw(ctx) {
            r(ctx, 0, 0, 200, 40, P.coatNavy);
            r(ctx, 0, 30, 200, 10, P.shadow);

            r(ctx, 20, 40, 160, 70, P.brickDark);
            r(ctx, 24, 44, 152, 62, P.brick);
            for (let row = 0; row < 6; row++) {
                for (let col = 0; col < 8; col++) {
                    const ox = (col % 2) * 2;
                    r(ctx, 28 + col * 18 + ox, 48 + row * 10, 16, 8, row % 2 ? P.brickLight : P.brick);
                }
            }

            r(ctx, 10, 28, 180, 16, P.shadow);
            r(ctx, 16, 22, 168, 12, P.outline);
            r(ctx, 30, 16, 140, 10, P.brickDark);

            for (const wx of [44, 88, 132]) {
                r(ctx, wx, 56, 20, 24, P.black);
                r(ctx, wx + 2, 58, 16, 20, P.waterLight);
                r(ctx, wx + 4, 60, 4, 16, P.outline);
            }

            r(ctx, 88, 78, 32, 32, P.woodDark);
            r(ctx, 92, 82, 24, 26, P.wood);
            r(ctx, 108, 92, 4, 4, P.gold);

            r(ctx, 24, 20, 24, 28, P.stone);
            r(ctx, 152, 20, 24, 28, P.stone);
            r(ctx, 26, 22, 20, 8, P.stoneLight);
            r(ctx, 154, 22, 20, 8, P.stoneLight);

            r(ctx, 0, 108, 200, 12, P.grassDark);
            r(ctx, 0, 110, 200, 10, P.grass);
        }
    }
};
