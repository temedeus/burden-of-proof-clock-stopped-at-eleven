import { describe, expect, it } from "vitest";
import { TILE_SIZE } from "../world/constants";
import type { DoorExit } from "../world/Room";
import { DoorBarricade } from "./DoorBarricade";

const exit: DoorExit = { x: 5, y: 0, targetRoom: "hall", spawnX: 5, spawnY: 1 };
const doorCx = (exit.x + 0.5) * TILE_SIZE;
const doorCy = (exit.y + 0.5) * TILE_SIZE;

describe("DoorBarricade", () => {
    it("blocks only the barred exit in its room", () => {
        const bar = new DoorBarricade("medium");
        bar.place("library", exit);

        expect(bar.isBlocking("library", exit)).toBe(true);
        expect(bar.isBlocking("study", exit)).toBe(false);
        expect(bar.isBlocking("library", { ...exit })).toBe(false);
    });

    it("lifts the bar after holding long enough in reach", () => {
        const bar = new DoorBarricade("medium");
        bar.place("library", exit);

        expect(bar.tick(1, true, true)).toBe("prying");
        expect(bar.progress).toBeGreaterThan(0);
        expect(bar.tick(1.5, true, true)).toBe("removed");
        expect(bar.active).toBe(false);
    });

    it("restarts from zero when the hold is broken", () => {
        const bar = new DoorBarricade("medium");
        bar.place("library", exit);

        bar.tick(1.5, true, true);
        expect(bar.tick(0.1, false, true)).toBe("idle");
        expect(bar.progress).toBe(0);

        bar.tick(1.5, true, true);
        bar.tick(0.1, true, false);
        expect(bar.progress).toBe(0);

        bar.tick(1.5, true, true);
        bar.cancelPry();
        expect(bar.progress).toBe(0);
        expect(bar.active).toBe(true);
    });

    it("needs the player near the barred door", () => {
        const bar = new DoorBarricade("easy");
        bar.place("library", exit);

        expect(bar.inReach("library", doorCx, doorCy + TILE_SIZE)).toBe(true);
        expect(bar.inReach("library", doorCx, doorCy + TILE_SIZE * 4)).toBe(false);
        expect(bar.inReach("study", doorCx, doorCy + TILE_SIZE)).toBe(false);
    });
});
