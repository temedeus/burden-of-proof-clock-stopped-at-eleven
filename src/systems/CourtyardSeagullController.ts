import { drawSeagull } from "../assets/procedural/seagull";
import type { DepthActor } from "../render/roomScene";
import { TILE_SIZE } from "../world/constants";

const COURTYARD_ROOM_ID = "courtyard";

/** Stable roof perch — west gable / ridge of the courtyard stable. */
const PERCH_X = 17 * TILE_SIZE + 8;
const PERCH_Y = 3 * TILE_SIZE + 10;

const ENTER_DURATION = 1.35;
const PERCH_DURATION = 5;
const EXIT_DURATION = 1.6;

/** Wing flaps while perched (count + timing within the 5s perch). */
const FLAP_TIMES = [0.55, 1.9, 3.35] as const;
const FLAP_DURATION = 0.42;

type Phase = "enter" | "perch" | "exit" | "done";

function easeOutCubic(t: number): number {
    const u = 1 - Math.min(1, Math.max(0, t));
    return 1 - u * u * u;
}

function easeInCubic(t: number): number {
    const u = Math.min(1, Math.max(0, t));
    return u * u * u;
}

function wingPhaseDuringFlaps(perchElapsed: number): number {
    let best = 0;
    for (const start of FLAP_TIMES) {
        const local = perchElapsed - start;
        if (local >= 0 && local <= FLAP_DURATION) {
            const u = local / FLAP_DURATION;
            best = Math.max(best, u < 0.45 ? u / 0.45 : 1 - (u - 0.45) / 0.55);
        }
    }
    return best;
}

export class CourtyardSeagullController {
    private activeRoomId: string | null = null;
    private phase: Phase = "done";
    private phaseElapsed = 0;
    private x = 0;
    private y = 0;
    private dir: 1 | -1 = -1;

    syncForRoom(roomId: string): void {
        if (roomId === this.activeRoomId) return;
        this.activeRoomId = roomId;
        if (roomId !== COURTYARD_ROOM_ID) {
            this.phase = "done";
            return;
        }
        this.beginEnter();
    }

    private beginEnter(): void {
        this.phase = "enter";
        this.phaseElapsed = 0;
        this.dir = -1;
        this.x = 26 * TILE_SIZE;
        this.y = PERCH_Y - 48;
    }

    private samplePose(): void {
        if (this.phase === "enter") {
            const t = easeOutCubic(this.phaseElapsed / ENTER_DURATION);
            const startX = 26 * TILE_SIZE;
            const startY = PERCH_Y - 48;
            this.x = startX + (PERCH_X - startX) * t;
            this.y = startY + (PERCH_Y - startY) * t;
            this.dir = -1;
            return;
        }
        if (this.phase === "perch") {
            this.x = PERCH_X;
            this.y = PERCH_Y;
            this.dir = -1;
            return;
        }
        if (this.phase === "exit") {
            const t = easeInCubic(this.phaseElapsed / EXIT_DURATION);
            this.dir = 1;
            this.x = PERCH_X + t * 10 * TILE_SIZE;
            this.y = PERCH_Y - t * 5 * TILE_SIZE;
        }
    }

    update(dt: number, roomId: string): void {
        this.syncForRoom(roomId);
        if (roomId !== COURTYARD_ROOM_ID || this.phase === "done") return;

        let remaining = dt;
        while (remaining > 0 && this.phase !== "done") {
            const duration =
                this.phase === "enter"
                    ? ENTER_DURATION
                    : this.phase === "perch"
                      ? PERCH_DURATION
                      : EXIT_DURATION;
            const left = duration - this.phaseElapsed;
            if (remaining < left) {
                this.phaseElapsed += remaining;
                remaining = 0;
            } else {
                remaining -= left;
                if (this.phase === "enter") {
                    this.phase = "perch";
                    this.phaseElapsed = 0;
                } else if (this.phase === "perch") {
                    this.phase = "exit";
                    this.phaseElapsed = 0;
                } else {
                    this.phase = "done";
                    this.phaseElapsed = 0;
                }
            }
        }

        this.samplePose();
    }

    getActors(): DepthActor[] {
        if (this.activeRoomId !== COURTYARD_ROOM_ID || this.phase === "done") return [];

        const perched = this.phase === "perch";
        let wingPhase = 0;
        if (this.phase === "enter" || this.phase === "exit") {
            wingPhase = (Math.sin(this.phaseElapsed * 14) + 1) * 0.5;
        } else if (perched) {
            wingPhase = wingPhaseDuringFlaps(this.phaseElapsed);
        }

        const x = this.x;
        const y = this.y;
        const dir = this.dir;
        return [
            {
                y: PERCH_Y + 4,
                height: 12,
                render: (ctx) => {
                    drawSeagull(ctx, x, y, dir, wingPhase, perched);
                }
            }
        ];
    }
}

export const courtyardSeagull = new CourtyardSeagullController();
