import { P } from "./palette";
import { grid, hline, r, rrCrisp, shade } from "./pixel";

/** Native size; drawn at 2x into the 2x3-tile furniture box (same pixel density as characters). */
export const STUFFED_MOOSE_W = 32;
export const STUFFED_MOOSE_H = 48;

/**
 * Left half (x 0..15) of the front-facing moose head; mirrored for the right half.
 * Palmate antlers, side-set glass eyes, long bulbous muzzle, neck into the plaque.
 */
const MOOSE_LEFT_HALF = [
    "................",
    "..o...o...o.....",
    ".oWo.oWo.oWo....",
    ".oWAooWAooWAo...",
    "oWAAAWAAAWAAo...",
    "oWAAAAAAAAAAAo..",
    ".oaAAAAAAAAAAo..",
    "..oaaAAAAAAAAo..",
    "...ooaaaAAAAAo..",
    ".....oooaAAAo...",
    "........oaAAo...",
    ".........oaAo...",
    "..........oaAo..",
    "..........oaAood",
    "...........oddFF",
    "....oo....odFFlf",
    "...odFoo.odFFllf",
    "...odmFFoodFFfff",
    "....oddFFodgkFff",
    ".....ooddodkkFff",
    "..........odFfff",
    "...........odFff",
    "...........odFff",
    "..........odmMMM",
    ".........odmMMMM",
    ".........odmMMMM",
    ".........odmMnnM",
    ".........odmMnnM",
    ".........oddmMMM",
    "..........oddmmm",
    "...........ooddd",
    "............oddF",
    "...........oddFF",
    "...........odFFf",
    "...........odFFf",
    "...........oddFd"
];

/** Right half is a mirror, one step darker (light from the upper left). */
const SHADE_RIGHT: Record<string, string> = { W: "A", l: "f" };

function mooseRows(): string[] {
    return MOOSE_LEFT_HALF.map((left) => {
        const right = [...left]
            .reverse()
            .map((ch) => SHADE_RIGHT[ch] ?? ch)
            .join("");
        return left + right;
    });
}

const MOOSE_COLORS: Record<string, string> = {
    o: "#2a1a10",
    a: "#8a7a5a",
    A: "#c8b890",
    W: "#ece2c4",
    d: P.horseCoatDark,
    F: "#5e3e28",
    f: P.horseCoat,
    l: P.horseCoatLight,
    m: "#6a5040",
    M: P.horseMuzzle,
    n: P.horseNostril,
    k: P.black,
    g: P.gold
};

/** Mahogany shield plaque on a turned pedestal. */
function drawPedestal(ctx: CanvasRenderingContext2D): void {
    // Floor shadow
    hline(ctx, 7, 46, 18, "rgba(0,0,0,0.3)");
    hline(ctx, 9, 47, 14, "rgba(0,0,0,0.3)");
    // Base
    rrCrisp(ctx, 9, 43, 14, 4, 1, P.woodDark);
    hline(ctx, 10, 43, 12, P.wood);
    hline(ctx, 10, 44, 5, P.woodLight);
    // Column
    r(ctx, 13, 38, 6, 5, P.wood);
    r(ctx, 13, 38, 2, 5, P.woodLight);
    r(ctx, 18, 38, 1, 5, P.woodDark);
    // Arched mahogany shield behind the head, tapering to a point
    const mahogany = "#5a2a1c";
    const mahoganyLight = "#7a3c28";
    const mahoganyDark = "#3a1a10";
    for (let y = 24; y <= 39; y++) {
        const inset = y === 24 ? 3 : y === 25 ? 1 : y < 35 ? 0 : (y - 34) * 2;
        const left = 5 + inset;
        const width = 22 - inset * 2;
        r(ctx, left, y, width, 1, mahogany);
        r(ctx, left, y, 1, 1, mahoganyDark);
        r(ctx, left + width - 1, y, 1, 1, mahoganyDark);
        if (width > 6) {
            r(ctx, left + 1, y, 1, 1, mahoganyLight);
            r(ctx, left + width - 2, y, 1, 1, shade(mahogany, -0.2));
        }
    }
    hline(ctx, 9, 24, 14, mahoganyLight);
    // Brass name plate
    r(ctx, 13, 37, 6, 2, P.goldDark);
    hline(ctx, 13, 37, 5, P.gold);
}

export function drawStuffedMoose(ctx: CanvasRenderingContext2D): void {
    drawPedestal(ctx);
    grid(ctx, 0, 0, 1, mooseRows(), MOOSE_COLORS);
    // Dewlap ("bell") hanging under the chin
    r(ctx, 15, 31, 2, 3, P.horseCoatDark);
    r(ctx, 15, 34, 1, 1, P.horseCoatDark);
    // Mount collar where the neck meets the plaque
    hline(ctx, 11, 35, 10, "#3a1a10");
}

export { MOOSE_LEFT_HALF };
