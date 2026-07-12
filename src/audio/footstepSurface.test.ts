import { describe, expect, it } from "vitest";
import { resolveFootstepSound } from "./footstepSurface";
import { NPC } from "../entities/NPC";
import type { Interactable } from "../world/Interactable";
import { TILE_SIZE } from "../world/constants";

describe("resolveFootstepSound", () => {
    const baron = new NPC(
        "baron",
        12 * TILE_SIZE,
        11 * TILE_SIZE,
        "Baron Blackwood",
        "Baron",
        "baron_body",
        false,
        true,
        "squish"
    );

    const bloodPool: Interactable = {
        id: "baron_blood_pool",
        name: "Blood pool",
        description: "Blood has pooled beneath the body.",
        tiles: [
            { x: 12, y: 11 },
            { x: 13, y: 11 },
            { x: 12, y: 12 },
            { x: 13, y: 12 }
        ],
        footprintTiles: [
            { x: 12, y: 11 },
            { x: 13, y: 11 },
            { x: 12, y: 12 },
            { x: 13, y: 12 }
        ],
        footstepSound: "squish",
        footstepOnlyDecor: true,
        walkableDecor: true,
        nonInteractive: true
    };

    it("plays squish when the player overlaps a walkable floor NPC", () => {
        expect(
            resolveFootstepSound(
                12 * TILE_SIZE,
                12 * TILE_SIZE,
                TILE_SIZE * 2,
                TILE_SIZE * 2,
                [],
                [baron]
            )
        ).toBe("squish");
    });

    it("plays squish when only the lower half of the player overlaps the body", () => {
        expect(
            resolveFootstepSound(
                12 * TILE_SIZE,
                12 * TILE_SIZE + 16,
                TILE_SIZE * 2,
                TILE_SIZE * 2,
                [],
                [baron]
            )
        ).toBe("squish");
    });

    it("plays squish from the invisible blood pool decor", () => {
        expect(
            resolveFootstepSound(
                12 * TILE_SIZE,
                12 * TILE_SIZE + 16,
                TILE_SIZE * 2,
                TILE_SIZE * 2,
                [bloodPool],
                []
            )
        ).toBe("squish");
    });

    it("does not play squish when the player is beside the body", () => {
        expect(
            resolveFootstepSound(
                14 * TILE_SIZE,
                12 * TILE_SIZE,
                TILE_SIZE * 2,
                TILE_SIZE * 2,
                [],
                [baron]
            )
        ).toBeUndefined();
    });
});
