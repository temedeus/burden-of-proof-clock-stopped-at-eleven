import { createCrushedNoise, getAudioContext, getSfxOutput } from "./audioContext";

export type VoiceGender = "male" | "female";

const FEMALE_NPC_IDS = new Set(["maid", "baroness"]);
const FEMALE_SPRITES = new Set(["maid", "baroness", "npc_female", "female_detective"]);

const VOICE = {
    male: { f0Hz: 95, f0RangeHz: 35, gain: 0.09 },
    female: { f0Hz: 175, f0RangeHz: 55, gain: 0.085 }
} as const;

/** Approximate F1/F2/F3 (Hz, adult male) for a handful of vowels. */
const VOWELS: readonly (readonly [number, number, number])[] = [
    [730, 1090, 2440], // a
    [530, 1840, 2480], // e
    [270, 2290, 3010], // i
    [570, 840, 2410], // o
    [300, 870, 2240], // u
    [500, 1500, 2500] // schwa
];

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
    private totalSyllables = 1;
    private isQuestion = false;
    private contourSeed = 0;

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

        this.totalSyllables = gaps.length + 1;
        this.isQuestion = line.endsWith("?");
        this.contourSeed = Math.random() * 6;

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
        const duration = 0.07 + Math.random() * 0.06;
        const f0 = this.pitchAt(index, profile.f0Hz, profile.f0RangeHz);
        const vowel = VOWELS[Math.floor(Math.random() * VOWELS.length)];
        const formantScale = this.gender === "female" ? 1.17 : 1;

        const master = ctx.createGain();
        master.gain.setValueAtTime(0.0001, t);
        master.gain.linearRampToValueAtTime(profile.gain * 2.4, t + 0.018);
        master.gain.setValueAtTime(profile.gain * 2.4, t + duration * 0.55);
        master.gain.exponentialRampToValueAtTime(0.0001, t + duration);
        master.connect(getSfxOutput(ctx));

        // Optional consonant onset (plosive, fricative or nasal hum)
        const onset = Math.random();
        let voicedStart = t;
        if (onset < 0.3) {
            this.addConsonant(ctx, master, t, "fricative");
            voicedStart = t + 0.025;
        } else if (onset < 0.6) {
            this.addConsonant(ctx, master, t, "plosive");
            voicedStart = t + 0.018;
        }

        const dur = duration - (voicedStart - t);
        const nasal = onset >= 0.6 && onset < 0.75;
        this.addVoicedVowel(ctx, master, voicedStart, dur, f0, vowel, formantScale, nasal);
    }

    /** Per-line intonation: gentle wobble, downward drift (declination), rising tail on questions. */
    private pitchAt(index: number, base: number, range: number): number {
        const total = Math.max(1, this.totalSyllables);
        const progress = index / total;
        let contour = 1 + 0.09 * Math.sin(index * 0.85 + this.contourSeed) - 0.12 * progress;
        if (this.isQuestion && progress > 0.7) {
            contour += ((progress - 0.7) / 0.3) * 0.22;
        }
        const stress = index % 3 === 0 ? 1.05 : 1;
        return (base + range * 0.5 + (Math.random() - 0.5) * range * 0.25) * contour * stress;
    }

    private addVoicedVowel(
        ctx: AudioContext,
        dest: GainNode,
        t: number,
        duration: number,
        f0: number,
        vowel: readonly [number, number, number],
        formantScale: number,
        nasal: boolean
    ): void {
        // Glottal-like source: sawtooth with tiny vibrato for a living pitch
        const source = ctx.createOscillator();
        source.type = "sawtooth";
        source.frequency.setValueAtTime(f0 * 1.02, t);
        source.frequency.linearRampToValueAtTime(f0 * 0.95, t + duration);

        const vibrato = ctx.createOscillator();
        vibrato.frequency.value = 5.5 + Math.random();
        const vibratoDepth = ctx.createGain();
        vibratoDepth.gain.value = f0 * 0.012;
        vibrato.connect(vibratoDepth);
        vibratoDepth.connect(source.frequency);

        const bus = ctx.createGain();
        bus.gain.value = nasal ? 0.5 : 1;
        bus.connect(dest);

        // Three parallel formant resonators shape the buzz into a vowel
        const weights = [1.0, 0.55, 0.28];
        vowel.forEach((hz, i) => {
            const bp = ctx.createBiquadFilter();
            bp.type = "bandpass";
            bp.frequency.value = nasal ? (i === 0 ? 280 : hz * 0.6) * formantScale : hz * formantScale * (0.97 + Math.random() * 0.06);
            bp.Q.value = 7 + i * 2;
            const g = ctx.createGain();
            g.gain.value = weights[i] * 2.2;
            source.connect(bp);
            bp.connect(g);
            g.connect(bus);
        });

        source.start(t);
        source.stop(t + duration);
        vibrato.start(t);
        vibrato.stop(t + duration);
    }

    private addConsonant(
        ctx: AudioContext,
        dest: GainNode,
        t: number,
        kind: "fricative" | "plosive"
    ): void {
        const duration = kind === "fricative" ? 0.04 : 0.02;
        const buffer = createCrushedNoise(ctx, duration, kind === "fricative" ? 0.6 : 0.2, 1, 64);
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = kind === "fricative" ? "highpass" : "bandpass";
        filter.frequency.value = kind === "fricative" ? 3800 + Math.random() * 1500 : 1200 + Math.random() * 1800;
        filter.Q.value = 0.8;
        const g = ctx.createGain();
        g.gain.value = kind === "fricative" ? 0.55 : 0.9;
        noise.connect(filter);
        filter.connect(g);
        g.connect(dest);
        noise.start(t);
        noise.stop(t + duration);
    }
}

export const talkSounds = new TalkSounds();
