import type { RoomConfig } from "./rooms";
import { STORY_CLUE_COUNT, type ClueAssignment, type GeneratedClue, type StoryCasePacket } from "./story";

export interface FurnitureSlot {
    roomId: string;
    furnitureId: string;
    furnitureIndex: number;
}

export function listFurnitureSlots(rooms: Record<string, RoomConfig>): FurnitureSlot[] {
    const slots: FurnitureSlot[] = [];
    for (const [roomId, room] of Object.entries(rooms)) {
        const counts = new Map<string, number>();
        for (const placement of room.furniture ?? []) {
            const furnitureIndex = counts.get(placement.furnitureId) ?? 0;
            slots.push({ roomId, furnitureId: placement.furnitureId, furnitureIndex });
            counts.set(placement.furnitureId, furnitureIndex + 1);
        }
    }
    return slots;
}

function seededShuffle<T>(items: T[], seed: number): T[] {
    const out = [...items];
    let state = Math.abs(Math.floor(seed)) || 1;
    for (let i = out.length - 1; i > 0; i--) {
        state = (state * 1103515245 + 12345) & 0x7fffffff;
        const j = state % (i + 1);
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

function uniqueClueId(base: string, used: Set<string>): string {
    let id = base.replace(/[^a-z0-9_]/gi, "_").toLowerCase();
    if (!id) id = "clue";
    let candidate = id;
    let n = 2;
    while (used.has(candidate)) {
        candidate = `${id}_${n}`;
        n++;
    }
    used.add(candidate);
    return candidate;
}

function defaultGeneratedClues(seed: number): GeneratedClue[] {
    const templates = [
        { name: "Torn Note", description: "A scrap of paper with hurried handwriting." },
        { name: "Stained Glove", description: "A glove with a dark stain on the cuff." },
        { name: "Broken Watch", description: "A pocket watch stopped at eleven." },
        { name: "Smudged Letter", description: "Wax seal broken; the ink is still fresh." },
        { name: "Missing Key", description: "A brass key that does not match any door you have seen." }
    ];
    const used = new Set<string>();
    return templates.map((template, index) => ({
        id: uniqueClueId(`clue_${seed}_${index + 1}`, used),
        name: template.name,
        description: template.description
    }));
}

function pickCulprit(packet: StoryCasePacket, npcIds: string[], seed: number): string {
    const nonPolice = npcIds.filter((id) => !id.startsWith("police"));
    const pool = nonPolice.length > 0 ? nonPolice : npcIds;

    if (packet.culpritNpcId && pool.includes(packet.culpritNpcId)) {
        return packet.culpritNpcId;
    }
    const fromSuspects = (packet.suspects ?? [])
        .map((s) => s.npcId)
        .filter((id) => pool.includes(id));
    if (fromSuspects.length > 0) {
        return fromSuspects[seed % fromSuspects.length];
    }
    if (pool.includes("cook")) return "cook";
    return pool[seed % pool.length] ?? pool[0];
}

/**
 * Ensures a story packet has 5 generated clues, assignments on real furniture slots,
 * and a valid culprit. Call after AI output and before validation.
 */
export function normalizeStoryPacket(
    packet: StoryCasePacket,
    rooms: Record<string, RoomConfig>,
    npcIds: string[],
    seed: number
): StoryCasePacket {
    const slots = listFurnitureSlots(rooms);
    const fallbackRoomId = Object.keys(rooms)[0] ?? "hall";
    const pool =
        slots.length > 0
            ? slots
            : [{ roomId: fallbackRoomId, furnitureId: "table", furnitureIndex: 0 }];
    const shuffledSlots = seededShuffle(pool, seed);

    const usedClueIds = new Set<string>();
    let generatedClues: GeneratedClue[] = (packet.generatedClues ?? []).map((clue) => {
        const id = uniqueClueId(clue.id || `clue_${seed}`, usedClueIds);
        return {
            id,
            name: clue.name?.trim() || "Unknown clue",
            description: clue.description?.trim() || "Something seems out of place."
        };
    });
    while (generatedClues.length < STORY_CLUE_COUNT) {
        const defaults = defaultGeneratedClues(seed + generatedClues.length);
        for (const clue of defaults) {
            if (generatedClues.length >= STORY_CLUE_COUNT) break;
            if (!usedClueIds.has(clue.id)) {
                usedClueIds.add(clue.id);
                generatedClues.push(clue);
            }
        }
        if (generatedClues.length < STORY_CLUE_COUNT) {
            generatedClues.push({
                id: uniqueClueId(`clue_extra_${generatedClues.length}`, usedClueIds),
                name: `Clue ${generatedClues.length + 1}`,
                description: "A puzzling piece of evidence."
            });
        }
    }
    generatedClues = generatedClues.slice(0, STORY_CLUE_COUNT);

    const assignmentsByClueId = new Map<string, ClueAssignment>();
    for (const assignment of packet.clueAssignments ?? []) {
        if (assignment?.clueId) assignmentsByClueId.set(assignment.clueId, assignment);
    }

    const clueAssignments: ClueAssignment[] = generatedClues.map((clue, index) => {
        const existing = assignmentsByClueId.get(clue.id);
        const slot = shuffledSlots[index % shuffledSlots.length];
        const roomId =
            existing?.roomId && rooms[existing.roomId] ? existing.roomId : slot.roomId;
        const furnitureId = existing?.furnitureId ?? slot.furnitureId;
        const furnitureIndex = existing?.furnitureIndex ?? slot.furnitureIndex;
        return {
            clueId: clue.id,
            roomId,
            furnitureId,
            furnitureIndex,
            hint: existing?.hint?.trim() || `Something here relates to the case…`
        };
    });

    const culpritNpcId = pickCulprit(packet, npcIds, seed);

    return {
        ...packet,
        culpritNpcId,
        generatedClues,
        clueAssignments
    };
}
