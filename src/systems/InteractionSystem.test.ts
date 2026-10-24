import { describe, expect, it } from "vitest";
import { InteractionSystem } from "./InteractionSystem";
import { ClueSystem } from "./ClueSystem";
import { Player } from "../entities/Player";
import { Room } from "../world/Room";
import { TileMap } from "../world/TileMap";
import { TILE_SIZE } from "../world/constants";
import type { Interactable } from "../world/Interactable";
import { NPC } from "../entities/NPC";

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

describe("InteractionSystem NPC reach", () => {
    // NPC strolled off the tile grid (idle wander)
    function setup(): { interaction: InteractionSystem; room: Room; npc: NPC } {
        const interaction = new InteractionSystem(new ClueSystem());
        const room = new Room("hall", new TileMap(20, 20, new Array(400).fill(0)), [], []);
        const npc = new NPC("maid", 8.4 * TILE_SIZE, 8.6 * TILE_SIZE, "Maid", "staff", "maid");
        room.npcs.push(npc);
        return { interaction, room, npc };
    }

    /** Push the player toward the NPC until collision stops them, like walking into them. */
    function walkInto(player: Player, room: Room, dx: number, dy: number): void {
        for (let i = 0; i < 200; i++) {
            const nx = player.x + dx;
            const ny = player.y + dy;
            if (player.wouldCollideAt(nx, ny, room.map, room.npcs)) return;
            player.x = nx;
            player.y = ny;
        }
    }

    it("talks to an off-grid NPC from directly south", () => {
        const { interaction, room, npc } = setup();
        const player = new Player("player", npc.x, npc.y + 4 * TILE_SIZE);
        walkInto(player, room, 0, -1);
        player.facing = "up";
        expect(interaction.interact(player, room)?.speakerId).toBe("maid");
    });

    it("talks to an off-grid NPC from the side and from the north", () => {
        const { interaction, room, npc } = setup();
        const west = new Player("player", npc.x - 4 * TILE_SIZE, npc.y);
        walkInto(west, room, 1, 0);
        west.facing = "right";
        expect(interaction.interact(west, room)?.speakerId).toBe("maid");

        const north = new Player("player", npc.x, npc.y - 4 * TILE_SIZE);
        walkInto(north, room, 0, 1);
        north.facing = "down";
        expect(interaction.interact(north, room)?.speakerId).toBe("maid");
    });

    it("ignores an NPC the player is not facing or cannot reach", () => {
        const { interaction, room, npc } = setup();
        const player = new Player("player", npc.x, npc.y + 4 * TILE_SIZE);
        walkInto(player, room, 0, -1);
        player.facing = "down";
        expect(interaction.interact(player, room)).toBeNull();

        const far = new Player("player", npc.x, npc.y + 4 * TILE_SIZE);
        far.facing = "up";
        expect(interaction.interact(far, room)).toBeNull();
    });
});
