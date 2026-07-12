import type { NPCDialogConfig } from "@cse/content-schema";
import { mergeRequiredClueIds } from "@cse/content-schema";
import { ClueSystem } from "./ClueSystem";

export class DialogSystem {
    constructor(private clueSystem: ClueSystem) {}

    getDialog(dialogConfig: NPCDialogConfig): string {
        const gateIds = mergeRequiredClueIds(undefined, dialogConfig.requiresClues);
        if (gateIds.length > 0 && !this.clueSystem.hasAllPrerequisites(gateIds)) {
            return dialogConfig.blockedDialog ?? dialogConfig.default;
        }

        if (dialogConfig.conditions) {
            const conditions = [...dialogConfig.conditions].sort((a, b) => {
                const aCount = mergeRequiredClueIds(a.requiresClue, a.requiresClues).length;
                const bCount = mergeRequiredClueIds(b.requiresClue, b.requiresClues).length;
                return bCount - aCount;
            });
            for (const condition of conditions) {
                const required = mergeRequiredClueIds(condition.requiresClue, condition.requiresClues);
                if (required.length === 0 || this.clueSystem.hasAllPrerequisites(required)) {
                    return condition.dialog;
                }
            }
        }

        return dialogConfig.default;
    }
}
