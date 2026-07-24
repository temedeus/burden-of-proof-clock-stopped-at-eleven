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
    doorSprite?: "door_wood" | "door_manor" | "door_glass" | "door_castle";
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
    floorTile?: "floor" | "grass" | "gravel" | "ceramic" | "rock" | "attic_wood" | "marble";
    /** Perimeter wall style (default red brick). */
    wallTile?: "brick" | "wood" | "rock" | "attic_wood" | "pale";
    /** Rows above the north wall reserved for overhead clerestory windows (wall + collision shift down). */
    northClerestoryRows?: number;
    /** How many tile rows the north wall occupies (default 1). */
    northWallThickness?: number;
    gravelPath?: GravelPathConfig;
    /** Multiple gravel paths (merged with `gravelPath` when present). */
    gravelPaths?: GravelPathConfig[];
    /** Override individual perimeter rows/columns (applied before southFenceBorder). */
    perimeterWalls?: PerimeterWallsConfig;
    /** Replace the south wall row with iron fence tiles (gate gap from gravel path). */
    southFenceBorder?: boolean;
    /** Floor under the south fence opening (default gravel for outdoor rooms). */
    southFenceOpening?: "floor" | "gravel";
    /** Guardrail style along southFenceBorder (default iron fence). */
    southFenceStyle?: "iron" | "wood";
    /** Width of the south guardrail opening in tiles (default 3; 0 = solid rail). */
    southFenceGapWidth?: number;
    furniture: FurniturePlacement[];
    exits: ExitConfig[];
    npcs?: NPCPlacement[];
}
