import { Input } from "./Input";
import {
    drawCard,
    drawFigure,
    drawHeading,
    drawHint,
    drawPageBackdrop,
    drawProgressDots,
    drawRule,
    GILT,
    INK,
    INK_MUTED,
    serif,
    shadowText,
    smallCaps
} from "../render/menuChrome";
import { shouldShowTouchControls } from "./platform";
import type { PlayerSpriteName } from "@cse/content-schema";

interface CharacterSlide {
    spriteName: string;
    name: string;
    role: string;
    line: string;
    victim?: boolean;
}

const CHARACTER_SLIDES: CharacterSlide[] = [
    { spriteName: "npc_male", name: "Mr. Thompson", role: "Butler", line: "The manor's steadfast butler." },
    { spriteName: "maid", name: "Mrs. Clarke", role: "Maid", line: "Keeps the halls in order." },
    { spriteName: "worker_man", name: "Chef Ytte", role: "Cook", line: "Prepares every meal at the manor." },
    { spriteName: "baron", name: "von Virtanen", role: "Baron — the victim", line: "Found dead in the hall when the clock stopped.", victim: true },
    { spriteName: "baroness", name: "Lady von Virtanen", role: "Baroness", line: "The lady of the house." },
    { spriteName: "worker_man", name: "The Groundskeeper", role: "Worker", line: "Tends the grounds by day." },
    { spriteName: "worker_boy", name: "The Stable Boy", role: "Stable hand", line: "Cares for the horses." },
    { spriteName: "police", name: "Inspector Walsh", role: "Police", line: "First on the scene." },
    { spriteName: "police2", name: "Constable Reed", role: "Police", line: "Securing the premises." }
];

export class IntroScreen {
    private slideIndex = 0;
    private readonly totalSlides: number;

    constructor(
        private input: Input,
        private playerSprite: PlayerSpriteName,
        private onComplete: () => void
    ) {
        this.totalSlides = 1 + CHARACTER_SLIDES.length + 1; // premise + characters + detective
    }

    update(): void {
        const advance = this.input.wasPressed(" ") || this.input.wasPressed("enter") || this.input.wasPressed("e");
        if (!advance) return;

        this.slideIndex++;
        if (this.slideIndex >= this.totalSlides) {
            this.onComplete();
        }
    }

    render(ctx: CanvasRenderingContext2D): void {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;
        const scale = h / 600;
        const t = performance.now() / 1000;

        drawPageBackdrop(ctx, w, h, t);
        ctx.textAlign = "center";

        const isPremiseSlide = this.slideIndex === 0;
        const isDetectiveSlide = this.slideIndex === this.totalSlides - 1;

        if (isPremiseSlide) {
            this.renderPremiseSlide(ctx, w, h, scale);
        } else if (isDetectiveSlide) {
            this.renderDetectiveSlide(ctx, w, h, scale);
        } else if (this.slideIndex >= 1 && this.slideIndex <= CHARACTER_SLIDES.length) {
            drawHeading(ctx, "The Household", w / 2, h * 0.12, scale);
            this.renderCharacterSlide(ctx, w, h, scale, CHARACTER_SLIDES[this.slideIndex - 1]);
        }

        const touch = shouldShowTouchControls();
        const hint = isDetectiveSlide
            ? touch
                ? "Tap to begin the investigation"
                : "Press Enter or Space to begin the investigation"
            : touch
              ? "Tap to continue"
              : "Press Enter or Space to continue";
        drawHint(ctx, hint, w / 2, h * 0.9, scale, t);
        drawProgressDots(ctx, this.totalSlides, this.slideIndex, w / 2, h * 0.94, scale);
        ctx.textAlign = "left";
    }

    private renderPremiseSlide(ctx: CanvasRenderingContext2D, w: number, h: number, scale: number): void {
        const cx = w / 2;
        ctx.font = serif(20 * scale, true);
        shadowText(ctx, "Murder at", cx, h * 0.14, INK_MUTED);
        ctx.font = smallCaps(40 * scale);
        shadowText(ctx, "Von Virtanen Manor", cx, h * 0.14 + 42 * scale, GILT, 3);
        drawRule(ctx, cx, h * 0.14 + 62 * scale, 170 * scale, scale);

        const lines = [
            "Baron von Virtanen has been murdered in his own hall.",
            "His body was found beneath the stopped clock at eleven.",
            "",
            "The police have secured the scene. Now a detective",
            "must gather clues, question the household,",
            "and find the murderer before it's too late."
        ];
        const lineHeight = 30 * scale;
        let y = h * 0.4;
        ctx.font = serif(20 * scale);
        for (const line of lines) {
            if (line) shadowText(ctx, line, cx, y, INK, 2);
            y += line ? lineHeight : lineHeight * 0.6;
        }

        ctx.font = serif(17 * scale, true);
        shadowText(ctx, "— the night of the murder —", cx, y + lineHeight * 0.9, INK_MUTED);
    }

    private renderCharacterSlide(
        ctx: CanvasRenderingContext2D,
        w: number,
        h: number,
        scale: number,
        slide: CharacterSlide
    ): void {
        const cx = w / 2;
        const cardW = 200 * scale;
        const cardH = 210 * scale;
        const cardY = h * 0.19;
        drawCard(ctx, cx - cardW / 2, cardY, cardW, cardH);
        drawFigure(ctx, slide.spriteName, cx, cardY + cardH - 30 * scale, cardH - 50 * scale);

        let y = cardY + cardH + 46 * scale;
        ctx.font = smallCaps(30 * scale);
        shadowText(ctx, slide.name, cx, y, GILT, 3);
        y += 30 * scale;
        ctx.font = serif(19 * scale, true);
        shadowText(ctx, slide.role, cx, y, slide.victim ? "#b9786a" : INK_MUTED);
        y += 34 * scale;
        ctx.font = serif(19 * scale);
        shadowText(ctx, slide.line, cx, y, INK);
    }

    private renderDetectiveSlide(ctx: CanvasRenderingContext2D, w: number, h: number, scale: number): void {
        const cx = w / 2;
        drawHeading(ctx, "Arriving to Investigate", cx, h * 0.12, scale);

        const cardW = 200 * scale;
        const cardH = 210 * scale;
        const cardY = h * 0.19;
        drawCard(ctx, cx - cardW / 2, cardY, cardW, cardH, true);
        drawFigure(ctx, this.playerSprite, cx, cardY + cardH - 30 * scale, cardH - 50 * scale);

        const label = this.playerSprite === "female_detective" ? "Clara Case" : "Max Trace";
        let y = cardY + cardH + 46 * scale;
        ctx.font = smallCaps(30 * scale);
        shadowText(ctx, label, cx, y, GILT, 3);
        y += 30 * scale;
        ctx.font = serif(19 * scale, true);
        shadowText(ctx, "Detective", cx, y, INK_MUTED);
        y += 34 * scale;
        ctx.font = serif(19 * scale);
        shadowText(ctx, "comes to von Virtanen Manor to solve the case.", cx, y, INK);
    }
}
