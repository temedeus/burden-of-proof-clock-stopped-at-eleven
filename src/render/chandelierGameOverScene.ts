/**
 * Game over vignette for the ballroom chandelier: the crystal trembles, the chain
 * snaps and the whole thing comes down on the detective, who is knocked flat and
 * buried under the wreck. Same chunky integer scale as the stabbing vignette.
 */
import type { PlayerSpriteName } from "@cse/content-schema";
import { spriteLoader } from "../assets/SpriteLoader";
import { HUMANOID_NATIVE_H, HUMANOID_NATIVE_W } from "../assets/procedural/characterAnimation";
import { drawChandelierWreck } from "../assets/procedural/ballroom";
import { drawBloodPool } from "./gameOverScene";

/** Chandelier sprite (native px): where the chain snaps, and the pendant's lowest row. */
const SPRITE_W = 48;
const SPRITE_H = 64;
const SNAP_ROW = 18;
const BODY_BOTTOM_ROW = 60;
/** Native px between the pendant and the detective's head while it hangs. */
const GAP = 10;

const SNAP_AT = 0.45;
/** Seconds the chandelier hits the floor — sync the crash sound to this. */
export const CHANDELIER_GAME_OVER_CRASH_AT = 0.95;
/** When the pendant reaches the detective's head (free fall from SNAP_AT to the floor). */
const HEAD_HIT_AT =
    SNAP_AT + (CHANDELIER_GAME_OVER_CRASH_AT - SNAP_AT) * Math.sqrt(GAP / (HUMANOID_NATIVE_H + GAP));
const TOPPLE_TIME = 0.18;
/** When the "Game Over" heading should start fading in. */
export const CHANDELIER_GAME_OVER_HEADING_AT = 2.2;

const CRYSTAL = ["#f4fbff", "#c8e4f0", "#9ccbe0", "#ffffff"];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (v: number) => 1 - (1 - v) * (1 - v);

