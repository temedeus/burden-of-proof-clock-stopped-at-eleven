import type { CollectibleClue } from "../world/Interactable";
import { Player } from "../entities/Player";
import { Room } from "../world/Room";
import { TILE_SIZE } from "../world/constants";
import { getInteractionTilesForFacing, tileBounds } from "../world/interactableTiles";
import {
    DEFAULT_BLOCKED_CLUE_HINT,
    DEFAULT_EXHAUSTED_CLUE_HINT,
    mergeRequiredClueIds
} from "@cse/content-schema";
import { ClueSystem } from "./ClueSystem";
import { DialogSystem } from "./DialogSystem";
import { NPC } from "../entities/NPC";
import type { NPCConfig } from "@cse/content-schema";

export interface InteractionResult {
    description: string;
    clues: string[];
    speaker?: string; // NPC name if talking to NPC
    speakerId?: string; // NPC id (e.g. "cook") for game logic
    confirmation?: { id: string; prompt: string };
    interactionSound?: string;
}

export class InteractionSystem {
    private dialogSystem: DialogSystem;

    constructor(private clueSystem: ClueSystem) {
        this.dialogSystem = new DialogSystem(clueSystem);
    }

    interact(
        player: Player,
        room: Room,
        npcDialogs?: Record<string, any>,
        npcConfigs?: Record<string, NPCConfig>
    ): InteractionResult | null {
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
                const npcConfig = npcConfigs?.[npc.id];
                const interactionMode = npcConfig?.interactionMode ?? "dialog";
                if (npcDialogs && npcDialogs[npc.id]) {
                    const dialogConfig = npcDialogs[npc.id];
                    const dialog = this.dialogSystem.getDialog(dialogConfig);
                    if (interactionMode === "examine") {
                        const clues: string[] = [];
                        const examineClueId = npcConfig?.examineClueId;
                        if (examineClueId && !this.clueSystem.hasClue(examineClueId)) {
                            this.clueSystem.addClue(examineClueId);
                            clues.push(examineClueId);
                        }
                        return {
                            description: dialog,
                            clues
                        };
                    }
                    const clues: string[] = [];
                    const dialogClueId = npcConfig?.dialogClueId;
                    if (dialogClueId && !this.clueSystem.hasClue(dialogClueId)) {
                        const gateIds = mergeRequiredClueIds(undefined, dialogConfig.requiresClues);
                        if (gateIds.length === 0 || this.clueSystem.hasAllPrerequisites(gateIds)) {
                            this.clueSystem.addClue(dialogClueId);
                            clues.push(dialogClueId);
                        }
                    }
                    return {
                        description: `${npc.name}: ${dialog}`,
                        clues,
                        speaker: npc.name,
                        speakerId: npc.id
                    };
                }
                if (interactionMode === "examine") {
                    return {
                        description: "There is nothing more to learn here.",
                        clues: []
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

        // Check interactables — target facing-specific interaction tiles
        for (const obj of room.interactables) {
            if (obj.nonInteractive) continue;
            const interactTiles = getInteractionTilesForFacing(obj, player.facing);
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
                    if (obj.interactionType === "confirm" && obj.confirmId && obj.confirmPrompt) {
                        if (
                            obj.confirmGrantsClueId &&
                            this.clueSystem.hasClue(obj.confirmGrantsClueId)
                        ) {
                            const collectibleResult = this.collectEligibleClues(obj);
                            if (collectibleResult) {
                                return {
                                    ...collectibleResult,
                                    ...(obj.interactionSound ? { interactionSound: obj.interactionSound } : {})
                                };
                            }
                            return {
                                description: this.exhaustedOrFallbackDescription(obj),
                                clues: [],
                                ...(obj.interactionSound ? { interactionSound: obj.interactionSound } : {})
                            };
                        }
                        if (
                            obj.confirmRequiresClues?.length &&
                            !this.clueSystem.hasAllPrerequisites(obj.confirmRequiresClues)
                        ) {
                            return {
                                description:
                                    obj.blockedConfirmHint ?? DEFAULT_BLOCKED_CLUE_HINT,
                                clues: [],
                                ...(obj.interactionSound ? { interactionSound: obj.interactionSound } : {})
                            };
                        }
                        return {
                            description: "",
                            clues: [],
                            confirmation: {
                                id: obj.confirmId,
                                prompt: obj.confirmPrompt
                            }
                        };
                    }

                    const collectibleResult = this.collectEligibleClues(obj);
                    if (collectibleResult) {
                        return {
                            ...collectibleResult,
                            ...(obj.interactionSound ? { interactionSound: obj.interactionSound } : {})
                        };
                    }

                    return {
                        description: this.exhaustedOrFallbackDescription(obj),
                        clues: [],
                        ...(obj.interactionSound ? { interactionSound: obj.interactionSound } : {})
                    };
                }
            }
        }

        return null;
    }

    private collectEligibleClues(obj: {
        collectibleClues?: CollectibleClue[];
        clues?: string[];
        description: string;
    }): InteractionResult | null {
        const collectibleEntries = this.getCollectibleEntries(obj);
        const pending = collectibleEntries.filter((entry) => !this.clueSystem.hasClue(entry.clueId));
        if (pending.length === 0) return null;

        const eligible = pending.filter((entry) =>
            this.clueSystem.hasAllPrerequisites(entry.requiresClues)
        );
        if (eligible.length === 0) {
            return {
                description: pending[0].blockedHint,
                clues: []
            };
        }

        for (const entry of eligible) {
            this.clueSystem.addClue(entry.clueId);
        }
        return {
            description: eligible.map((entry) => entry.hint).join("\n\n"),
            clues: eligible.map((entry) => entry.clueId)
        };
    }

    private getCollectibleEntries(obj: {
        collectibleClues?: CollectibleClue[];
        clues?: string[];
        description: string;
    }): CollectibleClue[] {
        if (obj.collectibleClues && obj.collectibleClues.length > 0) {
            return obj.collectibleClues;
        }
        return (obj.clues ?? []).map((clueId) => ({
            clueId,
            requiresClues: [],
            blockedHint: DEFAULT_BLOCKED_CLUE_HINT,
            hint: obj.description
        }));
    }

    /** After all clues on an object are collected, stop repeating the discovery hint. */
    private exhaustedOrFallbackDescription(obj: {
        collectibleClues?: CollectibleClue[];
        clues?: string[];
        description: string;
        confirmGrantsClueId?: string;
    }): string {
        const entries = this.getCollectibleEntries(obj);
        if (entries.length > 0) {
            const allFound = entries.every((entry) => this.clueSystem.hasClue(entry.clueId));
            if (allFound) return DEFAULT_EXHAUSTED_CLUE_HINT;
        }
        if (
            obj.confirmGrantsClueId &&
            this.clueSystem.hasClue(obj.confirmGrantsClueId)
        ) {
            return DEFAULT_EXHAUSTED_CLUE_HINT;
        }
        return obj.description;
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
