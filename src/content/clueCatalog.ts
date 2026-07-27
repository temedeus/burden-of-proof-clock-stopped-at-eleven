import type { GeneratedClue } from "@cse/content-schema";
import type { SpriteName } from "@cse/content-schema";
import baseClues from "../data/clues.json";

const DEFAULT_CLUE_ICON: SpriteName = "clue_generic";

export interface ClueEntry {
    name: string;
    description: string;
    hideFromInventory?: boolean;
}

export type ClueCatalog = Record<string, ClueEntry>;

/** Inventory icon per clue id — the item itself, not the furniture or NPC it came from. */
const CLUE_ICON_BY_ID: Record<string, SpriteName> = {
    torn_page: "clue_torn_note",
    torn_appointment_note: "clue_torn_note",
    burned_ledger_page: "clue_burned_ledger",
    barons_diary: "barons_diary",
    rusty_old_key: "rusty_old_key",
    manor_floor_plans: "clue_floor_plans",
    von_virtanens_journal: "clue_journal",
    silver_key: "clue_silver_key",
    smuggling_documents: "clue_smuggling_docs",
    bloody_apron: "clue_bloody_apron",
    cellar_evidence: "clue_cellar_evidence",
    missing_ledger_page: "clue_ledger_page",
    murder_weapon: "clue_murder_weapon"
};

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

/** Sprite drawn in the inventory grid for a clue. */
export function resolveClueIconSprite(clueId: string): SpriteName {
    return CLUE_ICON_BY_ID[clueId] ?? DEFAULT_CLUE_ICON;
}
