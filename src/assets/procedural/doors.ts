/**
 * Doors drawn at 1x into the exact exit opening (no stretching).
 *
 * - North-wall exits show a closed door set in a casing on the wall face.
 * - South and side exits are seen from above (wall tops), so they show an open
 *   doorway: jambs, threshold and a shadowed passage beyond.
 *
 * The wall around the door is filled in by the caller (copied from the
 * neighbouring wall) so doors sit in whatever wall the room uses.
 */
import { P } from "./palette";
import type { ProceduralSpriteDef } from "./types";
import { discCrisp, hline, p, r, shade, vline } from "./pixel";
import { ellipse, line, MAHOGANY, panel, STONE, WOOD, type Ramp } from "./furnitureKit";

export type DoorStyle = "door" | "door_wood" | "door_manor" | "door_glass" | "door_castle";

const OAK: Ramp = { o: "#24160c", d: "#5a3a1e", m: "#7a5230", l: "#9a6a3e", h: "#b8844e" };
const PAINT: Ramp = { o: "#5a5048", d: "#a89c8c", m: "#d4cabc", l: "#e8e0d4", h: "#f6f2ea" };
const GLASS = { d: "#3a4a58", m: "#5a6e80", l: "#8aa0b0", h: "#c8dce6" };
const BRASS = { d: P.goldDark, m: P.gold, h: "#ecd27a" };

/** Casing/trim ramp per style. */
function casingRamp(style: DoorStyle): Ramp {
    switch (style) {
        case "door_manor":
            return MAHOGANY;
        case "door_glass":
            return PAINT;
        case "door_castle":
            return STONE;
        default:
            return WOOD;
    }
}

// ---------------------------------------------------------------------------
// Door leaves (front view)
// ---------------------------------------------------------------------------

/** Four-panel oak leaf with a brass knob on `knobSide`. */
function panelLeaf(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    ramp: Ramp,
    knobSide: "left" | "right",
    gilt = false
): void {
    r(ctx, x, y, w, h, ramp.o);
    r(ctx, x + 1, y + 1, w - 2, h - 1, ramp.m);
    vline(ctx, x + 1, y + 1, h - 2, ramp.l);
    vline(ctx, x + w - 2, y + 1, h - 2, ramp.d);
    // Two columns of raised panels: short top pair, tall bottom pair
    const px = x + 3;
    const pw = Math.floor((w - 8) / 2);
    const topH = Math.max(4, Math.floor((h - 10) * 0.36));
    const botH = h - 10 - topH;
    for (const col of [0, 1]) {
        const cx = px + col * (pw + 2);
        for (const [py, ph] of [[y + 3, topH], [y + 6 + topH, botH]] as const) {
            r(ctx, cx, py, pw, ph, ramp.d);
            r(ctx, cx + 1, py + 1, pw - 2, ph - 2, ramp.l);
            hline(ctx, cx + 1, py + 1, pw - 2, ramp.h);
            vline(ctx, cx + pw - 2, py + 2, ph - 3, ramp.m);
            if (gilt) {
                hline(ctx, cx, py, pw, BRASS.d);
                hline(ctx, cx, py + ph - 1, pw, BRASS.d);
            }
        }
    }
    // Knob + escutcheon at lock-rail height
    const ky = y + 6 + topH - 2;
    const kx = knobSide === "right" ? x + w - 4 : x + 2;
    r(ctx, kx, ky - 1, 2, 4, BRASS.d);
    p(ctx, kx, ky, BRASS.h);
    p(ctx, kx + (knobSide === "right" ? 0 : 1), ky + 2, ramp.o);
}

/** Glazed French-door leaf: painted frame, 2x3 panes, solid kick panel. */
function glassLeaf(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, handleSide: "left" | "right"): void {
    r(ctx, x, y, w, h, PAINT.o);
    r(ctx, x + 1, y + 1, w - 2, h - 1, PAINT.l);
    const kick = Math.max(5, Math.floor(h * 0.18));
    const gx = x + 3;
    const gw = w - 6;
    const gy = y + 3;
    const gh = h - kick - 5;
    r(ctx, gx, gy, gw, gh, GLASS.d);
    // Reflection gradient: sky at the top, room reflection lower down
    r(ctx, gx, gy, gw, Math.floor(gh / 2), GLASS.m);
    for (let i = 0; i < Math.min(gw, gh) - 2; i++) p(ctx, gx + 1 + i, gy + gh - 3 - i, GLASS.l);
    for (let i = 0; i < 4; i++) p(ctx, gx + 2 + i, gy + 1 + i, GLASS.h);
    // Glazing bars
    const midX = gx + Math.floor(gw / 2);
    vline(ctx, midX, gy, gh, PAINT.m);
    for (const k of [1, 2]) hline(ctx, gx, gy + Math.round((gh * k) / 3), gw, PAINT.m);
    // Kick panel
    const ky = gy + gh + 1;
    r(ctx, gx, ky, gw, kick, PAINT.d);
    r(ctx, gx + 1, ky + 1, gw - 2, kick - 2, PAINT.m);
    hline(ctx, gx + 1, ky + 1, gw - 2, PAINT.h);
    // Handle
    const hx = handleSide === "right" ? x + w - 3 : x + 1;
    r(ctx, hx, gy + Math.floor(gh * 0.6), 2, 3, P.silverDark);
    p(ctx, hx, gy + Math.floor(gh * 0.6), P.silver);
}

