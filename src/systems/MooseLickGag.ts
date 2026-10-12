import type { Facing, Player } from "../entities/Player";
import { MOOSE_FACE_DURATION } from "../entities/Player";
import type { NPC } from "../entities/NPC";
import type { Interactable } from "../world/Interactable";
import type { TileMap } from "../world/TileMap";
import { TILE_SIZE } from "../world/constants";

/** Stuffed-moose easter egg: walk to its west side, get licked, wipe off the drool. */

const WALK_SPEED = 120;
/** How far the player tucks in beside the plaque (sprites have transparent side margins). */
const STAND_OVERLAP_PX = 20;
/** Head lean toward the west (radians, negative = counter-clockwise). */
export const MOOSE_MAX_TILT = -0.28;

// Timeline in seconds after the player arrives beside the moose
const TILT_IN_END = 0.4;
const TONGUE_OUT_END = 0.65;
const SLURP_END = 1.15;
const TONGUE_IN_END = 1.35;
const TILT_OUT_END = 1.75;
const PLAYER_TURN_AT = 1.5;
const GAG_END = PLAYER_TURN_AT + MOOSE_FACE_DURATION;

export interface MooseLickTick {
    playLick?: boolean;
    done?: boolean;
}

function smoothstep(t: number): number {
    const x = Math.max(0, Math.min(1, t));
    return x * x * (3 - 2 * x);
}

function ramp(t: number, from: number, to: number): number {
    return smoothstep((t - from) / (to - from));
}

export class MooseLickGag {
    active = false;
    private waypoints: { x: number; y: number }[] = [];
    private t = 0;
    private soundPlayed = false;

    start(player: Player, moose: Interactable, map: TileMap, npcs: NPC[]): void {
        const tiles = moose.footprintTiles?.length ? moose.footprintTiles : moose.tiles;
        const minX = Math.min(...tiles.map((t) => t.x));
        const maxY = Math.max(...tiles.map((t) => t.y));
        const targetX = minX * TILE_SIZE - player.width + STAND_OVERLAP_PX;
        // Feet half a row below the plaque base keeps the face near the muzzle; else level with the base
        const candidates = [
            (maxY + 1.5) * TILE_SIZE - player.height,
            (maxY + 1) * TILE_SIZE - player.height
        ];
        const targetY =
            candidates.find((y) => !player.wouldCollideAt(targetX, y, map, npcs)) ?? candidates[1];

        this.waypoints = [
            { x: targetX, y: player.y },
            { x: targetX, y: targetY }
        ];
        this.t = 0;
        this.soundPlayed = false;
        this.active = true;
        player.mooseLickT = null;
    }

    private get walking(): boolean {
        return this.waypoints.length > 0;
    }

    update(dt: number, player: Player): MooseLickTick {
        if (!this.active) return {};

        if (this.walking) {
            this.walk(dt, player);
            return {};
        }

        this.t += dt;
        const tick: MooseLickTick = {};
        if (!this.soundPlayed && this.t >= TILT_IN_END) {
            this.soundPlayed = true;
            tick.playLick = true;
        }
        if (this.t >= PLAYER_TURN_AT) {
            player.facing = "down";
            player.mooseLickT = this.t - PLAYER_TURN_AT;
        }
        if (this.t >= GAG_END) {
            player.mooseLickT = null;
            this.active = false;
            tick.done = true;
        }
        return tick;
    }

    private walk(dt: number, player: Player): void {
        let budget = WALK_SPEED * dt;
        while (budget > 0 && this.waypoints.length > 0) {
            const wp = this.waypoints[0];
            const dx = wp.x - player.x;
            const dy = wp.y - player.y;
            const dist = Math.hypot(dx, dy);
            if (dist <= budget) {
                player.x = wp.x;
                player.y = wp.y;
                budget -= dist;
                this.waypoints.shift();
                continue;
            }
            player.facing = facingFor(dx, dy);
            player.x += (dx / dist) * budget;
            player.y += (dy / dist) * budget;
            budget = 0;
        }
        if (this.waypoints.length > 0) {
            player.advanceCutsceneWalk(dt);
        } else {
            player.isMoving = false;
            player.facing = "right";
        }
    }

    /** Current head tilt in radians (0 when idle). */
    get tiltAngle(): number {
        if (!this.active || this.walking) return 0;
        const t = this.t;
        if (t < TONGUE_IN_END) return MOOSE_MAX_TILT * ramp(t, 0, TILT_IN_END);
        return MOOSE_MAX_TILT * (1 - ramp(t, TONGUE_IN_END, TILT_OUT_END));
    }

    /** 0 tongue in … 1 fully reaching the player's face. */
    get tongueExtension(): number {
        if (!this.active || this.walking) return 0;
        const t = this.t;
        if (t < SLURP_END) return ramp(t, TILT_IN_END, TONGUE_OUT_END);
        return 1 - ramp(t, SLURP_END, TONGUE_IN_END);
    }

    /** 0 chin … 1 forehead: where the tongue tip is on the face. */
    get slurp(): number {
        if (!this.active || this.walking) return 0;
        return ramp(this.t, TONGUE_OUT_END, SLURP_END);
    }
}

function facingFor(dx: number, dy: number): Facing {
    if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? "right" : "left";
    return dy > 0 ? "down" : "up";
}
