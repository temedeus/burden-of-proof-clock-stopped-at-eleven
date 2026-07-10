import { getAudioContext } from "./audioContext";

/** Slightly sour chord voicings in Hz (root, third, fifth, optional seventh). */
const CHORD_VOICINGS: number[][] = [
    [261.63, 329.63, 392.0, 493.88],
    [220.0, 261.63, 329.63, 415.3],
    [246.94, 293.66, 349.23, 440.0],
    [196.0, 233.08, 293.66, 369.99],
    [174.61, 207.65, 261.63, 329.63],
    [293.66, 349.23, 440.0, 523.25],
    [277.18, 329.63, 415.3, 493.88]
];

function detune(freq: number, cents: number): number {
    return freq * Math.pow(2, cents / 1200);
}

/**
 * Random out-of-tune piano chord — Web Audio synthesis, no samples.
 */
export class PianoSounds {
    playChord(): void {
        const ctx = getAudioContext();
        if (!ctx) return;

        const chord = CHORD_VOICINGS[Math.floor(Math.random() * CHORD_VOICINGS.length)];
        const noteCount = 3 + Math.floor(Math.random() * 2);
        const notes = chord.slice(0, noteCount);

        const t = ctx.currentTime;
        const master = ctx.createGain();
        master.gain.setValueAtTime(0.14, t);
        master.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
        master.connect(ctx.destination);

        notes.forEach((freq, i) => {
            const start = t + i * 0.018;
            const cents = (Math.random() - 0.5) * 34;
            const f = detune(freq, cents);
            const dur = 0.55 + Math.random() * 0.35;

            const osc = ctx.createOscillator();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(f, start);

            const tone = ctx.createGain();
            tone.gain.setValueAtTime(0.0001, start);
            tone.gain.linearRampToValueAtTime(0.22 - i * 0.03, start + 0.012);
            tone.gain.exponentialRampToValueAtTime(0.0001, start + dur);

            const partial = ctx.createOscillator();
            partial.type = "sine";
            partial.frequency.setValueAtTime(f * 2.01, start);

            const partialGain = ctx.createGain();
            partialGain.gain.setValueAtTime(0.06, start);
            partialGain.gain.exponentialRampToValueAtTime(0.0001, start + dur * 0.55);

            osc.connect(tone);
            partial.connect(partialGain);
            tone.connect(master);
            partialGain.connect(master);

            osc.start(start);
            osc.stop(start + dur);
            partial.start(start);
            partial.stop(start + dur * 0.6);
        });

        // Dull hammer thump
        const thumpStart = t + 0.005;
        const len = Math.floor(ctx.sampleRate * 0.04);
        const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < len; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.08));
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 420;
        const thumpGain = ctx.createGain();
        thumpGain.gain.value = 0.08;
        noise.connect(filter);
        filter.connect(thumpGain);
        thumpGain.connect(master);
        noise.start(thumpStart);
        noise.stop(thumpStart + 0.04);
    }
}

export const pianoSounds = new PianoSounds();
