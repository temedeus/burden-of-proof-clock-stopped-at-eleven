import { describe, expect, it, vi } from "vitest";
import { isExitUnlocked, runPuzzleConfirm } from "./registry";

describe("runPuzzleConfirm", () => {
    it("invokes a registered handler and returns true", () => {
        const handler = vi.fn();
        const handled = runPuzzleConfirm("study_secret", { study_secret: handler });
        expect(handled).toBe(true);
        expect(handler).toHaveBeenCalledOnce();
    });

    it("returns false when no handler exists", () => {
        expect(runPuzzleConfirm("unknown", {})).toBe(false);
    });
});

describe("isExitUnlocked", () => {
    it("allows exits with no unlock requirement", () => {
        expect(isExitUnlocked(undefined, new Set())).toBe(true);
    });

    it("requires the unlock id to be present in the set", () => {
        const unlocked = new Set(["study_secret"]);
        expect(isExitUnlocked("study_secret", unlocked)).toBe(true);
        expect(isExitUnlocked("other_lock", unlocked)).toBe(false);
    });
});
