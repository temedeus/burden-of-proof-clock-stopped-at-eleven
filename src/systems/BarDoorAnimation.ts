import type { Facing } from "../entities/Player";
import type { DoorExit } from "../world/Room";

/** Seconds per beat: turn to the door → heave the plank up → slam it home → glare back. */
const TURN = 0.3;
const LIFT = 0.55;
const DROP = 0.22;
const SETTLE = 0.5;
export const BAR_DOOR_ANIMATION_SECONDS = TURN + LIFT + DROP + SETTLE;

/** Plank height on Ytte's sprite (fraction from the top): waist at the start of the heave, overhead at the top. */
const WAIST_Y = 0.55;
const OVERHEAD_Y = 0.08;

export interface BarDoorTick {
    /** The bar just landed in its brackets. */
    slam: boolean;
    done: boolean;
}

/** Which way to face so the figure looks at a door on this wall. */
export function facingTowardExit(exit: Pick<DoorExit, "x" | "y">, roomWidth: number, roomHeight: number): Facing {
    if (exit.x === 0) return "left";
    if (exit.x === roomWidth - 1) return "right";
    if (exit.y === roomHeight - 1) return "down";
    return "up";
}

/**
 * Ytte barring a door: purely timing — Game positions the plank from these
 * progress values and places the real `DoorBarricade` on `slam`.
 */
export class BarDoorAnimation {
    roomId: string | null = null;
    exit: DoorExit | null = null;
    time = 0;
    private slammed = false;

    get active(): boolean {
        return this.exit !== null;
    }

    start(roomId: string, exit: DoorExit): void {
        this.roomId = roomId;
        this.exit = exit;
        this.time = 0;
        this.slammed = false;
    }

    stop(): void {
        this.roomId = null;
        this.exit = null;
        this.time = 0;
        this.slammed = false;
    }

    /** Plank is in Ytte's hands (lift and drop beats). */
    get carrying(): boolean {
        return this.active && this.time >= TURN && !this.slammed;
    }

    /** 0..1 — plank raised overhead. Eased so the heave reads as heavy. */
    get liftT(): number {
        const t = Math.max(0, Math.min(1, (this.time - TURN) / LIFT));
        return 1 - (1 - t) * (1 - t);
    }

    /** 0..1 — plank travelling from the raised hands into the door brackets. */
    get dropT(): number {
        const t = Math.max(0, Math.min(1, (this.time - TURN - LIFT) / DROP));
        return t * t;
    }

    /** Arms-up pose once the plank passes his shoulders, until it lands. */
    get armsUp(): boolean {
        return this.carrying && this.liftT > 0.45;
    }

    /** Where the plank sits on Ytte's sprite (0 = top, 1 = feet) before it flies to the door. */
    get carryHeight(): number {
        return WAIST_Y + (OVERHEAD_Y - WAIST_Y) * this.liftT;
    }

    /** 1 at the slam, fading to 0 — rattles the freshly placed bar. */
    get slamShake(): number {
        if (!this.slammed) return 0;
        const since = this.time - (TURN + LIFT + DROP);
        return Math.max(0, 1 - since / 0.3);
    }

    tick(dt: number): BarDoorTick {
        if (!this.active) return { slam: false, done: false };
        this.time += dt;
        let slam = false;
        if (!this.slammed && this.time >= TURN + LIFT + DROP) {
            this.slammed = true;
            slam = true;
        }
        const done = this.time >= BAR_DOOR_ANIMATION_SECONDS;
        return { slam, done };
    }
}
