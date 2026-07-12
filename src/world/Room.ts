import { TileMap } from "./TileMap";
import { Interactable } from "./Interactable";
import { NPC } from "../entities/NPC";

export interface DoorExit {
    x: number;
    y: number;
    targetRoom: string;
    spawnX: number;
    spawnY: number;
    skipDoorSprite?: boolean;
    doorSprite?: "door_wood" | "door_manor";
    requiresUnlock?: string;
    interactionOnly?: boolean;
}

export class Room {
    constructor(
        public id: string,
        public map: TileMap,
        public exits: DoorExit[],
        public interactables: Interactable[],
        public npcs: NPC[] = [],
        /** Rows above the north wall used for overhead clerestory art (collision wall sits below). */
        public northClerestoryRows = 0
    ) {}
}
