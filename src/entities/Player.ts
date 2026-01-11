import { Entity } from "./Entity";
import { Input } from "../engine/Input";
import { TILE_SIZE } from "../world/constants";
import { TileMap } from "../world/TileMap";

export type Facing = "up" | "down" | "left" | "right";

export class Player extends Entity {
    speed = 180;

    // collision box (smaller than tile)
    width = TILE_SIZE * 0.7;
    height = TILE_SIZE * 0.7;
    facing: Facing = "down";

    update(dt: number, input: Input, map: TileMap) {
        let dx = 0;
        let dy = 0;

        if (input.isDown("w") || input.isDown("arrowup")) dy -= 1;
        if (input.isDown("s") || input.isDown("arrowdown")) dy += 1;
        if (input.isDown("a") || input.isDown("arrowleft")) dx -= 1;
        if (input.isDown("d") || input.isDown("arrowright")) dx += 1;

        if (dx > 0) this.facing = "right";
        else if (dx < 0) this.facing = "left";
        else if (dy > 0) this.facing = "down";
        else if (dy < 0) this.facing = "up";

        const moveX = dx * this.speed * dt;
        const moveY = dy * this.speed * dt;

        // move X, then resolve collision
        this.tryMove(moveX, 0, map);

        // move Y, then resolve collision
        this.tryMove(0, moveY, map);
    }

    private tryMove(dx: number, dy: number, map: TileMap) {
        const nextX = this.x + dx;
        const nextY = this.y + dy;

        if (!this.collides(nextX, nextY, map)) {
            this.x = nextX;
            this.y = nextY;
        }
    }

    private collides(x: number, y: number, map: TileMap): boolean {
        const left = Math.floor(x / TILE_SIZE);
        const right = Math.floor((x + this.width) / TILE_SIZE);
        const top = Math.floor(y / TILE_SIZE);
        const bottom = Math.floor((y + this.height) / TILE_SIZE);

        return (
            map.isBlocked(left, top) ||
            map.isBlocked(right, top) ||
            map.isBlocked(left, bottom) ||
            map.isBlocked(right, bottom)
        );
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = "white";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    getInteractionPoint(): { x: number; y: number } {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }
}
