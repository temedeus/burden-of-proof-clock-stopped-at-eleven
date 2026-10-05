import { describe, expect, it } from "vitest";
import { MOOSE_LEFT_HALF, STUFFED_MOOSE_H, STUFFED_MOOSE_W } from "./stuffed_moose";

describe("stuffed moose template", () => {
    it("left-half rows are half the sprite width and fit its height", () => {
        expect(MOOSE_LEFT_HALF.length).toBeLessThanOrEqual(STUFFED_MOOSE_H);
        for (const [i, row] of MOOSE_LEFT_HALF.entries()) {
            expect(row.length, `row ${i}`).toBe(STUFFED_MOOSE_W / 2);
        }
    });
});

import { ARMOR_LEFT_HALF, ARMOR_STAND_H, ARMOR_STAND_W } from "./armorStand";

describe("armor stand template", () => {
    it("left-half rows are half the sprite width and fit its height", () => {
        expect(ARMOR_LEFT_HALF.length).toBeLessThanOrEqual(ARMOR_STAND_H);
        for (const [i, row] of ARMOR_LEFT_HALF.entries()) {
            expect(row.length, `row ${i}`).toBe(ARMOR_STAND_W / 2);
        }
    });
});
