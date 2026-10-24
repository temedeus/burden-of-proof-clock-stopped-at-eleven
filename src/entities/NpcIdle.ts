import type { CharacterPose } from "../assets/procedural/characters";
import { TILE_SIZE } from "../world/constants";
import { hasClearPath } from "../world/pathfinding";
import type { TileMap } from "../world/TileMap";
import type { Facing } from "./Player";

/** How far (px) an idle NPC strays from where they were standing. */
export const WANDER_RADIUS = TILE_SIZE * 1.25;
const WANDER_SPEED = 26;
const PAUSE_MIN = 1.5;
const PAUSE_MAX = 4.5;
/** Chance, each time a pause ends, of a scratch instead of a stroll — rare enough to stay calm. */
const SCRATCH_CHANCE = 0.15;
/** Chance of a stroll (otherwise they just keep standing a while longer). */
const WALK_CHANCE = 0.65;
const SCRATCH_SECONDS = 1.8;
const SCRATCH_FPS = 5;
/** Give up a stroll that stops making progress (bumped into someone). */
const STUCK_SECONDS = 0.6;

/** Anything an idle stroll must not walk into (the player, other NPCs). */
export interface IdleObstacle {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** The parts of an NPC the idle behaviour drives. */
export interface IdleBody {
    x: number;
    y: number;
    width: number;
    height: number;
    getFacing(): Facing;
    setFacing(facing: Facing): void;
    animateWalk(dt: number, dx: number, dy: number): void;
    wouldCollideAt(x: number, y: number, map: TileMap): boolean;
}

type IdleState =
    | { kind: "pause"; remaining: number }
    | { kind: "walk"; toX: number; toY: number; stuck: number }
    | { kind: "scratch"; what: "head" | "butt"; time: number; restoreFacing: Facing };

/** Feet-to-feet offset between `a` (standing at ax, ay) and `b`. */
function feetGap(ax: number, ay: number, a: IdleObstacle, b: IdleObstacle): { dx: number; dy: number } {
    return {
        dx: Math.abs(ax + a.width / 2 - (b.x + b.width / 2)),
        dy: Math.abs(ay + a.height - (b.y + b.height))
    };
}

/** Feet this close count as bumping into each other (the player can get wedged otherwise). */
function feetTooClose(gap: { dx: number; dy: number }): boolean {
    return gap.dx < TILE_SIZE * 1.5 && gap.dy < TILE_SIZE * 1.1;
}

/** Stepping to (nx, ny) would crowd `o` — moving away from someone already close is fine. */
function crowds(nx: number, ny: number, body: IdleObstacle, o: IdleObstacle): boolean {
    const next = feetGap(nx, ny, body, o);
    if (!feetTooClose(next)) return false;
    const now = feetGap(body.x, body.y, body, o);
    return Math.hypot(next.dx, next.dy) < Math.hypot(now.dx, now.dy);
}

/**
 * Ambient life for idle NPCs: short strolls around where they stand, back to their
 * authored facing, and the occasional head or backside scratch.
 */
export class NpcIdle {
    private anchorX = NaN;
    private anchorY = NaN;
    private homeFacing: Facing = "down";
    /** Where the last idle step left the NPC — any other position means they were moved. */
    private lastX = NaN;
    private lastY = NaN;
    private state: IdleState;

    constructor(private readonly random: () => number = Math.random) {
        this.state = { kind: "pause", remaining: this.pauseSeconds() };
    }

    /** Pose override while scratching, otherwise null. */
    get pose(): CharacterPose | null {
        if (this.state.kind !== "scratch") return null;
        const frame = Math.floor(this.state.time * SCRATCH_FPS) % 2 === 0 ? "a" : "b";
        return `scratch_${this.state.what}_${frame}`;
    }

    get walking(): boolean {
        return this.state.kind === "walk";
    }

    /** Stop whatever they were doing (talked to, scared, cutscene) and stand still a while. */
    interrupt(body: IdleBody): void {
        if (this.state.kind === "scratch") body.setFacing(this.state.restoreFacing);
        this.state = { kind: "pause", remaining: this.pauseSeconds() };
    }

