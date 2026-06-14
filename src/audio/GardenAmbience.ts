import { getAudioContext } from "./audioContext";
import { isMuteSounds } from "../engine/Settings";
import type { Room } from "../world/Room";

const FOUNTAIN_LOOP_SEC = 4;
const FOUNTAIN_BED_GAIN = 0.014;
const FOUNTAIN_SPLASH_BUS_GAIN = 0.06;
const BIRD_GAIN = 0.085;

const OUTDOOR_ROOM_IDS = new Set(["garden", "courtyard", "stable"]);

export function roomHasFountain(room: Room): boolean {
    return room.interactables.some(
        (obj) => obj.id === "fountain" || obj.spriteName === "fountain"
    );
}

export function roomHasOutdoorBirds(room: Room): boolean {
    return OUTDOOR_ROOM_IDS.has(room.id);
}

/**
 * Garden outdoor ambience: fountain trickle near fountains, random bird chirps outdoors.
 */
export class GardenAmbience {
    private activeRoomId: string | null = null;
    private fountainActive = false;
    private birdsActive = false;
    private sources: AudioBufferSourceNode[] = [];
    private pendingTimeouts: ReturnType<typeof setTimeout>[] = [];
    private fountainTimeout: ReturnType<typeof setTimeout> | null = null;
    private birdTimeout: ReturnType<typeof setTimeout> | null = null;
    private fountainNodes: {
        bedMaster: GainNode;
        splashMaster: GainNode;
        filter: BiquadFilterNode;
        lfo: OscillatorNode;
        lfoGain: GainNode;
    } | null = null;

    syncForRoom(room: Room): void {
        if (isMuteSounds()) {
            this.stop();
            return;
        }

        const wantsFountain = roomHasFountain(room);
        const wantsBirds = roomHasOutdoorBirds(room);
        if (!wantsFountain && !wantsBirds) {
            this.stop();
            return;
        }

        if (
            this.activeRoomId === room.id &&
            this.fountainActive === wantsFountain &&
            this.birdsActive === wantsBirds
        ) {
            return;
        }

        this.stop();
        this.activeRoomId = room.id;
        this.fountainActive = wantsFountain;
        this.birdsActive = wantsBirds;

        if (wantsFountain) this.startFountain();
        if (wantsBirds) this.scheduleBird();
    }

    stop(): void {
        this.activeRoomId = null;
        this.fountainActive = false;
        this.birdsActive = false;
        for (const id of this.pendingTimeouts) {
            clearTimeout(id);
        }
        this.pendingTimeouts = [];
        if (this.fountainTimeout !== null) {
            clearTimeout(this.fountainTimeout);
            this.fountainTimeout = null;
        }
        if (this.birdTimeout !== null) {
            clearTimeout(this.birdTimeout);
            this.birdTimeout = null;
        }
        for (const src of this.sources) {
            try {
                src.stop();
            } catch {
                /* already stopped */
            }
        }
        this.sources = [];
        if (this.fountainNodes) {
            try {
                this.fountainNodes.lfo.stop();
            } catch {
                /* already stopped */
            }
            this.fountainNodes = null;
        }
    }

    private queueTimeout(fn: () => void, ms: number): void {
        const id = setTimeout(() => {
            this.pendingTimeouts = this.pendingTimeouts.filter((t) => t !== id);
            fn();
        }, ms);
        this.pendingTimeouts.push(id);
    }

    private startFountain(): void {
        const ctx = getAudioContext();
        if (!ctx) {
            this.activeRoomId = null;
            return;
        }

        const t = ctx.currentTime;
        const bedMaster = ctx.createGain();
        bedMaster.gain.value = FOUNTAIN_BED_GAIN;

        const splashMaster = ctx.createGain();
        splashMaster.gain.value = FOUNTAIN_SPLASH_BUS_GAIN;

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 520;
        filter.Q.value = 0.4;

        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = 0.18;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 140;
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start(t);

        const buffer = this.createWaterNoiseBuffer(ctx, FOUNTAIN_LOOP_SEC);
        const loop = ctx.createBufferSource();
        loop.buffer = buffer;
        loop.loop = true;
        loop.connect(filter);
        filter.connect(bedMaster);
        bedMaster.connect(ctx.destination);
        splashMaster.connect(ctx.destination);
        loop.start(t);
        this.sources.push(loop);

        this.fountainNodes = { bedMaster, splashMaster, filter, lfo, lfoGain };
        this.queueTimeout(() => this.playSplash(0.85), 200);
        this.scheduleSplash();
    }

