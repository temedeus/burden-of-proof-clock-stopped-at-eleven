import { P } from "./palette";
import { grid, hline, r, rrCrisp, shade } from "./pixel";

/** Native size; drawn at 2x into the 2x3-tile furniture box (same pixel density as characters). */
export const STUFFED_MOOSE_W = 32;
export const STUFFED_MOOSE_H = 48;

/**
 * Left half (x 0..15) of the front-facing moose head; mirrored for the right half.
 * Palmate antlers, side-set glass eyes, long bulbous muzzle, neck into the plaque.
 */
const MOOSE_LEFT_HALF = [
    "................",
    "..o...o...o.....",
    ".oWo.oWo.oWo....",
    ".oWAooWAooWAo...",
    "oWAAAWAAAWAAo...",
    "oWAAAAAAAAAAAo..",
    ".oaAAAAAAAAAAo..",
    "..oaaAAAAAAAAo..",
    "...ooaaaAAAAAo..",
    ".....oooaAAAo...",
    "........oaAAo...",
    ".........oaAo...",
    "..........oaAo..",
    "..........oaAood",
    "...........oddFF",
    "....oo....odFFlf",
    "...odFoo.odFFllf",
    "...odmFFoodFFfff",
    "....oddFFodgkFff",
    ".....ooddodkkFff",
    "..........odFfff",
    "...........odFff",
    "...........odFff",
    "..........odmMMM",
    ".........odmMMMM",
    ".........odmMMMM",
    ".........odmMnnM",
    ".........odmMnnM",
    ".........oddmMMM",
    "..........oddmmm",
    "...........ooddd",
    "............oddF",
    "...........oddFF",
    "...........odFFf",
    "...........odFFf",
    "...........oddFd"
];

/** Right half is a mirror, one step darker (light from the upper left). */
const SHADE_RIGHT: Record<string, string> = { W: "A", l: "f" };

function mooseRows(): string[] {
    return MOOSE_LEFT_HALF.map((left) => {
        const right = [...left]
            .reverse()
            .map((ch) => SHADE_RIGHT[ch] ?? ch)
            .join("");
        return left + right;
    });
}

const MOOSE_COLORS: Record<string, string> = {
    o: "#2a1a10",
    a: "#8a7a5a",
    A: "#c8b890",
    W: "#ece2c4",
    d: P.horseCoatDark,
    F: "#5e3e28",
    f: P.horseCoat,
    l: P.horseCoatLight,
    m: "#6a5040",
    M: P.horseMuzzle,
    n: P.horseNostril,
    k: P.black,
    g: P.gold
};

/** Mahogany shield plaque on a turned pedestal. */
function drawPedestal(ctx: CanvasRenderingContext2D): void {
    // Floor shadow
    hline(ctx, 7, 46, 18, "rgba(0,0,0,0.3)");
    hline(ctx, 9, 47, 14, "rgba(0,0,0,0.3)");
    // Base
    rrCrisp(ctx, 9, 43, 14, 4, 1, P.woodDark);
    hline(ctx, 10, 43, 12, P.wood);
    hline(ctx, 10, 44, 5, P.woodLight);
    // Column
    r(ctx, 13, 38, 6, 5, P.wood);
    r(ctx, 13, 38, 2, 5, P.woodLight);
    r(ctx, 18, 38, 1, 5, P.woodDark);
    // Arched mahogany shield behind the head, tapering to a point
    const mahogany = "#5a2a1c";
    const mahoganyLight = "#7a3c28";
    const mahoganyDark = "#3a1a10";
    for (let y = 24; y <= 39; y++) {
        const inset = y === 24 ? 3 : y === 25 ? 1 : y < 35 ? 0 : (y - 34) * 2;
        const left = 5 + inset;
        const width = 22 - inset * 2;
        r(ctx, left, y, width, 1, mahogany);
        r(ctx, left, y, 1, 1, mahoganyDark);
        r(ctx, left + width - 1, y, 1, 1, mahoganyDark);
        if (width > 6) {
            r(ctx, left + 1, y, 1, 1, mahoganyLight);
            r(ctx, left + width - 2, y, 1, 1, shade(mahogany, -0.2));
        }
    }
    hline(ctx, 9, 24, 14, mahoganyLight);
    // Brass name plate
    r(ctx, 13, 37, 6, 2, P.goldDark);
    hline(ctx, 13, 37, 5, P.gold);
}

function drawHead(ctx: CanvasRenderingContext2D, ox = 0): void {
    grid(ctx, ox, 0, 1, mooseRows(), MOOSE_COLORS);
    // Dewlap ("bell") hanging under the chin
    r(ctx, ox + 15, 31, 2, 3, P.horseCoatDark);
    r(ctx, ox + 15, 34, 1, 1, P.horseCoatDark);
}

function drawCollar(ctx: CanvasRenderingContext2D): void {
    // Mount collar where the neck meets the plaque
    hline(ctx, 11, 35, 10, "#3a1a10");
}

export function drawStuffedMoose(ctx: CanvasRenderingContext2D): void {
    drawPedestal(ctx);
    drawHead(ctx);
    drawCollar(ctx);
}

/** The head swivels about the neck mount. */
const PIVOT_X = 16;
const PIVOT_Y = 35;
/** Side margin on the rotation canvas so tilted antlers are not clipped. */
const TILT_MARGIN = 10;
/** Mouth corner (native px) where the tongue comes out, nearest the viewer's left. */
const MOUTH_X = 14;
const MOUTH_Y = 30;
const TILT_STEPS = 12;

