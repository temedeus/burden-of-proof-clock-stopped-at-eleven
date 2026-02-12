import { SPRITE_MAP, SPRITESHEET_WIDTH, SPRITESHEET_HEIGHT } from './SpriteMap';
import { TILE_SIZE } from '../world/constants';

// Import the image - Vite will handle the path
const spritesheetUrl = new URL('./spritesheet.png', import.meta.url).href;

export class SpriteLoader {
    private image: HTMLImageElement | null = null;
    private loaded: boolean = false;
    private loadPromise: Promise<void> | null = null;

    /**
     * Load the spritesheet image
     */
    load(): Promise<void> {
        if (this.loaded && this.image) {
            return Promise.resolve();
        }

        if (this.loadPromise) {
            return this.loadPromise;
        }

        this.loadPromise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.image = img;
                this.loaded = true;
                console.log('Spritesheet loaded successfully:', img.width, 'x', img.height);
                resolve();
            };
            img.onerror = (err) => {
                console.error('Failed to load spritesheet image:', err, 'URL:', spritesheetUrl);
                reject(new Error('Failed to load spritesheet image'));
            };
            // Use import.meta.url to get the correct path in Vite
            img.src = spritesheetUrl;
        });

        return this.loadPromise;
    }

    /**
     * Check if the spritesheet is loaded
     */
    isLoaded(): boolean {
        return this.loaded && this.image !== null;
    }

    /**
     * Get the spritesheet image
     */
    getImage(): HTMLImageElement | null {
        return this.image;
    }

    /**
     * Draw a sprite from the spritesheet, scaled to match TILE_SIZE
     * @param ctx Canvas rendering context
     * @param spriteName Name of the sprite from SPRITE_MAP
     * @param dx Destination X position
     * @param dy Destination Y position
     * @param width Optional width override (defaults to TILE_SIZE)
     * @param height Optional height override (defaults to TILE_SIZE)
     */
    drawSprite(
        ctx: CanvasRenderingContext2D,
        spriteName: string,
        dx: number,
        dy: number,
        width?: number,
        height?: number
    ): void {
        if (!this.image || !this.loaded) {
            // Fallback: draw a colored rectangle
            ctx.fillStyle = '#888';
            ctx.fillRect(dx, dy, width || TILE_SIZE, height || TILE_SIZE);
            return;
        }

        const sprite = SPRITE_MAP[spriteName];
        if (!sprite) {
            console.warn(`Sprite "${spriteName}" not found in SPRITE_MAP`);
            ctx.fillStyle = '#ff00ff'; // Magenta for missing sprites
            ctx.fillRect(dx, dy, width || TILE_SIZE, height || TILE_SIZE);
            return;
        }

        // Always scale to TILE_SIZE (or provided width/height)
        // The sprite's source size is in the spritesheet, but we render it at TILE_SIZE
        const drawWidth = width || TILE_SIZE;
        const drawHeight = height || TILE_SIZE;

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
