import { P } from "./palette";
import { grid, r, p, hline, vline, rrCrisp as rr, discCrisp, triCrisp as t, shade } from "./pixel";
import type { ProceduralSpriteDef } from "./types";

export type CharacterFacing = "down" | "up" | "right";
export type CharacterPose = "idle" | "walk_a" | "walk_b" | "walk_c" | "walk_d";

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
    /** Shirt visible in the coat's V-neck; when set, `accent` colours only the buttons. */
    shirt?: string;
    /** Victorian dress silhouette instead of coat and trousers. */
    dress?: DressStyle;
    /** Updo / bun — typical for period ladies. */
    hairUp?: boolean;
    
    // ============ ENHANCED CUSTOMIZATION (Phase 4) ============
    
    /** Body type affects proportions: slim, average, stocky, tall, petite */
    bodyType?: 'slim' | 'average' | 'stocky' | 'tall' | 'petite';
    
    /** Hair style: short, medium, long, updo, bald, braid, curly, wavy, bun */
    hairStyle?: 'short' | 'medium' | 'long' | 'updo' | 'bald' | 'braid' | 'curly' | 'wavy' | 'bun';
    
    /** Hair parting: center, left, right, none */
    hairPart?: 'center' | 'left' | 'right' | 'none';
    
    /** Facial hair style */
    facialHair?: 'none' | 'mustache' | 'beard' | 'goatee' | 'sideburns' | 'stubble';
    
    /** Eye color */
    eyeColor?: string;
    
    /** Expression: normal, happy, angry, surprised, sad, tired, determined */
    expression?: 'normal' | 'happy' | 'angry' | 'surprised' | 'sad' | 'tired' | 'determined';
    
    /** Accessories */
    glasses?: string;          // Color of glasses
    glassesStyle?: 'round' | 'square' | 'oval' | 'monocle';
    jewelry?: string;          // Color of jewelry (necklace, earrings)
    jewelryType?: 'necklace' | 'earrings' | 'both' | 'none';
    
    /** Age indicators */
    age?: 'young' | 'adult' | 'middle_aged' | 'elderly';
    
    /** Special features */
    scars?: boolean;
    freckles?: boolean;
    wrinkles?: boolean;
    
    // ==========================================================
}

/** Body proportions for different body types */
export interface BodyProportions {
    // Head dimensions
    headWidth: number;
    headHeight: number;
    headYOffset: number; // Vertical offset for head positioning
    
    // Torso dimensions
    torsoWidth: number;
    torsoHeight: number;
    torsoYOffset: number;
    
    // Arm dimensions
    armWidth: number;
    armLength: number;
    armYOffset: number;
    
    // Leg dimensions
    legWidth: number;
    legLength: number;
    legYOffset: number;
    
    // Overall height adjustment
    totalHeight: number;
    
    // Facial feature positions
    eyeYOffset: number;
    eyebrowYOffset: number;
    mouthYOffset: number;
    
    // Hair positioning
    hairYOffset: number;
    hairHeight: number;
}

/** Expression configuration for facial features */
export interface ExpressionConfig {
    eyes: {
        shape: 'normal' | 'happy' | 'angry' | 'surprised' | 'sad' | 'tired' | 'determined';
        width: number;
        height: number;
        yOffset: number;
    };
    eyebrows: {
        shape: 'normal' | 'raised' | 'furrowed' | 'curved' | 'flat' | 'knitted';
        width: number;
        yOffset: number;
    };
    mouth: {
        shape: 'line' | 'smile' | 'frown' | 'open' | 'grimace' | 'tight';
        width: number;
        height: number;
        yOffset: number;
    };
}

/** Top row of planted feet for trousered figures (feet are 2 rows tall). */
const GROUND_Y = 32;

/**
 * Front/back walk offsets. Feet stay planted on GROUND_Y; the stepping foot reads
 * 1px lower (closer to camera), the passing foot 1px lifted. Arm swing shortens
 * (forward, foreshortened) or lengthens (back) the visible sleeve.
 */
function poseOffsets(pose: CharacterPose): {
    bodyBob: number;
    leftFootDy: number;
    rightFootDy: number;
    leftArmSwing: number;
    rightArmSwing: number;
} {
    switch (pose) {
        case "walk_a":
            return { bodyBob: 1, leftFootDy: 1, rightFootDy: -1, leftArmSwing: 1, rightArmSwing: -1 };
        case "walk_b":
            return { bodyBob: 0, leftFootDy: 0, rightFootDy: -1, leftArmSwing: 0, rightArmSwing: 0 };
        case "walk_c":
            return { bodyBob: 1, leftFootDy: -1, rightFootDy: 1, leftArmSwing: -1, rightArmSwing: 1 };
        case "walk_d":
            return { bodyBob: 0, leftFootDy: -1, rightFootDy: 0, leftArmSwing: 0, rightArmSwing: 0 };
        default:
            return { bodyBob: 0, leftFootDy: 0, rightFootDy: 0, leftArmSwing: 0, rightArmSwing: 0 };
    }
}

/**
 * Get body proportions based on body type
 * Default proportions are for 'average' body type
 */
export function getBodyProportions(bodyType?: string): BodyProportions {
    // Base proportions (average body type)
    const base: BodyProportions = {
        // Head dimensions
        headWidth: 8,
        headHeight: 8,
        headYOffset: 0,
        
        // Torso dimensions
        torsoWidth: 12,
        torsoHeight: 14,
        torsoYOffset: 0,
        
        // Arm dimensions
        armWidth: 4,
        armLength: 12,
        armYOffset: 0,
        
        // Leg dimensions
        legWidth: 4,
        legLength: 8,
        legYOffset: 0,
        
        // Overall height
        totalHeight: 40,
        
        // Facial feature positions
        eyeYOffset: 0,
        eyebrowYOffset: 0,
        mouthYOffset: 0,
        
        // Hair positioning
        hairYOffset: 0,
        hairHeight: 3
    };

    switch (bodyType) {
        case 'slim':
            return {
                ...base,
                headWidth: 7,
                headHeight: 8,
                torsoWidth: 10,
                torsoHeight: 15,
                armWidth: 3,
                armLength: 13,
                legWidth: 3,
                legLength: 9,
                totalHeight: 42,
                eyeYOffset: -1,
                hairHeight: 4
            };
        
        case 'stocky':
            return {
                ...base,
                headWidth: 9,
                headHeight: 8,
                headYOffset: 1,
                torsoWidth: 14,
                torsoHeight: 13,
                armWidth: 5,
                armLength: 11,
                legWidth: 5,
                legLength: 7,
                totalHeight: 38,
                eyeYOffset: 1,
                mouthYOffset: 1,
                hairHeight: 2
            };
        
        case 'tall':
            return {
                ...base,
                headWidth: 8,
                headHeight: 9,
                headYOffset: -2,
                torsoWidth: 11,
                torsoHeight: 16,
                armWidth: 4,
                armLength: 14,
                legWidth: 4,
                legLength: 10,
                totalHeight: 44,
                eyeYOffset: -1,
                eyebrowYOffset: -1,
                mouthYOffset: -1,
                hairHeight: 4
            };
        
        case 'petite':
            return {
                ...base,
                headWidth: 7,
                headHeight: 7,
                headYOffset: 2,
                torsoWidth: 10,
                torsoHeight: 12,
                armWidth: 3,
                armLength: 10,
                legWidth: 3,
                legLength: 7,
                totalHeight: 36,
                eyeYOffset: 1,
                eyebrowYOffset: 1,
                mouthYOffset: 1,
                hairHeight: 2
            };
        
        case 'average':
        default:
            return base;
    }
}

/**
 * Get expression configuration for facial features
 */
