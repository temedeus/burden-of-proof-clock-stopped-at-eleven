import { getAudioContext } from "./audioContext";
import { isMuteSounds } from "../engine/Settings";
import type { Room } from "../world/Room";

const LOOP_SECONDS = 3;
const MASTER_GAIN = 0.011;

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
    private nodes: {
        master: GainNode;
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
        this.start();
        this.activeRoomId = room.id;
    }

    stop(): void {
        this.activeRoomId = null;
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

    private start(): void {
        const ctx = getAudioContext();
        if (!ctx) return;

        const t = ctx.currentTime;

        const master = ctx.createGain();
        master.gain.value = MASTER_GAIN;

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
        filter.connect(master);
        master.connect(ctx.destination);
        loop.start(t);
        this.sources.push(loop);

        this.nodes = { master, filter, lfo, lfoGain };

        this.scheduleCrackle();
    }

    /** Irregular random crackles (not a steady tick). */
    private scheduleCrackle(): void {
        if (this.activeRoomId === null) return;
        const delay = 600 + Math.random() * 2200;
        this.crackleTimeout = setTimeout(() => {
            this.crackleTimeout = null;
            if (this.activeRoomId === null) return;

            this.playCrackle();
            if (Math.random() < 0.4) {
                setTimeout(() => this.playCrackle(0.85), 35 + Math.random() * 90);
            }
            if (Math.random() < 0.12) {
                setTimeout(() => this.playCrackle(0.7), 120 + Math.random() * 150);
            }

            this.scheduleCrackle();
        }, delay);
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
        const dur = 0.03 + Math.random() * 0.09;

        const sampleCount = Math.floor(ctx.sampleRate * dur);
        const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < sampleCount; i++) {
            const env = Math.exp(-i / (sampleCount * (0.2 + Math.random() * 0.15)));
            samples[i] = (Math.random() * 2 - 1) * env;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const popFilter = ctx.createBiquadFilter();
        popFilter.type = "bandpass";
        popFilter.frequency.value = 700 + Math.random() * 900;
        popFilter.Q.value = 0.6 + Math.random() * 0.6;

        const popGain = ctx.createGain();
        const peak = (0.035 + Math.random() * 0.04) * volumeScale;
        popGain.gain.setValueAtTime(peak, t);
        popGain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

        noise.connect(popFilter);
        popFilter.connect(popGain);
        popGain.connect(this.nodes.master);
        noise.start(t);
        noise.stop(t + dur);
    }
}

export const fireplaceAmbience = new FireplaceAmbience();
