/**
 * Ytte hauling the collapsed detective: his arm reaching back to grip the
 * detective's wrist, plus huffs of breath (and a cough of smoke) while he
 * pauses between heaves. Drawn on the 2px character pixel grid.
 */
import { P } from "../assets/procedural/palette";

const PX = 2;
const SLEEVE = P.coatGray;
const SLEEVE_DARK = "#3a3c40";

function snap(v: number): number {
    return Math.round(v / PX) * PX;
}

export function drawDragGrip(
    ctx: CanvasRenderingContext2D,
    ytteBox: { x: number; y: number; w: number; h: number },
    playerX: number,
    playerY: number,
    dir: { x: number; y: number },
    pauseT: number,
    t: number
): void {
    // Shoulder on the side facing the detective (behind him, against the direction of travel)
    const sx = ytteBox.x + ytteBox.w / 2 - dir.x * ytteBox.w * 0.22;
    const sy = ytteBox.y + ytteBox.h * 0.42;
    const len = Math.hypot(playerX - sx, playerY - sy);
    const steps = Math.max(1, Math.round(len / PX));
    for (let i = 0; i <= steps; i++) {
        const k = i / steps;
        // Slight sag in the arm under the load
        const x = snap(sx + (playerX - sx) * k);
        const y = snap(sy + (playerY - sy) * k + Math.sin(k * Math.PI) * 3);
        ctx.fillStyle = SLEEVE_DARK;
        ctx.fillRect(x - PX, y + PX, PX * 2, PX);
        ctx.fillStyle = SLEEVE;
        ctx.fillRect(x - PX, y, PX * 2, PX);
    }
    // Hand clamped around the wrist
    ctx.fillStyle = P.skin;
    ctx.fillRect(snap(playerX) - PX * 2, snap(playerY) - PX, PX * 3, PX * 2);
    ctx.fillStyle = P.skinShadow;
    ctx.fillRect(snap(playerX) - PX * 2, snap(playerY) + PX, PX * 3, PX);

    // Between heaves: laboured breaths rising from his mouth, the last one a cough of smoke
    if (pauseT > 0) {
        const mx = ytteBox.x + ytteBox.w / 2;
        const my = ytteBox.y + ytteBox.h * 0.22;
        for (let i = 0; i < 3; i++) {
            const k = (pauseT * 1.4 + i * 0.33) % 1;
            const alpha = 0.55 * (1 - k);
            const size = PX * (1 + Math.round(k * 2));
            const px = snap(mx + Math.sin(t * 3 + i) * 3 + (i - 1) * 4);
            const py = snap(my - k * 18);
            ctx.fillStyle = i === 2 ? `rgba(70,64,60,${alpha.toFixed(3)})` : `rgba(230,230,230,${alpha.toFixed(3)})`;
            ctx.fillRect(px, py, size, size);
        }
    }
}
