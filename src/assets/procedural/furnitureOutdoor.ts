/**
 * Garden / courtyard pieces redrawn at uniform 2x scale (see furnitureKit.ts).
 */
import { P } from "./palette";
import { hline, p, r, shade, vline } from "./pixel";
import { ellipse, floorShadow, line, seeded, STONE, WOOD } from "./furnitureKit";

const LEAF = {
    deep: "#12280f",
    dark: P.leafDark,
    mid: P.leaf,
    light: P.leafLight,
    hi: "#7cc870"
};

/** Wobbly-edged blob (deterministic) for foliage masses. */
function blob(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, color: string, seed: number): void {
    const rand = seeded(seed);
    const wob: number[] = [];
    for (let i = 0; i < 16; i++) wob.push(0.86 + rand() * 0.22);
    ctx.fillStyle = color;
    for (let y = Math.floor(cy - ry * 1.1); y <= Math.ceil(cy + ry * 1.1); y++) {
        for (let x = Math.floor(cx - rx * 1.1); x <= Math.ceil(cx + rx * 1.1); x++) {
            const dx = (x + 0.5 - cx) / rx;
            const dy = (y + 0.5 - cy) / ry;
            const a = Math.atan2(dy, dx);
            const k = Math.floor(((a + Math.PI) / (Math.PI * 2)) * 16) % 16;
            if (dx * dx + dy * dy <= wob[k] * wob[k]) ctx.fillRect(x, y, 1, 1);
        }
    }
}

/** Scatter small leaf-cluster dabs over a lit region to break up flat fills. */
function leafTexture(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    color: string,
    count: number,
    seed: number
): void {
    const rand = seeded(seed);
    for (let i = 0; i < count; i++) {
        const a = rand() * Math.PI * 2;
        const d = Math.sqrt(rand());
        const x = Math.round(cx + Math.cos(a) * rx * d);
        const y = Math.round(cy + Math.sin(a) * ry * d);
        hline(ctx, x, y, 2, color);
        p(ctx, x, y - 1, color);
    }
}

/** 64x80 @2x — mature oak: trunk with root flare under a layered crown. */
export function drawOak(ctx: CanvasRenderingContext2D): void {
    // Ground shadow under the crown
    ellipse(ctx, 34, 72, 22, 5, "rgba(0,0,0,0.25)");
    // Trunk
    const bark = { o: "#2a1a0e", d: "#4a3018", m: "#6a4a2a", l: "#8a6440" };
    r(ctx, 27, 44, 10, 28, bark.o);
    r(ctx, 28, 44, 8, 28, bark.m);
    vline(ctx, 28, 44, 28, bark.l);
    vline(ctx, 29, 46, 22, bark.l);
    vline(ctx, 34, 44, 28, bark.d);
    vline(ctx, 35, 44, 28, bark.d);
    for (const [x, y, h] of [[31, 52, 6], [32, 61, 5], [30, 66, 3]] as const) vline(ctx, x, y, h, bark.d);
    // Root flare
    r(ctx, 23, 69, 18, 3, bark.o);
    r(ctx, 24, 69, 16, 2, bark.m);
    hline(ctx, 24, 69, 5, bark.l);
    p(ctx, 22, 71, bark.o);
    p(ctx, 41, 71, bark.o);
    // Branch stubs into the crown
    line(ctx, 30, 46, 24, 38, bark.m);
    line(ctx, 34, 46, 41, 37, bark.d);

    // Crown — dark core, mid lobes, lit top-left
    blob(ctx, 32, 30, 29, 22, LEAF.deep, 1);
    blob(ctx, 20, 30, 15, 13, LEAF.dark, 2);
    blob(ctx, 44, 31, 15, 13, LEAF.dark, 3);
    blob(ctx, 32, 20, 20, 15, LEAF.dark, 4);
    blob(ctx, 22, 25, 13, 11, LEAF.mid, 5);
    blob(ctx, 40, 24, 13, 11, LEAF.mid, 6);
    blob(ctx, 30, 15, 15, 11, LEAF.mid, 7);
    blob(ctx, 24, 15, 10, 8, LEAF.light, 8);
    blob(ctx, 38, 18, 8, 6, LEAF.light, 9);
    blob(ctx, 21, 11, 5, 4, LEAF.hi, 10);
    leafTexture(ctx, 32, 32, 24, 14, LEAF.deep, 26, 11);
    leafTexture(ctx, 28, 20, 16, 10, LEAF.light, 18, 12);
    leafTexture(ctx, 24, 13, 8, 5, LEAF.hi, 8, 13);
    // Underside shadow line where the crown meets the trunk
    hline(ctx, 22, 44, 20, LEAF.deep);
}

