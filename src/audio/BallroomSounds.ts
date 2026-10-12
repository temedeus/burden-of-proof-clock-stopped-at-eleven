import { createCrushedNoise, getAudioContext, getSfxOutput } from "./audioContext";
import { scareSounds } from "./ScareSounds";

/** Ballroom easter eggs: jump-scare sting, trembling crystal, chandelier crash. */
export class BallroomSounds {
    /** Dissonant stab when the figure appears in the window. */
    playSting(): void {
        const ctx = getAudioContext();
        if (!ctx) return;
        const t = ctx.currentTime;
        const master = ctx.createGain();
        master.gain.setValueAtTime(0.0001, t);
        master.gain.linearRampToValueAtTime(0.16, t + 0.02);
        master.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
        master.connect(getSfxOutput(ctx));
        // Minor-second cluster, high and low
        for (const f of [196, 207.65, 783.99, 830.61, 1567.98]) {
            const osc = ctx.createOscillator();
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(f, t);
            osc.frequency.linearRampToValueAtTime(f * 0.985, t + 1);
            const lp = ctx.createBiquadFilter();
            lp.type = "lowpass";
            lp.frequency.value = 2400;
            const g = ctx.createGain();
            g.gain.value = 0.12;
            osc.connect(lp).connect(g).connect(master);
            osc.start(t);
            osc.stop(t + 1.1);
        }
    }

    /** Crystal drops chinking as the chandelier trembles. */
    playTinkle(duration: number): void {
        const ctx = getAudioContext();
        if (!ctx) return;
        const t = ctx.currentTime;
        const master = ctx.createGain();
        master.gain.setValueAtTime(0.08, t);
        master.connect(getSfxOutput(ctx));
        const count = Math.round(duration * 18);
        for (let i = 0; i < count; i++) {
            const start = t + (i / count) * duration + Math.random() * 0.03;
            const osc = ctx.createOscillator();
            osc.type = "sine";
            osc.frequency.setValueAtTime(3000 + Math.random() * 3000, start);
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.0001, start);
            g.gain.linearRampToValueAtTime(0.3 + (i / count) * 0.5, start + 0.004);
            g.gain.exponentialRampToValueAtTime(0.0001, start + 0.09);
            osc.connect(g).connect(master);
            osc.start(start);
            osc.stop(start + 0.1);
        }
    }

    /** Heavy thud plus shattering glass. */
    playCrash(): void {
        const ctx = getAudioContext();
        if (!ctx) return;
        const t = ctx.currentTime;
        const master = ctx.createGain();
        master.gain.setValueAtTime(0.3, t);
        master.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
        master.connect(getSfxOutput(ctx));
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.4);
        osc.connect(master);
        osc.start(t);
        osc.stop(t + 0.5);
        const noise = ctx.createBufferSource();
        noise.buffer = createCrushedNoise(ctx, 0.3, 0.1);
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 600;
        noise.connect(lp).connect(master);
        noise.start(t);
        scareSounds.playWindowCrash();
    }
}

export const ballroomSounds = new BallroomSounds();
