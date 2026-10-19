import { describe, expect, it } from "vitest";
import { Game } from "./Game";
import { Input } from "./Input";
import {
    SAVE_CONTENT_REVISION,
    SAVE_FORMAT_VERSION,
    type GameSaveV1
} from "./SaveGame";
import { resolveActiveStory } from "../content/loadStoryContent";
import { TILE_SIZE } from "../world/constants";

function mockCtx(): CanvasRenderingContext2D {
    return {
        canvas: { width: 800, height: 600 },
        font: "",
        fillStyle: "",
        strokeStyle: "",
        textAlign: "left",
        textBaseline: "alphabetic",
        globalAlpha: 1,
        lineWidth: 1,
        imageSmoothingEnabled: false,
        measureText: (text: string) => ({ width: text.length * 8 }) as TextMetrics,
        fillRect: () => {},
        strokeRect: () => {},
        clearRect: () => {},
        fillText: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        save: () => {},
        restore: () => {},
        translate: () => {},
        scale: () => {},
        drawImage: () => {}
    } as unknown as CanvasRenderingContext2D;
}

function mockInput(): Input {
    return {
        wasPressed: () => false,
        isDown: () => false,
        tapVirtual: () => {},
        setVirtualDown: () => {}
    } as unknown as Input;
}

describe("Game.applySave", () => {
    it("restores clues, room, and puzzle unlocks from a save", () => {
        const story = resolveActiveStory();
        expect(story).not.toBeNull();

        const game = new Game(mockCtx(), {
            playerSprite: "male_detective",
            storyId: story!.id,
            difficulty: "medium",
            input: mockInput()
        });

        const save: GameSaveV1 = {
            version: SAVE_FORMAT_VERSION,
            contentRevision: SAVE_CONTENT_REVISION,
            savedAt: Date.now(),
            storyId: story!.id,
            difficulty: "medium",
            playerSprite: "male_detective",
            roomId: "library",
            player: { x: 5 * TILE_SIZE, y: 5 * TILE_SIZE, facing: "up" },
            discoveredClueIds: ["torn_page", "cellar_evidence"],
            studySecretRevealed: true,
            cellarSecretRevealed: false,
            diningFireResolved: false,
            completedScenes: [],
            accusedMurderer: false,
            cookHiddenAfterDiningScare: false,
            brokenAtticWindowIds: []
        };

        game.applySave(save);

        const snap = game.snapshotSave();
        expect(snap).not.toBeNull();
        expect(snap!.roomId).toBe("library");
        expect(snap!.discoveredClueIds.sort()).toEqual(["cellar_evidence", "torn_page"]);
        expect(snap!.studySecretRevealed).toBe(true);
        expect(snap!.player.facing).toBe("up");
        expect(snap!.playerSprite).toBe("male_detective");
    });

    it("drops a scare's trigger clue when the scare never finished, so it can replay", () => {
        const story = resolveActiveStory();
        expect(story).not.toBeNull();

        const game = new Game(mockCtx(), {
            playerSprite: "male_detective",
            storyId: story!.id,
            input: mockInput()
        });

        const base: GameSaveV1 = {
            version: SAVE_FORMAT_VERSION,
            contentRevision: SAVE_CONTENT_REVISION,
            savedAt: Date.now(),
            storyId: story!.id,
            difficulty: "medium",
            playerSprite: "male_detective",
            roomId: "library",
            player: { x: 5 * TILE_SIZE, y: 5 * TILE_SIZE, facing: "up" },
            discoveredClueIds: ["examined_body", "burned_ledger_page", "manor_floor_plans"],
            studySecretRevealed: false,
            cellarSecretRevealed: false,
            diningFireResolved: false,
            completedScenes: [],
            accusedMurderer: false,
            cookHiddenAfterDiningScare: false,
            brokenAtticWindowIds: []
        };

        game.applySave(base);
        expect(game.snapshotSave()!.discoveredClueIds).toEqual(["examined_body"]);

        game.applySave({ ...base, diningFireResolved: true, completedScenes: ["ledger_scare"] });
        expect(game.snapshotSave()!.discoveredClueIds.sort()).toEqual(["burned_ledger_page", "examined_body"]);

        game.applySave({ ...base, diningFireResolved: true, completedScenes: ["ledger_scare", "attic_scare"] });
        expect(game.snapshotSave()!.discoveredClueIds.sort()).toEqual([
            "burned_ledger_page",
            "examined_body",
            "manor_floor_plans"
        ]);
    });

    it("moves player to a walkable spot when saved pose is unwalkable", () => {
        const story = resolveActiveStory();
        expect(story).not.toBeNull();

        const game = new Game(mockCtx(), {
            playerSprite: "female_detective",
            storyId: story!.id,
            input: mockInput()
        });

        const save: GameSaveV1 = {
            version: SAVE_FORMAT_VERSION,
            contentRevision: SAVE_CONTENT_REVISION,
            savedAt: Date.now(),
            storyId: story!.id,
            difficulty: "medium",
            playerSprite: "female_detective",
            roomId: "hall",
            player: { x: -1000, y: -1000, facing: "down" },
            discoveredClueIds: [],
            studySecretRevealed: false,
            cellarSecretRevealed: false,
            diningFireResolved: false,
            completedScenes: [],
            accusedMurderer: false,
            cookHiddenAfterDiningScare: false,
            brokenAtticWindowIds: []
        };

        game.applySave(save);
        const snap = game.snapshotSave();
        expect(snap).not.toBeNull();
        expect(snap!.player.x).toBeGreaterThanOrEqual(0);
        expect(snap!.player.y).toBeGreaterThanOrEqual(0);
        expect(snap!.player.x).not.toBe(-1000);
        expect(snap!.player.y).not.toBe(-1000);
    });
    it("never leaves the player inside a wall when restoring", () => {
        const story = resolveActiveStory();
        const game = new Game(mockCtx(), {
            playerSprite: "female_detective",
            storyId: story!.id,
            input: mockInput()
        });
        const internals = game as unknown as {
            player: { x: number; y: number; wouldCollideAt(x: number, y: number, map: unknown, npcs: unknown): boolean };
            currentRoom: { map: unknown; npcs: unknown };
        };
        // Top-left corner tile is a wall in every room
        game.applySave(baseSave(story!.id, { player: { x: 0, y: 0, facing: "down" } }));
        const { player, currentRoom } = internals;
        expect(player.wouldCollideAt(player.x, player.y, currentRoom.map, currentRoom.npcs)).toBe(false);
        // Stays close to where the save put them
        expect(Math.hypot(player.x, player.y)).toBeLessThan(TILE_SIZE * 6);
    });

    it("rolls a mid-chase save back to just before the murder weapon pickup", () => {
        const story = resolveActiveStory();
        const game = new Game(mockCtx(), {
            playerSprite: "female_detective",
            storyId: story!.id,
            input: mockInput()
        });
        game.applySave(
            baseSave(story!.id, {
                roomId: "hall",
                discoveredClueIds: ["examined_body", "murder_weapon"],
                completedScenes: ["ledger_scare", "attic_scare", "confrontation"],
                diningFireResolved: true,
                accusedMurderer: true
            })
        );
        const snap = game.snapshotSave()!;
        expect(snap.accusedMurderer).toBe(false);
        expect(snap.completedScenes).not.toContain("confrontation");
        expect(snap.discoveredClueIds).not.toContain("murder_weapon");
        expect(snap.roomId).not.toBe("hall");
        expect(game.canAutosave()).toBe(true);
    });
});

function baseSave(storyId: string, overrides: Partial<GameSaveV1>): GameSaveV1 {
    return {
        version: SAVE_FORMAT_VERSION,
        contentRevision: SAVE_CONTENT_REVISION,
        savedAt: Date.now(),
        storyId,
        difficulty: "medium",
        playerSprite: "female_detective",
        roomId: "hall",
        player: { x: 0, y: 0, facing: "down" },
        discoveredClueIds: [],
        studySecretRevealed: false,
        cellarSecretRevealed: false,
        diningFireResolved: false,
        completedScenes: [],
        accusedMurderer: false,
        cookHiddenAfterDiningScare: false,
        brokenAtticWindowIds: [],
        ...overrides
    };
}