export function getExpressionConfig(expression?: string): ExpressionConfig {
    const base: ExpressionConfig = {
        eyes: { shape: 'normal', width: 2, height: 1, yOffset: 0 },
        eyebrows: { shape: 'normal', width: 2, yOffset: 0 },
        mouth: { shape: 'line', width: 4, height: 1, yOffset: 0 }
    };

    switch (expression) {
        case 'happy':
            return {
                eyes: { shape: 'happy', width: 2, height: 1, yOffset: 0 },
                eyebrows: { shape: 'curved', width: 2, yOffset: -1 },
                mouth: { shape: 'smile', width: 6, height: 2, yOffset: 1 }
            };
        
        case 'angry':
            return {
                eyes: { shape: 'angry', width: 2, height: 1, yOffset: 0 },
                eyebrows: { shape: 'furrowed', width: 3, yOffset: -1 },
                mouth: { shape: 'frown', width: 4, height: 2, yOffset: 1 }
            };
        
        case 'surprised':
            return {
                eyes: { shape: 'surprised', width: 3, height: 3, yOffset: -1 },
                eyebrows: { shape: 'raised', width: 3, yOffset: -2 },
                mouth: { shape: 'open', width: 4, height: 3, yOffset: 2 }
            };
        
        case 'sad':
            return {
                eyes: { shape: 'sad', width: 2, height: 1, yOffset: 0 },
                eyebrows: { shape: 'curved', width: 2, yOffset: 1 },
                mouth: { shape: 'frown', width: 4, height: 2, yOffset: 1 }
            };
        
        case 'tired':
            return {
                eyes: { shape: 'tired', width: 1, height: 1, yOffset: 1 },
                eyebrows: { shape: 'flat', width: 2, yOffset: 0 },
                mouth: { shape: 'tight', width: 3, height: 1, yOffset: 1 }
            };
        
        case 'determined':
            return {
                eyes: { shape: 'determined', width: 2, height: 1, yOffset: 0 },
                eyebrows: { shape: 'knitted', width: 3, yOffset: -1 },
                mouth: { shape: 'grimace', width: 4, height: 2, yOffset: 0 }
            };
        
        case 'normal':
        default:
            return base;
    }
}

// ============================================================================
// Head & face — every feature anchors to the head box so nothing drifts when
// the body bobs or proportions change. Light comes from the upper left.
// ============================================================================

/** Head box in native sprite pixels. */
interface HeadBox {
    x: number;
    y: number;
    w: number;
    h: number;
}

interface SkinTones {
    skin: string;
    shadow: string;
    hi: string;
}

function skinTones(s: HumanoidStyle): SkinTones {
    const skin = s.skin ?? P.skin;
    return { skin, shadow: shade(skin, -0.22), hi: shade(skin, 0.18) };
}

/** Soft mouth line; ladies get a muted lip tint. */
function mouthColor(s: HumanoidStyle, tones: SkinTones): string {
    return s.dress ? shade(P.redLight, -0.2) : shade(tones.skin, -0.38);
}

function makeHead(s: HumanoidStyle, y: number): HeadBox {
    const body = getBodyProportions(s.bodyType);
    return {
        x: 16 - Math.floor(body.headWidth / 2),
        y: y + body.headYOffset,
        w: body.headWidth,
        h: body.headHeight
    };
}

function faceRows(head: HeadBox): { eyeY: number; noseY: number; mouthY: number } {
    const mouthY = head.y + head.h - 2;
    return { eyeY: head.y + Math.floor(head.h * 0.4), noseY: mouthY - 1, mouthY };
}

/** Left x of each 2px-wide eye, symmetric about the head centre. */
function frontEyes(head: HeadBox): { l: number; r: number } {
    const inset = head.w >= 8 ? Math.floor((head.w - 6) / 2) : 1;
    return { l: head.x + inset, r: head.x + head.w - 2 - inset };
}

function hairStyleOf(s: HumanoidStyle): NonNullable<HumanoidStyle["hairStyle"]> {
    return s.hairStyle ?? (s.hairUp ? "updo" : s.dress ? "long" : "medium");
}

/** Neck (behind the head) down to the torso top. */
function drawNeck(ctx: CanvasRenderingContext2D, x: number, head: HeadBox, torsoTop: number, tones: SkinTones): void {
    const y = head.y + head.h - 2;
    if (torsoTop > y) r(ctx, x, y, 4, torsoTop - y, tones.shadow);
}

function drawHeadFront(ctx: CanvasRenderingContext2D, s: HumanoidStyle, head: HeadBox, torsoTop: number): void {
    const tones = skinTones(s);
    const cx = head.x + Math.floor(head.w / 2);
    const { eyeY, noseY } = faceRows(head);
    drawNeck(ctx, cx - 2, head, torsoTop, tones);
    // Ears sit just outside the skull; far (right) ear in shadow
    p(ctx, head.x - 1, eyeY + 1, tones.skin);
    p(ctx, head.x + head.w, eyeY + 1, tones.shadow);
    rr(ctx, head.x, head.y, head.w, head.h, 4, tones.skin);
    // Shadow side of the face
    vline(ctx, head.x + head.w - 1, head.y + 2, head.h - 4, tones.shadow);
    // Nose: lit bridge, shadow under the tip
    p(ctx, cx - 1, noseY - 1, tones.hi);
    p(ctx, cx, noseY, tones.shadow);
    // Cheekbone highlight
    p(ctx, frontEyes(head).l, eyeY + 1, tones.hi);
}

function drawHeadBack(ctx: CanvasRenderingContext2D, s: HumanoidStyle, head: HeadBox, torsoTop: number): void {
    const tones = skinTones(s);
    const { eyeY } = faceRows(head);
    drawNeck(ctx, head.x + Math.floor(head.w / 2) - 2, head, torsoTop, tones);
    p(ctx, head.x - 1, eyeY + 1, tones.shadow);
    p(ctx, head.x + head.w, eyeY + 1, tones.shadow);
    rr(ctx, head.x, head.y, head.w, head.h, 4, tones.skin);
    vline(ctx, head.x + head.w - 1, head.y + 2, head.h - 4, tones.shadow);
}

/** Side view faces right; the back of the head is at head.x. */
function drawHeadSide(ctx: CanvasRenderingContext2D, s: HumanoidStyle, head: HeadBox, torsoTop: number): void {
    const tones = skinTones(s);
    const { eyeY, noseY } = faceRows(head);
    drawNeck(ctx, head.x + 2, head, torsoTop, tones);
    rr(ctx, head.x, head.y, head.w, head.h, 3, tones.skin);
    // Nose bump and its underside
    p(ctx, head.x + head.w, noseY - 1, tones.skin);
    p(ctx, head.x + head.w, noseY, tones.shadow);
    // Ear
    vline(ctx, head.x + 3, eyeY, 2, tones.shadow);
    // Jaw underside
    hline(ctx, head.x + 1, head.y + head.h - 1, 4, tones.shadow);
}

function drawFaceFront(ctx: CanvasRenderingContext2D, s: HumanoidStyle, head: HeadBox): void {
    const tones = skinTones(s);
    const expr = getExpressionConfig(s.expression);
    const { eyeY, mouthY } = faceRows(head);
    const eyes = frontEyes(head);
    const pupil = shade(s.eyeColor ?? P.black, -0.35);
    const sclera = shade(tones.skin, 0.6);
    const lid = shade(tones.skin, -0.4);
    const brow = shade(s.hair, -0.15);
    const browY = eyeY - 1;

    // [eye x, inner (pupil) x, x one step toward the nose]
    const pairs: [number, number, number][] = [
        [eyes.l, eyes.l + 1, eyes.l + 2],
        [eyes.r, eyes.r, eyes.r - 1]
    ];
    for (const [ex, inner, toward] of pairs) {
        const outer = inner === ex ? ex + 1 : ex;
        switch (expr.eyes.shape) {
            case "happy":
                hline(ctx, ex, eyeY, 2, lid);
                break;
            case "surprised":
                r(ctx, ex, eyeY - 1, 2, 2, sclera);
                p(ctx, inner, eyeY, pupil);
                break;
            case "tired":
                p(ctx, outer, eyeY, lid);
                p(ctx, inner, eyeY, pupil);
                break;
            default:
                p(ctx, outer, eyeY, sclera);
                p(ctx, inner, eyeY, pupil);
        }
        switch (expr.eyebrows.shape) {
            case "raised":
                hline(ctx, ex, browY - 1, 2, brow);
                break;
            case "furrowed":
            case "knitted":
                hline(ctx, ex, browY, 2, brow);
                p(ctx, toward, browY, brow);
                break;
            case "curved":
                p(ctx, outer, browY, brow);
                p(ctx, inner, browY - 1, brow);
                break;
            default:
                hline(ctx, ex, browY, 2, brow);
        }
    }

    const mouth = mouthColor(s, tones);
    // Neutral mouths are 2px; wider expression widths read as moustaches at this scale
    const mw = Math.max(2, Math.min(expr.mouth.width - 2, head.w - 4));
    const mx = head.x + Math.floor((head.w - mw) / 2);
    switch (expr.mouth.shape) {
        case "smile":
            hline(ctx, mx + 1, mouthY, mw - 2, mouth);
            p(ctx, mx, mouthY - 1, mouth);
            p(ctx, mx + mw - 1, mouthY - 1, mouth);
            break;
        case "frown":
            hline(ctx, mx + 1, mouthY, mw - 2, mouth);
            p(ctx, mx, mouthY + 1, mouth);
            p(ctx, mx + mw - 1, mouthY + 1, mouth);
            break;
        case "open":
            r(ctx, mx + 1, mouthY, Math.max(1, mw - 2), 2, P.outline);
            break;
        case "tight":
            hline(ctx, mx + 1, mouthY, Math.max(1, mw - 2), mouth);
            break;
        default:
            hline(ctx, mx, mouthY, mw, mouth);
    }
}

