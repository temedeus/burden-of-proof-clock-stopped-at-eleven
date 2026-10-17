import { getAudioContext, getSfxOutput } from "./audioContext";

/** E-flat major across two octaves, low to high (Hz). */
const STRINGS = [
    155.56, 174.61, 196.0, 207.65, 233.08, 261.63, 293.66, 311.13, 349.23, 392.0, 415.3, 466.16, 523.25, 587.33,
    622.25, 698.46
];

function detune(freq: number, cents: number): number {
    return freq * Math.pow(2, cents / 1200);
}

/**
 * Plucked harp glissando, slightly out of tune — Web Audio synthesis, no samples.
 */
export class HarpSounds {
    playGlissando(): void {
        const ctx = getAudioContext();
        if (!ctx) return;

        const t = ctx.currentTime;
        const master = ctx.createGain();
        master.gain.setValueAtTime(0.12, t);
        master.connect(getSfxOutput(ctx));

        // A run of 7–10 strings, mostly sweeping up, from a random starting string
        const count = 7 + Math.floor(Math.random() * 4);
        const up = Math.random() < 0.75;
        const first = up
            ? Math.floor(Math.random() * (STRINGS.length - count))
            : count - 1 + Math.floor(Math.random() * (STRINGS.length - count));
        const step = 0.045 + Math.random() * 0.02;

        for (let i = 0; i < count; i++) {
            const freq = detune(STRINGS[first + (up ? i : -i)], (Math.random() - 0.5) * 30);
            const start = t + i * step;
            const dur = 1.4 + Math.random() * 0.4;

            const tone = ctx.createGain();
            tone.gain.setValueAtTime(0.0001, start);
            tone.gain.linearRampToValueAtTime(0.3, start + 0.006);
            tone.gain.exponentialRampToValueAtTime(0.0001, start + dur);
            tone.connect(master);

            // Soft triangle body plus a bright octave partial that fades first
            const body = ctx.createOscillator();
            body.type = "triangle";
            body.frequency.setValueAtTime(freq, start);
            body.connect(tone);
            body.start(start);
            body.stop(start + dur);

            const partial = ctx.createOscillator();
            partial.type = "sine";
            partial.frequency.setValueAtTime(freq * 2.005, start);
            const partialGain = ctx.createGain();
            partialGain.gain.setValueAtTime(0.35, start);
            partialGain.gain.exponentialRampToValueAtTime(0.0001, start + dur * 0.35);
            partial.connect(partialGain).connect(tone);
            partial.start(start);
            partial.stop(start + dur * 0.4);
        }
    }
}

export const harpSounds = new HarpSounds();
