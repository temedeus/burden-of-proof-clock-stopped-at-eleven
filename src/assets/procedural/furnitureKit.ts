/**
 * Shared furniture drawing kit: consistent wood/stone ramps, bevelled panels,
 * tabletops, legs, book rows and floor shadows. Light comes from the upper left.
 *
 * Draw every sprite at its native size and register it so it renders at a
 * uniform integer scale (1x like tiles, or 2x like characters) — never stretched.
 */
import { P } from "./palette";
import { hline, p, r, vline } from "./pixel";

export interface Ramp {
    /** Outline / deepest shadow */
    o: string;
    /** Shadow */
    d: string;
    /** Base */
    m: string;
    /** Lit */
    l: string;
    /** Highlight */
    h: string;
}

export const WOOD: Ramp = { o: "#24160c", d: P.woodDark, m: P.wood, l: P.woodLight, h: P.woodHi };
export const MAHOGANY: Ramp = { o: "#1e0e08", d: "#3a1a10", m: "#5a2a1c", l: "#7a3c28", h: "#9a5434" };
export const IRON: Ramp = { o: "#141618", d: "#2a2e32", m: "#3e444a", l: "#5a6268", h: "#7e888e" };
export const STONE: Ramp = { o: "#3a3632", d: "#6a645c", m: "#8a847a", l: "#a8a296", h: "#c8c2b4" };

export const FLOOR_SHADOW = "rgba(0,0,0,0.28)";

/** Small deterministic PRNG so procedural detail is stable between bakes. */
export function seeded(seed: number): () => number {
    let s = seed >>> 0;
    return () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Soft elliptical contact shadow on the floor. */
export function floorShadow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h = 2): void {
    for (let i = 0; i < h; i++) {
        const inset = i === h - 1 && h > 1 ? 2 : 0;
        hline(ctx, x + inset, y + i, w - inset * 2, FLOOR_SHADOW);
    }
}

/** Bevelled panel: outline, lit top/left, shadowed bottom/right. */
export function panel(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    ramp: Ramp,
    outline = true
): void {
    r(ctx, x, y, w, h, outline ? ramp.o : ramp.d);
    const i = outline ? 1 : 0;
    r(ctx, x + i, y + i, w - i * 2, h - i * 2, ramp.m);
    hline(ctx, x + i, y + i, w - i * 2, ramp.l);
    vline(ctx, x + i, y + i, h - i * 2, ramp.l);
    hline(ctx, x + i, y + h - i - 1, w - i * 2, ramp.d);
    vline(ctx, x + w - i - 1, y + i, h - i * 2, ramp.d);
    p(ctx, x + i, y + i, ramp.h);
}

/** Recessed panel (inset shadow top/left, lit bottom/right). */
export function recess(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, ramp: Ramp): void {
    r(ctx, x, y, w, h, ramp.m);
    hline(ctx, x, y, w, ramp.d);
    vline(ctx, x, y, h, ramp.d);
    hline(ctx, x + 1, y + h - 1, w - 1, ramp.l);
    vline(ctx, x + w - 1, y + 1, h - 1, ramp.l);
}

/**
 * Tabletop seen from the 3/4 view: lit top surface with grain, then a front edge
 * (`edge` px tall) in shadow.
 */
export function tabletop(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    edge: number,
    ramp: Ramp,
    seed = 1
): void {
    r(ctx, x, y, w, h + edge, ramp.o);
    r(ctx, x + 1, y + 1, w - 2, h - 1, ramp.l);
    hline(ctx, x + 1, y + 1, w - 2, ramp.h);
    // Planks + grain
    const rand = seeded(seed);
    const planks = Math.max(1, Math.round((h - 2) / 5));
    for (let k = 1; k < planks; k++) {
        hline(ctx, x + 1, y + 1 + Math.round(((h - 1) * k) / planks), w - 2, ramp.m);
    }
    for (let i = 0; i < Math.floor((w * h) / 60); i++) {
        const gx = x + 2 + Math.floor(rand() * (w - 6));
        const gy = y + 2 + Math.floor(rand() * (h - 3));
        hline(ctx, gx, gy, 2 + Math.floor(rand() * 4), ramp.m);
    }
    // Front edge
    r(ctx, x + 1, y + h, w - 2, edge - 1, ramp.m);
    hline(ctx, x + 1, y + h, w - 2, ramp.d);
    p(ctx, x + 1, y + h, ramp.m);
}

