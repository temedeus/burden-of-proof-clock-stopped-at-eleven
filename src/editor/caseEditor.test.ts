import { describe, expect, it } from "vitest";
import { formatRequiresCluesInput, parseRequiresCluesInput } from "./caseEditor";

describe("caseEditor clue helpers", () => {
    it("parses comma-separated prerequisite ids", () => {
        expect(parseRequiresCluesInput("a, b , c")).toEqual(["a", "b", "c"]);
        expect(parseRequiresCluesInput("")).toBeUndefined();
    });

    it("formats prerequisite ids for the editor input", () => {
        expect(formatRequiresCluesInput(["examined_body", "examined_clock"])).toBe(
            "examined_body, examined_clock"
        );
    });
});
