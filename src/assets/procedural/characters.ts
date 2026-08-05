import { P } from "./palette";
import { r, rr, c, t, p, hline, vline } from "./pixel";
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

/** Leg Y offsets per pose (left leg, right leg) and optional body bob */
function poseOffsets(pose: CharacterPose): {
    leftLegY: number;
    rightLegY: number;
    bodyBob: number;
    leftArmY: number;
    rightArmY: number;
    headBob: number;
} {
    switch (pose) {
        case "walk_a":
            return { leftLegY: 26, rightLegY: 22, bodyBob: 1, leftArmY: 14, rightArmY: 10, headBob: 1 };
        case "walk_b":
            return { leftLegY: 24, rightLegY: 24, bodyBob: 0, leftArmY: 12, rightArmY: 12, headBob: 0 };
        case "walk_c":
            return { leftLegY: 22, rightLegY: 26, bodyBob: 1, leftArmY: 10, rightArmY: 14, headBob: -1 };
        case "walk_d":
            return { leftLegY: 24, rightLegY: 24, bodyBob: 0, leftArmY: 12, rightArmY: 12, headBob: 0 };
        default:
            return { leftLegY: 24, rightLegY: 24, bodyBob: 0, leftArmY: 12, rightArmY: 12, headBob: 0 };
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

/**
 * Draw facial expression
 */
function drawExpression(
    ctx: CanvasRenderingContext2D,
    s: HumanoidStyle,
    x: number,
    y: number,
    by: number,
    headBob: number,
    isSideView: boolean = false
): void {
    const skin = s.skin ?? P.skin;
    const hair = s.hair;
    const expr = getExpressionConfig(s.expression);
    const eyeColor = s.eyeColor ?? P.black;

    if (isSideView) {
        // Side view expression - only one eye visible
        const eyeX = x + 4;
        const eyeY = y + 6 + by + headBob + expr.eyes.yOffset;
        
        // Eye
        switch (expr.eyes.shape) {
            case 'surprised':
                r(ctx, eyeX, eyeY - 1, 2, 3, P.white);
                c(ctx, eyeX + 1, eyeY, 1, eyeColor);
                break;
            case 'happy':
            case 'sad':
                r(ctx, eyeX, eyeY, 2, 1, P.black);
                p(ctx, eyeX + 1, eyeY, eyeColor);
                break;
            case 'tired':
                hline(ctx, eyeX, eyeY + 1, 2, P.black);
                break;
            default:
                r(ctx, eyeX, eyeY, 2, 1, P.black);
        }
        
        // Eyebrow
        switch (expr.eyebrows.shape) {
            case 'raised':
                hline(ctx, eyeX, y + 4 + by + headBob + expr.eyebrows.yOffset, 2, hair);
                hline(ctx, eyeX + 1, y + 3 + by + headBob + expr.eyebrows.yOffset, 1, hair);
                break;
            case 'furrowed':
            case 'knitted':
                hline(ctx, eyeX, y + 5 + by + headBob + expr.eyebrows.yOffset, 3, hair);
                break;
            case 'curved':
                hline(ctx, eyeX, y + 4 + by + headBob + expr.eyebrows.yOffset, 2, hair);
                p(ctx, eyeX + 2, y + 3 + by + headBob + expr.eyebrows.yOffset, hair);
                break;
            default:
                hline(ctx, eyeX, y + 5 + by + headBob + expr.eyebrows.yOffset, 2, hair);
        }
        
        // Mouth (side view)
        switch (expr.mouth.shape) {
            case 'smile':
                p(ctx, x + 6, y + 10 + by + headBob + expr.mouth.yOffset, P.outline);
                p(ctx, x + 7, y + 9 + by + headBob + expr.mouth.yOffset, P.outline);
                break;
            case 'frown':
                p(ctx, x + 6, y + 10 + by + headBob + expr.mouth.yOffset, P.outline);
                p(ctx, x + 7, y + 11 + by + headBob + expr.mouth.yOffset, P.outline);
                break;
            case 'open':
                p(ctx, x + 6, y + 10 + by + headBob + expr.mouth.yOffset, P.outline);
                p(ctx, x + 6, y + 11 + by + headBob + expr.mouth.yOffset, P.outline);
                break;
            default:
                p(ctx, x + 6, y + 10 + by + headBob + expr.mouth.yOffset, P.outline);
        }
        
    } else {
        // Front view expression
        const leftEyeX = x;
        const rightEyeX = x + 4;
        const eyeY = y + 1 + by + headBob + expr.eyes.yOffset;
        
        // Left eye
        switch (expr.eyes.shape) {
            case 'surprised':
                r(ctx, leftEyeX, eyeY - 1, 2, 3, P.white);
                c(ctx, leftEyeX + 1, eyeY, 1, eyeColor);
                break;
            case 'happy':
            case 'sad':
                r(ctx, leftEyeX, eyeY, 2, 1, P.black);
                p(ctx, leftEyeX + 1, eyeY, eyeColor);
                break;
            case 'tired':
                hline(ctx, leftEyeX, eyeY + 1, 2, P.black);
                break;
            case 'angry':
            case 'determined':
            case 'normal':
            default:
                r(ctx, leftEyeX, eyeY, 2, 1, P.black);
        }
        
        // Right eye
        switch (expr.eyes.shape) {
            case 'surprised':
                r(ctx, rightEyeX, eyeY - 1, 2, 3, P.white);
                c(ctx, rightEyeX + 1, eyeY, 1, eyeColor);
                break;
            case 'happy':
            case 'sad':
                r(ctx, rightEyeX, eyeY, 2, 1, P.black);
                p(ctx, rightEyeX + 1, eyeY, eyeColor);
                break;
            case 'tired':
                hline(ctx, rightEyeX, eyeY + 1, 2, P.black);
                break;
            default:
                r(ctx, rightEyeX, eyeY, 2, 1, P.black);
        }
        
        // Left eyebrow
        switch (expr.eyebrows.shape) {
            case 'raised':
                hline(ctx, leftEyeX, y + by + headBob + expr.eyebrows.yOffset, 2, hair);
                hline(ctx, leftEyeX + 1, y - 1 + by + headBob + expr.eyebrows.yOffset, 1, hair);
                break;
            case 'furrowed':
            case 'knitted':
                hline(ctx, leftEyeX - 1, y + 1 + by + headBob + expr.eyebrows.yOffset, 3, hair);
                break;
            case 'curved':
                hline(ctx, leftEyeX, y + by + headBob + expr.eyebrows.yOffset, 2, hair);
                p(ctx, leftEyeX + 2, y - 1 + by + headBob + expr.eyebrows.yOffset, hair);
                break;
            default:
                hline(ctx, leftEyeX, y + by + headBob + expr.eyebrows.yOffset, 2, hair);
        }
        
        // Right eyebrow
        switch (expr.eyebrows.shape) {
            case 'raised':
                hline(ctx, rightEyeX, y + by + headBob + expr.eyebrows.yOffset, 2, hair);
                hline(ctx, rightEyeX + 1, y - 1 + by + headBob + expr.eyebrows.yOffset, 1, hair);
                break;
            case 'furrowed':
            case 'knitted':
                hline(ctx, rightEyeX - 1, y + 1 + by + headBob + expr.eyebrows.yOffset, 3, hair);
                break;
            case 'curved':
                hline(ctx, rightEyeX, y + by + headBob + expr.eyebrows.yOffset, 2, hair);
                p(ctx, rightEyeX + 2, y - 1 + by + headBob + expr.eyebrows.yOffset, hair);
                break;
            default:
                hline(ctx, rightEyeX, y + by + headBob + expr.eyebrows.yOffset, 2, hair);
        }
        
        // Mouth (front view)
        const mouthX = x + 1;
        const mouthY = y + 3 + by + headBob + expr.mouth.yOffset;
        
        switch (expr.mouth.shape) {
            case 'smile':
                hline(ctx, mouthX, mouthY + 1, expr.mouth.width, P.outline);
                p(ctx, mouthX + 2, mouthY, P.outline);
                break;
            case 'frown':
                hline(ctx, mouthX, mouthY + 1, expr.mouth.width, P.outline);
                p(ctx, mouthX + 2, mouthY + 2, P.outline);
                break;
            case 'open':
                hline(ctx, mouthX + 1, mouthY, expr.mouth.width - 2, P.outline);
                hline(ctx, mouthX + 1, mouthY + 1, expr.mouth.width - 2, P.outline);
                break;
            case 'grimace':
                hline(ctx, mouthX, mouthY, expr.mouth.width, P.outline);
                hline(ctx, mouthX + 1, mouthY + 1, expr.mouth.width - 2, P.outline);
                break;
            case 'tight':
                hline(ctx, mouthX + 1, mouthY + 1, expr.mouth.width - 2, P.outline);
                break;
            default:
                hline(ctx, mouthX, mouthY, expr.mouth.width, P.outline);
        }
    }
}

/**
 * Draw glasses accessory
 */
function drawGlasses(
    ctx: CanvasRenderingContext2D,
    s: HumanoidStyle,
    x: number,
    y: number,
    by: number,
    headBob: number,
    isSideView: boolean = false
): void {
    if (!s.glasses) return;
    
    const glassesColor = s.glasses;
    const style = s.glassesStyle ?? 'round';
    
    if (isSideView) {
        // Side view glasses
        switch (style) {
            case 'round':
                c(ctx, x + 5, y + 4 + by + headBob, 3, glassesColor);
                r(ctx, x + 6, y + 4 + by + headBob, 1, 2, glassesColor);
                break;
            case 'square':
                r(ctx, x + 5, y + 4 + by + headBob, 3, 3, glassesColor);
                r(ctx, x + 7, y + 4 + by + headBob, 1, 2, glassesColor);
                break;
            case 'oval':
                rr(ctx, x + 5, y + 4 + by + headBob, 3, 2, 1, glassesColor);
                r(ctx, x + 7, y + 4 + by + headBob, 1, 2, glassesColor);
                break;
            case 'monocle':
                c(ctx, x + 5, y + 4 + by + headBob, 2, glassesColor);
                break;
        }
    } else {
        // Front view glasses
        const leftLensX = x - 1;
        const rightLensX = x + 3;
        const lensY = y + by + headBob;
        
        switch (style) {
            case 'round':
                c(ctx, leftLensX + 1, lensY + 1, 2, glassesColor);
                c(ctx, rightLensX + 1, lensY + 1, 2, glassesColor);
                // Bridge
                hline(ctx, leftLensX + 2, lensY + 1, 2, glassesColor);
                // Arms
                r(ctx, leftLensX, lensY + 1, 1, 2, glassesColor);
                r(ctx, rightLensX + 2, lensY + 1, 1, 2, glassesColor);
                break;
            case 'square':
                r(ctx, leftLensX, lensY, 3, 3, glassesColor);
                r(ctx, rightLensX, lensY, 3, 3, glassesColor);
                // Bridge
                hline(ctx, leftLensX + 2, lensY + 1, 2, glassesColor);
                // Arms
                r(ctx, leftLensX - 1, lensY + 1, 1, 2, glassesColor);
                r(ctx, rightLensX + 3, lensY + 1, 1, 2, glassesColor);
                break;
            case 'oval':
                rr(ctx, leftLensX, lensY, 3, 2, 1, glassesColor);
                rr(ctx, rightLensX, lensY, 3, 2, 1, glassesColor);
                // Bridge
                hline(ctx, leftLensX + 2, lensY + 1, 2, glassesColor);
                // Arms
                r(ctx, leftLensX, lensY + 1, 1, 2, glassesColor);
                r(ctx, rightLensX + 2, lensY + 1, 1, 2, glassesColor);
                break;
            case 'monocle':
                c(ctx, rightLensX + 1, lensY + 1, 2, glassesColor);
                r(ctx, rightLensX + 2, lensY + 1, 1, 2, glassesColor);
                break;
        }
    }
}

/**
 * Draw jewelry accessories
 */
function drawJewelry(
    ctx: CanvasRenderingContext2D,
    s: HumanoidStyle,
    x: number,
    y: number,
    by: number,
    isSideView: boolean = false
): void {
    if (!s.jewelry) return;
    
    const jewelryColor = s.jewelry;
    const jewelryType = s.jewelryType ?? 'necklace';
    
    if (jewelryType === 'earrings' || jewelryType === 'both') {
        // Earrings
        if (isSideView) {
            // Only one earring visible from side
            c(ctx, x + 7, y + 7 + by, 1, jewelryColor);
            p(ctx, x + 7, y + 8 + by, jewelryColor);
        } else {
            // Both earrings visible from front
            c(ctx, x - 1, y + 7 + by, 1, jewelryColor);
            c(ctx, x + 5, y + 7 + by, 1, jewelryColor);
        }
    }
    
    if (jewelryType === 'necklace' || jewelryType === 'both') {
        // Necklace
        if (isSideView) {
            hline(ctx, x + 6, y + 10 + by, 3, jewelryColor);
            p(ctx, x + 7, y + 11 + by, jewelryColor);
        } else {
            // Front view - necklace around neck
            rr(ctx, x + 1, y + 10 + by, 4, 2, 1, jewelryColor);
            p(ctx, x + 2, y + 11 + by, jewelryColor);
        }
    }
}

/**
 * Draw facial hair
 */
function drawFacialHair(
    ctx: CanvasRenderingContext2D,
    s: HumanoidStyle,
    x: number,
    y: number,
    by: number,
    headBob: number,
    isSideView: boolean = false
): void {
    if (!s.facialHair || s.facialHair === 'none' || !s.hair) return;
    
    const hairColor = s.hair;
    
    if (isSideView) {
        // Side view facial hair
        switch (s.facialHair) {
            case 'mustache':
                hline(ctx, x + 6, y + 9 + by + headBob, 4, hairColor);
                break;
            case 'beard':
                r(ctx, x + 5, y + 9 + by + headBob, 5, 4, hairColor);
                break;
            case 'goatee':
                r(ctx, x + 6, y + 9 + by + headBob, 3, 3, hairColor);
                hline(ctx, x + 5, y + 12 + by + headBob, 5, hairColor);
                break;
            case 'sideburns':
                r(ctx, x + 4, y + 6 + by + headBob, 2, 6, hairColor);
                break;
            case 'stubble':
                // Light stubble effect
                p(ctx, x + 5, y + 9 + by + headBob, hairColor);
                p(ctx, x + 7, y + 9 + by + headBob, hairColor);
                p(ctx, x + 6, y + 10 + by + headBob, hairColor);
                break;
        }
    } else {
        // Front view facial hair
        switch (s.facialHair) {
            case 'mustache':
                hline(ctx, x + 1, y + 9 + by + headBob, 6, hairColor);
                hline(ctx, x, y + 10 + by + headBob, 8, hairColor);
                break;
            case 'beard':
                r(ctx, x, y + 8 + by + headBob, 8, 5, hairColor);
                break;
            case 'goatee':
                r(ctx, x + 2, y + 8 + by + headBob, 4, 4, hairColor);
                break;
            case 'sideburns':
                r(ctx, x - 1, y + 6 + by + headBob, 2, 6, hairColor);
                r(ctx, x + 6, y + 6 + by + headBob, 2, 6, hairColor);
                break;
            case 'stubble':
                // Light stubble effect - scattered pixels
                for (let i = 0; i < 5; i++) {
                    p(ctx, x + 1 + Math.floor(i * 1.5), y + 9 + by + headBob + Math.floor(i / 2), hairColor);
                }
                break;
        }
    }
}

/**
 * Draw age-related features (wrinkles, scars, freckles)
 */
function drawAgeFeatures(
    ctx: CanvasRenderingContext2D,
    s: HumanoidStyle,
    x: number,
    y: number,
    by: number,
    headBob: number,
    isSideView: boolean = false
): void {
    const skin = s.skin ?? P.skin;
    const skinShadow = P.skinShadow;
    
    // Wrinkles
    if (s.wrinkles) {
        if (isSideView) {
            // Forehead wrinkles
            hline(ctx, x + 4, y + 2 + by + headBob, 3, skinShadow);
            hline(ctx, x + 5, y + 3 + by + headBob, 2, skinShadow);
            // Cheek wrinkles
            p(ctx, x + 6, y + 7 + by + headBob, skinShadow);
            p(ctx, x + 7, y + 8 + by + headBob, skinShadow);
        } else {
            // Forehead wrinkles
            hline(ctx, x, y + 2 + by + headBob, 2, skinShadow);
            hline(ctx, x + 3, y + 2 + by + headBob, 2, skinShadow);
            // Crow's feet around eyes
            p(ctx, x - 1, y + 4 + by + headBob, skinShadow);
            p(ctx, x + 6, y + 4 + by + headBob, skinShadow);
        }
    }
    
    // Freckles
    if (s.freckles) {
        const freckleColor = P.brickDark;
        if (isSideView) {
            p(ctx, x + 5, y + 5 + by + headBob, freckleColor);
            p(ctx, x + 6, y + 6 + by + headBob, freckleColor);
            p(ctx, x + 7, y + 7 + by + headBob, freckleColor);
        } else {
            p(ctx, x, y + 5 + by + headBob, freckleColor);
            p(ctx, x + 2, y + 5 + by + headBob, freckleColor);
            p(ctx, x + 4, y + 6 + by + headBob, freckleColor);
            p(ctx, x + 6, y + 5 + by + headBob, freckleColor);
        }
    }
    
    // Scars
    if (s.scars) {
        const scarColor = P.red; // Use existing red color for scars
        if (isSideView) {
            // Scar on cheek
            hline(ctx, x + 6, y + 8 + by + headBob, 2, scarColor);
        } else {
            // Scar on left cheek
            hline(ctx, x - 1, y + 8 + by + headBob, 2, scarColor);
        }
    }
}

/**
 * Add form shadows to character for depth
 * These are subtle shadows under chin, arms, etc.
 */
function addFormShadowsFront(
    ctx: CanvasRenderingContext2D,
    skin: string,
    by: number
): void {
    // Shadow under chin (creates jawline definition)
    rr(ctx, 13, 9 + by, 6, 1, 2, P.skinShadow);
    
    // Shadows under arms where they meet torso
    r(ctx, 10, 13 + by, 2, 2, P.shadow);
    r(ctx, 20, 13 + by, 2, 2, P.shadow);
}

/**
 * Add highlights to character for depth
 */
function addHighlightsFront(
    ctx: CanvasRenderingContext2D,
    skin: string,
    by: number
): void {
    // Cheekbone highlights
    p(ctx, 14, 5 + by, P.skinHi);
    p(ctx, 19, 5 + by, P.skinHi);
    
    // Nose bridge highlight
    p(ctx, 16, 7 + by, P.skinHi);
    
    // Chin highlight
    p(ctx, 15, 9 + by, P.skinHi);
}

/**
 * Add form shadows to side view
 */
function addFormShadowsSide(
    ctx: CanvasRenderingContext2D,
    skin: string,
    by: number
): void {
    // Shadow under chin
    rr(ctx, 15, 9 + by, 4, 1, 1, P.skinShadow);
    
    // Shadow on neck
    p(ctx, 15, 10 + by, P.skinShadow);
    
    // Shadow under arm
    r(ctx, 16, 14 + by, 3, 1, P.shadow);
}

/**
 * Add highlights to side view
 */
function addHighlightsSide(
    ctx: CanvasRenderingContext2D,
    skin: string,
    by: number
): void {
    // Cheekbone highlight
    p(ctx, 17, 4 + by, P.skinHi);
    
    // Nose highlight
    p(ctx, 18, 6 + by, P.skinHi);
    
    // Shoulder highlight
    p(ctx, 15, 11 + by, P.skinHi);
}

function dressPoseOffsets(pose: CharacterPose): {
    bodyBob: number;
    leftArmY: number;
    rightArmY: number;
    skirtSway: number;
    hemSpread: number;
    headBob: number;
} {
    switch (pose) {
        case "walk_a":
            return { bodyBob: 1, leftArmY: 13, rightArmY: 11, skirtSway: -1, hemSpread: 1, headBob: 1 };
        case "walk_b":
            return { bodyBob: 0, leftArmY: 12, rightArmY: 12, skirtSway: 0, hemSpread: 0, headBob: 0 };
        case "walk_c":
            return { bodyBob: 1, leftArmY: 11, rightArmY: 13, skirtSway: 1, hemSpread: 1, headBob: -1 };
        case "walk_d":
            return { bodyBob: 0, leftArmY: 12, rightArmY: 12, skirtSway: 0, hemSpread: 0, headBob: 0 };
        default:
            return { bodyBob: 0, leftArmY: 12, rightArmY: 12, skirtSway: 0, hemSpread: 0, headBob: 0 };
    }
}

function drawVictorianHairFront(
    ctx: CanvasRenderingContext2D,
    s: HumanoidStyle,
    by: number
): void {
    if (s.hairUp) {
        // Updo style - rounded hair mass with bun
        rr(ctx, 11, 0 + by, 10, 5, 3, s.hair);
        // Bun at back
        c(ctx, 15, 1 + by, 4, s.hair);
        // Strands framing face
        rr(ctx, 10, 4 + by, 2, 5, 1, s.hair);
        rr(ctx, 18, 4 + by, 2, 5, 1, s.hair);
    } else {
        // Flowing hair with rounded top
        rr(ctx, 11, 2 + by, 10, 4, 3, s.hair);
        // Side hair strands
        rr(ctx, 10, 5 + by, 2, 7, 1, s.hair);
        rr(ctx, 18, 5 + by, 2, 7, 1, s.hair);
        // Hair ends at shoulders
        hline(ctx, 11, 9 + by, 2, s.hair);
        hline(ctx, 17, 9 + by, 2, s.hair);
    }
}

function drawVictorianHairBack(ctx: CanvasRenderingContext2D, s: HumanoidStyle, by: number): void {
    r(ctx, 11, 0 + by, 10, 5, s.hair);
    r(ctx, 12, 4 + by, 8, 4, s.hair);
    if (s.hairUp) {
        r(ctx, 13, 0 + by, 6, 3, s.hair);
    }
}

/**
 * Draw enhanced hair styles for front view
 */
function drawEnhancedHairFront(
    ctx: CanvasRenderingContext2D,
    s: HumanoidStyle,
    headX: number,
    headY: number,
    body: BodyProportions,
    by: number
): void {
    const hair = s.hair;
    const hairStyle = s.hairStyle ?? (s.hairUp ? 'updo' : 'medium');
    const hairPart = s.hairPart ?? 'center';
    const hairHeight = body.hairHeight;
    
    const hairY = headY - hairHeight;
    const headCenterX = headX + Math.floor(body.headWidth / 2);
    
    switch (hairStyle) {
        case 'bald':
            // No hair
            break;
            
        case 'short':
            // Short hair - close to head
            rr(ctx, headX, headY - 2, body.headWidth, 3, Math.min(2, Math.floor(body.headWidth / 2)), hair);
            break;
            
        case 'medium':
            // Medium length hair
            rr(ctx, headX - 1, headY - 3, body.headWidth + 2, 4, Math.min(3, Math.floor((body.headWidth + 2) / 2)), hair);
            // Side parts
            if (hairPart === 'center') {
                rr(ctx, headX - 1, headY - 2, 2, 6, 1, hair);
                rr(ctx, headX + body.headWidth + 1, headY - 2, 2, 6, 1, hair);
            } else if (hairPart === 'left') {
                rr(ctx, headX - 1, headY - 2, 3, 6, 1, hair);
                rr(ctx, headX + body.headWidth, headY - 2, 2, 6, 1, hair);
            } else if (hairPart === 'right') {
                rr(ctx, headX - 1, headY - 2, 2, 6, 1, hair);
                rr(ctx, headX + body.headWidth + 1, headY - 2, 3, 6, 1, hair);
            }
            break;
            
        case 'long':
            // Long flowing hair
            rr(ctx, headX - 2, headY - 4, body.headWidth + 4, 5, Math.min(4, Math.floor((body.headWidth + 4) / 2)), hair);
            // Side strands
            rr(ctx, headX - 2, headY - 3, 2, 8, 1, hair);
            rr(ctx, headX + body.headWidth + 2, headY - 3, 2, 8, 1, hair);
            // Hair ends
            hline(ctx, headX - 1, headY + 3, 2, hair);
            hline(ctx, headX + body.headWidth + 1, headY + 3, 2, hair);
            break;
            
        case 'updo':
        case 'bun':
            // Updo/bun style
            rr(ctx, headX + 1, headY - 3, body.headWidth - 2, 4, Math.min(3, Math.floor((body.headWidth - 2) / 2)), hair);
            // Bun at back
            c(ctx, headCenterX, headY - 4, 3, hair);
            // Strands framing face
            rr(ctx, headX, headY - 1, 2, 5, 1, hair);
            rr(ctx, headX + body.headWidth - 2, headY - 1, 2, 5, 1, hair);
            break;
            
        case 'braid':
            // Braid style - hair braided to one side
            rr(ctx, headX - 1, headY - 3, body.headWidth + 2, 4, Math.min(3, Math.floor((body.headWidth + 2) / 2)), hair);
            // Braid on right side
            rr(ctx, headX + body.headWidth, headY, 3, 8, 1, hair);
            hline(ctx, headX + body.headWidth + 1, headY + 2, 2, hair);
            hline(ctx, headX + body.headWidth + 2, headY + 3, 1, hair);
            break;
            
        case 'curly':
            // Curly hair - voluminous
            rr(ctx, headX - 2, headY - 5, body.headWidth + 4, 6, Math.min(4, Math.floor((body.headWidth + 4) / 2)), hair);
            // Curly strands
            c(ctx, headX - 1, headY - 3, 2, hair);
            c(ctx, headX + body.headWidth + 1, headY - 3, 2, hair);
            c(ctx, headX + 2, headY - 5, 2, hair);
            break;
            
        case 'wavy':
            // Wavy hair
            rr(ctx, headX - 1, headY - 4, body.headWidth + 2, 5, Math.min(3, Math.floor((body.headWidth + 2) / 2)), hair);
            // Wavy pattern
            hline(ctx, headX, headY - 2, 3, hair);
            hline(ctx, headX + body.headWidth - 2, headY - 2, 3, hair);
            hline(ctx, headX + 1, headY + 1, 2, hair);
            hline(ctx, headX + body.headWidth - 3, headY + 1, 2, hair);
            break;
    }
}

/**
 * Draw enhanced hair styles for side view
 */
function drawEnhancedHairSide(
    ctx: CanvasRenderingContext2D,
    s: HumanoidStyle,
    headX: number,
    headY: number,
    body: BodyProportions,
    by: number
): void {
    const hair = s.hair;
    const hairStyle = s.hairStyle ?? (s.hairUp ? 'updo' : 'medium');
    const headCenterX = headX + Math.floor(body.headWidth / 2);
    
    switch (hairStyle) {
        case 'bald':
            // No hair
            break;
            
        case 'short':
            // Short hair - close to head
            rr(ctx, headX + 2, headY - 1, body.headWidth - 2, 2, 1, hair);
            break;
            
        case 'medium':
            // Medium length hair from side
            rr(ctx, headX + 2, headY - 2, body.headWidth, 3, 1, hair);
            rr(ctx, headX + 4, headY, 4, 4, 1, hair);
            break;
            
        case 'long':
            // Long flowing hair from side
            rr(ctx, headX + 2, headY - 3, body.headWidth + 2, 4, 2, hair);
            rr(ctx, headX + 5, headY + 1, 4, 7, 1, hair);
            // Hair ends
            hline(ctx, headX + 6, headY + 8, 3, hair);
            break;
            
        case 'updo':
        case 'bun':
            // Updo/bun from side
            rr(ctx, headX + 2, headY - 3, body.headWidth, 3, 2, hair);
            rr(ctx, headX + 3, headY - 1, body.headWidth - 1, 4, 2, hair);
            // Bun
            c(ctx, headX + 5, headY - 4, 2, hair);
            break;
            
        case 'braid':
            // Braid from side
            rr(ctx, headX + 2, headY - 2, body.headWidth + 1, 3, 1, hair);
            // Braid
            rr(ctx, headX + 6, headY, 3, 8, 1, hair);
            hline(ctx, headX + 7, headY + 2, 2, hair);
            break;
            
        case 'curly':
            // Curly hair from side - voluminous
            rr(ctx, headX + 1, headY - 4, body.headWidth + 3, 5, 2, hair);
            rr(ctx, headX + 4, headY, 5, 5, 1, hair);
            // Curls
            c(ctx, headX + 3, headY - 2, 2, hair);
            c(ctx, headX + 6, headY + 2, 2, hair);
            break;
            
        case 'wavy':
            // Wavy hair from side
            rr(ctx, headX + 2, headY - 3, body.headWidth + 2, 4, 2, hair);
            rr(ctx, headX + 5, headY, 4, 6, 1, hair);
            // Wavy pattern
            hline(ctx, headX + 4, headY - 1, 3, hair);
            hline(ctx, headX + 5, headY + 3, 2, hair);
            break;
    }
}

function drawVictorianHairSide(ctx: CanvasRenderingContext2D, s: HumanoidStyle, by: number): void {
    if (s.hairUp) {
        // Updo from side
        rr(ctx, 17, 0 + by, 5, 3, 2, s.hair);
        rr(ctx, 16, 2 + by, 6, 4, 2, s.hair);
        // Bun
        c(ctx, 19, 1 + by, 3, s.hair);
    } else {
        // Flowing hair from side
        rr(ctx, 16, 2 + by, 6, 3, 2, s.hair);
        rr(ctx, 19, 4 + by, 4, 7, 1, s.hair);
        // Hair ends
        hline(ctx, 20, 10 + by, 3, s.hair);
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
    // Shadow with rounded edges
    rr(ctx, 13 + sway, topY + 3, 3, bottomY - topY - 5, 1, d.skirtShadow);
    rr(ctx, 16 + sway, topY + 5, 2, bottomY - topY - 7, 1, d.skirtShadow);
    if (d.trim) {
        const hemL = 8 + sway - hemSpread;
        const hemR = 24 + sway + hemSpread;
        hline(ctx, hemL, bottomY, hemR - hemL, d.trim);
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
    const headBob = o.headBob;
    const sleeve = d.sleeve ?? d.bodice;
    
    // Get body proportions
    const body = getBodyProportions(s.bodyType);
    
    // Calculate head position with body proportions
    const headX = 16 - Math.floor(body.headWidth / 2);
    const headY = 3 + body.headYOffset + by + headBob;

    // Head with rounded shape (with head bob for walk cycle)
    rr(ctx, headX, headY, body.headWidth, body.headHeight, Math.min(4, body.headWidth), skin);
    
    // Hair - use new hair style if specified, otherwise fall back to Victorian
    if (s.hairStyle || s.hairPart) {
        drawEnhancedHairFront(ctx, s, headX, headY, body, by + headBob);
    } else {
        drawVictorianHairFront(ctx, s, by + headBob);
    }
    
    // Draw facial features with expression support
    drawExpression(ctx, s, headX + 2, headY + 2, by, headBob);
    
    // Nose (subtle)
    p(ctx, 15, 8 + by + headBob, P.skinShadow);
    
    // Add form shadows for depth
    addFormShadowsFront(ctx, skin, by);
    
    // Add highlights for depth
    addHighlightsFront(ctx, skin, by);
    
    // Draw accessories
    if (s.glasses) {
        drawGlasses(ctx, s, headX + 3, headY - 1, by, headBob);
    }
    if (s.jewelry) {
        drawJewelry(ctx, s, headX + 3, headY, by);
    }
    if (s.facialHair && s.facialHair !== 'none') {
        drawFacialHair(ctx, s, headX + 2, headY + 2, by, headBob);
    }
    
    // Draw age features
    drawAgeFeatures(ctx, s, headX + 3, headY, by, headBob);

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
    const headBob = o.headBob;
    const sleeve = d.sleeve ?? d.bodice;

    drawVictorianHairBack(ctx, s, by + headBob);

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
    const headBob = o.headBob;
    const sleeve = d.sleeve ?? d.bodice;
    const sway = o.skirtSway;

    r(ctx, 14, 3 + by + headBob, 7, 7, skin);
    drawVictorianHairSide(ctx, s, by + headBob);
    r(ctx, 18, 6 + by + headBob, 2, 2, P.black);

    if (s.hat) {
        rr(ctx, 13, 0 + by, 10, 3, 2, s.hat);
        if (s.hatBand) hline(ctx, 14, 2 + by, 7, s.hatBand);
    }

    if (d.collar) {
        // Side view collar
        hline(ctx, 14, 9 + by, 5, d.collar);
    }

    r(ctx, 12, 10 + by, 9, 8, d.bodice);
    r(ctx, 13, 11 + by, 5, 4, d.bodiceLight);
    if (d.trim) hline(ctx, 14, 17 + by, 4, d.trim);

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
    const headBob = o.headBob;
    
    // Get body proportions
    const body = getBodyProportions(s.bodyType);
    
    // Calculate head position with body proportions
    const headX = 16 - Math.floor(body.headWidth / 2);
    const headY = 2 + body.headYOffset + by + headBob;

    // Head with rounded shape (with head bob for walk cycle)
    rr(ctx, headX, headY, body.headWidth, body.headHeight, Math.min(4, body.headWidth), skin);
    
    // Hair - use new hair style if specified, otherwise use classic style
    if (s.hairStyle || s.hairPart) {
        drawEnhancedHairFront(ctx, s, headX, headY, body, by + headBob);
    } else {
        // Classic hair with rounded top
        rr(ctx, 11, 0 + by + headBob, 10, 3, 3, s.hair);
        // Side hair
        rr(ctx, 10, 3 + by + headBob, 2, 6, 1, s.hair);
        rr(ctx, 19, 3 + by + headBob, 2, 6, 1, s.hair);
    }
    
    // Draw facial features with expression support
    drawExpression(ctx, s, headX + 2, headY + 2, by, headBob);
    
    // Nose (subtle)
    p(ctx, 15, 8 + by + headBob, P.skinShadow);
    p(ctx, 16, 8 + by + headBob, P.skinShadow);
    
    // Add form shadows for depth
    addFormShadowsFront(ctx, skin, by);
    
    // Add highlights for depth
    addHighlightsFront(ctx, skin, by);
    
    // Draw accessories
    if (s.glasses) {
        drawGlasses(ctx, s, headX + 3, headY - 1, by, headBob);
    }
    if (s.jewelry) {
        drawJewelry(ctx, s, headX + 3, headY, by);
    }
    if (s.facialHair && s.facialHair !== 'none') {
        drawFacialHair(ctx, s, headX + 2, headY + 2, by, headBob);
    }
    
    // Draw age features
    drawAgeFeatures(ctx, s, headX + 3, headY, by, headBob);

    if (s.hat) {
        rr(ctx, 10, 0 + by, 12, 4, 2, s.hat);
        r(ctx, 8, 2 + by, 16, 2, s.hat);
        if (s.hatBand) hline(ctx, 10, 3 + by, 12, s.hatBand);
    }

    r(ctx, 10, 10 + by, 12, 14, s.coat);
    r(ctx, 11, 11 + by, 10, 4, s.coatLight);
    if (s.accent) r(ctx, 14, 14 + by, 4, 6, s.accent);

    // Collar details
    if (s.coatLight) {
        t(ctx, 12, 10 + by, 16, 8 + by, 20, 10 + by, s.coatLight);
    }
    
    // Buttons down the front
    if (s.accent) {
        c(ctx, 15, 14 + by, 1, s.accent);
        c(ctx, 15, 17 + by, 1, s.accent);
        c(ctx, 15, 20 + by, 1, s.accent);
    }

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
    const headBob = o.headBob;
    
    // Get body proportions
    const body = getBodyProportions(s.bodyType);
    
    // Calculate head position with body proportions
    const headX = 16 - Math.floor(body.headWidth / 2);
    const headY = 4 + body.headYOffset + by + headBob;

    // Hair from back with rounded shape (with head bob)
    if (s.hairStyle) {
        // Use enhanced hair for back view
        rr(ctx, headX - 1, headY - body.headHeight - 2, body.headWidth + 2, body.headHeight + 2, 3, s.hair);
        if (s.hairStyle === 'long' || s.hairStyle === 'wavy' || s.hairStyle === 'curly') {
            rr(ctx, headX, headY, body.headWidth, 8, 2, s.hair);
        }
    } else {
        rr(ctx, 10, 0 + by + headBob, 12, 7, 3, s.hair);
    }
    
    // Head (back view) - oval shape (with head bob)
    rr(ctx, headX, headY, body.headWidth, body.headHeight - 2, Math.min(3, Math.floor(body.headWidth / 2)), s.skin ?? P.skin);
    
    // Draw accessories visible from back (jewelry, etc.)
    if (s.jewelry && (s.jewelryType === 'necklace' || s.jewelryType === 'both')) {
        drawJewelry(ctx, s, headX + 3, headY + body.headHeight - 2, by, false);
    }

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
    // Shoe base with rounded toe
    rr(ctx, x, y, w, h, 2, shoe);
    // Toe cap highlight
    rr(ctx, x, y, w, h/2, 1, shoeHi);
    // Heel definition
    if (h >= 3) {
        r(ctx, x + w - 2, y + h - 2, 2, 2, shoeHi);
    }
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
    
    // Cast shadows under feet (subtle)
    r(ctx, 9, leftFootY + 2, 5, 1, P.shadow);
    r(ctx, 18, rightFootY + 2, 5, 1, P.shadow);
    
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
    const headBob = o.headBob;
    const legs = sideLegLayout(pose);
    
    // Get body proportions
    const body = getBodyProportions(s.bodyType);
    
    // Calculate head position with body proportions
    const headX = 16 - Math.floor(body.headWidth / 2);
    const headY = 2 + body.headYOffset + by + headBob;

    // Head with rounded shape (side view with head bob)
    rr(ctx, headX, headY, body.headWidth, body.headHeight, Math.min(3, Math.floor(body.headWidth / 2)), skin);
    
    // Hair from side - use new hair style if specified
    if (s.hairStyle) {
        drawEnhancedHairSide(ctx, s, headX, headY, body, by + headBob);
    } else {
        rr(ctx, 16, 2 + by + headBob, 6, 3, 2, s.hair);
        if (!s.hairUp) {
            // Additional hair flowing down
            rr(ctx, 18, 5 + by + headBob, 4, 4, 1, s.hair);
        }
    }
    
    // Draw facial features with expression support (side view)
    drawExpression(ctx, s, headX + 2, headY + 2, by, headBob, true);
    
    // Nose (side view)
    p(ctx, 19, 7 + by + headBob, P.skinShadow);
    
    // Add form shadows for depth
    addFormShadowsSide(ctx, skin, by);
    
    // Add highlights for depth
    addHighlightsSide(ctx, skin, by);
    
    // Draw accessories (side view)
    if (s.glasses) {
        drawGlasses(ctx, s, headX + 2, headY, by, headBob, true);
    }
    if (s.jewelry) {
        drawJewelry(ctx, s, headX + 3, headY, by, true);
    }
    if (s.facialHair && s.facialHair !== 'none') {
        drawFacialHair(ctx, s, headX + 2, headY + 2, by, headBob, true);
    }
    
    // Draw age features (side view)
    drawAgeFeatures(ctx, s, headX + 3, headY, by, headBob, true);

    if (s.hat) {
        rr(ctx, 12, 0 + by, 12, 4, 2, s.hat);
        if (s.hatBand) hline(ctx, 14, 3 + by, 8, s.hatBand);
    }

    r(ctx, 12, 10 + by, 10, 14, s.coat);
    r(ctx, 13, 12 + by, 6, 5, s.coatLight);
    
    // Buttons on side
    if (s.accent) {
        c(ctx, 13, 14 + by, 1, s.accent);
        c(ctx, 13, 17 + by, 1, s.accent);
    }
    
    // Coat light highlight on shoulder
    if (s.coatLight) {
        hline(ctx, 14, 12 + by, 4, s.coatLight);
    }

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
