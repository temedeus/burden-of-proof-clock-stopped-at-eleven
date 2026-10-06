/**
 * Outdoor ground detail over the base grass / gravel / sand tiles: soft tone
 * patches and extra blades so the lawn stops repeating, the odd clover and
 * wildflower, pebbles and wheel ruts on paths, and grass fringing every
 * path / sand edge so they no longer meet the lawn in a hard line.
 *
 * Baked once per map into an offscreen layer (re-baked if the tiles change).
 */
import { TILE_SIZE } from "../world/constants";
import { TILE_GRASS, TILE_GRAVEL, TILE_SAND } from "../world/TileTypes";
import type { TileMap } from "../world/TileMap";
import { P } from "../assets/procedural/palette";

type Ground = typeof TILE_GRASS | typeof TILE_GRAVEL | typeof TILE_SAND;

const cache = new WeakMap<TileMap, { key: number; layer: HTMLCanvasElement | null }>();

function tilesKey(map: TileMap): number {
    let h = map.width * 31 + map.height;
    for (let i = 0; i < map.tiles.length; i++) h = (h * 33 + map.tiles[i] * (i + 7)) | 0;
    return h;
}

function hash(x: number, y: number, s: number): number {
    const v = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
    return v - Math.floor(v);
}

/** Tiny deterministic RNG per tile. */
function tileRand(x: number, y: number, salt: number): () => number {
    let s = (Math.floor(hash(x, y, salt) * 4294967296) ^ 0x9e3779b9) >>> 0;
    return () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Smooth value noise sampled on a coarse grid (cells of `cell` tiles). */
function noise(x: number, y: number, cell: number, salt: number): number {
    const gx = x / cell;
    const gy = y / cell;
    const x0 = Math.floor(gx);
    const y0 = Math.floor(gy);
    const fx = gx - x0;
    const fy = gy - y0;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const a = hash(x0, y0, salt);
    const b = hash(x0 + 1, y0, salt);
    const c = hash(x0, y0 + 1, salt);
    const d = hash(x0 + 1, y0 + 1, salt);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

function groundAt(map: TileMap, x: number, y: number): Ground | null {
    if (x < 0 || y < 0 || x >= map.width || y >= map.height) return null;
    const idx = y * map.width + x;
    let t = map.tiles[idx];
    if (t !== TILE_GRASS && t !== TILE_GRAVEL && t !== TILE_SAND) t = map.terrainBeforeFurniture?.[idx] ?? -1;
    return t === TILE_GRASS || t === TILE_GRAVEL || t === TILE_SAND ? (t as Ground) : null;
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, w = 1, h = 1): void {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

function grassDetail(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const X = x * TILE_SIZE;
    const Y = y * TILE_SIZE;
    const rand = tileRand(x, y, 1);
    // Broad mottling: whole 4px cells darker or lighter following coarse noise
    for (let cy = 0; cy < TILE_SIZE; cy += 4) {
        for (let cx = 0; cx < TILE_SIZE; cx += 4) {
            const n = noise(x + cx / TILE_SIZE, y + cy / TILE_SIZE, 3.5, 3) - 0.5;
            if (Math.abs(n) < 0.12) continue;
            ctx.fillStyle = n > 0 ? `rgba(120,190,90,${(n * 0.22).toFixed(3)})` : `rgba(10,30,12,${(-n * 0.3).toFixed(3)})`;
            ctx.fillRect(X + cx, Y + cy, 4, 4);
        }
    }
    // Extra blades in the local shade
    const lush = noise(x, y, 2.5, 9);
    for (let i = 0; i < 14; i++) {
        const bx = X + Math.floor(rand() * 31);
        const by = Y + 2 + Math.floor(rand() * 29);
        const len = 2 + Math.floor(rand() * 3);
        px(ctx, bx, by - len, rand() < lush ? P.grassLight : P.grassDark, 1, len);
        if (rand() < 0.3) px(ctx, bx + 1, by - len + 1, P.grassHi);
    }
    // Rare clover patch or wildflowers
    const f = rand();
    if (f < 0.06) {
        const cx = X + 6 + Math.floor(rand() * 20);
        const cy = Y + 6 + Math.floor(rand() * 20);
        for (const [dx, dy] of [[0, 0], [3, 1], [1, 3], [-2, 2]] as const) {
            px(ctx, cx + dx, cy + dy, "#4e8a44", 2, 2);
            px(ctx, cx + dx, cy + dy, "#6aa85a");
        }
    } else if (f < 0.13) {
        const colors = ["#f0ece0", "#e8d070", "#c8a0d8"];
        const col = colors[Math.floor(rand() * colors.length)];
        for (let k = 0; k < 3; k++) {
            const fx = X + 4 + Math.floor(rand() * 24);
            const fy = Y + 4 + Math.floor(rand() * 24);
            px(ctx, fx, fy + 1, P.grassDark, 1, 2);
            px(ctx, fx - 1, fy, col);
            px(ctx, fx + 1, fy, col);
            px(ctx, fx, fy - 1, col);
            px(ctx, fx, fy, "#e8b030");
        }
    }
}

function gravelDetail(ctx: CanvasRenderingContext2D, map: TileMap, x: number, y: number): void {
    const X = x * TILE_SIZE;
    const Y = y * TILE_SIZE;
    const rand = tileRand(x, y, 2);
    // Gentle tone drift so long paths don't tile visibly
    for (let cy = 0; cy < TILE_SIZE; cy += 4) {
        for (let cx = 0; cx < TILE_SIZE; cx += 4) {
            const n = noise(x + cx / TILE_SIZE, y + cy / TILE_SIZE, 3, 5) - 0.5;
            ctx.fillStyle = n > 0 ? `rgba(160,150,135,${(n * 0.16).toFixed(3)})` : `rgba(20,18,15,${(-n * 0.2).toFixed(3)})`;
            ctx.fillRect(X + cx, Y + cy, 4, 4);
        }
    }
    for (let i = 0; i < 10; i++) {
        const bx = X + Math.floor(rand() * 30);
        const by = Y + Math.floor(rand() * 30);
        const lit = rand() < 0.5;
        px(ctx, bx, by, lit ? P.gravelLight : P.gravelDark, 2, 1 + Math.floor(rand() * 2));
        if (lit) px(ctx, bx, by, "#a8a39c");
    }
    // Wheel ruts down the middle of a narrow vertical path (not open gravel floors)
    const vPath = groundAt(map, x - 1, y) === TILE_GRAVEL && groundAt(map, x + 1, y) === TILE_GRAVEL;
    const vRun = groundAt(map, x, y - 1) === TILE_GRAVEL || groundAt(map, x, y + 1) === TILE_GRAVEL;
    const narrow = groundAt(map, x - 2, y) !== TILE_GRAVEL || groundAt(map, x + 2, y) !== TILE_GRAVEL;
    if (vPath && vRun && narrow) {
        for (const rx of [6, 24]) {
            for (let yy = 0; yy < TILE_SIZE; yy += 1) {
                if (hash(x * 3 + rx, y * 32 + yy, 4) < 0.55) px(ctx, X + rx + Math.round(Math.sin((y * 32 + yy) / 23) * 1), Y + yy, "rgba(40,36,32,0.28)", 2, 1);
            }
        }
    }
}

function sandDetail(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const X = x * TILE_SIZE;
    const Y = y * TILE_SIZE;
    const rand = tileRand(x, y, 3);
    for (let cy = 0; cy < TILE_SIZE; cy += 4) {
        for (let cx = 0; cx < TILE_SIZE; cx += 4) {
            const n = noise(x + cx / TILE_SIZE, y + cy / TILE_SIZE, 3, 7) - 0.5;
            ctx.fillStyle = n > 0 ? `rgba(240,220,170,${(n * 0.2).toFixed(3)})` : `rgba(90,60,30,${(-n * 0.22).toFixed(3)})`;
            ctx.fillRect(X + cx, Y + cy, 4, 4);
        }
    }
    // Hoof prints: small dark crescents, the odd one per tile
    if (rand() < 0.45) {
        const hx = X + 4 + Math.floor(rand() * 22);
        const hy = Y + 4 + Math.floor(rand() * 22);
        for (const [dx, dy] of [[0, 0], [6, 3]] as const) {
            px(ctx, hx + dx, hy + dy, P.sandDark, 3, 1);
            px(ctx, hx + dx - 1, hy + dy + 1, P.sandDark, 1, 2);
            px(ctx, hx + dx + 3, hy + dy + 1, P.sandDark, 1, 2);
            px(ctx, hx + dx, hy + dy + 1, "rgba(120,90,50,0.35)", 3, 2);
        }
    }
    for (let i = 0; i < 6; i++) {
        px(ctx, X + Math.floor(rand() * 31), Y + Math.floor(rand() * 31), rand() < 0.5 ? P.sandHi : P.sandDark);
    }
}

/**
 * Grass fringe where a path or sand tile meets lawn: blades lean over the edge
 * onto the path, a little grit spills back onto the grass.
 */
function edgeFringe(ctx: CanvasRenderingContext2D, map: TileMap, x: number, y: number, ground: Ground): void {
    const X = x * TILE_SIZE;
    const Y = y * TILE_SIZE;
    const grit = ground === TILE_SAND ? P.sandDark : P.gravelLight;
    const sides: [number, number, "n" | "s" | "w" | "e"][] = [[0, -1, "n"], [0, 1, "s"], [-1, 0, "w"], [1, 0, "e"]];
    for (const [dx, dy, side] of sides) {
        if (groundAt(map, x + dx, y + dy) !== TILE_GRASS) continue;
        const rand = tileRand(x * 4 + dx, y * 4 + dy, 11);
        for (let i = 0; i < TILE_SIZE; i++) {
            const depth = Math.floor(rand() * 4) + (rand() < 0.2 ? 2 : 0);
            if (depth === 0) continue;
            const col = rand() < 0.5 ? P.grass : rand() < 0.5 ? P.grassDark : P.grassLight;
            if (side === "n") px(ctx, X + i, Y, col, 1, depth);
            else if (side === "s") px(ctx, X + i, Y + TILE_SIZE - depth, col, 1, depth);
            else if (side === "w") px(ctx, X, Y + i, col, depth, 1);
            else px(ctx, X + TILE_SIZE - depth, Y + i, col, depth, 1);
            // Grit kicked onto the grass side
            if (rand() < 0.12) {
                const g = 1 + Math.floor(rand() * 3);
                if (side === "n") px(ctx, X + i, Y - g, grit);
                else if (side === "s") px(ctx, X + i, Y + TILE_SIZE - 1 + g, grit);
                else if (side === "w") px(ctx, X - g, Y + i, grit);
                else px(ctx, X + TILE_SIZE - 1 + g, Y + i, grit);
            }
        }
        // Darker soil line right at the seam
        ctx.fillStyle = "rgba(30,24,16,0.18)";
        if (side === "n") ctx.fillRect(X, Y, TILE_SIZE, 1);
        else if (side === "s") ctx.fillRect(X, Y + TILE_SIZE - 1, TILE_SIZE, 1);
        else if (side === "w") ctx.fillRect(X, Y, 1, TILE_SIZE);
        else ctx.fillRect(X + TILE_SIZE - 1, Y, 1, TILE_SIZE);
    }
}

function bake(map: TileMap): HTMLCanvasElement | null {
    let any = false;
    for (let y = 0; y < map.height && !any; y++) {
        for (let x = 0; x < map.width; x++) {
            if (groundAt(map, x, y) !== null) {
                any = true;
                break;
            }
        }
    }
    if (!any) return null;
    const layer = document.createElement("canvas");
    layer.width = map.width * TILE_SIZE;
    layer.height = map.height * TILE_SIZE;
    const ctx = layer.getContext("2d")!;
    // Only bare ground tiles get detail; furniture keeps its own art
    const bare = (x: number, y: number) => {
        const t = map.tiles[y * map.width + x];
        return t === TILE_GRASS || t === TILE_GRAVEL || t === TILE_SAND;
    };
    for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
            if (!bare(x, y)) continue;
            const g = groundAt(map, x, y);
            if (g === TILE_GRASS) grassDetail(ctx, x, y);
            else if (g === TILE_GRAVEL) gravelDetail(ctx, map, x, y);
            else if (g === TILE_SAND) sandDetail(ctx, x, y);
        }
    }
    for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
            const g = groundAt(map, x, y);
            if (bare(x, y) && (g === TILE_GRAVEL || g === TILE_SAND)) edgeFringe(ctx, map, x, y, g);
        }
    }
    return layer;
}

/** Draw the outdoor ground detail layer (no-op for rooms without grass, gravel or sand). */
export function drawGroundDetail(ctx: CanvasRenderingContext2D, map: TileMap): void {
    const key = tilesKey(map);
    let entry = cache.get(map);
    if (!entry || entry.key !== key) {
        entry = { key, layer: bake(map) };
        cache.set(map, entry);
    }
    if (entry.layer) ctx.drawImage(entry.layer, 0, 0);
}
