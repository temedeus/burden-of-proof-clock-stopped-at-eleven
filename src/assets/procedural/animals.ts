import { P } from "./palette";
import { hline, p, r, shade, vline } from "./pixel";
import { ellipse, seeded, WOOD } from "./furnitureKit";
import type { ProceduralSpriteDef } from "./types";

export interface HorsePalette {
    coat: string;
    light: string;
    mid: string;
    dark: string;
    mane: string;
    blaze?: string;
    socks?: boolean;
    /** Lighter rings on the body (dapple grey). */
    dapple?: boolean;
    /** Idle temperament, matching the stall description. */
    temper: "restless" | "stamping" | "dozing";
}

export const HORSE_PALETTES: Record<string, HorsePalette> = {
    stable_booth: {
        coat: "#8a5232",
        light: "#ad6e44",
        mid: "#6e3e24",
        dark: "#4e2a18",
        mane: "#5a2c16",
        temper: "restless"
    },
    stable_booth_bay: {
        coat: "#6a3a22",
        light: "#8a5232",
        mid: "#52301c",
        dark: "#3a2014",
        mane: "#16100c",
        blaze: P.cream,
        socks: true,
        temper: "stamping"
    },
    stable_booth_gray: {
        coat: "#8e8c88",
        light: "#b4b2ac",
        mid: "#74726e",
        dark: "#56544f",
        mane: "#cfccc4",
        blaze: "#dedad2",
        dapple: true,
        temper: "dozing"
    }
};

const BOOTH_NATIVE_W = 96;
const BOOTH_NATIVE_H = 128;
/** Ground line the hooves stand on. */
const G = 101;

/** Stable phase offset from tile position so each horse animates on its own schedule. */
export function horseAnimPhase(tileX: number, tileY: number): number {
    return (tileX * 2.17 + tileY * 3.71) % (Math.PI * 2);
}

interface HorsePose {
    /** 0 = head up, 1 = head lowered toward the straw. */
    headDrop: number;
    /** Head toss lift in px (negative = up). */
    toss: number;
    tailSway: number;
    blink: boolean;
    earBack: boolean;
    /** Near foreleg lift in px (stamping). */
    hoofLift: number;
}

function cyc(t: number, period: number): number {
    return ((t % period) + period) % period;
}

export function getHorsePose(animTime: number, phase: number, temper: HorsePalette["temper"]): HorsePose {
    const t = animTime + phase * 3.1;
    const dozing = temper === "dozing";

    // Tail: slow sway with an occasional sharper swish at flies
    const swish = cyc(t, 6.5 + phase) < 0.6 ? Math.sin((cyc(t, 6.5 + phase) / 0.6) * Math.PI * 2) * 3 : 0;
    const tailSway = Math.sin(t * (dozing ? 0.8 : 1.4)) * (dozing ? 0.8 : 1.5) + (dozing ? 0 : swish);

    // Grazing: lower the head to the straw now and then
    const graze = cyc(t, dozing ? 30 : 11 + phase);
    let headDrop = 0;
    if (!dozing && graze > 6 && graze < 9.5) {
        const k = graze < 6.6 ? (graze - 6) / 0.6 : graze > 8.9 ? (9.5 - graze) / 0.6 : 1;
        headDrop = Math.max(0, Math.min(1, k));
    }
    if (dozing) headDrop = 0.35 + 0.05 * Math.sin(t * 0.7);

    // Restless horses toss their head
    let toss = 0;
    if (temper === "restless") {
        const c = cyc(t, 5.3);
        if (c < 0.5) toss = -Math.sin((c / 0.5) * Math.PI) * 3;
    }

    // Stamping horse lifts the near forefoot and puts it down
    let hoofLift = 0;
    if (temper === "stamping") {
        const c = cyc(t, 4.7);
        if (c < 0.35) hoofLift = Math.sin((c / 0.35) * Math.PI) * 3;
    }

    const blink = dozing ? true : cyc(t, 4.3 + phase * 0.2) < 0.14;
    const earBack = !dozing && cyc(t * 1.3, 7) < 0.8;
    return { headDrop, toss, tailSway, blink, earBack, hoofLift };
}

// ---------------------------------------------------------------------------
// Crisp primitives
// ---------------------------------------------------------------------------

