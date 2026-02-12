import { Player } from "../entities/Player";
import { Room } from "../world/Room";
import { TILE_SIZE } from "../world/constants";
import { ClueSystem } from "./ClueSystem";

export interface InteractionResult {
    description: string;
    clues: string[];
}

export class InteractionSystem {
    constructor(private clueSystem: ClueSystem) {}

    interact(player: Player, room: Room): InteractionResult | null {
        const { x, y } = this.getTargetTile(player);

        for (const obj of room.interactables) {
            if (obj.tiles.some(t => t.x === x && t.y === y)) {
                // Only add clues that haven't been collected yet
                const newClues: string[] = [];
                if (obj.clues) {
                    for (const clueId of obj.clues) {
                        if (!this.clueSystem.hasClue(clueId)) {
                            this.clueSystem.addClue(clueId);
                            newClues.push(clueId);
                        }
                    }
                }
                
                return {
                    description: obj.description,
                    clues: newClues // Only return newly collected clues
                };
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
