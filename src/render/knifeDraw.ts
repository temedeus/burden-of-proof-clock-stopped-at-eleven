/**
 * Ytte's kitchen knife: small pixel-art blade rotated with nearest-neighbour
 * sampling (crisp pixels), animated as raise → stab → recover with a short
 * fading trail during the stab.
 */
import { P } from "../assets/procedural/palette";
import type { CharacterFacing } from "../assets/procedural/characters";
import { HOODED_HAND } from "../assets/procedural/hoodedFigure";

/** Knife hand in native humanoid pixels (unmasked Ytte), per baked facing. */
const HUMANOID_KNIFE_HAND: Record<CharacterFacing, { x: number; y: number }> = {
    down: { x: 24, y: 21 },
    up: { x: 7, y: 21 },
    right: { x: 17, y: 21 }
};

/** Where the knife handle sits on a 32×40 figure (hooded or unmasked), per baked facing. */
export function knifeHandAnchor(spriteName: string, facing: CharacterFacing): { x: number; y: number } {
    return (spriteName === "hooded_figure" ? HOODED_HAND : HUMANOID_KNIFE_HAND)[facing];
}

/** Native knife art: blade pointing up, handle at the bottom. */
const KNIFE_W = 5;
const KNIFE_H = 18;
/** Pivot (handle centre) in native knife pixels. */
const GRIP = { x: 2, y: 14 };

let knifeCanvas: HTMLCanvasElement | null = null;

function buildKnife(): HTMLCanvasElement {
    const c = document.createElement("canvas");
    c.width = KNIFE_W;
    c.height = KNIFE_H;
    const ctx = c.getContext("2d")!;
    const px = (x: number, y: number, w: number, h: number, color: string) => {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
    };
    // Blade: straight spine on the left, belly curving up to the point
    px(1, 0, 1, 1, "#e8eef4");
    px(1, 1, 2, 2, "#c8d2dc");
    px(1, 3, 3, 8, "#c8d2dc");
    px(1, 1, 1, 10, "#e8eef4");
    px(3, 3, 1, 8, "#5e6a76");
    px(2, 5, 1, 5, "#9aa6b2");
    // Steel bolster
    px(0, 11, 5, 1, "#7e8a96");
    // Wooden handle with brass rivets
    px(1, 12, 3, 6, P.woodDark);
    px(1, 12, 1, 6, "#6a4628");
    px(2, 13, 1, 1, P.gold);
    px(2, 16, 1, 1, P.gold);
    return c;
}

/** Knife angle (radians, 0 = blade straight up, + = clockwise) at cycle phase 0..1. */
export function knifeSwingAngle(phase: number): { angle: number; stabbing: boolean; stabFrom: number } {
    const REST = 0.7;
    const RAISED = -0.9;
    const STRUCK = 2.1;
    const ease = (t: number) => 1 - (1 - t) * (1 - t);
    if (phase < 0.45) {
        // Raise the knife up and back
        return { angle: REST + (RAISED - REST) * ease(phase / 0.45), stabbing: false, stabFrom: RAISED };
    }
    if (phase < 0.56) {
        // Stab: fast downward strike
        const t = (phase - 0.45) / 0.11;
        return { angle: RAISED + (STRUCK - RAISED) * t * t, stabbing: true, stabFrom: RAISED };
    }
    // Recover to a forward guard
    const t = (phase - 0.56) / 0.44;
    return { angle: STRUCK + (REST - STRUCK) * ease(t), stabbing: false, stabFrom: RAISED };
}

/** Knife at a fixed angle with its handle at (handX, handY) — for cutscenes. */
export function drawKnifeAt(
    ctx: CanvasRenderingContext2D,
    handX: number,
    handY: number,
    angle: number,
    mirror: boolean,
    scale = 2
): void {
    if (!knifeCanvas) knifeCanvas = buildKnife();
    const dir = mirror ? -1 : 1;
    ctx.save();
    ctx.translate(Math.round(handX), Math.round(handY));
    ctx.rotate(angle * dir);
    ctx.scale(scale * dir, scale);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(knifeCanvas, -GRIP.x, -GRIP.y);
    ctx.restore();
}

/**
 * Draw the swinging knife held at (handX, handY) in screen pixels. `mirror`
 * flips the swing for left-facing figures; `scale` matches the character pixel size.
 */
export function drawKnife(
    ctx: CanvasRenderingContext2D,
    handX: number,
    handY: number,
    phase: number,
    mirror: boolean,
    scale = 2
): void {
    const { angle, stabbing, stabFrom } = knifeSwingAngle(phase);
    const dir = mirror ? -1 : 1;
    const bladeLen = (GRIP.y + 1) * scale;

    // Motion trail: pale arc swept by the tip during the stab
    if (stabbing) {
        const steps = Math.max(2, Math.ceil(Math.abs(angle - stabFrom) / 0.1));
        for (let i = 0; i < steps; i++) {
            const a = stabFrom + ((angle - stabFrom) * i) / steps;
            const alpha = 0.08 + 0.4 * (i / steps);
            for (const rr of [bladeLen - scale * 2, bladeLen - scale * 5]) {
                const x = Math.round(handX + Math.sin(a) * rr * dir);
                const y = Math.round(handY - Math.cos(a) * rr);
                ctx.fillStyle = `rgba(225,236,248,${(alpha * (rr / bladeLen)).toFixed(3)})`;
                ctx.fillRect(x - scale / 2, y - scale / 2, scale, scale);
            }
        }
    }
    drawKnifeAt(ctx, handX, handY, angle, mirror, scale);
}
