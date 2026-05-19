import type { GeneratedClue } from "@cse/content-schema";
import baseClues from "../data/clues.json";

export interface ClueEntry {
    name: string;
    description: string;
}

export type ClueCatalog = Record<string, ClueEntry>;

export function buildClueCatalog(generatedClues?: GeneratedClue[]): ClueCatalog {
    const catalog: ClueCatalog = { ...(baseClues as ClueCatalog) };
    for (const clue of generatedClues ?? []) {
        catalog[clue.id] = { name: clue.name, description: clue.description };
    }
    return catalog;
}

export function getClueDisplay(catalog: ClueCatalog, clueId: string): ClueEntry {
    return catalog[clueId] ?? { name: clueId, description: "Unknown clue." };
}