function drawFaceSide(ctx: CanvasRenderingContext2D, s: HumanoidStyle, head: HeadBox): void {
    const tones = skinTones(s);
    const expr = getExpressionConfig(s.expression);
    const { eyeY, mouthY } = faceRows(head);
    const ex = head.x + head.w - 3;
    const pupil = shade(s.eyeColor ?? P.black, -0.35);
    const sclera = shade(tones.skin, 0.6);
    const lid = shade(tones.skin, -0.4);
    const brow = shade(s.hair, -0.15);
    const mouth = mouthColor(s, tones);
    const mouthX = head.x + head.w - 2;

    switch (expr.eyes.shape) {
        case "happy":
            hline(ctx, ex, eyeY, 2, lid);
            break;
        case "surprised":
            r(ctx, ex, eyeY - 1, 2, 2, sclera);
            p(ctx, ex + 1, eyeY, pupil);
            break;
        case "tired":
            p(ctx, ex, eyeY, lid);
            p(ctx, ex + 1, eyeY, pupil);
            break;
        default:
            p(ctx, ex, eyeY, sclera);
            p(ctx, ex + 1, eyeY, pupil);
    }
    switch (expr.eyebrows.shape) {
        case "raised":
            hline(ctx, ex, eyeY - 2, 2, brow);
            break;
        case "furrowed":
        case "knitted":
            hline(ctx, ex, eyeY - 1, 3, brow);
            break;
        default:
            hline(ctx, ex, eyeY - 1, 2, brow);
    }
    switch (expr.mouth.shape) {
        case "smile":
            p(ctx, mouthX, mouthY, mouth);
            p(ctx, mouthX - 1, mouthY - 1, mouth);
            break;
        case "frown":
            p(ctx, mouthX, mouthY, mouth);
            p(ctx, mouthX - 1, mouthY + 1, mouth);
            break;
        case "open":
            hline(ctx, mouthX, mouthY, 2, P.outline);
            break;
        default:
            hline(ctx, mouthX - 1, mouthY, 2, mouth);
    }
}

function drawGlasses(ctx: CanvasRenderingContext2D, s: HumanoidStyle, head: HeadBox, side: boolean): void {
    if (!s.glasses) return;
    const g = s.glasses;
    const style = s.glassesStyle ?? "round";
    const { eyeY } = faceRows(head);

    if (side) {
        const ex = head.x + head.w - 3;
        p(ctx, ex + 2, eyeY, g);
        hline(ctx, ex, eyeY + 1, 2, g);
        if (style === "monocle") {
            p(ctx, ex - 1, eyeY, g);
            p(ctx, ex, eyeY + 2, g);
        } else {
            // Rim back edge + temple arm to the ear
            hline(ctx, head.x + 3, eyeY, ex - head.x - 3, g);
        }
        return;
    }

    const eyes = frontEyes(head);
    const lenses = style === "monocle" ? [eyes.r] : [eyes.l, eyes.r];
    for (const ex of lenses) {
        p(ctx, ex - 1, eyeY, g);
        p(ctx, ex + 2, eyeY, g);
        hline(ctx, ex, eyeY + 1, 2, g);
        if (style === "square") hline(ctx, ex - 1, eyeY - 1, 4, g);
    }
    if (style === "monocle") {
        vline(ctx, eyes.r + 2, eyeY + 1, 3, g);
    }
}

function drawEarrings(ctx: CanvasRenderingContext2D, s: HumanoidStyle, head: HeadBox, side: boolean): void {
    if (!s.jewelry || (s.jewelryType !== "earrings" && s.jewelryType !== "both")) return;
    const { eyeY } = faceRows(head);
    if (side) {
        p(ctx, head.x + 3, eyeY + 2, s.jewelry);
    } else {
        p(ctx, head.x - 1, eyeY + 2, s.jewelry);
        p(ctx, head.x + head.w, eyeY + 2, s.jewelry);
    }
}

/** Drawn after the torso so it sits on the collar. */
function drawNecklace(ctx: CanvasRenderingContext2D, s: HumanoidStyle, head: HeadBox, torsoTop: number, side: boolean): void {
    if (!s.jewelry) return;
    const type = s.jewelryType ?? "necklace";
    if (type !== "necklace" && type !== "both") return;
    if (side) {
        p(ctx, head.x + head.w - 3, torsoTop, s.jewelry);
        p(ctx, head.x + head.w - 2, torsoTop + 1, s.jewelry);
        return;
    }
    const cx = head.x + Math.floor(head.w / 2);
    hline(ctx, cx - 2, torsoTop, 4, s.jewelry);
    r(ctx, cx - 1, torsoTop + 1, 2, 1, shade(s.jewelry, -0.2));
}

function drawFacialHair(ctx: CanvasRenderingContext2D, s: HumanoidStyle, head: HeadBox, side: boolean): void {
    if (!s.facialHair || s.facialHair === "none") return;
    const hair = shade(s.hair, -0.1);
    const { eyeY, noseY, mouthY } = faceRows(head);
    const bottom = head.y + head.h - 1;

    if (side) {
        const front = head.x + head.w - 1;
        switch (s.facialHair) {
            case "mustache":
                hline(ctx, front - 2, noseY, 3, hair);
                break;
            case "beard":
                r(ctx, head.x + 3, eyeY + 2, 2, bottom - eyeY - 1, hair);
                hline(ctx, head.x + 3, bottom, head.w - 3, hair);
                hline(ctx, head.x + 4, bottom + 1, head.w - 4, hair);
                hline(ctx, front - 2, noseY, 3, hair);
                break;
            case "goatee":
                r(ctx, front - 1, bottom - 1, 2, 3, hair);
                break;
            case "sideburns":
                vline(ctx, head.x + 4, head.y + 2, eyeY - head.y + 2, hair);
                break;
            case "stubble": {
                const stubble = shade(skinTones(s).skin, -0.15);
                hline(ctx, head.x + 3, bottom, head.w - 4, stubble);
                p(ctx, front, mouthY + 1, stubble);
                break;
            }
        }
        return;
    }

    const cx = head.x + Math.floor(head.w / 2);
    switch (s.facialHair) {
        case "mustache":
            hline(ctx, cx - 2, noseY, 4, hair);
            p(ctx, cx - 3, mouthY, hair);
            p(ctx, cx + 2, mouthY, hair);
            break;
        case "beard":
            vline(ctx, head.x, eyeY + 1, bottom - eyeY, hair);
            vline(ctx, head.x + head.w - 1, eyeY + 1, bottom - eyeY, hair);
            hline(ctx, head.x + 1, bottom, head.w - 2, hair);
            hline(ctx, head.x + 2, bottom + 1, head.w - 4, hair);
            hline(ctx, cx - 2, noseY, 4, hair);
            break;
        case "goatee":
            r(ctx, cx - 1, bottom, 2, 2, hair);
            hline(ctx, cx - 2, noseY, 4, hair);
            break;
        case "sideburns":
            vline(ctx, head.x, head.y + 2, eyeY - head.y + 2, hair);
            vline(ctx, head.x + head.w - 1, head.y + 2, eyeY - head.y + 2, hair);
            break;
        case "stubble": {
            const stubble = shade(skinTones(s).skin, -0.15);
            hline(ctx, head.x + 2, bottom, head.w - 4, stubble);
            p(ctx, head.x + 1, mouthY, stubble);
            p(ctx, head.x + head.w - 2, mouthY, stubble);
            break;
        }
    }
}

