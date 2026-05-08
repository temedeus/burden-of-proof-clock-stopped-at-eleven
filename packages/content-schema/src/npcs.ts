export interface DialogCondition {
    requiresClue?: string;
    dialog: string;
}

export interface NPCDialogConfig {
    default: string;
    conditions?: DialogCondition[];
}

export interface NPCConfig {
    id: string;
    name: string;
    role?: string;
    spriteName?: string;
    dialog: NPCDialogConfig;
}
