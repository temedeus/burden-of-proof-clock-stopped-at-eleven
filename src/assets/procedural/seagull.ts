import { P } from "./palette";
import { r } from "./pixel";

const GULL = {
    body: "#e8e4dc",
    bodyHi: "#f5f2ea",
    wing: "#d0ccc4",
    wingDark: "#9a968e",
    tip: "#4a4840",
    beak: P.gold,
    beakDark: P.goldDark,
    eye: "#1a1410",
    leg: "#c8a030"
};

/**
 * Side-view seagull facing `dir` (+1 right, -1 left).
 * `wingPhase` 0 = folded/gliding, 1 = wings fully up.
 */
export function drawSeagull(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    dir: 1 | -1,
    wingPhase: number,
    perched: boolean
): void {
    const cx = Math.floor(centerX);
    const cy = Math.floor(centerY);
    const flap = Math.max(0, Math.min(1, wingPhase));
    const wingLift = Math.round(flap * 7);
    const wingDrop = Math.round((1 - flap) * 2);

    ctx.save();
    ctx.translate(cx, cy);
    if (dir < 0) ctx.scale(-1, 1);

    // Body
    r(ctx, -6, -2, 12, 5, GULL.body);
    r(ctx, -5, -3, 10, 3, GULL.bodyHi);
    r(ctx, -4, 2, 8, 2, GULL.wing);

    // Tail
    r(ctx, -10, -1, 5, 3, GULL.wing);
    r(ctx, -11, 0, 3, 2, GULL.wingDark);

    // Head
    r(ctx, 4, -4, 5, 5, GULL.bodyHi);
    r(ctx, 7, -2, 2, 2, GULL.eye);
    r(ctx, 8, -1, 4, 2, GULL.beak);
    r(ctx, 10, -1, 2, 1, GULL.beakDark);

    // Near wing (animated)
    r(ctx, -3, -2 - wingLift, 9, 2, GULL.wing);
    r(ctx, -2, -3 - wingLift, 7, 2, GULL.bodyHi);
    r(ctx, 4, -2 - wingLift + wingDrop, 4, 2, GULL.wingDark);
    r(ctx, 6, -1 - wingLift + wingDrop, 3, 1, GULL.tip);

    // Far wing hint
    r(ctx, -1, 0 + Math.round(flap), 6, 1, GULL.wingDark);

    if (perched) {
        r(ctx, -2, 4, 2, 3, GULL.leg);
        r(ctx, 2, 4, 2, 3, GULL.leg);
        r(ctx, -3, 6, 3, 1, GULL.beakDark);
        r(ctx, 1, 6, 3, 1, GULL.beakDark);
    }

    ctx.restore();
}
