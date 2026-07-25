/**
 * Post-event NPC talk lines (dining fire, attic scare, mid/late evidence).
 * Checked in Game before falling through to story DialogSystem conditions.
 * Later evidence wins over earlier event acknowledgments.
 */

export const BARONESS_AFTER_FIRE_DIALOG =
    "Lady von Virtanen: Detective — thank heaven you're on your feet. I'm so glad you're okay.";

export const BARONESS_AFTER_ATTIC_DIALOG =
    "Lady von Virtanen: Another attack? In the attic? Someone is hunting you in my house. Please — be careful.";

export const BARONESS_AFTER_APRON_DIALOG =
    "Lady von Virtanen: A bloody kitchen apron… I scarcely want to think what that means for our staff.";

export const BARONESS_AFTER_WEAPON_DIALOG =
    "Lady von Virtanen: You found the weapon? Then you know who did this. God help us — and God keep you safe.";

export const MAID_AFTER_FIRE_DIALOG =
    "Mrs. Clarke: Oh, Detective! I feared the worst when they brought you up. I'm so glad you're okay.";

export const MAID_AFTER_ATTIC_DIALOG =
    "Mrs. Clarke: They say someone came after you in the attic… Please don't go wandering alone.";

export const MAID_AFTER_APRON_DIALOG =
    "Mrs. Clarke: A kitchen apron with blood on it? Mercy — I always thought the kitchen was the safest place in the house.";

export const MAID_AFTER_WEAPON_DIALOG =
    "Mrs. Clarke: You've found the knife? Then it's nearly over. I'm glad you're still standing, Detective.";

export const WALSH_AFTER_FIRE_DIALOG =
    "Inspector Walsh: After that business in the dining room, stay sharp. Report anything further.";

export const WALSH_AFTER_ATTIC_DIALOG =
    "Inspector Walsh: Assaulted after the attic chest? This killer is getting bold. Keep gathering proof — we'll move when you have it.";

export const WALSH_AFTER_SMUGGLING_DIALOG =
    "Inspector Walsh: Forged manifests, names cut out… Follow that trail. Someone in this house is in deep.";

export const WALSH_AFTER_APRON_DIALOG =
    "Inspector Walsh: A bloody apron and a loose cellar door — check the cellars next. We're close.";

export const REED_AFTER_FIRE_DIALOG =
    "Constable Reed: Heard about the dining room. Glad you're upright, Detective. Nobody leaves this manor.";

export const REED_AFTER_WEAPON_DIALOG =
    "Constable Reed: You've got the weapon? Find the Inspector — or bring the killer to either of us. We're ready.";

export const BUTLER_AFTER_FIRE_DIALOG =
    "Mr. Thompson: The dining room… I showed the master in there myself only hours before. What a dreadful scene.";

export const BUTLER_AFTER_APRON_DIALOG =
    "Mr. Thompson: A kitchen apron stiff with blood? I keep the household orderly — this is beyond anything I will tolerate among the staff.";

export const BUTLER_AFTER_WEAPON_DIALOG =
    "Mr. Thompson: So it was one of our own. I will assist the police in any way I can.";

export const STABLE_BOY_AFTER_FIRE_DIALOG =
    "Stable Boy: Heard there was trouble in the dining room. Horses went mad. Glad you got out.";

export const STABLE_BOY_AFTER_ATTIC_DIALOG =
    "Stable Boy: Someone jumped you up in the attic? This place ain't safe tonight — not for you, not for anybody.";

export interface EventDialogContext {
    speakerId: string;
    diningFireResolved: boolean;
    atticScareComplete: boolean;
    hasClue: (clueId: string) => boolean;
}

/**
 * Returns an event-driven talk line, or null to use story DialogSystem output.
 */
export function resolveEventNpcDialog(ctx: EventDialogContext): string | null {
    const { speakerId, diningFireResolved: fire, atticScareComplete: attic, hasClue } = ctx;
    const apron = hasClue("bloody_apron");
    const smuggling = hasClue("smuggling_documents");
    const weapon = hasClue("murder_weapon");

    switch (speakerId) {
        case "baroness": {
            if (weapon) return BARONESS_AFTER_WEAPON_DIALOG;
            if (apron) return BARONESS_AFTER_APRON_DIALOG;
            if (attic) return BARONESS_AFTER_ATTIC_DIALOG;
            if (fire) return BARONESS_AFTER_FIRE_DIALOG;
            return null;
        }
        case "maid": {
            if (weapon) return MAID_AFTER_WEAPON_DIALOG;
            if (apron) return MAID_AFTER_APRON_DIALOG;
            if (attic) return MAID_AFTER_ATTIC_DIALOG;
            if (fire) return MAID_AFTER_FIRE_DIALOG;
            return null;
        }
        case "police": {
            // Full-set confront line stays in active.json (null → DialogSystem).
            if (weapon) return null;
            if (apron) return WALSH_AFTER_APRON_DIALOG;
            if (smuggling) return WALSH_AFTER_SMUGGLING_DIALOG;
            if (attic) return WALSH_AFTER_ATTIC_DIALOG;
            if (fire) return WALSH_AFTER_FIRE_DIALOG;
            return null;
        }
        case "police2": {
            if (weapon) return REED_AFTER_WEAPON_DIALOG;
            if (fire || attic) return REED_AFTER_FIRE_DIALOG;
            return null;
        }
        case "butler": {
            if (weapon) return BUTLER_AFTER_WEAPON_DIALOG;
            if (apron) return BUTLER_AFTER_APRON_DIALOG;
            if (fire) return BUTLER_AFTER_FIRE_DIALOG;
            return null;
        }
        case "worker_boy": {
            // Apron / smuggling lines stay in active.json.
            if (apron || smuggling) return null;
            if (attic) return STABLE_BOY_AFTER_ATTIC_DIALOG;
            if (fire) return STABLE_BOY_AFTER_FIRE_DIALOG;
            return null;
        }
        default:
            return null;
    }
}