/** Scanline polygon fill with whole-pixel spans (no anti-aliasing). */
function poly(ctx: CanvasRenderingContext2D, pts: [number, number][], color: string): void {
    let minY = Infinity;
    let maxY = -Infinity;
    for (const [, y] of pts) {
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
    }
    ctx.fillStyle = color;
    for (let y = Math.floor(minY); y < Math.ceil(maxY); y++) {
        const sy = y + 0.5;
        const xs: number[] = [];
        for (let i = 0; i < pts.length; i++) {
            const [x0, y0] = pts[i];
            const [x1, y1] = pts[(i + 1) % pts.length];
            if ((y0 <= sy && y1 > sy) || (y1 <= sy && y0 > sy)) {
                xs.push(x0 + ((sy - y0) / (y1 - y0)) * (x1 - x0));
            }
        }
        xs.sort((a, b) => a - b);
        for (let i = 0; i + 1 < xs.length; i += 2) {
            const a = Math.round(xs[i]);
            const b = Math.round(xs[i + 1]);
            if (b > a) ctx.fillRect(a, y, b - a, 1);
        }
    }
}

/** Limb segment from (x0,y0) to (x1,y1), width tapering w0 → w1. */
function limb(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, w0: number, w1: number, color: string): void {
    ctx.fillStyle = color;
    for (let y = Math.round(y0); y < Math.round(y1); y++) {
        const k = (y - y0) / Math.max(1, y1 - y0);
        const w = Math.round(w0 + (w1 - w0) * k);
        const x = Math.round(x0 + (x1 - x0) * k - w / 2);
        ctx.fillRect(x, y, w, 1);
    }
}

// ---------------------------------------------------------------------------
// Stall
// ---------------------------------------------------------------------------

function drawStallBack(ctx: CanvasRenderingContext2D, w: number): void {
    // Planked back partition
    r(ctx, 0, 0, w, 44, WOOD.d);
    for (let x = 4; x < w - 4; x += 8) {
        r(ctx, x, 4, 7, 40, x % 16 === 4 ? P.wood : "#563a22");
        vline(ctx, x, 4, 40, WOOD.o);
        p(ctx, x + 3, 10, WOOD.o);
        p(ctx, x + 3, 36, WOOD.o);
    }
    // Top beam
    r(ctx, 0, 0, w, 5, WOOD.o);
    r(ctx, 0, 1, w, 3, WOOD.m);
    hline(ctx, 0, 1, w, WOOD.l);
    // Hay rack in the corner, hay bulging through the bars
    r(ctx, 8, 10, 26, 14, "#7a6a3c");
    for (let i = 0; i < 26; i += 2) vline(ctx, 8 + i, 10 + (i % 4 === 0 ? 0 : 1), 13, i % 4 === 0 ? P.strawLight : P.straw);
    r(ctx, 7, 9, 28, 2, P.ironDark);
    r(ctx, 7, 23, 28, 2, P.ironDark);
    for (let x = 9; x < 34; x += 4) vline(ctx, x, 11, 12, P.iron);
    for (let i = 0; i < 6; i++) p(ctx, 10 + i * 4, 25 + (i % 2), P.straw);
    // Brass nameplate and a hook with a coiled lead rope
    r(ctx, 54, 14, 14, 5, P.goldDark);
    hline(ctx, 55, 15, 12, P.gold);
    p(ctx, 78, 12, P.iron);
    for (let i = 0; i < 4; i++) {
        p(ctx, 76 + (i % 2) * 3, 13 + i * 2, "#8a6a40");
        p(ctx, 77, 14 + i * 2, "#6a4a2a");
    }
    // Shadow where the wall meets the straw
    r(ctx, 0, 44, w, 3, "rgba(0,0,0,0.3)");
}

function drawStrawFloor(ctx: CanvasRenderingContext2D, w: number): void {
    r(ctx, 0, 44, w, G + 12 - 44, "#8e7e50");
    const rand = seeded(311);
    const tones = [P.straw, P.strawLight, "#b8a66e", "#7a6c44"];
    for (let i = 0; i < 260; i++) {
        const x = Math.floor(rand() * w);
        const y = 46 + Math.floor(rand() * (G + 10 - 46));
        const len = 2 + Math.floor(rand() * 4);
        const c = tones[Math.floor(rand() * tones.length)];
        if (rand() < 0.5) hline(ctx, x, y, len, c);
        else for (let k = 0; k < len; k++) p(ctx, x + k, y - (k >> 1), c);
    }
    r(ctx, 0, 44, w, 3, "rgba(0,0,0,0.3)");
}

