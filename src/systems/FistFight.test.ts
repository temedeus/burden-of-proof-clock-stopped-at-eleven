import { describe, expect, it } from "vitest";
import { FIGHT_OUTRO_SECONDS, FIGHT_TUTORIAL_LOCK_SECONDS, FistFight, YTTE_HEALTH } from "./FistFight";

/** Advance in small steps until `until` holds (or give up after `max` seconds). */
function runUntil(fight: FistFight, until: () => boolean, max = 10): void {
    for (let t = 0; t < max && !until(); t += 0.01) fight.tick(0.01);
}

describe("FistFight", () => {
    it("waits on the tutorial card until it is dismissed", () => {
        const fight = new FistFight("medium", () => 0.5);
        fight.start();
        // The press that closed the taunt can't skip the card
        expect(fight.press()).toBeNull();
        expect(fight.tutorial).toBe(true);
        fight.tick(5);
        expect(fight.phase).toBe("guard");
        expect(fight.ytte.health).toBe(YTTE_HEALTH);
        expect(fight.tutorialTime).toBeGreaterThanOrEqual(FIGHT_TUTORIAL_LOCK_SECONDS);
        expect(fight.press()).toBeNull();
        expect(fight.tutorial).toBe(false);
        expect(fight.press()).not.toBeNull();
    });

    it("punching into his guard barely hurts him but costs stamina", () => {
        const fight = new FistFight("medium", () => 0.5);
        fight.start();
        fight.tutorial = false;
        expect(fight.ytteGuardUp).toBe(true);
        expect(fight.press()).toBe("chip_ytte");
        expect(fight.ytte.health).toBeGreaterThan(YTTE_HEALTH - 0.2);
        expect(fight.player.stamina).toBeLessThan(1);
    });

    it("he answers a punch into his guard with a jab too quick to duck", () => {
        const fight = new FistFight("medium", () => 0.5);
        fight.start();
        fight.tutorial = false;
        fight.press();
        expect(fight.phase).toBe("windup");
        expect(fight.duckWindowOpen).toBe(false);
        runUntil(fight, () => fight.phase === "strike");
        expect(fight.lastEvent).toBe("hit_player");
    });

    it("lands clean hits while he swings", () => {
        const fight = new FistFight("medium", () => 0.5);
        fight.start();
        fight.tutorial = false;
        runUntil(fight, () => fight.phase === "windup");
        expect(fight.press()).toBe("hit_ytte");
        expect(fight.ytte.health).toBe(YTTE_HEALTH - 1);
    });

    it("your guard soaks his swing when you hold back", () => {
        const fight = new FistFight("medium", () => 0.5);
        fight.start();
        fight.tutorial = false;
        const before = fight.player.health;
        runUntil(fight, () => fight.phase === "strike");
        expect(fight.lastEvent).toBe("chip_player");
        expect(before - fight.player.health).toBeLessThan(0.2);
    });

    it("his swing lands clean while you're mid-punch", () => {
        const fight = new FistFight("medium", () => 0.5);
        fight.start();
        fight.tutorial = false;
        // Early in the wind-up: the punch lands, but commits you as his swing comes in
        runUntil(fight, () => fight.phase === "windup" && fight.phaseDuration - fight.phaseTime < 0.45);
        expect(fight.press()).toBe("hit_ytte");
        expect(fight.duckWindowOpen).toBe(false);
        runUntil(fight, () => fight.phase === "strike");
        expect(fight.lastEvent).toBe("hit_player");
    });

    it("ducking at the last moment dodges the swing and counters", () => {
        const fight = new FistFight("medium", () => 0.5);
        fight.start();
        fight.tutorial = false;
        runUntil(fight, () => fight.duckWindowOpen);
        const before = fight.player.health;
        expect(fight.press()).toBe("hit_ytte");
        expect(fight.ducked).toBe(true);
        runUntil(fight, () => fight.phase === "guard");
        expect(fight.player.health).toBe(before);
    });

    it("running out of stamina breaks your guard until it recovers", () => {
        const fight = new FistFight("medium", () => 0.5);
        fight.start();
        fight.tutorial = false;
        fight.player.health = 100;
        for (let i = 0; i < 10 && !fight.player.winded; i++) {
            fight.press();
            fight.tick(0.55);
        }
        expect(fight.player.winded).toBe(true);
        expect(fight.playerGuardUp).toBe(false);
        expect(fight.press()).toBeNull();
        runUntil(fight, () => !fight.player.winded, 20);
        expect(fight.player.stamina).toBeGreaterThan(0.3);
    });

    it("a winded Ytte drops his guard", () => {
        const fight = new FistFight("medium", () => 0.5);
        fight.start();
        fight.tutorial = false;
        fight.ytte.spend(1);
        expect(fight.ytteGuardUp).toBe(false);
        expect(fight.press()).toBe("hit_ytte");
    });

    it("Ytte tires himself out swinging, then has to recover", () => {
        const fight = new FistFight("hard", () => 0);
        fight.start();
        fight.tutorial = false;
        runUntil(fight, () => fight.ytte.winded, 30);
        expect(fight.ytte.winded).toBe(true);
    });

    it("ten clean counters knock him out", () => {
        const fight = new FistFight("easy", () => 0.5);
        fight.start();
        fight.tutorial = false;
        for (let i = 0; i < YTTE_HEALTH && fight.result === "ongoing"; i++) {
            runUntil(fight, () => fight.duckWindowOpen || fight.result !== "ongoing", 30);
            fight.press();
        }
        expect(fight.result).toBe("won");
    });

    it("mashing leaves the detective winded and beaten", () => {
        const fight = new FistFight("medium", () => 0.5);
        fight.start();
        fight.tutorial = false;
        for (let t = 0; t < 120 && fight.result === "ongoing"; t += 0.05) {
            fight.press();
            fight.tick(0.05);
        }
        expect(fight.result).toBe("lost");
    });

    it("knocking Ytte out plays in slow motion, then catches up", () => {
        const fight = new FistFight("medium", () => 0.5);
        fight.start();
        fight.tutorial = false;
        fight.ytte.spend(1);
        fight.ytte.health = 1;
        expect(fight.press()).toBe("hit_ytte");
        expect(fight.result).toBe("won");
        fight.tick(1);
        expect(fight.slowMo).toBe(true);
        expect(fight.outroTime).toBeLessThan(0.3);
        runUntil(fight, () => fight.outroTime >= FIGHT_OUTRO_SECONDS, 10);
        expect(fight.outroRealTime).toBeGreaterThan(FIGHT_OUTRO_SECONDS);
        expect(fight.outroRealTime).toBeLessThan(4);
    });

    it("the detective's own knockout is not slowed", () => {
        const fight = new FistFight("medium", () => 0.5);
        fight.start();
        fight.tutorial = false;
        fight.player.spend(1);
        fight.player.health = 0.5;
        runUntil(fight, () => fight.result === "lost", 10);
        expect(fight.result).toBe("lost");
        fight.tick(1);
        expect(fight.outroTime).toBeCloseTo(1, 5);
    });
});
