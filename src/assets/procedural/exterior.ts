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

/** Pointed gothic window with mullion and warm lit glass. */
function drawGothicWindow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    lit = true
): void {
    r(ctx, x, y, w, h, P.black);
    r(ctx, x + 1, y + 1, w - 2, h - 2, P.outline);
    const glass = lit ? P.candle : P.waterDark;
    const glassHi = lit ? P.gold : P.water;
    r(ctx, x + 2, y + 3, w - 4, h - 5, glass);
    r(ctx, x + 3, y + 4, w - 6, 2, glassHi);
    r(ctx, x + Math.floor(w / 2) - 1, y + 3, 2, h - 5, P.outline);
    // Pointed arch
    const archW = Math.max(2, w - 6);
    const ax = x + 3;
    for (let i = 0; i < archW / 2; i++) {
        r(ctx, ax + i, y + 1, 1, 2, P.outline);
        r(ctx, ax + archW - 1 - i, y + 1, 1, 2, P.outline);
    }
    r(ctx, x + Math.floor(w / 2) - 1, y, 2, 2, P.outline);
}

/** Narrow tower with spire, battlements, and stacked windows. */
function drawGothicTower(
    ctx: CanvasRenderingContext2D,
    x: number,
    bodyTop: number,
    bodyH: number,
    bodyW: number
): void {
    const spireH = 28;
    const spireTop = bodyTop - spireH;
    const cx = x + Math.floor(bodyW / 2);

    // Spire — stepped gothic peak
    r(ctx, cx - 2, spireTop, 4, spireH, P.stone);
    r(ctx, cx - 4, spireTop + 6, 8, spireH - 6, P.stoneLight);
    r(ctx, cx - 6, spireTop + 14, 12, 8, P.stone);
    r(ctx, cx - 8, spireTop + 20, 16, 6, P.stoneLight);
    r(ctx, cx - 1, spireTop, 2, 8, P.stoneHi);
    r(ctx, cx - 3, spireTop + 2, 6, 2, P.goldDark);

    // Tower body — ashlar stone
    r(ctx, x, bodyTop, bodyW, bodyH, P.stone);
    r(ctx, x + 2, bodyTop + 2, bodyW - 4, bodyH - 4, P.stoneLight);
    r(ctx, x, bodyTop, 2, bodyH, P.shadow);
    r(ctx, x + bodyW - 2, bodyTop, 2, bodyH, P.stoneHi);

    // Battlements
    for (let i = 0; i < 4; i++) {
        r(ctx, x + 2 + i * 7, bodyTop - 4, 5, 4, P.stone);
        r(ctx, x + 3 + i * 7, bodyTop - 4, 3, 2, P.stoneLight);
    }

    // Three floors of narrow windows
    const winW = Math.max(8, bodyW - 8);
    const winX = x + 4;
    drawGothicWindow(ctx, winX, bodyTop + 10, winW, 14, true);
    drawGothicWindow(ctx, winX, bodyTop + 30, winW, 14, false);
    drawGothicWindow(ctx, winX, bodyTop + 50, winW, 14, true);
}

/** Brick chimney with stone cap. */
function drawChimney(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    r(ctx, x, y, w, h, P.brickDark);
    for (let row = 0; row < Math.floor(h / 5); row++) {
        for (let col = 0; col < Math.floor(w / 6); col++) {
            const ox = (row % 2) * 3;
            r(ctx, x + 1 + col * 6 + ox, y + 2 + row * 5, 5, 4, row % 2 ? P.brick : P.brickLight);
        }
    }
    r(ctx, x - 1, y, w + 2, 4, P.stone);
    r(ctx, x, y, w, 2, P.stoneLight);
    r(ctx, x + 1, y - 2, w - 2, 2, P.shadow);
}

