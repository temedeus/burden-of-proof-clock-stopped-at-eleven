import { TILE_SIZE } from "./constants";
import type { TileMap } from "./TileMap";
import {
    TILE_ATTIC_WALL,
    TILE_BANISTER,
    TILE_BANISTER_POST,
    TILE_FENCE,
    TILE_FENCE_POST,
    TILE_FURNITURE,
    TILE_GATE_WALL,
    TILE_INVISIBLE_WALL,
    TILE_MANOR_WALL,
    TILE_PALE_ROCK_WALL,
    TILE_PALE_WALL,
    TILE_ROCK_WALL,
    TILE_WALL,
    TILE_WOOD_FENCE,
    TILE_WOOD_FENCE_POST,
    TILE_WOOD_FENCE_V,
    TILE_WOOD_WALL
} from "./TileTypes";

/**
 * Chase pathfinding on the tile grid.
 *
 * Characters are 2×2-tile boxes that collide with their feet row only (same rule
 * as the player), so a node is a tile-aligned box position whose two feet tiles
 * are free. `ChaseField` keeps a distance map flooded out from the target's node
 * and steers a chaser down it, cutting straight across whenever the way is clear.
 */

const SOLID_TILES = new Set<number>([
    TILE_WALL,
    TILE_WOOD_WALL,
    TILE_ROCK_WALL,
    TILE_PALE_ROCK_WALL,
    TILE_MANOR_WALL,
    TILE_GATE_WALL,
    TILE_ATTIC_WALL,
    TILE_PALE_WALL,
    TILE_INVISIBLE_WALL,
    TILE_FURNITURE,
    TILE_FENCE,
    TILE_FENCE_POST,
    TILE_BANISTER,
    TILE_BANISTER_POST,
    TILE_WOOD_FENCE,
    TILE_WOOD_FENCE_POST,
    TILE_WOOD_FENCE_V
]);

export function isSolidTile(tile: number): boolean {
    return SOLID_TILES.has(tile);
}

/** Sub-pixel slack so float drift past a tile edge doesn't drop the feet into the next row/column. */
const EDGE_EPSILON = 0.01;

/** True when a box at pixel (x, y) would stand its feet row on a solid or out-of-bounds tile. */
export function feetBlocked(map: TileMap, x: number, y: number, w: number, h: number): boolean {
    const row = Math.ceil((y + h) / TILE_SIZE - EDGE_EPSILON) - 1;
    if (row < 0 || row >= map.height) return true;
    const left = Math.floor(x / TILE_SIZE + EDGE_EPSILON);
    const right = Math.ceil((x + w) / TILE_SIZE - EDGE_EPSILON);
    for (let tx = left; tx < right; tx++) {
        if (tx < 0 || tx >= map.width) return true;
        if (SOLID_TILES.has(map.getTile(tx, row))) return true;
    }
    return false;
}

/** Straight-line walk from (x0, y0) to (x1, y1) keeps the box's feet clear the whole way. */
export function hasClearPath(
    map: TileMap,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    w: number,
    h: number
): boolean {
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.ceil(dist / (TILE_SIZE / 4)));
    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        if (feetBlocked(map, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, w, h)) return false;
    }
    return true;
}

const ORTHO_COST = 2;
const DIAG_COST = 3;
const NEIGHBORS: readonly [number, number, number][] = [
    [1, 0, ORTHO_COST],
    [-1, 0, ORTHO_COST],
    [0, 1, ORTHO_COST],
    [0, -1, ORTHO_COST],
    [1, 1, DIAG_COST],
    [1, -1, DIAG_COST],
    [-1, 1, DIAG_COST],
    [-1, -1, DIAG_COST]
];
/** How many steps down the field to look for a straight shortcut. */
const LOOKAHEAD = 8;
/** Re-flood at least this often so opened passages / fallen props are picked up. */
const MAX_FIELD_AGE = 1;

