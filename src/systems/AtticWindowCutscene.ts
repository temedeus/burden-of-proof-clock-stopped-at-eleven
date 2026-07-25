import { TILE_SIZE } from "../world/constants";
import type { Entity } from "../entities/Entity";
import {
    markAtticWindowBroken,
    ATTIC_WINDOWS,
    ATTIC_WINDOW_TILE_XS
} from "../world/atticWindows";

export const ATTIC_WINDOW_SHOVE_HINT = "The window — shove him out!";

export type AtticWindowPhase = "idle" | "throw" | "crash" | "done";

export interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

function smoothstep(t: number): number {
    const x = Math.max(0, Math.min(1, t));
    return x * x * (3 - 2 * x);
}

/** Pixel hazard in front of a two-tile attic window. */
export function atticWindowHazardAt(windowId: number): Rect {
    const pair = ATTIC_WINDOWS.find((w) => w.id === windowId) ?? ATTIC_WINDOWS[0];
    return {
        x: pair.left * TILE_SIZE - TILE_SIZE * 0.25,
        y: 2 * TILE_SIZE,
        w: TILE_SIZE * 2.5,
        h: TILE_SIZE * 3
    };
}

export function getAtticWindowHazards(): Rect[] {
    return ATTIC_WINDOW_TILE_XS.map((id) => atticWindowHazardAt(id));
}

export function entityCenterOverlapsRect(
    entity: Entity,
    rect: Rect,
    entityW: number,
    entityH: number
): boolean {
    const cx = entity.x + entityW / 2;
    const cy = entity.y + entityH / 2;
    return cx >= rect.x && cx <= rect.x + rect.w && cy >= rect.y && cy <= rect.y + rect.h;
}

export function playerNearAtticWindow(
    player: Entity,
    playerW: number,
    playerH: number,
    marginPx = TILE_SIZE * 2
): boolean {
    for (const hazard of getAtticWindowHazards()) {
        const expanded: Rect = {
            x: hazard.x - marginPx,
            y: hazard.y - marginPx,
            w: hazard.w + marginPx * 2,
            h: hazard.h + marginPx * 2
        };
        if (entityCenterOverlapsRect(player, expanded, playerW, playerH)) return true;
    }
    return false;
}

/** Center of the two-tile window opening for the throw target. */
export function nearestAtticWindowLanding(
    fromX: number,
    fromY: number,
    entityW: number,
    entityH: number
): { x: number; y: number; tileX: number } {
    let best: (typeof ATTIC_WINDOWS)[number] = ATTIC_WINDOWS[0];
    let bestDist = Infinity;
    const cx = fromX + entityW / 2;
    for (const pair of ATTIC_WINDOWS) {
        const wx = ((pair.left + pair.right + 1) / 2) * TILE_SIZE;
        const d = Math.abs(wx - cx);
        if (d < bestDist) {
            bestDist = d;
            best = pair;
        }
    }
    const centerX = ((best.left + best.right + 1) / 2) * TILE_SIZE;
    return {
        tileX: best.id,
        x: centerX - entityW / 2,
        // Aim mid-opening on the tall north wall face
        y: TILE_SIZE * 0.55 - entityH * 0.15
    };
}

export interface AtticThrowPose {
    x: number;
    y: number;
    scale: number;
    alpha: number;
    tilt: number;
}

/**
 * Short cutscene: hooded figure thrown into an attic window and out.
 */
export class AtticWindowCutscene {
    active = false;
    phase: AtticWindowPhase = "idle";
    throwT = 0;
    brokenTileX: number | null = null;
    fallSign = 1;

    throwFrom = { x: 0, y: 0 };
    throwTo = { x: 0, y: 0 };

    private timer = 0;
    private cryOpened = false;
    private cryCleared = false;
    private crashPlayed = false;

    /** Throw arc duration in seconds. */
    static readonly THROW_DURATION = 1.05;

    start(
        fromX: number,
        fromY: number,
        toX: number,
        toY: number,
        tileX: number,
        fallSign = 1
    ): void {
        this.active = true;
        this.phase = "throw";
        this.timer = 0;
        this.throwT = 0;
        this.throwFrom = { x: fromX, y: fromY };
        this.throwTo = { x: toX, y: toY };
        this.brokenTileX = tileX;
        this.fallSign = fallSign >= 0 ? 1 : -1;
        this.cryOpened = false;
        this.cryCleared = false;
        this.crashPlayed = false;
    }

    tick(dt: number): {
        playCrash?: boolean;
        openCry?: boolean;
        clearCry?: boolean;
        finished?: boolean;
        hideMurderer?: boolean;
    } {
        if (!this.active) return {};
        this.timer += dt;
        const out: ReturnType<AtticWindowCutscene["tick"]> = {};

        switch (this.phase) {
            case "throw": {
                this.throwT = Math.min(1, this.timer / AtticWindowCutscene.THROW_DURATION);

                // Glass breaks as the body hits the pane (~68% through the arc)
                if (!this.crashPlayed && this.throwT >= 0.68) {
                    this.crashPlayed = true;
                    if (this.brokenTileX != null) {
                        markAtticWindowBroken(this.brokenTileX);
                    }
                    out.playCrash = true;
                    out.openCry = true;
                    this.cryOpened = true;
                }

                if (this.throwT >= 1) {
                    this.phase = "crash";
                    this.timer = 0;
                    out.hideMurderer = true;
                }
                break;
            }
            case "crash": {
                if (!this.cryCleared && this.timer >= 0.5) {
                    this.cryCleared = true;
                    out.clearCry = true;
                }
                if (this.timer >= 0.85) {
                    this.phase = "done";
                    this.active = false;
                    out.finished = true;
                }
                break;
            }
            default:
                break;
        }
        return out;
    }

    throwPose(): AtticThrowPose {
        const u = this.throwT;
        const t = smoothstep(u);
        // Soft ease-in on the first beat, then accelerate into the opening
        const easeIn = u * u;
        const through = Math.max(0, (u - 0.55) / 0.45);
        const throughEased = through * through;

        const x = this.throwFrom.x + (this.throwTo.x - this.throwFrom.x) * t;
        // Lift early, then settle into the sill and continue “out” through the pane
        const lift = Math.sin(Math.min(1, u * 1.15) * Math.PI) * TILE_SIZE * 1.15;
        const outY = throughEased * TILE_SIZE * 1.35;
        const y =
            this.throwFrom.y +
            (this.throwTo.y - this.throwFrom.y) * t -
            lift * (1 - throughEased * 0.35) -
            outY;

        // Shrink and fade once past the glass
        const scale =
            u < 0.55 ? 1 : 1 - smoothstep((u - 0.55) / 0.45) * 0.72;
        const alpha = u < 0.7 ? 1 : 1 - smoothstep((u - 0.7) / 0.3);
        // Tumbling roll toward the throw direction
        const tilt = this.fallSign * easeIn * (Math.PI * 0.65);

        return { x, y, scale, alpha, tilt };
    }

    /** @deprecated use throwPose */
    throwPosition(): { x: number; y: number } {
        const p = this.throwPose();
        return { x: p.x, y: p.y };
    }

    reset(): void {
        this.active = false;
        this.phase = "idle";
        this.timer = 0;
        this.throwT = 0;
        this.brokenTileX = null;
        this.fallSign = 1;
        this.cryOpened = false;
        this.cryCleared = false;
        this.crashPlayed = false;
    }
}
