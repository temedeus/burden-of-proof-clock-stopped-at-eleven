import type { Difficulty } from "./MurdererChaseController";

/**
 * Ytte's rhythm: guard up → wind up → swing → recover (guard down while he punches),
 * then guard again. Out of stamina he stays winded with his guard dropped.
 */
export type YttePhase = "guard" | "windup" | "strike" | "recover";

export type FightEvent =
    /** Your punch connected cleanly (his guard was down or broken). */
    | "hit_ytte"
    /** Your punch landed on his raised guard — barely hurts. */
    | "chip_ytte"
    /** His swing connected cleanly. */
    | "hit_player"
    /** His swing landed on your guard. */
    | "chip_player"
    /** You ducked under his swing. */
    | "dodge";

export type FightResult = "ongoing" | "won" | "lost";

/** Ytte's health: about ten clean punches. */
export const YTTE_HEALTH = 10;

/** Health lost to a clean hit, and to one absorbed by a raised guard. */
const CLEAN_DAMAGE = 1;
const GUARDED_DAMAGE = 0.1;
/** Stamina is 0..1; a punch costs this much. */
const PLAYER_PUNCH_COST = 0.2;
const YTTE_PUNCH_COST = 0.25;
/** Stamina regained per second while not punching (after a short breather). */
const STAMINA_REGEN = 0.14;
const REGEN_DELAY = 0.5;
/** Once winded, stamina must climb back to this before guarding and punching again. */
const RECOVERED_AT = 0.35;
/** How long a punch leaves your own guard down (also the gap between punches). */
const PUNCH_SECONDS = 0.5;
const STRIKE_SECONDS = 0.16;
/** Punch into his raised guard and he swats it aside and jabs back this fast — too quick to duck. */
const RIPOSTE_WINDUP = 0.3;
/**
 * The tutorial card ignores presses this long, so the key that closed the taunt
 * can't dismiss it (or throw a punch) by accident.
 */
export const FIGHT_TUTORIAL_LOCK_SECONDS = 0.6;
/** Seconds the knockout plays before the fight hands back to the chase / game over. */
export const FIGHT_OUTRO_SECONDS = 1.6;
/** Ytte's knockout plays in slow motion for this many real seconds, then eases back to full speed. */
export const KO_SLOWMO_SECONDS = 1.5;
const KO_SLOWMO_RATE = 0.22;
const KO_SLOWMO_EASE_OUT = 0.4;

const CONFIG: Record<
    Difficulty,
    {
        playerHealth: number;
        guardMin: number;
        guardMax: number;
        windup: number;
        /** Press within this many seconds before his swing lands to duck it. */
        duckWindow: number;
        recover: number;
    }
> = {
    easy: { playerHealth: 6, guardMin: 1.1, guardMax: 1.9, windup: 0.7, duckWindow: 0.38, recover: 0.6 },
    medium: { playerHealth: 5, guardMin: 0.9, guardMax: 1.6, windup: 0.6, duckWindow: 0.3, recover: 0.5 },
    hard: { playerHealth: 4, guardMin: 0.7, guardMax: 1.3, windup: 0.5, duckWindow: 0.24, recover: 0.4 }
};

/** Health + stamina for one fighter. */
export class Fighter {
    health: number;
    stamina = 1;
    /** Drained to zero: guard broken and no punches until stamina recovers. */
    winded = false;
    private sinceExertion = Infinity;

    constructor(readonly maxHealth: number) {
        this.health = maxHealth;
    }

    get canPunch(): boolean {
        return !this.winded;
    }

    spend(cost: number): void {
        this.stamina = Math.max(0, this.stamina - cost);
        this.sinceExertion = 0;
        if (this.stamina <= 0) this.winded = true;
    }