function drawStallSides(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    for (const x of [0, w - 6]) {
        r(ctx, x, 0, 6, h - 4, WOOD.d);
        r(ctx, x + 1, 2, 4, h - 8, WOOD.m);
        vline(ctx, x + 1, 2, h - 8, WOOD.l);
        vline(ctx, x + 5, 0, h - 4, WOOD.o);
        r(ctx, x, 0, 6, 3, WOOD.l);
    }
}

function drawStallFront(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    // Low front rail and kick board; the horse's hooves show above it
    r(ctx, 0, G + 6, w, 4, WOOD.o);
    r(ctx, 2, G + 7, w - 4, 2, WOOD.l);
    r(ctx, 0, h - 14, w, 10, WOOD.d);
    r(ctx, 0, h - 14, w, 2, WOOD.l);
    for (let x = 10; x < w - 6; x += 12) vline(ctx, x, h - 12, 8, WOOD.o);
    r(ctx, 0, h - 4, w, 2, "rgba(0,0,0,0.35)");
    // Water bucket by the front post
    r(ctx, 8, G - 4, 10, 9, "#4a3a2a");
    r(ctx, 9, G - 3, 8, 2, "#3a5060");
    hline(ctx, 8, G - 1, 10, P.iron);
    hline(ctx, 8, G + 3, 10, P.iron);
}

// ---------------------------------------------------------------------------
// Horse (side profile, facing left)
// ---------------------------------------------------------------------------

function drawLegFore(ctx: CanvasRenderingContext2D, x: number, lift: number, pal: HorsePalette, near: boolean): void {
    const c = near ? pal.coat : pal.dark;
    const hi = near ? pal.light : pal.mid;
    const foot = G - lift;
    limb(ctx, x, 68, x, 83 - lift * 0.5, 7, 4, c); // forearm
    vline(ctx, x - 2, 70, 12, hi);
    limb(ctx, x, 83 - lift * 0.5, x + 0.5, foot - 7, 4, 3, c); // knee → cannon
    const sock = pal.socks && near;
    limb(ctx, x + 0.5, foot - 8, x - 0.5, foot - 3, 4, 3, sock ? P.horseSock : c); // fetlock + pastern
    r(ctx, Math.round(x) - 3, foot - 3, 5, 3, P.horseHoof);
    hline(ctx, Math.round(x) - 3, foot - 3, 5, "#4a3a2a");
}

function drawLegHind(ctx: CanvasRenderingContext2D, x: number, pal: HorsePalette, near: boolean): void {
    const c = near ? pal.coat : pal.dark;
    const hi = near ? pal.light : pal.mid;
    limb(ctx, x - 2, 66, x + 3, 83, 9, 5, c); // gaskin angling back to the hock
    vline(ctx, x - 4, 68, 8, hi);
    r(ctx, x + 2, 81, 4, 3, shade(c, -0.12)); // point of hock
    limb(ctx, x + 2, 83, x + 1, G - 7, 4, 3, c); // cannon
    const sock = pal.socks && near;
    limb(ctx, x + 1, G - 8, x, G - 3, 4, 3, sock ? P.horseSock : c);
    r(ctx, x - 2, G - 3, 5, 3, P.horseHoof);
    hline(ctx, x - 2, G - 3, 5, "#4a3a2a");
}

function drawTail(ctx: CanvasRenderingContext2D, sway: number, pal: HorsePalette): void {
    const hi = shade(pal.mane, 0.25);
    for (let y = 52; y < 90; y++) {
        const k = (y - 52) / 38;
        const x = 80 + Math.sin(k * 1.4) * 4 + sway * k * k;
        const w = k < 0.15 ? 3 : Math.round(3 + k * 3);
        r(ctx, Math.round(x), y, w, 1, pal.mane);
        if (y % 3 === 0 && k > 0.2) p(ctx, Math.round(x) + 1, y, hi);
    }
    // Wispy ends
    const endX = Math.round(80 + Math.sin(1.4) * 4 + sway);
    p(ctx, endX, 90, pal.mane);
    p(ctx, endX + 3, 91, pal.mane);
}