/** Iron-strapped plank leaf for the castle entrance. */
function strappedLeaf(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, ringSide: "left" | "right"): void {
    r(ctx, x, y, w, h, OAK.o);
    r(ctx, x + 1, y + 1, w - 2, h - 1, OAK.m);
    for (let px = x + 4; px < x + w - 1; px += 4) vline(ctx, px, y + 1, h - 1, OAK.d);
    vline(ctx, x + 1, y + 1, h - 1, OAK.l);
    for (const sy of [y + Math.floor(h * 0.25), y + Math.floor(h * 0.7)]) {
        r(ctx, x, sy, w, 3, "#1e2024");
        hline(ctx, x, sy, w, "#4a5056");
        for (let sx = x + 2; sx < x + w - 1; sx += 4) p(ctx, sx, sy + 1, P.silverDark);
    }
    // Ring pull
    const rx = ringSide === "right" ? x + w - 6 : x + 5;
    const ry = y + Math.floor(h * 0.5);
    discCrisp(ctx, rx, ry, 2, "#2a2e32");
    p(ctx, rx, ry, OAK.m);
    p(ctx, rx - 1, ry - 2, "#7e888e");
}

/** Board-and-brace stable leaf. */
function plankLeaf(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    r(ctx, x, y, w, h, OAK.o);
    r(ctx, x + 1, y + 1, w - 2, h - 1, OAK.l);
    for (let px = x + 4; px < x + w - 1; px += 5) vline(ctx, px, y + 1, h - 1, OAK.d);
    for (const by of [y + 3, y + h - 6]) {
        r(ctx, x + 1, by, w - 2, 3, OAK.m);
        hline(ctx, x + 1, by, w - 2, OAK.h);
    }
    line(ctx, x + 2, y + h - 6, x + w - 3, y + 6, OAK.d);
    line(ctx, x + 2, y + h - 7, x + w - 3, y + 5, OAK.m);
    p(ctx, x + w - 4, y + Math.floor(h / 2), "#5a6268");
}

// ---------------------------------------------------------------------------
// North wall: closed door in a casing
// ---------------------------------------------------------------------------

