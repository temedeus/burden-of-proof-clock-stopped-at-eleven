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
