import { ClueSystem } from "./ClueSystem";

export interface DialogCondition {
    requiresClue?: string;
    dialog: string;
}

export interface NPCDialogConfig {
    default: string;
    conditions?: DialogCondition[];
}

export class DialogSystem {
    constructor(private clueSystem: ClueSystem) {}

    getDialog(dialogConfig: NPCDialogConfig): string {
        // Check conditions in order - first matching condition wins
        if (dialogConfig.conditions) {
            for (const condition of dialogConfig.conditions) {
                if (condition.requiresClue) {
                    if (this.clueSystem.hasClue(condition.requiresClue)) {
                        return condition.dialog;
                    }
                }
            }
        }

        // Return default dialog if no conditions match
        return dialogConfig.default;
    }
}
