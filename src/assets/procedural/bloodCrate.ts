/**
 * The stained crate in the storage cellar (64x64 @1x, 2x2 tiles): a nailed
 * plank crate with dried blood smeared over the lid and run down its face.
 * The iron key that hangs from the nail is drawn separately (`drawCrateKey`) so
 * it can vanish once the player has taken it.
 */
import { hline, p, r, vline } from "./pixel";
import { ellipse, floorShadow, IRON, seeded, WOOD } from "./furnitureKit";

export const BLOOD_CRATE_W = 64;
export const BLOOD_CRATE_H = 64;
/** Nail position on the crate face (native px), where the key hangs. */
export const CRATE_NAIL = { x: 44, y: 29 };

const BLOOD = { dry: "#4a1210", mid: "#6a1a16", wet: "#8a2a20" };

export function drawBloodCrate(ctx: CanvasRenderingContext2D): void {
    const rand = seeded(1111);
    floorShadow(ctx, 4, 58, 58, 5);

    // Lid: three boards seen from above, lit
    r(ctx, 6, 8, 52, 15, WOOD.o);
    for (let i = 0; i < 3; i++) {
        const y = 9 + i * 5;
        r(ctx, 7, y, 50, 4, i === 1 ? WOOD.h : WOOD.l);
        hline(ctx, 7, y, 50, "#c8a070");
    }
    for (const x of [10, 53]) for (const y of [10, 15, 20]) p(ctx, x, y, IRON.d); // nail heads

    // Front face: horizontal planks between dark corner posts, in shade under the lid
    r(ctx, 6, 23, 52, 35, WOOD.o);
    hline(ctx, 6, 23, 52, "#140c06");
    for (let i = 0; i < 4; i++) {
        const y = 24 + i * 8;
        r(ctx, 11, y, 42, 7, i % 2 ? WOOD.d : WOOD.m);
        hline(ctx, 11, y, 42, WOOD.l);
        for (let k = 0; k < 4; k++) p(ctx, 14 + Math.floor(rand() * 36), y + 2 + Math.floor(rand() * 4), WOOD.o); // grain
    }
    // Corner battens and a diagonal brace
    for (const x of [6, 53]) {
        r(ctx, x, 23, 5, 35, WOOD.d);
        vline(ctx, x, 23, 35, x < 30 ? WOOD.l : WOOD.o);
    }
    for (let i = 0; i < 30; i++) {
        const x = 13 + Math.round(i * 1.25);
        const y = 55 - i;
        r(ctx, x, y, 3, 2, WOOD.l);
        p(ctx, x, y + 2, WOOD.o);
    }
    // Iron corner brackets
    for (const [x, y] of [[6, 23], [53, 23], [6, 52], [53, 52]] as const) {
        r(ctx, x, y, 5, 6, IRON.d);
        p(ctx, x + 2, y + 2, IRON.h);
    }
    // Faded stencil on the boards
    for (const [x, y] of [[20, 44], [21, 46], [22, 48], [23, 46], [24, 44], [27, 44], [28, 46], [29, 48], [30, 46], [31, 44]] as const) {
        p(ctx, x, y, "#8a7a5a");
    }

    // Dried blood: a smear across the lid edge, runs down the face, a stain on the floor
    ellipse(ctx, 34, 20, 9, 2, BLOOD.mid);
    ellipse(ctx, 32, 19, 5, 1, BLOOD.wet);
    for (const [x, len] of [[27, 12], [31, 20], [35, 9], [39, 16]] as const) {
        vline(ctx, x, 22, len, BLOOD.mid);
        vline(ctx, x + 1, 22, Math.max(2, len - 5), BLOOD.dry);
        r(ctx, x, 22 + len, 2, 2, BLOOD.dry); // bead at the end of the run
    }
    // Smudged handprint on the side
    r(ctx, 15, 30, 5, 4, BLOOD.dry);
    for (const fx of [15, 17, 19]) vline(ctx, fx, 27, 3, BLOOD.dry);
    // Pool soaked into the floor at the base
    ellipse(ctx, 40, 60, 10, 2, BLOOD.dry);
    ellipse(ctx, 38, 60, 5, 1, BLOOD.mid);

    // The nail the key hangs from
    r(ctx, CRATE_NAIL.x - 1, CRATE_NAIL.y - 1, 3, 2, IRON.m);
    p(ctx, CRATE_NAIL.x - 1, CRATE_NAIL.y - 1, IRON.h);
}

/**
 * Iron key hanging from the crate nail, drawn with 2px pixels so it reads at
 * game scale. (ox, oy) is the crate's top-left in native crate pixels; `sway`
 * swings the bit; `glint` lights the bow.
 */
export function drawCrateKey(ctx: CanvasRenderingContext2D, ox: number, oy: number, sway: number, glint: boolean): void {
    const nx = ox + CRATE_NAIL.x;
    const ny = oy + CRATE_NAIL.y;
    const K = (x: number, y: number, c: string) => r(ctx, nx + x * 2 - 1, ny + y * 2, 2, 2, c);
    const s = Math.round(sway);
    // Bow: a ring hung over the nail
    for (const [dx, dy] of [[-1, 0], [0, 0], [1, 0], [-1, 1], [1, 1], [-1, 2], [0, 2], [1, 2]] as const) K(dx, dy, IRON.l);
    K(-1, 0, glint ? "#f0ece0" : IRON.h);
    K(0, 1, "#1a1612"); // the hole, nail showing through
    // Shaft and bit
    for (let i = 3; i < 9; i++) K(i > 6 ? s : 0, i, i % 2 ? IRON.m : IRON.l);
    K(1 + s, 7, IRON.m);
    K(1 + s, 8, IRON.d);
}
