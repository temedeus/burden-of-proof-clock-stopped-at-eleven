import { describe, expect, it } from "vitest";
import { resolveEventNpcDialog } from "./eventNpcDialog";

describe("resolveEventNpcDialog", () => {
    const has =
        (...ids: string[]) =>
        (id: string) =>
            ids.includes(id);

    it("returns null in early game", () => {
        expect(
            resolveEventNpcDialog({
                speakerId: "baroness",
                diningFireResolved: false,
                atticScareComplete: false,
                hasClue: has()
            })
        ).toBeNull();
    });

    it("points baroness, maid, and thompson to restless horses after smuggling papers", () => {
        for (const speakerId of ["baroness", "maid", "butler"] as const) {
            const line = resolveEventNpcDialog({
                speakerId,
                diningFireResolved: true,
                atticScareComplete: true,
                hasClue: has("smuggling_documents")
            });
            expect(line, speakerId).toMatch(/horses/i);
        }
    });

    it("prefers later evidence over fire acknowledgment", () => {
        const line = resolveEventNpcDialog({
            speakerId: "baroness",
            diningFireResolved: true,
            atticScareComplete: true,
            hasClue: has("bloody_apron")
        });
        expect(line).toMatch(/apron/i);
    });

    it("gives Walsh mid-game dining and attic beats", () => {
        expect(
            resolveEventNpcDialog({
                speakerId: "police",
                diningFireResolved: true,
                atticScareComplete: false,
                hasClue: has()
            })
        ).toMatch(/dining room/i);

        expect(
            resolveEventNpcDialog({
                speakerId: "police",
                diningFireResolved: true,
                atticScareComplete: true,
                hasClue: has()
            })
        ).toMatch(/attic/i);
    });

    it("defers Walsh confront line to story dialog when weapon is found", () => {
        expect(
            resolveEventNpcDialog({
                speakerId: "police",
                diningFireResolved: true,
                atticScareComplete: true,
                hasClue: has("murder_weapon", "bloody_apron")
            })
        ).toBeNull();
    });

    it("updates butler, reed, and stable boy after fire", () => {
        expect(
            resolveEventNpcDialog({
                speakerId: "butler",
                diningFireResolved: true,
                atticScareComplete: false,
                hasClue: has()
            })
        ).toMatch(/dining room/i);

        expect(
            resolveEventNpcDialog({
                speakerId: "police2",
                diningFireResolved: true,
                atticScareComplete: false,
                hasClue: has()
            })
        ).toMatch(/dining room/i);

        expect(
            resolveEventNpcDialog({
                speakerId: "worker_boy",
                diningFireResolved: true,
                atticScareComplete: false,
                hasClue: has()
            })
        ).toMatch(/dining room/i);
    });
});
