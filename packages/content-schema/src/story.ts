import type { DialogCondition } from "./npcs";

export interface StoryVictim {
    name: string;
    roomId: string;
    time: string;
}

export interface StorySuspect {
    npcId: string;
    motive: string;
    opportunity: string;
    alibi: string;
}

export interface RoomNarrative {
    roomId: string;
    summary: string;
}

export interface GeneratedClue {
    id: string;
    name: string;
    description: string;
    /** All listed clues must be discovered before this clue can be collected. */
    requiresClues?: string[];
    /** Examine text when prerequisites are not yet satisfied. */
    blockedHint?: string;
    /** When true, clue counts toward the case but is omitted from the inventory panel. */
    hideFromInventory?: boolean;
}

export interface ClueAssignment {
    clueId: string;
    roomId: string;
    /** Furniture type id (matches placement.furnitureId / interactable id). */
    furnitureId?: string;
    /** Which instance when the same furnitureId appears multiple times in a room (0-based). */
    furnitureIndex?: number;
    /** When set, the clue is collected by examining this NPC (see examineClueId on NPC config). */
    npcId?: string;
    hint: string;
    /** Overrides or extends generatedClue.requiresClues for this placement. */
    requiresClues?: string[];
    /** Overrides generatedClue.blockedHint for this placement. */
    blockedHint?: string;
}

/** Default clue count for new stories (editor may add or remove clues). */
export const STORY_CLUE_COUNT = 5;

/** Minimum clues required for a valid case. */
export const MIN_STORY_CLUE_COUNT = 1;

/** Single authored story file id (`src/data/story/generated/stories/<id>.json`). */
export const ACTIVE_STORY_ID = "active";

export interface NPCDialogOverride {
    npcId: string;
    default: string;
    /** All listed clues must be discovered before default dialog is shown. */
    requiresClues?: string[];
    /** Shown when requiresClues gate is not satisfied (dialog mode only). */
    blockedDialog?: string;
    conditions?: DialogCondition[];
}

export interface StoryCasePacket {
    title: string;
    victim: StoryVictim;
    /** NPC id of the murderer (must be placed in the world). */
    culpritNpcId: string;
    suspects: StorySuspect[];
    roomNarratives: RoomNarrative[];
    /** Case clues (player must find all before accusing the culprit). */
    generatedClues: GeneratedClue[];
    clueAssignments: ClueAssignment[];
    npcDialogOverrides: NPCDialogOverride[];
}

export interface StoryManifestEntry {
    id: string;
    title: string;
    seed: number;
    createdAt: string;
    files: {
        story: string;
    };
    qualityTier: "local" | "fast" | "quality" | "authored";
    isValid: boolean;
}

export interface StoryManifest {
    version: number;
    stories: StoryManifestEntry[];
}
