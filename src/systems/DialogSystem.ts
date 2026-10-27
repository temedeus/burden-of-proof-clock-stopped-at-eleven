import type { NPCDialogConfig, ScriptedSceneId } from "@cse/content-schema";
import { mergeRequiredClueIds } from "@cse/content-schema";
import { ClueSystem } from "./ClueSystem";

export class DialogSystem {
    constructor(
        private clueSystem: ClueSystem,
        /** Whether a scripted scene has finished (for `requiresScenes` conditions). */
        private sceneFinished: (id: ScriptedSceneId) => boolean = () => false
    ) {}

    getDialog(dialogConfig: NPCDialogConfig): string {
        const gateIds = mergeRequiredClueIds(undefined, dialogConfig.requiresClues);
        if (gateIds.length > 0 && !this.clueSystem.hasAllPrerequisites(gateIds)) {
            return dialogConfig.blockedDialog ?? dialogConfig.default;
        }

        // First condition (in listed order) whose clues and scenes are all met wins
        for (const condition of dialogConfig.conditions ?? []) {
            const required = mergeRequiredClueIds(condition.requiresClue, condition.requiresClues);
            if (
                this.clueSystem.hasAllPrerequisites(required) &&
                (condition.requiresScenes ?? []).every((id) => this.sceneFinished(id))
            ) {
                return condition.dialog;
            }
        }

        return dialogConfig.default;
    }
}
