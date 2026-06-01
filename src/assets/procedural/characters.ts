import { P } from "./palette";
import { r } from "./pixel";
import type { ProceduralSpriteDef } from "./types";

export interface HumanoidStyle {
    coat: string;
    coatLight: string;
    skin?: string;
    hair: string;
    hat?: string;
    hatBand?: string;
    pants?: string;
    shoes?: string;
    accent?: string;
}

function drawHumanoid(ctx: CanvasRenderingContext2D, s: HumanoidStyle): void {
    const skin = s.skin ?? P.skin;
    const pants = s.pants ?? P.shadow;
    const shoes = s.shoes ?? P.black;

    // Head
    r(ctx, 12, 2, 8, 8, skin);
    r(ctx, 12, 2, 8, 2, s.hair);
    r(ctx, 11, 3, 2, 4, s.hair);
    r(ctx, 19, 3, 2, 4, s.hair);
    r(ctx, 14, 6, 2, 2, P.black);
    r(ctx, 18, 6, 2, 2, P.black);

    if (s.hat) {
        r(ctx, 10, 0, 12, 4, s.hat);
        r(ctx, 8, 2, 16, 2, s.hat);
        if (s.hatBand) r(ctx, 10, 3, 12, 1, s.hatBand);
    }

    // Body / coat
    r(ctx, 10, 10, 12, 14, s.coat);
    r(ctx, 11, 11, 10, 4, s.coatLight);
    if (s.accent) r(ctx, 14, 14, 4, 6, s.accent);

    // Arms
    r(ctx, 6, 12, 4, 12, s.coat);
    r(ctx, 22, 12, 4, 12, s.coat);
    r(ctx, 6, 20, 4, 4, skin);
    r(ctx, 22, 20, 4, 4, skin);

    // Legs
    r(ctx, 11, 24, 4, 10, pants);
    r(ctx, 17, 24, 4, 10, pants);
    r(ctx, 10, 32, 6, 4, shoes);
    r(ctx, 16, 32, 6, 4, shoes);

    // Outline touches
    r(ctx, 10, 10, 1, 14, P.outline);
    r(ctx, 21, 10, 1, 14, P.outline);
}

function humanoid(style: HumanoidStyle): ProceduralSpriteDef {
    return {
        nativeWidth: 32,
        nativeHeight: 40,
        draw(ctx) {
            r(ctx, 0, 0, 32, 40, P.transparent);
            drawHumanoid(ctx, style);
        }
    };
}

export const CHARACTER_SPRITES: Record<string, ProceduralSpriteDef> = {
    female_detective: humanoid({
        coat: P.coatBrown,
        coatLight: P.coatBrownLight,
        hair: P.brickDark,
        accent: P.red
    }),
    male_detective: humanoid({
        coat: P.coatNavy,
        coatLight: P.coatNavyLight,
        hair: P.black,
        accent: P.gold
    }),
    baron: humanoid({
        coat: P.black,
        coatLight: P.shadow,
        hair: P.highlight,
        hat: P.black,
        hatBand: P.gold,
        pants: P.black
    }),
    baroness: humanoid({
        coat: P.carpetRed,
        coatLight: P.carpetRedLight,
        hair: P.gold,
        accent: P.gold
    }),
    maid: humanoid({
        coat: P.maidBlack,
        coatLight: P.maidWhite,
        hair: P.black,
        accent: P.maidWhite,
        pants: P.maidBlack
    }),
    worker_man: humanoid({
        coat: P.coatGray,
        coatLight: P.coatGrayLight,
        hair: P.brick,
        pants: P.coatBrown
    }),
    worker_boy: humanoid({
        coat: P.green,
        coatLight: P.greenLight,
        hair: P.woodDark,
        skin: P.skinHi,
        pants: P.woodDark
    }),
    police: humanoid({
        coat: P.policeBlue,
        coatLight: P.blueLight,
        hair: P.black,
        hat: P.policeBlue,
        hatBand: P.policeGold,
        accent: P.policeGold
    }),
    police2: humanoid({
        coat: P.policeBlue,
        coatLight: P.blue,
        hair: P.highlight,
        hat: P.policeBlue,
        hatBand: P.policeGold
    }),
    npc_male: humanoid({
        coat: P.coatGray,
        coatLight: P.mid,
        hair: P.black
    }),
    npc_female: humanoid({
        coat: P.coatBrownLight,
        coatLight: P.highlight,
        hair: P.brick
    }),
    player: humanoid({
        coat: P.coatNavy,
        coatLight: P.coatNavyLight,
        hair: P.black,
        accent: P.gold
    })
};