function drawAgeFeatures(ctx: CanvasRenderingContext2D, s: HumanoidStyle, head: HeadBox, side: boolean): void {
    const tones = skinTones(s);
    const line = shade(tones.skin, -0.3);
    const { eyeY, noseY } = faceRows(head);
    const scar = shade(P.red, 0.25);

    if (side) {
        const ex = head.x + head.w - 3;
        if (s.wrinkles) {
            p(ctx, ex - 1, eyeY + 1, line);
            p(ctx, ex, noseY, line);
        }
        if (s.freckles) {
            p(ctx, ex, eyeY + 2, line);
            p(ctx, ex - 1, eyeY + 2, line);
        }
        if (s.scars) {
            p(ctx, ex - 1, eyeY + 1, scar);
            p(ctx, ex - 2, eyeY + 2, scar);
        }
        return;
    }

    const eyes = frontEyes(head);
    const cx = head.x + Math.floor(head.w / 2);
    if (s.wrinkles) {
        // Crow's feet + smile lines
        p(ctx, eyes.l - 1, eyeY + 1, line);
        p(ctx, eyes.r + 2, eyeY + 1, line);
        p(ctx, cx - 2, noseY, line);
        p(ctx, cx + 1, noseY, line);
    }
    if (s.freckles) {
        p(ctx, eyes.l, eyeY + 2, line);
        p(ctx, eyes.l + 1, eyeY + 1, line);
        p(ctx, eyes.r + 1, eyeY + 2, line);
        p(ctx, eyes.r, eyeY + 1, line);
    }
    if (s.scars) {
        p(ctx, eyes.l + 1, eyeY + 1, scar);
        p(ctx, eyes.l, eyeY + 2, scar);
    }
}

// ============================================================================
// Hair & hats
// ============================================================================

function hairSheen(ctx: CanvasRenderingContext2D, hair: string, head: HeadBox): void {
    hline(ctx, head.x, head.y - 1, 2, shade(hair, 0.2));
}

function drawHairFront(ctx: CanvasRenderingContext2D, s: HumanoidStyle, head: HeadBox): void {
    const hair = s.hair;
    const dark = shade(hair, -0.25);
    const { x, y, w } = head;
    const cx = x + Math.floor(w / 2);
    const style = hairStyleOf(s);
    if (style === "bald") return;

    switch (style) {
        case "short":
            rr(ctx, x - 1, y - 2, w + 2, 4, 2, hair);
            r(ctx, x - 1, y + 2, 1, 2, hair);
            r(ctx, x + w, y + 2, 1, 2, dark);
            break;
        case "long":
            rr(ctx, x - 2, y - 3, w + 4, 5, 2, hair);
            r(ctx, x - 2, y + 1, 2, 9, hair);
            r(ctx, x + w, y + 1, 2, 9, dark);
            break;
        case "updo":
        case "bun":
            discCrisp(ctx, cx, y - 3, 2, dark);
            rr(ctx, x - 1, y - 2, w + 2, 4, 2, hair);
            vline(ctx, x - 1, y + 1, 4, hair);
            vline(ctx, x + w, y + 1, 4, dark);
            break;
        case "braid":
            rr(ctx, x - 1, y - 2, w + 2, 4, 2, hair);
            vline(ctx, x - 1, y + 1, 3, hair);
            for (let i = 0; i < 9; i++) {
                hline(ctx, x + w - (i % 2), y + 1 + i, 2, i % 2 ? hair : dark);
            }
            break;
        case "curly":
            rr(ctx, x - 2, y - 3, w + 4, 5, 3, hair);
            r(ctx, x - 2, y + 1, 2, 3, hair);
            r(ctx, x + w, y + 1, 2, 3, dark);
            p(ctx, x + 1, y - 2, dark);
            p(ctx, x + 4, y - 1, dark);
            p(ctx, x + w - 1, y - 2, dark);
            break;
        case "wavy":
            rr(ctx, x - 1, y - 3, w + 2, 5, 2, hair);
            for (let i = 0; i < 6; i++) {
                const wave = i % 3 === 1 ? -1 : 0;
                hline(ctx, x - 1 + wave, y + 1 + i, 2, hair);
                hline(ctx, x + w - 1 - wave, y + 1 + i, 2, dark);
            }
            break;
        default:
            // medium
            rr(ctx, x - 1, y - 2, w + 2, 4, 2, hair);
            r(ctx, x - 1, y + 1, 2, 5, hair);
            r(ctx, x + w - 1, y + 1, 2, 5, dark);
    }

    const part = s.hairPart ?? "none";
    if (part !== "none") {
        const px = part === "left" ? x + 2 : part === "right" ? x + w - 3 : cx;
        vline(ctx, px, y - 2, 2, dark);
    }
    hairSheen(ctx, hair, head);
}

function drawHairBack(ctx: CanvasRenderingContext2D, s: HumanoidStyle, head: HeadBox): void {
    const hair = s.hair;
    const dark = shade(hair, -0.25);
    const { x, y, w, h } = head;
    const cx = x + Math.floor(w / 2);

    switch (hairStyleOf(s)) {
        case "bald":
            return;
        case "short":
            rr(ctx, x - 1, y - 2, w + 2, h - 1, 2, hair);
            break;
        case "long":
            rr(ctx, x - 2, y - 3, w + 4, h + 9, 2, hair);
            vline(ctx, x + w + 1, y, h + 5, dark);
            break;
        case "updo":
        case "bun":
            rr(ctx, x - 1, y - 2, w + 2, h - 1, 2, hair);
            discCrisp(ctx, cx, y + 1, 2, dark);
            p(ctx, cx - 1, y, hair);
            break;
        case "braid":
            rr(ctx, x - 1, y - 2, w + 2, h, 2, hair);
            for (let i = 0; i < 9; i++) {
                hline(ctx, cx - 1, y + h - 2 + i, 2, i % 2 ? hair : dark);
            }
            break;
        case "curly":
            rr(ctx, x - 2, y - 3, w + 4, h + 1, 3, hair);
            p(ctx, x + 1, y, dark);
            p(ctx, x + w - 2, y + 2, dark);
            break;
        default:
            // medium / wavy
            rr(ctx, x - 1, y - 2, w + 2, h, 2, hair);
    }
    vline(ctx, x + w, y, h - 3, dark);
    hairSheen(ctx, hair, head);
}

/** Side view (facing right): hair masses toward the back of the head (head.x). */
function drawHairSide(ctx: CanvasRenderingContext2D, s: HumanoidStyle, head: HeadBox): void {
    const hair = s.hair;
    const dark = shade(hair, -0.25);
    const { x, y, w } = head;
    const style = hairStyleOf(s);
    if (style === "bald") return;

    switch (style) {
        case "long":
            rr(ctx, x - 2, y - 3, w + 1, 5, 2, hair);
            r(ctx, x - 2, y + 1, 4, 10, hair);
            vline(ctx, x - 2, y + 3, 8, dark);
            break;
        case "curly":
            rr(ctx, x - 2, y - 3, w + 1, 5, 3, hair);
            r(ctx, x - 2, y + 1, 4, 4, hair);
            p(ctx, x, y - 1, dark);
            p(ctx, x - 1, y + 3, dark);
            break;
        case "wavy":
            rr(ctx, x - 1, y - 3, w, 5, 2, hair);
            r(ctx, x - 1, y + 1, 4, 6, hair);
            vline(ctx, x - 1, y + 2, 4, dark);
            break;
        default:
            rr(ctx, x - 1, y - 2, w, 4, 2, hair);
            if (style === "short") {
                r(ctx, x, y + 1, 3, 3, hair);
            } else {
                // medium, updo, bun, braid — back of the head down to the nape
                r(ctx, x - 1, y + 1, 4, style === "medium" ? 5 : 3, hair);
            }
            if (style === "updo" || style === "bun") {
                discCrisp(ctx, x, y - 1, 2, dark);
            }
            if (style === "braid") {
                for (let i = 0; i < 7; i++) {
                    hline(ctx, x - 1, y + 4 + i, 2, i % 2 ? hair : dark);
                }
            }
    }
    hairSheen(ctx, hair, { ...head, x: x + 1 });
}

