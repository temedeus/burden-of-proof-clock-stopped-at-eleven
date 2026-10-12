import { createCrushedNoise, getAudioContext, getSfxOutput } from "./audioContext";

/** Wet slurp for the stuffed-moose easter egg — Web Audio synthesis, no samples. */
export class MooseSounds {
    playLick(): void {
        const ctx = getAudioContext();
        if (!ctx) return;
        const t = ctx.currentTime;

        const master = ctx.createGain();
        master.gain.setValueAtTime(0.18, t);
        master.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
        master.connect(getSfxOutput(ctx));

        // Rising-then-falling bubbly sweep
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(520, t + 0.22);
        osc.frequency.exponentialRampToValueAtTime(110, t + 0.6);
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.5, t);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
        osc.connect(oscGain).connect(master);
        osc.start(t);
        osc.stop(t + 0.65);

        const noise = ctx.createBufferSource();
        noise.buffer = createCrushedNoise(ctx, 0.5, 3);
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(900, t);
        filter.Q.value = 2;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.35, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
        noise.connect(filter).connect(noiseGain).connect(master);
        noise.start(t);
    }
}

export const mooseSounds = new MooseSounds();