function drawBody(ctx: CanvasRenderingContext2D, pal: HorsePalette): void {
    // Each mass: dark base, coat shifted up, highlight up-left (light from the upper left)
    const masses: [number, number, number, number][] = [
        [50, 62, 21, 12], // barrel
        [68, 60, 13, 13], // hindquarters
        [33, 60, 11, 12] // shoulder + chest
    ];
    for (const [cx, cy, rx, ry] of masses) ellipse(ctx, cx, cy, rx, ry, pal.dark);
    for (const [cx, cy, rx, ry] of masses) ellipse(ctx, cx, cy - 1, rx - 1, ry - 2, pal.coat);
    ellipse(ctx, 66, 55, 8, 5, pal.light);
    ellipse(ctx, 46, 55, 13, 4, pal.light);
    ellipse(ctx, 31, 56, 6, 5, pal.light);
    // Muscle lines: shoulder blade and stifle
    for (let i = 0; i < 12; i++) p(ctx, 38 - Math.round(i * 0.35), 50 + i, pal.mid);
    for (let i = 0; i < 9; i++) p(ctx, 60 + Math.round(i * 0.3), 62 + i, pal.mid);
    // Belly shadow and girth groove
    hline(ctx, 36, 72, 26, pal.dark);
    vline(ctx, 40, 66, 6, pal.mid);
    if (pal.dapple) {
        const rand = seeded(9);
        for (let i = 0; i < 18; i++) {
            const x = 36 + Math.floor(rand() * 40);
            const y = 54 + Math.floor(rand() * 14);
            p(ctx, x, y, pal.light);
            p(ctx, x + 1, y, pal.light);
            p(ctx, x, y + 1, pal.mid);
        }
    }
}

function drawNeckAndHead(ctx: CanvasRenderingContext2D, pal: HorsePalette, pose: HorsePose): void {
    // Head position: lowers and reaches forward when grazing, lifts on a toss
    const dy = pose.headDrop * 22 + pose.toss;
    const dx = pose.headDrop * 3;
    const H = (x: number, y: number): [number, number] => [x + dx, y + dy];

    // Neck from withers/chest up to the poll and throat
    const neck: [number, number][] = [[42, 50], [36, 46], H(24, 28), H(19, 26), H(14, 36), [22, 60], [30, 66]];
    poly(ctx, neck, pal.coat);
    // Lit crest, shadowed underline of the neck
    poly(ctx, [[38, 49], [34, 46], H(23, 29), H(21, 30), [32, 50]], pal.light);
    poly(ctx, [H(15, 38), H(14, 36), [22, 60], [25, 62]], pal.mid);

    // Head: poll, flat forehead, long face, muzzle, round jaw
    const head: [number, number][] = [H(20, 24), H(13, 27), H(8, 35), H(3, 45), H(3, 49), H(8, 51), H(12, 48), H(19, 40), H(21, 32)];
    poly(ctx, head, pal.coat);
    // Round cheek: shadowed lower rim under the lit jaw
    ellipse(ctx, 16 + dx, 38 + dy, 5, 5, pal.mid);
    ellipse(ctx, 15 + dx, 37 + dy, 4, 4, pal.coat);
    poly(ctx, [H(13, 28), H(9, 35), H(5, 43), H(8, 43), H(12, 34), H(16, 28)], pal.light); // face plane
    // Muzzle: softer, darker, with nostril and mouth
    poly(ctx, [H(3, 45), H(3, 49), H(8, 51), H(10, 47), H(6, 43)], P.horseMuzzle);
    p(ctx, 4 + dx, 45 + dy, P.horseNostril);
    p(ctx, 5 + dx, 46 + dy, P.horseNostril);
    hline(ctx, 4 + dx, 49 + dy, 4, P.horseNostril);
    if (pal.blaze) {
        poly(ctx, [H(12, 28), H(14, 28), H(8, 42), H(5, 44), H(5, 42)], pal.blaze);
    }

    // Ears: near ear in front, far ear a little behind and darker
    const earTilt = pose.earBack ? 3 : 0;
    poly(ctx, [H(20, 26), H(22, 26), H(22 + earTilt, 19)], pal.dark);
    poly(ctx, [H(16, 27), H(19, 26), H(17 + earTilt, 18)], pal.coat);
    p(ctx, 17 + dx, 24 + dy, pal.dark);

    // Eye
    const ex = 12 + dx;
    const ey = 32 + dy;
    if (pose.blink) {
        hline(ctx, ex, ey + 1, 3, P.horseNostril);
    } else {
        r(ctx, ex, ey, 3, 2, "#140c08");
        p(ctx, ex + 1, ey, P.horseEyeWhite);
        p(ctx, ex - 1, ey - 1, pal.dark); // brow
    }

    // Leather halter: noseband, cheek strap, brass ring
    const strap = "#3a2214";
    for (let i = 0; i < 6; i++) p(ctx, 6 + i + dx, 41 + Math.round(i * 0.2) + dy, strap);
    for (let i = 0; i < 12; i++) p(ctx, 18 - Math.round(i * 0.15) + dx, 27 + i + dy, strap);
    p(ctx, 15 + dx, 43 + dy, P.gold);

    // Mane along the crest and a forelock between the ears
    for (let i = 0; i <= 20; i++) {
        const k = i / 20;
        const [mx, my] = [H(20, 25)[0] + (36 - H(20, 25)[0]) * k, H(20, 25)[1] + (46 - H(20, 25)[1]) * k];
        const len = 3 + ((i * 7) % 3);
        vline(ctx, Math.round(mx) + 1, Math.round(my) - 1, len, pal.mane);
        if (i % 3 === 0) p(ctx, Math.round(mx) + 2, Math.round(my) + 1, shade(pal.mane, 0.25));
    }
    poly(ctx, [H(16, 26), H(20, 25), H(15, 31)], pal.mane);
}