const tiltCache = new Map<number, HTMLCanvasElement>();

function tiltStep(angle: number): number {
    return Math.round(angle * TILT_STEPS * 4) / (TILT_STEPS * 4);
}

/** Nearest-neighbour rotation in native pixels keeps the head crisp pixel art. */
function tiltedHead(angle: number): HTMLCanvasElement {
    const key = tiltStep(angle);
    const cached = tiltCache.get(key);
    if (cached) return cached;

    const w = STUFFED_MOOSE_W + TILT_MARGIN * 2;
    const h = STUFFED_MOOSE_H;
    const src = document.createElement("canvas");
    src.width = w;
    src.height = h;
    const sctx = src.getContext("2d")!;
    drawHead(sctx, TILT_MARGIN);
    const from = sctx.getImageData(0, 0, w, h);

    const out = document.createElement("canvas");
    out.width = w;
    out.height = h;
    const octx = out.getContext("2d")!;
    const to = octx.createImageData(w, h);
    const cos = Math.cos(-key);
    const sin = Math.sin(-key);
    const px = PIVOT_X + TILT_MARGIN;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const dx = x + 0.5 - px;
            const dy = y + 0.5 - PIVOT_Y;
            const sx = Math.floor(px + dx * cos - dy * sin);
            const sy = Math.floor(PIVOT_Y + dx * sin + dy * cos);
            if (sx < 0 || sy < 0 || sx >= w || sy >= h) continue;
            const si = (sy * w + sx) * 4;
            const di = (y * w + x) * 4;
            to.data[di] = from.data[si];
            to.data[di + 1] = from.data[si + 1];
            to.data[di + 2] = from.data[si + 2];
            to.data[di + 3] = from.data[si + 3];
        }
    }
    octx.putImageData(to, 0, 0);
    tiltCache.set(key, out);
    return out;
}

/** Runtime draw with the head tilted by `angle` radians (negative leans toward the west). */
export function drawStuffedMooseTilted(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    angle: number
): void {
    const sx = w / STUFFED_MOOSE_W;
    const sy = h / STUFFED_MOOSE_H;
    const prevSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sx, sy);
    drawPedestal(ctx);
    ctx.drawImage(tiltedHead(angle), -TILT_MARGIN, 0);
    drawCollar(ctx);
    ctx.restore();
    ctx.imageSmoothingEnabled = prevSmoothing;
}

/** Mouth position in native sprite pixels for a head tilted by `angle`. */
export function stuffedMooseMouth(angle: number): { x: number; y: number } {
    const a = tiltStep(angle);
    const dx = MOUTH_X - PIVOT_X;
    const dy = MOUTH_Y - PIVOT_Y;
    return {
        x: PIVOT_X + dx * Math.cos(a) - dy * Math.sin(a),
        y: PIVOT_Y + dx * Math.sin(a) + dy * Math.cos(a)
    };
}

/**
 * Sagging pixel tongue from (sx, sy) to (ex, ey) in screen px, built from `px`-sized blocks.
 */
export function drawMooseTongue(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    ex: number,
    ey: number,
    px: number
): void {
    const dist = Math.hypot(ex - sx, ey - sy);
    const steps = Math.max(1, Math.ceil(dist / px));
    const sag = Math.min(px * 3, dist * 0.12);
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i <= steps; i++) {
        const f = i / steps;
        points.push({
            x: Math.round((sx + (ex - sx) * f) / px) * px,
            y: Math.round((sy + (ey - sy) * f + Math.sin(f * Math.PI) * sag) / px) * px
        });
    }
    const outline = "#5a1a2a";
    const flesh = "#d9688a";
    const fleshLight = "#f090a8";
    const drool = "#e8f4ec";
    ctx.fillStyle = outline;
    for (const p of points) ctx.fillRect(p.x - px * 2, p.y - px * 2, px * 5, px * 5);
    ctx.fillStyle = flesh;
    for (const p of points) ctx.fillRect(p.x - px, p.y - px, px * 3, px * 3);
    // Wet sheen along the top and a centre groove
    ctx.fillStyle = fleshLight;
    for (let i = 0; i < points.length; i += 2) ctx.fillRect(points[i].x, points[i].y - px, px, px);
    ctx.fillStyle = "#b84a6a";
    for (let i = 1; i < points.length; i += 3) ctx.fillRect(points[i].x, points[i].y + px, px, px);
    // Fat tip and a hanging string of drool
    const tip = points[points.length - 1];
    ctx.fillStyle = outline;
    ctx.fillRect(tip.x - px * 3, tip.y - px * 3, px * 7, px * 7);
    ctx.fillStyle = flesh;
    ctx.fillRect(tip.x - px * 2, tip.y - px * 2, px * 5, px * 5);
    ctx.fillStyle = fleshLight;
    ctx.fillRect(tip.x - px, tip.y - px * 2, px * 2, px);
    ctx.fillStyle = drool;
    ctx.fillRect(tip.x - px, tip.y + px * 3, px, px * 2);
    const mid = points[Math.floor(points.length / 2)];
    ctx.fillRect(mid.x, mid.y + px * 3, px, px * 2);
}

export { MOOSE_LEFT_HALF };
