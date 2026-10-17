/**
 * Victory close-up: only hands. Ytte's forearms reach in from the left, wrists
 * together and pointing forward; the officer's white-gloved hands come in from
 * the right with a pair of old iron cuffs and snap them shut, one wrist at a time.
 * Drawn in chunky art pixels around the screen centre.
 */
import { P } from "../assets/procedural/palette";

/** Cuff snap times (seconds into the scene) — the caller plays a click on each. */
export const CUFF_CLICK_TIMES = [2.05, 2.65];
/** When the "Case Closed" text starts fading in. */
export const ARREST_TEXT_AT = 3.6;
/** When the scene is done and the return-to-menu prompt shows. */
export const ARREST_PROMPT_AT = 4.6;

const IRON = "#4a4a54";
const IRON_DARK = "#2a2a32";
const IRON_HI = "#9a9aa8";
const GLOVE = "#ece6da";
const GLOVE_SHADE = "#c4bcac";
const SKIN = P.skin;
const SKIN_SHADE = "#a87c5a";
const SKIN_HI = "#dcb08a";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (v: number) => 1 - (1 - v) * (1 - v);
const easeInOut = (v: number) => (v < 0.5 ? 2 * v * v : 1 - (-2 * v + 2) ** 2 / 2);

type Px = (x: number, y: number, w: number, h: number, color: string) => void;

/** Ytte's forearm (grey cook's coat), wrist and hand, fingers pointing right. */
function drawYtteArm(px: Px, ox: number, oy: number, bandaged: boolean): void {
    // Sleeve from off-screen to the rolled cuff
    px(ox - 52, oy - 1, 36, 7, P.coatGray);
    px(ox - 52, oy - 1, 36, 1, P.coatGrayLight);
    px(ox - 52, oy + 5, 36, 1, "#303036");
    px(ox - 18, oy - 2, 4, 9, P.coatGrayLight);
    px(ox - 18, oy + 6, 4, 1, P.coatGray);
    // Wrist
    px(ox - 14, oy, 10, 5, SKIN);
    px(ox - 14, oy + 4, 10, 1, SKIN_SHADE);
    // Back of the hand, thumb on top, fingers extended forward
    px(ox - 4, oy - 1, 8, 7, SKIN);
    px(ox - 4, oy - 1, 8, 1, SKIN_HI);
    px(ox - 2, oy - 3, 5, 2, SKIN);
    px(ox - 2, oy - 3, 5, 1, SKIN_HI);
    for (let i = 0; i < 4; i++) {
        const len = i === 0 || i === 3 ? 5 : 6;
        px(ox + 4, oy - 1 + i * 2, len, 1, SKIN);
        px(ox + 4, oy + i * 2, len - 1, 1, SKIN_SHADE);
    }
    if (bandaged) {
        // Linen dressing from the attic fall
        px(ox - 4, oy, 7, 4, P.maidWhite);
        px(ox - 4, oy + 1, 7, 1, P.cream);
        px(ox - 1, oy - 1, 1, 6, P.cream);
    }
}

/** One cuff band around a wrist at (x, top); `open` 0..1 swings the jaw away. */
function drawCuff(px: Px, x: number, top: number, height: number, open: number, flash: number): void {
    const jawShift = Math.round(open * 4);
    const half = Math.floor(height / 2);
    // Fixed half (bottom) and hinged jaw (top)
    px(x, top + half, 3, height - half, IRON);
    px(x, top + half, 1, height - half, IRON_HI);
    px(x + jawShift, top - jawShift, 3, half, IRON);
    px(x + jawShift, top - jawShift, 1, half, IRON_HI);
    px(x + 2 + jawShift, top - jawShift, 1, half, IRON_DARK);
    // Keyhole boss on the band
    px(x + 3, top + half, 2, 3, IRON);
    px(x + 4, top + half + 1, 1, 1, IRON_DARK);
    if (flash > 0) px(x - 1, top - 1, 5, height + 2, `rgba(255,250,230,${(flash * 0.8).toFixed(3)})`);
}

