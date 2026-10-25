import { Input } from "./Input";
import { drawHeading, drawPageBackdrop, GILT, INK, INK_MUTED, serif, shadowText, smallCaps } from "../render/menuChrome";
import { shouldShowTouchControls } from "./platform";
import { isMuteSounds, setMuteSounds } from "./Settings";

/** Shown at launch, before the main menu: asks whether to play with sound. */
const PROMPT_LINES = [
    "As this is a browser game, I want to make sure",
    "whether you want to play with sound or not."
];

const OPTIONS = [
    { label: "Play with sound", mute: false },
    { label: "Play without sound", mute: true }
];

export class SoundPromptScreen {
    private selectedIndex: number;

    constructor(
        private input: Input,
        private onComplete: () => void
    ) {
        this.selectedIndex = isMuteSounds() ? 1 : 0;
    }

    update(): void {
        const prev =
            this.input.wasPressed("arrowup") ||
            this.input.wasPressed("w") ||
            this.input.wasPressed("arrowleft") ||
            this.input.wasPressed("a");
        const next =
            this.input.wasPressed("arrowdown") ||
            this.input.wasPressed("s") ||
            this.input.wasPressed("arrowright") ||
            this.input.wasPressed("d");
        if (prev || next) this.selectedIndex = (this.selectedIndex + 1) % OPTIONS.length;
        if (this.input.wasPressed("enter") || this.input.wasPressed(" ") || this.input.wasPressed("e")) {
            this.choose(this.selectedIndex);
        }
    }

    /** Handle a tap on the canvas (canvas pixel coordinates). */
    handlePointer(x: number, y: number, w: number, h: number): void {
        const { startY, lineHeight } = this.getLayout(h);
        const halfLine = lineHeight / 2;
        for (let i = 0; i < OPTIONS.length; i++) {
            const itemY = startY + i * lineHeight;
            if (y >= itemY - halfLine && y <= itemY + halfLine && Math.abs(x - w / 2) <= w * 0.35) {
                this.choose(i);
                return;
            }
        }
    }

    render(ctx: CanvasRenderingContext2D): void {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;
        const scale = h / 600;
        const cx = w / 2;

        drawPageBackdrop(ctx, w, h, performance.now() / 1000);
        ctx.textAlign = "center";
        drawHeading(ctx, "Sound", cx, h * 0.22, scale);

        let y = h * 0.38;
        ctx.font = serif(20 * scale);
        for (const line of PROMPT_LINES) {
            shadowText(ctx, line, cx, y, INK, 2);
            y += 30 * scale;
        }

        const { startY, lineHeight } = this.getLayout(h);
        const itemPx = (shouldShowTouchControls() ? 30 : 24) * scale;
        OPTIONS.forEach((opt, i) => {
            const selected = i === this.selectedIndex;
            ctx.font = selected ? smallCaps(itemPx) : serif(itemPx);
            const itemY = startY + i * lineHeight;
            shadowText(ctx, selected ? `◆ ${opt.label} ◆` : opt.label, cx, itemY, selected ? GILT : INK_MUTED, 2);
        });

        ctx.textAlign = "left";
    }

    private getLayout(h: number): { startY: number; lineHeight: number } {
        const scale = h / 600;
        return { startY: h * 0.62, lineHeight: (shouldShowTouchControls() ? 64 : 50) * scale };
    }

    private choose(index: number): void {
        setMuteSounds(OPTIONS[index].mute);
        this.onComplete();
    }
}
