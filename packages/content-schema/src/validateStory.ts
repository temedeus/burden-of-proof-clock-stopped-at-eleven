import type { StoryCasePacket } from "./story";
import type { ValidationIssue } from "./validate";

export interface StoryValidationContext {
    roomIds: Iterable<string>;
    npcIds: Iterable<string>;
    clueIds: Iterable<string>;
}

function toIdSet(ids: Iterable<string>): Set<string> {
    return ids instanceof Set ? ids : new Set(ids);
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

function validateStoryShape(packet: Record<string, unknown>, storyId: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const scope = storyId;

    if (!isNonEmptyString(packet.title)) {
        issues.push({ roomId: scope, message: "Missing or invalid title." });
    }

    const victim = packet.victim;
    if (!victim || typeof victim !== "object") {
        issues.push({ roomId: scope, message: "Missing victim object." });
    } else {
        const v = victim as Record<string, unknown>;
        if (!isNonEmptyString(v.name)) issues.push({ roomId: scope, message: "Victim name is missing or invalid." });
        if (!isNonEmptyString(v.roomId)) issues.push({ roomId: scope, message: "Victim roomId is missing or invalid." });
        if (!isNonEmptyString(v.time)) issues.push({ roomId: scope, message: "Victim time is missing or invalid." });
    }

    if (!Array.isArray(packet.suspects)) {
        issues.push({ roomId: scope, message: "suspects must be an array." });
    }
    if (!Array.isArray(packet.roomNarratives)) {
        issues.push({ roomId: scope, message: "roomNarratives must be an array." });
    }
    if (!Array.isArray(packet.clueAssignments)) {
        issues.push({ roomId: scope, message: "clueAssignments must be an array." });
    }
    if (!Array.isArray(packet.npcDialogOverrides)) {
        issues.push({ roomId: scope, message: "npcDialogOverrides must be an array." });
    }

    return issues;
}

/**
 * Validates a generated story packet against the current game world (rooms, NPCs, clues).
 * Returns an empty array when the packet is valid.
 */
export function validateStoryCasePacket(
    storyId: string,
    packet: unknown,
    context: StoryValidationContext
): ValidationIssue[] {
    if (!packet || typeof packet !== "object") {
        return [{ roomId: storyId, message: "Story packet is not an object." }];
    }

    const record = packet as Record<string, unknown>;
    const issues = validateStoryShape(record, storyId);
    if (issues.length > 0) {
        return issues;
    }

    const roomIds = toIdSet(context.roomIds);
    const npcIds = toIdSet(context.npcIds);
    const clueIds = toIdSet(context.clueIds);
    const p = packet as StoryCasePacket;

    if (!roomIds.has(p.victim.roomId)) {
        issues.push({ roomId: storyId, message: `Invalid victim roomId '${p.victim.roomId}'.` });
    }

    const suspectNpcIds = new Set<string>();
    for (const suspect of p.suspects ?? []) {
        if (!npcIds.has(suspect.npcId)) {
            issues.push({ roomId: storyId, message: `Invalid suspect npcId '${suspect.npcId}'.` });
        }
        if (suspectNpcIds.has(suspect.npcId)) {
            issues.push({ roomId: storyId, message: `Duplicate suspect npcId '${suspect.npcId}'.` });
        }
        suspectNpcIds.add(suspect.npcId);
        if (!isNonEmptyString(suspect.motive)) {
            issues.push({ roomId: storyId, message: `Suspect '${suspect.npcId}' missing motive.` });
        }
    }

    for (const entry of p.roomNarratives ?? []) {
        if (!roomIds.has(entry.roomId)) {
            issues.push({ roomId: storyId, message: `Invalid roomNarratives roomId '${entry.roomId}'.` });
        }
        if (!isNonEmptyString(entry.summary)) {
            issues.push({ roomId: storyId, message: `roomNarratives entry for '${entry.roomId}' missing summary.` });
        }
    }

    for (const assignment of p.clueAssignments ?? []) {
        if (!clueIds.has(assignment.clueId)) {
            issues.push({ roomId: storyId, message: `Invalid clueAssignments clueId '${assignment.clueId}'.` });
        }
        if (!roomIds.has(assignment.roomId)) {
            issues.push({ roomId: storyId, message: `Invalid clueAssignments roomId '${assignment.roomId}'.` });
        }
    }

    const seenDialogNpcs = new Set<string>();
    for (const dialog of p.npcDialogOverrides ?? []) {
        if (!npcIds.has(dialog.npcId)) {
            issues.push({ roomId: storyId, message: `Invalid npcDialogOverrides npcId '${dialog.npcId}'.` });
        }
        if (seenDialogNpcs.has(dialog.npcId)) {
            issues.push({ roomId: storyId, message: `Duplicate npcDialogOverrides npcId '${dialog.npcId}'.` });
        }
        seenDialogNpcs.add(dialog.npcId);
        if (!isNonEmptyString(dialog.default)) {
            issues.push({ roomId: storyId, message: `NPC '${dialog.npcId}' override missing default dialog.` });
        }
        for (const condition of dialog.conditions ?? []) {
            if (condition.requiresClue && !clueIds.has(condition.requiresClue)) {
                issues.push({
                    roomId: storyId,
                    message: `Invalid requiresClue '${condition.requiresClue}' for npc '${dialog.npcId}'.`
                });
            }
            if (!isNonEmptyString(condition.dialog)) {
                issues.push({ roomId: storyId, message: `Conditional dialog for npc '${dialog.npcId}' is empty.` });
            }
        }
    }

    return issues;
}

export function isStoryCasePacketValid(
    storyId: string,
    packet: unknown,
    context: StoryValidationContext
): boolean {
    return validateStoryCasePacket(storyId, packet, context).length === 0;
}