/** The officer's navy sleeve and white glove, reaching in from the right to (gx, gy). */
function drawOfficerArm(px: Px, gx: number, gy: number, above: boolean): void {
    // Sleeve with brass-buttoned cuff
    px(gx + 7, gy, 36, 7, P.policeBlue);
    px(gx + 7, above ? gy : gy + 6, 36, 1, "#2c3c64");
    px(gx + 7, gy - 1, 4, 9, "#24345c");
    px(gx + 8, gy + 1, 1, 1, P.policeGold);
    px(gx + 8, gy + 5, 1, 1, P.policeGold);
    // Glove: palm, then fingers curled toward the cuff
    px(gx, gy, 8, 7, GLOVE);
    px(gx, above ? gy + 6 : gy, 8, 1, GLOVE_SHADE);
    const fy = above ? gy + 7 : gy - 3;
    for (let i = 0; i < 3; i++) px(gx + 1 + i * 2, fy, 1, 3, i === 1 ? GLOVE_SHADE : GLOVE);
    px(gx - 1, above ? gy + 2 : gy + 2, 1, 3, GLOVE_SHADE);
}

/**
 * Draw the arrest close-up at scene time `t`, centred on (cx, cy), `s` = art pixel size.
 */
export function drawArrestScene(ctx: CanvasRenderingContext2D, t: number, cx: number, cy: number, s: number): void {
    const px: Px = (x, y, w, h, color) => {
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(cx + x * s), Math.round(cy + y * s), Math.round(w * s), Math.round(h * s));
    };

    ctx.save();
    ctx.globalAlpha = clamp01(t / 0.5);

    // Lamplight pooled on the hands
    const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, s * 45);
    glow.addColorStop(0, "rgba(150, 100, 50, 0.32)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(cx - s * 50, cy - s * 30, s * 100, s * 60);

    // Impact shake on each click
    let shake = 0;
    for (const at of CUFF_CLICK_TIMES) {
        const d = t - at;
        if (d > 0 && d < 0.15) shake = Math.round(Math.sin(d * 120) * (1 - d / 0.15) * s);
    }
    ctx.translate(shake, 0);

    // Ytte slides in and trembles until both cuffs are on
    const ytteIn = easeOut(clamp01((t - 0.2) / 0.9));
    const cuffed = t >= CUFF_CLICK_TIMES[1];
    const tremble = cuffed ? 0 : Math.round(Math.sin(t * 47) * 0.6);
    // Officer's tug after cuffing pulls everything right, then settles
    const tug = t > 3.0 ? Math.sin(clamp01((t - 3.0) / 0.45) * Math.PI) * 4 : 0;
    const ytteX = -Math.round((1 - ytteIn) * 60) + Math.round(tug);

    const upperY = -9;
    const lowerY = 3;
    drawYtteArm(px, ytteX + tremble, upperY, false);
    drawYtteArm(px, ytteX + 1 - tremble, lowerY, true);

    // Officer's hands carry the open cuffs in from the right, then close them
    const officerIn = easeInOut(clamp01((t - 0.8) / 1.0));
    const officerX = Math.round((1 - officerIn) * 60) + Math.round(tug);
    const cuffX = -11 + officerX;
    const openFor = (at: number) => 1 - clamp01((t - (at - 0.12)) / 0.12);
    const flashFor = (at: number) => (t >= at && t < at + 0.12 ? 1 - (t - at) / 0.12 : 0);
    const [firstClick, secondClick] = CUFF_CLICK_TIMES;

    // Chain links between the two cuffs
    for (let i = 0; i < 3; i++) {
        px(cuffX + 1 + (i % 2), upperY + 6 + i * 2, 2, 2, i % 2 ? IRON_DARK : IRON);
        px(cuffX + 1 + (i % 2), upperY + 6 + i * 2, 1, 1, IRON_HI);
    }
    drawCuff(px, cuffX, upperY - 1, 7, openFor(firstClick), flashFor(firstClick));
    drawCuff(px, cuffX + 1, lowerY - 1, 7, openFor(secondClick), flashFor(secondClick));

    // Upper glove grips the top cuff from above, lower glove the bottom cuff from below
    drawOfficerArm(px, cuffX + 1, upperY - 11, true);
    drawOfficerArm(px, cuffX + 2, lowerY + 9, false);

    // Vignette so the sleeves fade into the dark instead of running to the screen edge
    ctx.translate(-shake, 0);
    const vignette = ctx.createRadialGradient(cx, cy, s * 20, cx, cy, s * 44);
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, "rgba(0, 0, 0, 1)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.restore();
}
