/**
 * Outdoor ground, painted per tile so nothing repeats: lawn in soft mottled
 * tones with tufts of blades and the odd clover or wildflower; gravel as packed
 * mixed stones with wheel ruts on paths; detail over the sand; and a ragged
 * grass edge wherever a path or sand meets the lawn. Cellar rock floors are
 * laid as irregular flagstones.
 *
 * Baked once per map into an offscreen layer (re-baked if the tiles change).
 */
import { TILE_SIZE } from "../world/constants";
import {
    TILE_BANISTER,
    TILE_BANISTER_POST,
    TILE_DOOR,
    TILE_FENCE,
    TILE_FENCE_POST,
    TILE_FURNITURE,
    TILE_GATE_WALL,
    TILE_GRASS,
    TILE_GRAVEL,
    TILE_INVISIBLE_WALL,
    TILE_ROCK,
    TILE_SAND,
    TILE_WOOD_FENCE,
    TILE_WOOD_FENCE_POST,
    TILE_WOOD_FENCE_V
} from "../world/TileTypes";

/** Cells whose ground shows through (bare ground, under furniture/doors/rails, invisible walls). */
const PAINTED = new Set<number>([
    TILE_GRASS,
    TILE_GRAVEL,
    TILE_SAND,
    TILE_ROCK,
    TILE_FURNITURE,
    TILE_DOOR,
    TILE_INVISIBLE_WALL,
    TILE_GATE_WALL,
    TILE_FENCE,
    TILE_FENCE_POST,
    TILE_BANISTER,
    TILE_BANISTER_POST,
    TILE_WOOD_FENCE,
    TILE_WOOD_FENCE_POST,
    TILE_WOOD_FENCE_V
]);
import type { TileMap } from "../world/TileMap";
import { P } from "../assets/procedural/palette";

