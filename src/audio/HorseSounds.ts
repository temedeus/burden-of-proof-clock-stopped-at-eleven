import { createCrushedNoise, getAudioContext, getSfxOutput } from "./audioContext";
import { isMuteSounds } from "../engine/Settings";
import type { Room } from "../world/Room";

const STABLE_ROOM_ID = "stable";
const MASTER = 0.16;

type HorseCall = "stomp" | "shuffle" | "snort" | "nicker" | "whinny";

/** Weighted pick of the next idle sound; whinnies stay rare. */
function pickCall(): HorseCall {
    const r = Math.random();
    if (r < 0.3) return "stomp";
    if (r < 0.5) return "shuffle";
    if (r < 0.75) return "snort";
    if (r < 0.92) return "nicker";
    return "whinny";
}

/** Procedural horse calls and hoof sounds, played at random while the player is in the stable. */
export class HorseSounds {
    private activeRoomId: string | null = null;
    private timer: ReturnType<typeof setTimeout> | null = null;

    syncForRoom(room: Room): void {
        if (isMuteSounds() || room.id !== STABLE_ROOM_ID) {
            this.stop();
            return;
        }
        if (this.activeRoomId === room.id) return;
        this.activeRoomId = room.id;
        this.schedule(1200 + Math.random() * 1500);
    }