/** Brick course texture on main facade. */
function drawBrickFacade(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    r(ctx, x, y, w, h, P.brickDark);
    r(ctx, x + 2, y + 2, w - 4, h - 4, P.brick);
    const rows = Math.floor((h - 8) / 8);
    const cols = Math.floor((w - 8) / 14);
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const ox = (col % 2) * 3;
            r(ctx, x + 4 + col * 14 + ox, y + 4 + row * 8, 12, 6, row % 2 ? P.brickLight : P.brick);
        }
    }
}

/** Full gothic manor facade (menu + courtyard backdrop). */
export function drawManorBuilding(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const sx = w / 200;
    const sy = h / 120;
    ctx.save();
    ctx.scale(sx, sy);

    // Night sky
    r(ctx, 0, 0, 200, 36, P.coatNavy);
    r(ctx, 0, 0, 200, 12, P.coatNavyLight);
    r(ctx, 0, 28, 200, 8, P.shadow);

    const bodyTop = 36;
    const bodyH = 72;
    const groundY = 108;

    // Side towers
    drawGothicTower(ctx, 6, bodyTop, bodyH, 30);
    drawGothicTower(ctx, 164, bodyTop, bodyH, 30);

    // Main central block
    drawBrickFacade(ctx, 38, bodyTop + 4, 124, bodyH - 4);

    // Stepped gable roof on center
    r(ctx, 30, 22, 140, 18, P.shadow);
    r(ctx, 38, 18, 124, 14, P.brickDark);
    r(ctx, 50, 14, 100, 10, P.outline);
    r(ctx, 62, 10, 76, 8, P.brickDark);
    r(ctx, 74, 6, 52, 6, P.shadow);
    r(ctx, 88, 2, 24, 6, P.outline);
    r(ctx, 94, 0, 12, 4, P.brickDark);

    // Roof ridge highlight
    r(ctx, 88, 8, 24, 2, P.brickLight);

    // Chimneys along the roofline
    drawChimney(ctx, 48, 8, 10, 22);
    drawChimney(ctx, 95, 4, 12, 26);
    drawChimney(ctx, 142, 8, 10, 22);

    // Third floor — attic windows under gable
    for (const wx of [58, 82, 106, 130]) {
        drawGothicWindow(ctx, wx, bodyTop + 6, 14, 16, wx === 82 || wx === 130);
    }

    // Second floor
    for (const wx of [46, 70, 94, 118, 142]) {
        drawGothicWindow(ctx, wx, bodyTop + 28, 16, 18, wx % 28 === 0);
    }

    // First floor (above ground storey)
    for (const wx of [46, 70, 94, 118, 142]) {
        drawGothicWindow(ctx, wx, bodyTop + 50, 16, 18, true);
    }

    // Grand entrance — arched double doors
    const doorX = 82;
    const doorY = bodyTop + 54;
    r(ctx, doorX - 6, doorY - 8, 52, 8, P.stone);
    r(ctx, doorX - 4, doorY - 10, 48, 4, P.stoneLight);
    r(ctx, doorX, doorY, 40, 30, P.woodDark);
    r(ctx, doorX + 4, doorY + 4, 14, 24, P.wood);
    r(ctx, doorX + 22, doorY + 4, 14, 24, P.wood);
    r(ctx, doorX + 10, doorY + 14, 4, 4, P.gold);
    r(ctx, doorX + 28, doorY + 14, 4, 4, P.gold);
    r(ctx, doorX + 2, doorY + 2, 36, 4, P.woodLight);
    // Stone steps
    r(ctx, doorX - 8, doorY + 30, 56, 4, P.stone);
    r(ctx, doorX - 6, doorY + 34, 52, 3, P.stoneLight);
    r(ctx, doorX - 4, doorY + 37, 48, 2, P.stoneHi);

    // Ground-floor flanking windows
    drawGothicWindow(ctx, 50, bodyTop + 54, 18, 20, true);
    drawGothicWindow(ctx, 132, bodyTop + 54, 18, 20, false);

    // Foundation / lawn
    r(ctx, 0, groundY, 200, 4, P.shadow);
    r(ctx, 0, groundY + 4, 200, 8, P.grassDark);
    r(ctx, 0, groundY + 6, 200, 6, P.grass);
    r(ctx, 0, groundY + 10, 200, 10, P.grassLight);

    ctx.restore();
}

