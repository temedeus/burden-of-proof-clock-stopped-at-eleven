import { P } from "./palette";
import { grid, r } from "./pixel";
import type { ProceduralSpriteDef } from "./types";

const C = {
    o: P.outline,
    s: P.shadow,
    m: P.mid,
    l: P.light,
    h: P.highlight,
    w: P.wood,
    W: P.woodLight,
    H: P.woodHi,
    d: P.woodDark,
    g: P.grass,
    G: P.grassLight,
    D: P.grassDark,
    v: P.gravel,
    V: P.gravelLight,
    b: P.brick,
    B: P.brickLight,
    k: P.black
};

function tile32(draw: (ctx: CanvasRenderingContext2D) => void): ProceduralSpriteDef {
    return { nativeWidth: 32, nativeHeight: 32, draw: (ctx) => draw(ctx) };
}

export const TILE_SPRITES: Record<string, ProceduralSpriteDef> = {
    wall: tile32((ctx) => {
        grid(ctx, 0, 0, 2, [
            "oooooooooooooooo",
            "obBbBbBbBbBbBbBo",
            "oBsBsBsBsBsBsBsBo",
            "obBbBbBbBbBbBbBo",
            "oBsBsBsBsBsBsBsBo",
            "obBbBbBbBbBbBbBo",
            "oBsBsBsBsBsBsBsBo",
            "obBbBbBbBbBbBbBo",
            "oBsBsBsBsBsBsBsBo",
            "obBbBbBbBbBbBbBo",
            "oBsBsBsBsBsBsBsBo",
            "obBbBbBbBbBbBbBo",
            "oBsBsBsBsBsBsBsBo",
            "obBbBbBbBbBbBbBo",
            "oBsBsBsBsBsBsBsBo",
            "oooooooooooooooo"
        ], C);
    }),

    floor: tile32((ctx) => {
        // Horizontal planks — tiles seamlessly; no checkerboard
        for (let row = 0; row < 4; row++) {
            const y = row * 8;
            r(ctx, 0, y, 32, 7, row % 2 === 0 ? P.floorPlank : P.floorPlankAlt);
            r(ctx, 0, y + 7, 32, 1, P.floorSeam);
        }
        // Occasional grain knots (sparse, low contrast)
        const knots: [number, number][] = [
            [6, 5], [19, 2], [27, 13], [11, 21], [4, 26], [22, 25]
        ];
        for (const [kx, ky] of knots) {
            r(ctx, kx, ky, 2, 1, P.floorGrain);
        }
    }),

    grass: tile32((ctx) => {
        // Uniform fill — no outline ring so repeated tiles blend
        r(ctx, 0, 0, 32, 32, P.grass);
        const tufts: [number, number, number, number, string][] = [
            [2, 3, 2, 3, P.grassLight],
            [8, 6, 1, 4, P.grassHi],
            [14, 2, 3, 2, P.grassDark],
            [19, 9, 2, 5, P.grassLight],
            [25, 4, 1, 3, P.grassHi],
            [5, 14, 4, 2, P.grassLight],
            [13, 12, 2, 4, P.grassDark],
            [22, 15, 3, 2, P.grassLight],
            [28, 11, 2, 3, P.grassHi],
            [1, 22, 3, 2, P.grassDark],
            [10, 20, 2, 5, P.grassLight],
            [17, 24, 1, 2, P.grassHi],
            [24, 21, 4, 2, P.grassLight],
            [7, 27, 2, 3, P.grassDark],
            [15, 18, 2, 2, P.grassHi]
        ];
        for (const [x, y, w, h, color] of tufts) {
            r(ctx, x, y, w, h, color);
        }
    }),

    gravel: tile32((ctx) => {
        // Uniform fill — no outline ring so path tiles blend with each other and grass edges
        r(ctx, 0, 0, 32, 32, P.gravel);
        const pebbles: [number, number, number, number, string][] = [
            [2, 4, 2, 2, P.gravelLight],
            [9, 2, 3, 2, P.gravelDark],
            [16, 6, 2, 3, P.gravelLight],
            [23, 3, 2, 2, P.gravelDark],
            [28, 8, 2, 2, P.gravelLight],
            [5, 12, 2, 2, P.gravelDark],
            [13, 11, 3, 2, P.gravelLight],
            [20, 14, 2, 2, P.gravelDark],
            [26, 17, 3, 2, P.gravelLight],
            [1, 19, 2, 2, P.gravelLight],
            [8, 22, 2, 3, P.gravelDark],
            [15, 20, 2, 2, P.gravelLight],
            [22, 24, 3, 2, P.gravelDark],
            [27, 21, 2, 2, P.gravelLight],
            [4, 27, 2, 2, P.gravelDark],
            [12, 26, 2, 2, P.gravelLight],
            [18, 28, 3, 2, P.gravelDark],
            [25, 27, 2, 2, P.gravelLight]
        ];
        for (const [x, y, w, h, color] of pebbles) {
            r(ctx, x, y, w, h, color);
        }
    }),

    ceramic: tile32((ctx) => {
        const tile = 8;
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const x = col * tile;
                const y = row * tile;
                r(ctx, x, y, tile, tile, (row + col) % 2 === 0 ? P.ceramicLight : P.ceramic);
                r(ctx, x, y, tile, 1, P.grout);
                r(ctx, x, y, 1, tile, P.grout);
            }
        }
        r(ctx, 0, 31, 32, 1, P.grout);
        r(ctx, 31, 0, 1, 32, P.grout);
    }),

    rock: tile32((ctx) => {
        r(ctx, 0, 0, 32, 32, P.rockVoid);

        const S = {
            d: P.rockDark,
            m: P.rock,
            l: P.rockLight,
            h: P.rockHi,
            s: P.rockShadow,
            f: P.rockFleck
        };

        // Irregular flagstones — dark grout shows between shapes
        grid(ctx, 0, 0, 2, [
            "..dddddddddd..",
            ".dhhhhllllld.",
            "dhlllllllllld",
            "dhllfllllllld",
            "dhlllllllllld",
            "dhllllfllllld",
            "ddllllllllldd",
            ".ddddddddddd."
        ], S);

        grid(ctx, 14, 0, 2, [
            "....dddddddd",
            "...dhlllllld",
            "..dhllllllld",
            "..dhlfllllld",
            "..dhllllllld",
            "...dhlllllld",
            "....dddddddd"
        ], S);

        grid(ctx, 0, 14, 2, [
            "dddddddd....",
            "dhlllllld...",
            "dhllllllld..",
            "dhllflllld..",
            "dhllllllld..",
            "dhlllllld...",
            "dddddddd...."
        ], S);

        grid(ctx, 13, 13, 2, [
            "..dddddddd..",
            ".dhllllllld.",
            "dhllllllllld",
            "dhllflllllld",
            "dhllllllllld",
            "dhllllllllld",
            "ddlllllllldd",
            ".dddddddddd."
        ], S);

        grid(ctx, 24, 16, 2, [
            "dddd",
            "dhld",
            "dhld",
            "dhld",
            "dddd"
        ], S);

        grid(ctx, 2, 24, 2, [
            "dddddd",
            "dhllld",
            "dhlfld",
            "dhllld",
            "dddddd"
        ], S);

        grid(ctx, 22, 2, 2, [
            "ddd",
            "dld",
            "ddd"
        ], S);

        // Thin cracks between slabs
        const cracks: [number, number, number, number][] = [
            [12, 0, 2, 32],
            [0, 12, 32, 2],
            [22, 10, 2, 14],
            [8, 22, 14, 2],
            [26, 0, 1, 16],
            [0, 26, 16, 1]
        ];
        for (const [x, y, w, h] of cracks) {
            r(ctx, x, y, w, h, P.rockVoid);
        }

        // Mineral flecks and weathering
        const flecks: [number, number, string][] = [
            [5, 5, P.rockFleck],
            [9, 9, P.rockShadow],
            [19, 3, P.rockFleck],
            [25, 7, P.rockShadow],
            [3, 19, P.rockFleck],
            [17, 21, P.rockShadow],
            [27, 25, P.rockFleck],
            [7, 27, P.rockMid],
            [21, 17, P.rockFleck],
            [15, 7, P.rockShadow],
            [29, 19, P.rockFleck]
        ];
        for (const [fx, fy, color] of flecks) {
            r(ctx, fx, fy, 1, 1, color);
        }

        // Soft top-left highlights on a few stones
        r(ctx, 3, 3, 2, 1, P.rockHi);
        r(ctx, 16, 2, 2, 1, P.rockHi);
        r(ctx, 3, 16, 2, 1, P.rockHi);
        r(ctx, 16, 16, 2, 1, P.rockHi);
    }),

    door: {
        nativeWidth: 32,
        nativeHeight: 48,
        draw(ctx) {
            r(ctx, 2, 0, 28, 48, P.woodDark);
            r(ctx, 4, 2, 24, 44, P.wood);
            r(ctx, 6, 4, 20, 38, P.woodLight);
            r(ctx, 8, 8, 16, 30, P.woodHi);
            r(ctx, 22, 24, 4, 4, P.gold);
            r(ctx, 10, 6, 12, 2, P.shadow);
            r(ctx, 2, 0, 2, 48, P.outline);
            r(ctx, 28, 0, 2, 48, P.outline);
            r(ctx, 2, 0, 28, 2, P.outline);
        }
    },

    table: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            r(ctx, 2, 10, 28, 8, P.woodLight);
            r(ctx, 2, 10, 28, 2, P.woodHi);
            r(ctx, 2, 16, 28, 2, P.woodDark);
            r(ctx, 2, 10, 2, 8, P.woodHi);
            r(ctx, 28, 10, 2, 8, P.woodDark);
            r(ctx, 6, 18, 4, 12, P.woodDark);
            r(ctx, 22, 18, 4, 12, P.woodDark);
            r(ctx, 7, 18, 2, 2, P.wood);
            r(ctx, 23, 18, 2, 2, P.wood);
        }
    },

    bookshelf: {
        nativeWidth: 32,
        nativeHeight: 48,
        draw(ctx) {
            r(ctx, 2, 0, 28, 48, P.woodDark);
            r(ctx, 4, 2, 24, 44, P.wood);
            for (let y = 6; y < 44; y += 12) {
                r(ctx, 4, y, 24, 2, P.woodLight);
            }
            const bookColors = [P.red, P.blue, P.green, P.gold, P.redLight];
            for (let shelf = 0; shelf < 3; shelf++) {
                const by = 8 + shelf * 12;
                for (let i = 0; i < 5; i++) {
                    r(ctx, 6 + i * 4, by, 3, 8, bookColors[i % bookColors.length]);
                }
            }
            r(ctx, 2, 0, 2, 48, P.outline);
            r(ctx, 28, 0, 2, 48, P.outline);
        }
    }
};
