import { P } from "./palette";
import { r } from "./pixel";

const MOUSE = {
    body: "#6a6258",
    bodyHi: "#8a8278",
    bodyDark: "#4a443c",
    ear: "#c8a0a0",
    nose: "#e8c8c0",
    tail: "#9a9088",
    eye: "#1a1410"
};

/** Pixel Y of the beam walking surface inside a roof-bar tile row. */
export const ATTIC_BEAM_SURFACE_Y_OFFSET = 14;

/** Top-down mouse scurrying along a horizontal beam (faces left or right). */
export function drawAtticMouse(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    dir: 1 | -1,
    animTime: number,
    running: boolean
): void {
    const cx = Math.floor(centerX);
    const cy = Math.floor(centerY);
    const leg = running ? Math.sin(animTime * 22) * 1.2 : 0;
    const tailWave = running ? Math.sin(animTime * 14) * 2.5 : Math.sin(animTime * 1.8) * 0.8;
    const bob = running ? Math.abs(Math.sin(animTime * 22)) * 0.6 : 0;

    const bodyX = cx + (dir > 0 ? -5 : -3);
    const bodyY = cy - 3 - bob;

    // Tail trails behind
    const tailStart = dir > 0 ? bodyX - 1 : bodyX + 9;
    for (let i = 0; i < 5; i++) {
        const tx = tailStart + (dir > 0 ? -i * 2 : i * 2);
        const ty = cy + 1 + Math.sin(i * 0.9 + tailWave * 0.3) * (1 + i * 0.2);
        r(ctx, tx, ty, 1, 1, i < 2 ? MOUSE.tail : P.mid);
    }

    // Feet (only when running)
    if (running) {
        r(ctx, bodyX + 1, cy + 2 + leg, 2, 1, MOUSE.bodyDark);
        r(ctx, bodyX + 6, cy + 2 - leg, 2, 1, MOUSE.bodyDark);
    }

    // Body
    r(ctx, bodyX, bodyY + 1, 9, 5, MOUSE.bodyDark);
    r(ctx, bodyX + 1, bodyY, 7, 5, MOUSE.body);
    r(ctx, bodyX + 2, bodyY + 1, 4, 2, MOUSE.bodyHi);

    // Ears
    const earX = dir > 0 ? bodyX + 7 : bodyX;
    r(ctx, earX, bodyY - 1, 2, 2, MOUSE.ear);
    r(ctx, earX + (dir > 0 ? -2 : 2), bodyY, 2, 2, MOUSE.ear);

    // Head / nose
    const noseX = dir > 0 ? bodyX + 8 : bodyX - 1;
    r(ctx, noseX, bodyY + 2, 2, 2, MOUSE.nose);
    r(ctx, dir > 0 ? noseX + 1 : noseX, bodyY + 2, 1, 1, MOUSE.eye);
}
