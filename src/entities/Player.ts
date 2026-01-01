import { Entity } from "./Entity";
import { Input } from "../engine/Input";
import { TILE_SIZE } from "../world/constants";

export class Player extends Entity {
    speed = 180; // pixels per second

    update(dt: number, input: Input) {
        let dx = 0;
        let dy = 0;

        if (input.isDown("w") || input.isDown("arrowup")) dy -= 1;
        if (input.isDown("s") || input.isDown("arrowdown")) dy += 1;
        if (input.isDown("a") || input.isDown("arrowleft")) dx -= 1;
        if (input.isDown("d") || input.isDown("arrowright")) dx += 1;

        // normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            dx *= 0.7071;
            dy *= 0.7071;
        }

        const nextX = this.x + dx * this.speed * dt;
        const nextY = this.y + dy * this.speed * dt;

        // TEMP: no collision yet
        this.x = nextX;
        this.y = nextY;
    }

    get tileX(): number {
        return Math.floor(this.x / TILE_SIZE);
    }

    get tileY(): number {
        return Math.floor(this.y / TILE_SIZE);
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = "white";
        ctx.fillRect(this.x, this.y, TILE_SIZE * 0.8, TILE_SIZE * 0.8);
    }
}
