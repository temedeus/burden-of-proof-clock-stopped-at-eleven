import { Player } from "../entities/Player";
import { TileMap } from "../world/TileMap";
import { TILE_SIZE } from "../world/constants";
import { TILE_FURNITURE, TILE_DOOR } from "../world/TileTypes";
import {Room} from "../world/Room";

export class InteractionSystem {
    interact(player: Player, room: Room): string | null {
        const { x, y } = this.getTargetTile(player);

        for (const obj of room.interactables) {
            if (obj.tiles.some(t => t.x === x && t.y === y)) {
                return obj.description;
            }
        }

        return null;
    }


    private getTargetTile(player: Player) {
        const px = Math.floor(player.x / TILE_SIZE);
        const py = Math.floor(player.y / TILE_SIZE);

        switch (player.facing) {
            case "up": return { x: px, y: py - 1 };
            case "down": return { x: px, y: py + 1 };
            case "left": return { x: px - 1, y: py };
            case "right": return { x: px + 1, y: py };
        }
    }
}
