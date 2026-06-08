import { isMuteSounds } from "../engine/Settings";

let ctx: AudioContext | null = null;

/** Shared Web Audio context (respects mute setting). */
export function getAudioContext(): AudioContext | null {
    if (isMuteSounds()) return null;
    if (!ctx) {
        ctx = new AudioContext();
    }
    if (ctx.state === "suspended") {
        void ctx.resume();
    }
    return ctx;
}

/** Resume audio after a user gesture (required on iOS/Safari). */
export function unlockAudio(): void {
    if (isMuteSounds()) return;
    if (!ctx) {
        ctx = new AudioContext();
    }
    if (ctx.state === "suspended") {
        void ctx.resume();
    }
}
