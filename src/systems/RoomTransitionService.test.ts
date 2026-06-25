import { describe, expect, it } from "vitest";
import { Player } from "../entities/Player";
import { TILE_SIZE } from "../world/constants";
import { Room } from "../world/Room";
import { TileMap } from "../world/TileMap";
import type { DoorExit } from "../world/Room";
import { RoomTransitionService } from "./RoomTransitionService";

function makeRoom(id: string, width: number, height: number, exits: DoorExit[]): Room {
    return new Room(id, new TileMap(width, height, new Array(width * height).fill(0)), exits, [], []);
}

describe("RoomTransitionService", () => {
    it("returns null while transition cooldown is active", () => {
        const service = new RoomTransitionService();
        service.roomTransitionCooldown = 0.5;

        const hall = makeRoom("hall", 10, 10, [
            { x: 5, y: 9, targetRoom: "library", spawnX: 5, spawnY: 2 }
        ]);
        const library = makeRoom("library", 10, 10, []);
        const player = new Player("player", 5 * TILE_SIZE, 8 * TILE_SIZE);

        const result = service.checkTransition(player, hall, { hall, library }, () => false);
        expect(result).toBeNull();
    });

    it("detects overlap with a bottom-wall door and returns the target room", () => {
        const service = new RoomTransitionService();
        const hall = makeRoom("hall", 10, 10, [
            { x: 5, y: 9, targetRoom: "library", spawnX: 5, spawnY: 2 }
        ]);
        const library = makeRoom("library", 10, 10, [
            { x: 5, y: 0, targetRoom: "hall", spawnX: 5, spawnY: 7 }
        ]);

        const player = new Player("player", 5 * TILE_SIZE, 8 * TILE_SIZE);
        const result = service.checkTransition(player, hall, { hall, library }, () => false);

        expect(result).toEqual({
            nextRoom: library,
            targetRoomId: "library",
            fromRoomId: "hall",
            spawnX: 5,
            spawnY: 2
        });
        expect(service.roomTransitionCooldown).toBeGreaterThan(0);
    });

    it("skips blocked exits", () => {
        const service = new RoomTransitionService();
        const hall = makeRoom("hall", 10, 10, [
            {
                x: 5,
                y: 9,
                targetRoom: "hidden_room",
                spawnX: 5,
                spawnY: 2,
                requiresUnlock: "study_secret"
            }
        ]);
        const hidden = makeRoom("hidden_room", 8, 8, []);
        const player = new Player("player", 5 * TILE_SIZE, 8 * TILE_SIZE);

        const result = service.checkTransition(
            player,
            hall,
            { hall, hidden_room: hidden },
            (exit) => exit.requiresUnlock === "study_secret"
        );

        expect(result).toBeNull();
    });

    it("insets the player after transitioning through a top-wall entry", () => {
        const service = new RoomTransitionService();
        const hall = makeRoom("hall", 10, 10, [
            { x: 5, y: 9, targetRoom: "library", spawnX: 5, spawnY: 0 }
        ]);
        const library = makeRoom("library", 10, 10, [
            { x: 5, y: 0, targetRoom: "hall", spawnX: 5, spawnY: 7 }
        ]);
        const player = new Player("player", 0, 0);

        service.placePlayerAfterRoomTransition(player, "hall", library, 5, 0);

        expect(player.y).toBeGreaterThanOrEqual(3 * TILE_SIZE);
        expect(player.x).toBeGreaterThanOrEqual(TILE_SIZE);
        expect(player.x).toBeLessThanOrEqual((library.map.width - 2) * TILE_SIZE);
    });

    it("ticks cooldown down toward zero", () => {
        const service = new RoomTransitionService();
        service.roomTransitionCooldown = 1;
        service.tickCooldown(0.4);
        expect(service.roomTransitionCooldown).toBeCloseTo(0.6);
        service.tickCooldown(1);
        expect(service.roomTransitionCooldown).toBe(0);
    });
});
