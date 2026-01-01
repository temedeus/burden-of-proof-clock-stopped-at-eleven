import { TileMap } from "./TileMap";
import { Interactable } from "./Interactable";

export interface DoorExit {
    x: number;
    y: number;
    targetRoom: string;
    spawnX: number;
    spawnY: number;
}

export class Room {
    constructor(
        public id: string,
        public map: TileMap,
        public exits: DoorExit[],
        public interactables: Interactable[]
    ) {}
}
