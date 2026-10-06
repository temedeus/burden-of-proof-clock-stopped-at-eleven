/**
 * Quiet shared styling for the menu and intro pages: a dimmed manor backdrop,
 * small-caps headings over a thin gilt rule, framed cards and character figures
 * drawn at an integer scale with their true proportions.
 */
import { spriteLoader } from "../assets/SpriteLoader";
import { getSpriteDef } from "../assets/procedural/registry";
import { drawMenuBackdrop } from "./menuBackdrop";

export const GILT = "#c9a868";
export const GILT_DIM = "rgba(201,168,104,0.35)";
export const INK = "#ddd5c4";
export const INK_MUTED = "#9a9284";

const SERIF = `"IM Fell English", "Libre Baskerville", serif`;
const SMALL_CAPS = `"IM Fell English SC", "IM Fell English", "Libre Baskerville", serif`;

export function serif(px: number, italic = false): string {
    return `${italic ? "italic " : ""}${Math.round(px)}px ${SERIF}`;
}

export function smallCaps(px: number): string {
    return `${Math.round(px)}px ${SMALL_CAPS}`;
}

/** The main-menu manor, mostly in darkness, with a soft vignette. */
export function drawPageBackdrop(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
    drawMenuBackdrop(ctx, w, h, t);
    ctx.fillStyle = "rgba(6,6,10,0.8)";
    ctx.fillRect(0, 0, w, h);
    const v = ctx.createRadialGradient(w / 2, h * 0.45, h * 0.25, w / 2, h * 0.45, h * 0.85);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
}

/** Text with a 1–2px dark drop shadow, so it reads over any backdrop. */
export function shadowText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, off = 2): void {
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillText(text, x + off / 2, y + off);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}

/** Thin gilt rule fading at both ends with a small centre lozenge. */
export function drawRule(ctx: CanvasRenderingContext2D, cx: number, y: number, span: number, scale: number): void {
    const hpx = Math.max(1, Math.round(scale));
    const yy = Math.round(y);
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(cx - span + 1, yy + 1, span * 2, hpx);
    const rule = ctx.createLinearGradient(cx - span, 0, cx + span, 0);
    rule.addColorStop(0, "rgba(201,168,104,0)");
    rule.addColorStop(0.5, GILT);
    rule.addColorStop(1, "rgba(201,168,104,0)");
    ctx.fillStyle = rule;
    ctx.fillRect(cx - span, yy, span * 2, hpx);
    const d = 4 * scale;
    ctx.fillStyle = GILT;
    ctx.beginPath();
    ctx.moveTo(cx, yy - d);
    ctx.lineTo(cx + d * 1.5, yy);
    ctx.lineTo(cx, yy + d);
    ctx.lineTo(cx - d * 1.5, yy);
    ctx.closePath();
    ctx.fill();
}

/** Page heading in muted gilt small caps with a rule beneath. Returns the rule's y. */
export function drawHeading(
    ctx: CanvasRenderingContext2D,
    text: string,
    cx: number,
    y: number,
    scale: number,
    color = GILT
): number {
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = smallCaps(32 * scale);
    shadowText(ctx, text, cx, y, color, 3);
    const span = Math.min(ctx.measureText(text).width * 0.75, 260 * scale);
    const ruleY = y + 16 * scale;
    drawRule(ctx, cx, ruleY, span, scale);
    ctx.restore();
    return ruleY;
}

/** Framed dark panel; the selected one gets a brighter double border. */
export function drawCard(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    selected = false
): void {
    const X = Math.round(x);
    const Y = Math.round(y);
    const W = Math.round(w);
    const H = Math.round(h);
    ctx.fillStyle = "rgba(14,12,10,0.85)";
    ctx.fillRect(X, Y, W, H);
    ctx.lineWidth = 1;
    ctx.strokeStyle = selected ? GILT : GILT_DIM;
    ctx.strokeRect(X + 0.5, Y + 0.5, W - 1, H - 1);
    if (selected) {
        ctx.strokeStyle = "rgba(201,168,104,0.45)";
        ctx.strokeRect(X + 3.5, Y + 3.5, W - 7, H - 7);
    }
}

/** Native pixel size of a character sprite (falls back to the humanoid 32x40). */
export function figureNativeSize(spriteName: string): { w: number; h: number } {
    const def = getSpriteDef(spriteName);
    return { w: def?.nativeWidth ?? 32, h: def?.nativeHeight ?? 40 };
}

/** Rows of empty space under the feet in a character frame (its own ground shadow sits there). */
const FOOT_PAD = 5;

/**
 * Character standing with feet at (cx, footY), at the largest integer scale whose
 * figure (head to feet) fits `maxH`, minimum 1.
 */
export function drawFigure(
    ctx: CanvasRenderingContext2D,
    spriteName: string,
    cx: number,
    footY: number,
    maxH: number,
    alpha = 1
): void {
    const n = figureNativeSize(spriteName);
    const scale = Math.max(1, Math.floor(maxH / (n.h - FOOT_PAD)));
    const w = n.w * scale;
    const h = n.h * scale;
    ctx.save();
    ctx.globalAlpha *= alpha;
    spriteLoader.drawSprite(ctx, spriteName, Math.round(cx - w / 2), Math.round(footY - (n.h - FOOT_PAD) * scale), w, h);
    ctx.restore();
}

/** Muted prompt that breathes slowly. */
export function drawHint(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, scale: number, t: number): void {
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = serif(17 * scale, true);
    const a = 0.55 + 0.15 * Math.sin(t * 2);
    shadowText(ctx, text, cx, y, `rgba(221,213,196,${a.toFixed(3)})`, 1);
    ctx.restore();
}

/** Row of small squares marking progress through a sequence of pages. */
export function drawProgressDots(
    ctx: CanvasRenderingContext2D,
    count: number,
    index: number,
    cx: number,
    y: number,
    scale: number
): void {
    const size = Math.max(3, Math.round(4 * scale));
    const gap = Math.round(10 * scale);
    const total = count * size + (count - 1) * gap;
    let x = Math.round(cx - total / 2);
    for (let i = 0; i < count; i++) {
        ctx.fillStyle = i === index ? GILT : i < index ? "rgba(201,168,104,0.45)" : "rgba(201,168,104,0.18)";
        ctx.fillRect(x, Math.round(y), size, size);
        x += size + gap;
    }
}
