import { describe, expect, it } from "vitest";
import { MAP_FLOORS, MAP_LAYOUT, edgeSegment } from "./MapScreen";
import { loadGameContent } from "../content/loadGameContent";

describe("MapScreen layout", () => {
    it("covers every room", () => {
        const ids = Object.keys(loadGameContent().rooms).sort();
        expect(Object.keys(MAP_LAYOUT).sort()).toEqual(ids);
    });

    it("has no overlapping rooms on a floor", () => {
        for (const floor of MAP_FLOORS) {
            const ids = Object.keys(floor.rooms);
            for (let i = 0; i < ids.length; i++) {
                for (let j = i + 1; j < ids.length; j++) {
                    const a = floor.rooms[ids[i]];
                    const b = floor.rooms[ids[j]];
                    const overlap =
                        a.x < b.x + b.w - 0.01 && b.x < a.x + a.w - 0.01 && a.y < b.y + b.h - 0.01 && b.y < a.y + a.h - 0.01;
                    expect(overlap, `${ids[i]} / ${ids[j]}`).toBe(false);
                }
            }
        }
    });

    it("links neighbouring rooms", () => {
        expect(edgeSegment(MAP_LAYOUT.hall, MAP_LAYOUT.dining)).not.toBeNull();
    });
});