/** Draw a north-wall door into a w x h wall face (origin = top-left of the opening). */
export function drawNorthDoor(ctx: CanvasRenderingContext2D, w: number, h: number, style: DoorStyle): void {
    const casing = casingRamp(style);
    const double = style === "door_manor" || style === "door_glass" || style === "door_castle";
    // Doors fill the wall face: a single leaf is ~3/4 of a character's width, double doors nearly the full opening
    const leafW = double ? 72 : 48;
    const doorH = h - 5;
    const doorX = Math.round((w - leafW) / 2);
    const doorY = h - doorH;
    const cw = style === "door_manor" ? 5 : 4;

    // Shadow cast by the casing onto the wall
    r(ctx, doorX - cw - 1, doorY - cw, leafW + cw * 2 + 2, doorH + cw, "rgba(0,0,0,0.25)");

    if (style === "door_castle") {
        // Stone surround with an arched head
        const ax = doorX - 6;
        const aw = leafW + 12;
        const archR = Math.floor(aw / 2);
        const springY = doorY + 6;
        for (let y = Math.max(0, springY - archR + 6); y < h; y++) {
            const dy = springY - y;
            const half = dy > 0 ? Math.round(Math.sqrt(Math.max(0, archR * archR - dy * dy * 2.4))) : archR;
            if (half <= 0) continue;
            hline(ctx, ax + archR - half, y, half * 2, STONE.m);
            p(ctx, ax + archR - half, y, STONE.o);
            p(ctx, ax + archR + half - 1, y, STONE.o);
        }
        // Voussoir joints
        for (let i = -3; i <= 3; i++) {
            const a = (i / 8) * Math.PI;
            line(ctx, ax + archR + Math.round(Math.sin(a) * (archR - 6)), springY - Math.round(Math.cos(a) * 6), ax + archR + Math.round(Math.sin(a) * archR), springY - Math.round(Math.cos(a) * 10), STONE.d);
        }
        r(ctx, ax + archR - 3, Math.max(0, springY - 13), 6, 6, STONE.l);
        // Opening (arched) with two strapped leaves
        const oy = doorY;
        r(ctx, doorX, oy, leafW, doorH, "#0e0a08");
        strappedLeaf(ctx, doorX + 1, oy + 2, leafW / 2 - 1, doorH - 2, "right");
        strappedLeaf(ctx, doorX + leafW / 2, oy + 2, leafW / 2 - 1, doorH - 2, "left");
        // Arched top of the leaves
        for (let i = 0; i < 6; i++) {
            const inset = Math.round(Math.sqrt(36 - (6 - i) * (6 - i)));
            hline(ctx, doorX, oy + i, 6 - inset + 2, STONE.m);
            hline(ctx, doorX + leafW - (6 - inset + 2), oy + i, 6 - inset + 2, STONE.m);
        }
        // Stone step
        r(ctx, doorX - 4, h - 3, leafW + 8, 3, STONE.d);
        hline(ctx, doorX - 4, h - 3, leafW + 8, STONE.h);
        return;
    }

    // Casing (architrave) with plinth blocks
    panel(ctx, doorX - cw, doorY - cw, leafW + cw * 2, doorH + cw, casing);
    for (const x of [doorX - cw, doorX + leafW]) {
        r(ctx, x, h - 6, cw, 6, casing.d);
        hline(ctx, x, h - 6, cw, casing.l);
    }
    // Overdoor cornice / pediment
    const corniceY = doorY - cw - 3;
    if (corniceY >= 2) {
        r(ctx, doorX - cw - 2, corniceY, leafW + cw * 2 + 4, 3, casing.o);
        hline(ctx, doorX - cw - 1, corniceY, leafW + cw * 2 + 2, casing.h);
        hline(ctx, doorX - cw - 1, corniceY + 1, leafW + cw * 2 + 2, casing.m);
        if (style === "door_manor" && corniceY >= 6) {
            // Broken pediment with a gilt cartouche
            const cx = Math.round(w / 2);
            for (let i = 0; i < 5; i++) {
                hline(ctx, doorX - cw + i * 2, corniceY - 1 - i, 8, casing.m);
                hline(ctx, doorX + leafW + cw - 8 - i * 2, corniceY - 1 - i, 8, casing.m);
            }
            ellipse(ctx, cx, corniceY - 3, 4, 3, BRASS.d);
            ellipse(ctx, cx, corniceY - 3, 3, 2, BRASS.m);
            p(ctx, cx - 1, corniceY - 4, BRASS.h);
        }
    }
    if (style === "door_manor") {
        // Gilt bead on the casing
        vline(ctx, doorX - 2, doorY - cw + 2, doorH + cw - 4, BRASS.d);
        vline(ctx, doorX + leafW + 1, doorY - cw + 2, doorH + cw - 4, BRASS.d);
        hline(ctx, doorX - 2, doorY - 2, leafW + 4, BRASS.d);
    }

    // Leaves
    if (style === "door_glass") {
        glassLeaf(ctx, doorX, doorY, leafW / 2, doorH, "right");
        glassLeaf(ctx, doorX + leafW / 2, doorY, leafW / 2, doorH, "left");
        // Fanlight above when there's room
        if (doorY - cw >= 8) {
            const fy = doorY - cw - 1;
            r(ctx, doorX, fy - 4, leafW, 4, GLASS.m);
            hline(ctx, doorX, fy - 4, leafW, PAINT.l);
            for (let x = doorX + 4; x < doorX + leafW; x += 8) vline(ctx, x, fy - 4, 4, PAINT.l);
        }
    } else if (style === "door_manor") {
        panelLeaf(ctx, doorX, doorY, leafW / 2, doorH, MAHOGANY, "right", true);
        panelLeaf(ctx, doorX + leafW / 2, doorY, leafW / 2, doorH, MAHOGANY, "left", true);
        vline(ctx, doorX + leafW / 2, doorY, doorH, BRASS.d);
    } else if (style === "door_wood") {
        plankLeaf(ctx, doorX, doorY, leafW, doorH);
    } else {
        panelLeaf(ctx, doorX, doorY, leafW, doorH, OAK, "right");
    }
    // Threshold
    hline(ctx, doorX - cw, h - 1, leafW + cw * 2, shade(casing.d, -0.2));
}

// ---------------------------------------------------------------------------
// Open doorways seen from above (south and side walls)
// ---------------------------------------------------------------------------

function thresholdRamp(style: DoorStyle): Ramp {
    return style === "door_castle" ? STONE : style === "door_glass" ? { ...STONE, m: P.marbleVein, l: P.marble, h: P.marbleLight } : casingRamp(style);
}

/**
 * South-wall doorway, w x h (opening centred, `openW` wide). The floor of the
 * opening is drawn by the caller; this adds jambs, sill and the passage shadow.
 */
