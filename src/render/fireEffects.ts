/**
 * Runtime fire effects for the dining-room fire: a figure engulfed in flames,
 * burning patches on the floor and furniture (with scorch marks), warm light
 * cast by the flames, and smoke gathering under the ceiling.
 *
 * Flames are drawn on a 2px grid (character pixel size) so they stay crisp.
 */
import { P } from "../assets/procedural/palette";

const PX = 2;
const FIRE = [P.fireRed, P.fireOrange, P.fireYellow, "#fff2c0"];

function hash01(n: number): number {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

/**
 * One flame tongue: tapered column of layered colours rising from (x, baseY),
 * `height` and `width` in screen px. Snapped to the 2px grid.
 */
function flameTongue(
    ctx: CanvasRenderingContext2D,
    x: number,
    baseY: number,
    width: number,
    height: number,
    sway: number
): void {
    const rows = Math.max(1, Math.round(height / PX));
    for (let i = 0; i < rows; i++) {
        const k = i / rows;
        const half = Math.max(0, Math.round(((width / 2) * (1 - k * k)) / PX)) * PX;
        const cx = Math.round((x + sway * k * k * 6) / PX) * PX;
        const y = Math.round((baseY - i * PX) / PX) * PX;
        if (half <= 0) {
            ctx.fillStyle = FIRE[0];
            ctx.fillRect(cx, y, PX, PX);
            continue;
        }
        ctx.fillStyle = FIRE[0];
        ctx.fillRect(cx - half, y, half * 2, PX);
        if (half > PX) {
            ctx.fillStyle = FIRE[1];
            ctx.fillRect(cx - half + PX, y, half * 2 - PX * 2, PX);
        }
        if (half > PX * 2 && k < 0.65) {
            ctx.fillStyle = FIRE[2];
            ctx.fillRect(cx - half + PX * 2, y, half * 2 - PX * 4, PX);
        }
        if (half > PX * 3 && k < 0.3) {
            ctx.fillStyle = FIRE[3];
            ctx.fillRect(cx - PX, y, PX * 2, PX);
        }
    }
}

/** Soft warm light around a fire (additive). */
export function drawFireGlow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, strength: number, t: number): void {
    if (strength <= 0.01) return;
    const flicker = 0.85 + 0.15 * Math.sin(t * 13 + x * 0.05) * Math.sin(t * 7.3 + y * 0.03);
    const r = radius * (0.92 + 0.08 * flicker);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,170,70,${(0.35 * strength * flicker).toFixed(3)})`);
    g.addColorStop(0.5, `rgba(255,110,30,${(0.14 * strength * flicker).toFixed(3)})`);
    g.addColorStop(1, "rgba(255,80,20,0)");
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
}

/** Rising embers above a fire. */
function embers(ctx: CanvasRenderingContext2D, x: number, baseY: number, spread: number, rise: number, t: number, seed: number, count: number): void {
    for (let i = 0; i < count; i++) {
        const s = seed * 13.1 + i * 7.7;
        const period = 0.9 + hash01(s) * 0.8;
        const k = ((t + hash01(s + 1) * period) % period) / period;
        const ex = x + (hash01(s + 2) - 0.5) * spread + Math.sin(t * 4 + s) * 4 * k;
        const ey = baseY - k * rise;
        ctx.fillStyle = k < 0.6 ? P.fireYellow : P.fireOrange;
        ctx.globalAlpha = 1 - k;
        ctx.fillRect(Math.round(ex / PX) * PX, Math.round(ey / PX) * PX, PX, PX);
    }
    ctx.globalAlpha = 1;
}

/**
 * A person engulfed in flames. (x, y, w, h) is the character's on-screen
 * sprite box; flames cover the silhouette and lick above the head.
 */
export function drawBurningFigure(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    t: number,
    intensity = 1
): void {
    if (intensity <= 0.01) return;
    const cx = x + w / 2;
    const bodyTop = y + h * 0.12;
    const feet = y + h * 0.9;
    drawFireGlow(ctx, cx, y + h * 0.55, w * 1.6, intensity, t);
    // Tongues rising from across the body, tallest on the torso/shoulders
    const tongues = 7;
    for (let i = 0; i < tongues; i++) {
        const u = (i + 0.5) / tongues;
        const fx = x + w * (0.18 + u * 0.64);
        const centre = 1 - Math.abs(u - 0.5) * 1.6;
        const base = feet - (feet - bodyTop) * (0.25 + 0.55 * centre) * hash01(i + 3) * 0.6;
        const flick = 0.75 + 0.25 * Math.sin(t * (9 + i) + i * 1.7);
        const height = (h * 0.35 + h * 0.4 * centre) * flick * intensity;
        const width = w * (0.16 + 0.1 * centre);
        flameTongue(ctx, fx, base, width, height, Math.sin(t * 5 + i));
    }
    embers(ctx, cx, bodyTop, w * 0.8, h * 0.5, t, 17, 8);
    // Smoke trailing upward from the head
    for (let i = 0; i < 4; i++) {
        const k = ((t * 0.7 + i * 0.25) % 1);
        const sx = cx + Math.sin(t * 2 + i) * 6 * k;
        const sy = bodyTop - k * h * 0.6;
        const size = Math.round((6 + k * 10) / PX) * PX;
        ctx.fillStyle = `rgba(40,36,34,${(0.35 * (1 - k)).toFixed(3)})`;
        ctx.fillRect(Math.round(sx / PX) * PX - size / 2, Math.round(sy / PX) * PX - size / 2, size, size);
    }
}

export interface FireSpotView {
    x: number;
    y: number;
    /** 0..1 growth */
    size: number;
    /** Max flame height in px when fully grown */
    maxHeight: number;
    seed: number;
}

/** Charred scorch mark left on the floor/cloth under a fire. */
export function drawScorch(ctx: CanvasRenderingContext2D, spot: FireSpotView): void {
    const s = Math.max(0.2, spot.size);
    const rx = Math.round((14 + spot.maxHeight * 0.25) * s / PX) * PX;
    const ry = Math.round(rx * 0.45 / PX) * PX;
    for (let dy = -ry; dy <= ry; dy += PX) {
        const k = dy / Math.max(1, ry);
        const half = Math.round((rx * Math.sqrt(Math.max(0, 1 - k * k))) / PX) * PX;
        ctx.fillStyle = `rgba(24,14,8,${(0.55 - Math.abs(k) * 0.25).toFixed(3)})`;
        ctx.fillRect(Math.round(spot.x / PX) * PX - half, Math.round((spot.y + dy) / PX) * PX, half * 2, PX);
    }
}

/** A burning patch: an uneven cluster of tongues sized by growth, with embers and glow. */
export function drawFireSpot(ctx: CanvasRenderingContext2D, spot: FireSpotView, t: number, intensity: number): void {
    const s = Math.max(0, Math.min(1, spot.size)) * intensity;
    if (s <= 0.02) return;
    drawFireGlow(ctx, spot.x, spot.y - spot.maxHeight * 0.3 * s, 36 + spot.maxHeight * s, s * 0.6, t + spot.seed);
    const count = 2 + Math.round(hash01(spot.seed * 3.1) * 2 + s);
    for (let i = 0; i < count; i++) {
        const r1 = hash01(spot.seed * 7.3 + i * 1.9);
        const r2 = hash01(spot.seed * 2.7 + i * 4.1);
        const off = (i - (count - 1) / 2) * (5 + 3 * s) + (r1 - 0.5) * 6;
        const flick = 0.65 + 0.35 * Math.sin(t * (7 + r2 * 6) + spot.seed * 3 + i * 2.3);
        const tall = 0.45 + 0.55 * r2;
        flameTongue(ctx, spot.x + off, spot.y + Math.round((r1 - 0.5) * 4), 6 + 5 * s * tall, spot.maxHeight * s * flick * tall, Math.sin(t * 4 + i + spot.seed));
    }
    embers(ctx, spot.x, spot.y - spot.maxHeight * s * 0.6, 18, spot.maxHeight * 0.9, t, spot.seed, Math.round(1 + 3 * s));
}

/**
 * Screen-space smoke + heat for the fire scene: smoke pools under the ceiling
 * and thickens downward as `smokeAlpha` rises; a faint warm cast tracks the fire.
 */
export function drawFireAtmosphere(
    ctx: CanvasRenderingContext2D,
    smokeAlpha: number,
    flameIntensity: number,
    t: number
): void {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    if (flameIntensity > 0.05) {
        const flicker = 0.9 + Math.sin(t * 11) * 0.06 + Math.sin(t * 17.3) * 0.04;
        ctx.fillStyle = `rgba(160,50,10,${(0.08 * flameIntensity * flicker).toFixed(3)})`;
        ctx.fillRect(0, 0, w, h);
    }
    if (smokeAlpha > 0.01) {
        // Ceiling smoke layer: dense at the top, reaching further down as it builds
        const depth = h * (0.3 + smokeAlpha * 0.7);
        const g = ctx.createLinearGradient(0, 0, 0, depth);
        g.addColorStop(0, `rgba(26,24,22,${Math.min(0.95, smokeAlpha * 1.1).toFixed(3)})`);
        g.addColorStop(1, "rgba(26,24,22,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, depth);
        ctx.fillStyle = `rgba(30,28,26,${(smokeAlpha * 0.35).toFixed(3)})`;
        ctx.fillRect(0, 0, w, h);
        // Rolling billows along the smoke front
        for (let i = 0; i < 9; i++) {
            const bx = ((t * (14 + i * 3) + i * 97) % (w + 160)) - 80;
            const by = depth * (0.45 + 0.4 * hash01(i)) + Math.sin(t * 0.8 + i) * 10;
            const br = 50 + hash01(i + 9) * 50;
            const bg = ctx.createRadialGradient(bx, by, 0, bx, by, br);
            bg.addColorStop(0, `rgba(48,44,40,${(smokeAlpha * 0.4).toFixed(3)})`);
            bg.addColorStop(1, "rgba(40,36,34,0)");
            ctx.fillStyle = bg;
            ctx.fillRect(bx - br, by - br, br * 2, br * 2);
        }
    }
}
