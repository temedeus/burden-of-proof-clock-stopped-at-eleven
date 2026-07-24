import { describe, expect, it } from "vitest";
import { applyStoryToRooms } from "./applyStoryToGame";
import { createRoomFromConfig } from "../world/Rooms";
import type { StoryCasePacket } from "@cse/content-schema";
import type { RoomConfig } from "@cse/content-schema";

const libraryConfig: RoomConfig = {
    id: "library",
    width: 10,
    height: 10,
    furniture: [{ furnitureId: "reading_table", x: 2, y: 2, anchor: "top-left" }],
    exits: []
};

function storyPacket(): StoryCasePacket {
    return {
        title: "Test",
        victim: { name: "Victim", roomId: "library", time: "eleven" },
        culpritNpcId: "cook",
        suspects: [],
        roomNarratives: [],
        generatedClues: [
            { id: "first", name: "First", description: "first" },
            {
                id: "second",
                name: "Second",
                description: "second",
                requiresClues: ["first"],
                blockedHint: "Not yet."
            }
        ],
        clueAssignments: [
            {
                clueId: "first",
                roomId: "library",
                furnitureId: "reading_table",
                furnitureIndex: 0,
                hint: "First hint."
            },
            {
                clueId: "second",
                roomId: "library",
                furnitureId: "reading_table",
                furnitureIndex: 0,
                hint: "Second hint."
            }
        ],
        npcDialogOverrides: []
    };
}

describe("applyStoryToRooms", () => {
    it("shows blocked hint until prerequisites are discovered", () => {
        const rooms = {
            library: createRoomFromConfig(libraryConfig)
        };
        const story = storyPacket();

        applyStoryToRooms(rooms, story, { hasClue: () => false });
        const table = rooms.library.interactables.find((obj) => obj.id === "reading_table");
        expect(table?.collectibleClues?.length).toBe(2);
        expect(table?.description).toBe("First hint.");

        applyStoryToRooms(rooms, story, { hasClue: (id) => id === "first" });
        expect(table?.description).toBe("Second hint.");

        applyStoryToRooms(rooms, story, {
            hasClue: (id) => id === "first" || id === "second"
        });
        expect(table?.description).toBe("Nothing of interest anymore.");
    });

    it("keeps furniture examine text instead of room narrative summaries", () => {
        const gardenConfig: RoomConfig = {
            id: "garden",
            width: 12,
            height: 12,
            furniture: [
                { furnitureId: "bush", x: 2, y: 2, anchor: "top-left" },
                { furnitureId: "pond", x: 5, y: 2, anchor: "top-left" }
            ],
            exits: []
        };
        const studyConfig: RoomConfig = {
            id: "study",
            width: 12,
            height: 12,
            furniture: [
                { furnitureId: "table", x: 4, y: 4, anchor: "top-left" },
                { furnitureId: "bookshelves", x: 1, y: 1, anchor: "top-left" }
            ],
            exits: []
        };
        const rooms = {
            garden: createRoomFromConfig(gardenConfig),
            study: createRoomFromConfig(studyConfig)
        };
        const story = storyPacket();
        story.roomNarratives = [
            { roomId: "garden", summary: "Rain has darkened the gravel paths." },
            { roomId: "study", summary: "The desk has been disturbed." }
        ];

        applyStoryToRooms(rooms, story, { hasClue: () => false });

        const bush = rooms.garden.interactables.find((obj) => obj.id === "bush");
        const pond = rooms.garden.interactables.find((obj) => obj.id === "pond");
        const table = rooms.study.interactables.find((obj) => obj.id === "table");
        const shelves = rooms.study.interactables.find((obj) => obj.id === "bookshelves");

        expect(bush?.description).toBe("Neatly trimmed hedges.");
        expect(pond?.description).toBe("Still water; best not to wade in.");
        expect(table?.description).not.toBe("The desk has been disturbed.");
        expect(shelves?.description).toBe("Rows of leather-bound volumes.");
        expect(table?.description).not.toBe(shelves?.description);
    });
});
