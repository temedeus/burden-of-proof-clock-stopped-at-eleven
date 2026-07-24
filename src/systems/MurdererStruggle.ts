import type { Difficulty } from "./MurdererChaseController";

export type StruggleTickResult = "ongoing" | "success" | "fail";

const STRUGGLE_CONFIG: Record<
    Difficulty,
    { start: number; drainPerSec: number; pressGain: number; stunSeconds: number; catchCooldown: number }
> = {
    // ~6–8 taps over a couple seconds to win; idle fail in ~3–4s
    easy: { start: 0.55, drainPerSec: 0.1, pressGain: 0.16, stunSeconds: 3, catchCooldown: 1 },
    medium: { start: 0.5, drainPerSec: 0.12, pressGain: 0.14, stunSeconds: 2.5, catchCooldown: 0.85 },
    hard: { start: 0.42, drainPerSec: 0.14, pressGain: 0.12, stunSeconds: 2, catchCooldown: 0.7 }
};

/**
 * Mash-action struggle when the murderer catches the player.
 * Fill the meter before it drains to zero; success stuns them briefly.
 */
export class MurdererStruggle {
    active = false;
    /** 0..1 fill amount shown on the HUD meter. */
    progress = 0;
    private catchCooldownRemaining = 0;
    private readonly config: (typeof STRUGGLE_CONFIG)[Difficulty];

    constructor(difficulty: Difficulty = "medium") {
        this.config = STRUGGLE_CONFIG[difficulty];
    }

    get stunSeconds(): number {
        return this.config.stunSeconds;
    }

    get catchCooldownSeconds(): number {
        return this.config.catchCooldown;
    }

    canCatch(): boolean {
        return !this.active && this.catchCooldownRemaining <= 0;
    }

    start(): void {
        if (this.active) return;
        this.active = true;
        this.progress = this.config.start;
    }

    press(): void {
        if (!this.active) return;
        this.progress = Math.min(1, this.progress + this.config.pressGain);
    }

    tick(dt: number): StruggleTickResult {
        this.catchCooldownRemaining = Math.max(0, this.catchCooldownRemaining - dt);
        if (!this.active) return "ongoing";

        // Presses can fill to 1 before drain runs — resolve win first
        if (this.progress >= 1) {
            this.progress = 1;
            this.active = false;
            this.catchCooldownRemaining = this.config.catchCooldown;
            return "success";
        }

        this.progress -= this.config.drainPerSec * dt;
        if (this.progress <= 0) {
            this.progress = 0;
            this.active = false;
            return "fail";
        }
        return "ongoing";
    }

    /** Call after a successful shove so immediate re-catch is blocked. */
    beginCatchCooldown(): void {
        this.catchCooldownRemaining = this.config.catchCooldown;
    }
}
