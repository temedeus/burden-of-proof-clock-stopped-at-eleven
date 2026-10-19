import { createCrushedNoise, getAudioContext, getSfxOutput } from "./audioContext";

/** Boiling-pan splash for the kitchen chase easter egg — Web Audio synthesis, no samples. */
export class KitchenSounds {
    /** Water slosh, then a long sizzle once it lands (`landAt` seconds later). */
    playPanSplash(landAt: number): void {
        const ctx = getAudioContext();
        if (!ctx) return;
        const t = ctx.currentTime;

        const master = ctx.createGain();
        master.gain.value = 0.3;
        master.connect(getSfxOutput(ctx));

        // Slosh: low bandpassed noise swelling as the pan swings
        const slosh = ctx.createBufferSource();
        slosh.buffer = createCrushedNoise(ctx, landAt + 0.2, 2);
        const sloshFilter = ctx.createBiquadFilter();
        sloshFilter.type = "bandpass";
        sloshFilter.frequency.setValueAtTime(400, t);
        sloshFilter.frequency.exponentialRampToValueAtTime(1400, t + landAt);
        sloshFilter.Q.value = 1.5;
        const sloshGain = ctx.createGain();
        sloshGain.gain.setValueAtTime(0.0001, t);
        sloshGain.gain.exponentialRampToValueAtTime(0.6, t + landAt);
        sloshGain.gain.exponentialRampToValueAtTime(0.0001, t + landAt + 0.2);
        slosh.connect(sloshFilter).connect(sloshGain).connect(master);
        slosh.start(t);

        // Sizzle: bright hiss that decays slowly as Ytte steams
        const hit = t + landAt;
        const sizzle = ctx.createBufferSource();
        sizzle.buffer = createCrushedNoise(ctx, 2.2, 1);
        const sizzleFilter = ctx.createBiquadFilter();
        sizzleFilter.type = "highpass";
        sizzleFilter.frequency.value = 3500;
        const sizzleGain = ctx.createGain();
        sizzleGain.gain.setValueAtTime(0.0001, hit);
        sizzleGain.gain.exponentialRampToValueAtTime(0.8, hit + 0.03);
        sizzleGain.gain.exponentialRampToValueAtTime(0.0001, hit + 2.1);
        sizzle.connect(sizzleFilter).connect(sizzleGain).connect(master);
        sizzle.start(hit);
    }
}

export const kitchenSounds = new KitchenSounds();