type Ground = typeof TILE_GRASS | typeof TILE_GRAVEL | typeof TILE_SAND | typeof TILE_ROCK;

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
    const tile = map.tiles[idx];
    let t = tile;
    const isGround = (v: number) => v === TILE_GRASS || v === TILE_GRAVEL || v === TILE_SAND || v === TILE_ROCK;
    if (!isGround(t)) t = map.terrainBeforeFurniture?.[idx] ?? -1;
    if (isGround(t)) return t as Ground;
    // Rails and invisible walls sit on the room's default ground (as the tile renderer's underlay does)
    if (PAINTED.has(tile)) {
        if (map.furnitureUnderlay === "grass") return TILE_GRASS;
        if (map.furnitureUnderlay === "gravel") return TILE_GRAVEL;
        if (map.furnitureUnderlay === "rock") return TILE_ROCK;
    }
    return null;
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, w = 1, h = 1): void {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

const GRASS_RAMP = ["#2c552a", "#33602f", "#3a6a36", "#42753d", "#4b7f44"];
const GRASS_TIP = "#5e9450";
const GRAVEL_RAMP = ["#4a4641", "#524d47", "#5a554e", "#615b53"];
const STONES = ["#7a746a", "#857e72", "#6e6a64", "#918a7e", "#6a645a", "#7e786e", "#8a7e6e", "#6e7276"];

/** Ramp index from layered noise at pixel (gx, gy) in room pixels, with a little dither. */
function rampIndex(gx: number, gy: number, salt: number, n: number): number {
    const T = TILE_SIZE;
    const v =
        noise(gx / T, gy / T, 4, salt) * 0.55 +
        noise(gx / T, gy / T, 1.3, salt + 1) * 0.3 +
        hash(gx, gy, salt + 2) * 0.15;
    return Math.max(0, Math.min(n - 1, Math.floor(v * n)));
}

/** Full lawn texture: soft mottled tones, then tufts of upright blades. */
function paintGrass(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const X = x * TILE_SIZE;
    const Y = y * TILE_SIZE;
    for (let cy = 0; cy < TILE_SIZE; cy += 2) {
        for (let cx = 0; cx < TILE_SIZE; cx += 2) {
            px(ctx, X + cx, Y + cy, GRASS_RAMP[rampIndex(X + cx, Y + cy, 3, GRASS_RAMP.length - 1)], 2, 2);
        }
    }
    const rand = tileRand(x, y, 1);
    // Tufts: a few blades fanning from one root, shaded dark at the base
    for (let i = 0; i < 11; i++) {
        const tx = X + 1 + Math.floor(rand() * 30);
        const ty = Y + 4 + Math.floor(rand() * 28);
        const local = rampIndex(tx, ty, 3, GRASS_RAMP.length - 1);
        const blades = 2 + Math.floor(rand() * 3);
        for (let b = 0; b < blades; b++) {
            const dx = b - Math.floor(blades / 2);
            const h = 2 + Math.floor(rand() * 3);
            const bx = tx + dx;
            px(ctx, bx, ty - 1, GRASS_RAMP[Math.max(0, local - 1)]);
            for (let k = 1; k < h; k++) {
                const lean = k === h - 1 && dx !== 0 ? Math.sign(dx) : 0;
                px(ctx, bx + lean, ty - 1 - k, k === h - 1 ? (rand() < 0.12 ? GRASS_TIP : GRASS_RAMP[Math.min(4, local + 2)]) : GRASS_RAMP[Math.min(4, local + 1)]);
            }
        }
    }
    // Rare clover patch or a few wildflowers
    const f = rand();
    if (f < 0.05) {
        const cx = X + 6 + Math.floor(rand() * 20);
        const cy = Y + 6 + Math.floor(rand() * 20);
        for (const [dx, dy] of [[0, 0], [3, 1], [1, 3], [-2, 2]] as const) {
            px(ctx, cx + dx, cy + dy, "#3e7a38", 2, 2);
            px(ctx, cx + dx, cy + dy, "#5a944e");
        }
    } else if (f < 0.11) {
        const colors = ["#e8e4d8", "#e0c860", "#c0a0d0"];
        const col = colors[Math.floor(rand() * colors.length)];
        for (let k = 0; k < 2 + Math.floor(rand() * 2); k++) {
            const fx = X + 4 + Math.floor(rand() * 24);
            const fy = Y + 4 + Math.floor(rand() * 24);
            px(ctx, fx, fy + 1, GRASS_RAMP[0], 1, 2);
            px(ctx, fx - 1, fy, col);
            px(ctx, fx + 1, fy, col);
            px(ctx, fx, fy - 1, col);
            px(ctx, fx, fy, "#d8a030");
        }
    }
}

/** Full gravel texture: packed small stones of mixed greys with highlights and contact shadows. */
function paintGravel(ctx: CanvasRenderingContext2D, map: TileMap, x: number, y: number): void {
    const X = x * TILE_SIZE;
    const Y = y * TILE_SIZE;
    for (let cy = 0; cy < TILE_SIZE; cy += 2) {
        for (let cx = 0; cx < TILE_SIZE; cx += 2) {
            px(ctx, X + cx, Y + cy, GRAVEL_RAMP[rampIndex(X + cx, Y + cy, 5, GRAVEL_RAMP.length)], 2, 2);
        }
    }
    const rand = tileRand(x, y, 2);
    // Stones on a jittered 4px lattice; density thins where the grit is finer
    for (let gy = 0; gy < TILE_SIZE; gy += 4) {
        for (let gx = (gy / 4) % 2 ? 2 : 0; gx < TILE_SIZE; gx += 4) {
            const dens = 0.55 + noise((X + gx) / TILE_SIZE, (Y + gy) / TILE_SIZE, 2, 8) * 0.4;
            if (rand() > dens) continue;
            const sx = X + gx + Math.floor(rand() * 2);
            const sy = Y + gy + Math.floor(rand() * 2);
            const big = rand() < 0.06;
            const w = big ? 4 : 2 + (rand() < 0.35 ? 1 : 0);
            const h = big ? 3 : rand() < 0.25 ? 1 : 2;
            const c = STONES[Math.floor(rand() * STONES.length)];
            px(ctx, sx, sy + h, "rgba(30,26,22,0.55)", w, 1); // contact shadow
            px(ctx, sx, sy, c, w, h);
            if (big) {
                px(ctx, sx, sy, GRAVEL_RAMP[1]); // round the corners
                px(ctx, sx + w - 1, sy, GRAVEL_RAMP[1]);
            }
            px(ctx, sx, sy, big ? "#a8a296" : "#9a948a"); // lit upper-left
        }
    }
    // Wheel ruts down the middle of a narrow vertical path (not open gravel floors)
    const vPath = groundAt(map, x - 1, y) === TILE_GRAVEL && groundAt(map, x + 1, y) === TILE_GRAVEL;
    const vRun = groundAt(map, x, y - 1) === TILE_GRAVEL || groundAt(map, x, y + 1) === TILE_GRAVEL;
    const narrow = groundAt(map, x - 2, y) !== TILE_GRAVEL || groundAt(map, x + 2, y) !== TILE_GRAVEL;
    if (vPath && vRun && narrow) {
        for (const rx of [6, 24]) {
            for (let yy = 0; yy < TILE_SIZE; yy++) {
                if (hash(x * 3 + rx, y * 32 + yy, 4) < 0.5) px(ctx, X + rx + Math.round(Math.sin((y * 32 + yy) / 23)), Y + yy, "rgba(36,32,28,0.22)", 3, 1);
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Cellar flagstones: courses of rectangular slabs of varied width
// ---------------------------------------------------------------------------

const COURSE = 24;
const SLAB_TONES = ["#34302d", "#3b3632", "#312d2a", "#3f3934", "#373330", "#35312d"];
const courseJoints = new Map<number, number[]>();

/** Vertical joint x positions for course `j` (cached; spans well past any room). */
function jointsFor(j: number): number[] {
    let joints = courseJoints.get(j);
    if (!joints) {
        joints = [];
        let x = -Math.floor(hash(j, 3, 51) * 30);
        let k = 0;
        while (x < 2000) {
            joints.push(x);
            x += 30 + Math.floor(hash(j, k++, 53) * 28);
        }
        courseJoints.set(j, joints);
    }
    return joints;
}

/** Slab containing pixel (gx, gy): ids plus distances to each edge. */
function slabAt(gx: number, gy: number): { id: number; top: number; bottom: number; left: number; right: number } {
    // Course boundaries wobble a pixel along their length
    const wob = Math.round(noise(gx / 9, gy / COURSE, 1, 57) * 2 - 1);
    const j = Math.floor((gy + wob) / COURSE);
    const y0 = j * COURSE - wob;
    const joints = jointsFor(j);
    let k = 0;
    while (k + 1 < joints.length && joints[k + 1] <= gx) k++;
    const jx = Math.round(noise(gx / COURSE, gy / 7, 1, 59) * 2 - 1);
    const left = gx - joints[k] - jx;
    const right = (joints[k + 1] ?? gx + 40) - gx + jx;
    return { id: j * 1009 + k, top: gy - y0, bottom: y0 + COURSE - gy, left, right };
}

function paintFlagstones(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const X = x * TILE_SIZE;
    const Y = y * TILE_SIZE;
    for (let py = 0; py < TILE_SIZE; py++) {
        for (let pxl = 0; pxl < TILE_SIZE; pxl++) {
            const gx = X + pxl;
            const gy = Y + py;
            const sl = slabAt(gx, gy);
            const t = hash(sl.id, 1, 41);
            let c = SLAB_TONES[Math.floor(t * SLAB_TONES.length)];
            const edge = Math.min(sl.top, sl.bottom, sl.left, sl.right);
            if (sl.top < 1 || sl.left < 1) c = "#17140f"; // mortar joint
            else if (Math.min(sl.top, sl.left) < 4 && Math.min(sl.bottom, sl.right) < 4 && hash(sl.id, 2, 61) < 0.5) c = "#1f1b16"; // chipped corner
            else if (sl.top < 2 || sl.left < 2) c = "#4c4640"; // lit arris
            else if (sl.bottom < 2 || sl.right < 2) c = "#2a2621"; // shadowed arris
            else {
                // Worn, slightly dished middle; pits and flecks
                if (edge > 6 && hash(sl.id, 3, 67) < 0.4) c = mixTone(c, 0.04);
                const n = hash(gx, gy, 43);
                if (n < 0.035) c = "#2c2824";
                else if (n > 0.982) c = "#58514a";
            }
            px(ctx, gx, gy, c);
            // Damp creeping across some slabs
            const damp = noise(gx / TILE_SIZE, gy / TILE_SIZE, 3.5, 47);
            if (damp > 0.7) px(ctx, gx, gy, `rgba(20,26,34,${((damp - 0.7) * 1.2).toFixed(3)})`);
        }
    }
}

/** Lighten a #rrggbb colour slightly. */
function mixTone(c: string, k: number): string {
    const v = [1, 3, 5].map((i) => Math.min(255, Math.round(parseInt(c.slice(i, i + 2), 16) * (1 + k))));
    return `#${v.map((n) => n.toString(16).padStart(2, "0")).join("")}`;
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
 * Where a path or sand tile meets lawn: an irregular grass edge creeping onto
 * the path, upright blades along it, and a little grit spilled onto the grass.
 */
function edgeFringe(ctx: CanvasRenderingContext2D, map: TileMap, x: number, y: number, ground: Ground): void {
    const X = x * TILE_SIZE;
    const Y = y * TILE_SIZE;
    const T = TILE_SIZE;
    const grit = ground === TILE_SAND ? P.sandDark : "#8a847a";
    const sides: [number, number, "n" | "s" | "w" | "e"][] = [[0, -1, "n"], [0, 1, "s"], [-1, 0, "w"], [1, 0, "e"]];
    for (const [dx, dy, side] of sides) {
        if (groundAt(map, x + dx, y + dy) !== TILE_GRASS) continue;
        const rand = tileRand(x * 4 + dx, y * 4 + dy, 11);
        for (let i = 0; i < T; i++) {
            // Ragged edge depth follows smooth noise along the seam, plus jitter
            const along = side === "n" || side === "s" ? X + i : Y + i;
            const across = side === "n" || side === "s" ? Y : X;
            const depth = Math.max(0, Math.round(noise(along / 7, across / 7, 1, 21) * 4 + rand() * 1.6 - 0.6));
            for (let d = 0; d < depth; d++) {
                const gx = side === "w" ? X + d : side === "e" ? X + T - 1 - d : X + i;
                const gy = side === "n" ? Y + d : side === "s" ? Y + T - 1 - d : Y + i;
                px(ctx, gx, gy, GRASS_RAMP[rampIndex(gx, gy, 3, GRASS_RAMP.length - 1)]);
            }
            // Upright blades poking out past the edge
            if (rand() < 0.35) {
                const h = 1 + Math.floor(rand() * 3);
                const col = GRASS_RAMP[2 + Math.floor(rand() * 3)];
                if (side === "s") px(ctx, X + i, Y + T - depth - h, col, 1, h);
                else if (side === "n") px(ctx, X + i, Y + depth, col, 1, Math.min(h, 2));
                else if (side === "w") px(ctx, X + depth + Math.floor(rand() * 2), Y + i - h + 1, col, 1, h);
                else px(ctx, X + T - 1 - depth - Math.floor(rand() * 2), Y + i - h + 1, col, 1, h);
            }
            // Grit kicked onto the grass side
            if (rand() < 0.1) {
                const g = 1 + Math.floor(rand() * 3);
                if (side === "n") px(ctx, X + i, Y - g, grit);
                else if (side === "s") px(ctx, X + i, Y + T - 1 + g, grit);
                else if (side === "w") px(ctx, X - g, Y + i, grit);
                else px(ctx, X + T - 1 + g, Y + i, grit);
            }
        }
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
    // Ground under furniture, doors and rails is painted too; their art is drawn on top afterwards.
    const bare = (x: number, y: number) => PAINTED.has(map.tiles[y * map.width + x]);
    for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
            if (!bare(x, y)) continue;
            const g = groundAt(map, x, y);
            if (g === TILE_GRASS) paintGrass(ctx, x, y);
            else if (g === TILE_GRAVEL) paintGravel(ctx, map, x, y);
            else if (g === TILE_SAND) sandDetail(ctx, x, y);
            else if (g === TILE_ROCK) paintFlagstones(ctx, x, y);
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

/**
 * Draw the outdoor ground layer. Returns false (and draws nothing) for rooms
 * without grass, gravel or sand.
 */
export function drawGroundDetail(ctx: CanvasRenderingContext2D, map: TileMap): boolean {
    const key = tilesKey(map);
    let entry = cache.get(map);
    if (!entry || entry.key !== key) {
        entry = { key, layer: bake(map) };
        cache.set(map, entry);
    }
    if (!entry.layer) return false;
    ctx.drawImage(entry.layer, 0, 0);
    return true;
}
