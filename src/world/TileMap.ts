import { TILE_SIZE } from "./constants";
import {
    TILE_WALL,
    TILE_FURNITURE,
    TILE_DOOR
} from "./TileTypes";

export class TileMap {
    constructor(
        public width: number,
        public height: number,
        public tiles: number[]
    ) {}

    isBlocked(tx: number, ty: number): boolean {
        if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) {
            return true;
        }

        const tile = this.tiles[ty * this.width + tx];
        return tile === TILE_WALL || tile === TILE_FURNITURE;
    }

    render(ctx: CanvasRenderingContext2D) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.tiles[y * this.width + x];

                if (tile === TILE_DOOR) {
                    ctx.fillStyle = "#886644"; // wooden door
                } else if (tile === TILE_WALL) {
                    ctx.fillStyle = "#555";
                } else if (tile === TILE_FURNITURE) {
                    ctx.fillStyle = "#3a2f28";
                } else {
                    continue;
                }

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
