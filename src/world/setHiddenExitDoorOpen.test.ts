import { describe, expect, it } from "vitest";
import { Room } from "./Room";
import { TileMap } from "./TileMap";
import { TILE_DOOR, TILE_WALL } from "./TileTypes";
import { setHiddenExitDoorOpen } from "./Rooms";

describe("setHiddenExitDoorOpen", () => {
    it("closes and opens the full north-wall thickness for a top exit", () => {
        const width = 12;
        const height = 10;
        const thickness = 2;
        const tiles = new Array(width * height).fill(0);
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < thickness; y++) {
                tiles[y * width + x] = TILE_WALL;
            }
        }
        // Door carved through both wall rows at x=5
        for (let y = 0; y < thickness; y++) {
            for (const x of [4, 5, 6]) {
                tiles[y * width + x] = TILE_DOOR;
            }
        }

        const room = new Room(
            "study",
            new TileMap(width, height, tiles),
            [
                {
                    x: 5,
                    y: 0,
                    targetRoom: "hidden_room",
                    spawnX: 5,
                    spawnY: 8
                }
            ],
            [],
            [],
            0,
            thickness
        );

        setHiddenExitDoorOpen(room, false, "hidden_room");
        for (const y of [0, 1]) {
            for (const x of [4, 5, 6]) {
                expect(room.map.getTile(x, y)).toBe(TILE_WALL);
            }
        }

        setHiddenExitDoorOpen(room, true, "hidden_room");
        for (const y of [0, 1]) {
            for (const x of [4, 5, 6]) {
                expect(room.map.getTile(x, y)).toBe(TILE_DOOR);
            }
        }
    });
});
