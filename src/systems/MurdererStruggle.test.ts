import { describe, expect, it } from "vitest";
import { MurdererStruggle } from "./MurdererStruggle";

describe("MurdererStruggle", () => {
    it("starts at a mid fill and is not immediately catchable while active", () => {
        const struggle = new MurdererStruggle("medium");
        struggle.start();
        expect(struggle.active).toBe(true);
        expect(struggle.progress).toBeGreaterThan(0.3);
        expect(struggle.progress).toBeLessThan(0.7);
        expect(struggle.canCatch()).toBe(false);
    });

    it("fills toward success when pressed faster than the drain", () => {
        const struggle = new MurdererStruggle("medium");
        struggle.start();

        for (let i = 0; i < 8; i++) {
            struggle.press();
            const result = struggle.tick(0.05);
            if (result === "success") {
                expect(struggle.active).toBe(false);
                expect(struggle.canCatch()).toBe(false);
                return;
            }
        }
        // A few more presses if still short
        for (let i = 0; i < 6; i++) {
            struggle.press();
            if (struggle.tick(0.02) === "success") {
                expect(struggle.active).toBe(false);
                return;
            }
        }
        expect(struggle.tick(0)).toBe("success");
    });

    it("fails when the meter drains without presses", () => {
        const struggle = new MurdererStruggle("medium");
        struggle.start();
        let result = struggle.tick(0.5);
        expect(result).toBe("ongoing");
        result = struggle.tick(5);
        expect(result).toBe("fail");
        expect(struggle.active).toBe(false);
        expect(struggle.progress).toBe(0);
    });

    it("blocks re-catch briefly after success", () => {
        const struggle = new MurdererStruggle("easy");
        struggle.start();
        while (struggle.active) {
            struggle.press();
            struggle.tick(0.01);
        }
        expect(struggle.canCatch()).toBe(false);
        struggle.tick(struggle.catchCooldownSeconds + 0.05);
        expect(struggle.canCatch()).toBe(true);
    });
});
