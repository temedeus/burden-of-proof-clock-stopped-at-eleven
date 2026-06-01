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
        grid(ctx, 0, 0, 2, [
            "oooooooooooooooo",
            "odWdWdWdWdWdWdWo",
            "oWdWdWdWdWdWdWdWo",
            "odWdWdWdWdWdWdWo",
            "oWdWdWdWdWdWdWdWo",
            "odWdWdWdWdWdWdWo",
            "oWdWdWdWdWdWdWdWo",
            "odWdWdWdWdWdWdWo",
            "oWdWdWdWdWdWdWdWo",
            "odWdWdWdWdWdWdWo",
            "oWdWdWdWdWdWdWdWo",
            "odWdWdWdWdWdWdWo",
            "oWdWdWdWdWdWdWdWo",
            "odWdWdWdWdWdWdWo",
            "oWdWdWdWdWdWdWdWo",
            "oooooooooooooooo"
        ], C);
    }),

    grass: tile32((ctx) => {
        grid(ctx, 0, 0, 2, [
            "oooooooooooooooo",
            "oDgDgDgDgDgDgDgDo",
            "ogGgGgGgGgGgGgGo",
            "oDgGgDgGgDgGgDgGo",
            "ogGgGgGgGgGgGgGo",
            "oGgDgGgDgGgDgGgDo",
            "ogGgGgGgGgGgGgGo",
            "oDgGgDgGgDgGgDgGo",
            "ogGgGgGgGgGgGgGo",
            "oGgDgGgDgGgDgGgDo",
            "ogGgGgGgGgGgGgGo",
            "oDgGgDgGgDgGgDgGo",
            "ogGgGgGgGgGgGgGo",
            "oGgDgGgDgGgDgGgDo",
            "ogGgGgGgGgGgGgGo",
            "oooooooooooooooo"
        ], C);
        r(ctx, 4, 4, 2, 4, P.grassHi);
        r(ctx, 22, 18, 2, 6, P.grassHi);
        r(ctx, 14, 10, 2, 2, P.grassHi);
    }),

    gravel: tile32((ctx) => {
        grid(ctx, 0, 0, 2, [
            "oooooooooooooooo",
            "ovVvVvVvVvVvVvVvo",
            "oVvVvVvVvVvVvVvVvo",
            "ovVvVvVvVvVvVvVvvo",
            "oVvVvVvVvVvVvVvVvo",
            "ovVvVvVvVvVvVvVvvo",
            "oVvVvVvVvVvVvVvVvo",
            "ovVvVvVvVvVvVvVvvo",
            "oVvVvVvVvVvVvVvVvo",
            "ovVvVvVvVvVvVvVvvo",
            "oVvVvVvVvVvVvVvVvo",
            "ovVvVvVvVvVvVvVvvo",
            "oVvVvVvVvVvVvVvVvo",
            "ovVvVvVvVvVvVvVvvo",
            "oVvVvVvVvVvVvVvVvo",
            "oooooooooooooooo"
        ], { ...C, v: P.gravel, V: P.gravelLight });
        r(ctx, 6, 8, 2, 2, P.gravelDark);
        r(ctx, 18, 14, 2, 2, P.gravelDark);
        r(ctx, 12, 20, 2, 2, P.gravelDark);
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
            r(ctx, 2, 10, 28, 6, P.wood);
            r(ctx, 2, 10, 28, 2, P.woodLight);
            r(ctx, 6, 16, 4, 14, P.woodDark);
            r(ctx, 22, 16, 4, 14, P.woodDark);
            r(ctx, 0, 8, 32, 2, P.outline);
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
