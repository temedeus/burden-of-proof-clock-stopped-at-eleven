import { TILE_SIZE } from "../world/constants";
import type { DoorExit } from "../world/Room";
import type { Difficulty } from "./MurdererChaseController";

export type BarricadeTickResult = "idle" | "prying" | "removed";

/** Seconds of unbroken holding needed to lift the bar. */
const PRY_SECONDS: Record<Difficulty, number> = {
    easy: 1.6,
    medium: 2.2,
    hard: 2.8
};

/** How close (px, player centre to door centre) the detective must stand to grab the bar. */
const REACH_PX = TILE_SIZE * 2;

/**
 * Finale chase: when Ytte follows you into a room he drops a wooden bar across the
 * door behind him. Hold action at the door to lift it — any break (letting go,
 * stepping away, getting caught) restarts the pry from zero.
 */
export class DoorBarricade {
    roomId: string | null = null;
    exit: DoorExit | null = null;
    /** 0..1 pry progress shown on the HUD meter. */
    progress = 0;
    private readonly prySeconds: number;

    constructor(difficulty: Difficulty = "medium") {
        this.prySeconds = PRY_SECONDS[difficulty];
    }

    get active(): boolean {
        return this.exit !== null;
    }

    place(roomId: string, exit: DoorExit): void {
        this.roomId = roomId;
        this.exit = exit;
        this.progress = 0;
    }

    clear(): void {
        this.roomId = null;
        this.exit = null;
        this.progress = 0;
    }

    /** Interrupted (e.g. Ytte caught you) — the next attempt starts over. */
    cancelPry(): void {
        this.progress = 0;
    }

    isBlocking(roomId: string, exit: DoorExit): boolean {
        return this.exit === exit && this.roomId === roomId;
    }

    inReach(roomId: string, playerCenterX: number, playerCenterY: number): boolean {
        if (!this.exit || this.roomId !== roomId) return false;
        const dx = playerCenterX - (this.exit.x + 0.5) * TILE_SIZE;
        const dy = playerCenterY - (this.exit.y + 0.5) * TILE_SIZE;
        return Math.hypot(dx, dy) < REACH_PX;
    }

    tick(dt: number, holding: boolean, inReach: boolean): BarricadeTickResult {
        if (!this.active) return "idle";
        if (!holding || !inReach) {
            this.progress = 0;
            return "idle";
        }
        this.progress = Math.min(1, this.progress + dt / this.prySeconds);
        if (this.progress >= 1) {
            this.clear();
            return "removed";
        }
        return "prying";
    }
}
