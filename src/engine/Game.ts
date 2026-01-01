import { Room } from "../world/Room";
import { createLibrary, createHall } from "../world/Rooms";
import {Input} from "./Input";
import {Player} from "../entities/Player";
import {TILE_SIZE} from "../world/constants";

export class Game {
    private input = new Input();
    private rooms: Record<string, Room>;
    private currentRoom: Room;

    private player = new Player("player", 64, 64);

    constructor(private ctx: CanvasRenderingContext2D) {
        const w = Math.floor(ctx.canvas.width / TILE_SIZE);
        const h = Math.floor(ctx.canvas.height / TILE_SIZE);

        this.rooms = {
            library: createLibrary(w, h),
            hall: createHall(w, h)
        };

        this.currentRoom = this.rooms.library;
    }

    update(dt: number) {
        this.player.update(dt, this.input, this.currentRoom.map);
        this.checkRoomTransition();
    }

    private checkRoomTransition() {
        const tx = Math.floor(this.player.x / TILE_SIZE);
        const ty = Math.floor(this.player.y / TILE_SIZE);

        for (const exit of this.currentRoom.exits) {
            if (exit.x === tx && exit.y === ty) {
                this.currentRoom = this.rooms[exit.targetRoom];
                this.player.x = exit.spawnX * TILE_SIZE;
                this.player.y = exit.spawnY * TILE_SIZE;
                break;
            }
        }
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = "#222";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        this.currentRoom.map.render(ctx);
        this.player.render(ctx);
    }
}
