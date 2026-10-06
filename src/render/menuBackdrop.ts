/**
 * Main-menu backdrop: von Virtanen Manor at night, seen from beyond the gate.
 * Painted at native 400x300 and drawn at an integer 2x. The still scene is baked
 * once; stars, clouds, chimney smoke, candlelit windows, the gate lanterns and
 * ground fog are animated on top each frame.
 */
import { discCrisp, hline, p, r, triCrisp, vline } from "../assets/procedural/pixel";
import { seeded } from "../assets/procedural/furnitureKit";

export const MENU_NATIVE_W = 400;
export const MENU_NATIVE_H = 300;

/** Ground line where the manor stands. */
const GY = 214;
const MOON = { x: 358, y: 86, r: 14 };

const C = {
    skyTop: "#05070f",
    skyMid: "#0c1222",
    skyLow: "#18223a",
    star: "#c8d0e0",
    moon: "#e8e4cc",
    moonShade: "#c9c3a8",
    moonCrater: "#b2ac94",
    treeLine: "#0d121c",
    silhouette: "#04060a",
    brick: "#3a2a2e",
    brickDark: "#2a1d21",
    brickLine: "#30232a",
    brickLit: "#4c393c",
    trim: "#67656c",
    trimDark: "#45434b",
    trimLit: "#8a8992",
    roof: "#212536",
    roofDark: "#151824",
    roofLit: "#343b52",
    window: "#0b0f17",
    windowGlint: "#34425e",
    frame: "#1a1418",
    lit: "#f2bd62",
    litMid: "#d38c3c",
    litDark: "#9a5a26",
    lawn: "#0b120e",
    lawnLit: "#121c16",
    gravel: "#2a2a2e",
    gravelDark: "#1c1c20",
    iron: "#07080c"
};

/** Windows that are lit, as [block, column, row] keys. */
const LIT = new Set(["L:1:1", "L:3:0", "C:1:0", "C:3:2", "R:0:1", "R:2:0", "C:0:1"]);
/** Window with a candle that flickers; another where a figure appears now and then. */
const CANDLE = "R:2:0";
const WATCHER = "C:1:0";

interface Win {
    key: string;
    x: number;
    y: number;
    w: number;
    h: number;
}

let staticLayer: HTMLCanvasElement | null = null;
let frameLayer: HTMLCanvasElement | null = null;
let windows: Win[] = [];

// ---------------------------------------------------------------------------
// Sky
// ---------------------------------------------------------------------------

function drawSky(ctx: CanvasRenderingContext2D): void {
    // Banded gradient with a 2px checker dither between bands
    const bands = [C.skyTop, "#070a15", "#090e1b", C.skyMid, "#0f1628", "#131b30", "#161f36", C.skyLow];
    const bandH = Math.ceil(GY / bands.length);
    for (let i = 0; i < bands.length; i++) {
        r(ctx, 0, i * bandH, MENU_NATIVE_W, bandH, bands[i]);
        if (i + 1 < bands.length) {
            for (let x = (i % 2) * 2; x < MENU_NATIVE_W; x += 4) p(ctx, x, (i + 1) * bandH - 1, bands[i + 1]);
        }
    }
    // Moon halo
    for (const [rad, a] of [[60, 0.035], [42, 0.05], [28, 0.07]] as const) {
        ctx.fillStyle = `rgba(190,200,220,${a})`;
        ctx.beginPath();
        ctx.arc(MOON.x, MOON.y, rad, 0, Math.PI * 2);
        ctx.fill();
    }
    // Stars (static ones; a few twinkle in the animated pass)
    const rand = seeded(1107);
    for (let i = 0; i < 90; i++) {
        const x = Math.floor(rand() * MENU_NATIVE_W);
        const y = Math.floor(rand() * 150);
        if (Math.hypot(x - MOON.x, y - MOON.y) < 34) continue;
        p(ctx, x, y, rand() < 0.25 ? C.star : "#6a7690");
    }
    // Moon disc: lit from the upper right, craters, terminator shade
    discCrisp(ctx, MOON.x, MOON.y, MOON.r, C.moon);
    for (let y = -MOON.r; y <= MOON.r; y++) {
        const half = Math.floor(Math.sqrt(MOON.r * MOON.r - y * y));
        const shadeW = Math.max(0, Math.floor(half * 0.45) - Math.floor(y / 6));
        if (shadeW > 0) hline(ctx, MOON.x - half, MOON.y + y, shadeW, C.moonShade);
    }
    for (const [dx, dy, cr] of [[-5, -4, 3], [4, 3, 2], [-2, 7, 2], [6, -7, 1], [-8, 4, 1]] as const) {
        discCrisp(ctx, MOON.x + dx, MOON.y + dy, cr, C.moonCrater);
    }
}

