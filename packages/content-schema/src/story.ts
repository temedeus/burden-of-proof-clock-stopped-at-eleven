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
}

export interface ClueAssignment {
    clueId: string;
    roomId: string;
    /** Furniture type id (matches placement.furnitureId / interactable id). */
    furnitureId?: string;
    /** Which instance when the same furnitureId appears multiple times in a room (0-based). */
    furnitureIndex?: number;
    hint: string;
}

/** Number of clues the player should find before accusing the culprit. */
export const STORY_CLUE_COUNT = 5;

export interface NPCDialogOverride {
    npcId: string;
    default: string;
    conditions?: Array<{
        requiresClue?: string;
        dialog: string;
    }>;
}

export interface StoryCasePacket {
    title: string;
    victim: StoryVictim;
    /** NPC id of the murderer (must be placed in the world). */
    culpritNpcId: string;
    suspects: StorySuspect[];
    roomNarratives: RoomNarrative[];
    /** Exactly {@link STORY_CLUE_COUNT} clues for this case. */
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
    qualityTier: "local" | "fast" | "quality";
    isValid: boolean;
}

export interface StoryManifest {
    version: number;
    stories: StoryManifestEntry[];
}