/** 32x32 @2x — rounded garden shrub. */
export function drawBush(ctx: CanvasRenderingContext2D): void {
    ellipse(ctx, 16, 28, 13, 3, "rgba(0,0,0,0.25)");
    blob(ctx, 16, 18, 14, 11, LEAF.deep, 21);
    blob(ctx, 12, 18, 9, 8, LEAF.dark, 22);
    blob(ctx, 21, 17, 9, 8, LEAF.dark, 23);
    blob(ctx, 14, 14, 9, 7, LEAF.mid, 24);
    blob(ctx, 21, 13, 6, 5, LEAF.mid, 25);
    blob(ctx, 12, 11, 5, 4, LEAF.light, 26);
    leafTexture(ctx, 16, 20, 11, 6, LEAF.deep, 10, 27);
    leafTexture(ctx, 14, 12, 7, 4, LEAF.light, 6, 28);
    p(ctx, 10, 9, LEAF.hi);
    p(ctx, 13, 8, LEAF.hi);
}

/**
 * 48x80 @2x — formal lily pool: stone coping round a basin with rounded ends,
 * dark water catching the sky, lily pads, goldfish and a clump of reeds.
 */
export function drawPond(ctx: CanvasRenderingContext2D): void {
    const W = 48;
    const H = 80;
    const rand = seeded(31);
    // Stadium shape (rounded ends) test: inside if within radius of the centre segment
    const R0 = W / 2 - 2;
    const inside = (x: number, y: number, inset: number) => {
        const rx = R0 - inset;
        const cx = W / 2;
        const top = R0 + 3;
        const bottom = H - 4 - R0;
        const cy = Math.max(top, Math.min(bottom, y));
        return Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= rx;
    };
    // Shadow on the lawn
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (inside(x - 1, y - 2, -1) && !inside(x, y, 0)) p(ctx, x, y, "rgba(0,0,0,0.25)");
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            if (!inside(x, y, 0)) continue;
            if (!inside(x, y, 5)) {
                // Coping stones: lit on the upper-left, joints radiating round the rim
                const ang = Math.atan2(y + 0.5 - H / 2, x + 0.5 - W / 2);
                const lit = Math.cos(ang + Math.PI * 0.75);
                const joint = inside(x, y, 1) && ((ang + Math.PI) * 6) % 1 < 0.08;
                let c = lit > 0.3 ? STONE.h : lit > -0.3 ? STONE.l : STONE.m;
                if (!inside(x, y, 1)) c = STONE.d; // outer arris
                if (inside(x, y, 4)) c = shade(c, -0.18); // inner lip
                if (joint) c = STONE.d;
                if (rand() < 0.03) c = "#6a7a52"; // lichen
                p(ctx, x, y, c);
                continue;
            }
            // Water: smooth dithered gradient, darkest under the far coping
            const k = y / H;
            const shadeIdx = k * 3 + ((x + y) % 2 ? 0.25 : -0.25) * ((x * 3 + y) % 3 === 0 ? 1 : 0);
            const cols = ["#16303a", "#1c3a46", "#224454", "#28505f"];
            let c = cols[Math.max(0, Math.min(3, Math.floor(shadeIdx)))];
            if (!inside(x, y, 7)) c = "#12262e"; // inner shadow below the coping
            // Sky caught on the water: a soft diagonal streak, dithered at its edges
            const d = x - W * 0.6 + (y - H * 0.5) * 0.25;
            if (inside(x, y, 9) && Math.abs(d) < 5 && (Math.abs(d) < 3 || (x + y) % 2 === 0)) c = "#3a6476";
            p(ctx, x, y, c);
        }
    }
    // Ripple glints
    for (const [x, y, len] of [[14, 22, 5], [28, 40, 6], [18, 58, 4], [30, 66, 3]] as const) hline(ctx, x, y, len, "#6a94a8");
    // Lily pads with a notch, one pale flower
    const pad = (cx: number, cy: number, rr: number) => {
        ellipse(ctx, cx, cy, rr, rr * 0.7, "#2e5a28");
        ellipse(ctx, cx - 1, cy - 1, rr - 1, rr * 0.5, "#46783c");
        p(ctx, cx + rr - 1, cy, "#1e3c48");
        p(ctx, cx + rr - 2, cy, "#1e3c48");
    };
    pad(16, 30, 4);
    pad(22, 34, 3);
    pad(30, 56, 4);
    pad(14, 62, 3);
    r(ctx, 15, 28, 3, 2, "#f0e0e8");
    p(ctx, 16, 28, "#e8c860");
    // Goldfish
    r(ctx, 26, 46, 3, 1, "#e07a2a");
    p(ctx, 25, 46, "#c05a1a");
    r(ctx, 20, 50, 2, 1, "#f0a040");
    // Reeds by the lower-left coping
    for (let i = 0; i < 7; i++) {
        const x = 8 + i * 2 + (i % 2);
        const h = 8 + ((i * 5) % 6);
        vline(ctx, x, 72 - h, h, i % 2 ? "#4a7a3a" : "#5e8e44");
        if (i % 3 === 0) r(ctx, x, 72 - h - 3, 1, 3, "#5a3a20");
    }
}

