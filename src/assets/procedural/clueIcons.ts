import { P } from "./palette";
import { r } from "./pixel";
import type { ProceduralSpriteDef } from "./types";

/** Inventory grid icons — the collected item, not the furniture it came from. */
export const CLUE_ICON_SPRITES: Record<string, ProceduralSpriteDef> = {
    clue_generic: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            r(ctx, 8, 6, 16, 20, P.cream);
            r(ctx, 9, 7, 14, 18, P.white);
            r(ctx, 10, 10, 10, 1, P.shadow);
            r(ctx, 10, 14, 8, 1, P.shadow);
            r(ctx, 10, 18, 6, 1, P.highlight);
        }
    },

    clue_torn_note: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            r(ctx, 7, 8, 14, 18, P.cream);
            r(ctx, 8, 9, 12, 16, P.white);
            r(ctx, 20, 8, 6, 4, P.transparent);
            r(ctx, 9, 12, 10, 1, P.shadow);
            r(ctx, 9, 16, 8, 1, P.shadow);
            r(ctx, 9, 20, 6, 1, P.mid);
            r(ctx, 21, 10, 2, 2, P.cream);
            r(ctx, 22, 12, 2, 2, P.white);
        }
    },

    clue_burned_ledger: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            r(ctx, 6, 9, 20, 16, P.black);
            r(ctx, 7, 10, 18, 14, P.woodDark);
            r(ctx, 8, 12, 14, 1, P.cream);
            r(ctx, 8, 15, 12, 1, P.cream);
            r(ctx, 8, 18, 10, 1, P.highlight);
            r(ctx, 20, 9, 4, 6, P.brick);
            r(ctx, 21, 10, 3, 4, P.brickDark);
        }
    },

    clue_floor_plans: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            r(ctx, 5, 10, 22, 14, P.cream);
            r(ctx, 6, 11, 20, 12, P.white);
            r(ctx, 8, 13, 8, 6, P.highlight);
            r(ctx, 17, 13, 6, 4, P.shadow);
            r(ctx, 9, 14, 2, 2, P.blue);
            r(ctx, 13, 16, 3, 1, P.blue);
            r(ctx, 18, 15, 4, 2, P.blue);
            r(ctx, 4, 9, 24, 2, P.wood);
            r(ctx, 4, 23, 24, 2, P.wood);
        }
    },

    clue_estate_documents: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            r(ctx, 8, 7, 16, 20, P.cream);
            r(ctx, 9, 8, 14, 18, P.white);
            r(ctx, 10, 6, 14, 3, P.cream);
            r(ctx, 11, 5, 12, 2, P.white);
            r(ctx, 14, 16, 6, 6, P.brickDark);
            r(ctx, 15, 17, 4, 4, P.red);
            r(ctx, 10, 12, 10, 1, P.shadow);
            r(ctx, 10, 15, 8, 1, P.shadow);
        }
    },

    clue_journal: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            r(ctx, 6, 8, 20, 18, P.woodDark);
            r(ctx, 7, 9, 18, 16, P.cream);
            r(ctx, 8, 10, 16, 14, P.white);
            r(ctx, 6, 8, 4, 18, P.wood);
            for (let y = 13; y < 22; y += 3) {
                r(ctx, 10, y, 12, 1, P.highlight);
            }
            r(ctx, 22, 9, 3, 8, P.brickDark);
        }
    },

    clue_silver_key: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            r(ctx, 11, 8, 8, 8, P.silverDark);
            r(ctx, 12, 9, 6, 6, P.silver);
            r(ctx, 13, 10, 4, 4, P.white);
            r(ctx, 19, 12, 10, 3, P.silver);
            r(ctx, 27, 10, 3, 7, P.silverDark);
            r(ctx, 28, 11, 1, 5, P.white);
            r(ctx, 14, 11, 2, 2, P.black);
        }
    },

    clue_smuggling_docs: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            r(ctx, 9, 8, 14, 18, P.cream);
            r(ctx, 10, 9, 12, 16, P.white);
            r(ctx, 7, 10, 14, 16, P.cream);
            r(ctx, 8, 11, 12, 14, P.white);
            r(ctx, 10, 13, 8, 1, P.shadow);
            r(ctx, 10, 16, 8, 1, P.shadow);
            r(ctx, 11, 19, 6, 1, P.black);
            r(ctx, 12, 22, 4, 1, P.black);
        }
    },

    clue_bloody_apron: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            r(ctx, 10, 6, 12, 8, P.white);
            r(ctx, 8, 14, 16, 14, P.white);
            r(ctx, 9, 7, 10, 6, P.cream);
            r(ctx, 10, 16, 12, 10, P.cream);
            r(ctx, 12, 18, 8, 6, P.brickDark);
            r(ctx, 13, 19, 6, 4, P.red);
            r(ctx, 14, 8, 4, 2, P.highlight);
        }
    },

    clue_cellar_evidence: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            r(ctx, 6, 10, 20, 14, P.woodDark);
            r(ctx, 7, 11, 18, 12, P.wood);
            r(ctx, 8, 12, 16, 2, P.woodLight);
            r(ctx, 22, 14, 6, 8, P.ironDark);
            r(ctx, 23, 16, 4, 4, P.iron);
            r(ctx, 10, 20, 8, 2, P.shadow);
            r(ctx, 24, 12, 2, 2, P.brick);
        }
    },

    clue_ledger_page: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            r(ctx, 7, 8, 18, 18, P.cream);
            r(ctx, 8, 9, 16, 16, P.white);
            r(ctx, 9, 12, 12, 1, P.shadow);
            r(ctx, 9, 15, 10, 1, P.shadow);
            r(ctx, 9, 18, 8, 1, P.shadow);
            r(ctx, 10, 21, 6, 2, P.black);
            r(ctx, 11, 22, 4, 1, P.red);
        }
    },

    clue_murder_weapon: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            r(ctx, 8, 20, 16, 4, P.woodDark);
            r(ctx, 9, 21, 14, 2, P.wood);
            r(ctx, 14, 6, 4, 16, P.silverDark);
            r(ctx, 15, 7, 2, 14, P.silver);
            r(ctx, 14, 5, 4, 2, P.silver);
            r(ctx, 13, 4, 6, 2, P.white);
            r(ctx, 15, 18, 2, 2, P.brickDark);
        }
    }
};
