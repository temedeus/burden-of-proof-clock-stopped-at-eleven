import { getAudioContext } from "./audioContext";
import { isMuteSounds } from "../engine/Settings";

const DRONE_GAIN = 0.028;
const STRING_GAIN = 0.045;
const HEART_GAIN = 0.055;
const STAB_INTERVAL_MS_MIN = 2200;
const STAB_INTERVAL_MS_MAX = 4800;

/**
 * Dissonant “psycho” tension bed while the murderer is hunting the player —
 * low drone, screeching string stabs, and a slow heartbeat.
 */
export class HuntTension {
    private running = false;
    private sources: AudioBufferSourceNode[] = [];
    private oscillators: OscillatorNode[] = [];
    private stabTimeout: ReturnType<typeof setTimeout> | null = null;
    private pendingTimeouts: ReturnType<typeof setTimeout>[] = [];
    private master: GainNode | null = null;

    /** Idempotent: start when hunting, stop otherwise (also respects mute). */
    sync(hunting: boolean): void {
        if (isMuteSounds() || !hunting) {
            this.stop();
            return;
        }
        if (this.running) return;
        this.start();
    }

    stop(): void {
        this.running = false;
        for (const id of this.pendingTimeouts) {
            clearTimeout(id);
        }
        this.pendingTimeouts = [];
        if (this.stabTimeout !== null) {
            clearTimeout(this.stabTimeout);
            this.stabTimeout = null;
        }
        for (const src of this.sources) {
            try {
                src.stop();
            } catch {
                /* already stopped */
            }
        }
        this.sources = [];
        for (const osc of this.oscillators) {
            try {
                osc.stop();
            } catch {
                /* already stopped */
            }
        }
        this.oscillators = [];
        this.master = null;
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
        if (!ctx) return;

        this.running = true;
        const t = ctx.currentTime;

        const master = ctx.createGain();
        master.gain.setValueAtTime(0.0001, t);
        master.gain.linearRampToValueAtTime(1, t + 0.6);
        master.connect(ctx.destination);
        this.master = master;

        this.startDrones(ctx, master, t);
        this.startHeartbeat(ctx, master, t);
        this.scheduleStringStab();
    }

    /** Two slightly detuned low saws + a hollow fifth for unease. */
    private startDrones(ctx: AudioContext, master: GainNode, t: number): void {
        const droneBus = ctx.createGain();
        droneBus.gain.value = DRONE_GAIN;
        droneBus.connect(master);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 220;
        filter.Q.value = 0.7;
        filter.connect(droneBus);

        const freqs = [55, 56.5, 82.5];
        for (const freq of freqs) {
            const osc = ctx.createOscillator();
            osc.type = "sawtooth";
            osc.frequency.value = freq;
            const g = ctx.createGain();
            g.gain.value = freq < 60 ? 0.55 : 0.28;
            osc.connect(g);
            g.connect(filter);
            osc.start(t);
            this.oscillators.push(osc);
        }

        // Slow filter swell
        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = 0.07;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 80;
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start(t);
        this.oscillators.push(lfo);
    }

    /** Muffled thump loop — dread pulse, not a disco beat. */
    private startHeartbeat(ctx: AudioContext, master: GainNode, t: number): void {
        const bpm = 72;
        const period = 60 / bpm;
        const len = Math.floor(ctx.sampleRate * period * 2);
        const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        const thump = (atSec: number, amp: number) => {
            const start = Math.floor(atSec * ctx.sampleRate);
            const dur = Math.floor(ctx.sampleRate * 0.12);
            for (let i = 0; i < dur && start + i < len; i++) {
                const env = Math.exp(-i / (dur * 0.22));
                const phase = (i / ctx.sampleRate) * 45 * Math.PI * 2;
                data[start + i] += Math.sin(phase) * env * amp;
            }
        };
        // Lub-dub
        thump(0.05, 1);
        thump(0.22, 0.65);
        thump(period + 0.05, 1);
        thump(period + 0.22, 0.65);

        const loop = ctx.createBufferSource();
        loop.buffer = buffer;
        loop.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 140;

        const g = ctx.createGain();
        g.gain.value = HEART_GAIN;

        loop.connect(filter);
        filter.connect(g);
        g.connect(master);
        loop.start(t);
        this.sources.push(loop);
    }

    /** High dissonant string stab — classic psycho cue. */
    private playStringStab(): void {
        if (!this.running) return;
        const ctx = getAudioContext();
        if (!ctx || !this.master) return;

        const t = ctx.currentTime;
        const bus = ctx.createGain();
        bus.gain.value = STRING_GAIN;
        bus.connect(this.master);

        // Minor-second cluster (dissonant shriek)
        const base = 880 + Math.random() * 400;
        const intervals = [0, 1, 6, 13];
        for (const semitone of intervals) {
            const osc = ctx.createOscillator();
            osc.type = "sawtooth";
            const f = base * Math.pow(2, semitone / 12);
            osc.frequency.setValueAtTime(f, t);
            osc.frequency.exponentialRampToValueAtTime(f * 0.85, t + 0.35);

            const filter = ctx.createBiquadFilter();
            filter.type = "bandpass";
            filter.frequency.setValueAtTime(f * 1.2, t);
            filter.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.3);
            filter.Q.value = 4;

            const g = ctx.createGain();
            g.gain.setValueAtTime(0.0001, t);
            g.gain.linearRampToValueAtTime(0.35 / intervals.length, t + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);

            osc.connect(filter);
            filter.connect(g);
            g.connect(bus);
            osc.start(t);
            osc.stop(t + 0.42);
        }

        // Brief noise scrape under the stab
        const nLen = Math.floor(ctx.sampleRate * 0.18);
        const nBuf = ctx.createBuffer(1, nLen, ctx.sampleRate);
        const nData = nBuf.getChannelData(0);
        for (let i = 0; i < nLen; i++) {
            nData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (nLen * 0.15));
        }
        const noise = ctx.createBufferSource();
        noise.buffer = nBuf;
        const hp = ctx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 2500;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0.12, t);
        ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        noise.connect(hp);
        hp.connect(ng);
        ng.connect(bus);
        noise.start(t);
        noise.stop(t + 0.2);
    }

    private scheduleStringStab(): void {
        if (!this.running) return;
        this.playStringStab();
        const wait =
            STAB_INTERVAL_MS_MIN +
            Math.random() * (STAB_INTERVAL_MS_MAX - STAB_INTERVAL_MS_MIN);
        this.stabTimeout = setTimeout(() => {
            this.stabTimeout = null;
            this.scheduleStringStab();
        }, wait);
    }
}

export const huntTension = new HuntTension();