function tile32(draw: (ctx: CanvasRenderingContext2D) => void): ProceduralSpriteDef {
    return { nativeWidth: 32, nativeHeight: 32, draw: (ctx: CanvasRenderingContext2D) => draw(ctx) };
}

/** Wood stair guardrail seen from above (landing banister). */
export function drawWoodBanisterRails(ctx: CanvasRenderingContext2D, x0: number, x1: number, y0 = 6): void {
    r(ctx, x0, y0, x1 - x0, 3, P.woodDark);
    r(ctx, x0, y0 + 1, x1 - x0, 1, P.woodHi);
    r(ctx, x0, y0 + 13, x1 - x0, 2, P.woodDark);
    r(ctx, x0, y0 + 14, x1 - x0, 1, P.wood);
    for (let x = x0 + 3; x < x1 - 2; x += 5) {
        r(ctx, x, y0 + 3, 2, 11, P.woodDark);
        r(ctx, x + 1, y0 + 4, 1, 9, P.woodLight);
    }
}

function drawWoodBanisterNewel(ctx: CanvasRenderingContext2D, x: number, y: number, h: number): void {
    r(ctx, x, y, 12, h, P.woodDark);
    r(ctx, x + 1, y, 10, h, P.wood);
    r(ctx, x + 1, y, 2, h, P.woodLight);
    r(ctx, x, y, 12, 4, P.woodHi);
    r(ctx, x + 2, y + 2, 8, 2, P.woodLight);
    r(ctx, x, h - 4, 12, 4, P.woodDark);
}

