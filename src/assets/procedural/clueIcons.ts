import { P } from "./palette";
import { r } from "./pixel";
import type { ProceduralSpriteDef } from "./types";

type Ctx = CanvasRenderingContext2D;

/** Outlined filled rect: 1px dark border, fill, top-left highlight, bottom-right shade. */
function box(ctx: Ctx, x: number, y: number, w: number, h: number, fill: string, hi?: string, lo?: string): void {
    r(ctx, x, y, w, h, P.black);
    r(ctx, x + 1, y + 1, w - 2, h - 2, fill);
    if (hi) {
        r(ctx, x + 1, y + 1, w - 2, 1, hi);
        r(ctx, x + 1, y + 1, 1, h - 2, hi);
    }
    if (lo) {
        r(ctx, x + 1, y + h - 2, w - 2, 1, lo);
        r(ctx, x + w - 2, y + 1, 1, h - 2, lo);
    }
}

/** Soft ground shadow so every icon sits on the slot. */
function ground(ctx: Ctx, x = 6, w = 20): void {
    r(ctx, x, 28, w, 2, "rgba(0,0,0,0.35)");
}

function paper(ctx: Ctx, x: number, y: number, w: number, h: number, ink: string = P.mid): void {
    box(ctx, x, y, w, h, P.cream, P.white, P.light);
    for (let ly = y + 4; ly < y + h - 3; ly += 3) {
        r(ctx, x + 3, ly, w - 7 - ((ly / 3) % 2 === 0 ? 2 : 0), 1, ink);
    }
}

function key(ctx: Ctx, body: string, hi: string, lo: string, rust = false): void {
    // bow (ring)
    box(ctx, 3, 8, 12, 12, body, hi, lo);
    r(ctx, 6, 11, 6, 6, P.black);
    r(ctx, 7, 12, 4, 4, "#2a2018");
    // shaft
    box(ctx, 14, 12, 15, 4, body, hi, lo);
    // bit teeth
    box(ctx, 23, 15, 3, 6, body, hi, lo);
    box(ctx, 27, 15, 3, 5, body, hi, lo);
    if (rust) {
        r(ctx, 5, 10, 2, 2, P.brick);
        r(ctx, 12, 17, 2, 2, P.brick);
        r(ctx, 18, 13, 2, 2, P.brickLight);
        r(ctx, 24, 17, 1, 2, P.brick);
    }
}

function book(ctx: Ctx, cover: string, coverHi: string, clasp: string): void {
    box(ctx, 5, 5, 22, 23, cover, coverHi, P.black);
    box(ctx, 7, 7, 18, 19, P.cream, P.white, P.light);
    r(ctx, 5, 5, 5, 23, P.black);
    r(ctx, 6, 6, 3, 21, cover);
    r(ctx, 6, 6, 1, 21, coverHi);
    for (let y = 11; y < 24; y += 3) r(ctx, 12, y, 11, 1, P.mid);
    r(ctx, 12, 8, 7, 2, P.shadow);
    r(ctx, 24, 12, 4, 6, P.black);
    r(ctx, 25, 13, 2, 4, clasp);
}

