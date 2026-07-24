import { P } from "./palette";
import { r } from "./pixel";
import type { ProceduralSpriteDef } from "./types";

export type CharacterFacing = "down" | "up" | "right";
export type CharacterPose = "idle" | "walk_a" | "walk_b";

export interface DressStyle {
    bodice: string;
    bodiceLight: string;
    skirt: string;
    skirtLight: string;
    skirtShadow: string;
    trim?: string;
    collar?: string;
    apron?: string;
    sleeve?: string;
}

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
    /** Victorian dress silhouette instead of coat and trousers. */
    dress?: DressStyle;
    /** Updo / bun — typical for period ladies. */
    hairUp?: boolean;
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

function dressPoseOffsets(pose: CharacterPose): {
    bodyBob: number;
    leftArmY: number;
    rightArmY: number;
    skirtSway: number;
    hemSpread: number;
} {
    switch (pose) {
        case "walk_a":
            return { bodyBob: 1, leftArmY: 13, rightArmY: 11, skirtSway: -1, hemSpread: 1 };
        case "walk_b":
            return { bodyBob: 1, leftArmY: 11, rightArmY: 13, skirtSway: 1, hemSpread: 1 };
        default:
            return { bodyBob: 0, leftArmY: 12, rightArmY: 12, skirtSway: 0, hemSpread: 0 };
    }
}

function drawVictorianHairFront(
    ctx: CanvasRenderingContext2D,
    s: HumanoidStyle,
    by: number
): void {
    if (s.hairUp) {
        r(ctx, 12, 0 + by, 8, 4, s.hair);
        r(ctx, 13, 0 + by, 6, 2, s.hair);
        r(ctx, 11, 3 + by, 2, 4, s.hair);
        r(ctx, 19, 3 + by, 2, 4, s.hair);
    } else {
        r(ctx, 12, 2 + by, 8, 3, s.hair);
        r(ctx, 11, 4 + by, 2, 6, s.hair);
        r(ctx, 19, 4 + by, 2, 6, s.hair);
    }
}

function drawVictorianHairBack(ctx: CanvasRenderingContext2D, s: HumanoidStyle, by: number): void {
    r(ctx, 11, 0 + by, 10, 5, s.hair);
    r(ctx, 12, 4 + by, 8, 4, s.hair);
    if (s.hairUp) {
        r(ctx, 13, 0 + by, 6, 3, s.hair);
    }
}

function drawVictorianHairSide(ctx: CanvasRenderingContext2D, s: HumanoidStyle, by: number): void {
    r(ctx, 16, 2 + by, 6, 3, s.hair);
    if (s.hairUp) {
        r(ctx, 17, 0 + by, 5, 3, s.hair);
    } else {
        r(ctx, 20, 4 + by, 3, 6, s.hair);
    }
}

function drawSkirtFront(
    ctx: CanvasRenderingContext2D,
    d: DressStyle,
    topY: number,
    bottomY: number,
    sway: number,
    hemSpread: number
): void {
    for (let y = topY; y <= bottomY; y++) {
        const t = (y - topY) / Math.max(1, bottomY - topY);
        const halfW = 5 + Math.floor(t * (6 + hemSpread));
        const cx = 16 + sway;
        const rowColor = y % 2 === 0 ? d.skirt : d.skirtLight;
        r(ctx, cx - halfW, y, halfW * 2, 1, rowColor);
    }
    r(ctx, 13 + sway, topY + 3, 3, bottomY - topY - 5, d.skirtShadow);
    r(ctx, 16 + sway, topY + 5, 2, bottomY - topY - 7, d.skirtShadow);
    if (d.trim) {
        const hemL = 8 + sway - hemSpread;
        const hemR = 24 + sway + hemSpread;
        r(ctx, hemL, bottomY, hemR - hemL, 1, d.trim);
    }
}

