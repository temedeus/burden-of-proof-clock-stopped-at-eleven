import { describe, expect, it } from "vitest";
import { CourtyardSeagullController } from "./CourtyardSeagullController";

describe("CourtyardSeagullController", () => {
    it("plays on courtyard entry and clears elsewhere", () => {
        const ctrl = new CourtyardSeagullController();
        ctrl.syncForRoom("courtyard");
        expect(ctrl.getActors().length).toBe(1);

        ctrl.syncForRoom("hall");
        expect(ctrl.getActors().length).toBe(0);
    });

    it("perches then leaves after the sequence", () => {
        const ctrl = new CourtyardSeagullController();
        ctrl.syncForRoom("courtyard");

        // Still entering
        ctrl.update(0.5, "courtyard");
        expect(ctrl.getActors().length).toBe(1);

        // Finish enter + most of perch
        ctrl.update(1.0, "courtyard");
        ctrl.update(4.5, "courtyard");
        expect(ctrl.getActors().length).toBe(1);

        // Finish perch + exit
        ctrl.update(1.0, "courtyard");
        ctrl.update(2.0, "courtyard");
        expect(ctrl.getActors().length).toBe(0);
    });

    it("restarts when re-entering the courtyard", () => {
        const ctrl = new CourtyardSeagullController();
        ctrl.syncForRoom("courtyard");
        ctrl.update(20, "courtyard");
        expect(ctrl.getActors().length).toBe(0);

        ctrl.syncForRoom("kitchen");
        ctrl.syncForRoom("courtyard");
        expect(ctrl.getActors().length).toBe(1);
    });
});
