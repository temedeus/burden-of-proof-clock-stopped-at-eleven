import { describe, expect, it } from "vitest";
import { NPC } from "../entities/NPC";
import { Player } from "../entities/Player";
import { TILE_SIZE } from "../world/constants";
import { Room } from "../world/Room";
import { TileMap } from "../world/TileMap";
import { DIFFICULTY_CONFIG, MurdererChaseController } from "./MurdererChaseController";

describe("MurdererChaseController", () => {
    it("starts accusation timers from difficulty config", () => {
        const controller = new MurdererChaseController("hard");
        controller.triggerAccusation();

        expect(controller.accusedMurderer).toBe(true);
        expect(controller.redBlinkRemaining).toBe(3);
        expect(controller.chaseStartsIn).toBe(DIFFICULTY_CONFIG.hard.chaseHeadStart);
    });

    it("signals chase start after the head-start elapses", () => {
        const controller = new MurdererChaseController("hard");
        controller.triggerAccusation();

        let result = controller.tick(0.2);
        expect(result.startChase).toBe(false);

        result = controller.tick(0.4);
        expect(result.startChase).toBe(true);
        expect(controller.chaseStartsIn).toBe(0);
    });

    it("does not signal chase start when not accused", () => {
        const controller = new MurdererChaseController("medium");
        controller.chaseStartsIn = 0.5;

        const result = controller.tick(1);
        expect(result.startChase).toBe(false);
    });

    it("schedules and completes murderer spawn after room change", () => {
        const controller = new MurdererChaseController("medium");
        const player = new Player("player", 6 * TILE_SIZE, 4 * TILE_SIZE);
        controller.scheduleSpawnAfterRoomChange(player);

        expect(controller.murdererSpawnsIn).toBe(DIFFICULTY_CONFIG.medium.murdererSpawnsIn);

        let result = controller.tick(0.5);
        expect(result.spawnInRoom).toBe(false);

        result = controller.tick(1.5);
        expect(result.spawnInRoom).toBe(true);
    });

    it("moves murderer into the current room at the scheduled position", () => {
        const controller = new MurdererChaseController("medium");
        const player = new Player("player", 6 * TILE_SIZE, 4 * TILE_SIZE);
        controller.scheduleSpawnAfterRoomChange(player);
        controller.tick(DIFFICULTY_CONFIG.medium.murdererSpawnsIn);

        const hall = new Room("hall", new TileMap(10, 10, new Array(100).fill(0)), [], [], []);
        const library = new Room("library", new TileMap(10, 10, new Array(100).fill(0)), [], [], []);
        const murderer = new NPC("cook", 0, 0, "Cook", "staff", "cook");
        hall.npcs.push(murderer);

        controller.spawnMurdererInRoom(murderer, library, { hall, library });

        expect(hall.npcs).not.toContain(murderer);
        expect(library.npcs).toContain(murderer);
        expect(murderer.x).toBe(6 * TILE_SIZE);
        expect(murderer.y).toBe(4 * TILE_SIZE);
    });

    it("detects overlap between NPC and player hitboxes", () => {
        const controller = new MurdererChaseController("easy");
        const player = new Player("player", 64, 64);
        const npc = new NPC("cook", 80, 80, "Cook", "staff", "cook");

        expect(controller.npcOverlapsPlayer(player, npc)).toBe(true);

        npc.x = 200;
        expect(controller.npcOverlapsPlayer(player, npc)).toBe(false);
    });

    it("starts murderer chase when accused", () => {
        const controller = new MurdererChaseController("easy");
        const murderer = new NPC("cook", 0, 0, "Cook", "staff", "cook");

        controller.startMurdererChase(murderer);

        expect(murderer.isChasing()).toBe(true);
    });
});