function drawHatFrontBack(ctx: CanvasRenderingContext2D, s: HumanoidStyle, head: HeadBox, small: boolean): void {
    if (!s.hat) return;
    const { x, y, w } = head;
    const under = shade(s.hat, -0.3);
    if (small) {
        rr(ctx, x - 1, y - 3, w + 2, 3, 1, s.hat);
        hline(ctx, x - 2, y - 1, w + 4, under);
        if (s.hatBand) hline(ctx, x - 1, y - 2, w + 2, s.hatBand);
        hline(ctx, x, y - 3, 3, shade(s.hat, 0.2));
        return;
    }
    rr(ctx, x - 2, y - 3, w + 4, 4, 1, s.hat);
    r(ctx, x - 4, y, w + 8, 1, s.hat);
    hline(ctx, x - 4, y + 1, w + 8, under);
    if (s.hatBand) hline(ctx, x - 2, y - 1, w + 4, s.hatBand);
    hline(ctx, x - 1, y - 3, 3, shade(s.hat, 0.2));
}

function drawHatSide(ctx: CanvasRenderingContext2D, s: HumanoidStyle, head: HeadBox, small: boolean): void {
    if (!s.hat) return;
    const { x, y, w } = head;
    const under = shade(s.hat, -0.3);
    if (small) {
        rr(ctx, x, y - 3, w, 3, 1, s.hat);
        hline(ctx, x - 1, y - 1, w + 2, under);
        if (s.hatBand) hline(ctx, x, y - 2, w, s.hatBand);
        return;
    }
    rr(ctx, x, y - 3, w, 4, 1, s.hat);
    hline(ctx, x - 2, y, w + 5, s.hat);
    hline(ctx, x - 2, y + 1, w + 5, under);
    if (s.hatBand) hline(ctx, x, y - 1, w, s.hatBand);
    hline(ctx, x + 1, y - 3, 3, shade(s.hat, 0.2));
}

/** Head, hair, face and accessories in the right order for one facing. */
function drawFullHead(
    ctx: CanvasRenderingContext2D,
    s: HumanoidStyle,
    head: HeadBox,
    torsoTop: number,
    facing: CharacterFacing
): void {
    const small = !!s.dress;
    if (facing === "up") {
        drawHeadBack(ctx, s, head, torsoTop);
        drawHairBack(ctx, s, head);
        drawHatFrontBack(ctx, s, head, small);
        return;
    }
    const side = facing === "right";
    if (side) {
        drawHeadSide(ctx, s, head, torsoTop);
        drawHairSide(ctx, s, head);
        drawFaceSide(ctx, s, head);
    } else {
        drawHeadFront(ctx, s, head, torsoTop);
        drawHairFront(ctx, s, head);
        drawFaceFront(ctx, s, head);
    }
    drawAgeFeatures(ctx, s, head, side);
    drawFacialHair(ctx, s, head, side);
    drawGlasses(ctx, s, head, side);
    drawEarrings(ctx, s, head, side);
    if (side) drawHatSide(ctx, s, head, small);
    else drawHatFrontBack(ctx, s, head, small);
}

// ============================================================================
// Body
// ============================================================================

const GROUND_SHADOW = "rgba(0,0,0,0.28)";

function drawGroundShadow(ctx: CanvasRenderingContext2D, y: number, halfW: number): void {
    hline(ctx, 16 - halfW, y, halfW * 2, GROUND_SHADOW);
    hline(ctx, 16 - halfW + 2, y + 1, halfW * 2 - 4, GROUND_SHADOW);
}

/** Front/back arms hanging from the shoulders; inner edge darkened to separate from torso. */
function drawFrontArms(
    ctx: CanvasRenderingContext2D,
    leftX: number,
    rightX: number,
    top: number,
    sleeveLen: number,
    swingL: number,
    swingR: number,
    sleeve: string,
    tones: SkinTones
): void {
    const lit = shade(sleeve, 0.15);
    const dark = shade(sleeve, -0.3);
    const arms: [number, number, boolean][] = [
        [leftX, swingL, true],
        [rightX, swingR, false]
    ];
    for (const [x, swing, isLeft] of arms) {
        const len = sleeveLen + swing;
        r(ctx, x, top, 4, len, sleeve);
        // Sloped shoulder
        ctx.clearRect(isLeft ? x : x + 3, top, 1, 1);
        vline(ctx, isLeft ? x : x + 3, top + 1, len - 1, isLeft ? lit : dark);
        vline(ctx, isLeft ? x + 3 : x, top + 1, len - 1, dark);
        // Hand
        const hx = isLeft ? x : x + 1;
        r(ctx, hx, top + len, 3, 3, tones.skin);
        p(ctx, hx + 2, top + len + 2, tones.shadow);
        hline(ctx, hx, top + len, 3, tones.shadow);
    }
}

function drawFrontLegs(
    ctx: CanvasRenderingContext2D,
    pants: string,
    shoe: string,
    hipY: number,
    leftFootDy: number,
    rightFootDy: number
): void {
    const seam = shade(pants, -0.3);
    const shoeHi = shade(shoe, 0.3);
    const legs: [number, number, boolean][] = [
        [11, leftFootDy, true],
        [17, rightFootDy, false]
    ];
    for (const [x, dy, isLeft] of legs) {
        const footTop = GROUND_Y + dy;
        r(ctx, x, hipY, 4, footTop - hipY, pants);
        vline(ctx, isLeft ? x + 3 : x, hipY, footTop - hipY, seam);
        r(ctx, x, footTop, 4, 2, shoe);
        hline(ctx, x + 1, footTop, 2, shoeHi);
    }
}

function drawCoatFront(ctx: CanvasRenderingContext2D, s: HumanoidStyle, top: number, back: boolean): void {
    const dark = shade(s.coat, -0.3);
    r(ctx, 10, top, 12, 14, s.coat);
    hline(ctx, 11, top, 10, s.coatLight);
    r(ctx, 11, top + 1, 3, 11, s.coatLight);
    vline(ctx, 20, top + 1, 13, dark);
    hline(ctx, 10, top + 13, 12, dark);
    vline(ctx, 10, top, 14, P.outline);
    vline(ctx, 21, top, 14, P.outline);

    if (back) {
        // Centre seam + vent
        vline(ctx, 16, top + 2, 12, dark);
        return;
    }

    // V-neck: shirt (or accent vest) between the lapels
    const vColor = s.shirt ?? s.accent;
    if (vColor) {
        t(ctx, 13, top, 19, top, 16, top + 5, vColor);
    }
    // Lapel edges
    p(ctx, 14, top + 2, dark);
    p(ctx, 15, top + 3, dark);
    p(ctx, 17, top + 3, dark);
    p(ctx, 18, top + 2, dark);
    // Buttons
    const button = s.accent ? shade(s.accent, s.shirt ? 0 : -0.25) : dark;
    for (const by of [6, 9, 12]) p(ctx, 16, top + by, button);
}

function drawHumanoidFront(
    ctx: CanvasRenderingContext2D,
    s: HumanoidStyle,
    pose: CharacterPose
): void {
    const o = poseOffsets(pose);
    const top = 10 + o.bodyBob;
    const tones = skinTones(s);
    const head = makeHead(s, 2 + o.bodyBob);

    drawGroundShadow(ctx, GROUND_Y + 2, 7);
    drawFrontLegs(ctx, s.pants ?? P.shadow, s.shoes ?? P.shoeBrown, top + 14, o.leftFootDy, o.rightFootDy);
    drawCoatFront(ctx, s, top, false);
    drawFrontArms(ctx, 6, 22, top + 1, 9, o.leftArmSwing, o.rightArmSwing, s.coat, tones);
    drawFullHead(ctx, s, head, top, "down");
    drawNecklace(ctx, s, head, top, false);
}

