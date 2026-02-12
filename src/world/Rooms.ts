import {Room} from "./Room";
import {TileMap} from "./TileMap";
import {TILE_DOOR, TILE_FLOOR, TILE_FURNITURE, TILE_WALL} from "./TileTypes";
import {Interactable} from "./Interactable";
import {NPC} from "../entities/NPC";
import {TILE_SIZE} from "./constants";
import tableConfig from "../data/furniture/table.json";
import bookshelvesConfig from "../data/furniture/bookshelves.json";
import libraryConfig from "../data/rooms/library.json";
import hallConfig from "../data/rooms/hall.json";

interface FurnitureConfig {
    id: string;
    name: string;
    description: string;
    width: number;
    height: number;
    clues?: string[];
}

interface FurniturePlacement {
    furnitureId: string;
    x: number | "center";
    y: number | "center" | "top" | "bottom";
    anchor: "top-left" | "center";
}

interface ExitConfig {
    x: number | "center";
    y: number | "top" | "bottom" | "center";
    targetRoom: string;
    spawnX: number | "center";
    spawnY: number | "bottom-1" | number;
}

interface NPCPlacement {
    npcId: string;
    x: number | "center";
    y: number | "center" | "top" | "bottom";
}

interface RoomConfig {
    id: string;
    width: number;
    height: number;
    furniture: FurniturePlacement[];
    exits: ExitConfig[];
    npcs?: NPCPlacement[];
}

// Furniture config map
const furnitureConfigs: Record<string, FurnitureConfig> = {
    table: tableConfig as FurnitureConfig,
    bookshelves: bookshelvesConfig as FurnitureConfig
};

// NPC config cache
const npcConfigs: Record<string, any> = {};

function resolvePosition(
    value: number | "center" | "top" | "bottom",
    dimension: "width" | "height",
    roomDimension: number
): number {
    if (typeof value === "number") return value;
    if (value === "center") return Math.floor(roomDimension / 2);
    if (value === "top") return 0;
    if (value === "bottom") return roomDimension - 1;
    return 0;
}

function resolveSpawnY(
    value: number | "bottom-1",
    roomHeight: number
): number {
    if (typeof value === "number") return value;
    if (value === "bottom-1") return roomHeight - 2;
    return 1;
}

function placeFurniture(
    tiles: number[],
    width: number,
    height: number,
    furniture: FurnitureConfig,
    placement: FurniturePlacement
): Interactable {
    const interactable: Interactable = {
        id: furniture.id,
        name: furniture.name,
        description: furniture.description,
        tiles: [],
        clues: furniture.clues || []
    };

    let startX: number;
    let startY: number;

    if (placement.anchor === "center") {
        startX = resolvePosition(placement.x, "width", width) - Math.floor(furniture.width / 2);
        startY = resolvePosition(placement.y, "height", height) - Math.floor(furniture.height / 2);
    } else {
        startX = resolvePosition(placement.x, "width", width);
        startY = resolvePosition(placement.y, "height", height);
    }

    for (let y = 0; y < furniture.height; y++) {
        for (let x = 0; x < furniture.width; x++) {
            const tileX = startX + x;
            const tileY = startY + y;
            
            if (tileX >= 0 && tileX < width && tileY >= 0 && tileY < height) {
                tiles[tileY * width + tileX] = TILE_FURNITURE;
                interactable.tiles.push({x: tileX, y: tileY});
            }
        }
    }

    return interactable;
}

function createRoomFromConfig(config: RoomConfig, width?: number, height?: number): Room {
    const roomWidth = width || config.width;
    const roomHeight = height || config.height;
    
    const tiles = new Array(roomWidth * roomHeight).fill(TILE_FLOOR);

    // Outer walls
    for (let x = 0; x < roomWidth; x++) {
        tiles[x] = TILE_WALL;
        tiles[(roomHeight - 1) * roomWidth + x] = TILE_WALL;
    }

    for (let y = 0; y < roomHeight; y++) {
        tiles[y * roomWidth] = TILE_WALL;
        tiles[y * roomWidth + (roomWidth - 1)] = TILE_WALL;
    }

    // Place furniture
    const interactables: Interactable[] = [];
    for (const placement of config.furniture) {
        const furnitureConfig = furnitureConfigs[placement.furnitureId];
        if (furnitureConfig) {
            const interactable = placeFurniture(tiles, roomWidth, roomHeight, furnitureConfig, placement);
            interactables.push(interactable);
        }
    }

    // Place exits
    const exits = config.exits.map(exit => ({
        x: resolvePosition(exit.x, "width", roomWidth),
        y: resolvePosition(exit.y, "height", roomHeight),
        targetRoom: exit.targetRoom,
        spawnX: resolvePosition(exit.spawnX, "width", roomWidth),
        spawnY: resolveSpawnY(exit.spawnY, roomHeight)
    }));

    // Place door tiles
    exits.forEach(exit => {
        tiles[exit.y * roomWidth + exit.x] = TILE_DOOR;
    });

    // Place NPCs - NPCs will be initialized in Game.ts with proper configs
    const npcs: NPC[] = [];

    return new Room(
        config.id,
        new TileMap(roomWidth, roomHeight, tiles),
        exits,
        interactables,
        npcs
    );
}

export function createLibrary(width: number, height: number): Room {
    return createRoomFromConfig(libraryConfig as RoomConfig, width, height);
}

export function createHall(width: number, height: number): Room {
    return createRoomFromConfig(hallConfig as RoomConfig, width, height);
}
