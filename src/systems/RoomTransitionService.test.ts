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

    it("places the player beside a top-wall entry door", () => {
        const service = new RoomTransitionService();
        const hall = makeRoom("hall", 10, 10, [
            { x: 5, y: 9, targetRoom: "library", spawnX: 5, spawnY: 0 }
        ]);
        const library = makeRoom("library", 10, 10, [
            { x: 5, y: 0, targetRoom: "hall", spawnX: 5, spawnY: 7 }
        ]);
        const player = new Player("player", 0, 0);

        service.placePlayerAfterRoomTransition(player, "hall", library, 5, 0);

        expect(player.y).toBe(TILE_SIZE);
        expect(player.x).toBe(4 * TILE_SIZE);
    });

    it("places the player beside a bottom-wall entry door", () => {
        const service = new RoomTransitionService();
        const garden = makeRoom("garden", 18, 18, [
            { x: 12, y: 0, targetRoom: "hall", spawnX: 12, spawnY: 15 }
        ]);
        const hall = makeRoom("hall", 18, 18, [
            { x: 12, y: 17, targetRoom: "garden", spawnX: 12, spawnY: 1 }
        ]);
        const player = new Player("player", 0, 0);

        service.placePlayerAfterRoomTransition(player, "garden", hall, 12, 1);

        expect(player.y).toBe(15 * TILE_SIZE);
        expect(player.x).toBe(11 * TILE_SIZE);
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
