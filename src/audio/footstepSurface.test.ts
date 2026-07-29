import { describe, expect, it } from "vitest";
import { resolveFootstepSound, surfaceFromTile } from "./footstepSurface";
import { NPC } from "../entities/NPC";
import type { Interactable } from "../world/Interactable";
import { TILE_SIZE } from "../world/constants";
import { TileMap } from "../world/TileMap";
import {
    TILE_ATTIC_FLOOR,
    TILE_FLOOR,
    TILE_GRASS,
    TILE_GRAVEL,
    TILE_PALE_ROCK,
    TILE_ROCK,
    TILE_SAND
} from "../world/TileTypes";

describe("resolveFootstepSound", () => {
    const baron = new NPC(
        "baron",
        12 * TILE_SIZE,
        11 * TILE_SIZE,
        "von Virtanen",
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

    it("prefers decor/NPC surface over map terrain", () => {
        const map = new TileMap(20, 20, Array(400).fill(TILE_GRASS));
        expect(
            resolveFootstepSound(
                12 * TILE_SIZE,
                12 * TILE_SIZE,
                TILE_SIZE * 2,
                TILE_SIZE * 2,
                [],
                [baron],
                map
            )
        ).toBe("squish");
    });

    it("resolves terrain underfoot when no decor overrides", () => {
        const cases: { tile: number; surface: string }[] = [
            { tile: TILE_GRASS, surface: "grass" },
            { tile: TILE_GRAVEL, surface: "gravel" },
            { tile: TILE_SAND, surface: "sand" },
            { tile: TILE_ROCK, surface: "rock" },
            { tile: TILE_PALE_ROCK, surface: "pale_rock" },
            { tile: TILE_ATTIC_FLOOR, surface: "attic_wood" }
        ];
        for (const { tile, surface } of cases) {
            const map = new TileMap(8, 8, Array(64).fill(tile));
            expect(
                resolveFootstepSound(
                    2 * TILE_SIZE,
                    2 * TILE_SIZE,
                    TILE_SIZE * 2,
                    TILE_SIZE * 2,
                    [],
                    [],
                    map
                )
            ).toBe(surface);
        }
    });

    it("falls back to undefined (default wood) for indoor floor tiles", () => {
        const map = new TileMap(8, 8, Array(64).fill(TILE_FLOOR));
        expect(
            resolveFootstepSound(
                2 * TILE_SIZE,
                2 * TILE_SIZE,
                TILE_SIZE * 2,
                TILE_SIZE * 2,
                [],
                [],
                map
            )
        ).toBeUndefined();
    });
});

describe("surfaceFromTile", () => {
    it("maps known terrain tiles", () => {
        expect(surfaceFromTile(TILE_GRASS)).toBe("grass");
        expect(surfaceFromTile(TILE_GRAVEL)).toBe("gravel");
        expect(surfaceFromTile(TILE_SAND)).toBe("sand");
        expect(surfaceFromTile(TILE_ROCK)).toBe("rock");
        expect(surfaceFromTile(TILE_PALE_ROCK)).toBe("pale_rock");
        expect(surfaceFromTile(TILE_ATTIC_FLOOR)).toBe("attic_wood");
        expect(surfaceFromTile(TILE_FLOOR)).toBeUndefined();
    });
});
