import { PLAYER_SPRITE_NAMES, type PlayerSpriteName } from "@cse/content-schema";
import {
    drawHumanoidFrame,
    PLAYER_CHARACTER_STYLES,
    type CharacterFacing,
    type CharacterPose,
    type HumanoidStyle
} from "./characters";
import { drawPlayerTemplateFrame } from "./playerTemplates";

/** Native humanoid frame size; draw at an integer multiple, feet anchored to the entity box bottom. */
export const HUMANOID_NATIVE_W = 32;
export const HUMANOID_NATIVE_H = 40;
const NATIVE_W = HUMANOID_NATIVE_W;
const NATIVE_H = HUMANOID_NATIVE_H;

const BAKE_FACINGS: CharacterFacing[] = ["down", "up", "right"];
const POSES: CharacterPose[] = ["idle", "walk_a", "walk_b", "walk_c", "walk_d"];

export function animationCacheKey(
    sprite: PlayerSpriteName,
    facing: CharacterFacing,
    pose: CharacterPose
): string {
    return `${sprite}:${facing}:${pose}`;
}

function bakeFrame(
    style: HumanoidStyle,
    facing: CharacterFacing,
    pose: CharacterPose,
    sprite?: PlayerSpriteName
): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = NATIVE_W;
    canvas.height = NATIVE_H;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    if (!sprite || !drawPlayerTemplateFrame(ctx, sprite, style, facing, pose)) {
        drawHumanoidFrame(ctx, style, facing, pose);
    }
    return canvas;
}

export function generatePlayerAnimations(): Map<string, HTMLCanvasElement> {
    const cache = new Map<string, HTMLCanvasElement>();

    for (const sprite of PLAYER_SPRITE_NAMES) {
        const style = PLAYER_CHARACTER_STYLES[sprite];
        for (const facing of BAKE_FACINGS) {
            for (const pose of POSES) {
                cache.set(animationCacheKey(sprite, facing, pose), bakeFrame(style, facing, pose, sprite));
            }
        }
    }

    return cache;
}

/** Map player facing to baked atlas facing (`left` uses mirrored `right`) */
export function facingToBakeFacing(facing: "up" | "down" | "left" | "right"): CharacterFacing {
    if (facing === "left" || facing === "right") return "right";
    if (facing === "up") return "up";
    return "down";
}

export function shouldMirrorFacing(facing: "up" | "down" | "left" | "right"): boolean {
    return facing === "left";
}

const npcFrameCache = new WeakMap<HumanoidStyle, Map<string, HTMLCanvasElement>>();

/** Lazily baked humanoid frame (NPCs); avoids re-rasterising shapes every render. */
export function getHumanoidFrame(
    style: HumanoidStyle,
    facing: CharacterFacing,
    pose: CharacterPose
): HTMLCanvasElement {
    let frames = npcFrameCache.get(style);
    if (!frames) {
        frames = new Map();
        npcFrameCache.set(style, frames);
    }
    const key = `${facing}:${pose}`;
    let canvas = frames.get(key);
    if (!canvas) {
        canvas = bakeFrame(style, facing, pose);
        frames.set(key, canvas);
    }
    return canvas;
}
