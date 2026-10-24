import { describe, expect, it } from "vitest";
import { FistFight, YTTE_STAMINA } from "./FistFight";

/** Advance in small steps until `until` holds (or give up after `max` seconds). */
function runUntil(fight: FistFight, until: () => boolean, max = 10): void {
    for (let t = 0; t < max && !until(); t += 0.01) fight.tick(0.01);
}

describe("FistFight", () => {
    it("lands punches while his guard is down", () => {
        const fight = new FistFight("medium", () => 0);
        fight.start();
        runUntil(fight, () => fight.phase === "open");
        expect(fight.press()).toBe("hit_ytte");
        expect(fight.ytteStamina).toBe(YTTE_STAMINA - 1);
    });

    it("punching into his guard costs stamina and staggers", () => {
        const fight = new FistFight("medium", () => 0);
        fight.start();
        const before = fight.playerStamina;
        expect(fight.press()).toBe("blocked");
        expect(fight.playerStamina).toBeLessThan(before);
        expect(fight.press()).toBeNull();
    });

    it("ducking at the last moment dodges the swing and counters", () => {
        const fight = new FistFight("medium", () => 0);
        fight.start();
        runUntil(fight, () => fight.duckWindowOpen);
        const before = fight.playerStamina;
        expect(fight.press()).toBe("hit_ytte");
        expect(fight.ducked).toBe(true);
        runUntil(fight, () => fight.phase === "guard");
        expect(fight.playerStamina).toBe(before);
    });

    it("his swing connects when you do nothing", () => {
        const fight = new FistFight("medium", () => 0);
        fight.start();
        const before = fight.playerStamina;
        runUntil(fight, () => fight.phase === "strike");
        expect(fight.playerStamina).toBe(before - 1);
    });

    it("ten clean punches knock him out", () => {
        const fight = new FistFight("hard", () => 0.5);
        fight.start();
        for (let i = 0; i < YTTE_STAMINA; i++) {
            runUntil(fight, () => fight.duckWindowOpen);
            fight.press();
        }
        expect(fight.result).toBe("won");
    });

    it("standing still gets the detective knocked out", () => {
        const fight = new FistFight("hard", () => 0.5);
        fight.start();
        runUntil(fight, () => fight.result !== "ongoing", 60);
        expect(fight.result).toBe("lost");
    });

    it("mashing into his guard wears the detective down", () => {
        const fight = new FistFight("medium", () => 0.5);
        fight.start();
        for (let t = 0; t < 60 && fight.result === "ongoing"; t += 0.05) {
            fight.press();
            fight.tick(0.05);
        }
        expect(fight.result).toBe("lost");
    });
});
