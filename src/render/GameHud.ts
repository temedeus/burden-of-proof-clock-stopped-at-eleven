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

/** Dialog width as a fraction of canvas width (was 1/3; +20% → 0.4). */
const DIALOG_WIDTH_RATIO = 0.4;

export function getDialogMaxTextWidth(canvasWidth: number): number {
    const boxWidth = Math.floor(canvasWidth * DIALOG_WIDTH_RATIO);
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

    const boxWidth = Math.floor(ctx.canvas.width * DIALOG_WIDTH_RATIO);
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

export function drawStruggleMeter(
    ctx: CanvasRenderingContext2D,
    progress: number,
    touchControls: boolean,
    title = "Push him off!"
): void {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const barW = Math.min(320, Math.round(w * 0.45));
    const barH = 22;
    const barX = (w - barW) / 2;
    const barY = h * 0.28;

    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(barX - 12, barY - 42, barW + 24, barH + 70);

    ctx.fillStyle = "#e8e0d5";
    ctx.font = "bold 20px serif";
    ctx.textAlign = "center";
    ctx.fillText(title, w / 2, barY - 16);

    ctx.fillStyle = "#1a1510";
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeStyle = "#c4a574";
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barW, barH);

    const fill = Math.max(0, Math.min(1, progress));
    const fillColor =
        fill < 0.3 ? "#8a2828" : fill < 0.65 ? "#c85020" : "#48a058";
    ctx.fillStyle = fillColor;
    ctx.fillRect(barX + 2, barY + 2, (barW - 4) * fill, barH - 4);

    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "16px serif";
    const hint = touchControls ? "Tap Interact repeatedly!" : "Mash E / Space!";
    ctx.fillText(hint, w / 2, barY + barH + 22);
    ctx.textAlign = "left";
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

/** Bottom-of-screen contextual hint (hearth shove, locked doors, etc.). */
export function drawActionHint(ctx: CanvasRenderingContext2D, text: string): void {
    ctx.save();
    ctx.font = "18px serif";
    ctx.textAlign = "center";
    const metrics = ctx.measureText(text);
    const padX = 16;
    const padY = 10;
    const boxW = metrics.width + padX * 2;
    const boxH = 18 + padY * 2;
    const boxX = (ctx.canvas.width - boxW) / 2;
    const boxY = ctx.canvas.height - 56 - boxH;
    ctx.fillStyle = "rgba(0,0,0,0.72)";
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.fillStyle = "#f0e6d8";
    ctx.fillText(text, ctx.canvas.width / 2, boxY + padY + 16);
    ctx.restore();
}

/** Dining fire cutscene overlays: rising smoke + optional full blackout. */
export function drawDiningFireOverlay(
    ctx: CanvasRenderingContext2D,
    smokeAlpha: number,
    blackAlpha: number,
    flameIntensity: number,
    animTime: number
): void {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    if (flameIntensity > 0.05) {
        const flicker = 0.85 + Math.sin(animTime * 11) * 0.15;
        ctx.fillStyle = `rgba(180, 40, 10, ${0.12 * flameIntensity * flicker})`;
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 6; i++) {
            const x = ((Math.sin(animTime * 2.1 + i * 1.7) * 0.5 + 0.5) * w * 0.7) + w * 0.15;
            const y = h * (0.35 + (i % 3) * 0.12);
            const r = 30 + i * 8 + Math.sin(animTime * 8 + i) * 10;
            const g = ctx.createRadialGradient(x, y, 0, x, y, r);
            g.addColorStop(0, `rgba(255, 160, 40, ${0.22 * flameIntensity})`);
            g.addColorStop(1, "rgba(255, 80, 0, 0)");
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    if (smokeAlpha > 0.01) {
        ctx.fillStyle = `rgba(28, 26, 24, ${smokeAlpha * 0.85})`;
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 5; i++) {
            const x = ((animTime * (20 + i * 7) + i * 90) % (w + 120)) - 60;
            const y = h * 0.2 + i * 40 + Math.sin(animTime + i) * 12;
            const g = ctx.createRadialGradient(x, y, 10, x, y, 90);
            g.addColorStop(0, `rgba(60, 58, 55, ${smokeAlpha * 0.45})`);
            g.addColorStop(1, "rgba(40, 38, 36, 0)");
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, 90, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    if (blackAlpha > 0.01) {
        ctx.fillStyle = `rgba(0, 0, 0, ${blackAlpha})`;
        ctx.fillRect(0, 0, w, h);
    }
}

export { ROOM_TITLE_DURATION };
