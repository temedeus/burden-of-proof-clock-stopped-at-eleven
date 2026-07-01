import { describe, expect, it, vi } from "vitest";
import { isExitUnlocked, isTransitionConfirm, runPuzzleConfirm, targetRoomFromTransitionConfirm } from "./registry";

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

describe("transition confirm ids", () => {
    it("detects transition-prefixed confirm ids", () => {
        expect(isTransitionConfirm("transition:cellar_storage")).toBe(true);
        expect(isTransitionConfirm("study_secret")).toBe(false);
    });

    it("extracts the target room id", () => {
        expect(targetRoomFromTransitionConfirm("transition:cellar_storage")).toBe("cellar_storage");
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
