export type PositionToken = number | "center" | "top" | "bottom";
export type SpawnYToken = number | "bottom-1" | "bottom-2" | "bottom-3" | "center";

export interface FurniturePlacement {
    furnitureId: string;
    x: number | "center";
    y: PositionToken;
    anchor: "top-left" | "center";
    clues?: string[];
    description?: string;
}

export interface ExitConfig {
    x: number | "center";
    y: "top" | "bottom" | "center";
    targetRoom: string;
    spawnX: number | "center";
    spawnY: SpawnYToken;
}

export interface NPCPlacement {
    npcId: string;
    x: number | "center";
    y: PositionToken;
}

export interface GravelPathConfig {
    orientation: "vertical";
    widthTiles: number;
    centerX: number | "center";
}

export interface RoomConfig {
    id: string;
    width: number;
    height: number;
    floorTile?: "floor" | "grass" | "gravel" | "ceramic" | "rock";
    gravelPath?: GravelPathConfig;
    /** Replace the south wall row with iron fence tiles (gate gap from gravel path). */
    southFenceBorder?: boolean;
    furniture: FurniturePlacement[];
    exits: ExitConfig[];
    npcs?: NPCPlacement[];
}