/** Turned table/chair leg with lit left side. */
export function leg(ctx: CanvasRenderingContext2D, x: number, top: number, bottom: number, w: number, ramp: Ramp): void {
    r(ctx, x, top, w, bottom - top, ramp.o);
    r(ctx, x + 1, top, w - 2, bottom - top - 1, ramp.d);
    if (w > 3) vline(ctx, x + 1, top, bottom - top - 1, ramp.m);
    // Collar near the top + foot
    hline(ctx, x, top + 2, w, ramp.m);
    hline(ctx, x, bottom - 2, w, ramp.d);
}

const BOOK_COLORS: [string, string][] = [
    ["#7a2424", "#9a3a32"],
    ["#26385a", "#3a5078"],
    ["#2e4a2c", "#466a3e"],
    ["#6a4a1c", "#8a6a2e"],
    ["#4a2a4a", "#6a426a"],
    ["#3a2a1c", "#5a4430"],
    ["#8a7a5a", "#aa9a74"]
];

/**
 * A row of book spines standing on a shelf whose top surface is at `baseY`.
 * Heights vary, a few lean, and gold bands mark the spines.
 */
export function bookRow(
    ctx: CanvasRenderingContext2D,
    x: number,
    baseY: number,
    w: number,
    maxH: number,
    seed: number,
    gap = 0.12
): void {
    const rand = seeded(seed);
    let bx = x;
    while (bx < x + w) {
        if (rand() < gap) {
            bx += 1 + Math.floor(rand() * 2);
            continue;
        }
        const bw = Math.min(x + w - bx, 2 + Math.floor(rand() * 2));
        const bh = Math.max(3, maxH - Math.floor(rand() * 3));
        const [base, lit] = BOOK_COLORS[Math.floor(rand() * BOOK_COLORS.length)];
        r(ctx, bx, baseY - bh, bw, bh, base);
        vline(ctx, bx, baseY - bh, bh, lit);
        if (bh > 4) hline(ctx, bx, baseY - bh + 1, bw, P.goldDark);
        if (bh > 6 && rand() < 0.5) hline(ctx, bx, baseY - 2, bw, P.goldDark);
        bx += bw;
    }
}

/** Open-fronted shelving unit filled with books (1x scale, 32px per column). */
export function bookcase(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    seed: number,
    ramp: Ramp = WOOD
): { shelfYs: number[] } {
    // Carcass with crown moulding and plinth
    r(ctx, x, y, w, h, ramp.o);
    r(ctx, x + 1, y + 1, w - 2, 5, ramp.m);
    hline(ctx, x + 1, y + 1, w - 2, ramp.h);
    hline(ctx, x + 1, y + 5, w - 2, ramp.d);
    r(ctx, x + 1, y + h - 6, w - 2, 5, ramp.m);
    hline(ctx, x + 1, y + h - 6, w - 2, ramp.l);
    // Side stiles
    r(ctx, x + 1, y + 6, 2, h - 12, ramp.l);
    r(ctx, x + w - 3, y + 6, 2, h - 12, ramp.d);
    // Interior back
    const ix = x + 3;
    const iw = w - 6;
    const top = y + 6;
    const bottom = y + h - 6;
    r(ctx, ix, top, iw, bottom - top, "#1e140c");
    const shelves = Math.max(2, Math.round((bottom - top) / 14));
    const pitch = (bottom - top) / shelves;
    const shelfYs: number[] = [];
    for (let i = 1; i <= shelves; i++) {
        const sy = Math.round(top + pitch * i) - 2;
        shelfYs.push(sy);
        bookRow(ctx, ix, sy, iw, Math.floor(pitch) - 3, seed * 31 + i);
        // Shelf board
        hline(ctx, ix, sy, iw, ramp.l);
        hline(ctx, ix, sy + 1, iw, ramp.d);
        // Shadow under the shelf above
        hline(ctx, ix, Math.round(top + pitch * (i - 1)), iw, "#120c08");
    }
    return { shelfYs };
}

/** 1px Bresenham line between integer points. */
export function line(
    ctx: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    color: string
): void {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
        p(ctx, x0, y0, color);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) {
            err += dy;
            x0 += sx;
        }
        if (e2 <= dx) {
            err += dx;
            y0 += sy;
        }
    }
}

/** Filled ellipse with hard pixel edges (pixel-centre test). */
export function ellipse(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    color: string
): void {
    ctx.fillStyle = color;
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
        const dy = (y + 0.5 - cy) / ry;
        if (Math.abs(dy) > 1) continue;
        const half = rx * Math.sqrt(1 - dy * dy);
        const x0 = Math.round(cx - half);
        const x1 = Math.round(cx + half);
        if (x1 > x0) ctx.fillRect(x0, y, x1 - x0, 1);
    }
}
