import type { ProceduralSpriteDef } from "./types";

export function bakeSprite(def: ProceduralSpriteDef): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = def.nativeWidth;
    canvas.height = def.nativeHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    def.draw(ctx, def.nativeWidth, def.nativeHeight);
    return canvas;
}

/** Fill a solid rectangle in pixel coordinates */
export function r(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string
): void {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
}

/** Draw indexed pixel grid: rows of palette keys or '.' for transparent */
export function grid(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    px: number,
    rows: string[],
    colors: Record<string, string>
): void {
    for (let y = 0; y < rows.length; y++) {
        const row = rows[y];
        for (let x = 0; x < row.length; x++) {
            const ch = row[x];
            if (ch === ".") continue;
            const c = colors[ch];
            if (c) r(ctx, ox + x * px, oy + y * px, px, px, c);
        }
    }
}

/** Vertical mirror copy for symmetric sprites */
export function mirrorV(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    cy: number
): void {
    const img = ctx.getImageData(0, 0, w, h);
    for (let y = 0; y < cy; y++) {
        for (let x = 0; x < w; x++) {
            const ti = (y * w + x) * 4;
            const bi = ((h - 1 - y) * w + x) * 4;
            for (let i = 0; i < 4; i++) {
                const t = img.data[ti + i];
                img.data[ti + i] = img.data[bi + i];
                img.data[bi + i] = t;
            }
        }
    }
    ctx.putImageData(img, 0, 0);
}

/** Horizontal mirror copy for symmetric sprites */
export function mirrorH(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    cx: number
): void {
    const img = ctx.getImageData(0, 0, w, h);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < cx; x++) {
            const li = (y * w + x) * 4;
            const ri = (y * w + (w - 1 - x)) * 4;
            for (let i = 0; i < 4; i++) {
                const t = img.data[li + i];
                img.data[li + i] = img.data[ri + i];
                img.data[ri + i] = t;
            }
        }
    }
    ctx.putImageData(img, 0, 0);
}

/**
 * Fill a circle in pixel coordinates using midpoint circle algorithm
 * Optimized for small circles (radius < 16) typical in pixel art
 */
export function c(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    color: string
): void {
    ctx.fillStyle = color;
    const x = Math.floor(cx);
    const y = Math.floor(cy);
    const rad = Math.floor(radius);
    
    // For very small circles, use rectangle approximation
    if (rad <= 1) {
        r(ctx, x, y, 1, 1, color);
        return;
    }
    
    // Use canvas ellipse for smooth circles - matches pixel art aesthetic
    ctx.beginPath();
    ctx.ellipse(x + 0.5, y + 0.5, rad, rad, 0, 0, Math.PI * 2);
    ctx.fill();
}

/**
 * Fill a rounded rectangle in pixel coordinates
 * Corner radius is clamped to min(w/2, h/2)
 * For pixel art, radius of 1-2 gives nice soft edges
 */
export function rr(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number,
    color: string
): void {
    ctx.fillStyle = color;
    const rf = Math.min(radius, Math.min(w, h) / 2);
    const xf = Math.floor(x);
    const yf = Math.floor(y);
    const wf = Math.floor(w);
    const hf = Math.floor(h);
    
    // For very small rounded rects or zero radius, use regular rect
    if (rf <= 0 || (wf <= 2 && hf <= 2)) {
        r(ctx, xf, yf, wf, hf, color);
        return;
    }
    
    ctx.beginPath();
    ctx.moveTo(xf + rf, yf);
    ctx.lineTo(xf + wf - rf, yf);
    ctx.quadraticCurveTo(xf + wf, yf, xf + wf, yf + rf);
    ctx.lineTo(xf + wf, yf + hf - rf);
    ctx.quadraticCurveTo(xf + wf, yf + hf, xf + wf - rf, yf + hf);
    ctx.lineTo(xf + rf, yf + hf);
    ctx.quadraticCurveTo(xf, yf + hf, xf, yf + hf - rf);
    ctx.lineTo(xf, yf + rf);
    ctx.quadraticCurveTo(xf, yf, xf + rf, yf);
    ctx.closePath();
    ctx.fill();
}

/**
 * Fill a triangle in pixel coordinates
 * Uses integer coordinates for crisp pixel art edges
 */
