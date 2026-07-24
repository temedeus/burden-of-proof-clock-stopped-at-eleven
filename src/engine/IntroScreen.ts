import { Input } from "./Input";
import { spriteLoader } from "../assets/SpriteLoader";
import { shouldShowTouchControls } from "./platform";
import type { PlayerSpriteName } from "@cse/content-schema";

interface CharacterSlide {
    spriteName: string;
    name: string;
    role: string;
    line: string;
}

const CHARACTER_SLIDES: CharacterSlide[] = [
    { spriteName: "npc_male", name: "Mr. Thompson", role: "Butler", line: "The manor's steadfast butler." },
    { spriteName: "maid", name: "Mrs. Clarke", role: "Maid", line: "Keeps the halls in order." },
    { spriteName: "worker_man", name: "Chef Ytte", role: "Cook", line: "Prepares every meal at the manor." },
    { spriteName: "baron", name: "von Virtanen", role: "Baron — the victim", line: "Found dead in the hall when the clock stopped." },
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

        ctx.fillStyle = "#1a1510";
        ctx.fillRect(0, 0, w, h);

        const isLastSlide = this.slideIndex === this.totalSlides - 1;
        const isPremiseSlide = this.slideIndex === 0;
        const isDetectiveSlide = this.slideIndex === this.totalSlides - 1;

        if (isPremiseSlide) {
            this.renderPremiseSlide(ctx, w, h);
        } else if (isDetectiveSlide) {
            this.renderDetectiveSlide(ctx, w, h);
        } else if (this.slideIndex >= 1 && this.slideIndex <= CHARACTER_SLIDES.length) {
            if (this.slideIndex === 1) {
                ctx.fillStyle = "#8b4513";
                ctx.font = "bold 26px serif";
                ctx.textAlign = "center";
                ctx.fillText("von Virtanen Manor — the household", w / 2, h * 0.18);
            }
            this.renderCharacterSlide(ctx, w, h, CHARACTER_SLIDES[this.slideIndex - 1]);
        }

        const promptY = h * 0.88;
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "18px serif";
        ctx.textAlign = "center";
        const touch = shouldShowTouchControls();
        if (isLastSlide) {
            const hint = touch
                ? "Tap to begin investigation"
                : "Press Enter or Space to begin investigation";
            ctx.fillText(hint, w / 2, promptY);
        } else {
            const hint = touch ? "Tap to continue" : "Press Enter or Space to continue";
            ctx.fillText(hint, w / 2, promptY);
        }

        const progress = `${this.slideIndex + 1} / ${this.totalSlides}`;
        ctx.font = "14px serif";
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.fillText(progress, w / 2, h - 20);
        ctx.textAlign = "left";
    }

    private renderPremiseSlide(ctx: CanvasRenderingContext2D, w: number, h: number): void {
        const centerX = w / 2;
        const lineHeight = 28;

        ctx.fillStyle = "#8b4513";
        ctx.font = "bold 32px serif";
        ctx.textAlign = "center";
        ctx.fillText("Murder at von Virtanen Manor", centerX, h * 0.2);

        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.font = "20px serif";
        ctx.textAlign = "center";

        const lines = [
            "Baron von Virtanen has been murdered in his own hall.",
            "His body was found beneath the stopped clock at eleven.",
            "",
            "The police have secured the scene. Now a detective",
            "must gather clues, question the household,",
            "and find the murderer before it's too late."
        ];
        let y = h * 0.38;
        for (const line of lines) {
            ctx.fillText(line, centerX, y);
            y += lineHeight;
        }

        ctx.font = "18px serif";
        ctx.fillStyle = "rgba(200,180,140,0.95)";
        ctx.fillText("— von Virtanen Manor, the night of the murder —", centerX, y + lineHeight);
    }

    private renderCharacterSlide(ctx: CanvasRenderingContext2D, w: number, h: number, slide: CharacterSlide): void {
        const centerX = w / 2;
        const spriteSize = 160;
        const y = h * 0.38;

        spriteLoader.drawSprite(
            ctx,
            slide.spriteName,
            centerX - spriteSize / 2,
            y - spriteSize / 2,
            spriteSize,
            spriteSize
        );

        ctx.fillStyle = "#c4a574";
        ctx.font = "bold 28px serif";
        ctx.textAlign = "center";
        ctx.fillText(slide.name, centerX, y + spriteSize / 2 + 36);
        ctx.font = "20px serif";
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fillText(slide.role, centerX, y + spriteSize / 2 + 62);
        ctx.font = "18px serif";
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fillText(slide.line, centerX, y + spriteSize / 2 + 92);
    }

    private renderDetectiveSlide(ctx: CanvasRenderingContext2D, w: number, h: number): void {
        const centerX = w / 2;
        const spriteSize = 140;
        const y = h * 0.4;

        ctx.fillStyle = "#8b4513";
        ctx.font = "bold 24px serif";
        ctx.textAlign = "center";
        ctx.fillText("Arriving to investigate...", centerX, h * 0.22);

        spriteLoader.drawSprite(ctx, this.playerSprite, centerX - spriteSize / 2, y - spriteSize / 2, spriteSize, spriteSize);

        const label = this.playerSprite === "female_detective" ? "Clara Case" : "Max Trace";
        ctx.fillStyle = "#c4a574";
        ctx.font = "bold 26px serif";
        ctx.fillText(label, centerX, y + spriteSize / 2 + 40);
        ctx.font = "20px serif";
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fillText("comes to von Virtanen Manor to solve the case.", centerX, y + spriteSize / 2 + 72);
    }
}
