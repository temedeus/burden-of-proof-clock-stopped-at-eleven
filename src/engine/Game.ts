import { Input } from "./Input";
import { Player } from "../entities/Player";
import { TileMap } from "../world/TileMap";
import { TILE_SIZE } from "../world/constants";

export class Game {
    private input = new Input();
    private player = new Player("player", 64, 64);

    private map = new TileMap(25, 18, [
        // 0 = floor, 1 = wall
        // simple room with walls
        ...Array(25).fill(1),
        ...Array(16).fill(1), ...Array(23).fill(0), 1,
        ...Array(16).fill(1), ...Array(23).fill(0), 1,
        ...Array(16).fill(1), ...Array(23).fill(0), 1,
        ...Array(25).fill(1),
    ]);

    update(dt: number) {
        this.player.update(dt, this.input);
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = "#222";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        this.map.render(ctx);
        this.player.render(ctx);
    }
}
