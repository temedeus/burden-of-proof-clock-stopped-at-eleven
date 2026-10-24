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

    /**
     * Ytte's slow-motion knockout groan — a long, pitched-down "ooaargghhh": a buzzy
     * voice through sliding vowel formants (oo → aa → rr), breaking into a gravelly
     * fry at the end, over a deep slowed-down impact boom.
     */
    playSlowMoGroan(): void {
        const ctx = getAudioContext();
        if (!ctx) return;
        const t = ctx.currentTime;
        const dur = 1.9;
        const master = ctx.createGain();
        master.gain.value = 0.38;
        // Muffled like slowed-down tape
        const tape = ctx.createBiquadFilter();
        tape.type = "lowpass";
        tape.frequency.setValueAtTime(3200, t);
        tape.frequency.linearRampToValueAtTime(1800, t + dur);
        tape.connect(master).connect(getSfxOutput(ctx));

        // Slowed impact: a sub boom under the punch
        const boom = ctx.createOscillator();
        boom.type = "sine";
        boom.frequency.setValueAtTime(75, t);
        boom.frequency.exponentialRampToValueAtTime(28, t + 0.7);
        const boomGain = ctx.createGain();
        boomGain.gain.setValueAtTime(0.0001, t);
        boomGain.gain.linearRampToValueAtTime(0.9, t + 0.02);
        boomGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
        boom.connect(boomGain).connect(master);
        boom.start(t);
        boom.stop(t + 0.85);

        // Voice: two detuned saws, pitch sagging as the moment drags out
        const voice = ctx.createGain();
        voice.gain.setValueAtTime(0.0001, t);
        voice.gain.linearRampToValueAtTime(0.9, t + 0.14);
        voice.gain.setValueAtTime(0.9, t + 1.35);
        voice.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        const vibrato = ctx.createOscillator();
        vibrato.frequency.value = 4.5;
        const vibratoDepth = ctx.createGain();
        vibratoDepth.gain.value = 3;
        vibrato.connect(vibratoDepth);
        for (const detune of [-8, 7]) {
            const osc = ctx.createOscillator();
            osc.type = "sawtooth";
            osc.detune.value = detune;
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.exponentialRampToValueAtTime(96, t + 0.5);
            osc.frequency.exponentialRampToValueAtTime(68, t + dur);
            vibratoDepth.connect(osc.frequency);
            osc.connect(voice);
            osc.start(t);
            osc.stop(t + dur + 0.05);
        }
        vibrato.start(t);
        vibrato.stop(t + dur + 0.05);

        // Vocal fry: the "gghh" — amplitude chops in toward the end
        const fry = ctx.createGain();
        fry.gain.value = 1;
        const fryLfo = ctx.createOscillator();
        fryLfo.type = "square";
        fryLfo.frequency.setValueAtTime(30, t);
        fryLfo.frequency.linearRampToValueAtTime(22, t + dur);
        const fryDepth = ctx.createGain();
        fryDepth.gain.setValueAtTime(0, t);
        fryDepth.gain.setValueAtTime(0, t + 1.05);
        fryDepth.gain.linearRampToValueAtTime(0.65, t + 1.4);
        fryLfo.connect(fryDepth).connect(fry.gain);
        fryLfo.start(t);
        fryLfo.stop(t + dur + 0.05);
        voice.connect(fry);

        // Vowel formants: oo → aa → rr
        const formants: { points: [number, number][]; q: number; level: number }[] = [
            { points: [[0, 320], [0.65, 720], [1.25, 460], [dur, 420]], q: 5, level: 1 },
            { points: [[0, 800], [0.65, 1150], [1.25, 1300], [dur, 1150]], q: 7, level: 0.55 },
            { points: [[0, 2400], [dur, 2300]], q: 9, level: 0.2 }
        ];
        for (const f of formants) {
            const bp = ctx.createBiquadFilter();
            bp.type = "bandpass";
            bp.Q.value = f.q;
            bp.frequency.setValueAtTime(f.points[0][1], t);
            for (const [at, hz] of f.points.slice(1)) bp.frequency.linearRampToValueAtTime(hz, t + at);
            const level = ctx.createGain();
            level.gain.value = f.level * 2.2;
            fry.connect(bp).connect(level).connect(tape);
        }

        // Breath rasp swelling under the "gghh"
        const rasp = ctx.createBufferSource();
        rasp.buffer = createCrushedNoise(ctx, dur, 3, 3);
        const raspFilter = ctx.createBiquadFilter();
        raspFilter.type = "bandpass";
        raspFilter.frequency.value = 1400;
        raspFilter.Q.value = 1.2;
        const raspGain = ctx.createGain();
        raspGain.gain.setValueAtTime(0.0001, t);
        raspGain.gain.exponentialRampToValueAtTime(0.05, t + 0.8);
        raspGain.gain.exponentialRampToValueAtTime(0.22, t + 1.45);
        raspGain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        rasp.connect(raspFilter).connect(raspGain).connect(tape);
        rasp.start(t);
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