function drawDressFront(
    ctx: CanvasRenderingContext2D,
    s: HumanoidStyle,
    pose: CharacterPose
): void {
    const d = s.dress!;
    const skin = s.skin ?? P.skin;
    const shoe = s.shoes ?? P.shoeBrown;
    const o = dressPoseOffsets(pose);
    const by = o.bodyBob;
    const sleeve = d.sleeve ?? d.bodice;

    r(ctx, 13, 3 + by, 6, 7, skin);
    drawVictorianHairFront(ctx, s, by);
    r(ctx, 14, 6 + by, 2, 2, P.black);
    r(ctx, 17, 6 + by, 2, 2, P.black);

    if (s.hat) {
        r(ctx, 11, 0 + by, 10, 3, s.hat);
        r(ctx, 10, 2 + by, 12, 1, s.hat);
        if (s.hatBand) r(ctx, 11, 2 + by, 10, 1, s.hatBand);
    }

    if (d.collar) {
        r(ctx, 12, 9 + by, 8, 2, d.collar);
    }

    r(ctx, 11, 10 + by, 10, 8, d.bodice);
    r(ctx, 12, 11 + by, 8, 4, d.bodiceLight);
    if (d.trim) r(ctx, 13, 17 + by, 6, 1, d.trim);
    if (s.accent) r(ctx, 14, 13 + by, 4, 3, s.accent);

    r(ctx, 7, o.leftArmY + by, 4, 11, sleeve);
    r(ctx, 21, o.rightArmY + by, 4, 11, sleeve);
    r(ctx, 7, 19 + by, 3, 3, skin);
    r(ctx, 22, 19 + by, 3, 3, skin);

    if (d.apron) {
        r(ctx, 11, 10 + by, 1, 4, d.apron);
        r(ctx, 20, 10 + by, 1, 4, d.apron);
        r(ctx, 12, 12 + by, 8, 16, d.apron);
        r(ctx, 13, 28 + by, 6, 1, d.apron);
    }

    drawSkirtFront(ctx, d, 18 + by, 35 + by, o.skirtSway, o.hemSpread);
    drawFoot(ctx, 11 + o.skirtSway, 36 + by, 3, 2, shoe, P.shoeBrownHi);
    drawFoot(ctx, 18 + o.skirtSway, 36 + by, 3, 2, shoe, P.shoeBrownHi);
}

function drawDressBack(
    ctx: CanvasRenderingContext2D,
    s: HumanoidStyle,
    pose: CharacterPose
): void {
    const d = s.dress!;
    const shoe = s.shoes ?? P.shoeBrown;
    const o = dressPoseOffsets(pose);
    const by = o.bodyBob;
    const sleeve = d.sleeve ?? d.bodice;

    drawVictorianHairBack(ctx, s, by);

    r(ctx, 11, 10 + by, 10, 8, d.bodice);
    r(ctx, 12, 11 + by, 8, 5, d.bodiceLight);
    if (d.trim) r(ctx, 13, 17 + by, 6, 1, d.trim);

    r(ctx, 8, o.leftArmY + by, 3, 10, sleeve);
    r(ctx, 21, o.rightArmY + by, 3, 10, sleeve);

    r(ctx, 14, 16 + by, 4, 3, d.skirtShadow);

    drawSkirtFront(ctx, d, 18 + by, 35 + by, o.skirtSway, o.hemSpread + 1);
    drawFoot(ctx, 11 + o.skirtSway, 36 + by, 3, 2, shoe, P.shoeBrownHi);
    drawFoot(ctx, 18 + o.skirtSway, 36 + by, 3, 2, shoe, P.shoeBrownHi);
}