/** Inventory grid icons — the collected item, not the furniture it came from. */
export const CLUE_ICON_SPRITES: Record<string, ProceduralSpriteDef> = {
    clue_generic: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            ground(ctx);
            // magnifying glass
            box(ctx, 5, 4, 16, 16, P.goldDark, P.gold, P.woodDark);
            r(ctx, 8, 7, 10, 10, P.black);
            r(ctx, 9, 8, 8, 8, "#a8c8d8");
            r(ctx, 10, 9, 3, 2, P.white);
            r(ctx, 11, 11, 1, 1, P.white);
            box(ctx, 18, 18, 4, 4, P.wood, P.woodLight);
            box(ctx, 21, 21, 6, 6, P.woodDark, P.wood);
        }
    },

    clue_torn_note: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            ground(ctx);
            paper(ctx, 6, 4, 19, 23);
            // torn jagged top-right corner
            ctx.clearRect(19, 4, 7, 7);
            r(ctx, 18, 4, 1, 3, P.black);
            r(ctx, 19, 7, 1, 2, P.black);
            r(ctx, 20, 9, 2, 1, P.black);
            r(ctx, 22, 8, 1, 2, P.black);
            r(ctx, 23, 10, 2, 1, P.black);
            r(ctx, 19, 8, 5, 1, P.cream);
            r(ctx, 24, 10, 1, 1, P.cream);
            // handwriting + scorch mark
            r(ctx, 9, 20, 5, 1, P.red);
            r(ctx, 8, 24, 4, 2, P.light);
        }
    },

    clue_burned_ledger: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            ground(ctx);
            paper(ctx, 5, 6, 21, 21, P.shadow);
            // charred, ragged edge
            r(ctx, 17, 6, 9, 9, P.black);
            r(ctx, 15, 11, 5, 5, P.black);
            r(ctx, 18, 7, 7, 7, P.woodDark);
            r(ctx, 20, 9, 4, 4, P.brickDark);
            r(ctx, 21, 10, 2, 2, "#e08030");
            r(ctx, 22, 10, 1, 1, "#f0c040");
            r(ctx, 16, 12, 3, 2, P.woodDark);
            r(ctx, 5, 22, 21, 1, P.black);
            r(ctx, 6, 23, 8, 3, P.shadow);
            r(ctx, 12, 25, 4, 2, P.woodDark);
        }
    },

    clue_floor_plans: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            ground(ctx);
            box(ctx, 3, 7, 26, 19, "#2f4a78", "#4a6aa0", "#1c2e50");
            // blueprint walls
            r(ctx, 7, 11, 18, 1, "#a8c4e8");
            r(ctx, 7, 21, 18, 1, "#a8c4e8");
            r(ctx, 7, 11, 1, 11, "#a8c4e8");
            r(ctx, 24, 11, 1, 11, "#a8c4e8");
            r(ctx, 15, 11, 1, 6, "#a8c4e8");
            r(ctx, 8, 16, 7, 1, "#a8c4e8");
            r(ctx, 15, 16, 4, 1, "#a8c4e8");
            r(ctx, 19, 16, 1, 6, "#a8c4e8");
            r(ctx, 10, 18, 3, 2, "#6a8cc0");
            r(ctx, 21, 13, 2, 2, "#6a8cc0");
            // roll ends
            box(ctx, 2, 5, 28, 3, P.cream, P.white, P.light);
            box(ctx, 2, 25, 28, 3, P.cream, P.white, P.light);
        }
    },

    clue_estate_documents: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            ground(ctx);
            paper(ctx, 7, 4, 19, 23);
            box(ctx, 14, 19, 8, 8, P.brickDark, P.red, P.black);
            r(ctx, 16, 21, 4, 4, P.redLight);
        }
    },

    clue_journal: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            ground(ctx);
            book(ctx, P.woodLight, P.woodHi, P.gold);
        }
    },

    clue_diary: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            ground(ctx);
            book(ctx, P.wine, P.redLight, P.gold);
            // gold monogram + ribbon
            r(ctx, 13, 14, 5, 5, P.gold);
            r(ctx, 14, 15, 3, 3, P.wine);
            r(ctx, 21, 26, 2, 5, P.blueLight);
        }
    },

    clue_silver_key: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            ground(ctx, 4, 24);
            key(ctx, P.silverDark, P.white, P.ironDark);
            r(ctx, 5, 10, 5, 1, P.white);
        }
    },

    clue_rusty_key: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            ground(ctx, 4, 24);
            key(ctx, P.iron, P.light, P.ironDark, true);
        }
    },

    clue_cellar_evidence: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            ground(ctx, 4, 24);
            // cellar key on a wine-coloured tag
            key(ctx, P.goldDark, P.gold, P.woodDark);
            box(ctx, 7, 20, 11, 8, P.wine, P.redLight, P.black);
            r(ctx, 9, 22, 7, 1, P.cream);
            r(ctx, 9, 24, 5, 1, P.cream);
        }
    },

    clue_smuggling_docs: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            ground(ctx);
            paper(ctx, 10, 3, 17, 22);
            paper(ctx, 5, 7, 17, 22);
            // customs stamp
            box(ctx, 11, 18, 9, 7, P.brickDark, P.red, P.black);
            r(ctx, 13, 20, 5, 3, P.redLight);
        }
    },

    clue_bloody_apron: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            ground(ctx);
            // neck strap + bib
            r(ctx, 11, 2, 10, 1, P.black);
            r(ctx, 10, 3, 2, 7, P.black);
            r(ctx, 20, 3, 2, 7, P.black);
            box(ctx, 8, 9, 16, 19, P.white, P.white, P.light);
            r(ctx, 5, 14, 3, 5, P.black);
            r(ctx, 24, 14, 3, 5, P.black);
            r(ctx, 6, 15, 2, 3, P.cream);
            r(ctx, 24, 15, 2, 3, P.cream);
            // pocket
            r(ctx, 12, 20, 8, 1, P.light);
            r(ctx, 12, 20, 1, 5, P.light);
            r(ctx, 19, 20, 1, 5, P.light);
            // blood
            r(ctx, 12, 12, 6, 5, P.red);
            r(ctx, 14, 16, 3, 5, P.red);
            r(ctx, 13, 13, 2, 2, P.redLight);
            r(ctx, 20, 22, 2, 3, P.brick);
            r(ctx, 15, 21, 1, 3, P.brickDark);
        }
    },

    clue_ledger_page: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            ground(ctx);
            box(ctx, 6, 4, 20, 24, P.cream, P.white, P.light);
            // ruled columns
            r(ctx, 15, 5, 1, 22, P.red);
            for (let y = 8; y < 26; y += 3) r(ctx, 7, y, 18, 1, "#8aa0b8");
            for (let y = 9; y < 25; y += 6) {
                r(ctx, 8, y, 5, 1, P.black);
                r(ctx, 17, y, 6, 1, P.black);
            }
            // missing corner
            ctx.clearRect(21, 24, 6, 5);
            r(ctx, 20, 24, 1, 3, P.black);
            r(ctx, 21, 27, 5, 1, P.black);
        }
    },

    clue_murder_weapon: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            ground(ctx);
            // diagonal kitchen knife (blade up-right, handle down-left)
            for (let i = 0; i < 16; i++) {
                const x = 14 + i;
                const y = 17 - i;
                r(ctx, x - 1, y - 1, 5, 4, P.black);
            }
            for (let i = 0; i < 16; i++) {
                const x = 14 + i;
                const y = 17 - i;
                r(ctx, x, y, 3, 2, P.silver);
                r(ctx, x + 2, y, 1, 2, P.silverDark);
            }
            r(ctx, 26, 4, 3, 2, P.white);
            // blood on the blade
            r(ctx, 18, 14, 4, 3, P.red);
            r(ctx, 21, 11, 2, 2, P.redLight);
            // guard + handle
            box(ctx, 10, 17, 7, 4, P.goldDark, P.gold);
            for (let i = 0; i < 7; i++) {
                const x = 4 + i;
                const y = 26 - i;
                r(ctx, x - 1, y - 2, 6, 5, P.black);
            }
            for (let i = 0; i < 7; i++) {
                const x = 4 + i;
                const y = 26 - i;
                r(ctx, x, y - 1, 4, 3, P.woodLight);
                r(ctx, x, y - 1, 1, 1, P.woodHi);
            }
        }
    },

    clue_clock: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            ground(ctx);
            box(ctx, 4, 4, 24, 24, P.woodLight, P.woodHi, P.woodDark);
            r(ctx, 7, 7, 18, 18, P.black);
            r(ctx, 8, 8, 16, 16, P.cream);
            r(ctx, 9, 9, 14, 14, P.white);
            // tick marks
            r(ctx, 15, 9, 2, 2, P.black);
            r(ctx, 15, 21, 2, 2, P.black);
            r(ctx, 9, 15, 2, 2, P.black);
            r(ctx, 21, 15, 2, 2, P.black);
            // hands: 11:00
            r(ctx, 15, 11, 2, 6, P.black);
            r(ctx, 12, 12, 3, 2, P.black);
            r(ctx, 15, 15, 2, 2, P.red);
            // crack
            r(ctx, 19, 10, 1, 3, P.mid);
            r(ctx, 20, 13, 1, 3, P.mid);
            r(ctx, 19, 16, 1, 2, P.mid);
            r(ctx, 18, 18, 1, 4, P.mid);
        }
    },

    clue_body: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            ground(ctx, 2, 28);
            // fallen figure outline: chalk silhouette over dark floor
            box(ctx, 3, 8, 26, 18, P.shadow, P.mid, P.black);
            r(ctx, 7, 13, 6, 6, P.cream); // head
            r(ctx, 8, 14, 4, 4, P.highlight);
            r(ctx, 13, 14, 11, 4, P.cream); // torso
            r(ctx, 20, 11, 6, 3, P.cream); // arm
            r(ctx, 20, 18, 7, 3, P.cream); // leg
            r(ctx, 17, 15, 3, 3, P.red);
            r(ctx, 18, 17, 2, 3, P.red);
        }
    },

    clue_testimony: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            ground(ctx);
            // speech bubble
            box(ctx, 3, 4, 26, 18, P.white, P.white, P.light);
            r(ctx, 8, 22, 1, 1, P.black);
            box(ctx, 7, 22, 6, 5, P.white);
            r(ctx, 8, 22, 4, 1, P.white);
            r(ctx, 8, 24, 4, 3, P.white);
            for (let y = 8; y < 19; y += 4) r(ctx, 7, y, 18 - (y % 8 === 0 ? 0 : 5), 2, P.shadow);
            r(ctx, 7, 8, 18, 2, P.mid);
        }
    }
};
