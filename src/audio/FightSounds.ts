import { createCrushedNoise, getAudioContext, getSfxOutput } from "./audioContext";

/** Fist fight effects — Web Audio synthesis, no samples. */
export class FightSounds {
    /** Fist landing: meaty low thump with a sharp slap on top. */
    playPunch(heavy = false): void {
        const ctx = getAudioContext();
        if (!ctx) return;
        const t = ctx.currentTime;
        const master = ctx.createGain();
        master.gain.value = heavy ? 0.42 : 0.32;
        master.connect(getSfxOutput(ctx));

        const thump = ctx.createOscillator();
        thump.type = "sine";
        thump.frequency.setValueAtTime(heavy ? 120 : 160, t);
        thump.frequency.exponentialRampToValueAtTime(50, t + 0.14);
        const thumpGain = ctx.createGain();
        thumpGain.gain.setValueAtTime(0.0001, t);
        thumpGain.gain.linearRampToValueAtTime(1, t + 0.004);
        thumpGain.gain.exponentialRampToValueAtTime(0.0001, t + (heavy ? 0.3 : 0.18));
        thump.connect(thumpGain).connect(master);
        thump.start(t);
        thump.stop(t + 0.32);

        const slap = ctx.createBufferSource();
        slap.buffer = createCrushedNoise(ctx, 0.07, 0.25);
        const slapFilter = ctx.createBiquadFilter();
        slapFilter.type = "bandpass";
        slapFilter.frequency.value = 1800;
        slapFilter.Q.value = 0.9;
        const slapGain = ctx.createGain();
        slapGain.gain.value = 0.8;
        slap.connect(slapFilter).connect(slapGain).connect(master);
        slap.start(t);
    }

    /** Swing cutting the air (ducked / whiffed). */
    playWhoosh(): void {
        const ctx = getAudioContext();
        if (!ctx) return;
        const t = ctx.currentTime;
        const noise = ctx.createBufferSource();
        noise.buffer = createCrushedNoise(ctx, 0.22, 1.2);
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(700, t);
        filter.frequency.exponentialRampToValueAtTime(2600, t + 0.1);
        filter.frequency.exponentialRampToValueAtTime(900, t + 0.2);
        filter.Q.value = 1.6;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.28, t + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        noise.connect(filter).connect(gain).connect(getSfxOutput(ctx));
        noise.start(t);
    }

    /** Knuckles into raised forearms: dull, short knock. */
    playBlock(): void {
        const ctx = getAudioContext();
        if (!ctx) return;
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(210, t);
        osc.frequency.exponentialRampToValueAtTime(110, t + 0.07);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
        osc.connect(gain).connect(getSfxOutput(ctx));
        osc.start(t);
        osc.stop(t + 0.1);
    }

    /** Body hitting the floor (knockout). */
    playThud(): void {
        const ctx = getAudioContext();
        if (!ctx) return;
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(90, t);
        osc.frequency.exponentialRampToValueAtTime(35, t + 0.35);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(0.5, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
        osc.connect(gain).connect(getSfxOutput(ctx));
        osc.start(t);
        osc.stop(t + 0.5);
    }
}

export const fightSounds = new FightSounds();
