import { TILE_SIZE } from '../world/constants';
import { generateAllSprites, getSpriteDef } from './procedural/registry';

export class SpriteLoader {
    private cache = new Map<string, HTMLCanvasElement>();
    private loaded = false;
    private loadPromise: Promise<void> | null = null;

    /**
     * Generate all procedural sprites (baked to offscreen canvases)
     */
    load(): Promise<void> {
        if (this.loaded && this.cache.size > 0) {
            return Promise.resolve();
        }

        if (this.loadPromise) {
            return this.loadPromise;
        }

        this.loadPromise = new Promise<void>((resolve) => {
            this.cache = generateAllSprites();
            this.loaded = true;
            console.log(`Procedural sprites generated: ${this.cache.size}`);
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
        height?: number
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

        ctx.imageSmoothingEnabled = prevSmoothing;
    }
}

export const spriteLoader = new SpriteLoader();
