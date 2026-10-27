import cutscenesJson from "../data/story/cutscenes.json";

/** One household card on the intro screen. */
export interface IntroCharacter {
    spriteName: string;
    name: string;
    role: string;
    line: string;
    victim?: boolean;
}

/**
 * Text for scripted scenes, intro slides and other one-off moments
 * (`src/data/story/cutscenes.json`). Lines use the usual "Name: line" speaker
 * prefixes; `???` is the hooded murderer and `You` the detective.
 */
export interface CutsceneText {
    intro: {
        premise: { kicker: string; title: string; lines: string[]; footer: string };
        household: IntroCharacter[];
    };
    diningScare: {
        /** Hooded figure after the burned ledger page is found. */
        monologue: string[];
        /** Murderer's cry when shoved into the hearth. */
        panicLine: string;
        /** Baroness calling for help while the detective lies in the smoke. */
        aftermath: string[];
        /** Baroness at the detective's bedside in the guest room. */
        wake: string[];
        /** Detective's thought once she leaves. */
        wakeThought: string;
    };
    atticScare: { monologue: string[] };
    secretPassages: { study: string; cellar: string };
    /** Detective's reaction after the stuffed moose licks them. */
    study: { mooseLick: string };
    ballroom: { groundskeeperWindow: string; windowLook: string; chandelierDodged: string };
    finale: {
        chaseStart: string;
        kitchenVaultShout: string;
        panSplashShouts: string[];
        fistFightTaunt: string;
        /** Rooms where the murderer stops for a brawl (once each), with the knockout text there. */
        fistFightRooms: Record<string, string>;
    };
}

export const CUTSCENE_TEXT: CutsceneText = cutscenesJson;
