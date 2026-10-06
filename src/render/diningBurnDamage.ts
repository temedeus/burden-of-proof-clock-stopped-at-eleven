/**
 * Permanent damage left in the dining room after the fire (shown once
 * `diningFireResolved` is set). The layout is derived from the same scripted
 * geometry the fire used — the panic route around the table, the hearth
 * landing, the tablecloth and rug ignition points — so the marks sit where the
 * flames were. Everything is deterministic, so nothing extra needs saving.
 */
import type { Room } from "../world/Room";
import type { Interactable } from "../world/Interactable";
import { TILE_SIZE } from "../world/constants";
import {
    diningHearthLandingPosition,
    diningTablePanicWaypoints,
    FIRE_TRAIL_STEP_PX
} from "../systems/DiningFireCutscene";
import type { DepthActor } from "./roomScene";
import { drawFireplaceColdFirebox, FIREPLACE_H, FIREPLACE_W } from "../assets/procedural/fireplace";

const PX = 2;

interface Mark {
    x: number;
    y: number;
    r: number;
    seed: number;
}

export interface DiningBurnLayout {
    floor: Mark[];
    rug: Mark[];
    cloth: Mark[];
    tableBottom: number;
    fireplace: Interactable | null;
}

function bounds(obj: Interactable): { x: number; y: number; w: number; h: number } | null {
    const tiles = obj.footprintTiles?.length ? obj.footprintTiles : obj.tiles;
    if (!tiles.length) return null;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const t of tiles) {
        minX = Math.min(minX, t.x);
        minY = Math.min(minY, t.y);
        maxX = Math.max(maxX, t.x);
        maxY = Math.max(maxY, t.y);
    }
    return { x: minX * TILE_SIZE, y: minY * TILE_SIZE, w: (maxX - minX + 1) * TILE_SIZE, h: (maxY - minY + 1) * TILE_SIZE };
}

