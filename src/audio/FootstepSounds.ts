import { getAudioContext } from "./audioContext";

const WALK_STEP_FPS = 8;
/** Audible but still softer than typical SFX */
const MASTER_GAIN = 0.14;

export type FootstepSurface =
    | "default"
    | "glass"
    | "squish"
    | "grass"
    | "gravel"
    | "sand"
    | "rock"
    | "pale_rock"
    | "attic_wood";

/**
 * Short procedural foot taps (filtered noise + soft thump) via Web Audio API.
 */
export class FootstepSounds {
    private lastFrame = -1;

    /** Call each frame while the player may be walking */
    updateWalkAnim(animTime: number, isMoving: boolean, surface: FootstepSurface = "default"): void {
        if (!isMoving) {
            this.lastFrame = -1;
            return;
        }
        const frame = Math.floor(animTime * WALK_STEP_FPS) % 2;
        if (frame === this.lastFrame) return;
        this.lastFrame = frame;

        switch (surface) {
            case "glass":
                this.playGlassCrackle();
                break;
            case "squish":
                this.playSquish();
                break;
            case "grass":
                this.playGrass();
                break;
            case "gravel":
                this.playGravel();
                break;
            case "sand":
                this.playSand();
                break;
            case "rock":
                this.playRock();
                break;
            case "pale_rock":
                this.playPaleRock();
                break;
            case "attic_wood":
                this.playAtticWood();
                break;
            default:
                this.playStep();
                break;
        }
    }

