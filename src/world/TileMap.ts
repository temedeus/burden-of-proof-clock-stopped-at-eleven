import { TILE_SIZE } from "./constants";

export class TileMap {
    width: number;
    height: number;
    tiles: number[];

    constructor(width: number, height: number, tiles: number[]) {
        this.width = width;
        this.height = height;
        this.tiles = tiles;
    }

    isBlocked(tx: number, ty: number): boolean {
        if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) {
            return true;
        }

        const index = ty * this.width + tx;
        return this.tiles[index] === 1; // 1 = wall
    }

    render(ctx: CanvasRenderingContext2D) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.tiles[y * this.width + x];
                if (tile === 1) {
                    ctx.fillStyle = "#444";
                    ctx.fillRect(
                        x * TILE_SIZE,
                        y * TILE_SIZE,
                        TILE_SIZE,
                        TILE_SIZE
                    );
                }
            }
        }
    }
}
