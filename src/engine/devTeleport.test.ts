import { describe, expect, it } from "vitest";
import story from "../data/story/generated/stories/active.json";
import { createSaveValidationContext } from "./SaveGame";
import { DEV_TELEPORT_MOMENTS, isDevTeleportEnabled } from "./devTeleport";

const requires = new Map<string, string[]>(
    (story.generatedClues as { id: string; requiresClues?: string[] }[]).map((c) => [c.id, c.requiresClues ?? []])
);

describe("dev teleport moments", () => {
    const ctx = createSaveValidationContext();

    it("is only enabled with ?devTeleport", () => {
        expect(isDevTeleportEnabled("?devTeleport")).toBe(true);
        expect(isDevTeleportEnabled("?debug=1")).toBe(false);
        expect(isDevTeleportEnabled("")).toBe(false);
    });

    for (const m of DEV_TELEPORT_MOMENTS) {
        it(`${m.id}: stages a valid, consistent story state`, () => {
            expect(ctx.roomIds.has(m.roomId)).toBe(true);
            for (const clue of m.clues) {
                expect(ctx.clueIds.has(clue), clue).toBe(true);
                // Every staged clue's prerequisites are staged too
                for (const req of requires.get(clue) ?? []) {
                    expect(m.clues, `${clue} needs ${req}`).toContain(req);
                }
            }
            // The trigger's clue is left for the player to find
            if (m.trigger.clueId) {
                expect(m.clues).not.toContain(m.trigger.clueId);
                for (const req of requires.get(m.trigger.clueId) ?? []) {
                    expect(m.clues, `${m.trigger.clueId} needs ${req}`).toContain(req);
                }
            }
        });
    }
});