    stop(): void {
        this.activeRoomId = null;
        if (this.timer !== null) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    private schedule(ms: number): void {
        this.timer = setTimeout(() => {
            if (!this.activeRoomId) return;
            this.play(pickCall());
            this.schedule(2200 + Math.random() * 4500);
        }, ms);
    }

    play(call: HorseCall): void {
        switch (call) {
            case "stomp":
                this.playStomp();
                break;
            case "shuffle":
                this.playShuffle();
                break;
            case "snort":
                this.playSnort();
                break;
            case "nicker":
                this.playNicker();
                break;
            case "whinny":
                this.playWhinny();
                break;
        }
    }

    /** One hoof landing on packed boards under straw: woody knock + straw rustle. */
    playStomp(delay = 0, level = 1): void {
        const ctx = getAudioContext();
        if (!ctx) return;
        const t = ctx.currentTime + delay;
        const out = getSfxOutput(ctx);

        const master = ctx.createGain();
        master.gain.setValueAtTime(MASTER * level, t);
        master.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        master.connect(out);

        const knock = ctx.createOscillator();
        knock.type = "sine";
        knock.frequency.setValueAtTime(130 + Math.random() * 25, t);
        knock.frequency.exponentialRampToValueAtTime(52, t + 0.12);
        const kg = ctx.createGain();
        kg.gain.setValueAtTime(0.9, t);
        kg.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
        knock.connect(kg);
        kg.connect(master);
        knock.start(t);
        knock.stop(t + 0.15);

        // Hard hoof clack
        const clack = ctx.createBufferSource();
        clack.buffer = createCrushedNoise(ctx, 0.05, 0.14, 2, 40);
        const cbp = ctx.createBiquadFilter();
        cbp.type = "bandpass";
        cbp.frequency.value = 1300 + Math.random() * 300;
        cbp.Q.value = 1.3;
        const cg = ctx.createGain();
        cg.gain.value = 0.6;
        clack.connect(cbp);
        cbp.connect(cg);
        cg.connect(master);
        clack.start(t);
        clack.stop(t + 0.05);

        // Straw scatter
        const straw = ctx.createBufferSource();
        straw.buffer = createCrushedNoise(ctx, 0.2, 0.4, 2, 32);
        const shp = ctx.createBiquadFilter();
        shp.type = "highpass";
        shp.frequency.value = 2200;
        const sg = ctx.createGain();
        sg.gain.value = 0.18;
        straw.connect(shp);
        shp.connect(sg);
        sg.connect(master);
        straw.start(t + 0.02);
        straw.stop(t + 0.22);
    }

    /** Restless weight-shifting: a few softer, uneven hoof taps. */
    playShuffle(): void {
        const taps = 2 + Math.floor(Math.random() * 2);
        let at = 0;
        for (let i = 0; i < taps; i++) {
            this.playStomp(at, 0.5 + Math.random() * 0.25);
            at += 0.16 + Math.random() * 0.14;
        }
    }

    /** Blowing out through loose lips: pitched flutter over breathy noise. */
    playSnort(): void {
        const ctx = getAudioContext();
        if (!ctx) return;
        const t = ctx.currentTime;
        const dur = 0.45;

        const master = ctx.createGain();
        master.gain.setValueAtTime(0.0001, t);
        master.gain.linearRampToValueAtTime(MASTER * 1.1, t + 0.04);
        master.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        master.connect(getSfxOutput(ctx));

        const noise = ctx.createBufferSource();
        noise.buffer = createCrushedNoise(ctx, dur, 0.7, 2, 48);
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.setValueAtTime(1400, t);
        bp.frequency.exponentialRampToValueAtTime(600, t + dur);
        bp.Q.value = 0.9;

        // Lip flutter: amplitude modulation around 28 Hz
        const flutter = ctx.createGain();
        flutter.gain.value = 0.55;
        const lfo = ctx.createOscillator();
        lfo.type = "square";
        lfo.frequency.value = 26 + Math.random() * 6;
        const lfoDepth = ctx.createGain();
        lfoDepth.gain.value = 0.45;
        lfo.connect(lfoDepth);
        lfoDepth.connect(flutter.gain);
        lfo.start(t);
        lfo.stop(t + dur);

        noise.connect(bp);
        bp.connect(flutter);
        flutter.connect(master);
        noise.start(t);
        noise.stop(t + dur);
    }

    /** Low, soft, rumbling nicker — a few pulsed throaty pulses. */
    playNicker(): void {
        const ctx = getAudioContext();
        if (!ctx) return;
        const t = ctx.currentTime;
        const dur = 0.7;
        const f0 = 150 + Math.random() * 40;

        this.horseVoice(ctx, t, dur, f0, (p) => f0 * (1 + 0.1 * Math.sin(p * Math.PI) - 0.15 * p), {
            level: MASTER * 0.9,
            pulseHz: 14,
            formants: [520, 1250],
            breath: 0.12
        });
    }

    /** Full whinny: a cracking rise to a high squeal, then a trailing, wavering fall. */
    playWhinny(): void {
        const ctx = getAudioContext();
        if (!ctx) return;
        const t = ctx.currentTime;
        const dur = 1.35;
        const base = 420 + Math.random() * 60;

        this.horseVoice(
            ctx,
            t,
            dur,
            base,
            (p) => {
                if (p < 0.12) return base * (0.8 + p * 3); // crack up
                if (p < 0.4) return base * (1.2 + (p - 0.12) * 1.4); // squeal peak
                const fall = (p - 0.4) / 0.6;
                // staccato descending whickers
                return base * (1.6 - fall * 1.05) * (1 + 0.06 * Math.sin(fall * 38));
            },
            { level: MASTER * 0.95, pulseHz: 9, formants: [900, 2300], breath: 0.2 }
        );
    }

    private horseVoice(
        ctx: AudioContext,
        t: number,
        dur: number,
        f0: number,
        contour: (progress: number) => number,
        opts: { level: number; pulseHz: number; formants: [number, number]; breath: number }
    ): void {
        const master = ctx.createGain();
        master.gain.setValueAtTime(0.0001, t);
        master.gain.linearRampToValueAtTime(opts.level, t + 0.06);
        master.gain.setValueAtTime(opts.level, t + dur * 0.55);
        master.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        master.connect(getSfxOutput(ctx));

        // Throat source: rough sawtooth with pitch following the contour
        const src = ctx.createOscillator();
        src.type = "sawtooth";
        const steps = 36;
        const curve = new Float32Array(steps);
        for (let i = 0; i < steps; i++) curve[i] = contour(i / (steps - 1));
        src.frequency.setValueCurveAtTime(curve, t, dur);

        // Chaotic jitter makes the voice rough rather than a clean synth
        const jitter = ctx.createOscillator();
        jitter.type = "triangle";
        jitter.frequency.value = 53;
        const jitterDepth = ctx.createGain();
        jitterDepth.gain.value = f0 * 0.035;
        jitter.connect(jitterDepth);
        jitterDepth.connect(src.frequency);

        // Pulsing amplitude (the rhythmic "hu-hu-hu" of a nicker / whinny)
        const pulse = ctx.createGain();
        pulse.gain.value = 0.7;
        const pulseLfo = ctx.createOscillator();
        pulseLfo.type = "sine";
        pulseLfo.frequency.value = opts.pulseHz;
        const pulseDepth = ctx.createGain();
        pulseDepth.gain.value = 0.3;
        pulseLfo.connect(pulseDepth);
        pulseDepth.connect(pulse.gain);

        src.connect(pulse);
        opts.formants.forEach((hz, i) => {
            const bp = ctx.createBiquadFilter();
            bp.type = "bandpass";
            bp.frequency.value = hz;
            bp.Q.value = 3.5;
            const g = ctx.createGain();
            g.gain.value = i === 0 ? 1.8 : 1.0;
            pulse.connect(bp);
            bp.connect(g);
            g.connect(master);
        });

        // Breath
        const noise = ctx.createBufferSource();
        noise.buffer = createCrushedNoise(ctx, dur, 3, 2, 40);
        const nbp = ctx.createBiquadFilter();
        nbp.type = "bandpass";
        nbp.frequency.value = opts.formants[1];
        nbp.Q.value = 0.7;
        const ng = ctx.createGain();
        ng.gain.value = opts.breath;
        noise.connect(nbp);
        nbp.connect(ng);
        ng.connect(master);

        for (const node of [src, jitter, pulseLfo]) {
            node.start(t);
            node.stop(t + dur);
        }
        noise.start(t);
        noise.stop(t + dur);
    }
}

export const horseSounds = new HorseSounds();
