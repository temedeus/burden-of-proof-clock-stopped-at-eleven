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
    y: PositionToken;
    targetRoom: string;
    spawnX: number | "center";
    spawnY: SpawnYToken;
    /** When true, no door sprite is drawn (hidden passages, staircases). */
    skipDoorSprite?: boolean;
    /** Door sprite override (default `door`; stable uses `door_wood`). */
    doorSprite?: "door_wood";
    /** Exit is blocked until the named unlock id is satisfied (e.g. `study_secret`). */
    requiresUnlock?: string;
    /** When true, the exit only triggers after a confirm interaction (no walk-through). */
    interactionOnly?: boolean;
}

export interface NPCPlacement {
    npcId: string;
    x: number | "center";
    y: PositionToken;
}

export interface GravelPathConfig {
    orientation: "vertical" | "horizontal";
    widthTiles: number;
    /** Vertical paths: column center. */
    centerX?: number | "center";
    /** Horizontal paths: row center. */
    centerY?: number | "center";
    /** Interior start along the path axis (row for vertical, column for horizontal). */
    start?: number;
    /** Interior end along the path axis (inclusive). */
    end?: number;
}

export type PerimeterWallStyle = "brick" | "wood" | "rock" | "manor" | "gate_side";

export interface PerimeterWallsConfig {
    north?: PerimeterWallStyle;
    south?: PerimeterWallStyle;
    east?: PerimeterWallStyle;
    west?: PerimeterWallStyle;
}

export interface RoomConfig {
    id: string;
    width: number;
    height: number;
    floorTile?: "floor" | "grass" | "gravel" | "ceramic" | "rock";
    /** Perimeter wall style (default red brick). */
    wallTile?: "brick" | "wood" | "rock";
    gravelPath?: GravelPathConfig;
    /** Multiple gravel paths (merged with `gravelPath` when present). */
    gravelPaths?: GravelPathConfig[];
    /** Override individual perimeter rows/columns (applied before southFenceBorder). */
    perimeterWalls?: PerimeterWallsConfig;
    /** Replace the south wall row with iron fence tiles (gate gap from gravel path). */
    southFenceBorder?: boolean;
    furniture: FurniturePlacement[];
    exits: ExitConfig[];
    npcs?: NPCPlacement[];
}
