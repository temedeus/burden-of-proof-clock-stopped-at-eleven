/**
 * The masked murderer's sword: a small pixel-art blade rotated with
 * nearest-neighbour sampling (crisp pixels), animated as wind-up → slash →
 * recover with a fading arc trail during the slash.
 */
import { P } from "../assets/procedural/palette";

/** Native sword art: blade pointing up, grip at the bottom. */
const SWORD_W = 7;
const SWORD_H = 30;
/** Pivot (grip centre) in native sword pixels. */
const GRIP = { x: 3, y: 25 };

let swordCanvas: HTMLCanvasElement | null = null;

function buildSword(): HTMLCanvasElement {
    const c = document.createElement("canvas");
    c.width = SWORD_W;
    c.height = SWORD_H;
    const ctx = c.getContext("2d")!;
    const px = (x: number, y: number, w: number, h: number, color: string) => {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
    };
    // Blade: lit edge, fuller, shadowed edge, tapered tip
    px(3, 0, 1, 1, "#e8eef4");
    px(2, 1, 3, 1, "#c8d2dc");
    px(2, 2, 1, 19, "#e8eef4");
    px(3, 2, 1, 19, "#9aa6b2");
    px(4, 2, 1, 19, "#5e6a76");
    px(3, 5, 1, 12, "#7e8a96");
    // Crossguard (brass, curled quillons)
    px(0, 21, 7, 2, P.goldDark);
    px(0, 21, 7, 1, P.gold);
    px(0, 20, 1, 1, P.gold);
    px(6, 23, 1, 1, P.goldDark);
    // Leather-wrapped grip
    px(2, 23, 3, 5, "#3a2418");
    px(2, 24, 3, 1, "#5a3a24");
    px(2, 26, 3, 1, "#5a3a24");
    // Pommel
    px(2, 28, 3, 2, P.goldDark);
    px(2, 28, 2, 1, P.gold);
    return c;
}

/** Sword angle (radians, 0 = blade straight up, + = clockwise) at cycle phase 0..1. */
export function swordSwingAngle(phase: number): { angle: number; slashing: boolean; slashFrom: number } {
    const REST = 0.5;
    const RAISED = -1.9;
    const STRUCK = 2.3;
    const ease = (t: number) => 1 - (1 - t) * (1 - t);
    if (phase < 0.4) {
        // Wind-up: lift the blade back over the shoulder
        return { angle: REST + (RAISED - REST) * ease(phase / 0.4), slashing: false, slashFrom: RAISED };
    }
    if (phase < 0.52) {
        // Slash: fast downward arc
        const t = (phase - 0.4) / 0.12;
        return { angle: RAISED + (STRUCK - RAISED) * t * t, slashing: true, slashFrom: RAISED };
    }
    // Follow-through and recover to guard
    const t = (phase - 0.52) / 0.48;
    return { angle: STRUCK + (REST - STRUCK) * ease(t), slashing: false, slashFrom: RAISED };
}

/**
 * Draw the sword held at (handX, handY) in screen pixels. `mirror` flips the
 * swing for left-facing figures; `scale` matches the character pixel size.
 */
export function drawSword(
    ctx: CanvasRenderingContext2D,
    handX: number,
    handY: number,
    phase: number,
    mirror: boolean,
    scale = 2
): void {
    if (!swordCanvas) swordCanvas = buildSword();
    const { angle, slashing, slashFrom } = swordSwingAngle(phase);
    const dir = mirror ? -1 : 1;
    const bladeLen = (GRIP.y + 1) * scale;

    ctx.save();
    ctx.translate(Math.round(handX), Math.round(handY));
    // Motion trail: pale arc swept by the tip during the slash
    if (slashing) {
        const steps = Math.max(2, Math.ceil(Math.abs(angle - slashFrom) / 0.08));
        for (let i = 0; i < steps; i++) {
            const a = slashFrom + ((angle - slashFrom) * i) / steps;
            const alpha = 0.08 + 0.45 * (i / steps);
            for (const rr of [bladeLen - scale * 2, bladeLen - scale * 6, bladeLen - scale * 10]) {
                const x = Math.round(Math.sin(a) * rr * dir);
                const y = Math.round(-Math.cos(a) * rr);
                ctx.fillStyle = `rgba(225,236,248,${(alpha * (rr / bladeLen)).toFixed(3)})`;
                ctx.fillRect(x - scale / 2, y - scale / 2, scale, scale);
            }
        }
    }
    ctx.rotate(angle * dir);
    ctx.scale(scale * dir, scale);
    const prev = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(swordCanvas, -GRIP.x, -GRIP.y);
    ctx.imageSmoothingEnabled = prev;
    ctx.restore();
}
