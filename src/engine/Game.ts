import { Input } from "./Input";
import { Player } from "../entities/Player";
import { TileMap } from "../world/TileMap";
import { TILE_SIZE } from "../world/constants";
import {
    TILE_FLOOR,
    TILE_WALL,
    TILE_FURNITURE
} from "../world/TileTypes";

export class Game {
    private input = new Input();
    private player = new Player("player", 64, 64);
    private map: TileMap;

    constructor(private ctx: CanvasRenderingContext2D) {
        const tilesWide = Math.floor(ctx.canvas.width / TILE_SIZE);
        const tilesHigh = 11; // fixed room height for now

        this.map = new TileMap(
            tilesWide,
            tilesHigh,
            this.buildRoom(tilesWide, tilesHigh)
        );
    }

    private buildRoom(w: number, h: number): number[] {
        const tiles = new Array(w * h).fill(TILE_FLOOR);

        // outer walls
        for (let x = 0; x < w; x++) {
            tiles[x] = TILE_WALL;
            tiles[(h - 1) * w + x] = TILE_WALL;
        }

        for (let y = 0; y < h; y++) {
            tiles[y * w] = TILE_WALL;
            tiles[y * w + (w - 1)] = TILE_WALL;
        }

        // central table
        const cx = Math.floor(w / 2);
        tiles[(5 * w) + cx - 1] = TILE_FURNITURE;
        tiles[(5 * w) + cx]     = TILE_FURNITURE;
        tiles[(5 * w) + cx + 1] = TILE_FURNITURE;
        tiles[(6 * w) + cx - 1] = TILE_FURNITURE;
        tiles[(6 * w) + cx]     = TILE_FURNITURE;
        tiles[(6 * w) + cx + 1] = TILE_FURNITURE;

        // bookshelves along bottom wall
        for (let x = 2; x < w - 2; x++) {
            tiles[(h - 3) * w + x] = TILE_FURNITURE;
        }

        return tiles;
    }

    update(dt: number) {
        this.player.update(dt, this.input, this.map);
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = "#222";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        this.map.render(ctx);
        this.player.render(ctx);
    }
}
