import { describe, expect, it } from "vitest";
import {
    AtticWindowCutscene,
    nearestAtticWindowLanding,
    playerNearAtticWindow
} from "./AtticWindowCutscene";
import { resetAtticWindows, isAtticWindowBroken } from "../world/atticWindows";
import { TILE_SIZE } from "../world/constants";

describe("AtticWindowCutscene", () => {
    it("marks the window broken on crash and finishes", () => {
        resetAtticWindows();
        const cut = new AtticWindowCutscene();
        cut.start(100, 100, 160, 40, 5);

        let sawCrash = false;
        let finished = false;
        for (let i = 0; i < 40; i++) {
            const tick = cut.tick(0.05);
            if (tick.playCrash) sawCrash = true;
            if (tick.finished) finished = true;
        }

        expect(sawCrash).toBe(true);
        expect(finished).toBe(true);
        expect(isAtticWindowBroken(5)).toBe(true);
        expect(cut.active).toBe(false);
    });

    it("detects proximity to either attic window", () => {
        const nearLeft = {
            x: 5 * TILE_SIZE - 10,
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
        const right = nearestAtticWindowLanding(20 * TILE_SIZE, 100, 24, 32);
        expect(right.tileX).toBe(19);
    });
});