function drawHumanoidBack(
    ctx: CanvasRenderingContext2D,
    s: HumanoidStyle,
    pose: CharacterPose
): void {
    const o = poseOffsets(pose);
    const top = 10 + o.bodyBob;
    const tones = skinTones(s);
    const head = makeHead(s, 2 + o.bodyBob);

    drawGroundShadow(ctx, GROUND_Y + 2, 7);
    // Seen from behind, the character's left leg is on screen-right
    drawFrontLegs(ctx, s.pants ?? P.shadow, s.shoes ?? P.shoeBrown, top + 14, o.rightFootDy, o.leftFootDy);
    drawCoatFront(ctx, s, top, true);
    drawFrontArms(ctx, 6, 22, top + 1, 9, o.rightArmSwing, o.leftArmSwing, s.coat, tones);
    drawFullHead(ctx, s, head, top, "up");
}

/** Side-view stride: foot x per leg (hip at x=16 near / 15 far) and lift in px. */
function sideWalk(pose: CharacterPose): {
    bodyBob: number;
    nearFootX: number;
    farFootX: number;
    nearLift: number;
    farLift: number;
    armSwing: number;
} {
    switch (pose) {
        case "walk_a":
            return { bodyBob: 1, nearFootX: 19, farFootX: 12, nearLift: 0, farLift: 0, armSwing: -2 };
        case "walk_b":
            return { bodyBob: 0, nearFootX: 16, farFootX: 14, nearLift: 0, farLift: 2, armSwing: 0 };
        case "walk_c":
            return { bodyBob: 1, nearFootX: 13, farFootX: 18, nearLift: 0, farLift: 0, armSwing: 2 };
        case "walk_d":
            return { bodyBob: 0, nearFootX: 17, farFootX: 15, nearLift: 2, farLift: 0, armSwing: 0 };
        default:
            return { bodyBob: 0, nearFootX: 16, farFootX: 15, nearLift: 0, farLift: 0, armSwing: 0 };
    }
}

/** A 3px-wide limb interpolated from (topX, topY) to (bottomX, topY + len - 1). */
function slantedLimb(
    ctx: CanvasRenderingContext2D,
    topX: number,
    topY: number,
    bottomX: number,
    len: number,
    color: string,
    edge?: string
): void {
    for (let i = 0; i < len; i++) {
        const tt = len <= 1 ? 1 : i / (len - 1);
        const x = Math.round(topX + (bottomX - topX) * tt);
        hline(ctx, x, topY + i, 3, color);
        if (edge) p(ctx, x, topY + i, edge);
    }
}

function drawSideLeg(
    ctx: CanvasRenderingContext2D,
    hipX: number,
    hipY: number,
    footX: number,
    lift: number,
    groundY: number,
    pants: string,
    shoe: string
): void {
    const footTop = groundY - lift;
    slantedLimb(ctx, hipX, hipY, footX, footTop - hipY, pants, shade(pants, -0.25));
    // Toe points forward (right)
    r(ctx, footX, footTop, 4, 2, shoe);
    hline(ctx, footX + 1, footTop, 2, shade(shoe, 0.3));
}

function drawSideArm(
    ctx: CanvasRenderingContext2D,
    shoulderX: number,
    top: number,
    sleeveLen: number,
    swing: number,
    sleeve: string,
    tones: SkinTones
): void {
    const handX = shoulderX + swing;
    slantedLimb(ctx, shoulderX, top, handX, sleeveLen, shade(sleeve, 0.08), shade(sleeve, -0.35));
    r(ctx, handX, top + sleeveLen, 3, 3, tones.skin);
    hline(ctx, handX, top + sleeveLen, 3, tones.shadow);
    p(ctx, handX, top + sleeveLen + 2, tones.shadow);
}

function drawHumanoidSide(
    ctx: CanvasRenderingContext2D,
    s: HumanoidStyle,
    pose: CharacterPose
): void {
    const w = sideWalk(pose);
    const top = 10 + w.bodyBob;
    const tones = skinTones(s);
    const head = makeHead(s, 2 + w.bodyBob);
    const pants = s.pants ?? P.pantsSide;
    const shoe = s.shoes ?? P.shoeBrown;
    const dark = shade(s.coat, -0.3);

    drawGroundShadow(ctx, GROUND_Y + 2, 6);
    drawSideLeg(ctx, 15, top + 14, w.farFootX, w.farLift, GROUND_Y, s.pants ? shade(pants, -0.25) : P.pantsSideFar, shade(shoe, -0.3));

    // Torso in profile: lit back, shadowed chest
    r(ctx, 13, top, 8, 14, s.coat);
    r(ctx, 14, top + 1, 2, 11, s.coatLight);
    vline(ctx, 20, top + 1, 13, dark);
    hline(ctx, 13, top + 13, 8, dark);
    vline(ctx, 13, top, 14, P.outline);
    vline(ctx, 21, top + 1, 12, P.outline);
    if (s.shirt ?? s.accent) hline(ctx, 18, top, 3, (s.shirt ?? s.accent)!);
    if (s.accent) {
        p(ctx, 19, top + 6, s.accent);
        p(ctx, 19, top + 9, s.accent);
    }

    drawSideLeg(ctx, 16, top + 14, w.nearFootX, w.nearLift, GROUND_Y, pants, shoe);
    drawFullHead(ctx, s, head, top, "right");
    drawNecklace(ctx, s, head, top, true);
    drawSideArm(ctx, 16, top + 1, 9, w.armSwing, s.coat, tones);
}

// ============================================================================
// Dresses
// ============================================================================

function dressPoseOffsets(pose: CharacterPose): {
    bodyBob: number;
    leftArmSwing: number;
    rightArmSwing: number;
    skirtSway: number;
    hemSpread: number;
} {
    switch (pose) {
        case "walk_a":
            return { bodyBob: 1, leftArmSwing: 1, rightArmSwing: -1, skirtSway: -1, hemSpread: 1 };
        case "walk_c":
            return { bodyBob: 1, leftArmSwing: -1, rightArmSwing: 1, skirtSway: 1, hemSpread: 1 };
        default:
            return { bodyBob: 0, leftArmSwing: 0, rightArmSwing: 0, skirtSway: 0, hemSpread: 0 };
    }
}

const DRESS_HEM_Y = 35;

/** Bell skirt with vertical folds; waist stays put, sway grows toward the hem. */
function drawSkirtFront(
    ctx: CanvasRenderingContext2D,
    d: DressStyle,
    topY: number,
    sway: number,
    hemSpread: number
): void {
    const bottomY = DRESS_HEM_Y;
    for (let y = topY; y <= bottomY; y++) {
        const tt = (y - topY) / Math.max(1, bottomY - topY);
        const halfW = 5 + Math.floor(tt * (6 + hemSpread));
        const left = 16 + Math.round(sway * tt) - halfW;
        const width = halfW * 2;
        r(ctx, left, y, width, 1, d.skirt);
        r(ctx, left + 1, y, Math.max(1, Math.floor(width * 0.22)), 1, d.skirtLight);
        const shadowW = Math.max(1, Math.floor(width * 0.18));
        r(ctx, left + width - shadowW, y, shadowW, 1, d.skirtShadow);
        if (tt > 0.25) {
            p(ctx, left + Math.round(width * 0.42), y, d.skirtShadow);
            p(ctx, left + Math.round(width * 0.66), y, d.skirtShadow);
        }
    }
    const hemL = 16 + sway - 11 - hemSpread;
    if (d.trim) hline(ctx, hemL, bottomY, 22 + hemSpread * 2, d.trim);
}

function drawDressFeet(ctx: CanvasRenderingContext2D, s: HumanoidStyle, sway: number, pose: CharacterPose): void {
    const shoe = s.shoes ?? P.shoeBrown;
    const hi = shade(shoe, 0.3);
    // Only the stepping foot peeks out past the hem while walking
    const showLeft = pose !== "walk_c";
    const showRight = pose !== "walk_a";
    if (showLeft) {
        r(ctx, 12 + sway, DRESS_HEM_Y + 1, 3, 2, shoe);
        p(ctx, 13 + sway, DRESS_HEM_Y + 1, hi);
    }
    if (showRight) {
        r(ctx, 17 + sway, DRESS_HEM_Y + 1, 3, 2, shoe);
        p(ctx, 18 + sway, DRESS_HEM_Y + 1, hi);
    }
}

