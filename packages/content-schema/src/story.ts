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

export interface ClueAssignment {
    clueId: string;
    roomId: string;
    hint: string;
}

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
    suspects: StorySuspect[];
    roomNarratives: RoomNarrative[];
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
    qualityTier: "fast" | "quality";
    isValid: boolean;
}

export interface StoryManifest {
    version: number;
    stories: StoryManifestEntry[];
}