export class ChaseField {
    private map: TileMap | null = null;
    private boxW = TILE_SIZE * 2;
    private boxH = TILE_SIZE * 2;
    private walkable = new Uint8Array(0);
    private dist = new Int32Array(0);
    private goalNode = -1;
    private sinceFlood = Infinity;
    private goalX = 0;
    private goalY = 0;

    /**
     * @param repathSeconds minimum time between re-floods when the target changes tile.
     *   0 tracks the target perfectly; higher values let a chaser briefly lose the scent.
     */
    constructor(private repathSeconds = 0) {}

    /** Forget the current field (room change). */
    reset(): void {
        this.map = null;
        this.goalNode = -1;
        this.sinceFlood = Infinity;
    }

    /** Call once per frame with the target's box top-left. */
    update(dt: number, map: TileMap, goalX: number, goalY: number, boxW: number, boxH: number): void {
        this.sinceFlood += dt;
        this.goalX = goalX;
        this.goalY = goalY;
        const mapChanged = map !== this.map || boxW !== this.boxW || boxH !== this.boxH;
        if (mapChanged) {
            this.map = map;
            this.boxW = boxW;
            this.boxH = boxH;
        }
        const goal = this.nearestNode(goalX, goalY, (n) => this.walkableAt(n));
        const goalMoved = goal !== this.goalNode;
        if (
            mapChanged ||
            this.sinceFlood >= MAX_FIELD_AGE ||
            (goalMoved && this.sinceFlood >= this.repathSeconds)
        ) {
            this.flood(goalX, goalY);
        }
    }

    /**
     * Box top-left the chaser at (x, y) should head for next, or null when there
     * is no field (caller falls back to walking straight at the target).
     */
    steer(x: number, y: number): { x: number; y: number } | null {
        const map = this.map;
        if (!map || this.goalNode < 0) return null;
        // Wedged in a wall or furniture: get back onto open floor first, by the shortest way
        if (feetBlocked(map, x, y, this.boxW, this.boxH)) {
            const free = this.nearestNode(x, y, (n) => this.dist[n] >= 0);
            return free >= 0 ? this.nodePixel(free) : null;
        }
        if (hasClearPath(map, x, y, this.goalX, this.goalY, this.boxW, this.boxH)) {
            return { x: this.goalX, y: this.goalY };
        }

        const start = this.startNode(map, x, y);
        if (start < 0) return null;

        const path = [start];
        for (let i = 0; i < LOOKAHEAD; i++) {
            const next = this.downhill(path[path.length - 1]);
            if (next < 0) break;
            path.push(next);
        }

        // Furthest node on the descent we can walk to in a straight line
        for (let i = path.length - 1; i >= 1; i--) {
            const p = this.nodePixel(path[i]);
            if (hasClearPath(map, x, y, p.x, p.y, this.boxW, this.boxH)) return p;
        }
        const s = this.nodePixel(start);
        // Already standing on the start node: take the next step even without a clean line
        if (Math.hypot(s.x - x, s.y - y) < 1 && path.length > 1) return this.nodePixel(path[1]);
        return s;
    }

    /** True when a tile-aligned box at (x, y) is connected to the target. */
    reaches(x: number, y: number): boolean {
        if (!this.map) return false;
        const tx = Math.round(x / TILE_SIZE);
        const ty = Math.round(y / TILE_SIZE);
        if (tx < 0 || ty < 0 || tx >= this.map.width || ty >= this.map.height) return false;
        return this.dist[ty * this.map.width + tx] >= 0;
    }

    private get cols(): number {
        return this.map ? this.map.width : 0;
    }

    private nodePixel(n: number): { x: number; y: number } {
        return { x: (n % this.cols) * TILE_SIZE, y: Math.floor(n / this.cols) * TILE_SIZE };
    }

    private walkableAt(n: number): boolean {
        if (!this.map || n < 0) return false;
        const { x, y } = this.nodePixel(n);
        return !feetBlocked(this.map, x, y, this.boxW, this.boxH);
    }