function drawBodiceFront(ctx: CanvasRenderingContext2D, s: HumanoidStyle, top: number, back: boolean): void {
    const d = s.dress!;
    r(ctx, 11, top, 10, 8, d.bodice);
    r(ctx, 12, top + 1, 2, 6, d.bodiceLight);
    vline(ctx, 19, top + 1, 7, shade(d.bodice, -0.3));
    if (d.collar) hline(ctx, 13, top, 6, d.collar);
    if (d.trim) hline(ctx, 12, top + 7, 8, d.trim);
    if (back) {
        // Lacing / buttons down the back
        for (let i = 2; i < 7; i += 2) p(ctx, 16, top + i, shade(d.bodice, 0.25));
        return;
    }
    if (s.accent) r(ctx, 15, top + 2, 2, 2, s.accent);
}

function drawApronFront(ctx: CanvasRenderingContext2D, apron: string, top: number): void {
    const fold = shade(apron, -0.15);
    vline(ctx, 12, top, 3, apron);
    vline(ctx, 19, top, 3, apron);
    r(ctx, 13, top + 2, 6, 6, apron);
    r(ctx, 12, top + 8, 8, 13, apron);
    vline(ctx, 19, top + 8, 13, fold);
    vline(ctx, 15, top + 10, 10, fold);
    hline(ctx, 12, top + 7, 8, fold);
}

function drawDressFront(
    ctx: CanvasRenderingContext2D,
    s: HumanoidStyle,
    pose: CharacterPose
): void {
    const d = s.dress!;
    const o = dressPoseOffsets(pose);
    const top = 11 + o.bodyBob;
    const tones = skinTones(s);
    const head = makeHead(s, 3 + o.bodyBob);

    drawGroundShadow(ctx, DRESS_HEM_Y + 2, 9);
    drawDressFeet(ctx, s, o.skirtSway, pose);
    drawSkirtFront(ctx, d, top + 8, o.skirtSway, o.hemSpread);
    drawBodiceFront(ctx, s, top, false);
    if (d.apron) drawApronFront(ctx, d.apron, top);
    drawFrontArms(ctx, 7, 21, top + 1, 8, o.leftArmSwing, o.rightArmSwing, d.sleeve ?? d.bodice, tones);
    drawFullHead(ctx, s, head, top, "down");
    drawNecklace(ctx, s, head, top, false);
}

function drawDressBack(
    ctx: CanvasRenderingContext2D,
    s: HumanoidStyle,
    pose: CharacterPose
): void {
    const d = s.dress!;
    const o = dressPoseOffsets(pose);
    const top = 11 + o.bodyBob;
    const tones = skinTones(s);
    const head = makeHead(s, 3 + o.bodyBob);

    drawGroundShadow(ctx, DRESS_HEM_Y + 2, 9);
    drawDressFeet(ctx, s, o.skirtSway, pose);
    drawSkirtFront(ctx, d, top + 8, o.skirtSway, o.hemSpread + 1);
    drawBodiceFront(ctx, s, top, true);
    if (d.apron) {
        // Apron ties
        hline(ctx, 13, top + 7, 6, d.apron);
        r(ctx, 15, top + 8, 2, 3, d.apron);
    }
    drawFrontArms(ctx, 7, 21, top + 1, 8, o.rightArmSwing, o.leftArmSwing, d.sleeve ?? d.bodice, tones);
    drawFullHead(ctx, s, head, top, "up");
}

function drawDressSide(
    ctx: CanvasRenderingContext2D,
    s: HumanoidStyle,
    pose: CharacterPose
): void {
    const d = s.dress!;
    const o = dressPoseOffsets(pose);
    const top = 11 + o.bodyBob;
    const tones = skinTones(s);
    const head = makeHead(s, 3 + o.bodyBob);
    const sway = o.skirtSway;
    const shoe = s.shoes ?? P.shoeBrown;
    const swing = pose === "walk_a" ? -2 : pose === "walk_c" ? 2 : 0;

    drawGroundShadow(ctx, DRESS_HEM_Y + 2, 7);

    // Leading foot peeks out at the front of the hem
    const footX = pose === "walk_a" ? 18 : pose === "walk_c" ? 15 : 16;
    r(ctx, footX + sway, DRESS_HEM_Y + 1, 4, 2, shoe);
    hline(ctx, footX + sway + 1, DRESS_HEM_Y + 1, 2, shade(shoe, 0.3));

    // Skirt in profile: bustle sweeps back (left), front falls nearly straight
    const skirtTop = top + 8;
    for (let y = skirtTop; y <= DRESS_HEM_Y; y++) {
        const tt = (y - skirtTop) / Math.max(1, DRESS_HEM_Y - skirtTop);
        const shift = Math.round(sway * tt);
        const left = 13 - Math.floor(tt * 5) + shift;
        const right = 20 + Math.floor(tt * 2) + shift;
        const width = right - left;
        r(ctx, left, y, width, 1, d.skirt);
        r(ctx, left, y, Math.max(1, Math.floor(width * 0.3)), 1, d.skirtLight);
        p(ctx, right - 1, y, d.skirtShadow);
        if (tt > 0.3) p(ctx, left + Math.round(width * 0.55), y, d.skirtShadow);
    }
    if (d.trim) hline(ctx, 8 + sway, DRESS_HEM_Y, 15, d.trim);

    r(ctx, 13, top, 7, 8, d.bodice);
    r(ctx, 14, top + 1, 2, 6, d.bodiceLight);
    vline(ctx, 19, top + 1, 7, shade(d.bodice, -0.3));
    if (d.collar) hline(ctx, 16, top, 4, d.collar);
    if (d.trim) hline(ctx, 13, top + 7, 7, d.trim);
    if (d.apron) {
        r(ctx, 18, top + 2, 2, 6, d.apron);
        r(ctx, 18, top + 8, 3, 13, d.apron);
    }

    drawFullHead(ctx, s, head, top, "right");
    drawNecklace(ctx, s, head, top, true);
    drawSideArm(ctx, 15, top + 1, 8, swing, d.sleeve ?? d.bodice, tones);
}

