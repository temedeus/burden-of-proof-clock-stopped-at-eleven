/**
 * The masked murderer (Ytte in disguise): a long hooded wool cloak with a pale
 * porcelain mask inside the hood. 32x40 native, drawn at 2x like characters,
 * with front/back/side views and a four-frame walk (cloak hem swings).
 */
import { discCrisp, hline, p, r, vline } from "./pixel";
import { ellipse } from "./furnitureKit";
import type { CharacterFacing, CharacterPose } from "./characters";

export const HOODED_NATIVE_W = 32;
export const HOODED_NATIVE_H = 40;

const CLOAK = { o: "#0a080a", d: "#16121a", m: "#262028", l: "#38303a", h: "#4a404c" };
const VOID = "#050406";
const MASK = { l: "#efe8d6", m: "#d8d0bc", d: "#aaa08a", eye: "#0c0a0c" };
const GLOVE = { d: "#1e140e", m: "#33241a" };
const BOOT = "#140e0a";
const IRON = { d: "#4a5056", l: "#8a9298" };

/** Hand anchor (native px) where the sword grip sits, per facing. */
export const HOODED_HAND: Record<"down" | "up" | "right", { x: number; y: number }> = {
    down: { x: 24, y: 23 },
    up: { x: 8, y: 23 },
    right: { x: 22, y: 22 }
};

function walk(pose: CharacterPose): { bob: number; sway: number; footL: number; footR: number } {
    switch (pose) {
        case "walk_a":
            return { bob: 1, sway: -1, footL: 1, footR: -1 };
        case "walk_b":
            return { bob: 0, sway: 0, footL: 0, footR: -1 };
        case "walk_c":
            return { bob: 1, sway: 1, footL: -1, footR: 1 };
        case "walk_d":
            return { bob: 0, sway: 0, footL: -1, footR: 0 };
        default:
            return { bob: 0, sway: 0, footL: 0, footR: 0 };
    }
}

/** Cloak body from the shoulders to the hem: widening trapezoid with folds. */
function cloakBody(ctx: CanvasRenderingContext2D, top: number, bottom: number, sway: number, back: boolean): void {
    for (let y = top; y <= bottom; y++) {
        const t = (y - top) / (bottom - top);
        const half = Math.round(6 + t * 5);
        const shift = Math.round(sway * t * t);
        const x0 = 16 - half + shift;
        const w = half * 2;
        hline(ctx, x0, y, w, CLOAK.m);
        p(ctx, x0, y, CLOAK.o);
        p(ctx, x0 + w - 1, y, CLOAK.o);
        // Lit left side, shadowed right side
        p(ctx, x0 + 1, y, CLOAK.l);
        if (w > 6) p(ctx, x0 + 2, y, CLOAK.h);
        hline(ctx, x0 + w - 3, y, 2, CLOAK.d);
        // Long vertical folds that open out toward the hem
        if (t > 0.15) {
            for (const f of [0.3, 0.5, 0.72]) p(ctx, Math.round(x0 + w * f), y, CLOAK.d);
            p(ctx, Math.round(x0 + w * 0.3) - 1, y, CLOAK.l);
        }
        if (!back && t > 0.05) p(ctx, 16 + shift, y, CLOAK.o);
    }
    // Ragged hem
    for (let x = 6; x < 26; x += 3) p(ctx, x + Math.round(sway), bottom + 1, CLOAK.d);
}

function shadow(ctx: CanvasRenderingContext2D): void {
    hline(ctx, 7, 37, 18, "rgba(0,0,0,0.3)");
    hline(ctx, 9, 38, 14, "rgba(0,0,0,0.3)");
}

function feet(ctx: CanvasRenderingContext2D, w: ReturnType<typeof walk>): void {
    // Boot toes peeking under the hem (the stepping foot shows)
    if (w.footL >= 0) r(ctx, 11 + w.sway, 35 + w.footL, 4, 2, BOOT);
    if (w.footR >= 0) r(ctx, 17 + w.sway, 35 + w.footR, 4, 2, BOOT);
}

function drawFront(ctx: CanvasRenderingContext2D, pose: CharacterPose): void {
    const w = walk(pose);
    const b = w.bob;
    shadow(ctx);
    feet(ctx, w);
    cloakBody(ctx, 13 + b, 35, w.sway, false);
    // Gloved hands emerging from the cloak
    r(ctx, 6, 21 + b, 3, 3, GLOVE.m);
    p(ctx, 6, 21 + b, GLOVE.d);
    r(ctx, 23, 21 + b, 3, 3, GLOVE.m);
    p(ctx, 25, 23 + b, GLOVE.d);
    // Hood: rounded cowl with a forward peak
    ellipse(ctx, 16, 8 + b, 8, 7.5, CLOAK.o);
    ellipse(ctx, 16, 8 + b, 7, 6.5, CLOAK.m);
    hline(ctx, 11, 2 + b, 6, CLOAK.h);
    p(ctx, 16, 0 + b, CLOAK.o);
    p(ctx, 16, 1 + b, CLOAK.m);
    // Hood rim fold + the void inside
    ellipse(ctx, 16, 9 + b, 5, 5, CLOAK.l);
    ellipse(ctx, 16, 9.5 + b, 4, 4.5, VOID);
    // Porcelain mask, top half in the hood's shadow
    ellipse(ctx, 16, 10.5 + b, 3, 3.5, MASK.m);
    ellipse(ctx, 15.5, 11 + b, 2, 2.5, MASK.l);
    hline(ctx, 13, 8 + b, 6, MASK.d);
    // Slanted eye slits + nose ridge
    hline(ctx, 14, 10 + b, 2, MASK.eye);
    hline(ctx, 17, 10 + b, 2, MASK.eye);
    p(ctx, 13, 9 + b, MASK.d);
    p(ctx, 19, 9 + b, MASK.d);
    p(ctx, 16, 11 + b, MASK.d);
    p(ctx, 16, 13 + b, MASK.d);
    // Iron cloak clasp at the throat
    discCrisp(ctx, 16, 15 + b, 1, IRON.d);
    p(ctx, 15, 14 + b, IRON.l);
}

