import { describe, expect, it } from "vitest";
import { FEMALE_FRONT_UPPER } from "./playerTemplates";

describe("player pixel templates", () => {
    it("female front rows are all 32px wide", () => {
        for (const [i, row] of FEMALE_FRONT_UPPER.entries()) {
            expect(row.length, `row ${i}`).toBe(32);
        }
    });

    it("female front rows only use known palette keys", () => {
        const keys = new Set(".nNRHhSsLemcCjJkgAT".split(""));
        for (const row of FEMALE_FRONT_UPPER) {
            for (const ch of row) expect(keys.has(ch), `key "${ch}"`).toBe(true);
        }
    });
});