function drawTreeLine(ctx: CanvasRenderingContext2D): void {
    const rand = seeded(77);
    let h = 10;
    for (let x = 0; x < MENU_NATIVE_W; x++) {
        h = Math.max(4, Math.min(22, h + (rand() - 0.5) * 4));
        const bump = x % 9 < 4 ? 2 : 0;
        vline(ctx, x, GY - Math.round(h) - bump, Math.round(h) + bump, C.treeLine);
    }
}

// ---------------------------------------------------------------------------
// Manor
// ---------------------------------------------------------------------------

function brickWall(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    r(ctx, x, y, w, h, C.brick);
    for (let row = 0; row * 3 < h; row++) {
        const yy = y + row * 3 + 2;
        if (yy < y + h) hline(ctx, x, yy, w, C.brickLine);
        for (let bx = x + (row % 2) * 3; bx < x + w; bx += 6) p(ctx, bx, yy - 1, C.brickLine);
    }
    // Moonlight catches the right edge, the left side falls away into shadow
    vline(ctx, x + w - 1, y, h, C.brickLit);
    vline(ctx, x, y, h, C.brickDark);
}

/** Stone string course / cornice band. */
function band(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h = 2): void {
    r(ctx, x, y, w, h, C.trim);
    hline(ctx, x, y, w, C.trimLit);
    hline(ctx, x, y + h, w, C.brickDark);
}

/** Mansard roof: sloped face from the eave up to a flat top, slate courses. */
function mansard(ctx: CanvasRenderingContext2D, x: number, eaveY: number, w: number, rise: number, inset: number): void {
    for (let i = 0; i < rise; i++) {
        const k = i / rise;
        const off = Math.round(inset * k);
        const yy = eaveY - 1 - i;
        hline(ctx, x + off, yy, w - off * 2, i % 3 === 0 ? C.roofDark : C.roof);
        p(ctx, x + w - off - 1, yy, C.roofLit);
        p(ctx, x + off, yy, C.roofDark);
    }
    // Iron cresting along the ridge
    const top = eaveY - rise;
    hline(ctx, x + inset, top, w - inset * 2, C.roofLit);
    for (let cx = x + inset + 1; cx < x + w - inset - 1; cx += 3) p(ctx, cx, top - 1, C.iron);
    // Eave
    r(ctx, x - 2, eaveY - 1, w + 4, 2, C.trimDark);
    hline(ctx, x - 2, eaveY - 1, w + 4, C.trim);
}

