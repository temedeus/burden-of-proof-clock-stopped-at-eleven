import { createCrushedNoise, getAudioContext, getSfxOutput } from "./audioContext";

/**
 * Short procedural "bling" when a clue is discovered.
 */
export class ClueSounds {
    playFound(): void {
        const ctx = getAudioContext();
        if (!ctx) return;

        const t = ctx.currentTime;
        const master = ctx.createGain();
        master.gain.setValueAtTime(0.12, t);
        master.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
        master.connect(getSfxOutput(ctx));

        const notes = [987.77, 1318.51, 1567.98, 1975.53];

        notes.forEach((freq, i) => {
            const start = t + i * 0.065;
            const dur = 0.32;

            const osc = ctx.createOscillator();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, start);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.02, start + 0.04);

            const tone = ctx.createGain();
            tone.gain.setValueAtTime(0.0001, start);
            tone.gain.linearRampToValueAtTime(0.35 - i * 0.05, start + 0.008);
            tone.gain.exponentialRampToValueAtTime(0.0001, start + dur);

            const shimmer = ctx.createOscillator();
            shimmer.type = "sine";
            shimmer.frequency.value = freq * 2.76; // bell-like inharmonic partial

            const shimGain = ctx.createGain();
            shimGain.gain.setValueAtTime(0.08, start);
            shimGain.gain.exponentialRampToValueAtTime(0.0001, start + dur * 0.6);

            osc.connect(tone);
            shimmer.connect(shimGain);
            tone.connect(master);
            shimGain.connect(master);

            osc.start(start);
            osc.stop(start + dur);
            shimmer.start(start);
            shimmer.stop(start + dur * 0.7);
        });

        // Soft high sparkle tail
        const tailStart = t + 0.22;
        const buffer = createCrushedNoise(ctx, 0.12, 0.12, 3, 32);

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.value = 2400;

        const tailGain = ctx.createGain();
        tailGain.gain.value = 0.06;

        noise.connect(filter);
        filter.connect(tailGain);
        tailGain.connect(master);
        noise.start(tailStart);
        noise.stop(tailStart + 0.12);
    }
}

export const clueSounds = new ClueSounds();
