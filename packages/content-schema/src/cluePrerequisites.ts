import type { ClueAssignment, GeneratedClue } from "./story";

export const DEFAULT_BLOCKED_CLUE_HINT = "Nothing useful catches your eye yet.";

/** Examine text after every clue on the object has been collected. */
export const DEFAULT_EXHAUSTED_CLUE_HINT = "Nothing of interest anymore.";

/** Merge requiresClue (legacy) and requiresClues into a deduplicated list. */
export function mergeRequiredClueIds(
    requiresClue?: string,
    requiresClues?: string[]
): string[] {
    const ids = [...(requiresClues ?? [])];
    if (requiresClue && !ids.includes(requiresClue)) {
        ids.push(requiresClue);
    }
    return ids;
}

export function resolveClueRequirements(
    clueId: string,
    generatedClues: GeneratedClue[],
    assignment?: ClueAssignment
): string[] {
    const clue = generatedClues.find((entry) => entry.id === clueId);
    const fromClue = clue?.requiresClues ?? [];
    const fromAssignment = assignment?.requiresClues ?? [];
    return [...new Set([...fromClue, ...fromAssignment])];
}

export function resolveBlockedHint(
    clueId: string,
    generatedClues: GeneratedClue[],
    assignment?: ClueAssignment
): string {
    const clue = generatedClues.find((entry) => entry.id === clueId);
    return assignment?.blockedHint ?? clue?.blockedHint ?? DEFAULT_BLOCKED_CLUE_HINT;
}

export function getMissingPrerequisites(
    requiredIds: string[],
    hasClue: (id: string) => boolean
): string[] {
    return requiredIds.filter((id) => !hasClue(id));
}

export function hasAllPrerequisites(
    requiredIds: string[],
    hasClue: (id: string) => boolean
): boolean {
    return getMissingPrerequisites(requiredIds, hasClue).length === 0;
}

export interface ClueDependencyNode {
    id: string;
    requires: string[];
}

/** Returns human-readable cycle descriptions, or an empty array when acyclic. */
export function detectClueDependencyCycles(
    generatedClues: GeneratedClue[],
    clueAssignments: ClueAssignment[] = []
): string[] {
    const assignmentByClue = new Map(clueAssignments.map((a) => [a.clueId, a]));
    const nodes: ClueDependencyNode[] = generatedClues.map((clue) => ({
        id: clue.id,
        requires: resolveClueRequirements(clue.id, generatedClues, assignmentByClue.get(clue.id))
    }));

    const cycles: string[] = [];
    const visiting = new Set<string>();
    const visited = new Set<string>();
    const stack: string[] = [];

    function dfs(id: string): void {
        if (visited.has(id)) return;
        if (visiting.has(id)) {
            const start = stack.indexOf(id);
            const cycle = stack.slice(start).concat(id).join(" → ");
            cycles.push(`Clue dependency cycle: ${cycle}`);
            return;
        }

        visiting.add(id);
        stack.push(id);
        const node = nodes.find((n) => n.id === id);
        for (const req of node?.requires ?? []) {
            if (generatedClues.some((c) => c.id === req)) {
                dfs(req);
            }
        }
        stack.pop();
        visiting.delete(id);
        visited.add(id);
    }

    for (const clue of generatedClues) {
        dfs(clue.id);
    }

    return [...new Set(cycles)];
}
