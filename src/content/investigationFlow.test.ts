import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { StoryCasePacket } from "@cse/content-schema";
import { hasAllPrerequisites, resolveClueRequirements } from "@cse/content-schema";
import { loadGameContent } from "./loadGameContent";
import { createRoomFromConfig } from "../world/Rooms";
import { applyStoryToRooms, getRequiredClueIds } from "./applyStoryToGame";
import { ClueSystem } from "../systems/ClueSystem";

const CLUE_CHAIN = [
    "examined_body",
    "examined_clock",
    "torn_appointment_note",
    "burned_ledger_page",
    "blackwoods_journal",
    "silver_key",
    "smuggling_documents",
    "bloody_apron",
    "cellar_evidence",
    "murder_weapon"
] as const;

function loadActiveStory(): StoryCasePacket {
    const path = resolve(process.cwd(), "src/data/story/generated/stories/active.json");
    return JSON.parse(readFileSync(path, "utf8")) as StoryCasePacket;
}

describe("active story investigation flow", () => {
    const story = loadActiveStory();
    const content = loadGameContent();

    it("defines the expected clue chain with valid dependencies", () => {
        const required = getRequiredClueIds(story);
        expect(required).toEqual([...CLUE_CHAIN]);

        for (let i = 0; i < CLUE_CHAIN.length; i++) {
            const clueId = CLUE_CHAIN[i];
            const clue = story.generatedClues.find((entry) => entry.id === clueId);
            expect(clue, clueId).toBeDefined();

            const assignment = story.clueAssignments.find((entry) => entry.clueId === clueId);
            expect(assignment, clueId).toBeDefined();

            const requires = resolveClueRequirements(clueId, story.generatedClues, assignment);
            const owned = new Set(CLUE_CHAIN.slice(0, i));
            expect(hasAllPrerequisites(requires, (id) => owned.has(id as (typeof CLUE_CHAIN)[number]))).toBe(
                true
            );
            if (requires.length > 0) {
                const before = new Set(CLUE_CHAIN.slice(0, i - 1));
                expect(
                    hasAllPrerequisites(requires, (id) => before.has(id as (typeof CLUE_CHAIN)[number]))
                ).toBe(false);
            }
        }
    });

    it("places every furniture clue on an existing interactable", () => {
        const rooms = Object.fromEntries(
            Object.entries(content.rooms).map(([id, config]) => [
                id,
                createRoomFromConfig(config, undefined, undefined, content.rooms)
            ])
        );

        applyStoryToRooms(rooms, story);

        for (const assignment of story.clueAssignments) {
            if (assignment.npcId) {
                const roomConfig = content.rooms[assignment.roomId];
                expect(roomConfig?.npcs?.some((n) => n.npcId === assignment.npcId)).toBe(true);
                continue;
            }

            const room = rooms[assignment.roomId];
            expect(room, assignment.roomId).toBeDefined();
            let count = 0;
            let found = false;
            for (const obj of room.interactables) {
                if (obj.id !== assignment.furnitureId) continue;
                if (count === (assignment.furnitureIndex ?? 0)) {
                    found = true;
                    const hasCollectible = obj.collectibleClues?.some(
                        (c) => c.clueId === assignment.clueId
                    );
                    const hasConfirmGrant = obj.confirmGrantsClueId === assignment.clueId;
                    expect(hasCollectible || hasConfirmGrant).toBe(true);
                    break;
                }
                count++;
            }
            expect(found, `${assignment.clueId} @ ${assignment.roomId}/${assignment.furnitureId}`).toBe(
                true
            );
        }
    });

    it("simulates collecting clues in order without prerequisite violations", () => {
        const clueSystem = new ClueSystem();
        const rooms = Object.fromEntries(
            Object.entries(content.rooms).map(([id, config]) => [
                id,
                createRoomFromConfig(config, undefined, undefined, content.rooms)
            ])
        );

        for (const clueId of CLUE_CHAIN) {
            const assignment = story.clueAssignments.find((entry) => entry.clueId === clueId);
            expect(clueSystem.canCollectClue(clueId, story.generatedClues, assignment)).toBe(true);
            clueSystem.addClue(clueId);
            applyStoryToRooms(rooms, story, { hasClue: (id) => clueSystem.hasClue(id) });
        }

        expect(clueSystem.getAllClues()).toEqual([...CLUE_CHAIN]);
        expect(getRequiredClueIds(story).every((id) => clueSystem.hasClue(id))).toBe(true);
    });

    it("blocks early clues until prerequisites are met", () => {
        const clueSystem = new ClueSystem();
        const assignment = story.clueAssignments.find((e) => e.clueId === "torn_appointment_note");
        expect(clueSystem.canCollectClue("torn_appointment_note", story.generatedClues, assignment)).toBe(
            false
        );
        clueSystem.addClue("examined_body");
        expect(clueSystem.canCollectClue("torn_appointment_note", story.generatedClues, assignment)).toBe(
            false
        );
        clueSystem.addClue("examined_clock");
        expect(clueSystem.canCollectClue("torn_appointment_note", story.generatedClues, assignment)).toBe(
            true
        );
    });
});
