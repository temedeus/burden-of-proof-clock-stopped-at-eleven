import { describe, expect, it } from "vitest";
import { DialogController } from "./DialogController";

function mockContext(charWidth = 8): CanvasRenderingContext2D {
    return {
        canvas: { width: 800, height: 600 },
        font: "",
        measureText(text: string) {
            return { width: text.length * charWidth };
        }
    } as unknown as CanvasRenderingContext2D;
}

const resolveNpc = (name: string) => (name === "Mrs. Clarke" ? "maid" : null);

describe("DialogController", () => {
    it("pages per speaker and tracks who says each page", () => {
        const dialog = new DialogController(mockContext());
        dialog.setPages("The hall is cold.\n\nMrs. Clarke: I saw nothing!", resolveNpc);

        expect(dialog.pageCount).toBe(2);
        expect(dialog.page).toBe("The hall is cold.");
        expect(dialog.segment?.speakerId).toBeNull();
        expect(dialog.hasMorePages).toBe(true);

        expect(dialog.nextPage()).toBe(true);
        expect(dialog.page).toBe("I saw nothing!");
        expect(dialog.segment?.speakerId).toBe("maid");
        expect(dialog.nextPage()).toBe(false);

        dialog.clear();
        expect(dialog.page).toBeNull();
        expect(dialog.pageCount).toBe(0);
    });

    it("runs close callbacks once, in order", () => {
        const dialog = new DialogController(mockContext());
        const calls: string[] = [];
        dialog.whenClosed(() => calls.push("a"));
        dialog.whenClosed(() => calls.push("b"));
        dialog.runCloseCallbacks();
        dialog.runCloseCallbacks();
        expect(calls).toEqual(["a", "b"]);
    });

    it("keeps callbacks queued by a callback for the next close", () => {
        const dialog = new DialogController(mockContext());
        const calls: string[] = [];
        dialog.whenClosed(() => dialog.whenClosed(() => calls.push("later")));
        dialog.runCloseCallbacks();
        expect(calls).toEqual([]);
        dialog.runCloseCallbacks();
        expect(calls).toEqual(["later"]);
    });

    it("walks a confirm prompt to its last page, then hands over the confirmation", () => {
        const dialog = new DialogController(mockContext(40));
        const confirmation = { id: "study_secret", prompt: "Pull the loose book? ".repeat(20) };
        dialog.openConfirm(confirmation, "E — Yes    Esc — No");
        expect(dialog.confirmPageCount).toBeGreaterThan(1);

        while (!dialog.advanceConfirm()) {
            expect(dialog.confirmPage).not.toBeNull();
        }
        expect(dialog.takeConfirmation()).toBe(confirmation);
        expect(dialog.takeConfirmation()).toBeNull();
        expect(dialog.confirmPage).toBeNull();
    });

    it("cancelling clears the prompt", () => {
        const dialog = new DialogController(mockContext());
        dialog.openConfirm({ id: "attic_chest", prompt: "Open it?" }, "E — Yes");
        expect(dialog.confirmPage).toContain("Open it?");
        dialog.cancelConfirm();
        expect(dialog.confirmPage).toBeNull();
        expect(dialog.takeConfirmation()).toBeNull();
    });
});
