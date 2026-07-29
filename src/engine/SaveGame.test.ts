import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    SAVE_CONTENT_REVISION,
    SAVE_FORMAT_VERSION,
    SAVE_STORAGE_KEY,
    clearSave,
    hasSave,
    loadSave,
    parseSaveForTests,
    saveGame,
    validateSaveAgainstContent,
    type GameSaveV1
} from "./SaveGame";
import { loadGameContent } from "../content/loadGameContent";
import { resolveActiveStory } from "../content/loadStoryContent";

function installMemoryLocalStorage(): void {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
            store.set(key, value);
        },
        removeItem: (key: string) => {
            store.delete(key);
        },
        clear: () => store.clear()
    });
}

function makeValidSave(overrides: Partial<GameSaveV1> = {}): GameSaveV1 {
    const story = resolveActiveStory();
    const content = loadGameContent();
    const roomId = content.rooms.hall ? "hall" : Object.keys(content.rooms)[0];
    return {
        version: SAVE_FORMAT_VERSION,
        contentRevision: SAVE_CONTENT_REVISION,
        savedAt: 1,
        storyId: story?.id ?? "active",
        difficulty: "medium",
        playerSprite: "female_detective",
        roomId,
        player: { x: 64, y: 64, facing: "down" },
        discoveredClueIds: [],
        studySecretRevealed: false,
        cellarSecretRevealed: false,
        diningFireResolved: false,
        atticScareComplete: false,
        ledgerScareComplete: false,
        confrontationComplete: false,
        accusedMurderer: false,
        cookHiddenAfterDiningScare: false,
        brokenAtticWindowIds: [],
        ...overrides
    };
}

describe("SaveGame", () => {
    beforeEach(() => {
        installMemoryLocalStorage();
    });

    afterEach(() => {
        clearSave();
        vi.unstubAllGlobals();
    });

    it("round-trips a valid save through localStorage", () => {
        const save = makeValidSave({
            discoveredClueIds: ["torn_page"],
            studySecretRevealed: true
        });
        saveGame(save);
        expect(hasSave()).toBe(true);
        const loaded = loadSave();
        expect(loaded).not.toBeNull();
        expect(loaded?.discoveredClueIds).toEqual(["torn_page"]);
        expect(loaded?.studySecretRevealed).toBe(true);
        expect(loaded?.roomId).toBe(save.roomId);
    });

    it("rejects corrupt JSON", () => {
        localStorage.setItem(SAVE_STORAGE_KEY, "{not-json");
        expect(loadSave()).toBeNull();
        expect(hasSave()).toBe(false);
    });

    it("rejects wrong format version", () => {
        expect(parseSaveForTests({ ...makeValidSave(), version: 999 })).toBeNull();
    });

    it("rejects contentRevision mismatch", () => {
        expect(
            parseSaveForTests({ ...makeValidSave(), contentRevision: "ancient" })
        ).toBeNull();
    });

    it("rejects unknown room id against live content", () => {
        const save = makeValidSave({ roomId: "no_such_room" });
        expect(parseSaveForTests(save)).not.toBeNull();
        const content = loadGameContent();
        const validated = validateSaveAgainstContent(save, {
            roomIds: new Set(Object.keys(content.rooms)),
            storyIds: new Set(),
            clueIds: new Set()
        });
        expect(validated).toBeNull();
    });

    it("filters unknown clue ids but keeps the save", () => {
        const save = makeValidSave({
            discoveredClueIds: ["torn_page", "not_a_real_clue_xyz"]
        });
        const content = loadGameContent();
        const validated = validateSaveAgainstContent(save, {
            roomIds: new Set(Object.keys(content.rooms)),
            storyIds: new Set(),
            clueIds: new Set()
        });
        expect(validated).not.toBeNull();
        expect(validated?.discoveredClueIds).toEqual(["torn_page"]);
    });

    it("soft-fails when localStorage throws on write", () => {
        vi.stubGlobal("localStorage", {
            getItem: () => {
                throw new Error("blocked");
            },
            setItem: () => {
                throw new Error("blocked");
            },
            removeItem: () => {
                throw new Error("blocked");
            }
        });
        expect(() => saveGame(makeValidSave())).not.toThrow();
        expect(loadSave()).toBeNull();
        expect(() => clearSave()).not.toThrow();
    });
});
