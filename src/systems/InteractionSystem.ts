import { Player } from "../entities/Player";
import { Room } from "../world/Room";
import { TILE_SIZE } from "../world/constants";
import { ClueSystem } from "./ClueSystem";
import { DialogSystem } from "./DialogSystem";
import { NPC } from "../entities/NPC";

export interface InteractionResult {
    description: string;
    clues: string[];
    speaker?: string; // NPC name if talking to NPC
}

export class InteractionSystem {
    private dialogSystem: DialogSystem;

    constructor(private clueSystem: ClueSystem) {
        this.dialogSystem = new DialogSystem(clueSystem);
    }

    interact(player: Player, room: Room, npcDialogs?: Record<string, any>): InteractionResult | null {
        const { x, y } = this.getTargetTile(player);

        // Check NPCs first
        for (const npc of room.npcs) {
            // Calculate all tiles the NPC occupies
            const npcLeftTile = Math.floor(npc.x / TILE_SIZE);
            const npcRightTile = Math.floor((npc.x + npc.width) / TILE_SIZE);
            const npcTopTile = Math.floor(npc.y / TILE_SIZE);
            const npcBottomTile = Math.floor((npc.y + npc.height) / TILE_SIZE);
            
            // Check if the target tile is within any of the NPC's occupied tiles
            if (
                x >= npcLeftTile &&
                x < npcRightTile &&
                y >= npcTopTile &&
                y < npcBottomTile
            ) {
                // Get dialog for this NPC
                if (npcDialogs && npcDialogs[npc.id]) {
                    const dialog = this.dialogSystem.getDialog(npcDialogs[npc.id]);
                    return {
                        description: `${npc.name}: ${dialog}`,
                        clues: [],
                        speaker: npc.name
                    };
                }
                return {
                    description: `${npc.name}: Hello there.`,
                    clues: [],
                    speaker: npc.name
                };
            }
        }

        // Check interactables
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
