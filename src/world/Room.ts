import { TileMap } from "./TileMap";

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
        public exits: DoorExit[]
    ) {}
}