/** Deterministic 0..1 per index, so particles don't flicker between frames. */
function hash(i: number): number {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

/** Plaster dust rolling outward along the floor from (cx, y); `t` seconds since the crash. */
function drawDust(ctx: CanvasRenderingContext2D, cx: number, y: number, s: number, t: number): void {
    if (t < 0 || t > 1.4) return;
    const fade = 1 - t / 1.4;
    for (let i = 0; i < 14; i++) {
        const dir = i % 2 ? 1 : -1;
        const reach = (20 + hash(i) * 26) * s * easeOut(clamp01(t / 0.9));
        const size = Math.round((2 + hash(i + 40) * 3 + t * 4) * (s / 1.5));
        const px = cx + dir * reach;
        const py = y - (hash(i + 80) * 8 + t * 10) * s;
        ctx.fillStyle = `rgba(200, 188, 164, ${(0.55 * fade).toFixed(3)})`;
        ctx.fillRect(Math.round(px - size / 2), Math.round(py - size / 2), size, size);
    }
}

/** Crystal drops bursting up and out from the impact, falling back to the floor. */
function drawShards(ctx: CanvasRenderingContext2D, cx: number, groundY: number, s: number, t: number): void {
    if (t < 0 || t > 0.9) return;
    ctx.save();
    ctx.globalAlpha = 1 - t / 0.9;
    for (let i = 0; i < 30; i++) {
        const a = hash(i) * Math.PI * 2;
        const speed = (30 + hash(i + 7) * 55) * s;
        const lift = (40 + hash(i + 13) * 55) * s;
        const x = cx + Math.cos(a) * speed * t;
        const y = Math.min(groundY, groundY - 6 * s + Math.sin(a) * speed * 0.3 * t - lift * t + 170 * s * t * t);
        ctx.fillStyle = CRYSTAL[i % CRYSTAL.length];
        ctx.fillRect(Math.round(x / s) * s, Math.round(y / s) * s, s, s);
    }
    ctx.restore();
}

/**
 * Draw the scene centred on `cx` with feet on `groundY`. `s` is the art pixel size.
 * Returns the white flash alpha (0..1) so the caller can light up the whole screen.
 */
export function drawChandelierGameOverScene(
    ctx: CanvasRenderingContext2D,
    t: number,
    cx: number,
    groundY: number,
    s: number,
    playerSprite: PlayerSpriteName
): number {
    const pw = HUMANOID_NATIVE_W * s;
    const ph = HUMANOID_NATIVE_H * s;
    const cw = SPRITE_W * s;
    const ch = SPRITE_H * s;
    const crashT = t - CHANDELIER_GAME_OVER_CRASH_AT;

    // Heavy jolt when it hits the floor
    const shake = crashT > 0 && crashT < 0.35 ? Math.round(Math.sin(crashT * 80) * s * 1.5 * (1 - crashT / 0.35)) : 0;

    ctx.save();
    ctx.translate(0, shake);
    ctx.imageSmoothingEnabled = false;

    // Candle glow from the chandelier, snuffed out as it falls
    const lit = 1 - clamp01((t - SNAP_AT) / 0.6);
    const glow = ctx.createRadialGradient(cx, groundY - ph, 4, cx, groundY - ph, pw * 2.6);
    glow.addColorStop(0, `rgba(150, 110, 60, ${(0.18 + 0.22 * lit).toFixed(3)})`);
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(cx - pw * 2.8, 0, pw * 5.6, groundY + ph * 0.4);

    // Hanging so the pendant sits GAP px above the detective's head
    const hangX = Math.round(cx - cw / 2);
    const hangY = Math.round(groundY - ph - GAP * s - BODY_BOTTOM_ROW * s);
    const cut = hangY + SNAP_ROW * s;
    const dropToFloor = groundY - (hangY + BODY_BOTTOM_ROW * s);
    const landed = crashT >= 0;

    // --- Detective: struck on the head, knocked back and flat ---
    const topple = easeOut(clamp01((t - HEAD_HIT_AT) / TOPPLE_TIME));
    const feetX = cx + topple * ph * 0.35;
    drawBloodPool(ctx, cx - ph * 0.45, groundY - s, s, clamp01((crashT - 0.5) / 1.8) * 0.8);
    ctx.save();
    ctx.translate(Math.round(feetX), groundY);
    ctx.rotate(-topple * (Math.PI / 2));
    spriteLoader.drawCharacterFrame(ctx, playerSprite, "down", "idle", -pw / 2, -ph, pw, ph);
    ctx.restore();

    // --- Chandelier ---
    // Ceiling rose and the snapped stub of chain stay put
    ctx.save();
    ctx.beginPath();
    ctx.rect(hangX, hangY, cw, cut - hangY);
    ctx.clip();
    spriteLoader.drawSprite(ctx, "chandelier", hangX, hangY, cw, ch);
    ctx.restore();

    if (!landed) {
        const jitter = t < SNAP_AT ? Math.round(Math.sin(t * 55) * s * (0.4 + t / SNAP_AT)) : 0;
        const fall = clamp01((t - SNAP_AT) / (CHANDELIER_GAME_OVER_CRASH_AT - SNAP_AT));
        const drop = Math.round((fall * fall * dropToFloor) / s) * s;
        ctx.save();
        ctx.translate(jitter, drop);
        ctx.beginPath();
        ctx.rect(hangX - 4 * s, cut, cw + 8 * s, ch);
        ctx.clip();
        spriteLoader.drawSprite(ctx, "chandelier", hangX, hangY, cw, ch);
        ctx.restore();
    } else {
        // Wreck art is authored at 2x; rescale to this scene's pixel size
        ctx.save();
        ctx.translate(Math.round(cx), Math.round(groundY - 2 * s));
        ctx.scale(s / 2, s / 2);
        drawChandelierWreck(ctx, 0, 0);
        ctx.restore();
    }

    // Loose crystal drops raining down the moment the chain gives way
    if (t >= SNAP_AT - 0.1 && !landed) {
        for (let i = 0; i < 6; i++) {
            const dt = t - SNAP_AT + 0.1 - i * 0.05;
            if (dt < 0) continue;
            const x = cx + (hash(i + 200) - 0.5) * cw * 0.8;
            const y = hangY + 30 * s + 220 * s * dt * dt;
            if (y > groundY) continue;
            ctx.fillStyle = CRYSTAL[i % CRYSTAL.length];
            ctx.fillRect(Math.round(x / s) * s, Math.round(y / s) * s, s, s * 2);
        }
    }

    drawDust(ctx, cx, groundY, s, crashT);
    drawShards(ctx, cx, groundY, s, crashT);
    ctx.restore();

    return crashT > 0 ? Math.max(0, 0.7 * (1 - crashT / 0.4)) : 0;
}
