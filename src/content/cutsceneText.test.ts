import { describe, expect, it } from "vitest";
import { VALID_SPRITE_NAMES } from "@cse/content-schema";
import { CUTSCENE_TEXT } from "./cutsceneText";
import { loadGameContent } from "./loadGameContent";

describe("cutscenes.json", () => {
    it("has no empty lines outside the premise slide's paragraph break", () => {
        const empty: string[] = [];
        const walk = (value: unknown, path: string): void => {
            if (typeof value === "string") {
                if (!value.trim() && path !== "intro.premise.lines") empty.push(path);
            } else if (Array.isArray(value)) {
                if (value.length === 0) empty.push(path);
                value.forEach((v) => walk(v, path));
            } else if (value && typeof value === "object") {
                for (const [key, v] of Object.entries(value)) walk(v, `${path ? `${path}.` : ""}${key}`);
            }
        };
        walk(CUTSCENE_TEXT, "");
        expect(empty).toEqual([]);
    });

    it("stages brawls only in real rooms", () => {
        const rooms = loadGameContent().rooms;
        const brawlRooms = Object.keys(CUTSCENE_TEXT.finale.fistFightRooms);
        expect(brawlRooms.length).toBeGreaterThan(0);
        for (const id of brawlRooms) expect(rooms[id], id).toBeDefined();
    });

    it("draws every household card with a registered sprite", () => {
        const sprites = new Set<string>(VALID_SPRITE_NAMES);
        for (const card of CUTSCENE_TEXT.intro.household) expect(sprites, card.name).toContain(card.spriteName);
    });
});
