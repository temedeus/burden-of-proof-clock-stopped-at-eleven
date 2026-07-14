import type { ClueAssignment, FurnitureConfig, GeneratedClue, NPCConfig } from "@cse/content-schema";
import baseClues from "../data/clues.json";

const DEFAULT_CLUE_ICON = "reading_table";

export interface ClueEntry {
    name: string;
    description: string;
    hideFromInventory?: boolean;
}

export type ClueCatalog = Record<string, ClueEntry>;

export function buildClueCatalog(generatedClues?: GeneratedClue[]): ClueCatalog {
    const catalog: ClueCatalog = { ...(baseClues as ClueCatalog) };
    for (const clue of generatedClues ?? []) {
        catalog[clue.id] = {
            name: clue.name,
            description: clue.description,
            hideFromInventory: clue.hideFromInventory
        };
    }
    return catalog;
}

export function getClueDisplay(catalog: ClueCatalog, clueId: string): ClueEntry {
    return catalog[clueId] ?? { name: clueId, description: "Unknown clue." };
}

export function getInventoryClueIds(clueIds: string[], catalog: ClueCatalog): string[] {
    return clueIds.filter((id) => !catalog[id]?.hideFromInventory);
}

/** Sprite drawn in the inventory grid for a clue (from its assignment source). */
export function resolveClueIconSprite(
    clueId: string,
    assignments: ClueAssignment[] | undefined,
    furnitureById: Record<string, FurnitureConfig>,
    npcs: Record<string, NPCConfig>
): string {
    const assignment = assignments?.find((entry) => entry.clueId === clueId);
    if (assignment?.furnitureId) {
        return furnitureById[assignment.furnitureId]?.spriteName ?? DEFAULT_CLUE_ICON;
    }
    if (assignment?.npcId) {
        return npcs[assignment.npcId]?.spriteName ?? DEFAULT_CLUE_ICON;
    }
    return DEFAULT_CLUE_ICON;
}