/** 3px pulley wheel. */
function discCrispish(ctx: CanvasRenderingContext2D, x: number, y: number, c: string): void {
    hline(ctx, x - 1, y - 1, 3, c);
    hline(ctx, x - 2, y, 5, c);
    hline(ctx, x - 1, y + 1, 3, c);
    p(ctx, x, y, "#8a8a92");
}

/** Horse looking out over a stall half-door (front view), head ~14x18. */
function horseAtDoor(ctx: CanvasRenderingContext2D, cx: number, top: number, coat: string, light: string, dark: string, blaze?: string): void {
    // Neck behind the head, in the doorway shadow
    r(ctx, cx - 5, top + 9, 10, 9, shade(coat, -0.25));
    // Ears
    for (const sx of [-1, 1]) {
        const ex = cx + sx * 4;
        r(ctx, ex - 1, top, 2, 3, dark);
        p(ctx, ex - (sx > 0 ? 0 : 1), top - 1, dark);
    }
    // Head: broad forehead tapering to the muzzle
    for (let y = 0; y < 16; y++) {
        const half = y < 6 ? 5 : y < 12 ? 4 : 3;
        hline(ctx, cx - half, top + 2 + y, half * 2, coat);
        p(ctx, cx - half, top + 2 + y, light);
        p(ctx, cx + half - 1, top + 2 + y, dark);
    }
    // Forelock, eyes, blaze, muzzle, nostrils
    r(ctx, cx - 2, top + 2, 4, 2, dark);
    p(ctx, cx - 4, top + 6, "#140c08");
    p(ctx, cx + 3, top + 6, "#140c08");
    if (blaze) {
        vline(ctx, cx - 1, top + 4, 10, blaze);
        vline(ctx, cx, top + 5, 9, blaze);
    }
    r(ctx, cx - 3, top + 14, 6, 4, P.horseMuzzle);
    p(ctx, cx - 2, top + 16, P.horseNostril);
    p(ctx, cx + 1, top + 16, P.horseNostril);
}

