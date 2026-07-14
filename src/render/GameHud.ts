const ROOM_TITLE_DURATION = 2;
export const DIALOG_LINES_PER_PAGE = 3;

export interface RoomTitleBanner {
    title: string;
    elapsed: number;
}

export function createRoomTitleBanner(title: string): RoomTitleBanner {
    return { title, elapsed: 0 };
}

export function tickRoomTitleBanner(banner: RoomTitleBanner | null, dt: number): RoomTitleBanner | null {
    if (!banner) return null;
    banner.elapsed += dt;
    return banner.elapsed >= ROOM_TITLE_DURATION ? null : banner;
}

export function getDialogMaxTextWidth(canvasWidth: number): number {
    const boxWidth = Math.floor(canvasWidth / 3);
    const padding = 12;
    return boxWidth - padding * 2;
}

export function wrapDialogText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const lines: string[] = [];
    const paragraphs = text.split("\n");

    for (const paragraph of paragraphs) {
        const words = paragraph.split(" ");
        let current = "";

        for (const word of words) {
            const next = current ? `${current} ${word}` : word;
            if (ctx.measureText(next).width <= maxWidth) {
                current = next;
            } else {
                if (current) lines.push(current);
                current = word;
            }
        }

        if (current) lines.push(current);
    }

    return lines.length > 0 ? lines : [text];
}

export function paginateDialog(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxLinesPerPage = DIALOG_LINES_PER_PAGE
): string[] {
    ctx.font = "16px serif";
    const maxWidth = getDialogMaxTextWidth(ctx.canvas.width);
    const wrapped = wrapDialogText(ctx, text, maxWidth);
    const pages: string[] = [];

    for (let i = 0; i < wrapped.length; i += maxLinesPerPage) {
        pages.push(wrapped.slice(i, i + maxLinesPerPage).join("\n"));
    }

    return pages.length > 0 ? pages : [text];
}

export interface MessageBoxOptions {
    pageIndex?: number;
    pageCount?: number;
}

export function drawMessageBox(
    ctx: CanvasRenderingContext2D,
    text: string,
    options?: MessageBoxOptions
): void {
    ctx.font = "16px serif";
    ctx.textAlign = "left";

    const boxWidth = Math.floor(ctx.canvas.width / 3);
    const padding = 12;
    const lineHeight = 20;
    const maxTextWidth = boxWidth - padding * 2;
    const lines = wrapDialogText(ctx, text, maxTextWidth);
    const pageIndex = options?.pageIndex;
    const pageCount = options?.pageCount;
    const showContinue =
        pageCount !== undefined &&
        pageCount > 1 &&
        pageIndex !== undefined &&
        pageIndex < pageCount - 1;
    const boxHeight = padding * 2 + lines.length * lineHeight + (showContinue ? 16 : 0);
    const boxX = 20;
    const boxY = ctx.canvas.height - 20 - boxHeight;

    ctx.fillStyle = "rgba(0,0,0,0.78)";
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    ctx.fillStyle = "white";
    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], boxX + padding, boxY + padding + 16 + i * lineHeight);
    }

    if (showContinue) {
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.font = "14px serif";
        ctx.fillText(
            `(${pageIndex + 1}/${pageCount})  E — continue`,
            boxX + padding,
            boxY + boxHeight - padding
        );
    }
}

export function drawRoomTitleBanner(ctx: CanvasRenderingContext2D, banner: RoomTitleBanner): void {
    const t = Math.min(banner.elapsed, ROOM_TITLE_DURATION);
    const alpha = Math.sin((t / ROOM_TITLE_DURATION) * Math.PI);
    if (alpha <= 0.01) return;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 36px serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.55)";
    ctx.lineWidth = 4;
    const cx = ctx.canvas.width / 2;
    const cy = ctx.canvas.height / 2;
    ctx.strokeText(banner.title, cx, cy);
    ctx.fillText(banner.title, cx, cy);
    ctx.restore();
}

export function drawAccusationBlink(ctx: CanvasRenderingContext2D, redBlinkRemaining: number): void {
    if (redBlinkRemaining <= 0) return;
    const intensity = redBlinkRemaining / 3;
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008);
    const alpha = 0.12 * intensity * pulse;
    ctx.fillStyle = `rgba(180, 0, 0, ${alpha})`;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

export function drawVictoryOverlay(ctx: CanvasRenderingContext2D, victoryTimer: number): void {
    const elapsed = 2 - victoryTimer;
    const fadeAlpha = victoryTimer <= 0 ? 1 : Math.min(1, elapsed / 0.8);
    if (fadeAlpha > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    const showText = elapsed >= 0.4 || victoryTimer <= 0;
    if (!showText) return;

    const textAlpha = victoryTimer <= 0 ? 1 : Math.min(1, (elapsed - 0.4) / 0.3);
    ctx.save();
    ctx.globalAlpha = textAlpha;
    ctx.fillStyle = "#fff";
    ctx.font = "bold 48px serif";
    ctx.textAlign = "center";
    ctx.fillText("Congratulations!", ctx.canvas.width / 2, ctx.canvas.height / 2 - 40);
    ctx.font = "24px serif";
    ctx.fillText("The murderer is being apprehended.", ctx.canvas.width / 2, ctx.canvas.height / 2 + 10);
    if (victoryTimer <= 0) {
        ctx.font = "20px serif";
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fillText(
            "Press Enter or Escape to return to main menu",
            ctx.canvas.width / 2,
            ctx.canvas.height / 2 + 70
        );
    }
    ctx.restore();
}

export { ROOM_TITLE_DURATION };
