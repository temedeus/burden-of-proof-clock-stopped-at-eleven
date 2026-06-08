import { getAudioContext } from "./audioContext";

export type VoiceGender = "male" | "female";

const FEMALE_NPC_IDS = new Set(["maid", "baroness"]);
const FEMALE_SPRITES = new Set(["maid", "baroness", "npc_female", "female_detective"]);

const VOICE = {
    male: { f0Hz: 95, f0RangeHz: 35, gain: 0.09 },
    female: { f0Hz: 175, f0RangeHz: 55, gain: 0.085 }
} as const;

/** Hard cap so mumble never runs through the whole dialog open state */
const MAX_TOTAL_MS = 2800;
const MAX_SYLLABLES = 36;

export function inferVoiceGender(npcId: string, spriteName?: string): VoiceGender {
    if (FEMALE_NPC_IDS.has(npcId)) return "female";
    if (spriteName && FEMALE_SPRITES.has(spriteName)) return "female";
    if (npcId === "worker_boy") return "female";
    return "male";
}

/** Strip `"Mrs. Clarke: "` prefix so audio follows the spoken line only */
export function extractSpokenLine(description: string, speaker?: string): string {
    if (speaker) {
        const prefix = `${speaker}: `;
        if (description.startsWith(prefix)) return description.slice(prefix.length);
    }
    const colon = description.indexOf(": ");
    return colon >= 0 ? description.slice(colon + 2) : description;
}

