import { getAudioContext } from "./audioContext";

const WALK_STEP_FPS = 8;
/** Audible but still softer than typical SFX */
const MASTER_GAIN = 0.14;

export type FootstepSurface = "default" | "glass";

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
        if (surface === "glass") {
            this.playGlassCrackle();
        } else {
            this.playStep();
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

        // Soft carpet / wood tap — band-limited noise burst
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

        // Body thump — very quiet sine drop
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

        // Tiny shard tinkle
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