    /**
     * Node to join the field from: among nearby reachable nodes the chaser can walk
     * straight onto, the one closest to the target; else simply the nearest one.
     */
    private startNode(map: TileMap, x: number, y: number): number {
        const cx = Math.floor(x / TILE_SIZE);
        const cy = Math.floor(y / TILE_SIZE);
        let best = -1;
        let bestDist = Infinity;
        for (let ty = cy - 1; ty <= cy + 2; ty++) {
            for (let tx = cx - 1; tx <= cx + 2; tx++) {
                if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) continue;
                const n = ty * map.width + tx;
                if (this.dist[n] < 0 || this.dist[n] >= bestDist) continue;
                const p = this.nodePixel(n);
                if (!hasClearPath(map, x, y, p.x, p.y, this.boxW, this.boxH)) continue;
                bestDist = this.dist[n];
                best = n;
            }
        }
        return best >= 0 ? best : this.nearestNode(x, y, (n) => this.dist[n] >= 0);
    }

    /** Closest tile-aligned node to a pixel position that passes `ok`, searched in growing rings. */
    private nearestNode(x: number, y: number, ok: (n: number) => boolean): number {
        const map = this.map;
        if (!map) return -1;
        const fx = x / TILE_SIZE;
        const fy = y / TILE_SIZE;
        const cx = Math.round(fx);
        const cy = Math.round(fy);
        for (let r = 0; r <= 3; r++) {
            let best = -1;
            let bestScore = Infinity;
            for (let ty = cy - r - 1; ty <= cy + r; ty++) {
                for (let tx = cx - r - 1; tx <= cx + r; tx++) {
                    if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) continue;
                    const n = ty * map.width + tx;
                    if (!ok(n)) continue;
                    const score = Math.hypot(tx - fx, ty - fy);
                    if (score < bestScore) {
                        bestScore = score;
                        best = n;
                    }
                }
            }
            if (best >= 0) return best;
        }
        return -1;
    }

    private canStep(n: number, dx: number, dy: number): number {
        const cols = this.cols;
        const tx = (n % cols) + dx;
        const ty = Math.floor(n / cols) + dy;
        if (tx < 0 || ty < 0 || tx >= cols || ty >= this.map!.height) return -1;
        const m = ty * cols + tx;
        if (!this.walkable[m]) return -1;
        // No corner cutting: both orthogonal neighbours must be open for a diagonal step
        if (dx !== 0 && dy !== 0) {
            if (!this.walkable[n + dx] || !this.walkable[n + dy * cols]) return -1;
        }
        return m;
    }

    private downhill(n: number): number {
        let best = -1;
        let bestDist = this.dist[n];
        for (const [dx, dy] of NEIGHBORS) {
            const m = this.canStep(n, dx, dy);
            if (m >= 0 && this.dist[m] >= 0 && this.dist[m] < bestDist) {
                bestDist = this.dist[m];
                best = m;
            }
        }
        return best;
    }

    /** Dijkstra (bucket queue, integer costs) from the target outwards. */
    private flood(goalX: number, goalY: number): void {
        const map = this.map!;
        const size = map.width * map.height;
        this.sinceFlood = 0;
        if (this.walkable.length !== size) {
            this.walkable = new Uint8Array(size);
            this.dist = new Int32Array(size);
        }
        for (let n = 0; n < size; n++) this.walkable[n] = this.walkableAt(n) ? 1 : 0;
        this.dist.fill(-1);

        this.goalNode = this.nearestNode(goalX, goalY, (n) => this.walkable[n] === 1);
        if (this.goalNode < 0) return;

        const buckets: number[][] = [[this.goalNode]];
        this.dist[this.goalNode] = 0;
        for (let cost = 0; cost < buckets.length; cost++) {
            const bucket = buckets[cost];
            if (!bucket) continue;
            for (const n of bucket) {
                if (this.dist[n] !== cost) continue;
                for (const [dx, dy, step] of NEIGHBORS) {
                    const m = this.canStep(n, dx, dy);
                    if (m < 0) continue;
                    const d = cost + step;
                    if (this.dist[m] >= 0 && this.dist[m] <= d) continue;
                    this.dist[m] = d;
                    (buckets[d] ??= []).push(m);
                }
            }
        }
    }
}
