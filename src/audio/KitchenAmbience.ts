import { getAudioContext } from "./audioContext";
import { isMuteSounds } from "../engine/Settings";
import type { Room } from "../world/Room";

const LOOP_SECONDS = 2.5;
const BED_GAIN = 0.018;
const HISS_BUS_GAIN = 0.07;

/** True if the room has kitchen stove interactables. */
export function roomHasKitchenStove(room: Room): boolean {
    return room.interactables.some(
        (obj) => obj.id === "kitchen_stove" || obj.spriteName === "kitchen_stove"
    );
}

/**
 * Soft pan sizzle in rooms with kitchen stoves, plus louder hiss bursts
 * on a ~2–3s cadence (aligned with pan-flip timing).
 */
export class KitchenAmbience {
    private activeRoomId: string | null = null;
    private sources: AudioBufferSourceNode[] = [];
    private hissTimeout: ReturnType<typeof setTimeout> | null = null;
    private pendingTimeouts: ReturnType<typeof setTimeout>[] = [];
    private nodes: {
        bedMaster: GainNode;
        hissMaster: GainNode;
        filter: BiquadFilterNode;
        lfo: OscillatorNode;
        lfoGain: GainNode;
    } | null = null;

    syncForRoom(room: Room): void {
        if (isMuteSounds()) {
            this.stop();
            return;
        }

        const wants = roomHasKitchenStove(room);
        if (wants && this.activeRoomId === room.id) return;
        if (!wants) {
            this.stop();
            return;
        }

        this.stop();
        this.activeRoomId = room.id;
        this.start();
    }

    stop(): void {
        this.activeRoomId = null;
        for (const id of this.pendingTimeouts) {
            clearTimeout(id);
        }
        this.pendingTimeouts = [];
        if (this.hissTimeout !== null) {
            clearTimeout(this.hissTimeout);
            this.hissTimeout = null;
        }
        for (const src of this.sources) {
            try {
                src.stop();
            } catch {
                /* already stopped */
            }
        }
        this.sources = [];
        if (this.nodes) {
            try {
                this.nodes.lfo.stop();
            } catch {
                /* already stopped */
            }
            this.nodes = null;
        }
    }

    private queueTimeout(fn: () => void, ms: number): void {
        const id = setTimeout(() => {
            this.pendingTimeouts = this.pendingTimeouts.filter((t) => t !== id);
            fn();
        }, ms);
        this.pendingTimeouts.push(id);
    }

    private start(): void {
        const ctx = getAudioContext();
        if (!ctx) {
            this.activeRoomId = null;
            return;
        }

        const t = ctx.currentTime;

        const bedMaster = ctx.createGain();
        bedMaster.gain.value = BED_GAIN;

        const hissMaster = ctx.createGain();
        hissMaster.gain.value = HISS_BUS_GAIN;

        // Bright band for continuous sizzle
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 4200;
        filter.Q.value = 0.55;

        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = 0.18;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 400;
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start(t);

        const buffer = this.createSizzleNoiseBuffer(ctx, LOOP_SECONDS);
        const loop = ctx.createBufferSource();
        loop.buffer = buffer;
        loop.loop = true;
        loop.connect(filter);
        filter.connect(bedMaster);
        bedMaster.connect(ctx.destination);
        hissMaster.connect(ctx.destination);
        loop.start(t);
        this.sources.push(loop);

        this.nodes = { bedMaster, hissMaster, filter, lfo, lfoGain };

        this.queueTimeout(() => this.playHiss(1), 200);
        this.scheduleHiss();
    }

    /** Louder pan-flip hisses every ~2–3 seconds. */
    private scheduleHiss(): void {
        if (this.activeRoomId === null) return;
        const delay = 2000 + Math.random() * 1100;
        this.hissTimeout = setTimeout(() => {
            this.hissTimeout = null;
            if (this.activeRoomId === null) return;

            this.playHiss();
            // Second pan on another burner, slightly offset
            if (Math.random() < 0.65) {
                this.queueTimeout(() => this.playHiss(0.75), 180 + Math.random() * 280);
            }

            this.scheduleHiss();
        }, delay);
        this.pendingTimeouts.push(this.hissTimeout);
    }

    private createSizzleNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
        const length = Math.floor(ctx.sampleRate * seconds);
        const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
            // White-ish noise with slight high-end emphasis via sample shaping
            const n = Math.random() * 2 - 1;
            data[i] = n * (0.55 + 0.45 * Math.abs(n));
        }
        return buffer;
    }

    private playHiss(volumeScale = 1): void {
        if (this.activeRoomId === null) return;
        const ctx = getAudioContext();
        if (!ctx || !this.nodes) return;

        const t = ctx.currentTime;
        const dur = 0.22 + Math.random() * 0.28;
        const peak = (0.55 + Math.random() * 0.4) * volumeScale;
        const out = this.nodes.hissMaster;

        // Main steam hiss
        this.playHissLayer(ctx, out, t, dur, peak, 3800 + Math.random() * 1800, 0.7);
        // Brighter spit
        this.playHissLayer(ctx, out, t + 0.02, dur * 0.65, peak * 0.45, 6200 + Math.random() * 1600, 1.1);
        // Soft lower fry undercurrent
        if (Math.random() > 0.35) {
            this.playHissLayer(ctx, out, t, dur * 1.1, peak * 0.25, 1800 + Math.random() * 800, 0.5);
        }
    }

    private playHissLayer(
        ctx: AudioContext,
        dest: GainNode,
        t: number,
        dur: number,
        peak: number,
        centerHz: number,
        q: number
    ): void {
        const sampleCount = Math.max(32, Math.floor(ctx.sampleRate * dur));
        const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < sampleCount; i++) {
            const env = Math.sin((i / sampleCount) * Math.PI);
            samples[i] = (Math.random() * 2 - 1) * env;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = centerHz;
        bp.Q.value = q;

        const hp = ctx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 1200;

        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(peak, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

        noise.connect(hp);
        hp.connect(bp);
        bp.connect(g);
        g.connect(dest);
        noise.start(t);
        noise.stop(t + dur + 0.02);
    }
}

export const kitchenAmbience = new KitchenAmbience();
