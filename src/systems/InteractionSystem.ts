import { Player } from "../entities/Player";
import { Room } from "../world/Room";
import { TILE_SIZE } from "../world/constants";
import { getInteractionTiles, tileBounds } from "../world/interactableTiles";
import { ClueSystem } from "./ClueSystem";
import { DialogSystem } from "./DialogSystem";
import { NPC } from "../entities/NPC";

export interface InteractionResult {
    description: string;
    clues: string[];
    speaker?: string; // NPC name if talking to NPC
    speakerId?: string; // NPC id (e.g. "cook") for game logic
    confirmation?: { id: string; prompt: string };
}

export class InteractionSystem {
    private dialogSystem: DialogSystem;

    constructor(private clueSystem: ClueSystem) {
        this.dialogSystem = new DialogSystem(clueSystem);
    }

    interact(player: Player, room: Room, npcDialogs?: Record<string, any>): InteractionResult | null {
        const { x, y } = this.getTargetTile(player);

        // Check NPCs first - check if NPC is in the direction player is facing and adjacent
        for (const npc of room.npcs) {
            // Calculate all tiles the NPC occupies
            const npcLeftTile = Math.floor(npc.x / TILE_SIZE);
            const npcRightTile = Math.floor((npc.x + npc.width) / TILE_SIZE);
            const npcTopTile = Math.floor(npc.y / TILE_SIZE);
            const npcBottomTile = Math.floor((npc.y + npc.height) / TILE_SIZE);
            
            // Calculate player's occupied tiles
            const playerLeftTile = Math.floor(player.x / TILE_SIZE);
            const playerRightTile = Math.floor((player.x + player.width) / TILE_SIZE);
            const playerTopTile = Math.floor(player.y / TILE_SIZE);
            const playerBottomTile = Math.floor((player.y + player.height) / TILE_SIZE);
            
            // Check if NPC is adjacent to player (touching or within 1 tile)
            const horizontalAdjacent = playerRightTile >= npcLeftTile - 1 && playerLeftTile <= npcRightTile + 1;
            const verticalAdjacent = playerBottomTile >= npcTopTile - 1 && playerTopTile <= npcBottomTile + 1;
            
            // Check if target tile (in facing direction) overlaps with NPC
            const targetOverlapsNPC = (
                x >= npcLeftTile &&
                x < npcRightTile &&
                y >= npcTopTile &&
                y < npcBottomTile
            );
            
            // NPC must be adjacent AND the target tile must overlap with NPC (facing direction matters)
            if (horizontalAdjacent && verticalAdjacent && targetOverlapsNPC) {
                if (npcDialogs && npcDialogs[npc.id]) {
                    const dialog = this.dialogSystem.getDialog(npcDialogs[npc.id]);
                    return {
                        description: `${npc.name}: ${dialog}`,
                        clues: [],
                        speaker: npc.name,
                        speakerId: npc.id
                    };
                }
                return {
                    description: `${npc.name}: Hello there.`,
                    clues: [],
                    speaker: npc.name,
                    speakerId: npc.id
                };
            }
        }

        // Check interactables — target interaction tiles (sprite/examine area), not collision only
        for (const obj of room.interactables) {
            const interactTiles = getInteractionTiles(obj);
            const targetOverlapsFurniture = interactTiles.some((t) => t.x === x && t.y === y);

            if (targetOverlapsFurniture) {
                const playerLeftTile = Math.floor(player.x / TILE_SIZE);
                const playerRightTile = Math.floor((player.x + player.width) / TILE_SIZE);
                const playerTopTile = Math.floor(player.y / TILE_SIZE);
                const playerBottomTile = Math.floor((player.y + player.height) / TILE_SIZE);

                const bounds = tileBounds(interactTiles);
                if (!bounds) continue;

                const horizontalAdjacent =
                    playerRightTile >= bounds.minX - 1 && playerLeftTile <= bounds.maxX + 1;
                const verticalAdjacent =
                    playerBottomTile >= bounds.minY - 1 && playerTopTile <= bounds.maxY + 1;

                if (horizontalAdjacent && verticalAdjacent) {
                    if (obj.id === "secret_bookshelf") {
                        return {
                            description: "",
                            clues: [],
                            confirmation: {
                                id: "study_secret",
                                prompt:
                                    "One volume sits loose on the shelf, almost asking to be pulled. Will you tug it free?"
                            }
                        };
                    }

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
