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