    private scheduleSplash(): void {
        if (!this.fountainActive || this.activeRoomId === null) return;
        const delay = 400 + Math.random() * 1400;
        this.fountainTimeout = setTimeout(() => {
            this.fountainTimeout = null;
            if (!this.fountainActive || this.activeRoomId === null) return;
            this.playSplash();
            if (Math.random() < 0.35) {
                this.queueTimeout(() => this.playSplash(0.7), 40 + Math.random() * 80);
            }
            this.scheduleSplash();
        }, delay);
        this.pendingTimeouts.push(this.fountainTimeout);
    }

    private scheduleBird(): void {
        if (!this.birdsActive || this.activeRoomId === null) return;
        const delay = 1200 + Math.random() * 5000;
        this.birdTimeout = setTimeout(() => {
            this.birdTimeout = null;
            if (!this.birdsActive || this.activeRoomId === null) return;
            this.playBirdChirp();
            if (Math.random() < 0.4) {
                this.queueTimeout(() => this.playBirdChirp(0.85), 120 + Math.random() * 280);
            }
            this.scheduleBird();
        }, delay);
        this.pendingTimeouts.push(this.birdTimeout);
    }

    private createWaterNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
        const length = Math.floor(ctx.sampleRate * seconds);
        const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let last = 0;
        for (let i = 0; i < length; i++) {
            last = (last + (Math.random() * 2 - 1) * 0.15) * 0.992;
            data[i] = last * (0.7 + 0.3 * Math.sin((i / length) * Math.PI * 8));
        }
        return buffer;
    }

    private playSplash(volumeScale = 1): void {
        if (!this.fountainActive || this.activeRoomId === null) return;
        const ctx = getAudioContext();
        if (!ctx || !this.fountainNodes) return;

        const t = ctx.currentTime;
        const dur = 0.05 + Math.random() * 0.1;
        const peak = (0.25 + Math.random() * 0.35) * volumeScale;
        const out = this.fountainNodes.splashMaster;

        this.playNoiseBurst(ctx, out, t, dur, peak, 900 + Math.random() * 600, 0.9);
        if (Math.random() > 0.5) {
            this.playNoiseBurst(ctx, out, t, dur * 0.6, peak * 0.5, 1800 + Math.random() * 800, 1.2);
        }
    }

    private playNoiseBurst(
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
            const env = Math.exp(-i / (sampleCount * 0.25));
            samples[i] = (Math.random() * 2 - 1) * env;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const bpf = ctx.createBiquadFilter();
        bpf.type = "bandpass";
        bpf.frequency.value = centerHz;
        bpf.Q.value = q;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(peak, t + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

        noise.connect(bpf);
        bpf.connect(gain);
        gain.connect(dest);
        noise.start(t);
        noise.stop(t + dur + 0.02);
    }

    private playBirdChirp(volumeScale = 1): void {
        if (!this.birdsActive || this.activeRoomId === null) return;
        const ctx = getAudioContext();
        if (!ctx) return;

        const t = ctx.currentTime;
        const noteCount = 2 + Math.floor(Math.random() * 3);
        let at = t;
        const baseHz = 1100 + Math.random() * 1000;

        const toneFilter = ctx.createBiquadFilter();
        toneFilter.type = "lowpass";
        toneFilter.frequency.value = 2100 + Math.random() * 500;
        toneFilter.Q.value = 0.45;
        toneFilter.connect(ctx.destination);

        for (let i = 0; i < noteCount; i++) {
            const osc = ctx.createOscillator();
            osc.type = "sine";
            const mult = 1 + (Math.random() - 0.5) * 0.25;
            osc.frequency.value = baseHz * mult * (i > 0 ? 1.08 + Math.random() * 0.14 : 1);

            const gain = ctx.createGain();
            const dur = 0.06 + Math.random() * 0.1;
            const attack = 0.02 + Math.random() * 0.02;
            const peak = BIRD_GAIN * volumeScale * (0.65 + Math.random() * 0.25);
            gain.gain.setValueAtTime(0.0001, at);
            gain.gain.linearRampToValueAtTime(peak, at + attack);
            gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);

            osc.connect(gain);
            gain.connect(toneFilter);
            osc.start(at);
            osc.stop(at + dur + 0.03);

            at += dur * 0.5 + 0.04 + Math.random() * 0.1;
        }
    }
}

export const gardenAmbience = new GardenAmbience();
