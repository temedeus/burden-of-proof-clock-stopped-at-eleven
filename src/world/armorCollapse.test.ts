import { describe, expect, it } from "vitest";
import { ARMOR_LAND_TIMES } from "../assets/procedural/armorStand";
import {
    ARMOR_HEAP_DESCRIPTION,
    applyArmorCollapsedToRooms,
    getArmorCollapseT,
    isArmorCollapsed,
    resetArmorCollapse,
    setArmorCollapsed,
    startArmorCollapse,
    tickArmorCollapse
} from "./armorCollapse";
import type { Room } from "./Room";

describe("armor collapse easter egg", () => {
    it("clanks once per piece and finishes once", () => {
        resetArmorCollapse();
        startArmorCollapse();
        let impacts = 0;
        let doneCount = 0;
        for (let i = 0; i < 200; i++) {
            const tick = tickArmorCollapse(0.02);
            impacts += tick.impacts;
            if (tick.done) doneCount++;
        }
        expect(impacts).toBe(ARMOR_LAND_TIMES.length);
        expect(doneCount).toBe(1);
        expect(isArmorCollapsed()).toBe(true);
    });

    it("restores from saves and turns the confirm into plain examine", () => {
        setArmorCollapsed(false);
        expect(getArmorCollapseT()).toBeNull();
        setArmorCollapsed(true);
        expect(tickArmorCollapse(0.1)).toEqual({ impacts: 0, done: false });

        const armor = {
            spriteName: "armor_stand",
            description: "standing",
            interactionType: "confirm",
            confirmId: "armor_shake",
            confirmPrompt: "Shake?"
        };
        applyArmorCollapsedToRooms({ landing_west: { interactables: [armor] } as unknown as Room });
        expect(armor.interactionType).toBeUndefined();
        expect(armor.confirmId).toBeUndefined();
        expect(armor.description).toBe(ARMOR_HEAP_DESCRIPTION);
        resetArmorCollapse();
    });
});
