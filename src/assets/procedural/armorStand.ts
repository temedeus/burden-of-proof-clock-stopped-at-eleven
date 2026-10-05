import { P } from "./palette";
import { discCrisp, grid, hline, p, r, vline } from "./pixel";
import { floorShadow, panel, WOOD } from "./furnitureKit";

/** Native size; drawn at 2x into the 2x3-tile box (same pixel density as characters). */
export const ARMOR_STAND_W = 32;
export const ARMOR_STAND_H = 48;

/**
 * Left half (x 0..15) of a suit of plate armour facing the viewer; mirrored for
 * the right half with one-step-darker shading (light from the upper left).
 */
const ARMOR_LEFT_HALF = [
    "................",
    "..............RR",
    ".............rRR",
    "............ooor",
    "...........ohhll",
    "...........ohlll",
    "...........olmmm",
    "...........okkkk",
    "...........olmmk",
    "...........olmml",
    "............odmm",
    "...........oddmd",
    "......ooooodmmdd",
    ".....ohhllodllhl",
    "....ohhlllodlllh",
    "....ohllmmodllhh",
    "....olmmmdodllhh",
    "....oddddoodllhh",
    ".....olmo.odllhh",
    ".....olmo.odllhh",
    ".....oddo.odlllh",
    ".....ohlo..odllh",
    ".....olmo..odllh",
    ".....olmo..oddmm",
    ".....oddo.ogggmg",
    "....ohlmo.olllld",
    "....olmmo.oddddd",
    ".....ooo..olllld",
    "..........oddddk",
    "..........olllok",
    "..........ohllok",
    "..........olmmok",
    "..........ohhhok",
    "..........olddok",
    "..........olmmok",
    "..........ohlmok",
    "..........olmmok",
    "..........olmmok",
    "..........oddmok",
    ".........olllmok",
    ".........oooooo."
];

/** Right half is a mirror, one step darker. */
const SHADE_RIGHT: Record<string, string> = { h: "l", l: "m", m: "d", R: "r" };

function armorRows(): string[] {
    return ARMOR_LEFT_HALF.map((left) => {
        const right = [...left]
            .reverse()
            .map((ch) => SHADE_RIGHT[ch] ?? ch)
            .join("");
        return left + right;
    });
}

const ARMOR_COLORS: Record<string, string> = {
    o: "#141618",
    d: "#3a4048",
    m: "#6a727c",
    l: "#9aa4ae",
    h: "#d0d8e0",
    k: "#08090a",
    g: P.gold,
    r: "#8a1c1c",
    R: "#c03a32"
};

/** 32x48 @2x — suit of plate armour on a plinth, halberd at its side. */
export function drawArmorStand(ctx: CanvasRenderingContext2D): void {
    floorShadow(ctx, 4, 46, 24, 2);
    // Oak plinth
    panel(ctx, 6, 40, 20, 6, WOOD);
    hline(ctx, 7, 41, 18, WOOD.h);

    grid(ctx, 0, 0, 1, armorRows(), ARMOR_COLORS);
    // Breastplate ridge and rivets
    vline(ctx, 15, 13, 9, ARMOR_COLORS.h);
    for (const [x, y] of [[6, 14], [25, 14], [12, 25], [19, 25]] as const) p(ctx, x, y, P.goldDark);

    // Halberd held at the right side: shaft, axe blade, spike and langets
    const sx = 28;
    vline(ctx, sx, 7, 38, WOOD.o);
    vline(ctx, sx + 1, 7, 38, WOOD.m);
    p(ctx, sx + 1, 20, WOOD.l);
    // Spear point
    vline(ctx, sx, 0, 3, ARMOR_COLORS.l);
    vline(ctx, sx + 1, 0, 3, ARMOR_COLORS.m);
    p(ctx, sx, 0, ARMOR_COLORS.h);
    // Axe blade (crescent) facing outward, back spike inward
    r(ctx, sx + 2, 3, 2, 6, ARMOR_COLORS.m);
    vline(ctx, sx + 3, 2, 8, ARMOR_COLORS.l);
    p(ctx, sx + 3, 2, ARMOR_COLORS.h);
    hline(ctx, sx - 2, 5, 2, ARMOR_COLORS.d);
    p(ctx, sx - 3, 5, ARMOR_COLORS.m);
    r(ctx, sx, 3, 2, 5, ARMOR_COLORS.d);
    // Gauntlet gripping the shaft
    r(ctx, sx - 1, 25, 3, 3, ARMOR_COLORS.m);
    p(ctx, sx - 1, 25, ARMOR_COLORS.l);
    // Brass finial on the plinth corner
    discCrisp(ctx, sx + 1, 44, 1, P.goldDark);
}

export { ARMOR_LEFT_HALF };