function windowAt(ctx: CanvasRenderingContext2D, key: string, x: number, y: number, w = 8, h = 12, arched = false): void {
    windows.push({ key, x, y, w, h });
    // Stone surround + sill + lintel
    r(ctx, x - 1, y - 1, w + 2, h + 2, C.trimDark);
    r(ctx, x - 2, y + h, w + 4, 2, C.trim);
    hline(ctx, x - 2, y + h, w + 4, C.trimLit);
    r(ctx, x - 1, y - 3, w + 2, 2, C.trim);
    const lit = LIT.has(key);
    r(ctx, x, y, w, h, lit ? C.litMid : C.window);
    if (arched) {
        p(ctx, x, y, C.trimDark);
        p(ctx, x + w - 1, y, C.trimDark);
    }
    if (lit) {
        // Warm lamplight, brighter low in the room, curtains at the sides
        r(ctx, x + 1, y + 3, w - 2, h - 4, C.lit);
        vline(ctx, x, y, h, C.litDark);
        vline(ctx, x + w - 1, y, h, C.litDark);
    } else {
        // Cold moon glint on the upper-right panes
        p(ctx, x + w - 2, y + 1, C.windowGlint);
        p(ctx, x + w - 3, y + 2, C.windowGlint);
    }
    // Glazing bars
    vline(ctx, x + Math.floor(w / 2), y, h, C.frame);
    hline(ctx, x, y + Math.floor(h / 2), w, C.frame);
}

function drawWing(ctx: CanvasRenderingContext2D, id: "L" | "R", x: number): void {
    const w = 84;
    const top = 162;
    brickWall(ctx, x, top, w, GY - top);
    band(ctx, x, top, w, 3);
    band(ctx, x, 188, w);
    r(ctx, x, GY - 4, w, 4, C.trimDark);
    hline(ctx, x, GY - 4, w, C.trim);
    // Quoins at the corners
    for (let y = top + 4; y < GY - 4; y += 6) {
        r(ctx, x, y, 3, 3, C.trimDark);
        r(ctx, x + w - 3, y, 3, 3, C.trim);
    }
    for (let col = 0; col < 4; col++) {
        const wx = x + 10 + col * 18;
        windowAt(ctx, `${id}:${col}:0`, wx, 170);
        windowAt(ctx, `${id}:${col}:1`, wx, 195);
    }
    mansard(ctx, x, top, w, 16, 6);
    // Dormers
    for (const dx of [18, 58]) {
        const dxp = x + dx;
        r(ctx, dxp, top - 13, 9, 10, C.trimDark);
        triCrisp(ctx, dxp - 1, top - 13, dxp + 10, top - 13, dxp + 4.5, top - 18, C.roof);
        r(ctx, dxp + 2, top - 11, 5, 7, LIT.has(`${id}:d${dx}`) ? C.lit : C.window);
        p(ctx, dxp + 5, top - 10, C.windowGlint);
    }
    // Chimneys
    for (const cx of [x + 8, x + w - 14]) {
        r(ctx, cx, top - 26, 6, 12, C.brick);
        vline(ctx, cx + 5, top - 26, 12, C.brickLit);
        r(ctx, cx - 1, top - 28, 8, 2, C.trim);
        r(ctx, cx + 1, top - 30, 2, 2, C.trimDark);
        r(ctx, cx + 4, top - 30, 2, 2, C.trimDark);
    }
}

