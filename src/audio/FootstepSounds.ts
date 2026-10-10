import { getAudioContext, getSfxOutput } from "./audioContext";

const WALK_STEP_FPS = 8;
/** Audible but still softer than typical SFX */
const MASTER_GAIN = 0.14;

/** Decaying noise with sample-hold + bit reduction — reads as a low-rate 8-bit sample. */
function fillCrushedNoise(samples: Float32Array, count: number, decay: number): void {
    let held = 0;
    for (let i = 0; i < count; i++) {
        if (i % 2 === 0) held = Math.round((Math.random() * 2 - 1) * 48) / 48;
        samples[i] = held * Math.exp(-i / (count * decay));
    }
}

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
    private foot = 0;

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

    /** Indoor floorboard step: heel strike, a short toe-down tap, and a faint room knock. */
    playStep(): void {
        const ctx = getAudioContext();
        if (!ctx) return;

        const t = ctx.currentTime;
        const duration = 0.12;
        const pitchJitter = Math.random() * 40;
        // alternate feet: left slightly lower and duller than right
        this.foot = 1 - this.foot;
        const side = this.foot === 0 ? 0.92 : 1.06;
        const vol = 0.85 + Math.random() * 0.3;

        const master = ctx.createGain();
        master.gain.setValueAtTime(MASTER_GAIN * vol, t);
        master.gain.exponentialRampToValueAtTime(0.0001, t + duration);
        master.connect(getSfxOutput(ctx));

        // Heel: low body thump
        const heel = ctx.createOscillator();
        heel.type = "sine";
        heel.frequency.setValueAtTime((120 + pitchJitter) * side, t);
        heel.frequency.exponentialRampToValueAtTime(48, t + 0.08);
        const heelGain = ctx.createGain();
        heelGain.gain.setValueAtTime(0.55, t);
        heelGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.085);
        heel.connect(heelGain);
        heelGain.connect(master);
        heel.start(t);
        heel.stop(t + 0.09);

        // Heel click: crushed noise through a woody bandpass
        const clickLen = 0.05;
        const clickCount = Math.floor(ctx.sampleRate * clickLen);
        const clickBuf = ctx.createBuffer(1, clickCount, ctx.sampleRate);
        fillCrushedNoise(clickBuf.getChannelData(0), clickCount, 0.14);
        const click = ctx.createBufferSource();
        click.buffer = clickBuf;
        const clickBp = ctx.createBiquadFilter();
        clickBp.type = "bandpass";
        clickBp.frequency.value = (900 + pitchJitter * 6) * side;
        clickBp.Q.value = 1.1;
        const clickGain = ctx.createGain();
        clickGain.gain.value = 0.55;
        click.connect(clickBp);
        clickBp.connect(clickGain);
        clickGain.connect(master);
        click.start(t);
        click.stop(t + clickLen);

        // Toe-down: softer, lower, a beat later
        const toeT = t + 0.045;
        const toeLen = 0.06;
        const toeCount = Math.floor(ctx.sampleRate * toeLen);
        const toeBuf = ctx.createBuffer(1, toeCount, ctx.sampleRate);
        fillCrushedNoise(toeBuf.getChannelData(0), toeCount, 0.25);
        const toe = ctx.createBufferSource();
        toe.buffer = toeBuf;
        const toeLp = ctx.createBiquadFilter();
        toeLp.type = "lowpass";
        toeLp.frequency.value = 520 + pitchJitter;
        const toeGain = ctx.createGain();
        toeGain.gain.value = 0.32;
        toe.connect(toeLp);
        toeLp.connect(toeGain);
        toeGain.connect(master);
        toe.start(toeT);
        toe.stop(toeT + toeLen);
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
        master.connect(getSfxOutput(ctx));

        const sampleCount = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
        const samples = buffer.getChannelData(0);
        fillCrushedNoise(samples, sampleCount, 0.45);

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
        master.connect(getSfxOutput(ctx));

        const bursts = 3 + Math.floor(Math.random() * 2);
        for (let i = 0; i < bursts; i++) {
            const start = t + i * 0.018 + Math.random() * 0.008;
            const duration = 0.025 + Math.random() * 0.03;
            const sampleCount = Math.floor(ctx.sampleRate * duration);
            const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
            const samples = buffer.getChannelData(0);
            fillCrushedNoise(samples, sampleCount, 0.18);
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
        master.connect(getSfxOutput(ctx));

        const sampleCount = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
        const samples = buffer.getChannelData(0);
        fillCrushedNoise(samples, sampleCount, 0.55);

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
        master.connect(getSfxOutput(ctx));

        const sampleCount = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
        const samples = buffer.getChannelData(0);
        fillCrushedNoise(samples, sampleCount, 0.12);
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
        master.connect(getSfxOutput(ctx));

        const sampleCount = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
        const samples = buffer.getChannelData(0);
        fillCrushedNoise(samples, sampleCount, 0.16);
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
        master.connect(getSfxOutput(ctx));

        // Board tap
        const sampleCount = Math.floor(ctx.sampleRate * 0.08);
        const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
        const samples = buffer.getChannelData(0);
        fillCrushedNoise(samples, sampleCount, 0.22);
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

    /** Wet squelch: gurgling band sweep, bubble pops and a sucking release as the foot lifts. */
    playSquish(): void {
        const ctx = getAudioContext();
        if (!ctx) return;

        const t = ctx.currentTime;
        const duration = 0.26;
        const jitter = Math.random();

        const master = ctx.createGain();
        master.gain.setValueAtTime(MASTER_GAIN * 1.5, t);
        master.gain.setValueAtTime(MASTER_GAIN * 1.5, t + 0.18);
        master.gain.exponentialRampToValueAtTime(0.0001, t + duration);
        master.connect(getSfxOutput(ctx));

        // Squelch body: crushed noise through a resonant band that sweeps down then up
        const count = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, count, ctx.sampleRate);
        const samples = buffer.getChannelData(0);
        let held = 0;
        for (let i = 0; i < count; i++) {
            if (i % 3 === 0) held = Math.round((Math.random() * 2 - 1) * 40) / 40;
            const p = i / count;
            samples[i] = held * Math.min(p * 30, 1) * Math.exp(-p * 3.2);
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.Q.value = 4.5;
        bp.frequency.setValueAtTime(900 + jitter * 200, t);
        bp.frequency.exponentialRampToValueAtTime(260, t + 0.1);
        bp.frequency.exponentialRampToValueAtTime(620 + jitter * 150, t + duration);
        const ng = ctx.createGain();
        ng.gain.value = 1.1;
        noise.connect(bp);
        bp.connect(ng);
        ng.connect(master);
        noise.start(t);
        noise.stop(t + duration);

        // Low press: the foot sinking in
        const press = ctx.createOscillator();
        press.type = "sine";
        press.frequency.setValueAtTime(110 + jitter * 20, t);
        press.frequency.exponentialRampToValueAtTime(48, t + 0.12);
        const pg = ctx.createGain();
        pg.gain.setValueAtTime(0.4, t);
        pg.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
        press.connect(pg);
        pg.connect(master);
        press.start(t);
        press.stop(t + 0.15);

        // Bubble pops: short rising chirps
        const pops = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < pops; i++) {
            const start = t + 0.03 + i * 0.04 + Math.random() * 0.025;
            const f = 220 + Math.random() * 380;
            const o = ctx.createOscillator();
            o.type = "sine";
            o.frequency.setValueAtTime(f, start);
            o.frequency.exponentialRampToValueAtTime(f * 2.1, start + 0.035);
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.0001, start);
            g.gain.linearRampToValueAtTime(0.28, start + 0.005);
            g.gain.exponentialRampToValueAtTime(0.0001, start + 0.045);
            o.connect(g);
            g.connect(master);
            o.start(start);
            o.stop(start + 0.05);
        }

        // Sucking release as the sole peels away
        const suck = ctx.createOscillator();
        suck.type = "triangle";
        suck.frequency.setValueAtTime(150, t + 0.14);
        suck.frequency.exponentialRampToValueAtTime(420, t + 0.23);
        const sg = ctx.createGain();
        sg.gain.setValueAtTime(0.0001, t + 0.14);
        sg.gain.linearRampToValueAtTime(0.14, t + 0.17);
        sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
        suck.connect(sg);
        sg.connect(master);
        suck.start(t + 0.14);
        suck.stop(t + 0.26);
    }

    playGlassCrackle(): void {
        const ctx = getAudioContext();
        if (!ctx) return;

        const t = ctx.currentTime;
        const master = ctx.createGain();
        master.gain.setValueAtTime(MASTER_GAIN * 1.1, t);
        master.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
        master.connect(getSfxOutput(ctx));

        const burstCount = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < burstCount; i++) {
            const start = t + i * 0.012 + Math.random() * 0.01;
            const duration = 0.02 + Math.random() * 0.03;
            const sampleCount = Math.floor(ctx.sampleRate * duration);
            const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
            const samples = buffer.getChannelData(0);
            fillCrushedNoise(samples, sampleCount, 0.15);

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
