/**
 * Game over vignette: Ytte closes in, raises the knife and stabs the detective,
 * who topples backwards into a spreading pool of blood. Sprites are the in-game
 * 32×40 frames drawn at a chunky integer scale.
 */
import type { PlayerSpriteName } from "@cse/content-schema";
import { spriteLoader } from "../assets/SpriteLoader";
import { getHumanoidFrame, HUMANOID_NATIVE_H, HUMANOID_NATIVE_W } from "../assets/procedural/characterAnimation";
import { getHumanoidStyle, type CharacterPose } from "../assets/procedural/characters";
import { getHoodedFrame } from "../assets/procedural/hoodedFigure";
import { drawKnifeAt, knifeHandAnchor } from "./knifeDraw";

export interface GameOverSceneInfo {
    playerSprite: PlayerSpriteName;
    /** Ytte's sprite when they caught you (masked or unmasked). */
    murdererSprite: string;
    /** What killed the detective; picks the vignette. Defaults to Ytte's knife. */
    cause?: "stabbed" | "chandelier";
}

/** Seconds until the stab lands — the heading fades in after the fall. */
const APPROACH_END = 0.75;
const RAISE_END = 1.05;
const STAB_AT = 1.15;
const FALL_START = 1.4;
const FALL_END = 1.9;
/** When the "Game Over" heading should start fading in. */
export const GAME_OVER_HEADING_AT = 2.1;

const BLOOD = "#7a1010";
const BLOOD_DARK = "#4e0808";
const BLOOD_HI = "#a82020";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (v: number) => 1 - (1 - v) * (1 - v);

const WALK: CharacterPose[] = ["walk_a", "walk_b", "walk_c", "walk_d"];

function murdererFrame(sprite: string, pose: CharacterPose): HTMLCanvasElement | null {
    if (sprite === "hooded_figure") return getHoodedFrame("right", pose);
    const style = getHumanoidStyle(sprite) ?? getHumanoidStyle("worker_man_grin");
    return style ? getHumanoidFrame(style, "right", pose) : null;
}

/** Blocky blood pool: stacked rows of an ellipse, `size` 0..1. */
export function drawBloodPool(ctx: CanvasRenderingContext2D, cx: number, y: number, s: number, size: number): void {
    if (size <= 0) return;
    const halfW = Math.round(22 * size);
    const rows = Math.max(1, Math.round(4 * size));
    for (let row = -rows; row <= rows; row++) {
        const span = Math.round(halfW * Math.sqrt(1 - (row / (rows + 1)) ** 2));
        ctx.fillStyle = row === -rows ? BLOOD_HI : row > rows / 2 ? BLOOD_DARK : BLOOD;
        ctx.fillRect(Math.round(cx - span * s), Math.round(y + row * s), span * 2 * s, s);
    }
}

/**
 * Draw the scene centred on `cx` with feet on `groundY`. `s` is the art pixel size.
 * Returns the red flash alpha (0..1) so the caller can tint the whole screen.
 */
