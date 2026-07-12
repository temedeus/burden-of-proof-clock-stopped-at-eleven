import type { ClueAssignment, GeneratedClue } from "@cse/content-schema";
import {
    getMissingPrerequisites,
    hasAllPrerequisites,
    resolveClueRequirements
} from "@cse/content-schema";

export class ClueSystem {
    private discovered = new Set<string>();

    addClue(id: string) {
        this.discovered.add(id);
        console.log("Clue discovered:", id);
    }

    hasClue(id: string): boolean {
        return this.discovered.has(id);
    }

    getAllClues(): string[] {
        return Array.from(this.discovered);
    }

    getMissingPrerequisites(requiredIds: string[]): string[] {
        return getMissingPrerequisites(requiredIds, (id) => this.hasClue(id));
    }

    hasAllPrerequisites(requiredIds: string[]): boolean {
        return hasAllPrerequisites(requiredIds, (id) => this.hasClue(id));
    }

    canCollectClue(
        clueId: string,
        generatedClues: GeneratedClue[],
        assignment?: ClueAssignment
    ): boolean {
        if (this.hasClue(clueId)) return false;
        const required = resolveClueRequirements(clueId, generatedClues, assignment);
        return this.hasAllPrerequisites(required);
    }
}
