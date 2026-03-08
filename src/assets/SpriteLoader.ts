import { SPRITE_MAP, SPRITE_MAP_2 } from './SpriteMap';
import { TILE_SIZE } from '../world/constants';

const spritesheetUrl = new URL('./spritesheet.png', import.meta.url).href;
const spritesheet2Url = new URL('./spritesheet2.png', import.meta.url).href;

export class SpriteLoader {
    private image: HTMLImageElement | null = null;
    private image2: HTMLImageElement | null = null;
    private loaded: boolean = false;
    private loaded2: boolean = false;
    private loadPromise: Promise<void> | null = null;

    /**
     * Load both spritesheet images
     */
    load(): Promise<void> {
        if (this.loaded && this.image && this.loaded2 && this.image2) {
            return Promise.resolve();
        }

        if (this.loadPromise) {
            return this.loadPromise;
        }

        this.loadPromise = Promise.all([
            new Promise<void>((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    this.image = img;
                    this.loaded = true;
                    console.log('Spritesheet loaded:', img.width, 'x', img.height);
                    resolve();
                };
                img.onerror = () => {
                    reject(new Error('Failed to load spritesheet image'));
                };
                img.src = spritesheetUrl;
            }),
            new Promise<void>((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    this.image2 = img;
                    this.loaded2 = true;
                    console.log('Spritesheet 2 loaded:', img.width, 'x', img.height);
                    resolve();
                };
                img.onerror = () => {
                    reject(new Error('Failed to load spritesheet2 image'));
                };
                img.src = spritesheet2Url;
            })
        ]).then(() => {});

        return this.loadPromise;
    }

    isLoaded(): boolean {
        return this.loaded && this.image !== null && this.loaded2 && this.image2 !== null;
    }

    getImage(): HTMLImageElement | null {
        return this.image;
    }

    getImage2(): HTMLImageElement | null {
        return this.image2;
    }

    /**
     * Draw a sprite from the appropriate spritesheet (SPRITE_MAP or SPRITE_MAP_2)
     */
    drawSprite(
        ctx: CanvasRenderingContext2D,
        spriteName: string,
        dx: number,
        dy: number,
        width?: number,
        height?: number
    ): void {
        const drawWidth = width || TILE_SIZE;
        const drawHeight = height || TILE_SIZE;

        const sprite2 = SPRITE_MAP_2[spriteName];
        if (sprite2) {
            if (!this.image2 || !this.loaded2) {
                ctx.fillStyle = '#888';
                ctx.fillRect(dx, dy, drawWidth, drawHeight);
                return;
            }
            ctx.drawImage(
                this.image2,
                sprite2.x,
                sprite2.y,
                sprite2.width,
                sprite2.height,
                dx,
                dy,
                drawWidth,
                drawHeight
            );
            return;
        }

        if (!this.image || !this.loaded) {
            ctx.fillStyle = '#888';
            ctx.fillRect(dx, dy, drawWidth, drawHeight);
            return;
        }

        const sprite = SPRITE_MAP[spriteName];
        if (!sprite) {
            console.warn(`Sprite "${spriteName}" not found`);
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(dx, dy, drawWidth, drawHeight);
            return;
        }

        ctx.drawImage(
            this.image,
            sprite.x,
            sprite.y,
            sprite.width,
            sprite.height,
            dx,
            dy,
            drawWidth,
            drawHeight
        );
    }
}

// Singleton instance
export const spriteLoader = new SpriteLoader();
