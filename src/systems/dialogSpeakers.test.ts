import { describe, expect, it } from "vitest";
import { PLAYER_SPEAKER, splitDialogSpeakers } from "./dialogSpeakers";

const resolve = (name: string) => (name === "Chef Ytte" ? "cook" : null);

describe("splitDialogSpeakers", () => {
    it("attributes prefixed paragraphs to the player and NPCs", () => {
        const segments = splitDialogSpeakers("You: Why did you help me?\n\nChef Ytte: I had no choice.", resolve);
        expect(segments).toEqual([
            { speakerId: PLAYER_SPEAKER, speakerName: "You", text: "Why did you help me?" },
            { speakerId: "cook", speakerName: "Chef Ytte", text: "I had no choice." }
        ]);
    });

    it("treats leading unprefixed text as narration", () => {
        const segments = splitDialogSpeakers("CRASH! The armor falls.\n\nYou: ...I'm sure it was like that.", resolve);
        expect(segments[0]).toEqual({ speakerId: null, speakerName: null, text: "CRASH! The armor falls." });
        expect(segments[1].speakerId).toBe(PLAYER_SPEAKER);
    });

    it("continues the previous speaker and keeps unknown prefixes in the text", () => {
        const segments = splitDialogSpeakers("Chef Ytte: Stay back!\n\nNote: not a person.", resolve);
        expect(segments[1]).toEqual({ speakerId: "cook", speakerName: "Chef Ytte", text: "Note: not a person." });
    });

    it("leaves plain examine text as narration", () => {
        expect(splitDialogSpeakers("A dusty clock.", resolve)).toEqual([
            { speakerId: null, speakerName: null, text: "A dusty clock." }
        ]);
    });
});