    update(dt: number, body: IdleBody, map: TileMap, obstacles: readonly IdleObstacle[]): void {
        // Placed somewhere new (spawn, cutscene, save restore): wander around there instead
        if (body.x !== this.lastX || body.y !== this.lastY) {
            this.anchorX = body.x;
            this.anchorY = body.y;
            this.homeFacing = body.getFacing();
            if (this.state.kind === "walk") this.state = { kind: "pause", remaining: this.pauseSeconds() };
        }

        switch (this.state.kind) {
            case "pause":
                this.state.remaining -= dt;
                if (this.state.remaining <= 0) this.chooseNext(body, map);
                break;
            case "walk":
                this.stepWalk(dt, body, map, obstacles);
                break;
            case "scratch":
                this.state.time += dt;
                if (this.state.time >= SCRATCH_SECONDS) {
                    body.setFacing(this.state.restoreFacing);
                    this.state = { kind: "pause", remaining: this.pauseSeconds() };
                }
                break;
        }

        this.lastX = body.x;
        this.lastY = body.y;
    }

    private pauseSeconds(): number {
        return PAUSE_MIN + this.random() * (PAUSE_MAX - PAUSE_MIN);
    }

    private chooseNext(body: IdleBody, map: TileMap): void {
        const roll = this.random();
        if (roll < SCRATCH_CHANCE) {
            this.startScratch(body);
            return;
        }
        if (roll < SCRATCH_CHANCE + WALK_CHANCE) {
            const target = this.pickTarget(body, map);
            if (target) {
                this.state = { kind: "walk", toX: target.x, toY: target.y, stuck: 0 };
                return;
            }
        }
        this.state = { kind: "pause", remaining: this.pauseSeconds() };
    }

    private startScratch(body: IdleBody): void {
        const what = this.random() < 0.5 ? "head" : "butt";
        const restoreFacing = body.getFacing();
        // A backside scratch reads from behind or in profile, not face-on
        if (what === "butt" && restoreFacing === "down") {
            const r = this.random();
            body.setFacing(r < 0.34 ? "up" : r < 0.67 ? "left" : "right");
        }
        this.state = { kind: "scratch", what, time: 0, restoreFacing };
    }

    private pickTarget(body: IdleBody, map: TileMap): { x: number; y: number } | null {
        for (let attempt = 0; attempt < 6; attempt++) {
            const angle = this.random() * Math.PI * 2;
            const dist = WANDER_RADIUS * (0.35 + 0.65 * this.random());
            const x = Math.round(this.anchorX + Math.cos(angle) * dist);
            const y = Math.round(this.anchorY + Math.sin(angle) * dist * 0.7);
            if (body.wouldCollideAt(x, y, map)) continue;
            if (!hasClearPath(map, body.x, body.y, x, y, body.width, body.height)) continue;
            return { x, y };
        }
        return null;
    }

    private stepWalk(dt: number, body: IdleBody, map: TileMap, obstacles: readonly IdleObstacle[]): void {
        if (this.state.kind !== "walk") return;
        const dx = this.state.toX - body.x;
        const dy = this.state.toY - body.y;
        const len = Math.hypot(dx, dy);
        if (len < 1) {
            body.setFacing(this.homeFacing);
            this.state = { kind: "pause", remaining: this.pauseSeconds() };
            return;
        }
        const step = Math.min(WANDER_SPEED * dt, len);
        const nx = body.x + (dx / len) * step;
        const ny = body.y + (dy / len) * step;
        const blocked =
            body.wouldCollideAt(nx, ny, map) ||
            obstacles.some((o) => o !== body && crowds(nx, ny, body, o));
        if (blocked) {
            this.state.stuck += dt;
            if (this.state.stuck >= STUCK_SECONDS) {
                body.setFacing(this.homeFacing);
                this.state = { kind: "pause", remaining: this.pauseSeconds() };
            }
            return;
        }
        body.animateWalk(dt, nx - body.x, ny - body.y);
        body.x = nx;
        body.y = ny;
    }
}
