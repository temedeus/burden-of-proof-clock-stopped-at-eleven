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
});