export function t(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    color: string
): void {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(Math.floor(x1) + 0.5, Math.floor(y1) + 0.5);
    ctx.lineTo(Math.floor(x2) + 0.5, Math.floor(y2) + 0.5);
    ctx.lineTo(Math.floor(x3) + 0.5, Math.floor(y3) + 0.5);
    ctx.closePath();
    ctx.fill();
}

/**
 * Draw a single pixel at precise coordinates
 * Useful for fine details like eyes, buttons, etc.
 */
export function p(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string
): void {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
}

/**
 * Draw a horizontal line of pixels
 */
export function hline(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    length: number,
    color: string
): void {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(length), 1);
}

/**
 * Draw a vertical line of pixels
 */
export function vline(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    length: number,
    color: string
): void {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), 1, Math.floor(length));
}

/** Row inset for a crisp rounded corner (`k` = rows from the edge). */
function cornerInset(radius: number, k: number): number {
    if (k >= radius) return 0;
    const d = radius - k - 0.5;
    return Math.round(radius - Math.sqrt(radius * radius - d * d));
}

/**
 * Rounded rectangle with hard pixel edges (no anti-aliasing).
 * Same signature as `rr`; use for sprites that are scaled up with nearest-neighbour.
 */
export function rrCrisp(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number,
    color: string
): void {
    const xf = Math.floor(x);
    const yf = Math.floor(y);
    const wf = Math.floor(w);
    const hf = Math.floor(h);
    const rad = Math.floor(Math.min(radius, wf / 2, hf / 2));
    ctx.fillStyle = color;
    for (let j = 0; j < hf; j++) {
        const inset = cornerInset(rad, Math.min(j, hf - 1 - j));
        ctx.fillRect(xf + inset, yf + j, wf - inset * 2, 1);
    }
}

/** Filled disc with hard pixel edges — pixel set matches `c` without anti-aliasing. */
export function discCrisp(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    color: string
): void {
    const x = Math.floor(cx);
    const y = Math.floor(cy);
    const rad = Math.floor(radius);
    ctx.fillStyle = color;
    if (rad <= 1) {
        ctx.fillRect(x, y, 1, 1);
        return;
    }
    for (let j = -rad; j <= rad; j++) {
        const half = Math.floor(Math.sqrt(rad * rad - j * j));
        ctx.fillRect(x - half, y + j, half * 2 + 1, 1);
    }
}

/** Filled triangle with hard pixel edges (pixel-centre inclusion test). */
export function triCrisp(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    color: string
): void {
    const minX = Math.floor(Math.min(x1, x2, x3));
    const maxX = Math.ceil(Math.max(x1, x2, x3));
    const minY = Math.floor(Math.min(y1, y2, y3));
    const maxY = Math.ceil(Math.max(y1, y2, y3));
    const edge = (ax: number, ay: number, bx: number, by: number, px: number, py: number) =>
        (bx - ax) * (py - ay) - (by - ay) * (px - ax);
    const area = edge(x1, y1, x2, y2, x3, y3);
    if (area === 0) return;
    ctx.fillStyle = color;
    for (let py = minY; py <= maxY; py++) {
        for (let px = minX; px <= maxX; px++) {
            const sx = px + 0.5;
            const sy = py + 0.5;
            const w0 = edge(x2, y2, x3, y3, sx, sy) * area;
            const w1 = edge(x3, y3, x1, y1, sx, sy) * area;
            const w2 = edge(x1, y1, x2, y2, sx, sy) * area;
            if (w0 >= 0 && w1 >= 0 && w2 >= 0) ctx.fillRect(px, py, 1, 1);
        }
    }
}

/** Lighten (amount > 0) or darken (amount < 0) a `#rrggbb` colour; amount in -1..1. */
export function shade(color: string, amount: number): string {
    const n = parseInt(color.slice(1, 7), 16);
    const ch = (v: number) =>
        Math.max(0, Math.min(255, Math.round(amount >= 0 ? v + (255 - v) * amount : v * (1 + amount))));
    const rr_ = ch((n >> 16) & 255);
    const gg = ch((n >> 8) & 255);
    const bb = ch(n & 255);
    return `#${((1 << 24) | (rr_ << 16) | (gg << 8) | bb).toString(16).slice(1)}`;
}