    /** Take a hit; a raised guard (while not winded) soaks most of it. */
    takeHit(guardUp: boolean): "clean" | "guarded" {
        const guarded = guardUp && !this.winded;
        this.health = Math.max(0, this.health - (guarded ? GUARDED_DAMAGE : CLEAN_DAMAGE));
        return guarded ? "guarded" : "clean";
    }

    tick(dt: number): void {
        this.sinceExertion += dt;
        const resting = Math.min(dt, this.sinceExertion - REGEN_DELAY);
        if (resting <= 0) return;
        this.stamina = Math.min(1, this.stamina + STAMINA_REGEN * resting);
        if (this.winded && this.stamina >= RECOVERED_AT) this.winded = false;
    }
}

/**
 * Timing-based fist fight with Chef Ytte in the secret tunnel. One button: each
 * punch costs stamina and drops your guard for a moment; hold back and your guard
 * is up. Land clean hits while his guard is down (mid-swing, or winded), or press
 * as his swing comes in to duck it and counter.
 */
export class FistFight {
    active = false;
    player = new Fighter(1);
    ytte = new Fighter(YTTE_HEALTH);
    phase: YttePhase = "guard";
    /** Seconds into the current phase. */
    phaseTime = 0;
    phaseDuration = 0;
    result: FightResult = "ongoing";
    /** Showing the how-to card; Ytte waits until it's dismissed. */
    tutorial = false;
    /** Seconds the tutorial card has been up. */
    tutorialTime = 0;
    /** Seconds since the fight was decided (knockout animation) — in scene time, slowed during slow motion. */
    outroTime = 0;
    /** Real seconds since the fight was decided. */
    outroRealTime = 0;
    /** Most recent event and how long ago it happened — drives the reaction animations. */
    lastEvent: FightEvent | null = null;
    sinceEvent = Infinity;
    /** Seconds since the detective last threw a punch. */
    sincePunch = Infinity;
    /** Ducked his current swing — it will miss, and the detective stays low for the counter. */
    ducked = false;
    /** Punched early into this wind-up: committed, too late to duck it. */
    private committed = false;
    private readonly config: (typeof CONFIG)[Difficulty];

    constructor(
        difficulty: Difficulty = "medium",
        private readonly random: () => number = Math.random
    ) {
        this.config = CONFIG[difficulty];
    }

    start(): void {
        this.active = true;
        this.player = new Fighter(this.config.playerHealth);
        this.ytte = new Fighter(YTTE_HEALTH);
        this.result = "ongoing";
        this.tutorial = true;
        this.tutorialTime = 0;
        this.outroTime = 0;
        this.outroRealTime = 0;
        this.lastEvent = null;
        this.sinceEvent = Infinity;
        this.sincePunch = Infinity;
        this.ducked = false;
        this.enter("guard");
    }

    stop(): void {
        this.active = false;
    }

    /** Detective mid-punch: their own guard is down. */
    get playerPunching(): boolean {
        return this.sincePunch < PUNCH_SECONDS;
    }

    get playerGuardUp(): boolean {
        return !this.playerPunching && !this.player.winded;
    }

    /** Ytte only guards when he isn't throwing a punch and has the breath for it. */
    get ytteGuardUp(): boolean {
        return this.phase === "guard" && !this.ytte.winded;
    }

    /** Knockout blow on Ytte still playing in slow motion. */
    get slowMo(): boolean {
        return this.result === "won" && this.outroRealTime < KO_SLOWMO_SECONDS;
    }

    /** How fast scene time runs relative to real time (1 = normal). */
    get timeRate(): number {
        if (this.result !== "won") return 1;
        const r = this.outroRealTime;
        if (r < KO_SLOWMO_SECONDS) return KO_SLOWMO_RATE;
        const t = Math.min(1, (r - KO_SLOWMO_SECONDS) / KO_SLOWMO_EASE_OUT);
        return KO_SLOWMO_RATE + (1 - KO_SLOWMO_RATE) * t;
    }

