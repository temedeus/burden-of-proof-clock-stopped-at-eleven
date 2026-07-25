import { describe, expect, it } from "vitest";
import {
    AtticWindowCutscene,
    nearestAtticWindowLanding,
    playerNearAtticWindow
} from "./AtticWindowCutscene";
import { resetAtticWindows, isAtticWindowBroken } from "../world/atticWindows";
import { TILE_SIZE } from "../world/constants";

describe("AtticWindowCutscene", () => {
    it("breaks the window mid-throw and finishes after the exit fade", () => {
        resetAtticWindows();
        const cut = new AtticWindowCutscene();
        cut.start(100, 100, 160, 40, 5, 1);

        let sawCrash = false;
        let finished = false;
        let hide = false;
        for (let i = 0; i < 80; i++) {
            const tick = cut.tick(0.05);
            if (tick.playCrash) sawCrash = true;
            if (tick.hideMurderer) hide = true;
            if (tick.finished) finished = true;
        }

        expect(sawCrash).toBe(true);
        expect(hide).toBe(true);
        expect(finished).toBe(true);
        expect(isAtticWindowBroken(5)).toBe(true);
        expect(cut.active).toBe(false);
    });

    it("eases throw pose with scale fade through the pane", () => {
        const cut = new AtticWindowCutscene();
        cut.start(0, 100, 100, 20, 5, 1);
        cut.tick(AtticWindowCutscene.THROW_DURATION * 0.8);
        const pose = cut.throwPose();
        expect(pose.scale).toBeLessThan(0.7);
        expect(pose.alpha).toBeLessThan(1);
        expect(Math.abs(pose.tilt)).toBeGreaterThan(0.2);
    });

    it("detects proximity to either attic window", () => {
        const nearLeft = {
            x: 4 * TILE_SIZE,
            y: 3 * TILE_SIZE,
            width: 24,
            height: 32
        };
        expect(playerNearAtticWindow(nearLeft, 24, 32)).toBe(true);

        const far = { x: 12 * TILE_SIZE, y: 8 * TILE_SIZE, width: 24, height: 32 };
        expect(playerNearAtticWindow(far, 24, 32)).toBe(false);
    });

    it("picks the nearer window landing", () => {
        const left = nearestAtticWindowLanding(4 * TILE_SIZE, 100, 24, 32);
        expect(left.tileX).toBe(5);
        const right = nearestAtticWindowLanding(19 * TILE_SIZE, 100, 24, 32);
        expect(right.tileX).toBe(19);
    });
});