/** Stall half-door: dark opening above, braced plank door below. */
function dutchDoor(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: Record<string, string>): void {
    r(ctx, x - 2, y - 2, w + 4, h + 2, t.o);
    hline(ctx, x - 2, y - 2, w + 4, t.h); // lintel
    r(ctx, x, y, w, h, "#1a120c");
    r(ctx, x, y, w, 3, "#0e0a06");
    const lowY = y + Math.floor(h * 0.48);
    r(ctx, x, lowY, w, h - (lowY - y), t.d);
    for (let px = x + 1; px < x + w; px += 3) vline(ctx, px, lowY + 1, h - (lowY - y) - 1, t.m);
    hline(ctx, x, lowY, w, t.h); // top rail of the half-door
    hline(ctx, x, lowY + 1, w, t.o);
    line(ctx, x, y + h - 2, x + w - 1, lowY + 3, t.l); // Z brace
    hline(ctx, x, y + h - 2, w, t.o);
    p(ctx, x + w - 3, lowY + 6, P.ironDark); // latch
}

/**
 * 160x96 @2x — west end of the timber stable by day; the east edge runs on past
 * the courtyard. The open entrance sits over the stable exit tile (x ≈ 14–38).
 */
export function drawStable(ctx: CanvasRenderingContext2D): void {
    const W = 160;
    const t = { o: "#24160c", d: "#4e321c", m: "#6e4a2a", l: "#8c6640", h: "#aa8256" };
    const shingle = { o: "#2a1e16", d: "#4a3a2c", m: "#5c4a3a", l: "#72604c", h: "#8c785e" }; // weathered cedar
    const rand = seeded(1601);

    floorShadow(ctx, 0, 90, W, 6);

    // ---- Roof: split wooden shingles, irregular widths and weathering, lighter toward the ridge
    const RIDGE = 14;
    const EAVE = 40;
    r(ctx, 0, RIDGE, W, EAVE - RIDGE, shingle.o);
    const tones = [shingle.d, shingle.m, shingle.l, "#665240", "#54443a"];
    for (let cy = RIDGE + 2; cy < EAVE; cy += 4) {
        const k = (cy - RIDGE) / (EAVE - RIDGE);
        let x = -Math.floor(rand() * 5);
        while (x < W) {
            const sw = 4 + Math.floor(rand() * 4);
            const tone = tones[Math.min(tones.length - 1, Math.floor(rand() * 3 + k * 2))];
            r(ctx, x, cy, sw - 1, 4, tone);
            hline(ctx, x, cy, sw - 1, k < 0.5 ? shingle.h : shingle.l); // lit butt edge
            p(ctx, x + sw - 2, cy + 3, shingle.o);
            if (rand() < 0.5) vline(ctx, x + 1 + Math.floor(rand() * (sw - 2)), cy + 1, 2, shade(tone, -0.12)); // grain
            if (rand() < 0.15) vline(ctx, x + 1 + Math.floor(rand() * (sw - 2)), cy + 1, 3, shingle.o); // split
            x += sw;
        }
    }
    // Moss along the lower courses and a couple of slipped shingles
    for (let i = 0; i < 30; i++) {
        const x = Math.floor(rand() * W);
        const y = 26 + Math.floor(rand() * 13);
        r(ctx, x, y, 2 + Math.floor(rand() * 3), 1, rand() < 0.7 ? "#4a5a32" : "#5e6e3e");
    }
    for (const [x, y] of [[124, 30], [70, 35], [148, 24]] as const) {
        r(ctx, x, y, 5, 3, shingle.h);
        hline(ctx, x, y + 3, 5, shingle.o);
    }
    // Ridge cap and the west barge board
    r(ctx, 0, RIDGE - 2, W, 3, shingle.o);
    hline(ctx, 0, RIDGE - 2, W, shingle.h);
    for (let x = 2; x < W; x += 5) p(ctx, x, RIDGE - 1, shingle.d);
    r(ctx, 0, RIDGE - 2, 3, EAVE - RIDGE + 4, t.o);
    vline(ctx, 1, RIDGE - 1, EAVE - RIDGE + 1, t.l);
    // Eave fascia with a little drip shadow
    r(ctx, 0, EAVE, W, 3, t.d);
    hline(ctx, 0, EAVE, W, t.l);
    hline(ctx, 0, EAVE + 3, W, "rgba(0,0,0,0.4)");

    // ---- Cupola with louvres, pyramid cap and a horse weather vane
    const cx = 104;
    r(ctx, cx - 7, 8, 14, 7, t.o);
    r(ctx, cx - 6, 9, 12, 6, t.m);
    for (let y = 10; y < 15; y += 2) hline(ctx, cx - 5, y, 10, t.d);
    vline(ctx, cx - 6, 9, 6, t.h);
    for (let i = 0; i < 4; i++) hline(ctx, cx - 9 + i * 2, 7 - i, 18 - i * 4, i === 0 ? shingle.h : shingle.m);
    p(ctx, cx, 3, P.ironDark); // rod
    // Vane: a small iron horse, head to the west
    hline(ctx, cx - 2, 1, 5, P.ironDark); // body
    p(ctx, cx - 3, 0, P.ironDark); // head
    p(ctx, cx - 3, 1, P.ironDark);
    p(ctx, cx + 3, 1, P.ironDark); // tail
    p(ctx, cx - 2, 2, P.ironDark); // legs
    p(ctx, cx + 2, 2, P.ironDark);

    // ---- Wall: weathered board-and-batten over a stone plinth
    r(ctx, 0, 43, W, 43, t.m);
    for (let x = 0; x < W; x += 6) {
        vline(ctx, x + 2, 43, 43, t.d);
        vline(ctx, x + 3, 43, 43, t.l);
        if (rand() < 0.35) vline(ctx, x + 4 + Math.floor(rand() * 2), 50 + Math.floor(rand() * 20), 6 + Math.floor(rand() * 8), shade(t.m, -0.08));
    }
    hline(ctx, 0, 44, W, "rgba(0,0,0,0.25)");
    hline(ctx, 0, 64, W, t.d); // girt line
    r(ctx, 0, 84, W, 7, STONE.o);
    for (let x = 0; x < W; x += 8) {
        r(ctx, x + 1, 85, 6, 2, (x / 8) % 2 === 0 ? STONE.m : STONE.l);
        r(ctx, x + 5 - ((x / 8) % 2) * 4, 88, 6, 2, (x / 8) % 2 === 0 ? STONE.l : STONE.m);
        p(ctx, x + 1, 85, STONE.h);
    }

    // ---- Hayloft dormer above the entrance, with hoist beam, pulley and rope
    const gx = 26;
    for (let y = 0; y < 24; y++) {
        const half = Math.floor(y * 0.7) + 1;
        hline(ctx, gx - half, 18 + y, half * 2, t.m);
        for (let x = gx - half + 2; x < gx + half; x += 4) p(ctx, x, 18 + y, t.d);
        p(ctx, gx - half, 18 + y, t.h);
        p(ctx, gx + half - 1, 18 + y, t.o);
    }
    line(ctx, gx, 15, gx - 18, 41, shingle.o);
    line(ctx, gx, 16, gx - 17, 41, shingle.l);
    line(ctx, gx, 15, gx + 18, 41, shingle.o);
    line(ctx, gx, 16, gx + 17, 41, shingle.d);
    r(ctx, gx - 5, 27, 10, 13, t.o);
    r(ctx, gx - 4, 28, 8, 12, "#1a120c");
    for (let i = 0; i < 6; i++) p(ctx, gx - 4 + i, 38 - (i % 2), "#c4b480"); // hay in the loft
    r(ctx, gx - 2, 21, 4, 4, t.o); // hoist beam end
    p(ctx, gx - 1, 22, t.l);
    discCrispish(ctx, gx, 25, P.ironDark);
    vline(ctx, gx + 1, 26, 22, "#a08a5a"); // rope down past the doorway head
    p(ctx, gx + 1, 48, "#7a6440");

    // ---- Entrance: sliding door rolled aside on its track, interior in shade
    const dx = 14;
    const dw = 24;
    const dy = 50;
    r(ctx, dx - 2, 46, 52, 3, t.o); // track
    hline(ctx, dx - 2, 46, 52, P.ironDark);
    r(ctx, dx - 2, dy - 2, dw + 4, 86 - dy + 2, t.o);
    r(ctx, dx, dy, dw, 86 - dy, "#20160e");
    r(ctx, dx, dy, dw, 6, "#140e08");
    // Glimpse inside: stall posts, hay, a warm lantern
    vline(ctx, dx + 6, dy + 6, 30, "#3a2818");
    vline(ctx, dx + 17, dy + 6, 30, "#3a2818");
    r(ctx, dx + 1, 78, dw - 2, 8, "#6e5e38");
    for (let i = 0; i < 10; i++) hline(ctx, dx + 1 + Math.floor(rand() * (dw - 4)), 78 + Math.floor(rand() * 7), 3, rand() < 0.5 ? "#a89868" : "#c4b480");
    r(ctx, dx + 11, dy + 10, 2, 3, "#d8a850");
    p(ctx, dx + 11, dy + 10, "#f0d080");
    // Door leaf, rolled to the right
    const lx = dx + dw + 1;
    r(ctx, lx, dy - 1, 24, 86 - dy + 1, t.d);
    for (let x = lx + 1; x < lx + 24; x += 3) vline(ctx, x, dy, 86 - dy, t.m);
    r(ctx, lx, dy - 1, 24, 2, t.l);
    r(ctx, lx, 84, 24, 2, t.o);
    hline(ctx, lx, dy + 17, 24, t.l);
    line(ctx, lx, dy + 16, lx + 23, dy + 1, t.l);
    line(ctx, lx, 83, lx + 23, dy + 19, t.l);
    for (const rx of [lx + 4, lx + 19]) p(ctx, rx, 47, P.iron);
    // Horseshoe over the entrance, open end up for luck
    for (const [hx, hy] of [[25, 44], [26, 45], [27, 45], [28, 44]] as const) p(ctx, hx, hy, P.silverDark);
    p(ctx, 25, 43, P.silverDark);
    p(ctx, 28, 43, P.silverDark);
    // Straw spilling over the threshold
    for (let i = 0; i < 14; i++) hline(ctx, dx - 2 + Math.floor(rand() * (dw + 6)), 86 + Math.floor(rand() * 4), 2 + Math.floor(rand() * 3), rand() < 0.5 ? P.straw : P.strawLight);

    // ---- Lantern on an iron bracket
    hline(ctx, 66, 54, 5, P.ironDark);
    r(ctx, 68, 55, 4, 6, P.ironDark);
    r(ctx, 69, 56, 2, 4, "#c89848");

    // ---- Stall half-doors with horses looking out
    dutchDoor(ctx, 78, 50, 18, 34, t);
    horseAtDoor(ctx, 87, 51, "#8a5232", "#ad6e44", "#4e2a18", P.cream);
    dutchDoor(ctx, 120, 50, 18, 34, t);
    horseAtDoor(ctx, 129, 53, "#8e8c88", "#b4b2ac", "#56544f", "#dedad2");

    // ---- Small shuttered window between the stalls, daylight on the glass
    const wx = 103;
    const wy = 54;
    r(ctx, wx - 1, wy - 1, 12, 12, t.o);
    r(ctx, wx, wy, 10, 10, "#3a4a56");
    r(ctx, wx + 1, wy + 1, 4, 4, "#6a8496");
    p(ctx, wx + 1, wy + 1, "#a8c0cc");
    vline(ctx, wx + 5, wy, 10, t.o);
    hline(ctx, wx, wy + 5, 10, t.o);
    for (const sx of [wx - 6, wx + 11]) {
        r(ctx, sx, wy - 1, 5, 12, t.d);
        for (let y = wy; y < wy + 11; y += 2) hline(ctx, sx, y, 5, t.m);
        vline(ctx, sx, wy - 1, 12, t.h);
    }
    hline(ctx, wx - 1, wy + 11, 12, t.h);
    // Window at the cut-off east end
    r(ctx, 149, 54, 11, 12, t.o);
    r(ctx, 150, 55, 10, 10, "#3a4a56");
    p(ctx, 151, 56, "#a8c0cc");
    vline(ctx, 155, 55, 10, t.o);
}
