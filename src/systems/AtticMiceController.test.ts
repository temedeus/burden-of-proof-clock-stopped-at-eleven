import { describe, expect, it } from "vitest";
import { AtticMiceController } from "./AtticMiceController";

describe("AtticMiceController", () => {
    it("spawns mice only in the attic", () => {
        const ctrl = new AtticMiceController();
        ctrl.syncForRoom("attic");
        expect(ctrl.getActors(() => 0).length).toBe(3);

        ctrl.syncForRoom("study");
        expect(ctrl.getActors(() => 0).length).toBe(0);
    });

    it("keeps mice on beam rows after simulation", () => {
        const ctrl = new AtticMiceController();
        ctrl.syncForRoom("attic");
        for (let i = 0; i < 400; i++) {
            ctrl.update(0.05, "attic");
        }
        const beamYs = new Set(ctrl.getActors(() => 0).map((a) => a.y));
        expect(beamYs.size).toBeGreaterThan(0);
        for (const y of beamYs) {
            expect(y).toBe(12 * 32 + 14);
        }
    });
});
