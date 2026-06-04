import { getAudioContext } from "./audioContext";
import { isMuteSounds } from "../engine/Settings";
import type { Room } from "../world/Room";

const LOOP_SECONDS = 3;
const BED_GAIN = 0.01;
/** Crackles use their own bus so they read over the quiet bed */
const CRACKLE_BUS_GAIN = 0.09;

/** True if room layout includes a fireplace interactable (follows level data). */
export function roomHasFireplace(room: Room): boolean {
    return room.interactables.some(
        (obj) => obj.id === "fireplace" || obj.spriteName === "fireplace"
    );
}

/**
 * Subtle looping fireplace crackle per room — starts/stops when entering/leaving.
 */
export class FireplaceAmbience {
    private activeRoomId: string | null = null;
    private sources: AudioBufferSourceNode[] = [];
    private crackleTimeout: ReturnType<typeof setTimeout> | null = null;
    private pendingTimeouts: ReturnType<typeof setTimeout>[] = [];
    private nodes: {
        bedMaster: GainNode;
        crackleMaster: GainNode;
        filter: BiquadFilterNode;
        lfo: OscillatorNode;
        lfoGain: GainNode;
    } | null = null;

    /** Call whenever `currentRoom` changes (or mute toggles). */
    syncForRoom(room: Room): void {
        if (isMuteSounds()) {
            this.stop();
            return;
        }

        const wants = roomHasFireplace(room);
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
        if (this.crackleTimeout !== null) {
            clearTimeout(this.crackleTimeout);
            this.crackleTimeout = null;
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

        const crackleMaster = ctx.createGain();
        crackleMaster.gain.value = CRACKLE_BUS_GAIN;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 480;
        filter.Q.value = 0.35;

        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = 0.12;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 60;
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start(t);

        const buffer = this.createBrownNoiseBuffer(ctx, LOOP_SECONDS);
        const loop = ctx.createBufferSource();
        loop.buffer = buffer;
        loop.loop = true;
        loop.connect(filter);
        filter.connect(bedMaster);
        bedMaster.connect(ctx.destination);
        crackleMaster.connect(ctx.destination);
        loop.start(t);
        this.sources.push(loop);

        this.nodes = { bedMaster, crackleMaster, filter, lfo, lfoGain };

        this.queueTimeout(() => this.playCrackle(1), 120);
        this.scheduleCrackle();
    }

    /** Irregular random crackles (not a steady tick). */
    private scheduleCrackle(): void {
        if (this.activeRoomId === null) return;
        const delay = 280 + Math.random() * 1100;
        this.crackleTimeout = setTimeout(() => {
            this.crackleTimeout = null;
            if (this.activeRoomId === null) return;

            this.playCrackle();
            if (Math.random() < 0.55) {
                this.queueTimeout(() => this.playCrackle(0.9), 25 + Math.random() * 70);
            }
            if (Math.random() < 0.25) {
                this.queueTimeout(() => this.playCrackle(0.75), 90 + Math.random() * 120);
            }
            if (Math.random() < 0.15) {
                this.queueTimeout(() => this.playCrackle(0.6), 180 + Math.random() * 200);
            }

            this.scheduleCrackle();
        }, delay);
        this.pendingTimeouts.push(this.crackleTimeout);
    }

    private createBrownNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
        const length = Math.floor(ctx.sampleRate * seconds);
        const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let last = 0;
        for (let i = 0; i < length; i++) {
            last = (last + (Math.random() * 2 - 1) * 0.2) * 0.98;
            data[i] = last;
        }
        return buffer;
    }

    private playCrackle(volumeScale = 1): void {
        if (this.activeRoomId === null) return;
        const ctx = getAudioContext();
        if (!ctx || !this.nodes) return;

        const t = ctx.currentTime;
        const dur = 0.04 + Math.random() * 0.12;
        const out = this.nodes.crackleMaster;
        const peak = (0.45 + Math.random() * 0.45) * volumeScale;

        this.playCrackleLayer(ctx, out, t, dur, peak, 1200 + Math.random() * 1400, 1.2);
        if (Math.random() > 0.35) {
            this.playCrackleLayer(ctx, out, t, dur * 0.7, peak * 0.55, 2800 + Math.random() * 2000, 0.8);
        }
        if (Math.random() > 0.6) {
            const clickDur = 0.012 + Math.random() * 0.02;
            this.playCrackleLayer(ctx, out, t, clickDur, peak * 0.7, 3500 + Math.random() * 1500, 2.5);
        }
    }

    private playCrackleLayer(
        ctx: AudioContext,
        dest: GainNode,
        t: number,
        dur: number,
        peak: number,
        centerHz: number,
        q: number
    ): void {
        const sampleCount = Math.max(8, Math.floor(ctx.sampleRate * dur));
        const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < sampleCount; i++) {
            const env = Math.exp(-i / (sampleCount * 0.22));
            samples[i] = (Math.random() * 2 - 1) * env;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const popFilter = ctx.createBiquadFilter();
        popFilter.type = "bandpass";
        popFilter.frequency.value = centerHz;
        popFilter.Q.value = q;

        const popGain = ctx.createGain();
        popGain.gain.setValueAtTime(0.0001, t);
        popGain.gain.linearRampToValueAtTime(peak, t + 0.004);
        popGain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

        noise.connect(popFilter);
        popFilter.connect(popGain);
        popGain.connect(dest);
        noise.start(t);
        noise.stop(t + dur + 0.01);
    }
}

export const fireplaceAmbience = new FireplaceAmbience();
