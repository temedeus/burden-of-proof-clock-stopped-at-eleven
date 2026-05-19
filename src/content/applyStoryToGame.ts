import { STORY_CLUE_COUNT, type StoryCasePacket } from "@cse/content-schema";
import type { Room } from "../world/Room";
import type { Interactable } from "../world/Interactable";

function findFurnitureInteractable(
    room: Room,
    furnitureId: string,
    furnitureIndex: number
): Interactable | null {
    let count = 0;
    for (const obj of room.interactables) {
        if (obj.id !== furnitureId) continue;
        if (count === furnitureIndex) return obj;
        count++;
    }
    return null;
}

/** Attaches story clues to furniture and applies room narrative text to examine descriptions. */
export function applyStoryToRooms(rooms: Record<string, Room>, story: StoryCasePacket): void {
    for (const room of Object.values(rooms)) {
        for (const obj of room.interactables) {
            obj.clues = [];
        }
    }

    const narratives = new Map((story.roomNarratives ?? []).map((entry) => [entry.roomId, entry.summary]));

    for (const room of Object.values(rooms)) {
        const narrative = narratives.get(room.id);
        if (narrative) {
            for (const obj of room.interactables) {
                if (!obj.description?.includes(narrative)) {
                    obj.description = narrative;
                }
            }
        }
    }

    for (const assignment of story.clueAssignments ?? []) {
        const room = rooms[assignment.roomId];
        if (!room) continue;

        const target =
            assignment.furnitureId != null
                ? findFurnitureInteractable(room, assignment.furnitureId, assignment.furnitureIndex ?? 0)
                : room.interactables[0];

        if (!target) continue;

        target.clues = [assignment.clueId];
        if (assignment.hint) {
            target.description = assignment.hint;
        }
    }
}

export function getRequiredClueIds(story: StoryCasePacket | null): string[] {
    if (!story) return ["torn_page"];
    return (story.generatedClues ?? []).slice(0, STORY_CLUE_COUNT).map((clue) => clue.id);
}

export function getMurdererNpcId(story: StoryCasePacket | null): string {
    return story?.culpritNpcId ?? "cook";
}