    /** Within the last moments of his wind-up — pressing now ducks the swing. */
    get duckWindowOpen(): boolean {
        return (
            this.phase === "windup" &&
            !this.ducked &&
            !this.committed &&
            this.phaseDuration - this.phaseTime <= this.config.duckWindow
        );
    }

    /** Action pressed. Returns what happened, or null when the press is ignored. */
    press(): FightEvent | null {
        if (!this.active || this.result !== "ongoing") return null;
        if (this.tutorial) {
            if (this.tutorialTime >= FIGHT_TUTORIAL_LOCK_SECONDS) this.tutorial = false;
            return null;
        }
        if (this.playerPunching) return null;

        if (this.duckWindowOpen) {
            // Slip under the swing; counter while he's overextended if there's breath for it
            this.ducked = true;
            this.emit("dodge");
            if (!this.player.canPunch) return "dodge";
            return this.punch();
        }
        if (!this.player.canPunch) return null;
        if (this.phase === "windup") this.committed = true;
        return this.punch();
    }

    tick(dt: number): FightEvent[] {
        if (!this.active) return [];
        const events: FightEvent[] = [];
        // Scene time: the knockout blow plays out in slow motion
        const sceneDt = dt * this.timeRate;
        this.sinceEvent += sceneDt;
        this.sincePunch += sceneDt;

        if (this.result !== "ongoing") {
            this.outroRealTime += dt;
            this.outroTime += sceneDt;
            return events;
        }
        if (this.tutorial) {
            this.tutorialTime += dt;
            return events;
        }

        this.player.tick(dt);
        this.ytte.tick(dt);
        this.phaseTime += dt;
        if (this.phaseTime < this.phaseDuration) return events;

        switch (this.phase) {
            case "guard":
                // Too winded to swing: keep covering up and get his breath back
                if (this.ytte.canPunch) {
                    this.ytte.spend(YTTE_PUNCH_COST);
                    this.enter("windup");
                } else {
                    this.enter("guard");
                }
                break;
            case "windup":
                this.enter("strike");
                if (!this.ducked) {
                    const hit = this.player.takeHit(this.playerGuardUp);
                    const event: FightEvent = hit === "clean" ? "hit_player" : "chip_player";
                    this.emit(event);
                    events.push(event);
                    if (this.player.health <= 0) this.result = "lost";
                }
                break;
            case "strike":
                this.enter("recover");
                break;
            case "recover":
                this.ducked = false;
                this.enter("guard");
                break;
        }
        return events;
    }

    private punch(): FightEvent {
        this.sincePunch = 0;
        this.player.spend(PLAYER_PUNCH_COST);
        const hit = this.ytte.takeHit(this.ytteGuardUp);
        const event: FightEvent = hit === "clean" ? "hit_ytte" : "chip_ytte";
        this.emit(event);
        if (this.ytte.health <= 0) this.result = "won";
        else if (event === "chip_ytte" && this.ytte.canPunch) this.riposte();
        return event;
    }

    /** Swat the punch aside and jab straight back while the detective is still extended. */
    private riposte(): void {
        this.ytte.spend(YTTE_PUNCH_COST);
        this.enter("windup");
        this.phaseDuration = RIPOSTE_WINDUP;
        this.committed = true;
    }

    private emit(event: FightEvent): void {
        this.lastEvent = event;
        this.sinceEvent = 0;
    }

    private enter(phase: YttePhase): void {
        this.phase = phase;
        this.phaseTime = 0;
        if (phase === "windup") this.committed = false;
        const c = this.config;
        // He presses the attack while the detective is winded
        const pressing = this.player.winded ? 0.5 : 1;
        this.phaseDuration =
            phase === "guard"
                ? (c.guardMin + this.random() * (c.guardMax - c.guardMin)) * pressing
                : phase === "windup"
                  ? c.windup
                  : phase === "strike"
                    ? STRIKE_SECONDS
                    : c.recover;
    }
}