    playStep(): void {
        const ctx = getAudioContext();
        if (!ctx) return;

        const t = ctx.currentTime;
        const duration = 0.09;
        const pitchJitter = Math.random() * 40;

        const master = ctx.createGain();
        master.gain.setValueAtTime(MASTER_GAIN, t);
        master.gain.exponentialRampToValueAtTime(0.0001, t + duration);
        master.connect(ctx.destination);

        const sampleCount = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < sampleCount; i++) {
            const env = Math.exp(-i / (sampleCount * 0.2));
            samples[i] = (Math.random() * 2 - 1) * env;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 420 + pitchJitter;
        filter.Q.value = 0.9;

        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.75;

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(master);
        noise.start(t);
        noise.stop(t + duration);

        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(95 + pitchJitter, t);
        osc.frequency.exponentialRampToValueAtTime(55, t + duration * 0.8);

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.45, t);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, t + duration * 0.75);

        osc.connect(oscGain);
        oscGain.connect(master);
        osc.start(t);
        osc.stop(t + duration);
    }

    /** Soft leafy rustle — muffled and airy. */
    playGrass(): void {
        const ctx = getAudioContext();
        if (!ctx) return;

        const t = ctx.currentTime;
        const duration = 0.14;
        const master = ctx.createGain();
        master.gain.setValueAtTime(MASTER_GAIN * 0.32, t);
        master.gain.exponentialRampToValueAtTime(0.0001, t + duration);
        master.connect(ctx.destination);

        const sampleCount = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < sampleCount; i++) {
            const env = Math.exp(-i / (sampleCount * 0.45));
            samples[i] = (Math.random() * 2 - 1) * env;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 700 + Math.random() * 280;
        bp.Q.value = 0.45;
        const ng = ctx.createGain();
        ng.gain.value = 0.45;
        noise.connect(bp);
        bp.connect(ng);
        ng.connect(master);
        noise.start(t);
        noise.stop(t + duration);

        const thump = ctx.createOscillator();
        thump.type = "sine";
        thump.frequency.setValueAtTime(58 + Math.random() * 10, t);
        thump.frequency.exponentialRampToValueAtTime(32, t + duration * 0.75);
        const tg = ctx.createGain();
        tg.gain.setValueAtTime(0.08, t);
        tg.gain.exponentialRampToValueAtTime(0.0001, t + duration * 0.55);
        thump.connect(tg);
        tg.connect(master);
        thump.start(t);
        thump.stop(t + duration);
    }

    /** Crunchy multi-burst gravel. */
    playGravel(): void {
        const ctx = getAudioContext();
        if (!ctx) return;

        const t = ctx.currentTime;
        const master = ctx.createGain();
        master.gain.setValueAtTime(MASTER_GAIN * 1.05, t);
        master.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
        master.connect(ctx.destination);

        const bursts = 3 + Math.floor(Math.random() * 2);
        for (let i = 0; i < bursts; i++) {
            const start = t + i * 0.018 + Math.random() * 0.008;
            const duration = 0.025 + Math.random() * 0.03;
            const sampleCount = Math.floor(ctx.sampleRate * duration);
            const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
            const samples = buffer.getChannelData(0);
            for (let s = 0; s < sampleCount; s++) {
                const env = Math.exp(-s / (sampleCount * 0.18));
                samples[s] = (Math.random() * 2 - 1) * env;
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const bp = ctx.createBiquadFilter();
            bp.type = "bandpass";
            bp.frequency.value = 700 + Math.random() * 1600;
            bp.Q.value = 1.2 + Math.random();
            const g = ctx.createGain();
            g.gain.value = 0.4 + Math.random() * 0.25;
            noise.connect(bp);
            bp.connect(g);
            g.connect(master);
            noise.start(start);
            noise.stop(start + duration);
        }

        const click = ctx.createOscillator();
        click.type = "triangle";
        click.frequency.setValueAtTime(180 + Math.random() * 60, t);
        click.frequency.exponentialRampToValueAtTime(90, t + 0.06);
        const cg = ctx.createGain();
        cg.gain.setValueAtTime(0.2, t);
        cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
        click.connect(cg);
        cg.connect(master);
        click.start(t);
        click.stop(t + 0.08);
    }

    /** Soft sandy shush. */
    playSand(): void {
        const ctx = getAudioContext();
        if (!ctx) return;

        const t = ctx.currentTime;
        const duration = 0.16;
        const master = ctx.createGain();
        master.gain.setValueAtTime(MASTER_GAIN * 0.28, t);
        master.gain.exponentialRampToValueAtTime(0.0001, t + duration);
        master.connect(ctx.destination);

        const sampleCount = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < sampleCount; i++) {
            const env = Math.exp(-i / (sampleCount * 0.55));
            samples[i] = (Math.random() * 2 - 1) * env;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 420 + Math.random() * 180;
        bp.Q.value = 0.35;
        const ng = ctx.createGain();
        ng.gain.value = 0.5;
        noise.connect(bp);
        bp.connect(ng);
        ng.connect(master);
        noise.start(t);
        noise.stop(t + duration);

        const soft = ctx.createOscillator();
        soft.type = "sine";
        soft.frequency.setValueAtTime(48 + Math.random() * 8, t);
        soft.frequency.exponentialRampToValueAtTime(28, t + duration * 0.85);
        const sg = ctx.createGain();
        sg.gain.setValueAtTime(0.06, t);
        sg.gain.exponentialRampToValueAtTime(0.0001, t + duration * 0.65);
        soft.connect(sg);
        sg.connect(master);
        soft.start(t);
        soft.stop(t + duration);
    }

    /** Hard stone tap — brighter and shorter than indoor wood. */
    playRock(): void {
        const ctx = getAudioContext();
        if (!ctx) return;

        const t = ctx.currentTime;
        const duration = 0.07;
        const pitchJitter = Math.random() * 50;
        const master = ctx.createGain();
        master.gain.setValueAtTime(MASTER_GAIN * 1.05, t);
        master.gain.exponentialRampToValueAtTime(0.0001, t + duration);
        master.connect(ctx.destination);

        const sampleCount = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < sampleCount; i++) {
            const env = Math.exp(-i / (sampleCount * 0.12));
            samples[i] = (Math.random() * 2 - 1) * env;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const hp = ctx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 400;
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 1100 + pitchJitter;
        bp.Q.value = 1.8;
        const ng = ctx.createGain();
        ng.gain.value = 0.65;
        noise.connect(hp);
        hp.connect(bp);
        bp.connect(ng);
        ng.connect(master);
        noise.start(t);
        noise.stop(t + duration);

        const click = ctx.createOscillator();
        click.type = "triangle";
        click.frequency.setValueAtTime(220 + pitchJitter, t);
        click.frequency.exponentialRampToValueAtTime(110, t + duration * 0.7);
        const cg = ctx.createGain();
        cg.gain.setValueAtTime(0.35, t);
        cg.gain.exponentialRampToValueAtTime(0.0001, t + duration * 0.65);
        click.connect(cg);
        cg.connect(master);
        click.start(t);
        click.stop(t + duration);
    }

    /** Kitchen limestone — rock-like but a bit softer / duller. */
    playPaleRock(): void {
        const ctx = getAudioContext();
        if (!ctx) return;

        const t = ctx.currentTime;
        const duration = 0.08;
        const pitchJitter = Math.random() * 35;
        const master = ctx.createGain();
        master.gain.setValueAtTime(MASTER_GAIN * 0.95, t);
        master.gain.exponentialRampToValueAtTime(0.0001, t + duration);
        master.connect(ctx.destination);

        const sampleCount = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < sampleCount; i++) {
            const env = Math.exp(-i / (sampleCount * 0.16));
            samples[i] = (Math.random() * 2 - 1) * env;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 780 + pitchJitter;
        bp.Q.value = 1.3;
        const ng = ctx.createGain();
        ng.gain.value = 0.55;
        noise.connect(bp);
        bp.connect(ng);
        ng.connect(master);
        noise.start(t);
        noise.stop(t + duration);

        const tap = ctx.createOscillator();
        tap.type = "sine";
        tap.frequency.setValueAtTime(160 + pitchJitter, t);
        tap.frequency.exponentialRampToValueAtTime(85, t + duration * 0.75);
        const tg = ctx.createGain();
        tg.gain.setValueAtTime(0.32, t);
        tg.gain.exponentialRampToValueAtTime(0.0001, t + duration * 0.7);
        tap.connect(tg);
        tg.connect(master);
        tap.start(t);
        tap.stop(t + duration);
    }

    /** Old attic boards — wood tap plus a short squeaky creak. */
    playAtticWood(): void {
        const ctx = getAudioContext();
        if (!ctx) return;

        const t = ctx.currentTime;
        const duration = 0.16;
        const pitchJitter = Math.random() * 30;
        const master = ctx.createGain();
        master.gain.setValueAtTime(MASTER_GAIN * 1.05, t);
        master.gain.exponentialRampToValueAtTime(0.0001, t + duration);
        master.connect(ctx.destination);

        // Board tap
        const sampleCount = Math.floor(ctx.sampleRate * 0.08);
        const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < sampleCount; i++) {
            const env = Math.exp(-i / (sampleCount * 0.22));
            samples[i] = (Math.random() * 2 - 1) * env;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 520 + pitchJitter;
        lp.Q.value = 0.8;
        const ng = ctx.createGain();
        ng.gain.value = 0.7;
        noise.connect(lp);
        lp.connect(ng);
        ng.connect(master);
        noise.start(t);
        noise.stop(t + 0.08);

        const thump = ctx.createOscillator();
        thump.type = "sine";
        thump.frequency.setValueAtTime(85 + pitchJitter * 0.5, t);
        thump.frequency.exponentialRampToValueAtTime(48, t + 0.07);
        const tg = ctx.createGain();
        tg.gain.setValueAtTime(0.4, t);
        tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
        thump.connect(tg);
        tg.connect(master);
        thump.start(t);
        thump.stop(t + 0.09);

        // Squeaky creak — occasional stronger, always a little
        const squeakAmt = 0.55 + Math.random() * 0.45;
        const squeak = ctx.createOscillator();
        squeak.type = "sawtooth";
        const squeakStart = 420 + Math.random() * 180;
        squeak.frequency.setValueAtTime(squeakStart, t + 0.015);
        squeak.frequency.exponentialRampToValueAtTime(squeakStart * 0.72, t + 0.12);

        const squeakFilter = ctx.createBiquadFilter();
        squeakFilter.type = "bandpass";
        squeakFilter.frequency.value = squeakStart;
        squeakFilter.Q.value = 6;

        const sg = ctx.createGain();
        sg.gain.setValueAtTime(0.0001, t + 0.015);
        sg.gain.linearRampToValueAtTime(0.12 * squeakAmt, t + 0.03);
        sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);

        squeak.connect(squeakFilter);
        squeakFilter.connect(sg);
        sg.connect(master);
        squeak.start(t + 0.015);
        squeak.stop(t + 0.15);
    }

    playSquish(): void {
        const ctx = getAudioContext();
        if (!ctx) return;

        const t = ctx.currentTime;
        const duration = 0.2;
        const pitchJitter = Math.random() * 25;

        const master = ctx.createGain();
        master.gain.setValueAtTime(MASTER_GAIN * 0.95, t);
        master.gain.exponentialRampToValueAtTime(0.0001, t + duration);
        master.connect(ctx.destination);

        const sampleCount = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < sampleCount; i++) {
            const env = Math.exp(-i / (sampleCount * 0.35));
            samples[i] = (Math.random() * 2 - 1) * env;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 140 + pitchJitter;
        filter.Q.value = 0.5;

        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.55;

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(master);
        noise.start(t);
        noise.stop(t + duration);

        const squelch = ctx.createOscillator();
        squelch.type = "sine";
        squelch.frequency.setValueAtTime(95 + pitchJitter, t);
        squelch.frequency.exponentialRampToValueAtTime(38, t + duration * 0.95);

        const squelchGain = ctx.createGain();
        squelchGain.gain.setValueAtTime(0.001, t);
        squelchGain.gain.linearRampToValueAtTime(0.42, t + 0.012);
        squelchGain.gain.exponentialRampToValueAtTime(0.0001, t + duration * 0.85);

        squelch.connect(squelchGain);
        squelchGain.connect(master);
        squelch.start(t);
        squelch.stop(t + duration);

        const wet = ctx.createOscillator();
        wet.type = "sine";
        wet.frequency.setValueAtTime(72 + pitchJitter * 0.6, t + 0.018);
        wet.frequency.exponentialRampToValueAtTime(32, t + duration);

        const wetGain = ctx.createGain();
        wetGain.gain.setValueAtTime(0.001, t + 0.018);
        wetGain.gain.linearRampToValueAtTime(0.22, t + 0.03);
        wetGain.gain.exponentialRampToValueAtTime(0.0001, t + duration * 0.9);

        wet.connect(wetGain);
        wetGain.connect(master);
        wet.start(t + 0.018);
        wet.stop(t + duration);
    }

    playGlassCrackle(): void {
        const ctx = getAudioContext();
        if (!ctx) return;

        const t = ctx.currentTime;
        const master = ctx.createGain();
        master.gain.setValueAtTime(MASTER_GAIN * 1.1, t);
        master.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
        master.connect(ctx.destination);

        const burstCount = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < burstCount; i++) {
            const start = t + i * 0.012 + Math.random() * 0.01;
            const duration = 0.02 + Math.random() * 0.03;
            const sampleCount = Math.floor(ctx.sampleRate * duration);
            const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
            const samples = buffer.getChannelData(0);
            for (let s = 0; s < sampleCount; s++) {
                const env = Math.exp(-s / (sampleCount * 0.15));
                samples[s] = (Math.random() * 2 - 1) * env;
            }

            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = ctx.createBiquadFilter();
            filter.type = "bandpass";
            filter.frequency.value = 1800 + Math.random() * 2200;
            filter.Q.value = 1.4 + Math.random() * 0.8;

            const gain = ctx.createGain();
            gain.gain.value = 0.35 + Math.random() * 0.2;

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(master);
            noise.start(start);
            noise.stop(start + duration);
        }

        const ting = ctx.createOscillator();
        ting.type = "sine";
        ting.frequency.setValueAtTime(2400 + Math.random() * 800, t + 0.02);
        const tingGain = ctx.createGain();
        tingGain.gain.setValueAtTime(0.04, t + 0.02);
        tingGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
        ting.connect(tingGain);
        tingGain.connect(master);
        ting.start(t + 0.02);
        ting.stop(t + 0.09);
    }
}

export const footstepSounds = new FootstepSounds();