/** Width of a south doorway's opening for a style (single doors 32px, double 40px). */
export function southOpeningWidth(style: DoorStyle): number {
    return style === "door" || style === "door_wood" ? 56 : 72;
}

export function drawSouthDoorway(ctx: CanvasRenderingContext2D, w: number, h: number, style: DoorStyle): void {
    const casing = casingRamp(style);
    const sill = thresholdRamp(style);
    const openW = southOpeningWidth(style);
    const ox = Math.round((w - openW) / 2);
    // Passage shadow deepening toward the outside
    for (let y = 0; y < h; y++) {
        const a = 0.15 + (y / h) * 0.65;
        hline(ctx, ox, y, openW, `rgba(0,0,0,${a.toFixed(2)})`);
    }
    // Sill across the inner edge of the wall
    r(ctx, ox, 0, openW, 4, sill.d);
    hline(ctx, ox, 0, openW, sill.h);
    hline(ctx, ox, 1, openW, sill.l);
    // Jambs (casing tops) either side, full wall depth
    for (const x of [ox - 5, ox + openW]) {
        r(ctx, x, 0, 5, h, casing.o);
        r(ctx, x + 1, 0, 3, h - 1, casing.m);
        vline(ctx, x + 1, 0, h - 1, casing.l);
        hline(ctx, x, 0, 5, casing.h);
    }
    // Open leaves folded back against the jambs (seen edge-on from above)
    if (style !== "door_castle") {
        const leaf = style === "door_manor" ? MAHOGANY : style === "door_glass" ? PAINT : OAK;
        r(ctx, ox + 1, 4, 3, h - 6, leaf.d);
        vline(ctx, ox + 1, 4, h - 6, leaf.l);
        if (openW > southOpeningWidth("door")) {
            r(ctx, ox + openW - 4, 4, 3, h - 6, leaf.d);
            vline(ctx, ox + openW - 4, 4, h - 6, leaf.l);
        }
    } else {
        // Iron-studded leaves swung outward
        for (const x of [ox + 1, ox + openW - 4]) {
            r(ctx, x, 6, 3, h - 6, OAK.d);
            for (let y = 8; y < h - 2; y += 6) p(ctx, x + 1, y, P.silverDark);
        }
    }
    if (style === "door_manor") {
        hline(ctx, ox, 2, openW, BRASS.d);
    }
}

/** Height of a side-wall doorway opening. */
export const SIDE_OPENING_HEIGHT = 56;

/**
 * Side-wall doorway, w x h (opening centred vertically). `side` is the wall
 * the exit is on; the room interior is toward the opposite side.
 */
export function drawSideDoorway(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    side: "west" | "east",
    style: DoorStyle
): void {
    const casing = casingRamp(style);
    const sill = thresholdRamp(style);
    const openH = SIDE_OPENING_HEIGHT;
    const oy = Math.round((h - openH) / 2);
    // Passage shadow toward the outside edge
    for (let i = 0; i < w; i++) {
        const t = side === "west" ? (w - 1 - i) / w : i / w;
        vline(ctx, i, oy, openH, `rgba(0,0,0,${(0.15 + t * 0.65).toFixed(2)})`);
    }
    // Sill on the inner edge
    const sx = side === "west" ? w - 4 : 0;
    r(ctx, sx, oy, 4, openH, sill.d);
    vline(ctx, side === "west" ? w - 1 : 0, oy, openH, sill.h);
    vline(ctx, side === "west" ? w - 2 : 1, oy, openH, sill.l);
    // Jambs above and below the opening
    for (const y of [oy - 5, oy + openH]) {
        r(ctx, 0, y, w, 5, casing.o);
        r(ctx, 0, y + 1, w - 1, 3, casing.m);
        hline(ctx, 0, y + 1, w - 1, casing.l);
    }
    // Door leaf folded back against the upper jamb (edge-on)
    const leaf = style === "door_manor" ? MAHOGANY : style === "door_glass" ? PAINT : OAK;
    r(ctx, 2, oy + 1, w - 6, 3, leaf.d);
    hline(ctx, 2, oy + 1, w - 6, leaf.l);
    p(ctx, side === "west" ? w - 6 : 3, oy + 2, BRASS.m);
}

/** Static previews (registry/editor): each style as a north-wall door in a 3x2-tile face. */
export const DOOR_SPRITES: Record<string, ProceduralSpriteDef> = Object.fromEntries(
    (["door", "door_wood", "door_manor", "door_glass", "door_castle"] as const).map((style) => [
        style,
        { nativeWidth: 96, nativeHeight: 64, draw: (ctx: CanvasRenderingContext2D) => drawNorthDoor(ctx, 96, 64, style) }
    ])
);