export function drawGameOverScene(
    ctx: CanvasRenderingContext2D,
    t: number,
    cx: number,
    groundY: number,
    s: number,
    info: GameOverSceneInfo
): number {
    const w = HUMANOID_NATIVE_W * s;
    const h = HUMANOID_NATIVE_H * s;

    // Brief shake on impact
    const shakeT = t - STAB_AT;
    const shake = shakeT > 0 && shakeT < 0.25 ? Math.round(Math.sin(shakeT * 90) * s * (1 - shakeT / 0.25)) : 0;

    ctx.save();
    ctx.translate(shake, 0);
    ctx.imageSmoothingEnabled = false;

    // Lamp-lit floor glow
    const glow = ctx.createRadialGradient(cx, groundY, 4, cx, groundY, w * 2.2);
    glow.addColorStop(0, "rgba(120, 70, 40, 0.35)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(cx - w * 2.4, groundY - h * 1.3, w * 4.8, h * 1.6);

    // --- Detective (left, facing right) ---
    const playerLeft = Math.round(cx - w * 0.95);
    const playerFeetX = playerLeft + w / 2;
    // Stagger back a couple of pixels when stabbed, then topple backwards (counter-clockwise)
    const recoil = t >= STAB_AT ? Math.round(easeOut(clamp01((t - STAB_AT) / 0.2)) * 3) * s : 0;
    const fall = easeOut(clamp01((t - FALL_START) / (FALL_END - FALL_START)));

    drawBloodPool(ctx, playerFeetX - recoil - h * 0.42, groundY - s, s, clamp01((t - FALL_END + 0.2) / 1.6));

    ctx.save();
    ctx.translate(playerFeetX - recoil, groundY);
    ctx.rotate(-fall * (Math.PI / 2));
    spriteLoader.drawCharacterFrame(ctx, info.playerSprite, "right", "idle", -w / 2, -h, w, h);
    ctx.restore();

    // --- Ytte (right, facing left) ---
    const approach = easeOut(clamp01(t / APPROACH_END));
    const stabLunge = t >= RAISE_END ? easeOut(clamp01((t - RAISE_END) / (STAB_AT - RAISE_END))) : 0;
    const settle = t > STAB_AT + 0.35 ? easeOut(clamp01((t - STAB_AT - 0.35) / 0.4)) : 0;
    const lunge = (stabLunge - settle * 0.6) * 4 * s;
    // Close enough that the lunge drives the blade into the detective's chest
    const startLeft = cx + w * 1.4;
    const endLeft = playerLeft + 20 * s;
    const murdererLeft = Math.round(startLeft + (endLeft - startLeft) * approach - lunge);
    const walking = t < APPROACH_END;
    const pose = walking ? WALK[Math.floor(t * 8) % 4] : "idle";
    const frame = murdererFrame(info.murdererSprite, pose);

    // Knife angle (mirrored for facing left): guard → raised → driven forward → lowered
    const REST = 0.7;
    const RAISED = -0.9;
    const STAB = Math.PI / 2;
    let angle = REST;
    if (t >= APPROACH_END && t < RAISE_END) angle = REST + (RAISED - REST) * easeOut((t - APPROACH_END) / (RAISE_END - APPROACH_END));
    else if (t >= RAISE_END && t < STAB_AT) angle = RAISED + (STAB - RAISED) * ((t - RAISE_END) / (STAB_AT - RAISE_END)) ** 2;
    else if (t >= STAB_AT) angle = STAB + (2.4 - STAB) * settle;

    const hand = knifeHandAnchor(info.murdererSprite, "right");
    const handX = murdererLeft + (HUMANOID_NATIVE_W - hand.x) * s;
    const handY = groundY - h + hand.y * s;

    if (frame) {
        ctx.save();
        ctx.translate(murdererLeft + w, groundY - h);
        ctx.scale(-1, 1);
        ctx.drawImage(frame, 0, 0, w, h);
        ctx.restore();
    }
    drawKnifeAt(ctx, handX, handY, angle, true, s);

    // Blood dripping from the blade once it is drawn back
    if (t > STAB_AT + 0.4) {
        const tipLen = 13 * s;
        const tipX = handX - Math.sin(angle) * tipLen;
        const tipY = handY - Math.cos(angle) * tipLen;
        for (let i = 0; i < 3; i++) {
            const dropT = ((t - STAB_AT) * 1.3 + i / 3) % 1;
            ctx.fillStyle = BLOOD_HI;
            ctx.fillRect(Math.round(tipX), Math.round(tipY + dropT * (groundY - tipY)), s, s * 2);
        }
    }

    // Blood spray at the moment of impact
    if (shakeT > 0 && shakeT < 0.5) {
        const hitX = playerLeft + w * 0.62 - recoil;
        const hitY = groundY - h * 0.45;
        for (let i = 0; i < 9; i++) {
            const a = -Math.PI * 0.95 + (i / 8) * Math.PI * 0.7;
            const r = shakeT * (60 + i * 9) * (s / 3);
            const fallY = shakeT * shakeT * 220 * (s / 3);
            ctx.fillStyle = i % 2 ? BLOOD : BLOOD_HI;
            ctx.fillRect(Math.round(hitX + Math.cos(a) * r), Math.round(hitY + Math.sin(a) * r + fallY), s, s);
        }
    }
    ctx.restore();

    return shakeT > 0 ? Math.max(0, 0.55 * (1 - shakeT / 0.45)) : 0;
}
