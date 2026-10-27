import {
    hasAllPrerequisites,
    resolveClueRequirements,
    type NPCConfig,
    type StoryCasePacket
} from "@cse/content-schema";

/** A clue the detective can pick up right now, and where. */
export interface InvestigationLead {
    clueId: string;
    roomId: string;
    /** "ask" when a living NPC gives the clue in conversation; "search" otherwise. */
    kind: "search" | "ask";
}

export interface LeadRoom {
    exits: readonly { targetRoom: string; requiresUnlock?: string }[];
}

/** Rooms the detective can walk to from `startRoomId` through exits that are open. */
export function reachableRoomIds(
    rooms: Readonly<Record<string, LeadRoom>>,
    startRoomId: string,
    isUnlocked: (requiresUnlock: string | undefined) => boolean
): Set<string> {
    const seen = new Set<string>([startRoomId]);
    const queue = [startRoomId];
    while (queue.length > 0) {
        const room = rooms[queue.shift()!];
        for (const exit of room?.exits ?? []) {
            if (seen.has(exit.targetRoom) || !isUnlocked(exit.requiresUnlock)) continue;
            seen.add(exit.targetRoom);
            queue.push(exit.targetRoom);
        }
    }
    return seen;
}

/** For each room, the reachable room nearest to it when walking through locked doors too. */
function nearestReachableRoom(
    rooms: Readonly<Record<string, LeadRoom>>,
    reachable: ReadonlySet<string>
): Map<string, string> {
    const origin = new Map<string, string>();
    const queue: string[] = [];
    for (const id of reachable) {
        origin.set(id, id);
        queue.push(id);
    }
    while (queue.length > 0) {
        const id = queue.shift()!;
        for (const exit of rooms[id]?.exits ?? []) {
            if (origin.has(exit.targetRoom)) continue;
            origin.set(exit.targetRoom, origin.get(id)!);
            queue.push(exit.targetRoom);
        }
    }
    return origin;
}

export interface LeadMap {
    rooms: Readonly<Record<string, LeadRoom>>;
    /** Room the detective is standing in. */
    startRoomId: string;
    isUnlocked: (requiresUnlock: string | undefined) => boolean;
}

/**
 * Uncollected clues whose prerequisites are met, in story order.
 * A lead never names a room behind a locked passage: when every open clue lies
 * past one (e.g. the hidden room before the bookshelf is pulled), the lead points
 * at the reachable room where that passage starts instead.
 */
export function getInvestigationLeads(
    packet: Pick<StoryCasePacket, "clueAssignments" | "generatedClues">,
    hasClue: (id: string) => boolean,
    map: LeadMap,
    npcs: Readonly<Record<string, Pick<NPCConfig, "interactionMode">>>
): InvestigationLead[] {
    const reachable = reachableRoomIds(map.rooms, map.startRoomId, map.isUnlocked);
    const leads: InvestigationLead[] = [];
    const blocked: InvestigationLead[] = [];
    for (const assignment of packet.clueAssignments) {
        if (hasClue(assignment.clueId)) continue;
        const requires = resolveClueRequirements(assignment.clueId, packet.generatedClues, assignment);
        if (!hasAllPrerequisites(requires, hasClue)) continue;
        if (!reachable.has(assignment.roomId)) {
            blocked.push({ clueId: assignment.clueId, roomId: assignment.roomId, kind: "search" });
            continue;
        }
        const talks = assignment.npcId != null && npcs[assignment.npcId]?.interactionMode !== "examine";
        leads.push({ clueId: assignment.clueId, roomId: assignment.roomId, kind: talks ? "ask" : "search" });
    }
    if (leads.length > 0 || blocked.length === 0) return leads;

    const nearest = nearestReachableRoom(map.rooms, reachable);
    return blocked.flatMap((lead) => {
        const roomId = nearest.get(lead.roomId);
        return roomId ? [{ ...lead, roomId }] : [];
    });
}

/** Notebook lines for the inventory, one per room, at most `max`. */
export function formatInvestigationLeads(
    leads: readonly InvestigationLead[],
    roomTitle: (roomId: string) => string,
    max = 2
): string[] {
    const lines: string[] = [];
    for (const lead of leads) {
        const title = roomTitle(lead.roomId);
        const line = lead.kind === "ask" ? `Ask around in the ${title}` : `Search the ${title}`;
        if (!lines.includes(line)) lines.push(line);
        if (lines.length >= max) break;
    }
    return lines;
}
