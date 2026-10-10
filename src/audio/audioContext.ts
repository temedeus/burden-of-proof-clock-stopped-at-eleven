import { isMuteSounds } from "../engine/Settings";

let ctx: AudioContext | null = null;
let bus: AudioNode | null = null;

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

/** Dark, short "mansion room" impulse response — noise tail with early reflections, SNES-style reverb. */
function buildRoomImpulse(c: AudioContext): AudioBuffer {
    const seconds = 0.7;
    const len = Math.floor(c.sampleRate * seconds);
    const ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
        const data = ir.getChannelData(ch);
        let lp = 0;
        for (let i = 0; i < len; i++) {
            const env = Math.pow(1 - i / len, 3.2);
            // one-pole lowpass that darkens further as the tail decays
            const k = 0.12 + 0.5 * env;
            lp += ((Math.random() * 2 - 1) - lp) * k;
            data[i] = lp * env;
        }
        const taps = ch === 0 ? [0.011, 0.023, 0.037] : [0.015, 0.029, 0.043];
        taps.forEach((s, n) => {
            const idx = Math.floor(s * c.sampleRate);
            if (idx < len) data[idx] += 0.5 / (n + 1);
        });
    }
    return ir;
}

/**
 * Shared output for all game audio: band-limited (≈ SNES/PS1 DAC feel),
 * gently compressed, with a small dark room reverb send for realism.
 * Use instead of `ctx.destination`.
 */
export function getSfxOutput(c: AudioContext): AudioNode {
    if (bus) return bus;

    const input = c.createGain();

    const tone = c.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 9500;
    tone.Q.value = 0.6;

    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 14;
    comp.ratio.value = 3;
    comp.attack.value = 0.004;
    comp.release.value = 0.18;

    input.connect(tone);
    tone.connect(comp);
    comp.connect(c.destination);

    const reverb = c.createConvolver();
    reverb.buffer = buildRoomImpulse(c);
    const send = c.createGain();
    send.gain.value = 0.2;
    const ret = c.createGain();
    ret.gain.value = 0.9;
    input.connect(send);
    send.connect(reverb);
    reverb.connect(ret);
    ret.connect(tone);

    bus = input;
    return bus;
}

/**
 * Decaying noise burst with sample-and-hold + bit reduction, so hits sound like
 * low-rate 8-bit samples instead of clean white noise.
 */
export function createCrushedNoise(
    c: AudioContext,
    duration: number,
    decay: number,
    hold = 2,
    levels = 48
): AudioBuffer {
    const n = Math.max(1, Math.floor(c.sampleRate * duration));
    const buffer = c.createBuffer(1, n, c.sampleRate);
    const d = buffer.getChannelData(0);
    let held = 0;
    for (let i = 0; i < n; i++) {
        if (i % hold === 0) {
            held = Math.round((Math.random() * 2 - 1) * levels) / levels;
        }
        d[i] = held * Math.exp(-i / (n * decay));
    }
    return buffer;
}
