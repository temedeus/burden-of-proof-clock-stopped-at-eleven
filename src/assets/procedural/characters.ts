import { P } from "./palette";
import { r } from "./pixel";
import type { ProceduralSpriteDef } from "./types";

export type CharacterFacing = "down" | "up" | "right";
export type CharacterPose = "idle" | "walk_a" | "walk_b";

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

/** Leg Y offsets per pose (left leg, right leg) and optional body bob */
function poseOffsets(pose: CharacterPose): {
    leftLegY: number;
    rightLegY: number;
    bodyBob: number;
    leftArmY: number;
    rightArmY: number;
} {
    switch (pose) {
        case "walk_a":
            return { leftLegY: 26, rightLegY: 22, bodyBob: 1, leftArmY: 14, rightArmY: 10 };
        case "walk_b":
            return { leftLegY: 22, rightLegY: 26, bodyBob: 1, leftArmY: 10, rightArmY: 14 };
        default:
            return { leftLegY: 24, rightLegY: 24, bodyBob: 0, leftArmY: 12, rightArmY: 12 };
    }
}

function drawHumanoidFront(
    ctx: CanvasRenderingContext2D,
    s: HumanoidStyle,
    pose: CharacterPose
): void {
    const skin = s.skin ?? P.skin;
    const pants = s.pants ?? P.shadow;
    const shoe = s.shoes ?? P.shoeBrown;
    const shoeHi = P.shoeBrownHi;
    const o = poseOffsets(pose);
    const by = o.bodyBob;

    r(ctx, 12, 2 + by, 8, 8, skin);
    r(ctx, 12, 2 + by, 8, 2, s.hair);
    r(ctx, 11, 3 + by, 2, 4, s.hair);
    r(ctx, 19, 3 + by, 2, 4, s.hair);
    r(ctx, 14, 6 + by, 2, 2, P.black);
    r(ctx, 18, 6 + by, 2, 2, P.black);

    if (s.hat) {
        r(ctx, 10, 0 + by, 12, 4, s.hat);
        r(ctx, 8, 2 + by, 16, 2, s.hat);
        if (s.hatBand) r(ctx, 10, 3 + by, 12, 1, s.hatBand);
    }

    r(ctx, 10, 10 + by, 12, 14, s.coat);
    r(ctx, 11, 11 + by, 10, 4, s.coatLight);
    if (s.accent) r(ctx, 14, 14 + by, 4, 6, s.accent);

    r(ctx, 6, o.leftArmY + by, 4, 12, s.coat);
    r(ctx, 22, o.rightArmY + by, 4, 12, s.coat);
    r(ctx, 6, 20 + by, 4, 4, skin);
    r(ctx, 22, 20 + by, 4, 4, skin);

    r(ctx, 11, o.leftLegY + by, 4, 8, pants);
    r(ctx, 17, o.rightLegY + by, 4, 8, pants);
    drawFrontShoes(ctx, o.leftLegY, o.rightLegY, by, shoe, shoeHi);

    r(ctx, 10, 10 + by, 1, 14, P.outline);
    r(ctx, 21, 10 + by, 1, 14, P.outline);
}

function drawHumanoidBack(
    ctx: CanvasRenderingContext2D,
    s: HumanoidStyle,
    pose: CharacterPose
): void {
    const pants = s.pants ?? P.shadow;
    const shoe = s.shoes ?? P.shoeBrown;
    const shoeHi = P.shoeBrownHi;
    const o = poseOffsets(pose);
    const by = o.bodyBob;

    r(ctx, 10, 0 + by, 12, 6, s.hair);
    r(ctx, 11, 4 + by, 10, 6, s.hair);
    r(ctx, 10, 10 + by, 12, 15, s.coat);
    r(ctx, 11, 12 + by, 10, 8, s.coatLight);

    r(ctx, 8, o.leftArmY + by, 3, 10, s.coat);
    r(ctx, 21, o.rightArmY + by, 3, 10, s.coat);

    r(ctx, 11, o.leftLegY + by, 4, 8, pants);
    r(ctx, 17, o.rightLegY + by, 4, 8, pants);
    drawFrontShoes(ctx, o.leftLegY, o.rightLegY, by, shoe, shoeHi);
}

/** Side-view leg positions: near (front) vs far (back) leg + foot */
function sideLegLayout(pose: CharacterPose): {
    farX: number;
    farY: number;
    nearX: number;
    nearY: number;
    nearToeX: number;
} {
    switch (pose) {
        case "walk_a":
            return { farX: 14, farY: 24, nearX: 16, nearY: 27, nearToeX: 20 };
        case "walk_b":
            return { farX: 15, farY: 27, nearX: 17, nearY: 24, nearToeX: 19 };
        default:
            return { farX: 15, farY: 25, nearX: 16, nearY: 25, nearToeX: 18 };
    }
}

