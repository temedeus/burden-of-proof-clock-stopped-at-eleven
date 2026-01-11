import { Player } from "../entities/Player";
import { Room } from "../world/Room";
import { TILE_SIZE } from "../world/constants";

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
        const origin = player.getInteractionPoint();

        const reach = TILE_SIZE * 0.6;
        let offsetX = 0;
        let offsetY = 0;

        switch (player.facing) {
            case "up": offsetY = -reach; break;
            case "down": offsetY = reach; break;
            case "left": offsetX = -reach; break;
            case "right": offsetX = reach; break;
        }

        const targetX = origin.x + offsetX;
        const targetY = origin.y + offsetY;

        return {
            x: Math.floor(targetX / TILE_SIZE),
            y: Math.floor(targetY / TILE_SIZE)
        };
    }
}
