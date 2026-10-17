const OUTLINE = "#1a1418";
const PAPER = "#f8f2e4";
const INK = "#b8202a";
const DIALOG_INK = "#2a2024";
const TAIL = 5;
const FONT = "16px \"IM Fell English\", \"Libre Baskerville\", serif";

export const SPEECH_BUBBLE_FONT = FONT;
/** Wrap width for dialog bubble text (the bubble adds padding around it). */
export const SPEECH_BUBBLE_TEXT_WIDTH = 240;

/**
 * Notched pixel-art bubble with a stepped tail at tipX.
 * `tailUp` points the tail up, for a bubble hanging beneath its speaker.
 */
function drawBubbleFrame(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    tipX: number,
    tailUp: boolean
): void {
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(x + 2, y, w - 4, h);
    ctx.fillRect(x, y + 2, w, h - 4);
    ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    ctx.fillStyle = PAPER;
    ctx.fillRect(x + 3, y + 2, w - 6, h - 4);
    ctx.fillRect(x + 2, y + 3, w - 4, h - 6);

    const tailX = Math.max(x + 4, Math.min(x + w - 10, tipX - 3));
    for (let i = 0; i < TAIL; i++) {
        const tw = 6 - i;
        const row = tailUp ? y + 1 - i : y + h - 2 + i;
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(tailX + i - 1, row, tw + 2, 1);
        if (tw > 0 && i < TAIL - 1) {
            ctx.fillStyle = PAPER;
            ctx.fillRect(tailX + i, row, tw, 1);
        }
    }
}

/**
 * Pixel speech bubble with a downward tail, its tip at (cx, tipY).
 * `shake` jitters it a pixel or two so the shout reads as frantic.
 */
export function drawPanicBubble(
    ctx: CanvasRenderingContext2D,
    text: string,
    cx: number,
    tipY: number,
    shake: number,
    minX: number,
    maxX: number
): void {
    const height = 22;
    ctx.save();
    ctx.font = "bold 16px \"IM Fell English\", \"Libre Baskerville\", serif";
    const w = Math.ceil(ctx.measureText(text).width) + 12;
    const jx = Math.round(Math.sin(shake * 37) * 1.5);
    const jy = Math.round(Math.cos(shake * 29));
    const tipX = Math.round(cx) + jx;
    const x = Math.round(Math.max(minX, Math.min(maxX - w, tipX - w / 2)));
    const y = Math.round(tipY) - TAIL - height + jy;

    drawBubbleFrame(ctx, x, y, w, height, tipX, false);

    ctx.fillStyle = INK;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + w / 2, y + height / 2 + 1);
    ctx.restore();
}

export interface DialogBubbleOptions {
    /** Speaker's horizontal centre. */
    cx: number;
    /** Where the tail points when the bubble sits above the speaker. */
    aboveY: number;
    /** Where the tail points if there is no room above (bubble flips below). */
    belowY: number;
    /** More pages follow — draw a small ▼ in the corner. */
    showContinue: boolean;
    /** Animation clock for the continue marker bob. */
    time: number;
}

/** Multi-line dialog bubble anchored over a speaker; flips beneath them near the top of the screen. */
export function drawDialogBubble(
    ctx: CanvasRenderingContext2D,
    lines: string[],
    options: DialogBubbleOptions
): void {
    const padX = 10;
    const padY = 8;
    const lineHeight = 20;
    ctx.save();
    ctx.font = FONT;
    const textW = Math.max(...lines.map((l) => Math.ceil(ctx.measureText(l).width)), 24);
    const w = textW + padX * 2 + (options.showContinue ? 8 : 0);
    const h = lines.length * lineHeight + padY * 2 - 4;
    const margin = 6;
    const tipX = Math.round(options.cx);
    const x = Math.round(Math.max(margin, Math.min(ctx.canvas.width - margin - w, tipX - w / 2)));

    let y = Math.round(options.aboveY) - TAIL - h;
    const flip = y < margin;
    if (flip) y = Math.min(ctx.canvas.height - margin - h, Math.round(options.belowY) + TAIL);

    drawBubbleFrame(ctx, x, y, w, h, tipX, flip);

    ctx.fillStyle = DIALOG_INK;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], x + padX, y + padY + 12 + i * lineHeight);
    }

    if (options.showContinue) {
        // Bobbing ▼ marker in the bottom-right corner
        const bob = Math.floor(options.time * 3) % 2;
        const mx = x + w - 11;
        const my = y + h - 9 + bob;
        ctx.fillStyle = INK;
        ctx.fillRect(mx, my, 5, 1);
        ctx.fillRect(mx + 1, my + 1, 3, 1);
        ctx.fillRect(mx + 2, my + 2, 1, 1);
    }
    ctx.restore();
}