function drawDressSide(
    ctx: CanvasRenderingContext2D,
    s: HumanoidStyle,
    pose: CharacterPose
): void {
    const d = s.dress!;
    const skin = s.skin ?? P.skin;
    const shoe = s.shoes ?? P.shoeBrown;
    const o = dressPoseOffsets(pose);
    const by = o.bodyBob;
    const sleeve = d.sleeve ?? d.bodice;
    const sway = o.skirtSway;

    r(ctx, 14, 3 + by, 7, 7, skin);
    drawVictorianHairSide(ctx, s, by);
    r(ctx, 18, 6 + by, 2, 2, P.black);

    if (s.hat) {
        r(ctx, 13, 0 + by, 10, 3, s.hat);
        if (s.hatBand) r(ctx, 14, 2 + by, 7, 1, s.hatBand);
    }

    if (d.collar) {
        r(ctx, 14, 9 + by, 5, 2, d.collar);
    }

    r(ctx, 12, 10 + by, 9, 8, d.bodice);
    r(ctx, 13, 11 + by, 5, 4, d.bodiceLight);
    if (d.trim) r(ctx, 14, 17 + by, 4, 1, d.trim);

    r(ctx, 20, 12 + by, 4, 10, sleeve);
    r(ctx, 21, 18 + by, 3, 3, skin);

    if (d.apron) {
        r(ctx, 13, 12 + by, 6, 15, d.apron);
    }

    const topY = 18 + by;
    const bottomY = 35 + by;
    for (let y = topY; y <= bottomY; y++) {
        const t = (y - topY) / Math.max(1, bottomY - topY);
        const frontW = 3 + Math.floor(t * 2);
        const backW = 4 + Math.floor(t * 5);
        r(ctx, 14 + sway, y, frontW, 1, y % 2 === 0 ? d.skirt : d.skirtLight);
        r(ctx, 10 + sway - Math.floor(t * 2), y, backW, 1, y % 2 === 0 ? d.skirtLight : d.skirt);
    }
    r(ctx, 11 + sway, topY + 4, 2, bottomY - topY - 6, d.skirtShadow);
    if (d.trim) {
        r(ctx, 8 + sway, bottomY, 12, 1, d.trim);
    }

    const footY = 36 + by;
    if (pose === "idle") {
        drawFoot(ctx, 15 + sway, footY, 4, 2, shoe, P.shoeBrownHi);
    } else {
        drawFoot(ctx, 16 + sway + (pose === "walk_a" ? 2 : 0), footY, 4, 2, shoe, P.shoeBrownHi);
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
    if (s.dress) {
        switch (facing) {
            case "up":
                drawDressBack(ctx, s, pose);
                break;
            case "right":
                drawDressSide(ctx, s, pose);
                break;
            default:
                drawDressFront(ctx, s, pose);
        }
        return;
    }
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
        coat: P.coatNavy,
        coatLight: P.coatNavyLight,
        hair: P.brickDark,
        accent: P.red,
        hat: P.coatNavy,
        hatBand: P.red,
        hairUp: true,
        dress: {
            bodice: P.coatNavy,
            bodiceLight: P.coatNavyLight,
            skirt: P.coatBrown,
            skirtLight: P.coatBrownLight,
            skirtShadow: P.woodDark,
            trim: P.red,
            collar: P.cream
        }
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

const BARON_STYLE: HumanoidStyle = {
    coat: P.black,
    coatLight: P.shadow,
    hair: P.highlight,
    hat: P.black,
    hatBand: P.gold,
    pants: P.black
};

/** Faceless black-hooded figure used for the attic scare chase. */
function drawHoodedFigure(ctx: CanvasRenderingContext2D): void {
    const cloak = P.black;
    const cloakHi = P.outline;
    const voidFace = "#0a0806";

    // Cloak body
    r(ctx, 9, 12, 14, 18, cloak);
    r(ctx, 10, 13, 12, 6, cloakHi);
    r(ctx, 8, 14, 3, 14, cloak);
    r(ctx, 21, 14, 3, 14, cloak);

    // Hood cowl over head — face swallowed in shadow
    r(ctx, 10, 2, 12, 12, cloak);
    r(ctx, 9, 4, 14, 8, cloak);
    r(ctx, 11, 1, 10, 4, cloakHi);
    r(ctx, 12, 5, 8, 7, voidFace);
    r(ctx, 13, 7, 6, 4, P.black);

    // Boots
    r(ctx, 11, 30, 4, 4, P.shadow);
    r(ctx, 17, 30, 4, 4, P.shadow);
    r(ctx, 10, 33, 5, 2, P.outline);
    r(ctx, 17, 33, 5, 2, P.outline);
}

/** von Virtanen (victim) lying dead on the floor with a blood pool beneath. */
function drawDeadBaronBody(ctx: CanvasRenderingContext2D): void {
    const s = BARON_STYLE;
    const skin = P.skin;

    // Blood pool under the body — drawn first so the torso sits on top of it
    r(ctx, 1, 22, 30, 14, P.brickDark);
    r(ctx, 3, 23, 26, 12, P.red);
    r(ctx, 5, 24, 22, 10, P.redLight);
    r(ctx, 8, 28, 16, 5, P.brick);
    r(ctx, 10, 32, 12, 3, P.red);

    // Legs (sprawled to the right)
    r(ctx, 22, 24, 6, 4, s.pants!);
    r(ctx, 27, 25, 5, 4, s.pants!);
    r(ctx, 24, 28, 4, 3, P.shoeBrown);
    r(ctx, 29, 28, 4, 3, P.shoeBrown);

    // Torso on its back
    r(ctx, 8, 20, 16, 10, s.coat);
    r(ctx, 9, 21, 14, 4, s.coatLight);
    r(ctx, 14, 22, 6, 4, P.red);
    r(ctx, 15, 23, 4, 2, P.brickDark);

    // Arms outstretched
    r(ctx, 4, 22, 5, 3, s.coat);
    r(ctx, 23, 21, 5, 3, s.coat);
    r(ctx, 3, 23, 3, 3, skin);
    r(ctx, 25, 22, 3, 3, skin);

    // Head tilted to the left
    r(ctx, 2, 16, 8, 8, skin);
    r(ctx, 2, 16, 8, 3, s.hair);
    r(ctx, 1, 17, 2, 4, s.hair);
    r(ctx, 4, 20, 2, 1, P.outline);
    r(ctx, 7, 20, 2, 1, P.outline);

    // Hat fallen beside the head
    r(ctx, 0, 22, 7, 3, s.hat!);
    r(ctx, 1, 23, 5, 1, s.hatBand!);
}

export const CHARACTER_SPRITES: Record<string, ProceduralSpriteDef> = {
    female_detective: humanoid(PLAYER_CHARACTER_STYLES.female_detective),
    male_detective: humanoid(PLAYER_CHARACTER_STYLES.male_detective),
    baron: humanoid(BARON_STYLE),
    baron_body: {
        nativeWidth: 32,
        nativeHeight: 40,
        draw(ctx) {
            drawDeadBaronBody(ctx);
        }
    },
    baroness: humanoid({
        coat: P.carpetRed,
        coatLight: P.carpetRedLight,
        hair: P.gold,
        accent: P.gold,
        hairUp: true,
        dress: {
            bodice: P.carpetRed,
            bodiceLight: P.carpetRedLight,
            skirt: P.carpetRed,
            skirtLight: P.brick,
            skirtShadow: P.brickDark,
            trim: P.gold,
            collar: P.cream
        }
    }),
    maid: humanoid({
        coat: P.maidBlack,
        coatLight: P.maidWhite,
        hair: P.black,
        accent: P.maidWhite,
        pants: P.maidBlack,
        hairUp: true,
        dress: {
            bodice: P.maidBlack,
            bodiceLight: P.shadow,
            skirt: P.maidBlack,
            skirtLight: P.outline,
            skirtShadow: P.black,
            collar: P.maidWhite,
            apron: P.maidWhite,
            sleeve: P.maidBlack
        }
    }),
    worker_man: humanoid({
        coat: P.coatGray,
        coatLight: P.coatGrayLight,
        hair: P.brick,
        pants: P.coatBrown
    }),
    hooded_figure: {
        nativeWidth: 32,
        nativeHeight: 40,
        draw(ctx) {
            drawHoodedFigure(ctx);
        }
    },
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
        hair: P.brick,
        hairUp: true,
        dress: {
            bodice: P.coatBrown,
            bodiceLight: P.coatBrownLight,
            skirt: P.coatBrown,
            skirtLight: P.highlight,
            skirtShadow: P.woodDark,
            trim: P.cream,
            collar: P.cream
        }
    }),
    player: humanoid({
        coat: P.coatNavy,
        coatLight: P.coatNavyLight,
        hair: P.black,
        accent: P.gold
    })
};