function hash01(n: number): number {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

/** Where the scorch marks go, following the fire's scripted path. */
export function computeDiningBurnLayout(room: Room): DiningBurnLayout {
    const floor: Mark[] = [];
    const ENTITY = TILE_SIZE * 2;
    // In front of the hearth, where Ytte landed in the fire
    const landing = diningHearthLandingPosition(room, ENTITY, ENTITY);
    const route: { x: number; y: number }[] = [];
    if (landing) route.push({ x: landing.x + ENTITY / 2, y: landing.y + ENTITY });
    // Panic route (waypoints are entity centres; marks sit at the feet)
    for (const w of diningTablePanicWaypoints(room)) route.push({ x: w.x, y: w.y + ENTITY / 2 });
    let carry = 0;
    for (let i = 0; i < route.length; i++) {
        if (i === 0) {
            floor.push({ ...route[0], r: 22, seed: 0 });
            continue;
        }
        const a = route[i - 1];
        const b = route[i];
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        for (let d = FIRE_TRAIL_STEP_PX - carry; d <= len; d += FIRE_TRAIL_STEP_PX) {
            const k = d / len;
            const seed = floor.length + i * 17 + 1;
            // Scattered off the exact path; some steps left unburned
            if (hash01(seed * 1.9) < 0.22) continue;
            const nx = -(b.y - a.y) / len;
            const ny = (b.x - a.x) / len;
            const off = (hash01(seed * 2.3) - 0.5) * 18;
            floor.push({
                x: a.x + (b.x - a.x) * k + nx * off,
                y: a.y + (b.y - a.y) * k + ny * off * 0.5,
                r: 8 + hash01(seed) * 11,
                seed
            });
        }
        carry = (len + carry) % FIRE_TRAIL_STEP_PX;
    }

    const rug: Mark[] = [];
    const carpet = room.interactables.find((o) => o.id === "carpet");
    const cb = carpet ? bounds(carpet) : null;
    if (cb) {
        const pts: [number, number][] = [
            [0.1, 0.2],
            [0.9, 0.25],
            [0.15, 0.85],
            [0.85, 0.8]
        ];
        pts.forEach(([u, v], i) => rug.push({ x: cb.x + cb.w * u, y: cb.y + cb.h * v, r: 14 + hash01(i + 40) * 6, seed: i + 40 }));
    }

    const cloth: Mark[] = [];
    let tableBottom = 0;
    const table = room.interactables.find((o) => o.id === "dining_table");
    const tb = table ? bounds(table) : null;
    if (tb) {
        tableBottom = tb.y + tb.h;
        for (let i = 0; i < 6; i++) {
            const near = i % 2 === 0;
            cloth.push({
                x: tb.x + (tb.w * (i + 0.5)) / 6 + (near ? 6 : -6),
                y: tb.y + tb.h * (near ? 0.62 : 0.4),
                r: 8 + hash01(i + 70) * 5,
                seed: i + 70
            });
        }
    }

    return { floor, rug, cloth, tableBottom, fireplace: room.interactables.find((o) => o.id === "fireplace") ?? null };
}

/** Irregular charred patch: brown singe ring, charcoal body, black core, cold ash flecks. */
function drawChar(ctx: CanvasRenderingContext2D, m: Mark, ring: string, body: string, core: string): void {
    const lobes = 4;
    const blob = (scale: number, color: string) => {
        ctx.fillStyle = color;
        for (let l = 0; l < lobes; l++) {
            const ox = (hash01(m.seed * 3 + l) - 0.5) * m.r * 0.8;
            const oy = (hash01(m.seed * 5 + l) - 0.5) * m.r * 0.35;
            const rx = m.r * scale * (0.6 + 0.4 * hash01(m.seed * 7 + l));
            const ry = rx * 0.5;
            for (let dy = -ry; dy <= ry; dy += PX) {
                const k = dy / ry;
                const half = Math.round((rx * Math.sqrt(Math.max(0, 1 - k * k))) / PX) * PX;
                if (half <= 0) continue;
                const x = Math.round((m.x + ox) / PX) * PX;
                const y = Math.round((m.y + oy + dy) / PX) * PX;
                ctx.fillRect(x - half, y, half * 2, PX);
            }
        }
    };
    blob(1.25, ring);
    blob(0.8, body);
    blob(0.32, core);
    // Ash flecks and a couple of cracks
    for (let i = 0; i < 5; i++) {
        const a = hash01(m.seed * 11 + i) * Math.PI * 2;
        const d = hash01(m.seed * 13 + i) * m.r * 0.7;
        ctx.fillStyle = i % 2 ? "rgba(140,134,124,0.7)" : "rgba(100,96,90,0.6)";
        ctx.fillRect(Math.round((m.x + Math.cos(a) * d) / PX) * PX, Math.round((m.y + Math.sin(a) * d * 0.5) / PX) * PX, PX, PX);
    }
}

/** Floor + rug scorch marks and the smoke stain under the ceiling (drawn over rugs, under furniture). */
export function drawDiningFloorDamage(ctx: CanvasRenderingContext2D, layout: DiningBurnLayout, roomWidthPx: number): void {
    // Smoke stain creeping down the north wall from the ceiling
    for (let y = 0; y < TILE_SIZE * 1.5; y += PX) {
        const a = 0.32 * (1 - y / (TILE_SIZE * 1.5)) ** 1.6;
        ctx.fillStyle = `rgba(20,16,12,${a.toFixed(3)})`;
        ctx.fillRect(0, y, roomWidthPx, PX);
    }
    // Singed boards: brown halo, part-charred body, small black core
    for (const m of layout.floor) drawChar(ctx, m, "rgba(70,40,18,0.22)", "rgba(34,22,14,0.5)", "rgba(14,10,8,0.85)");
    for (const m of layout.rug) drawChar(ctx, m, "rgba(90,40,20,0.35)", "rgba(40,20,14,0.7)", "#140a08");
}

/** Burn holes in the tablecloth with singed brown edges (drawn over the table). */
export function drawTableclothDamage(ctx: CanvasRenderingContext2D, layout: DiningBurnLayout): void {
    for (const m of layout.cloth) drawChar(ctx, m, "rgba(140,96,52,0.55)", "rgba(58,34,18,0.9)", "#1a100a");
}

/**
 * Cold, ash-filled firebox plus soot on the chimneypiece: a dark plume above the firebox spreading up the
 * breast. (x, y, w, h) is the fireplace's on-screen draw box (96x112 art at 2x).
 */
export function drawFireplaceSoot(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    // The fire is out: cold ash in the grate
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(w / FIREPLACE_W, h / FIREPLACE_H);
    drawFireplaceColdFirebox(ctx);
    ctx.restore();
    const sx = w / 96;
    const sy = h / 112;
    const X = (nx: number) => Math.round(x + nx * sx);
    const Y = (ny: number) => Math.round(y + ny * sy);
    const band = (nx0: number, nx1: number, ny: number, alpha: number) => {
        ctx.fillStyle = `rgba(16,12,10,${alpha.toFixed(3)})`;
        ctx.fillRect(X(nx0), Y(ny), X(nx1) - X(nx0), PX);
    };
    // Soot tongues licking up from the opening: per-column streaks over the
    // frieze and the mantel-shelf front, darkest at the opening's lip
    const lip = 55;
    for (let nx = 23; nx < 73; nx += PX / sx) {
        const c = Math.abs(nx - 48) / 25;
        const reach = (10 + 14 * (1 - c) ** 0.7) * (0.55 + 0.45 * hash01(Math.floor(nx) * 3.7));
        for (let ny = lip; ny > lip - reach; ny -= PX / sy) {
            const k = (lip - ny) / reach;
            band(nx, nx + PX / sx, ny, (0.92 - 0.3 * c) * (1 - k) ** 0.6);
        }
    }
    // Marble pilasters blackened along their inner faces, ragged at the bottom
    for (let i = 0; i < 6; i++) {
        const reach = 18 + hash01(i * 5.1 + 2) * 16;
        for (let ny = 46; ny < 46 + reach; ny += PX / sy) {
            const a = 0.6 * (1 - (ny - 46) / reach) * (1 - i / 7);
            band(23 - i, 24 - i, ny, a);
            band(72 + i, 73 + i, ny, a);
        }
    }
    // Mantel shelf: underside line and a smoky smear across its white front
    band(14, 82, 44, 0.55);
    for (let ny = 38; ny < 44; ny += PX / sy) {
        for (let nx = 20; nx < 76; nx += PX / sx) {
            const c = Math.abs(nx - 48) / 28;
            band(nx, nx + PX / sx, ny, 0.55 * (1 - c * c) * (0.75 + 0.25 * hash01(nx * 1.3 + ny)));
        }
    }
    // Plume rising over the mantel shelf and up the breast/mirror
    for (let ny = 44; ny > 4; ny -= PX / sy) {
        const k = (44 - ny) / 40;
        const half = 22 - 12 * k;
        const wob = Math.sin(k * 9) * 2;
        band(48 - half + wob, 48 + half + wob, ny, 0.5 * (1 - k) ** 1.2);
    }
    // Soot smudges on the hearth slab in front of the opening
    for (let ny = 97; ny < 104; ny += PX / sy) {
        band(26, 70, ny, 0.3 * (1 - (ny - 97) / 7));
        band(34, 62, ny, 0.2 * (1 - (ny - 97) / 7));
    }
}

/** Depth actors for the damage that sits on top of furniture (tablecloth, fireplace). */
export function diningBurnActors(
    layout: DiningBurnLayout,
    fireplaceBox: { x: number; y: number; w: number; h: number } | null
): DepthActor[] {
    const actors: DepthActor[] = [];
    if (layout.cloth.length) {
        actors.push({ y: layout.tableBottom + 1, height: 1, render: (c) => drawTableclothDamage(c, layout) });
    }
    if (fireplaceBox) {
        const b = fireplaceBox;
        actors.push({ y: b.y + b.h + 0.5, height: 0, render: (c) => drawFireplaceSoot(c, b.x, b.y, b.w, b.h) });
    }
    return actors;
}