function drawCentre(ctx: CanvasRenderingContext2D): void {
    const x = 148;
    const w = 104;
    const top = 136;
    brickWall(ctx, x, top, w, GY - top);
    band(ctx, x, top, w, 3);
    band(ctx, x, 164, w);
    band(ctx, x, 188, w);
    r(ctx, x, GY - 4, w, 4, C.trimDark);
    hline(ctx, x, GY - 4, w, C.trim);
    // Pilasters framing the bays
    for (const px of [x, x + 24, x + w - 28, x + w - 4]) {
        r(ctx, px, top + 3, 4, GY - top - 7, C.trimDark);
        vline(ctx, px + 3, top + 3, GY - top - 7, C.trim);
    }
    const cols = [x + 10, x + 34, x + w - 42, x + w - 18];
    cols.forEach((wx, col) => {
        windowAt(ctx, `C:${col}:0`, wx, 144, 8, 14, true);
        windowAt(ctx, `C:${col}:1`, wx, 170, 8, 13, true);
        if (col === 0 || col === 3) windowAt(ctx, `C:${col}:2`, wx, 195, 8, 12, true);
    });
    mansard(ctx, x, top, w, 14, 10);

    // Clock tower
    const tx = 184;
    const tw = 32;
    const ttop = 92;
    brickWall(ctx, tx, ttop, tw, top - 14 - ttop);
    band(ctx, tx - 1, ttop, tw + 2, 3);
    band(ctx, tx - 1, top - 16, tw + 2);
    // Clock face — stopped at eleven
    const cx = 200;
    const cy = 106;
    discCrisp(ctx, cx, cy, 9, C.trimDark);
    discCrisp(ctx, cx, cy, 8, "#d8d2bc");
    discCrisp(ctx, cx, cy, 7, "#c4bea6");
    for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        p(ctx, Math.round(cx + Math.sin(a) * 6), Math.round(cy - Math.cos(a) * 6), "#3a3430");
    }
    vline(ctx, cx, cy - 6, 6, C.iron); // minute hand on twelve
    // Hour hand toward eleven, 2px thick
    for (const [hx, hy] of [[-1, -1], [-1, -2], [-2, -3], [-2, -4]] as const) {
        p(ctx, cx + hx, cy + hy, C.iron);
        p(ctx, cx + hx + 1, cy + hy, C.iron);
    }
    p(ctx, cx, cy, "#6a2a1a");
    // Belfry roof and spire
    triCrisp(ctx, tx - 3, ttop, tx + tw + 3, ttop, cx, ttop - 26, C.roof);
    for (let i = 0; i < 26; i++) {
        const half = Math.round(((tw + 6) / 2) * (1 - i / 26));
        if (half > 0) p(ctx, cx + half - 1, ttop - i, C.roofLit);
    }
    vline(ctx, cx, ttop - 34, 8, C.iron);
    hline(ctx, cx - 2, ttop - 31, 5, C.iron);

    // Portico: columns, pediment, lit fanlight door, steps
    const px = 178;
    const pw = 44;
    triCrisp(ctx, px - 3, 186, px + pw + 3, 186, 200, 176, C.trim);
    triCrisp(ctx, px + 2, 185, px + pw - 2, 185, 200, 179, C.trimDark);
    r(ctx, px - 3, 186, pw + 6, 3, C.trim);
    hline(ctx, px - 3, 186, pw + 6, C.trimLit);
    for (const colX of [px, px + 10, px + pw - 14, px + pw - 4]) {
        r(ctx, colX, 189, 4, GY - 189, C.trim);
        vline(ctx, colX + 3, 189, GY - 189, C.trimLit);
        vline(ctx, colX, 189, GY - 189, C.trimDark);
    }
    r(ctx, 192, 194, 16, 20, C.frame);
    r(ctx, 193, 198, 14, 16, "#2a1a12");
    vline(ctx, 200, 198, 16, C.frame);
    discCrisp(ctx, 200, 196, 3, C.litMid);
    hline(ctx, 197, 197, 7, C.frame);
    for (let i = 0; i < 3; i++) r(ctx, px - 4 - i * 3, GY + i * 2, pw + 8 + i * 6, 2, i % 2 ? C.trimDark : C.trim);
}

// ---------------------------------------------------------------------------
// Foreground
// ---------------------------------------------------------------------------

