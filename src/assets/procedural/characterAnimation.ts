import type { PlayerSpriteName } from "../../entities/Player";
import {
    drawHumanoidFrame,
    PLAYER_CHARACTER_STYLES,
    type CharacterFacing,
    type CharacterPose
} from "./characters";

const NATIVE_W = 32;
const NATIVE_H = 40;

const PLAYER_SPRITES: PlayerSpriteName[] = ["female_detective", "male_detective"];
const BAKE_FACINGS: CharacterFacing[] = ["down", "up", "right"];
const POSES: CharacterPose[] = ["idle", "walk_a", "walk_b"];

export function animationCacheKey(
    sprite: PlayerSpriteName,
    facing: CharacterFacing,
    pose: CharacterPose
): string {
    return `${sprite}:${facing}:${pose}`;
}

function bakeFrame(
    style: (typeof PLAYER_CHARACTER_STYLES)[string],
    facing: CharacterFacing,
    pose: CharacterPose
): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = NATIVE_W;
    canvas.height = NATIVE_H;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    drawHumanoidFrame(ctx, style, facing, pose);
    return canvas;
}

export function generatePlayerAnimations(): Map<string, HTMLCanvasElement> {
    const cache = new Map<string, HTMLCanvasElement>();

    for (const sprite of PLAYER_SPRITES) {
        const style = PLAYER_CHARACTER_STYLES[sprite];
        for (const facing of BAKE_FACINGS) {
            for (const pose of POSES) {
                cache.set(animationCacheKey(sprite, facing, pose), bakeFrame(style, facing, pose));
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
