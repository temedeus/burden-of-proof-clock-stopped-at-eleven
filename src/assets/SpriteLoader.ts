import {
    SPRITE_MAP,
    SPRITE_MAP_2,
    SPRITE_MAP_GARDEN,
    SPRITE_MAP_EXTERIOR,
    SPRITE_MAP_INTERIOR
} from './SpriteMap';
import { TILE_SIZE } from '../world/constants';

const spritesheetUrl = new URL('./spritesheet.png', import.meta.url).href;
const spritesheet2Url = new URL('./spritesheet2.png', import.meta.url).href;
const spritesheet3Url = new URL('./spritesheet3.png', import.meta.url).href;
const spritesheet4Url = new URL('./spritesheet4.png', import.meta.url).href;
const spritesheet5Url = new URL('./spritesheet5.png', import.meta.url).href;

export class SpriteLoader {
    private image: HTMLImageElement | null = null;
    private image2: HTMLImageElement | null = null;
    private imageGarden: HTMLImageElement | null = null;
    private imageExterior: HTMLImageElement | null = null;
    private imageInterior: HTMLImageElement | null = null;
    private loaded = false;
    private loaded2 = false;
    private loadedGarden = false;
    private loadedExterior = false;
    private loadedInterior = false;
    private loadPromise: Promise<void> | null = null;

    /**
     * Load all spritesheet images (1–5)
     */
    load(): Promise<void> {
        if (
            this.loaded &&
            this.image &&
            this.loaded2 &&
            this.image2 &&
            this.loadedGarden &&
            this.imageGarden &&
            this.loadedExterior &&
            this.imageExterior &&
            this.loadedInterior &&
            this.imageInterior
        ) {
            return Promise.resolve();
        }

        if (this.loadPromise) {
            return this.loadPromise;
        }

        const loadImg = (
            src: string,
            onOk: (img: HTMLImageElement) => void,
            label: string
        ): Promise<void> =>
            new Promise<void>((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    onOk(img);
                    console.log(`${label} loaded:`, img.width, 'x', img.height);
                    resolve();
                };
                img.onerror = () => reject(new Error(`Failed to load ${label}`));
                img.src = src;
            });

        this.loadPromise = Promise.all([
            loadImg(spritesheetUrl, (img) => {
                this.image = img;
                this.loaded = true;
            }, 'Spritesheet'),
            loadImg(spritesheet2Url, (img) => {
                this.image2 = img;
                this.loaded2 = true;
            }, 'Spritesheet 2'),
            loadImg(spritesheet3Url, (img) => {
                this.imageGarden = img;
                this.loadedGarden = true;
            }, 'Spritesheet 3 (garden)'),
            loadImg(spritesheet4Url, (img) => {
                this.imageExterior = img;
                this.loadedExterior = true;
            }, 'Spritesheet 4 (exterior)'),
            loadImg(spritesheet5Url, (img) => {
                this.imageInterior = img;
                this.loadedInterior = true;
            }, 'Spritesheet 5 (interior)')
        ]).then(() => {});

        return this.loadPromise;
    }

    isLoaded(): boolean {
        return (
            this.loaded &&
            this.image !== null &&
            this.loaded2 &&
            this.image2 !== null &&
            this.loadedGarden &&
            this.imageGarden !== null &&
            this.loadedExterior &&
            this.imageExterior !== null &&
            this.loadedInterior &&
            this.imageInterior !== null
        );
    }

    getImage(): HTMLImageElement | null {
        return this.image;
    }

    getImage2(): HTMLImageElement | null {
        return this.image2;
    }

    /** spritesheet3 — garden */
    getImageGarden(): HTMLImageElement | null {
        return this.imageGarden;
    }

    /** spritesheet4 — exterior */
    getImageExterior(): HTMLImageElement | null {
        return this.imageExterior;
    }

    /** spritesheet5 — interior */
    getImageInterior(): HTMLImageElement | null {
        return this.imageInterior;
    }

    /**
     * Draw a sprite from the appropriate spritesheet
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

        const garden = SPRITE_MAP_GARDEN[spriteName];
        if (garden) {
            if (!this.imageGarden || !this.loadedGarden) {
                ctx.fillStyle = '#888';
                ctx.fillRect(dx, dy, drawWidth, drawHeight);
                return;
            }
            ctx.drawImage(
                this.imageGarden,
                garden.x,
                garden.y,
                garden.width,
                garden.height,
                dx,
                dy,
                drawWidth,
                drawHeight
            );
            return;
        }

        const exterior = SPRITE_MAP_EXTERIOR[spriteName];
        if (exterior) {
            if (!this.imageExterior || !this.loadedExterior) {
                ctx.fillStyle = '#888';
                ctx.fillRect(dx, dy, drawWidth, drawHeight);
                return;
            }
            ctx.drawImage(
                this.imageExterior,
                exterior.x,
                exterior.y,
                exterior.width,
                exterior.height,
                dx,
                dy,
                drawWidth,
                drawHeight
            );
            return;
        }

        const interior = SPRITE_MAP_INTERIOR[spriteName];
        if (interior) {
            if (!this.imageInterior || !this.loadedInterior) {
                ctx.fillStyle = '#888';
                ctx.fillRect(dx, dy, drawWidth, drawHeight);
                return;
            }
            ctx.drawImage(
                this.imageInterior,
                interior.x,
                interior.y,
                interior.width,
                interior.height,
                dx,
                dy,
                drawWidth,
                drawHeight
            );
            return;
        }

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
