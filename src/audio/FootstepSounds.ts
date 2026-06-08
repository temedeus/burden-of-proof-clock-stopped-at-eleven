import { getAudioContext } from "./audioContext";

const WALK_STEP_FPS = 8;
/** Audible but still softer than typical SFX */
const MASTER_GAIN = 0.14;

/**
 * Short procedural foot taps (filtered noise + soft thump) via Web Audio API.
 */
export class FootstepSounds {
    private lastFrame = -1;

    /** Call each frame while the player may be walking */
    updateWalkAnim(animTime: number, isMoving: boolean): void {
        if (!isMoving) {
            this.lastFrame = -1;
            return;
        }
        const frame = Math.floor(animTime * WALK_STEP_FPS) % 2;
        if (frame === this.lastFrame) return;
        this.lastFrame = frame;
        this.playStep();
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
}

export const footstepSounds = new FootstepSounds();
