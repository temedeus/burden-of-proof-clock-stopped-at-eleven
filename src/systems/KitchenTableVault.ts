import type { Facing } from "../entities/Player";
import type { Interactable } from "../world/Interactable";
import type { Room } from "../world/Room";
import { TILE_SIZE } from "../world/constants";
import { feetBlocked } from "../world/pathfinding";

/**
 * Finale chase in the kitchen: while the detective runs the stove corridor, Ytte
 * (stuck on the far side of the long tables) vaults straight over one and lands
 * in the corridor ahead of them, beside a stove. He fills the corridor, so the
 * only way past is to win the struggle there — which throws the boiling pot.
 */

/** Seconds in the air. */
export const VAULT_SECONDS = 0.65;
/** He glares a moment after landing before coming at the detective. */
export const VAULT_LAND_PAUSE = 0.45;
/** How long his taunt bubble stays up. */
export const VAULT_SHOUT_SECONDS = 1.4;
export const VAULT_SHOUT = "Going somewhere, Detective?";
/** Peak height of the jump arc (sprite lift, px). */
const ARC_PX = TILE_SIZE * 1.6;
/**
 * He lands at least this far ahead of where the detective will be when he touches
 * down (px) — they keep running while he's in the air…
 */
const LANDING_LEAD_PX = TILE_SIZE * 3;
/** Detective's run speed (px/s), to predict how far they get during the leap. */
const DEFAULT_PLAYER_SPEED = 180;
/** …and won't leap further than this sideways (px)… */
const MAX_LEAP_PX = TILE_SIZE * 9;
/** …or take off from further below the tables than this (px). */
const MAX_RUNUP_PX = TILE_SIZE * 5;

interface Box {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface VaultPlan {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
}

function centerX(b: Box): number {
    return b.x + b.width / 2;
}

function feetBottom(b: Box): number {
    return b.y + b.height;
}

/** The long (horizontal) kitchen tables' collision band: x span and top/bottom rows (px). */
function tableBand(room: Room): { left: number; right: number; top: number; bottom: number } | null {
    const tiles = room.interactables.filter((o) => o.spriteName === "kitchen_table").flatMap((o) => o.tiles);
    if (tiles.length === 0) return null;
    const xs = tiles.map((t) => t.x);
    const ys = tiles.map((t) => t.y);
    return {
        left: Math.min(...xs) * TILE_SIZE,
        right: (Math.max(...xs) + 1) * TILE_SIZE,
        top: Math.min(...ys) * TILE_SIZE,
        bottom: (Math.max(...ys) + 1) * TILE_SIZE
    };
}

function stoveCenters(room: Room): number[] {
    return room.interactables
        .filter((o: Interactable) => o.spriteName === "kitchen_stove" && o.tiles.length > 0)
        .map((o) => {
            const xs = o.tiles.map((t) => t.x);
            return ((Math.min(...xs) + Math.max(...xs) + 1) / 2) * TILE_SIZE;
        });
}

/**
 * Where Ytte should land to cut the detective off, or null when the vault doesn't
 * apply (not in the kitchen corridor / he isn't across the tables / nothing ahead).
 */
export function planKitchenVault(
    room: Room,
    ytte: Box,
    player: Box & { facing: Facing },
    playerSpeed = DEFAULT_PLAYER_SPEED
): VaultPlan | null {
    const band = tableBand(room);
    if (!band) return null;
    // Detective in the stove corridor behind the tables, Ytte on the far side of them
    if (feetBottom(player) > band.top) return null;
    if (ytte.y + ytte.height - TILE_SIZE < band.bottom) return null;
    if (feetBottom(ytte) > band.bottom + MAX_RUNUP_PX) return null;
    // Under the tables, or in the gap round their end (he vaults the table's end from there)
    const ytteCx = centerX(ytte);
    if (ytteCx < band.left - TILE_SIZE * 3 || ytteCx > band.right) return null;

    const playerCx = centerX(player);
    // Heading along the corridor: as faced, or (just climbing in from an end) toward the far end
    const dir =
        player.facing === "left" ? -1 : player.facing === "right" ? 1 : playerCx < (band.left + band.right) / 2 ? 1 : -1;

    // First stove clear ahead of where the detective will be when he lands
    const minLead = playerSpeed * VAULT_SECONDS + LANDING_LEAD_PX;
    const ahead = stoveCenters(room)
        .filter((cx) => (cx - playerCx) * dir >= minLead)
        .filter((cx) => cx > band.left && cx < band.right && Math.abs(cx - ytteCx) <= MAX_LEAP_PX)
        .sort((a, b) => Math.abs(a - playerCx) - Math.abs(b - playerCx));
    if (ahead.length === 0) return null;

    // Feet in the middle of the corridor so his body spans it — there's no slipping past
    const corridorFeetRow = Math.floor(band.top / TILE_SIZE) - 2;
    const toX = Math.round(ahead[0] - ytte.width / 2);
    const toY = (corridorFeetRow + 1) * TILE_SIZE - ytte.height;
    if (feetBlocked(room.map, toX, toY, ytte.width, ytte.height)) return null;
    return { fromX: ytte.x, fromY: ytte.y, toX, toY };
}

/** Timing and arc of the leap; Game applies the pose to Ytte. */
export class KitchenTableVault {
    plan: VaultPlan | null = null;
    /** Already happened this chase — he only pulls the trick once. */
    used = false;
    time = 0;
    /** Seconds left on his taunt bubble (starts on landing, outlives the leap). */
    shoutRemaining = 0;

    get active(): boolean {
        return this.plan !== null;
    }

    get airborne(): boolean {
        return this.active && this.time < VAULT_SECONDS;
    }

    start(plan: VaultPlan): void {
        this.plan = plan;
        this.used = true;
        this.time = 0;
    }

    /** Leap over early (he caught the detective while glaring): stop, keep the taunt up. */
    finish(): void {
        this.plan = null;
        this.time = 0;
    }

    cancel(): void {
        this.plan = null;
        this.time = 0;
        this.shoutRemaining = 0;
    }

    /**
     * Sprite offset from the take-off spot while airborne: the leap's progress plus
     * the arc lift. (His feet box stays at take-off so he draws in front of the table.)
     */
    offset(): { x: number; y: number } {
        if (!this.plan || !this.airborne) return { x: 0, y: 0 };
        const t = Math.min(1, this.time / VAULT_SECONDS);
        const ease = t * t * (3 - 2 * t);
        const lift = Math.sin(Math.PI * t) * ARC_PX;
        return {
            x: (this.plan.toX - this.plan.fromX) * ease,
            y: (this.plan.toY - this.plan.fromY) * ease - lift
        };
    }

    /** Advance; reports the landing and when he should give chase. */
    tick(dt: number): { landed: boolean; resume: boolean } {
        this.shoutRemaining = Math.max(0, this.shoutRemaining - dt);
        if (!this.plan) return { landed: false, resume: false };
        const before = this.time;
        this.time += dt;
        const landed = before < VAULT_SECONDS && this.time >= VAULT_SECONDS;
        if (landed) this.shoutRemaining = VAULT_SHOUT_SECONDS;
        const resume = this.time >= VAULT_SECONDS + VAULT_LAND_PAUSE;
        if (resume) this.plan = null;
        return { landed, resume };
    }
}