function drawGrounds(ctx: CanvasRenderingContext2D): void {
    r(ctx, 0, GY, MENU_NATIVE_W, MENU_NATIVE_H - GY, C.lawn);
    const rand = seeded(5);
    for (let i = 0; i < 260; i++) {
        p(ctx, Math.floor(rand() * MENU_NATIVE_W), GY + Math.floor(rand() * (MENU_NATIVE_H - GY)), C.lawnLit);
    }
    // Gravel drive widening toward the viewer
    for (let y = GY + 6; y < MENU_NATIVE_H; y++) {
        const k = (y - GY - 6) / (MENU_NATIVE_H - GY - 6);
        const half = Math.round(14 + k * 70);
        hline(ctx, 200 - half, y, half * 2, (y + Math.floor(k * 5)) % 4 === 0 ? C.gravelDark : C.gravel);
        p(ctx, 200 - half, y, C.gravelDark);
    }
    // Clipped hedges along the façade
    for (const [x0, x1] of [[56, 168], [232, 344]] as const) {
        for (let x = x0; x < x1; x++) {
            const hgt = 5 + ((x * 7) % 3 === 0 ? 1 : 0);
            vline(ctx, x, GY + 1 - hgt, hgt + 2, "#0e1a12");
            p(ctx, x, GY + 1 - hgt, "#1a2a1e");
        }
    }
}

/** Recursive bare branch silhouette. */
function branch(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, len: number, thick: number, rand: () => number): void {
    const steps = Math.ceil(len);
    let cx = x;
    let cy = y;
    for (let i = 0; i < steps; i++) {
        cx += Math.cos(ang);
        cy += Math.sin(ang);
        ang += (rand() - 0.5) * 0.18;
        const t = Math.max(1, Math.round(thick * (1 - (i / steps) * 0.5)));
        r(ctx, Math.round(cx - t / 2), Math.round(cy), t, 1, C.silhouette);
    }
    if (len < 6) return;
    const kids = len > 30 ? 3 : 2;
    for (let k = 0; k < kids; k++) {
        const spread = (k - (kids - 1) / 2) * 0.55 + (rand() - 0.5) * 0.35;
        branch(ctx, cx, cy, ang + spread, len * (0.55 + rand() * 0.15), thick * 0.6, rand);
    }
}

function drawTrees(ctx: CanvasRenderingContext2D): void {
    const rand = seeded(42);
    // Left: leaning in from the edge; right: a taller oak
    branch(ctx, 18, 300, -Math.PI / 2 + 0.18, 70, 9, rand);
    branch(ctx, 386, 300, -Math.PI / 2 - 0.12, 84, 10, rand);
    branch(ctx, 360, 300, -Math.PI / 2 - 0.35, 34, 4, rand);
}

function drawFence(ctx: CanvasRenderingContext2D): void {
    const railTop = 252;
    const base = 272;
    for (const [x0, x1] of [[0, 148], [252, 400]] as const) {
        hline(ctx, x0, railTop + 3, x1 - x0, C.iron);
        hline(ctx, x0, base - 4, x1 - x0, C.iron);
        r(ctx, x0, base - 1, x1 - x0, 3, "#14161c");
        for (let x = x0 + 2; x < x1; x += 5) {
            vline(ctx, x, railTop, base - railTop, C.iron);
            p(ctx, x - 1, railTop + 1, C.iron);
            p(ctx, x + 1, railTop + 1, C.iron);
            p(ctx, x, railTop - 1, C.iron);
        }
    }
    // Stone gate piers with lantern brackets; the gates stand open
    for (const px of [140, 248]) {
        r(ctx, px, 232, 12, base - 232 + 2, "#2a292e");
        vline(ctx, px + 11, 232, base - 230, "#3c3b42");
        r(ctx, px - 1, 230, 14, 3, "#3c3b42");
        triCrisp(ctx, px - 1, 230, px + 13, 230, px + 6, 225, "#2a292e");
        r(ctx, px + 4, 216, 4, 7, C.iron);
        r(ctx, px + 3, 215, 6, 1, C.iron);
        vline(ctx, px + 6, 223, 3, C.iron);
    }
    // Open gate leaves angled back against the drive
    for (const [gx, dir] of [[152, 1], [248, -1]] as const) {
        for (let i = 0; i < 16; i++) {
            const x = gx + dir * i;
            const y = railTop + 2 + Math.floor(i / 3);
            if (i % 3 === 0) vline(ctx, x, y, base - y - 2, C.iron);
            p(ctx, x, y, C.iron);
        }
    }
}

