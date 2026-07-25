import { TILE_SIZE } from "../world/constants";
import type { Entity } from "../entities/Entity";
import { markAtticWindowBroken, ATTIC_WINDOW_TILE_XS } from "../world/atticWindows";

export const ATTIC_WINDOW_SHOVE_HINT = "The window — shove him out!";

export type AtticWindowPhase = "idle" | "throw" | "crash" | "done";

export interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

/** Pixel hazard in front of an attic north-wall window column. */
export function atticWindowHazardAt(tileX: number): Rect {
    return {
        x: tileX * TILE_SIZE - TILE_SIZE * 0.5,
        y: 2 * TILE_SIZE,
        w: TILE_SIZE * 2,
        h: TILE_SIZE * 3
    };
}

export function getAtticWindowHazards(): Rect[] {
    return ATTIC_WINDOW_TILE_XS.map((x) => atticWindowHazardAt(x));
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

/** Nearest window landing (just inside the wall) for the throw target. */
export function nearestAtticWindowLanding(
    fromX: number,
    fromY: number,
    entityW: number,
    entityH: number
): { x: number; y: number; tileX: number } {
    let best: number = ATTIC_WINDOW_TILE_XS[0];
    let bestDist = Infinity;
    const cx = fromX + entityW / 2;
    for (const tileX of ATTIC_WINDOW_TILE_XS) {
        const wx = tileX * TILE_SIZE + TILE_SIZE / 2;
        const d = Math.abs(wx - cx);
        if (d < bestDist) {
            bestDist = d;
            best = tileX;
        }
    }
    return {
        tileX: best,
        x: best * TILE_SIZE + TILE_SIZE / 2 - entityW / 2,
        y: 2 * TILE_SIZE - entityH * 0.35
    };
}

/**
 * Short cutscene: hooded figure thrown into an attic window and out.
 */
export class AtticWindowCutscene {
    active = false;
    phase: AtticWindowPhase = "idle";
    throwT = 0;
    brokenTileX: number | null = null;

    throwFrom = { x: 0, y: 0 };
    throwTo = { x: 0, y: 0 };

    private timer = 0;
    private cryOpened = false;
    private cryCleared = false;

    start(fromX: number, fromY: number, toX: number, toY: number, tileX: number): void {
        this.active = true;
        this.phase = "throw";
        this.timer = 0;
        this.throwT = 0;
        this.throwFrom = { x: fromX, y: fromY };
        this.throwTo = { x: toX, y: toY };
        this.brokenTileX = tileX;
        this.cryOpened = false;
        this.cryCleared = false;
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
                this.throwT = Math.min(1, this.timer / 0.55);
                if (this.throwT >= 1) {
                    this.phase = "crash";
                    this.timer = 0;
                    if (this.brokenTileX != null) {
                        markAtticWindowBroken(this.brokenTileX);
                    }
                    out.playCrash = true;
                    out.hideMurderer = true;
                    out.openCry = true;
                    this.cryOpened = true;
                }
                break;
            }
            case "crash": {
                if (!this.cryCleared && this.timer >= 0.55) {
                    this.cryCleared = true;
                    out.clearCry = true;
                }
                if (this.timer >= 0.95) {
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

    throwPosition(): { x: number; y: number } {
        const t = this.throwT;
        const lift = Math.sin(t * Math.PI) * TILE_SIZE * 1.4;
        return {
            x: this.throwFrom.x + (this.throwTo.x - this.throwFrom.x) * t,
            y: this.throwFrom.y + (this.throwTo.y - this.throwFrom.y) * t - lift
        };
    }

    reset(): void {
        this.active = false;
        this.phase = "idle";
        this.timer = 0;
        this.throwT = 0;
        this.brokenTileX = null;
        this.cryOpened = false;
        this.cryCleared = false;
    }
}
