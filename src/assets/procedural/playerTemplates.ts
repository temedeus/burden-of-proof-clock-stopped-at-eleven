/**
 * Hand-authored pixel templates for player frames (prototype).
 *
 * Rows are palette keys ('.' = transparent) drawn with `grid()`. Colours are
 * resolved from the HumanoidStyle so templates stay recolourable. Moving parts
 * (arms, skirt folds, feet) are layered per pose on top of the authored body.
 */
import { P } from "./palette";
import { grid, hline, p, r, shade } from "./pixel";
import type { CharacterFacing, CharacterPose, HumanoidStyle } from "./characters";

/**
 * Prototype switch: when true, female_detective front frames use the template
 * instead of the procedural body. Off until side/back templates exist, so
 * proportions stay consistent when the player turns.
 */
export const PLAYER_TEMPLATE_PROTOTYPE = false;

// Female detective, facing down. Head ~6px wide, narrow waist, 2px arms (arms are a separate layer).
const FEMALE_FRONT_UPPER = [
    "................................",
    "..............nNNN..............",
    ".............nNNNNN.............",
    "............RRRRRRRR............",
    "..........nNNNNNNNNNNk..........",
    "............HhhHHHHH............",
    "............HHhSSSsH............",
    "............HLeSSesH............",
    "............SSLSsSss............",
    ".............SSmmSs.............",
    "..............sSSs..............",
    "..............ssss..............",
    "..........jjJJcccCJJJk..........",
    "...........jJJJggJJJk...........",
    "...........kjjJAAJJkk...........",
    "...........kjjJJJJJkk...........",
    "...........kjjJJJJJkk...........",
    "............kjJJJJJk............",
    "............kjJJJJJk............",
    "............TTTTTTTT............"
];

/** Arm column pairs: sleeve rows repeat; cuff + 2 hand rows follow. */
const LEFT_ARM = { sleeve: "jJ", cuff: "cC", hand: ["LS", "Ss"] };
const RIGHT_ARM = { sleeve: "Jk", cuff: "cC", hand: ["Ss", "ss"] };

const SKIRT_TOP = 20;
const HEM_Y = 35;

function femalePalette(s: HumanoidStyle): Record<string, string> {
    const d = s.dress!;
    const skin = s.skin ?? P.skin;
    const hat = s.hat ?? s.hair;
    const collar = d.collar ?? P.cream;
    return {
        n: shade(hat, 0.2),
        N: hat,
        R: s.hatBand ?? hat,
        H: s.hair,
        h: shade(s.hair, 0.2),
        S: skin,
        s: shade(skin, -0.22),
        L: shade(skin, 0.18),
        e: shade(s.eyeColor ?? P.black, -0.4),
        m: shade(P.redLight, -0.2),
        c: collar,
        C: shade(collar, -0.2),
        j: d.bodiceLight,
        J: d.bodice,
        k: shade(d.bodice, -0.3),
        g: s.jewelry ?? collar,
        A: s.accent ?? d.bodice,
        T: d.trim ?? shade(d.bodice, -0.3)
    };
}

function femaleWalk(pose: CharacterPose): {
    bob: number;
    swingL: number;
    swingR: number;
    sway: number;
    footL: boolean;
    footR: boolean;
} {
    switch (pose) {
        case "walk_a":
            return { bob: 1, swingL: 1, swingR: -1, sway: -1, footL: true, footR: false };
        case "walk_b":
            return { bob: 0, swingL: 0, swingR: 0, sway: 0, footL: true, footR: true };
        case "walk_c":
            return { bob: 1, swingL: -1, swingR: 1, sway: 1, footL: false, footR: true };
        case "walk_d":
            return { bob: 0, swingL: 0, swingR: 0, sway: 0, footL: true, footR: true };
        default:
            return { bob: 0, swingL: 0, swingR: 0, sway: 0, footL: true, footR: true };
    }
}

function drawArm(
    ctx: CanvasRenderingContext2D,
    arm: typeof LEFT_ARM,
    x: number,
    top: number,
    swing: number,
    pal: Record<string, string>
): void {
    const rows: string[] = [];
    for (let i = 0; i < 7 + swing; i++) rows.push(arm.sleeve);
    rows.push(arm.cuff, ...arm.hand);
    grid(ctx, x, top, 1, rows, pal);
}

/** Bell skirt with lit pleat ridges; the waist is fixed and sway grows toward the hem. */
function drawPleatedSkirt(ctx: CanvasRenderingContext2D, s: HumanoidStyle, top: number, sway: number): void {
    const d = s.dress!;
    const ridge = d.skirtLight;
    for (let y = top; y <= HEM_Y; y++) {
        const t = (y - top) / (HEM_Y - top);
        const halfW = 5 + Math.round(t * 5);
        const left = 16 + Math.round(sway * t) - halfW;
        const w = halfW * 2;
        r(ctx, left, y, w, 1, d.skirt);
        r(ctx, left, y, 2, 1, d.skirtLight);
        r(ctx, left + w - 2, y, 2, 1, d.skirtShadow);
        if (t > 0.15) {
            for (const f of [0.36, 0.62]) {
                const fx = left + Math.round(w * f);
                p(ctx, fx, y, d.skirtShadow);
                p(ctx, fx - 1, y, ridge);
            }
        }
    }
    const hemLeft = 16 + sway - 10;
    if (d.trim) hline(ctx, hemLeft, HEM_Y, 20, d.trim);
}

function drawFemaleDetectiveFront(ctx: CanvasRenderingContext2D, s: HumanoidStyle, pose: CharacterPose): void {
    const pal = femalePalette(s);
    const w = femaleWalk(pose);
    const shoe = s.shoes ?? P.shoeBrown;

    // Ground shadow
    hline(ctx, 8, HEM_Y + 2, 16, "rgba(0,0,0,0.28)");
    hline(ctx, 10, HEM_Y + 3, 12, "rgba(0,0,0,0.28)");

    // Feet peeking under the hem
    if (w.footL) {
        r(ctx, 12 + w.sway, HEM_Y + 1, 3, 2, shoe);
        p(ctx, 13 + w.sway, HEM_Y + 1, shade(shoe, 0.3));
    }
    if (w.footR) {
        r(ctx, 17 + w.sway, HEM_Y + 1, 3, 2, shoe);
        p(ctx, 18 + w.sway, HEM_Y + 1, shade(shoe, 0.3));
    }

    drawPleatedSkirt(ctx, s, SKIRT_TOP + w.bob, w.sway);
    grid(ctx, 0, w.bob, 1, FEMALE_FRONT_UPPER, pal);
    drawArm(ctx, LEFT_ARM, 9, 13 + w.bob, w.swingL, pal);
    drawArm(ctx, RIGHT_ARM, 21, 13 + w.bob, w.swingR, pal);
}

/**
 * Draw a templated player frame if one exists for this sprite/facing.
 * Returns false when the caller should fall back to the procedural body.
 */
export function drawPlayerTemplateFrame(
    ctx: CanvasRenderingContext2D,
    sprite: string,
    style: HumanoidStyle,
    facing: CharacterFacing,
    pose: CharacterPose,
    force = PLAYER_TEMPLATE_PROTOTYPE
): boolean {
    if (!force) return false;
    if (sprite === "female_detective" && facing === "down" && style.dress) {
        drawFemaleDetectiveFront(ctx, style, pose);
        return true;
    }
    return false;
}

export { FEMALE_FRONT_UPPER };