function buildStatic(): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = MENU_NATIVE_W;
    canvas.height = MENU_NATIVE_H;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    windows = [];
    drawSky(ctx);
    drawTreeLine(ctx);
    drawWing(ctx, "L", 64);
    drawWing(ctx, "R", 252);
    drawCentre(ctx);
    drawGrounds(ctx);
    drawTrees(ctx);
    drawFence(ctx);
    return canvas;
}

// ---------------------------------------------------------------------------
// Animated pass
// ---------------------------------------------------------------------------

function drawClouds(ctx: CanvasRenderingContext2D, t: number): void {
    const clouds = [
        { y: 38, w: 90, speed: 3.2, off: 0, a: 0.5 },
        { y: 58, w: 130, speed: 2.1, off: 170, a: 0.42 },
        { y: 22, w: 70, speed: 4.4, off: 300, a: 0.35 }
    ];
    for (const c of clouds) {
        const span = MENU_NATIVE_W + c.w;
        const x = Math.round(((c.off + t * c.speed) % span) - c.w);
        ctx.fillStyle = `rgba(20,26,42,${c.a})`;
        ctx.fillRect(x + 10, c.y - 2, c.w - 30, 2);
        ctx.fillRect(x, c.y, c.w, 3);
        ctx.fillRect(x + 20, c.y + 3, c.w - 50, 2);
        // Moonlit upper rim where the cloud crosses the moon's glow
        const rim = Math.max(0, 1 - Math.abs(x + c.w / 2 - MOON.x) / 70);
        if (rim > 0) {
            ctx.fillStyle = `rgba(170,180,200,${(0.35 * rim).toFixed(3)})`;
            ctx.fillRect(x + 10, c.y - 2, c.w - 30, 1);
        }
    }
}

function drawTwinkle(ctx: CanvasRenderingContext2D, t: number): void {
    const rand = seeded(3301);
    for (let i = 0; i < 14; i++) {
        const x = Math.floor(rand() * MENU_NATIVE_W);
        const y = Math.floor(rand() * 120);
        const ph = rand() * 6.28;
        const k = Math.sin(t * (1.3 + rand()) + ph);
        if (k < 0.2) continue;
        p(ctx, x, y, C.star);
        if (k > 0.85) {
            ctx.fillStyle = "rgba(200,210,230,0.45)";
            ctx.fillRect(x - 1, y, 1, 1);
            ctx.fillRect(x + 1, y, 1, 1);
            ctx.fillRect(x, y - 1, 1, 1);
            ctx.fillRect(x, y + 1, 1, 1);
        }
    }
}

function drawWindowLife(ctx: CanvasRenderingContext2D, t: number): void {
    for (const w of windows) {
        if (!LIT.has(w.key)) continue;
        // Spill of lamplight onto the brick
        ctx.fillStyle = "rgba(240,170,80,0.10)";
        ctx.fillRect(w.x - 3, w.y - 2, w.w + 6, w.h + 6);
        if (w.key === CANDLE) {
            const f = 0.5 + 0.5 * Math.sin(t * 11) * Math.sin(t * 7.3 + 1);
            ctx.fillStyle = `rgba(80,30,10,${(0.35 * (1 - f)).toFixed(3)})`;
            ctx.fillRect(w.x + 1, w.y + 1, w.w - 2, w.h - 2);
        }
        if (w.key === WATCHER) {
            // Someone stands at the window for a few seconds every so often
            const cycle = t % 14;
            if (cycle > 9 && cycle < 12.5) {
                const cx = w.x + Math.floor(w.w / 2);
                r(ctx, cx - 1, w.y + 3, 3, 3, C.silhouette);
                r(ctx, cx - 2, w.y + 6, 5, w.h - 6, C.silhouette);
            }
        }
    }
}

