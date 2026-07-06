import { TILE_SIZE } from '../world/constants';
import type { Facing, PlayerSpriteName } from '../entities/Player';
import type { CharacterPose } from './procedural/characters';
import {
    animationCacheKey,
    facingToBakeFacing,
    generatePlayerAnimations,
    shouldMirrorFacing
} from './procedural/characterAnimation';
import { generateAllSprites, getSpriteDef } from './procedural/registry';

export class SpriteLoader {
    private cache = new Map<string, HTMLCanvasElement>();
    private animCache = new Map<string, HTMLCanvasElement>();
    private loaded = false;
    private loadPromise: Promise<void> | null = null;

    /**
     * Generate all procedural sprites (baked to offscreen canvases)
     */
    load(): Promise<void> {
        if (this.loaded && this.cache.size > 0 && this.animCache.size > 0) {
            return Promise.resolve();
        }

        if (this.loadPromise) {
            return this.loadPromise;
        }

        this.loadPromise = new Promise<void>((resolve) => {
            this.cache = generateAllSprites();
            this.animCache = generatePlayerAnimations();
            this.loaded = true;
            console.log(
                `Procedural sprites generated: ${this.cache.size} static, ${this.animCache.size} animated`
            );
            resolve();
        });

        return this.loadPromise;
    }

    isLoaded(): boolean {
        return this.loaded && this.cache.size > 0;
    }

    /**
     * Draw a procedural sprite by name (nearest-neighbor scaled)
     */
    drawSprite(
        ctx: CanvasRenderingContext2D,
        spriteName: string,
        dx: number,
        dy: number,
        width?: number,
        height?: number,
        flipX = false,
        flipY = false
    ): void {
        const drawWidth = width ?? TILE_SIZE;
        const drawHeight = height ?? TILE_SIZE;

        const prevSmoothing = ctx.imageSmoothingEnabled;
        ctx.imageSmoothingEnabled = false;

        if (!this.loaded) {
            ctx.fillStyle = '#888';
            ctx.fillRect(dx, dy, drawWidth, drawHeight);
            ctx.imageSmoothingEnabled = prevSmoothing;
            return;
        }

        const canvas = this.cache.get(spriteName);
        if (!canvas) {
            if (!getSpriteDef(spriteName)) {
                console.warn(`Sprite "${spriteName}" not found`);
            }
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(dx, dy, drawWidth, drawHeight);
            ctx.imageSmoothingEnabled = prevSmoothing;
            return;
        }

        if (flipX || flipY) {
            ctx.save();
            ctx.translate(dx + (flipX ? drawWidth : 0), dy + (flipY ? drawHeight : 0));
            ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
            ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, drawWidth, drawHeight);
            ctx.restore();
        } else {
            ctx.drawImage(
                canvas,
                0,
                0,
                canvas.width,
                canvas.height,
                dx,
                dy,
                drawWidth,
                drawHeight
            );
        }

        ctx.imageSmoothingEnabled = prevSmoothing;
    }

    /**
     * Draw an animated player frame (walk / idle, 4 directions)
     */
    drawCharacterFrame(
        ctx: CanvasRenderingContext2D,
        spriteName: PlayerSpriteName,
        facing: Facing,
        pose: CharacterPose,
        dx: number,
        dy: number,
        width?: number,
        height?: number
    ): void {
        const drawWidth = width ?? TILE_SIZE;
        const drawHeight = height ?? TILE_SIZE;
        const bakeFacing = facingToBakeFacing(facing);
        const key = animationCacheKey(spriteName, bakeFacing, pose);

        const prevSmoothing = ctx.imageSmoothingEnabled;
        ctx.imageSmoothingEnabled = false;

        if (!this.loaded) {
            ctx.fillStyle = '#888';
            ctx.fillRect(dx, dy, drawWidth, drawHeight);
            ctx.imageSmoothingEnabled = prevSmoothing;
            return;
        }

        const canvas = this.animCache.get(key);
        if (!canvas) {
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(dx, dy, drawWidth, drawHeight);
            ctx.imageSmoothingEnabled = prevSmoothing;
            return;
        }

        if (shouldMirrorFacing(facing)) {
            ctx.save();
            ctx.translate(dx + drawWidth, dy);
            ctx.scale(-1, 1);
            ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, drawWidth, drawHeight);
            ctx.restore();
        } else {
            ctx.drawImage(
                canvas,
                0,
                0,
                canvas.width,
                canvas.height,
                dx,
                dy,
                drawWidth,
                drawHeight
            );
        }

        ctx.imageSmoothingEnabled = prevSmoothing;
    }
}

export const spriteLoader = new SpriteLoader();
