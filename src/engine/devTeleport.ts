/**
 * Developer-only scene teleport (open the game with `?devTeleport`).
 *
 * Each moment stages the story state just before a key scene — clues, event
 * flags, room — and places the player beside the final trigger, which is left
 * for you to activate. Staged sessions never autosave, so real saves are safe.
 */

import type { SceneId } from "../systems/scriptedScenes";

export interface DevTeleportFlags {
    diningFireResolved?: boolean;
    completedScenes?: SceneId[];
    studySecretRevealed?: boolean;
    cellarSecretRevealed?: boolean;
    cookHiddenAfterDiningScare?: boolean;
    /** Mid finale chase: confession done, Ytte hunting the detective. */
    finaleChase?: boolean;
}

export interface DevTeleportMoment {
    id: string;
    label: string;
    /** What you do once there to trigger the scene. */
    action: string;
    roomId: string;
    clues: string[];
    flags: DevTeleportFlags;
    /** The object to stand beside: matched by confirm id, or by a clue it holds. */
    trigger?: { confirmId?: string; clueId?: string };
    /** Instead of a trigger: the detective has just fled in through this room's door (Ytte follows). */
    enterFrom?: string;
}

export function isDevTeleportEnabled(search: string = typeof location !== "undefined" ? location.search : ""): boolean {
    return new URLSearchParams(search).has("devTeleport");
}

const HALL_CLUES = ["examined_body", "examined_clock", "maid_statement", "torn_appointment_note"];
const BEFORE_ATTIC = [...HALL_CLUES, "burned_ledger_page", "barons_diary", "rusty_old_key"];
const BEFORE_STUDY = [...BEFORE_ATTIC, "manor_floor_plans"];
const BEFORE_CELLAR = [
    ...BEFORE_STUDY,
    "von_virtanens_journal",
    "silver_key",
    "smuggling_documents",
    "bloody_apron",
    "cellar_evidence"
];

export const DEV_TELEPORT_MOMENTS: DevTeleportMoment[] = [
    {
        id: "ledger_scare",
        label: "Ledger scare & dining-room fire",
        action: "Examine the ash canister",
        roomId: "dining",
        clues: HALL_CLUES,
        flags: {},
        trigger: { clueId: "burned_ledger_page" }
    },
    {
        id: "attic_chest",
        label: "Attic chest & attic scare",
        action: "Open the old chest",
        roomId: "attic",
        clues: BEFORE_ATTIC,
        flags: { diningFireResolved: true, completedScenes: ["ledger_scare"], cookHiddenAfterDiningScare: true },
        trigger: { confirmId: "attic_chest" }
    },
    {
        id: "study_secret",
        label: "Study secret passage",
        action: "Pull the loose book",
        roomId: "study",
        clues: BEFORE_STUDY,
        flags: { diningFireResolved: true, completedScenes: ["ledger_scare", "attic_scare"] },
        trigger: { confirmId: "study_secret" }
    },
    {
        id: "cellar_passage",
        label: "Cellar barrel passage",
        action: "Open the barrel passage",
        roomId: "cellar_storage",
        clues: BEFORE_CELLAR,
        flags: {
            diningFireResolved: true,
            completedScenes: ["ledger_scare", "attic_scare"],
            studySecretRevealed: true
        },
        trigger: { confirmId: "cellar_secret" }
    },
    {
        id: "murder_weapon",
        label: "Murder weapon & confrontation",
        action: "Examine the rear barrel",
        roomId: "wine_cellar",
        clues: BEFORE_CELLAR,
        flags: {
            diningFireResolved: true,
            completedScenes: ["ledger_scare", "attic_scare"],
            studySecretRevealed: true,
            cellarSecretRevealed: true
        },
        trigger: { clueId: "missing_ledger_page" }
    },
    {
        id: "tunnel_fist_fight",
        label: "Finale chase: tunnel fist fight",
        action: "Wait — Ytte follows you into the tunnel",
        roomId: "secret_tunnel",
        clues: [...BEFORE_CELLAR, "missing_ledger_page", "murder_weapon"],
        flags: {
            diningFireResolved: true,
            completedScenes: ["ledger_scare", "attic_scare", "confrontation"],
            studySecretRevealed: true,
            cellarSecretRevealed: true,
            finaleChase: true
        },
        enterFrom: "cellar_storage"
    }
];
