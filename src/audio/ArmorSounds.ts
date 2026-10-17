import { createCrushedNoise, getAudioContext, getSfxOutput } from "./audioContext";

/** Rattling and clanking plate armor — Web Audio synthesis, no samples. */
export class ArmorSounds {
    /** Plates jingling against each other while the suit is shaken. */
    playRattle(): void {
        const ctx = getAudioContext();
        if (!ctx) return;
        const t = ctx.currentTime;
        const master = ctx.createGain();
        master.gain.setValueAtTime(0.12, t);
        master.connect(getSfxOutput(ctx));
        for (let i = 0; i < 14; i++) {
            const start = t + i * 0.06 + Math.random() * 0.02;
            this.ping(ctx, master, start, 900 + Math.random() * 1400, 0.25 + (i / 14) * 0.5, 0.08);
        }
    }

    /** One piece of plate hitting the floor. */
    playClank(): void {
        const ctx = getAudioContext();
        if (!ctx) return;
        const t = ctx.currentTime;
        const master = ctx.createGain();
        master.gain.setValueAtTime(0.16, t);
        master.connect(getSfxOutput(ctx));

        // Inharmonic partials give a hollow metal "clang"
        const base = 320 + Math.random() * 380;
        [1, 2.76, 5.4, 8.9].forEach((ratio, i) => {
            this.ping(ctx, master, t, base * ratio, 0.6 / (i + 1), 0.5 - i * 0.08);
        });

        const noise = ctx.createBufferSource();
        noise.buffer = createCrushedNoise(ctx, 0.12, 0.04);
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 2200;
        bp.Q.value = 0.9;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0.5, t);
        ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
        noise.connect(bp).connect(ng).connect(master);
        noise.start(t);
        noise.stop(t + 0.12);
    }

    /** Iron handcuff snapping shut: a quick ratchet of clicks, then a solid clack. */
    playCuffClick(): void {
        const ctx = getAudioContext();
        if (!ctx) return;
        const t = ctx.currentTime;
        const master = ctx.createGain();
        master.gain.setValueAtTime(0.14, t);
        master.connect(getSfxOutput(ctx));
        for (let i = 0; i < 4; i++) {
            this.ping(ctx, master, t + i * 0.022, 2600 + i * 180, 0.35, 0.03);
        }
        [1, 2.4, 4.1].forEach((ratio, i) => {
            this.ping(ctx, master, t + 0.1, 520 * ratio, 0.7 / (i + 1), 0.22 - i * 0.05);
        });
    }

    private ping(ctx: AudioContext, out: AudioNode, start: number, freq: number, level: number, dur: number): void {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, start);
        g.gain.linearRampToValueAtTime(level, start + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        osc.connect(g).connect(out);
        osc.start(start);
        osc.stop(start + dur + 0.02);
    }
}

export const armorSounds = new ArmorSounds();
