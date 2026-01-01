import { Input } from "./Input";
import { Player } from "../entities/Player";

export class Game {
    private input = new Input();
    private player = new Player("player", 100, 100);

    update(dt: number) {
        this.player.update(dt, this.input);
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = "#222";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        this.player.render(ctx);
    }
}