function estimateSyllables(word: string): number {
    const w = word.toLowerCase().replace(/[^a-z']/g, "");
    if (!w) return 0;
    const groups = w.match(/[aeiouy]+/g);
    let n = groups ? groups.length : 1;
    if (w.length > 3 && w.endsWith("e") && n > 1) n--;
    if (w.length > 5 && w.endsWith("le") && n > 2) n--;
    return Math.max(1, Math.min(n, 5));
}

/**
 * Build ms gaps between mumble syllables from text rhythm (words + punctuation).
 */
export function buildMumbleSchedule(text: string): number[] {
    const tokens = text.match(/[\w']+|[.,!?;—–-]+/g) ?? [];
    const gaps: number[] = [];

    for (const token of tokens) {
        if (/^[.,!?;—–-]+$/.test(token)) {
            const pause = /[.!?]/.test(token) ? 160 : /[;:]/.test(token) ? 100 : 70;
            if (gaps.length > 0) gaps[gaps.length - 1] += pause;
            continue;
        }

        const syllables = estimateSyllables(token);
        for (let i = 0; i < syllables; i++) {
            const base = 48 + Math.random() * 32;
            const stress = i === 0 ? 12 : 0;
            gaps.push(base + stress);
        }
        gaps.push(28 + Math.random() * 22);
    }

    if (gaps.length > 0) gaps.pop();

    let schedule = gaps;
    if (schedule.length > MAX_SYLLABLES) {
        const keep = MAX_SYLLABLES;
        const step = schedule.length / keep;
        schedule = Array.from({ length: keep }, (_, i) => schedule[Math.floor(i * step)] ?? 60);
    }

    const total = schedule.reduce((a, b) => a + b, 0);
    if (total > MAX_TOTAL_MS && total > 0) {
        const scale = MAX_TOTAL_MS / total;
        schedule = schedule.map((g) => g * scale);
    }

    return schedule;
}

/**
 * One-shot mumble that follows the dialog line, then stops.
 */
export class TalkSounds {
    private active = false;
    private gender: VoiceGender = "male";
    private timeouts: ReturnType<typeof setTimeout>[] = [];

    startDialogue(gender: VoiceGender, spokenLine: string): void {
        this.stopDialogue();
        const line = spokenLine.trim();
        if (!line) return;

        this.active = true;
        this.gender = gender;

        const gaps = buildMumbleSchedule(line);
        if (gaps.length === 0) {
            this.active = false;
            return;
        }

        let elapsed = 0;
        this.playSyllable(0);

        for (let i = 0; i < gaps.length; i++) {
            elapsed += gaps[i];
            const idx = i + 1;
            const id = setTimeout(() => {
                if (!this.active) return;
                this.playSyllable(idx);
                if (idx === gaps.length) {
                    this.active = false;
                }
            }, elapsed);
            this.timeouts.push(id);
        }
    }

    stopDialogue(): void {
        this.active = false;
        for (const id of this.timeouts) clearTimeout(id);
        this.timeouts = [];
    }

    private playSyllable(index: number): void {
        const ctx = getAudioContext();
        if (!ctx) return;

        const profile = VOICE[this.gender];
        const t = ctx.currentTime;
        const duration = 0.055 + Math.random() * 0.05;
        const pitchSlide = (index % 5) * 0.04;
        const f0 = profile.f0Hz + Math.random() * profile.f0RangeHz * (1 + pitchSlide * 0.15);
        const openVowel = Math.random() > 0.35;

        const master = ctx.createGain();
        master.gain.setValueAtTime(0.0001, t);
        master.gain.linearRampToValueAtTime(profile.gain, t + 0.02);
        master.gain.exponentialRampToValueAtTime(0.0001, t + duration);
        master.connect(ctx.destination);

        const voiceBus = ctx.createGain();
        voiceBus.gain.value = openVowel ? 0.65 : 0.2;
        voiceBus.connect(master);

        if (openVowel) {
            this.addFormantVoice(ctx, voiceBus, t, duration, f0);
        }
        this.addBreathNoise(ctx, master, t, duration, f0, openVowel ? 0.18 : 0.38);
    }

    private addFormantVoice(
        ctx: AudioContext,
        dest: GainNode,
        t: number,
        duration: number,
        f0: number
    ): void {
        const f1 = f0 * (2.6 + Math.random() * 0.9);
        const f2End = f0 * (5.5 + Math.random() * 2.5);
        const f2Start = f2End * (0.88 + Math.random() * 0.12);

        const mix = ctx.createGain();
        mix.gain.value = 0.45;

        const voiceFilter = ctx.createBiquadFilter();
        voiceFilter.type = "bandpass";
        voiceFilter.frequency.value = 700 + f0 * 2.2;
        voiceFilter.Q.value = 0.55;

        const fund = ctx.createOscillator();
        fund.type = "sawtooth";
        fund.frequency.setValueAtTime(f0, t);
        fund.frequency.linearRampToValueAtTime(f0 * 0.94, t + duration);

        const formant1 = ctx.createOscillator();
        formant1.type = "sine";
        formant1.frequency.value = f1;

        const formant2 = ctx.createOscillator();
        formant2.type = "sine";
        formant2.frequency.setValueAtTime(f2Start, t);
        formant2.frequency.linearRampToValueAtTime(f2End, t + duration);

        fund.connect(mix);
        formant1.connect(mix);
        formant2.connect(mix);
        mix.connect(voiceFilter);
        voiceFilter.connect(dest);

        fund.start(t);
        fund.stop(t + duration);
        formant1.start(t);
        formant1.stop(t + duration);
        formant2.start(t);
        formant2.stop(t + duration);
    }

    private addBreathNoise(
        ctx: AudioContext,
        dest: GainNode,
        t: number,
        duration: number,
        f0: number,
        level: number
    ): void {
        const sampleCount = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < sampleCount; i++) {
            const phase = i / sampleCount;
            const env = Math.min(phase * 10, 1) * Math.min((1 - phase) * 8, 1);
            samples[i] = (Math.random() * 2 - 1) * env;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 1000 + f0 * 3;
        filter.Q.value = 0.45;

        const noiseGain = ctx.createGain();
        noiseGain.gain.value = level;

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(dest);
        noise.start(t);
        noise.stop(t + duration);
    }
}

export const talkSounds = new TalkSounds();
