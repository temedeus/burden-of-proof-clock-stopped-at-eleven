import { describe, expect, it } from "vitest";
import {
    createRoomTitleBanner,
    tickRoomTitleBanner,
    ROOM_TITLE_DURATION
} from "./GameHud";
import { roomViewportOffset } from "../world/constants";

describe("GameHud room title banner", () => {
    it("creates a banner with zero elapsed time", () => {
        const banner = createRoomTitleBanner("Library");
        expect(banner).toEqual({ title: "Library", elapsed: 0 });
    });

    it("expires after the configured duration", () => {
        const banner = createRoomTitleBanner("Study");
        const afterHalf = tickRoomTitleBanner(banner, ROOM_TITLE_DURATION / 2);
        expect(afterHalf?.title).toBe("Study");

        const expired = tickRoomTitleBanner(afterHalf, ROOM_TITLE_DURATION);
        expect(expired).toBeNull();
    });

    it("returns null when ticking a null banner", () => {
        expect(tickRoomTitleBanner(null, 1)).toBeNull();
    });
});

describe("roomViewportOffset", () => {
    it("centers a room smaller than the canvas", () => {
        expect(roomViewportOffset(800, 600, 10, 8)).toEqual({ x: 240, y: 172 });
    });

    it("returns zero offset when the room matches the canvas in both dimensions", () => {
        expect(roomViewportOffset(800, 576, 25, 18)).toEqual({ x: 0, y: 0 });
    });

    it("vertically centers a room shorter than the canvas", () => {
        expect(roomViewportOffset(800, 600, 25, 18)).toEqual({ x: 0, y: 12 });
    });
});
