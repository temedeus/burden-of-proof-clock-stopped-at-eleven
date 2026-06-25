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
    requiresUnlock?: string;
}

export class Room {
    constructor(
        public id: string,
        public map: TileMap,
        public exits: DoorExit[],
        public interactables: Interactable[],
        public npcs: NPC[] = []
    ) {}
}