export const EXTERIOR_SPRITES: Record<string, ProceduralSpriteDef> = {
    fence: tile32((ctx) => {
        // Thin footing only — grass/gravel shows through the rest of the tile
        r(ctx, 0, 30, 32, 2, P.stone);
        r(ctx, 0, 30, 32, 1, P.stoneLight);
        drawIronFenceRails(ctx, 0, 32);
    }),

    fence_post: tile32((ctx) => {
        drawGatePost(ctx, 6, 0, 32);
        drawIronFenceRails(ctx, 14, 32);
    }),

    banister: tile32((ctx) => {
        r(ctx, 0, 26, 32, 6, P.atticWoodDark);
        r(ctx, 0, 27, 32, 2, P.atticWood);
        drawWoodBanisterRails(ctx, 0, 32);
    }),

    banister_post: tile32((ctx) => {
        drawWoodBanisterNewel(ctx, 4, 0, 32);
        drawWoodBanisterRails(ctx, 16, 32);
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
        draw(ctx, w = 200, h = 120) {
            drawManorBuilding(ctx, w, h);
        }
    },

    stable_building: {
        nativeWidth: 180,
        nativeHeight: 120,
        draw(ctx, w = 180, h = 120) {
            drawStableBuilding(ctx, w, h);
        }
    }
};

/**
 * West end of a timber stable — body runs east to the courtyard wall;
 * the east edge is cut so the rest is implied beyond.
 */
export function drawStableBuilding(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const sx = w / 180;
    const sy = h / 120;
    ctx.save();
    ctx.scale(sx, sy);

    // Foundation shadow — flush to east crop
    r(ctx, 2, 16, 178, 98, P.shadow);

    // Roof: west gable peak, ridge running east and cut off at the wall
    r(ctx, 6, 10, 174, 48, P.woodDark);
    r(ctx, 10, 14, 170, 40, P.wood);
    r(ctx, 8, 6, 28, 12, P.outline);
    r(ctx, 12, 2, 20, 10, P.woodDark);
    r(ctx, 16, 0, 12, 6, P.outline);
    r(ctx, 18, 2, 8, 2, P.woodHi);
    for (let x = 28; x < 180; x += 10) {
        r(ctx, x, 12, 2, 38, P.woodDark);
    }
    r(ctx, 30, 8, 150, 6, P.outline);
    r(ctx, 40, 4, 140, 6, P.woodDark);

    // Long south wall
    r(ctx, 6, 54, 174, 54, P.wood);
    r(ctx, 6, 54, 174, 4, P.woodHi);
    r(ctx, 6, 104, 174, 4, P.woodDark);
    for (let x = 14; x < 180; x += 10) {
        r(ctx, x, 58, 2, 46, P.woodDark);
    }

    // West gable loft window
    r(ctx, 14, 22, 14, 12, P.outline);
    r(ctx, 16, 24, 10, 8, P.black);
    r(ctx, 17, 25, 3, 6, P.candle);
    r(ctx, 20, 25, 2, 6, P.outline);

    // West wall window
    r(ctx, 12, 66, 14, 12, P.outline);
    r(ctx, 14, 68, 10, 8, P.black);
    r(ctx, 15, 69, 3, 6, P.candle);
    r(ctx, 18, 69, 2, 6, P.outline);

    // South door on the west end bay
    const doorX = 36;
    const doorY = 70;
    r(ctx, doorX - 4, doorY - 4, 40, 40, P.woodDark);
    r(ctx, doorX, doorY, 32, 34, P.black);
    r(ctx, doorX + 2, doorY + 2, 12, 30, P.woodDark);
    r(ctx, doorX + 18, doorY + 2, 12, 30, P.woodDark);
    r(ctx, doorX + 6, doorY + 16, 3, 3, P.gold);
    r(ctx, doorX + 22, doorY + 16, 3, 3, P.gold);
    r(ctx, doorX - 2, doorY + 34, 36, 4, P.sandDark);
    r(ctx, doorX, doorY + 36, 32, 2, P.sand);

    // Extra south windows along the run toward the east wall
    for (const wx of [90, 130]) {
        r(ctx, wx, 68, 16, 14, P.outline);
        r(ctx, wx + 2, 70, 12, 10, P.black);
        r(ctx, wx + 3, 71, 4, 8, P.candle);
        r(ctx, wx + 7, 71, 2, 8, P.outline);
    }

    ctx.restore();
}

/** Stone ashlar course for courtyard north manor wall (top-down tile). */
function drawManorWallTile(ctx: CanvasRenderingContext2D, variant: 0 | 1 | 2): void {
    r(ctx, 0, 26, 32, 6, P.shadow);
    r(ctx, 0, 28, 32, 4, P.stone);
    r(ctx, 0, 4, 32, 22, P.stone);
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            const ox = (row % 2) * 5;
            const bx = 1 + col * 10 + ox;
            const by = 6 + row * 6;
            const tone = (col + row + variant) % 2 === 0 ? P.stoneLight : P.stone;
            r(ctx, bx, by, 9, 5, tone);
            r(ctx, bx, by, 9, 1, P.stoneHi);
            r(ctx, bx, by + 4, 9, 1, P.shadow);
        }
    }
    r(ctx, 0, 0, 32, 5, P.shadow);
    r(ctx, 0, 2, 32, 2, P.stoneLight);
    if (variant === 1) {
        r(ctx, 11, 9, 10, 12, P.black);
        r(ctx, 12, 11, 8, 8, P.candle);
        r(ctx, 15, 11, 2, 8, P.outline);
        r(ctx, 12, 14, 8, 2, P.outline);
    } else if (variant === 2) {
        r(ctx, 4, 7, 6, 8, P.shadow);
        r(ctx, 5, 8, 4, 6, P.stoneLight);
        r(ctx, 22, 8, 6, 8, P.shadow);
        r(ctx, 23, 8, 4, 6, P.stoneLight);
    }
}

