import type { ClueAssignment, GeneratedClue, StoryCasePacket } from "@cse/content-schema";
import {
    DEFAULT_EXHAUSTED_CLUE_HINT,
    hasAllPrerequisites,
    resolveBlockedHint,
    resolveClueRequirements
} from "@cse/content-schema";
import type { Room } from "../world/Room";
import type { CollectibleClue, Interactable } from "../world/Interactable";

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

function buildCollectibleClue(
    assignment: ClueAssignment,
    generatedClues: GeneratedClue[]
): CollectibleClue {
    return {
        clueId: assignment.clueId,
        requiresClues: resolveClueRequirements(assignment.clueId, generatedClues, assignment),
        blockedHint: resolveBlockedHint(assignment.clueId, generatedClues, assignment),
        hint: assignment.hint
    };
}

/** Attaches story clues to furniture. Room narratives are story metadata only — they must not
 *  overwrite per-furniture examine descriptions. */
export function applyStoryToRooms(
    rooms: Record<string, Room>,
    story: StoryCasePacket,
    options?: { hasClue?: (id: string) => boolean }
): void {
    const hasClue = options?.hasClue ?? (() => false);
    const generatedClues = story.generatedClues ?? [];

    for (const room of Object.values(rooms)) {
        for (const obj of room.interactables) {
            obj.clues = [];
            obj.collectibleClues = [];
        }
    }

    for (const assignment of story.clueAssignments ?? []) {
        if (assignment.npcId) continue;
        const room = rooms[assignment.roomId];
        if (!room) continue;

        const target =
            assignment.furnitureId != null
                ? findFurnitureInteractable(room, assignment.furnitureId, assignment.furnitureIndex ?? 0)
                : room.interactables[0];

        if (!target) continue;

        if (target.interactionType === "confirm") {
            if (target.confirmGrantsClueId == null) {
                target.confirmGrantsClueId = assignment.clueId;
                target.description = assignment.hint;
            } else {
                const collectible = buildCollectibleClue(assignment, generatedClues);
                target.collectibleClues = [...(target.collectibleClues ?? []), collectible];
                target.clues = [...(target.clues ?? []), assignment.clueId];
            }
            continue;
        }

        const collectible = buildCollectibleClue(assignment, generatedClues);
        target.collectibleClues = [...(target.collectibleClues ?? []), collectible];
        target.clues = [...(target.clues ?? []), assignment.clueId];
    }

    for (const room of Object.values(rooms)) {
        for (const target of room.interactables) {
            const collectibles = target.collectibleClues ?? [];
            const pending = collectibles.filter((entry) => !hasClue(entry.clueId));
            const confirmGranted =
                target.confirmGrantsClueId != null && hasClue(target.confirmGrantsClueId);

            if (collectibles.length > 0) {
                if (pending.length === 0) {
                    target.description = DEFAULT_EXHAUSTED_CLUE_HINT;
                    continue;
                }
                const eligible = pending.filter((entry) =>
                    hasAllPrerequisites(entry.requiresClues, hasClue)
                );
                if (eligible.length > 0) {
                    target.description = eligible.map((entry) => entry.hint).join("\n\n");
                } else {
                    target.description = pending[0].blockedHint;
                }
                continue;
            }

            if (confirmGranted) {
                target.description = DEFAULT_EXHAUSTED_CLUE_HINT;
            }
        }
    }
}

export function getRequiredClueIds(story: StoryCasePacket | null): string[] {
    if (!story) return ["torn_page"];
    return (story.generatedClues ?? []).map((clue) => clue.id);
}

export function getMurdererNpcId(story: StoryCasePacket | null): string {
    return story?.culpritNpcId ?? "cook";
}

export { buildCollectibleClue };
