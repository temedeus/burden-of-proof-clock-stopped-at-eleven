import type { Difficulty } from "./MurdererChaseController";

/** Ytte's rhythm: guard up → wind up → swing → guard down while he recovers. */
export type YttePhase = "guard" | "windup" | "strike" | "open";

export type FightEvent =
    /** Your punch connected (into his open guard, or as a counter after ducking). */
    | "hit_ytte"
    /** His swing connected. */
    | "hit_player"
    /** You ducked under his swing. */
    | "dodge"
    /** You punched into his raised guard. */
    | "blocked";

export type FightResult = "ongoing" | "won" | "lost";

/** Punches needed to knock Ytte out. */
export const YTTE_STAMINA = 10;

const CONFIG: Record<
    Difficulty,
    {
        /** Hits the detective can take. */
        playerStamina: number;
        guardMin: number;
        guardMax: number;
        windup: number;
        /** Press within this many seconds before his swing lands to duck it. */
        duckWindow: number;
        open: number;
    }
> = {
    easy: { playerStamina: 6, guardMin: 1.1, guardMax: 1.9, windup: 0.7, duckWindow: 0.38, open: 0.9 },
    medium: { playerStamina: 5, guardMin: 0.9, guardMax: 1.6, windup: 0.6, duckWindow: 0.3, open: 0.75 },
    hard: { playerStamina: 4, guardMin: 0.7, guardMax: 1.3, windup: 0.5, duckWindow: 0.24, open: 0.6 }
};

const STRIKE_SECONDS = 0.16;
/** Punching into his guard: stamina it costs and how long you're off balance. */
const BLOCKED_COST = 0.25;
const STAGGER_SECONDS = 0.45;
/** Minimum gap between your punches (so mashing into an opening isn't free). */
const PUNCH_COOLDOWN = 0.28;
/** Seconds the knockout plays before the fight hands back to the chase / game over. */
export const FIGHT_OUTRO_SECONDS = 1.6;

/**
 * Timing-based fist fight with Chef Ytte in the secret tunnel. One button:
 * punch when his guard drops, or press as his swing comes in to duck and counter.
 */
export class FistFight {
    active = false;
    playerStamina = 0;
    playerMaxStamina = 0;
    ytteStamina = YTTE_STAMINA;
    phase: YttePhase = "guard";
    /** Seconds into the current phase. */
    phaseTime = 0;
    phaseDuration = 0;
    result: FightResult = "ongoing";
    /** Seconds since the fight was decided (knockout animation). */
    outroTime = 0;
    /** Most recent event and how long ago it happened — drives the reaction animations. */
    lastEvent: FightEvent | null = null;
    sinceEvent = 0;
    /** Seconds since the detective last threw a punch. */
    sincePunch = Infinity;
    /** Seconds of stagger left after punching into his guard. */
    stagger = 0;
    /** Ducked his last swing — the detective stays low for the counter. */
    ducked = false;
    private readonly config: (typeof CONFIG)[Difficulty];

    constructor(
        difficulty: Difficulty = "medium",
        private readonly random: () => number = Math.random
    ) {
        this.config = CONFIG[difficulty];
    }

    start(): void {
        this.active = true;
        this.playerMaxStamina = this.config.playerStamina;
        this.playerStamina = this.playerMaxStamina;
        this.ytteStamina = YTTE_STAMINA;
        this.result = "ongoing";
        this.outroTime = 0;
        this.lastEvent = null;
        this.sinceEvent = Infinity;
        this.sincePunch = Infinity;
        this.stagger = 0;
        this.enter("guard");
    }

    stop(): void {
        this.active = false;
    }

    /** Within the last moments of his wind-up — pressing now ducks the swing. */
    get duckWindowOpen(): boolean {
        return this.phase === "windup" && this.phaseDuration - this.phaseTime <= this.config.duckWindow;
    }

    /** Action pressed. Returns what happened, or null when the press is ignored. */
    press(): FightEvent | null {
        if (!this.active || this.result !== "ongoing") return null;
        if (this.stagger > 0 || this.sincePunch < PUNCH_COOLDOWN) return null;
        this.sincePunch = 0;

        switch (this.phase) {
            case "open":
                return this.landPunch();
            case "windup":
                if (this.duckWindowOpen) {
                    // Slip under the swing and counter while he's overextended
                    this.ducked = true;
                    this.emit("dodge");
                    this.enter("open");
                    return this.landPunch();
                }
                return this.punchIntoGuard();
            default:
                return this.punchIntoGuard();
        }
    }

    tick(dt: number): FightEvent[] {
        if (!this.active) return [];
        const events: FightEvent[] = [];
        this.sinceEvent += dt;
        this.sincePunch += dt;
        this.stagger = Math.max(0, this.stagger - dt);

        if (this.result !== "ongoing") {
            this.outroTime += dt;
            return events;
        }

        this.phaseTime += dt;
        if (this.phaseTime < this.phaseDuration) return events;

        switch (this.phase) {
            case "guard":
                this.enter("windup");
                break;
            case "windup":
                this.enter("strike");
                this.playerStamina = Math.max(0, this.playerStamina - 1);
                this.emit("hit_player");
                events.push("hit_player");
                if (this.playerStamina <= 0) this.result = "lost";
                break;
            case "strike":
                this.enter("open");
                break;
            case "open":
                this.ducked = false;
                this.enter("guard");
                break;
        }
        return events;
    }

    private landPunch(): FightEvent {
        this.ytteStamina = Math.max(0, this.ytteStamina - 1);
        this.emit("hit_ytte");
        if (this.ytteStamina <= 0) this.result = "won";
        return "hit_ytte";
    }

    private punchIntoGuard(): FightEvent {
        this.playerStamina = Math.max(0, this.playerStamina - BLOCKED_COST);
        this.stagger = STAGGER_SECONDS;
        this.emit("blocked");
        if (this.playerStamina <= 0) this.result = "lost";
        return "blocked";
    }

    private emit(event: FightEvent): void {
        this.lastEvent = event;
        this.sinceEvent = 0;
    }

    private enter(phase: YttePhase): void {
        this.phase = phase;
        this.phaseTime = 0;
        const c = this.config;
        this.phaseDuration =
            phase === "guard"
                ? c.guardMin + this.random() * (c.guardMax - c.guardMin)
                : phase === "windup"
                  ? c.windup
                  : phase === "strike"
                    ? STRIKE_SECONDS
                    : c.open;
    }
}
