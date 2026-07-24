import { describe, expect, it } from "vitest";
import { InteractionSystem } from "./InteractionSystem";
import { ClueSystem } from "./ClueSystem";
import { Player } from "../entities/Player";
import { Room } from "../world/Room";
import { TileMap } from "../world/TileMap";
import { TILE_SIZE } from "../world/constants";
import type { Interactable } from "../world/Interactable";

function roomWithTable(table: Interactable): Room {
    const map = new TileMap(8, 8);
    const room = new Room("library", map, [], [table]);
    return room;
}

describe("InteractionSystem clue gating", () => {
    it("returns blocked hint when prerequisites are missing", () => {
        const clueSystem = new ClueSystem();
        const interaction = new InteractionSystem(clueSystem);
        const table: Interactable = {
            id: "reading_table",
            name: "Table",
            description: "fallback",
            tiles: [{ x: 3, y: 3 }, { x: 4, y: 3 }],
            interactionTiles: [{ x: 3, y: 4 }, { x: 4, y: 4 }],
            collectibleClues: [
                {
                    clueId: "second",
                    requiresClues: ["first"],
                    blockedHint: "Too early.",
                    hint: "Found it."
                }
            ]
        };
        const room = roomWithTable(table);
        const player = new Player("player", 3 * TILE_SIZE, 4 * TILE_SIZE);
        player.facing = "up";

        const result = interaction.interact(player, room);
        expect(result?.description).toBe("Too early.");
        expect(result?.clues).toEqual([]);
        expect(clueSystem.hasClue("second")).toBe(false);
    });

    it("collects clue once prerequisites are satisfied", () => {
        const clueSystem = new ClueSystem();
        clueSystem.addClue("first");
        const interaction = new InteractionSystem(clueSystem);
        const table: Interactable = {
            id: "reading_table",
            name: "Table",
            description: "fallback",
            tiles: [{ x: 3, y: 3 }, { x: 4, y: 3 }],
            interactionTiles: [{ x: 3, y: 4 }, { x: 4, y: 4 }],
            collectibleClues: [
                {
                    clueId: "second",
                    requiresClues: ["first"],
                    blockedHint: "Too early.",
                    hint: "Found it."
                }
            ]
        };
        const room = roomWithTable(table);
        const player = new Player("player", 3 * TILE_SIZE, 4 * TILE_SIZE);
        player.facing = "up";

        const result = interaction.interact(player, room);
        expect(result?.description).toBe("Found it.");
        expect(result?.clues).toEqual(["second"]);
        expect(clueSystem.hasClue("second")).toBe(true);
    });

    it("collects every eligible clue on the same object in one interaction", () => {
        const clueSystem = new ClueSystem();
        clueSystem.addClue("gate");
        const interaction = new InteractionSystem(clueSystem);
        const table: Interactable = {
            id: "bedside_table",
            name: "Table",
            description: "fallback",
            tiles: [{ x: 3, y: 3 }, { x: 4, y: 3 }],
            interactionTiles: [{ x: 3, y: 4 }, { x: 4, y: 4 }],
            collectibleClues: [
                {
                    clueId: "key",
                    requiresClues: ["gate"],
                    blockedHint: "Too early.",
                    hint: "Found a key."
                },
                {
                    clueId: "diary",
                    requiresClues: ["gate"],
                    blockedHint: "Too early.",
                    hint: "Found a diary."
                }
            ]
        };
        const room = roomWithTable(table);
        const player = new Player("player", 3 * TILE_SIZE, 4 * TILE_SIZE);
        player.facing = "up";

        const result = interaction.interact(player, room);
        expect(result?.description).toBe("Found a key.\n\nFound a diary.");
        expect(result?.clues).toEqual(["key", "diary"]);
        expect(clueSystem.hasClue("key")).toBe(true);
        expect(clueSystem.hasClue("diary")).toBe(true);
    });

    it("shows exhausted hint after all clues on the object are collected", () => {
        const clueSystem = new ClueSystem();
        clueSystem.addClue("first");
        const interaction = new InteractionSystem(clueSystem);
        const table: Interactable = {
            id: "reading_table",
            name: "Table",
            description: "Found it.",
            tiles: [{ x: 3, y: 3 }, { x: 4, y: 3 }],
            interactionTiles: [{ x: 3, y: 4 }, { x: 4, y: 4 }],
            collectibleClues: [
                {
                    clueId: "second",
                    requiresClues: ["first"],
                    blockedHint: "Too early.",
                    hint: "Found it."
                }
            ]
        };
        const room = roomWithTable(table);
        const player = new Player("player", 3 * TILE_SIZE, 4 * TILE_SIZE);
        player.facing = "up";

        expect(interaction.interact(player, room)?.description).toBe("Found it.");
        expect(interaction.interact(player, room)?.description).toBe("Nothing of interest anymore.");
    });
});
