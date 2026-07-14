import { describe, expect, it } from "vitest";
import {
    createRoomTitleBanner,
    DIALOG_LINES_PER_PAGE,
    paginateDialog,
    tickRoomTitleBanner,
    ROOM_TITLE_DURATION
} from "./GameHud";
import { roomViewportOffset } from "../world/constants";

function mockDialogContext(charWidth = 8): CanvasRenderingContext2D {
    return {
        canvas: { width: 800, height: 600 },
        font: "",
        measureText(text: string) {
            return { width: text.length * charWidth };
        }
    } as unknown as CanvasRenderingContext2D;
}

describe("GameHud dialog pagination", () => {
    it("splits wrapped dialogue into sections of at most three lines", () => {
        const ctx = mockDialogContext();
        const text =
            "Line one is here. Line two follows. Line three next. Line four should start a new page. Line five too.";
        const pages = paginateDialog(ctx, text);

        expect(pages.length).toBeGreaterThan(1);
        for (const page of pages) {
            expect(page.split("\n").length).toBeLessThanOrEqual(DIALOG_LINES_PER_PAGE);
        }
        expect(pages.join(" ")).toContain("four should");
    });

    it("preserves explicit paragraph breaks within a page when short enough", () => {
        const ctx = mockDialogContext();
        const pages = paginateDialog(ctx, "First paragraph.\nSecond paragraph.");
        expect(pages).toEqual(["First paragraph.\nSecond paragraph."]);
    });
});

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