function drawBack(ctx: CanvasRenderingContext2D, pose: CharacterPose): void {
    const w = walk(pose);
    const b = w.bob;
    shadow(ctx);
    feet(ctx, w);
    cloakBody(ctx, 13 + b, 35, w.sway, true);
    // Hands at the sides
    r(ctx, 6, 21 + b, 3, 3, GLOVE.m);
    r(ctx, 23, 21 + b, 3, 3, GLOVE.m);
    // Hood seen from behind: rounded, with a point and a centre seam
    ellipse(ctx, 16, 8 + b, 8, 7.5, CLOAK.o);
    ellipse(ctx, 16, 8 + b, 7, 6.5, CLOAK.m);
    ellipse(ctx, 14, 6 + b, 4, 3, CLOAK.l);
    vline(ctx, 16, 2 + b, 12, CLOAK.d);
    p(ctx, 16, 0 + b, CLOAK.o);
    // Hood drape onto the shoulders
    hline(ctx, 10, 14 + b, 12, CLOAK.d);
}

function drawSide(ctx: CanvasRenderingContext2D, pose: CharacterPose): void {
    const w = walk(pose);
    const b = w.bob;
    shadow(ctx);
    // Stepping boot at the front
    r(ctx, 17 + Math.max(0, w.footL) * 2, 35, 5, 2, BOOT);
    // Cloak in profile: chest straight, back billowing out behind (left)
    for (let y = 13 + b; y <= 35; y++) {
        const t = (y - 13 - b) / (22 - b);
        const back = Math.round(t * 6 + Math.abs(w.sway) * t * 2);
        const x0 = 11 - back;
        const x1 = 21 + Math.round(t * 2);
        hline(ctx, x0, y, x1 - x0, CLOAK.m);
        p(ctx, x0, y, CLOAK.o);
        p(ctx, x1 - 1, y, CLOAK.o);
        p(ctx, x0 + 1, y, CLOAK.l);
        if (t > 0.2) {
            p(ctx, Math.round(x0 + (x1 - x0) * 0.35), y, CLOAK.d);
            p(ctx, Math.round(x0 + (x1 - x0) * 0.62), y, CLOAK.d);
        }
        hline(ctx, x1 - 3, y, 2, CLOAK.d);
    }
    // Arm reaching forward
    r(ctx, 17, 17 + b, 5, 4, CLOAK.d);
    hline(ctx, 17, 17 + b, 5, CLOAK.l);
    r(ctx, 21, 20 + b, 3, 3, GLOVE.m);
    // Hood in profile: point overhanging the face
    ellipse(ctx, 15, 8 + b, 7.5, 7, CLOAK.o);
    ellipse(ctx, 15, 8 + b, 6.5, 6, CLOAK.m);
    ellipse(ctx, 13, 6 + b, 4, 3, CLOAK.l);
    // Forward brim + shadowed opening
    r(ctx, 19, 4 + b, 4, 3, CLOAK.m);
    p(ctx, 22, 4 + b, CLOAK.o);
    r(ctx, 19, 7 + b, 3, 7, VOID);
    // Mask profile catching the light under the brim
    vline(ctx, 21, 9 + b, 4, MASK.m);
    vline(ctx, 22, 10 + b, 2, MASK.l);
    p(ctx, 21, 10 + b, MASK.eye);
    p(ctx, 22, 12 + b, MASK.d);
    // Clasp
    p(ctx, 20, 15 + b, IRON.l);
}

/** Draw one frame (facing `right` is mirrored for `left` by the caller). */
export function drawHoodedFrame(ctx: CanvasRenderingContext2D, facing: CharacterFacing, pose: CharacterPose): void {
    if (facing === "up") drawBack(ctx, pose);
    else if (facing === "right") drawSide(ctx, pose);
    else drawFront(ctx, pose);
}

const frameCache = new Map<string, HTMLCanvasElement>();

/** Baked frame for runtime drawing. */
export function getHoodedFrame(facing: CharacterFacing, pose: CharacterPose): HTMLCanvasElement {
    const key = `${facing}:${pose}`;
    let canvas = frameCache.get(key);
    if (!canvas) {
        canvas = document.createElement("canvas");
        canvas.width = HOODED_NATIVE_W;
        canvas.height = HOODED_NATIVE_H;
        const ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingEnabled = false;
        drawHoodedFrame(ctx, facing, pose);
        frameCache.set(key, canvas);
    }
    return canvas;
}
