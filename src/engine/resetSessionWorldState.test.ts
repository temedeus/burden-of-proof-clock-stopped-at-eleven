import { describe, expect, it } from "vitest";
import {
    isAtticWindowBroken,
    markAtticWindowBroken,
    resetAtticWindows
} from "../world/atticWindows";
import { resetSessionWorldState } from "./resetSessionWorldState";
import { Game } from "./Game";
import { Input } from "./Input";
import { resolveActiveStory } from "../content/loadStoryContent";

function mockCtx(): CanvasRenderingContext2D {
    return {
        canvas: { width: 800, height: 600 },
        measureText: (text: string) => ({ width: text.length * 8 }) as TextMetrics,
        fillRect: () => {},
        fillText: () => {},
        save: () => {},
        restore: () => {}
    } as unknown as CanvasRenderingContext2D;
}

function mockInput(): Input {
    return {
        wasPressed: () => false,
        isDown: () => false,
        tapVirtual: () => {},
        setVirtualDown: () => {}
    } as unknown as Input;
}

describe("resetSessionWorldState", () => {
    it("clears broken attic windows left by a prior run", () => {
        resetAtticWindows();
        markAtticWindowBroken(5);
        markAtticWindowBroken(19);
        expect(isAtticWindowBroken(5)).toBe(true);
        expect(isAtticWindowBroken(19)).toBe(true);

        resetSessionWorldState();

        expect(isAtticWindowBroken(5)).toBe(false);
        expect(isAtticWindowBroken(19)).toBe(false);
    });

    it("new Game construction clears broken windows (New Game path)", () => {
        markAtticWindowBroken(5);
        expect(isAtticWindowBroken(5)).toBe(true);

        const story = resolveActiveStory();
        expect(story).not.toBeNull();

        new Game(mockCtx(), {
            playerSprite: "female_detective",
            storyId: story!.id,
            input: mockInput()
        });

        expect(isAtticWindowBroken(5)).toBe(false);
    });
});
