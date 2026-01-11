import { Room } from "../world/Room";
import { createLibrary, createHall } from "../world/Rooms";
import {Input} from "./Input";
import {Player} from "../entities/Player";
import {TILE_SIZE} from "../world/constants";
import { InteractionSystem } from "../systems/InteractionSystem";
type GameState = "playing" | "interacting";

export class Game {
    private input = new Input();
    private rooms: Record<string, Room>;
    private currentRoom: Room;

    private player = new Player("player", 64, 64);

    private interaction = new InteractionSystem();
    private state: GameState = "playing";
    private message: string | null = null;


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

        if (this.state === "playing") {
            this.player.update(dt, this.input, this.currentRoom.map);
            this.checkRoomTransition();

            if (this.input.wasPressed("e") || this.input.wasPressed(" ")) {
                console.log("wasPressed", this.player.facing);

                const result = this.interaction.interact(
                    this.player,
                    this.currentRoom
                );

                if (result) {
                    this.message = result;
                    this.state = "interacting";
                }
            }
        } else if (this.state === "interacting") {
            if (this.input.wasPressed("e") || this.input.wasPressed(" ")) {
                this.message = null;
                this.state = "playing";
            }
        }
    }

    private checkRoomTransition() {
        const centerX = this.player.x + this.player.width / 2;
        const centerY = this.player.y + this.player.height / 2;

        const tx = Math.floor(centerX / TILE_SIZE);
        const ty = Math.floor(centerY / TILE_SIZE);

        for (const exit of this.currentRoom.exits) {
            if (exit.x === tx && exit.y === ty) {
                this.currentRoom = this.rooms[exit.targetRoom];
                this.player.x = exit.spawnX * TILE_SIZE;
                this.player.y = exit.spawnY * TILE_SIZE;
                return;
            }
        }
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = "#222";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        this.currentRoom.map.render(ctx);
        this.player.render(ctx);

        if (this.message) {
            ctx.fillStyle = "rgba(0,0,0,0.7)";
            ctx.fillRect(20, ctx.canvas.height - 60, ctx.canvas.width - 40, 40);

            ctx.fillStyle = "white";
            ctx.font = "16px serif";
            ctx.fillText(this.message, 30, ctx.canvas.height - 35);
        }

    }
}
