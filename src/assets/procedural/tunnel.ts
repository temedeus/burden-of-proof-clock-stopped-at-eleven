/**
 * Secret tunnel dressing: a packed-earth floor laid over the flagstones (with
 * puddles, rubble and a trodden track) and mine-style timber support frames.
 * Native 1x tile detail (32px per tile), light from the upper left.
 */
import { hline, p, r, vline } from "./pixel";
import { ellipse, seeded } from "./furnitureKit";
import type { ProceduralSpriteDef } from "./types";

const EARTH = ["#2e241c", "#352a20", "#3b2f24", "#41342a"];
const TIMBER = { o: "#1c120a", d: "#3a2616", m: "#523620", l: "#6e4c2e", h: "#86603a" };

function hash(x: number, y: number, s: number): number {
    const v = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
    return v - Math.floor(v);
}

/** Packed earth, 160x384 (5x12 tiles). Ragged top/bottom edges blend into the flagstones. */
function drawTunnelEarth(ctx: CanvasRenderingContext2D): void {
    const W = 160;
    const H = 384;
    for (let y = 0; y < H; y += 2) {
        for (let x = 0; x < W; x += 2) {
            // Ragged ends where the earth gives way to the stone thresholds
            const edge = Math.min(y, H - 2 - y);
            if (edge < 8 && hash(x, y, 3) * 8 > edge) continue;
            // Trodden track down the middle is smoother and lighter
            const track = Math.abs(x + 1 - W / 2 + Math.sin(y / 40) * 6) < 26;
            const n = hash(Math.floor(x / 6), Math.floor(y / 6), 5) * 0.6 + hash(x, y, 7) * 0.4;
            let i = Math.floor(n * EARTH.length);
            if (track) i = Math.min(EARTH.length - 1, i + 1);
            // Darker against the walls
            if (x < 6 || x > W - 8) i = 0;
            r(ctx, x, y, 2, 2, EARTH[Math.max(0, Math.min(EARTH.length - 1, i))]);
        }
    }
    const rand = seeded(1313);
    // Footprints along the track
    for (let y = 20; y < H - 20; y += 13) {
        const side = (y / 13) % 2 ? 1 : -1;
        const x = Math.round(W / 2 + side * 6 + Math.sin(y / 40) * 6);
        r(ctx, x, y, 3, 5, "#2a2018");
        p(ctx, x + 1, y + 6, "#2a2018");
    }
    // Puddles fed by the drips from above
    for (const [cx, cy, rx] of [[48, 120, 12], [112, 250, 9], [70, 330, 7]] as const) {
        ellipse(ctx, cx, cy + 1, rx + 1, rx * 0.45 + 1, "#241c16");
        ellipse(ctx, cx, cy, rx, rx * 0.45, "#1c2228");
        hline(ctx, cx - rx + 3, cy - 1, Math.round(rx * 0.8), "#3a4650");
        p(ctx, cx + 2, cy + 1, "#4a5a66");
    }
    // Scattered stones and grit
    for (let i = 0; i < 120; i++) {
        const x = Math.floor(rand() * W);
        const y = 8 + Math.floor(rand() * (H - 16));
        const c = rand() < 0.5 ? "#4a443e" : "#57504a";
        p(ctx, x, y, c);
        if (rand() < 0.3) p(ctx, x + 1, y, "#3a3530");
        p(ctx, x, y + 1, "#1e1813");
    }
    // Rubble fallen from the walls
    for (const [cx, cy, n] of [[8, 70, 7], [150, 190, 8], [10, 290, 6]] as const) {
        for (let i = 0; i < n; i++) {
            const x = cx + Math.floor((rand() - 0.5) * 12);
            const y = cy + Math.floor((rand() - 0.5) * 10);
            const w = 3 + Math.floor(rand() * 4);
            const h = 2 + Math.floor(rand() * 3);
            r(ctx, x, y + h, w, 1, "#16110c");
            r(ctx, x, y, w, h, rand() < 0.5 ? "#5a534c" : "#4a443e");
            hline(ctx, x, y, w - 1, "#6e665c");
        }
    }
}

/** Timber support frame, 160x64 (5x2 tiles): two posts against the walls and a cap beam. */
function drawTunnelTimbers(ctx: CanvasRenderingContext2D): void {
    const W = 160;
    const H = 64;
    for (const x of [1, W - 9]) {
        r(ctx, x, 6, 8, H - 6, TIMBER.d);
        vline(ctx, x, 6, H - 6, TIMBER.l);
        vline(ctx, x + 1, 6, H - 6, TIMBER.m);
        vline(ctx, x + 7, 6, H - 6, TIMBER.o);
        for (let y = 14; y < H; y += 11) p(ctx, x + 3 + (y % 3), y, TIMBER.o); // grain knots
        r(ctx, x, H - 2, 8, 2, TIMBER.o);
    }
    // Cap beam with iron bands and a wedge where it bites the posts
    r(ctx, 0, 0, W, 9, TIMBER.d);
    hline(ctx, 0, 0, W, TIMBER.h);
    hline(ctx, 0, 1, W, TIMBER.l);
    hline(ctx, 0, 8, W, TIMBER.o);
    for (let x = 6; x < W; x += 9) p(ctx, x, 4 + (x % 3), TIMBER.o);
    for (const x of [12, W - 20]) {
        r(ctx, x, 0, 3, 9, "#2a2a30");
        p(ctx, x + 1, 1, "#5a5a62");
    }
    for (const x of [9, W - 13]) {
        r(ctx, x, 9, 4, 3, TIMBER.m);
        p(ctx, x, 9, TIMBER.h);
    }
    // A drip hanging from the beam
    p(ctx, 82, 10, "#4a5a66");
    p(ctx, 82, 11, "#6a7a86");
}

export const TUNNEL_SPRITES: Record<string, ProceduralSpriteDef> = {
    tunnel_earth: { nativeWidth: 160, nativeHeight: 384, draw: drawTunnelEarth },
    tunnel_timbers: { nativeWidth: 160, nativeHeight: 64, draw: drawTunnelTimbers }
};