/** West perimeter fence — top-down oblique rail along the left edge; transparent elsewhere. */
function drawGateWallWestTile(ctx: CanvasRenderingContext2D, withPost: boolean): void {
    if (withPost) {
        r(ctx, 0, 0, 10, 32, P.stone);
        r(ctx, 0, 0, 4, 32, P.stoneLight);
        r(ctx, 8, 0, 2, 32, P.shadow);
        r(ctx, 1, 0, 7, 4, P.stoneHi);
        r(ctx, 2, 1, 5, 2, P.silver);
        r(ctx, 3, 0, 3, 2, P.silverDark);
        r(ctx, 0, 28, 10, 4, P.stone);
        r(ctx, 0, 28, 10, 1, P.stoneLight);
        return;
    }

    // Thin footing where the fence meets the ground
    r(ctx, 0, 30, 5, 2, P.stone);
    r(ctx, 0, 30, 5, 1, P.stoneLight);

    // Fence run: a mostly straight vertical line with a gentle twist every few tiles
    for (let y = 1; y < 30; y++) {
        const twist = (Math.floor(y / 7) % 2) as 0 | 1;
        const lineX = 2 + twist;

        // Primary rail — the dominant straight line
        r(ctx, lineX, y, 1, 1, P.silverDark);
        r(ctx, lineX + 1, y, 1, 1, P.silver);

        // Sparse pickets — dotted rhythm along the run
        if (y % 5 === 2) {
            r(ctx, lineX + 2, y, 1, 1, P.ironDark);
        }

        // Short horizontal ticks (fence depth seen from above at a slight tilt)
        if (y % 8 === 0) {
            r(ctx, lineX, y, 5, 1, P.silverDark);
            r(ctx, lineX + 1, y - 1, 4, 1, P.silver);
            r(ctx, lineX, y + 1, 3, 1, P.ironDark);
        }
    }

    // Top capping rail
    r(ctx, 1, 1, 6, 2, P.silverDark);
    r(ctx, 2, 1, 5, 1, P.silver);
    r(ctx, 2, 2, 4, 1, P.ironDark);
}

/** East perimeter fence — mirrored west gate strip along the right edge. */
function drawGateWallEastTile(ctx: CanvasRenderingContext2D, withPost: boolean): void {
    ctx.save();
    ctx.translate(32, 0);
    ctx.scale(-1, 1);
    drawGateWallWestTile(ctx, withPost);
    ctx.restore();
}

export const MANOR_WALL_SPRITES = ["wall_manor", "wall_manor_b", "wall_manor_c"] as const;

export const GATE_WEST_SPRITES = ["wall_gate_west", "wall_gate_west_post"] as const;
export const GATE_EAST_SPRITES = ["wall_gate_east", "wall_gate_east_post"] as const;

export function manorWallSpriteName(x: number, y: number): (typeof MANOR_WALL_SPRITES)[number] {
    return MANOR_WALL_SPRITES[(x * 17 + y * 31) % 3];
}

export function gateWestSpriteName(x: number, y: number): (typeof GATE_WEST_SPRITES)[number] {
    return y % 4 === 0 ? "wall_gate_west_post" : "wall_gate_west";
}

export function gateEastSpriteName(x: number, y: number): (typeof GATE_EAST_SPRITES)[number] {
    return y % 4 === 0 ? "wall_gate_east_post" : "wall_gate_east";
}

export const COURTYARD_WALL_SPRITES: Record<string, ProceduralSpriteDef> = {
    wall_manor: tile32((ctx) => drawManorWallTile(ctx, 0)),
    wall_manor_b: tile32((ctx) => drawManorWallTile(ctx, 1)),
    wall_manor_c: tile32((ctx) => drawManorWallTile(ctx, 2)),
    wall_gate_west: tile32((ctx) => drawGateWallWestTile(ctx, false)),
    wall_gate_west_post: tile32((ctx) => drawGateWallWestTile(ctx, true)),
    wall_gate_east: tile32((ctx) => drawGateWallEastTile(ctx, false)),
    wall_gate_east_post: tile32((ctx) => drawGateWallEastTile(ctx, true))
};
