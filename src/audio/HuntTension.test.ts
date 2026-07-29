import { describe, expect, it } from "vitest";
import { HuntTension } from "./HuntTension";

describe("HuntTension", () => {
    it("stop is safe when never started", () => {
        const hunt = new HuntTension();
        expect(() => hunt.stop()).not.toThrow();
        expect(() => hunt.stop()).not.toThrow();
    });

    it("sync(false) stops without requiring an audio context", () => {
        const hunt = new HuntTension();
        expect(() => hunt.sync(false)).not.toThrow();
    });
});
