import { describe, expect, it } from "vitest";
import type { DoorExit } from "../world/Room";
import { BAR_DOOR_ANIMATION_SECONDS, BarDoorAnimation, facingTowardExit } from "./BarDoorAnimation";

const exit: DoorExit = { x: 0, y: 9, targetRoom: "cellar_storage", spawnX: 17, spawnY: 9 };

describe("BarDoorAnimation", () => {
    it("slams once, then finishes", () => {
        const anim = new BarDoorAnimation();
        anim.start("wine_cellar", exit);

        let slams = 0;
        let done = false;
        for (let t = 0; t < BAR_DOOR_ANIMATION_SECONDS + 0.1 && !done; t += 0.05) {
            const tick = anim.tick(0.05);
            if (tick.slam) slams += 1;
            done = tick.done;
        }
        expect(slams).toBe(1);
        expect(done).toBe(true);
    });

    it("carries the plank from waist to overhead before the drop", () => {
        const anim = new BarDoorAnimation();
        anim.start("wine_cellar", exit);
        expect(anim.carrying).toBe(false);

        anim.tick(0.35);
        expect(anim.carrying).toBe(true);
        const low = anim.carryHeight;
        anim.tick(0.5);
        expect(anim.carryHeight).toBeLessThan(low);
        expect(anim.armsUp).toBe(true);
        expect(anim.dropT).toBe(0);

        anim.tick(0.3);
        expect(anim.carrying).toBe(false);
        expect(anim.slamShake).toBeGreaterThan(0);
    });

    it("faces the wall the door is on", () => {
        expect(facingTowardExit(exit, 25, 18)).toBe("left");
        expect(facingTowardExit({ x: 24, y: 9 }, 25, 18)).toBe("right");
        expect(facingTowardExit({ x: 5, y: 0 }, 25, 18)).toBe("up");
        expect(facingTowardExit({ x: 5, y: 17 }, 25, 18)).toBe("down");
    });
});