function drawFoot(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    shoe: string,
    shoeHi: string
): void {
    r(ctx, x, y, w, h, shoe);
    r(ctx, x + w - 2, y, 2, 1, shoeHi);
}

/** Front/back: one shoe under a leg with gap between left and right */
function drawFrontShoes(
    ctx: CanvasRenderingContext2D,
    leftLegY: number,
    rightLegY: number,
    by: number,
    shoe: string,
    shoeHi: string
): void {
    const leftFootY = leftLegY + 8 + by;
    const rightFootY = rightLegY + 8 + by;
    drawFoot(ctx, 10, leftFootY, 4, 3, shoe, shoeHi);
    drawFoot(ctx, 19, rightFootY, 4, 3, shoe, shoeHi);
}

function drawHumanoidSide(
    ctx: CanvasRenderingContext2D,
    s: HumanoidStyle,
    pose: CharacterPose
): void {
    const skin = s.skin ?? P.skin;
    const pants = s.pants ?? P.pantsSide;
    const pantsFar = P.pantsSideFar;
    const shoe = s.shoes ?? P.shoeBrown;
    const shoeHi = P.shoeBrownHi;
    const o = poseOffsets(pose);
    const by = o.bodyBob;
    const legs = sideLegLayout(pose);

    r(ctx, 14, 2 + by, 8, 8, skin);
    r(ctx, 16, 2 + by, 6, 3, s.hair);
    r(ctx, 18, 6 + by, 2, 2, P.black);

    if (s.hat) {
        r(ctx, 12, 0 + by, 12, 4, s.hat);
        if (s.hatBand) r(ctx, 14, 3 + by, 8, 1, s.hatBand);
    }

    r(ctx, 12, 10 + by, 10, 14, s.coat);
    r(ctx, 13, 12 + by, 6, 5, s.coatLight);
    if (s.accent) r(ctx, 14, 16 + by, 3, 5, s.accent);

    r(ctx, 20, 12 + by, 4, 10, s.coat);
    r(ctx, 21, 18 + by, 3, 4, skin);
    r(ctx, 8, 14 + by, 3, 8, s.coat);

    // Far leg (behind) — thinner, higher, muted pant tone
    r(ctx, legs.farX, legs.farY + by, 3, 6, pantsFar);
    drawFoot(ctx, legs.farX, legs.farY + 6 + by, 3, 3, shoe, shoeHi);

    // Near leg (front) — separate foot, toe toward facing direction when walking
    r(ctx, legs.nearX, legs.nearY + by, 4, 7, pants);
    if (pose === "idle") {
        drawFoot(ctx, legs.nearX, legs.nearY + 7 + by, 4, 3, shoe, shoeHi);
    } else {
        drawFoot(ctx, legs.nearToeX - 3, legs.nearY + 7 + by, 4, 3, shoe, shoeHi);
        r(ctx, legs.nearToeX - 1, legs.nearY + 8 + by, 2, 2, shoeHi);
    }
}

/** Draw one animation frame (bake facing `right`; mirror for `left` at render time) */
export function drawHumanoidFrame(
    ctx: CanvasRenderingContext2D,
    s: HumanoidStyle,
    facing: CharacterFacing,
    pose: CharacterPose
): void {
    r(ctx, 0, 0, 32, 40, P.transparent);
    switch (facing) {
        case "up":
            drawHumanoidBack(ctx, s, pose);
            break;
        case "right":
            drawHumanoidSide(ctx, s, pose);
            break;
        default:
            drawHumanoidFront(ctx, s, pose);
    }
}

export const PLAYER_CHARACTER_STYLES: Record<string, HumanoidStyle> = {
    female_detective: {
        coat: P.coatBrown,
        coatLight: P.coatBrownLight,
        hair: P.brickDark,
        accent: P.red
    },
    male_detective: {
        coat: P.coatNavy,
        coatLight: P.coatNavyLight,
        hair: P.black,
        accent: P.gold
    }
};

function humanoid(style: HumanoidStyle): ProceduralSpriteDef {
    return {
        nativeWidth: 32,
        nativeHeight: 40,
        draw(ctx) {
            drawHumanoidFrame(ctx, style, "down", "idle");
        }
    };
}

export const CHARACTER_SPRITES: Record<string, ProceduralSpriteDef> = {
    female_detective: humanoid(PLAYER_CHARACTER_STYLES.female_detective),
    male_detective: humanoid(PLAYER_CHARACTER_STYLES.male_detective),
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
