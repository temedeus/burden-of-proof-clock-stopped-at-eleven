import { createCrushedNoise, getAudioContext, getSfxOutput } from "./audioContext";

/** Door effects — Web Audio synthesis, no samples. */
export class DoorSounds {
    /** Handle tried on a locked door: latch clacks against the bolt, door thumps in its frame. */
    playLockedRattle(): void {
        const ctx = getAudioContext();
        if (!ctx) return;
        const t = ctx.currentTime;
        const master = ctx.createGain();
        master.gain.setValueAtTime(0.22, t);
        master.connect(getSfxOutput(ctx));

        const jiggles = [0, 0.11, 0.21, 0.36];
        jiggles.forEach((at, i) => {
            const start = t + at + Math.random() * 0.015;
            this.latchClack(ctx, master, start, i === jiggles.length - 1 ? 1 : 0.7);
            this.frameThump(ctx, master, start + 0.008, i === jiggles.length - 1 ? 1 : 0.55);
        });
    }

    /** Short bright metal tick of the latch hitting the strike plate. */
    private latchClack(ctx: AudioContext, out: AudioNode, start: number, level: number): void {
        const noise = ctx.createBufferSource();
        noise.buffer = createCrushedNoise(ctx, 0.05, 0.012);
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 2800 + Math.random() * 600;
        bp.Q.value = 3;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.9 * level, start);
        g.gain.exponentialRampToValueAtTime(0.0001, start + 0.05);
        noise.connect(bp).connect(g).connect(out);
        noise.start(start);
        noise.stop(start + 0.06);
    }

    /** Low wooden knock of the door shifting against its frame. */
    private frameThump(ctx: AudioContext, out: AudioNode, start: number, level: number): void {
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(150, start);
        osc.frequency.exponentialRampToValueAtTime(70, start + 0.09);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, start);
        g.gain.linearRampToValueAtTime(0.8 * level, start + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, start + 0.11);
        osc.connect(g).connect(out);
        osc.start(start);
        osc.stop(start + 0.13);
    }
}

export const doorSounds = new DoorSounds();
