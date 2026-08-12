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
                ctx.font = "bold 26px \"IM Fell English SC\", \"IM Fell English\", \"Libre Baskerville\", serif";
                ctx.textAlign = "center";
                ctx.fillText("von Virtanen Manor — the household", w / 2, h * 0.18);
            }
            this.renderCharacterSlide(ctx, w, h, CHARACTER_SLIDES[this.slideIndex - 1]);
        }

        const promptY = h * 0.88;
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "18px \"IM Fell English\", \"Libre Baskerville\", serif";
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
        ctx.font = "14px \"IM Fell English\", \"Libre Baskerville\", serif";
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.fillText(progress, w / 2, h - 20);
        ctx.textAlign = "left";
    }

    private renderPremiseSlide(ctx: CanvasRenderingContext2D, w: number, h: number): void {
        const centerX = w / 2;
        const lineHeight = 28;

        ctx.fillStyle = "#8b4513";
        ctx.font = "bold 32px \"IM Fell English SC\", \"IM Fell English\", \"Libre Baskerville\", serif";
        ctx.textAlign = "center";
        
        // Draw curved text: thick on ends, narrow in middle
        this.drawCurvedText(ctx, "Murder at von Virtanen Manor", centerX, h * 0.2, w * 0.8);

        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.font = "20px \"IM Fell English\", \"Libre Baskerville\", serif";
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

        ctx.font = "18px \"IM Fell English\", \"Libre Baskerville\", serif";
        ctx.fillStyle = "rgba(200,180,140,0.95)";
        ctx.fillText("— von Virtanen Manor, the night of the murder —", centerX, y + lineHeight);
    }

    private drawCurvedText(ctx: CanvasRenderingContext2D, text: string, centerX: number, y: number, maxWidth: number): void {
        const chars = text.split('');
        const charCount = chars.length;
        
        // Measure width of full unscaled text for centering
        const baseWidth = ctx.measureText(text).width;
        const startX = centerX - baseWidth / 2;
        
        // Draw each character with horizontal scale based on position
        let x = startX;
        for (let i = 0; i < charCount; i++) {
            const progress = i / (charCount - 1); // 0 to 1
            
            // Horizontal distance from center (normalized to -1 to +1)
            const hDist = progress * 2 - 1;
            // Scale factor: thicker at edges (1.0), narrower in middle (0.7)
            const scale = 0.7 + 0.3 * Math.abs(hDist);
            
            // Get unscaled width of this character
            const charWidth = ctx.measureText(chars[i]).width;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, 1);
            ctx.textAlign = 'left';
            ctx.fillText(chars[i], 0, 0);
            ctx.restore();
            
            // Move to next character position (using unscaled width)
            x += charWidth;
        }
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
        ctx.font = "bold 28px \"IM Fell English SC\", \"IM Fell English\", \"Libre Baskerville\", serif";
        ctx.textAlign = "center";
        ctx.fillText(slide.name, centerX, y + spriteSize / 2 + 36);
        ctx.font = "20px \"IM Fell English\", \"Libre Baskerville\", serif";
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fillText(slide.role, centerX, y + spriteSize / 2 + 62);
        ctx.font = "18px \"IM Fell English\", \"Libre Baskerville\", serif";
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fillText(slide.line, centerX, y + spriteSize / 2 + 92);
    }

    private renderDetectiveSlide(ctx: CanvasRenderingContext2D, w: number, h: number): void {
        const centerX = w / 2;
        const spriteSize = 140;
        const y = h * 0.4;

        ctx.fillStyle = "#8b4513";
        ctx.font = "bold 24px \"IM Fell English SC\", \"IM Fell English\", \"Libre Baskerville\", serif";
        ctx.textAlign = "center";
        ctx.fillText("Arriving to investigate...", centerX, h * 0.22);

        spriteLoader.drawSprite(ctx, this.playerSprite, centerX - spriteSize / 2, y - spriteSize / 2, spriteSize, spriteSize);

        const label = this.playerSprite === "female_detective" ? "Clara Case" : "Max Trace";
        ctx.fillStyle = "#c4a574";
        ctx.font = "bold 26px \"IM Fell English SC\", \"IM Fell English\", \"Libre Baskerville\", serif";
        ctx.fillText(label, centerX, y + spriteSize / 2 + 40);
        ctx.font = "20px \"IM Fell English\", \"Libre Baskerville\", serif";
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fillText("comes to von Virtanen Manor to solve the case.", centerX, y + spriteSize / 2 + 72);
    }
}