/** Draw one animation frame (bake facing `right`; mirror for `left` at render time) */
export function drawHumanoidFrame(
    ctx: CanvasRenderingContext2D,
    s: HumanoidStyle,
    facing: CharacterFacing,
    pose: CharacterPose
): void {
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
        bodyType: 'average',
        hairStyle: 'updo',
        expression: 'determined',
        eyeColor: P.eyeHazel,
        jewelry: P.jewelryGold,
        jewelryType: 'necklace',
        age: 'adult',
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
        accent: P.gold,
        shirt: P.cream,
        bodyType: 'average',
        hairStyle: 'short',
        expression: 'determined',
        eyeColor: P.eyeBrown,
        facialHair: 'mustache',
        age: 'middle_aged',
        wrinkles: true
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

const WORKER_MAN_STYLE: HumanoidStyle = {
    coat: P.coatGray,
    coatLight: P.coatGrayLight,
    hair: P.brick,
    pants: P.coatBrown
};

const WORKER_BOY_STYLE: HumanoidStyle = {
    coat: P.green,
    coatLight: P.greenLight,
    hair: P.woodDark,
    skin: P.skinHi,
    pants: P.woodDark
};

const MAID_STYLE: HumanoidStyle = {
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
};

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

/** Irregular two-tone blood pool (union of discs) with glossy highlights and broom streaks. */
function drawBloodPool(ctx: CanvasRenderingContext2D): void {
    const lobes: [number, number, number][] = [
        [14, 27, 8], [8, 29, 5], [21, 30, 6], [12, 33, 4], [5, 25, 3], [24, 25, 3], [17, 34, 3]
    ];
    const edge = "#3e0a0a";
    const pool = "#5c1010";
    const wet = P.red;
    for (const [x, y, rad] of lobes) discCrisp(ctx, x, y, rad, edge);
    for (const [x, y, rad] of lobes) discCrisp(ctx, x, y, rad - 1, pool);
    for (const [x, y, rad] of lobes) if (rad > 3) discCrisp(ctx, x - 1, y - 1, rad - 3, wet);
    // Specular glints on the wet surface
    for (const [x, y] of [[9, 27], [19, 29], [13, 32], [22, 31]] as const) p(ctx, x, y, P.redLight);
    // Faint broom marks dragged out of the pool toward the lower right
    for (let k = 0; k < 3; k++) {
        for (let i = 0; i < 9; i++) {
            if ((i + k) % 4 === 3) continue;
            p(ctx, 19 + k * 2 + i, 33 + Math.floor(i / 2), "#4a1010");
        }
    }
}

const DEAD_BARON_COLORS: Record<string, string> = {
    o: "#140e0c",
    H: P.highlight,
    h: P.light,
    S: "#cfb39c",
    s: "#a88a74",
    n: "#a88a74",
    z: "#7a6670",
    k: "#8a6e64",
    K: "#1e1a1c",
    w: P.cream,
    W: "#b8ae9c",
    R: P.red,
    r: "#4a0c0c",
    g: P.gold,
    T: "#2e2a2a",
    t: "#4a4442",
    B: "#0e0a0a",
    b: "#7a7270"
};

/** von Virtanen (victim) lying dead on his back, crown to the left, in a pool of blood. */
function drawDeadBaronBody(ctx: CanvasRenderingContext2D): void {
    const pal = DEAD_BARON_COLORS;
    drawBloodPool(ctx);

    // Top hat knocked off, lying on its side above the legs
    grid(ctx, 21, 14, 1, [
        ".o.......",
        "oKoooooo.",
        "oKgKKKKKo",
        "oKgtKKKKo",
        "oKgKKKKKo",
        "oKoooooo.",
        ".o......."
    ], pal);

    // Legs, slightly splayed; shoes point up at the viewer
    grid(ctx, 19, 22, 1, [
        "oooooooooo...",
        "TttTTTTTTobo.",
        "TTTTTTTTToBBo",
        "oooooooooooo.",
        "TTTttTTTTobo.",
        "TTTTTTTTTTBBo",
        "oooooooooooo."
    ], pal);

    // Arm limp along the side, hand by the hip
    grid(ctx, 8, 30, 1, [
        "oooooooooooo.",
        "oKKKKKKKKoSso",
        "oooooooooooo."
    ], pal);

    // Evening coat torn open at the chest; white shirt front, gold watch chain
    grid(ctx, 7, 21, 1, [
        "  ooooooooo  ",
        " okKKKKKKKKo ",
        "oKkwwKKKKKKKo",
        "oKwwWwKKKKKKo",
        "oKkwWRRKKKKKo",
        "oKkwRrRRKgKKo",
        "oKkwwRKKKKgKo",
        "oKkwWwKKKKKKo",
        " okKKKKKKKKo ",
        "  ooooooooo  "
    ], pal);

    // Arm flung out above the head
    grid(ctx, 2, 14, 1, [
        " oo     ",
        "oSSo    ",
        "osSso   ",
        " oKKo   ",
        "  oKko  ",
        "   oKKo ",
        "    oKKo",
        "     oKK"
    ], pal);

    // Head, crown to the left, face up: closed eyes stacked, grey hair
    grid(ctx, 0, 21, 1, [
        "  ooo   ",
        " oHHSSo ",
        "oHHSkSSo",
        "oHhSSnzo",
        "oHhSSnzo",
        "oHHSkSSo",
        " oHHSSo ",
        "  ooo   "
    ], pal);
}

/** Humanoid styles that support directional facing (idle NPC poses). */
export const HUMANOID_STYLES: Record<string, HumanoidStyle> = {
    ...PLAYER_CHARACTER_STYLES,
    baron: BARON_STYLE,
    maid: MAID_STYLE,
    worker_man: WORKER_MAN_STYLE,
    worker_boy: WORKER_BOY_STYLE,
    // Enhanced characters with Phase 4 features
    professor: {
        coat: P.coatCharcoal,
        coatLight: P.coatGrayLight,
        hair: P.highlight,
        skin: P.skinPale,
        bodyType: 'tall',
        hairStyle: 'medium',
        hairPart: 'center',
        expression: 'tired',
        eyeColor: P.eyeAmber,
        glasses: P.jewelryGold,
        glassesStyle: 'round',
        facialHair: 'beard',
        age: 'elderly',
        wrinkles: true,
        scars: true
    },
    young_maid: {
        coat: P.maidBlack,
        coatLight: P.maidWhite,
        hair: P.hairAuburn,
        skin: P.skinFair,
        bodyType: 'petite',
        hairStyle: 'braid',
        expression: 'happy',
        eyeColor: P.eyeHazel,
        freckles: true,
        age: 'young',
        jewelry: P.jewelrySilver,
        jewelryType: 'earrings',
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
    },
    bartender: {
        coat: P.coatBrown,
        coatLight: P.coatBrownLight,
        hair: P.hairDarkBrown,
        skin: P.skinTan,
        bodyType: 'stocky',
        hairStyle: 'curly',
        hairPart: 'none',
        expression: 'angry',
        eyeColor: P.eyeBrown,
        facialHair: 'goatee',
        age: 'adult',
        pants: P.coatBrown,
        shoes: P.shoeBlack
    },
    librarian: {
        coat: P.coatEmerald,
        coatLight: P.greenLight,
        hair: P.hairJetBlack,
        skin: P.skinFair,
        bodyType: 'slim',
        hairStyle: 'long',
        hairPart: 'center',
        expression: 'determined',
        eyeColor: P.eyeBrown,
        glasses: P.jewelrySilver,
        glassesStyle: 'oval',
        age: 'middle_aged',
        jewelry: P.jewelryRuby,
        jewelryType: 'necklace',
        pants: P.black
    },
    butler: {
        coat: P.tuxedoBlack,
        coatLight: P.shadow,
        hair: P.hairSilverHi,
        skin: P.skinFair,
        bodyType: 'average',
        hairStyle: 'short',
        hairPart: 'left',
        expression: 'normal',
        eyeColor: P.eyeAmber,
        facialHair: 'sideburns',
        age: 'middle_aged',
        scars: true,
        glasses: P.jewelryGold,
        glassesStyle: 'monocle',
        jewelry: P.jewelryGold,
        jewelryType: 'both',
        pants: P.tuxedoBlack,
        accent: P.tuxedoWhite
    }
};

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
    maid: humanoid(MAID_STYLE),
    worker_man: humanoid(WORKER_MAN_STYLE),
    worker_man_bandaged: {
        nativeWidth: 32,
        nativeHeight: 40,
        draw(ctx) {
            drawHumanoidFrame(ctx, WORKER_MAN_STYLE, "down", "idle");
            // Head wrap
            r(ctx, 11, 2, 10, 5, P.maidWhite);
            r(ctx, 12, 1, 8, 2, P.cream);
            r(ctx, 13, 6, 6, 1, P.cream);
            r(ctx, 14, 0, 4, 2, P.maidWhite);
            // Bandaged right hand
            r(ctx, 21, 19, 6, 5, P.maidWhite);
            r(ctx, 22, 20, 4, 3, P.cream);
        }
    },
    hooded_figure: {
        nativeWidth: 32,
        nativeHeight: 40,
        draw(ctx) {
            drawHoodedFigure(ctx);
        }
    },
    worker_boy: humanoid(WORKER_BOY_STYLE),
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
    }),
    // Enhanced character sprites with Phase 4 features
    professor: humanoid(HUMANOID_STYLES.professor),
    young_maid: humanoid(HUMANOID_STYLES.young_maid),
    bartender: humanoid(HUMANOID_STYLES.bartender),
    librarian: humanoid(HUMANOID_STYLES.librarian),
    butler: humanoid(HUMANOID_STYLES.butler)
};

/** Humanoid styles that support directional facing (idle NPC poses). */
export function getHumanoidStyle(spriteName: string): HumanoidStyle | undefined {
    return HUMANOID_STYLES[spriteName];
}