function drawSmoke(ctx: CanvasRenderingContext2D, t: number): void {
    // Thin smoke from two chimneys, swelling and fading as the wind takes it east
    for (const [sx, sy, ph] of [[325, 134, 0], [75, 134, 0.45]] as const) {
        for (let i = 0; i < 10; i++) {
            const age = (t * 0.12 + i / 10 + ph) % 1;
            const x = sx + age * 30 + Math.sin(age * 5 + ph * 9) * 2;
            const y = sy - age * 30;
            const rad = 2 + age * 6;
            ctx.fillStyle = `rgba(78,84,100,${(0.22 * (1 - age) ** 1.5).toFixed(3)})`;
            ctx.fillRect(Math.round(x - rad), Math.round(y - rad / 2), Math.round(rad * 2), Math.max(2, Math.round(rad)));
        }
    }
}

function drawLanterns(ctx: CanvasRenderingContext2D, t: number): void {
    for (const [px, ph] of [[140, 0], [248, 1.7]] as const) {
        const f = 0.8 + 0.2 * Math.sin(t * 9 + ph) * Math.sin(t * 5.1 + ph * 2);
        ctx.fillStyle = `rgba(240,170,80,${(0.12 * f).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(px + 6, 219, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(240,170,80,${(0.2 * f).toFixed(3)})`;
        ctx.fillRect(px + 1, 214, 10, 10);
        r(ctx, px + 5, 217, 2, 4, f > 0.85 ? "#ffe0a0" : C.lit);
    }
}

function drawFog(ctx: CanvasRenderingContext2D, t: number): void {
    for (const [y, speed, a, ph] of [[GY - 2, 4, 0.1, 0], [GY + 14, -3, 0.08, 120], [GY + 30, 5, 0.06, 260]] as const) {
        for (let i = 0; i < 6; i++) {
            const x = (((i * 90 + ph + t * speed) % 540) + 540) % 540 - 70;
            ctx.fillStyle = `rgba(120,130,150,${a})`;
            ctx.fillRect(Math.round(x), y, 60, 3);
            ctx.fillRect(Math.round(x) + 10, y - 2, 36, 2);
            ctx.fillRect(Math.round(x) + 6, y + 3, 44, 2);
        }
    }
}

/** Draw the animated manor scene filling (0,0,w,h); `t` is seconds. */
export function drawMenuBackdrop(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
    if (!staticLayer) staticLayer = buildStatic();
    if (!frameLayer) {
        frameLayer = document.createElement("canvas");
        frameLayer.width = MENU_NATIVE_W;
        frameLayer.height = MENU_NATIVE_H;
    }
    const f = frameLayer.getContext("2d")!;
    f.imageSmoothingEnabled = false;
    f.clearRect(0, 0, MENU_NATIVE_W, MENU_NATIVE_H);
    f.drawImage(staticLayer, 0, 0);
    drawTwinkle(f, t);
    drawClouds(f, t);
    drawSmoke(f, t);
    drawWindowLife(f, t);
    drawLanterns(f, t);
    drawFog(f, t);

    // Integer scale, centred; cover any leftover margin with the scene's dark edges
    const scale = Math.max(1, Math.floor(Math.min(w / MENU_NATIVE_W, h / MENU_NATIVE_H)));
    const dw = MENU_NATIVE_W * scale;
    const dh = MENU_NATIVE_H * scale;
    const dx = Math.floor((w - dw) / 2);
    const dy = Math.floor((h - dh) / 2);
    ctx.fillStyle = C.skyTop;
    ctx.fillRect(0, 0, w, dy + 1);
    ctx.fillStyle = C.lawn;
    ctx.fillRect(0, dy + dh - 1, w, h - dy - dh + 1);
    const prev = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(frameLayer, dx, dy, dw, dh);
    ctx.imageSmoothingEnabled = prev;
}
