import { getAudioContext } from "./audioContext";

/**
 * Short scare SFX — pain yell and glass crash (procedural Web Audio).
 */
export class ScareSounds {
    /** Rough “Arghh!” yell — dining fire panic and attic window shove. */
    playArgh(): void {
        const ctx = getAudioContext();
        if (!ctx) return;

        const t = ctx.currentTime;
        const master = ctx.createGain();
        master.gain.setValueAtTime(0.0001, t);
        master.gain.linearRampToValueAtTime(0.22, t + 0.04);
        master.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
        master.connect(ctx.destination);

        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(280, t);
        osc.frequency.exponentialRampToValueAtTime(160, t + 0.35);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.5);

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(900, t);
        filter.frequency.exponentialRampToValueAtTime(450, t + 0.4);
        filter.Q.value = 2.2;

        const grit = ctx.createOscillator();
        grit.type = "square";
        grit.frequency.setValueAtTime(90, t);

        const gritGain = ctx.createGain();
        gritGain.gain.setValueAtTime(0.04, t);
        gritGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);

        osc.connect(filter);
        filter.connect(master);
        grit.connect(gritGain);
        gritGain.connect(master);

        osc.start(t);
        osc.stop(t + 0.55);
        grit.start(t);
        grit.stop(t + 0.4);
    }

    /** Glass pane shatter for attic window shove. */
    playWindowCrash(): void {
        const ctx = getAudioContext();
        if (!ctx) return;

        const t = ctx.currentTime;
        const master = ctx.createGain();
        master.gain.setValueAtTime(0.2, t);
        master.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
        master.connect(ctx.destination);

        const len = Math.floor(ctx.sampleRate * 0.35);
        const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < len; i++) {
            const env = Math.exp(-i / (len * 0.12));
            data[i] = (Math.random() * 2 - 1) * env;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const hp = ctx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 1800;
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 3200;
        bp.Q.value = 0.8;

        noise.connect(hp);
        hp.connect(bp);
        bp.connect(master);
        noise.start(t);
        noise.stop(t + 0.35);

        // Bright glass “pings”
        [2400, 3100, 4200, 5100].forEach((freq, i) => {
            const start = t + 0.02 + i * 0.03;
            const osc = ctx.createOscillator();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, start);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.7, start + 0.12);
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.0001, start);
            g.gain.linearRampToValueAtTime(0.12, start + 0.005);
            g.gain.exponentialRampToValueAtTime(0.0001, start + 0.15);
            osc.connect(g);
            g.connect(master);
            osc.start(start);
            osc.stop(start + 0.16);
        });
    }
}

export const scareSounds = new ScareSounds();