function drawHorse(ctx: CanvasRenderingContext2D, pal: HorsePalette, pose: HorsePose): void {
    // Shadow on the straw
    ctx.fillStyle = "rgba(40,28,10,0.35)";
    ctx.fillRect(18, G - 2, 66, 3);
    ctx.fillRect(24, G - 3, 54, 1);

    // Far legs first, then tail, body, neck/head, near legs
    drawLegHind(ctx, 74, pal, false);
    drawLegFore(ctx, 36, 0, pal, false);
    drawTail(ctx, pose.tailSway, pal);
    drawBody(ctx, pal);
    drawNeckAndHead(ctx, pal, pose);
    drawLegHind(ctx, 66, pal, true);
    drawLegFore(ctx, 28, Math.round(pose.hoofLift), pal, true);
}

function drawStableBoothContents(ctx: CanvasRenderingContext2D, horse: HorsePalette, animTime: number, phase: number): void {
    drawStallBack(ctx, BOOTH_NATIVE_W);
    drawStrawFloor(ctx, BOOTH_NATIVE_W);
    // Side partitions sit behind the horse so its head and tail never get clipped
    drawStallSides(ctx, BOOTH_NATIVE_W, BOOTH_NATIVE_H);
    drawHorse(ctx, horse, getHorsePose(animTime, phase, horse.temper));
    drawStallFront(ctx, BOOTH_NATIVE_W, BOOTH_NATIVE_H);
}

export function drawStableBoothAnimated(
    ctx: CanvasRenderingContext2D,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
    animTime: number,
    phase: number,
    spriteName: string
): void {
    const horse = HORSE_PALETTES[spriteName];
    if (!horse) return;

    ctx.save();
    ctx.translate(dx, dy);
    ctx.scale(dw / BOOTH_NATIVE_W, dh / BOOTH_NATIVE_H);
    drawStableBoothContents(ctx, horse, animTime, phase);
    ctx.restore();
}

function boothSprite(name: keyof typeof HORSE_PALETTES): ProceduralSpriteDef {
    return {
        nativeWidth: BOOTH_NATIVE_W,
        nativeHeight: BOOTH_NATIVE_H,
        draw(ctx) {
            drawStableBoothContents(ctx, HORSE_PALETTES[name], 0, 0);
        }
    };
}

export const ANIMAL_SPRITES: Record<string, ProceduralSpriteDef> = {
    stable_booth: boothSprite("stable_booth"),
    stable_booth_bay: boothSprite("stable_booth_bay"),
    stable_booth_gray: boothSprite("stable_booth_gray")
};
