import {Room} from "./Room";
import {TileMap} from "./TileMap";
import {
    TILE_DOOR,
    TILE_FENCE,
    TILE_FENCE_POST,
    TILE_FLOOR,
    TILE_FURNITURE,
    TILE_GRASS,
    TILE_GRAVEL,
    TILE_WALL,
    TILE_CERAMIC,
    TILE_ROCK
} from "./TileTypes";
import {Interactable} from "./Interactable";
import {NPC} from "../entities/NPC";
import {TILE_SIZE} from "./constants";
import tableConfig from "../data/furniture/table.json";
import bookshelvesConfig from "../data/furniture/bookshelves.json";
import libraryConfig from "../data/rooms/library.json";
import hallConfig from "../data/rooms/hall.json";
import studyConfig from "../data/rooms/study.json";
import kitchenConfig from "../data/rooms/kitchen.json";
import gardenConfig from "../data/rooms/garden.json";
import courtyardConfig from "../data/rooms/courtyard.json";
import diningConfig from "../data/rooms/dining.json";
import decorationsConfig from "../data/furniture/decorations.json";
import type { FurniturePlacement, GravelPathConfig, RoomConfig } from "@cse/content-schema";
import { getCollisionTileRange } from "@cse/content-schema";

interface FurnitureConfig {
    id: string;
    name: string;
    description: string;
    width: number;
    height: number;
    clues?: string[];
    spriteName?: string;
    /** Draw size in tiles (optional; defaults to width×height). Collision uses width×height only. */
    drawWidth?: number;
    drawHeight?: number;
    /** Examine/clue area within the draw footprint; defaults to full draw size. */
    interactionWidth?: number;
    interactionHeight?: number;
    interactionOffsetX?: number;
    interactionOffsetY?: number;
    renderAnchor?: "center" | "bottom";
    /** Horizontal extent of collision rows; defaults to `width`, centered on the placement footprint. */
    collisionWidth?: number;
    /** If set, only the bottom N rows are solid; upper rows stay walkable (e.g. fountain base). */
    collisionRowsFromBottom?: number;
    /** If set, only the top N rows are solid; lower rows stay walkable (e.g. fireplace mantle). */
    collisionRowsFromTop?: number;
    /** Render only: no tile blocking (e.g. floor carpet). */
    walkableDecor?: boolean;
}

// Furniture config map
const furnitureConfigs: Record<string, FurnitureConfig> = {
    table: tableConfig as FurnitureConfig,
    bookshelves: bookshelvesConfig as FurnitureConfig,
    ...(decorationsConfig as Record<string, FurnitureConfig>)
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
    value: number | "bottom-1" | "bottom-2" | "bottom-3" | "center",
    roomHeight: number
): number {
    if (typeof value === "number") return value;
    if (value === "center") return Math.floor(roomHeight / 2) - 1;
    if (value === "bottom-1") return roomHeight - 2;
    if (value === "bottom-2") return roomHeight - 3;
    if (value === "bottom-3") return roomHeight - 4;
    return 1;
}

function buildInteractionTiles(
    startX: number,
    startY: number,
    furniture: FurnitureConfig,
    roomWidth: number,
    roomHeight: number
): { x: number; y: number }[] {
    const iw = furniture.drawWidth ?? furniture.width;
    const ih = furniture.drawHeight ?? furniture.height;

    let ix: number;
    let iy: number;
    if (furniture.renderAnchor === "bottom") {
        ix = startX + Math.floor((furniture.width - iw) / 2);
        iy = startY + furniture.height - ih;
    } else if (furniture.renderAnchor === "center") {
        ix = startX + Math.floor((furniture.width - iw) / 2);
        iy = startY + Math.floor((furniture.height - ih) / 2);
    } else {
        ix = startX;
        iy = startY;
    }

    const tiles: { x: number; y: number }[] = [];
    const interactW = furniture.interactionWidth ?? iw;
    const interactH = furniture.interactionHeight ?? ih;
    const offsetX = furniture.interactionOffsetX ?? 0;
    const offsetY = furniture.interactionOffsetY ?? 0;

    let tileStartX: number;
    let tileStartY: number;
    if (furniture.renderAnchor === "bottom") {
        tileStartX = ix + (iw - interactW) + offsetX;
        tileStartY = iy + ih - interactH + offsetY;
    } else if (furniture.renderAnchor === "center") {
        tileStartX = ix + Math.floor((iw - interactW) / 2) + offsetX;
        tileStartY = iy + Math.floor((ih - interactH) / 2) + offsetY;
    } else {
        tileStartX = ix + Math.floor((iw - interactW) / 2) + offsetX;
        tileStartY = iy + ih - interactH + offsetY;
    }

    for (let tileY = tileStartY; tileY < tileStartY + interactH; tileY++) {
        for (let tileX = tileStartX; tileX < tileStartX + interactW; tileX++) {
            if (tileX >= 0 && tileX < roomWidth && tileY >= 0 && tileY < roomHeight) {
                tiles.push({ x: tileX, y: tileY });
            }
        }
    }
    return tiles;
}

function placeFurniture(
    tiles: number[],
    width: number,
    height: number,
    furniture: FurnitureConfig,
    placement: FurniturePlacement
): Interactable {
    const interactable: Interactable = {
        id: placement.furnitureId,
        name: furniture.name,
        description: placement.description ?? furniture.description,
        tiles: [],
        clues: placement.clues !== undefined ? placement.clues : (furniture.clues || []),
        ...(furniture.spriteName ? { spriteName: furniture.spriteName } : {}),
        ...(furniture.drawWidth != null && furniture.drawHeight != null
            ? { drawWidthTiles: furniture.drawWidth, drawHeightTiles: furniture.drawHeight }
            : {}),
        ...(furniture.renderAnchor ? { renderAnchor: furniture.renderAnchor } : {}),
        ...(furniture.walkableDecor ? { walkableDecor: true } : {})
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

    if (furniture.walkableDecor) {
        for (let tileY = startY; tileY < startY + furniture.height; tileY++) {
            for (let x = 0; x < furniture.width; x++) {
                const tileX = startX + x;
                if (tileX >= 0 && tileX < width && tileY >= 0 && tileY < height) {
                    interactable.tiles.push({ x: tileX, y: tileY });
                }
            }
        }
        interactable.interactionTiles = [...interactable.tiles];
        return interactable;
    }

    const { startX: collisionStartX, endX: collisionEndX, startY: collisionStartY, endY: collisionEndY } =
        getCollisionTileRange(startX, startY, furniture);

    for (let tileY = collisionStartY; tileY < collisionEndY; tileY++) {
        for (let tileX = collisionStartX; tileX < collisionEndX; tileX++) {
            if (tileX >= 0 && tileX < width && tileY >= 0 && tileY < height) {
                tiles[tileY * width + tileX] = TILE_FURNITURE;
                interactable.tiles.push({ x: tileX, y: tileY });
            }
        }
    }

    interactable.interactionTiles = buildInteractionTiles(startX, startY, furniture, width, height);

    return interactable;
}

function applySouthFenceBorder(
    tiles: number[],
    roomWidth: number,
    roomHeight: number,
    gateCenterX: number,
    gateWidthTiles: number
): void {
    const bottomY = roomHeight - 1;
    const gateRadius = Math.floor(gateWidthTiles / 2);

    for (let x = 0; x < roomWidth; x++) {
        const idx = bottomY * roomWidth + x;
        if (Math.abs(x - gateCenterX) <= gateRadius) {
            tiles[idx] = TILE_GRAVEL;
            continue;
        }
        tiles[idx] = x === 0 || x === roomWidth - 1 ? TILE_FENCE_POST : TILE_FENCE;
    }
}

function applyGravelPath(
    tiles: number[],
    roomWidth: number,
    roomHeight: number,
    path: GravelPathConfig
): void {
    const cx = resolvePosition(path.centerX, "width", roomWidth);
    const w = path.widthTiles;
    const startCol = cx - Math.floor(w / 2);
    for (let y = 1; y < roomHeight - 1; y++) {
        for (let i = 0; i < w; i++) {
            const x = startCol + i;
            if (x < 1 || x >= roomWidth - 1) continue;
            const idx = y * roomWidth + x;
            if (tiles[idx] === TILE_WALL) continue;
            tiles[idx] = TILE_GRAVEL;
        }
    }
}

export function createRoomFromConfig(
    config: RoomConfig,
    width?: number,
    height?: number,
    allRoomConfigs?: Record<string, RoomConfig>
): Room {
    const roomWidth = width || config.width;
    const roomHeight = height || config.height;
    
    const baseFloor =
        config.floorTile === "grass"
            ? TILE_GRASS
            : config.floorTile === "gravel"
              ? TILE_GRAVEL
              : config.floorTile === "ceramic"
                ? TILE_CERAMIC
                : config.floorTile === "rock"
                  ? TILE_ROCK
                  : TILE_FLOOR;
    const tiles = new Array(roomWidth * roomHeight).fill(baseFloor);

    // Outer walls
    for (let x = 0; x < roomWidth; x++) {
        tiles[x] = TILE_WALL;
        tiles[(roomHeight - 1) * roomWidth + x] = TILE_WALL;
    }

    for (let y = 0; y < roomHeight; y++) {
        tiles[y * roomWidth] = TILE_WALL;
        tiles[y * roomWidth + (roomWidth - 1)] = TILE_WALL;
    }

    if (config.gravelPath) {
        applyGravelPath(tiles, roomWidth, roomHeight, config.gravelPath);
    }

    if (config.southFenceBorder) {
        const gateCx = config.gravelPath
            ? resolvePosition(config.gravelPath.centerX, "width", roomWidth)
            : Math.floor(roomWidth / 2);
        const gateW = config.gravelPath?.widthTiles ?? 3;
        applySouthFenceBorder(tiles, roomWidth, roomHeight, gateCx, gateW);
    }

    /** Terrain before props; used to draw grass/gravel under transparent furniture sprites */
    const terrainBeforeFurniture = tiles.slice();

    // Underlay for bottom gate / fence row (room floor under fence, gravel in gate gap)
    if (config.southFenceBorder || config.gravelPath) {
        const cx = config.gravelPath
            ? resolvePosition(config.gravelPath.centerX, "width", roomWidth)
            : Math.floor(roomWidth / 2);
        const bottomY = roomHeight - 1;
        const gateRadius = Math.floor((config.gravelPath?.widthTiles ?? 3) / 2);
        for (let x = 0; x < roomWidth; x++) {
            const idx = bottomY * roomWidth + x;
            if (Math.abs(x - cx) <= gateRadius) {
                terrainBeforeFurniture[idx] = TILE_GRAVEL;
            } else if (config.southFenceBorder) {
                terrainBeforeFurniture[idx] = baseFloor;
            }
        }
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

    // Place exits — spawn tiles are in the *target* room's coordinate space
    const exits = config.exits.map(exit => {
        const target = allRoomConfigs?.[exit.targetRoom];
        const spawnW = target?.width ?? roomWidth;
        const spawnH = target?.height ?? roomHeight;
        return {
            x: resolvePosition(exit.x, "width", roomWidth),
            y: resolvePosition(exit.y, "height", roomHeight),
            targetRoom: exit.targetRoom,
            spawnX: resolvePosition(exit.spawnX, "width", spawnW),
            spawnY: resolveSpawnY(exit.spawnY, spawnH)
        };
    });

    // Place door tiles (3 tiles wide to accommodate 2x2 player with alignment buffer)
    exits.forEach(exit => {
        // Place 3 door tiles so player has room to align and pass through
        const isTopOrBottom = exit.y === 0 || exit.y === roomHeight - 1;
        
        if (isTopOrBottom) {
            // Horizontal door (on top or bottom wall) - 3 tiles wide centered on exit.x
            const doorX1 = exit.x - 1;
            const doorX2 = exit.x;
            const doorX3 = exit.x + 1;
            
            for (const doorX of [doorX1, doorX2, doorX3]) {
                if (doorX >= 0 && doorX < roomWidth) {
                    tiles[exit.y * roomWidth + doorX] = TILE_DOOR;
                }
            }
        } else {
            // Vertical door (on left or right wall) - 3 tiles tall centered on exit.y
            const doorY1 = exit.y - 1;
            const doorY2 = exit.y;
            const doorY3 = exit.y + 1;
            
            for (const doorY of [doorY1, doorY2, doorY3]) {
                if (doorY >= 0 && doorY < roomHeight) {
                    tiles[doorY * roomWidth + exit.x] = TILE_DOOR;
                }
            }
        }
    });

    // Place NPCs - NPCs will be initialized in Game.ts with proper configs
    const npcs: NPC[] = [];

    const furnitureUnderlay: "floor" | "grass" | "gravel" | "ceramic" | "rock" =
        config.floorTile === "grass"
            ? "grass"
            : config.floorTile === "gravel"
              ? "gravel"
              : config.floorTile === "ceramic"
                ? "ceramic"
                : config.floorTile === "rock"
                  ? "rock"
                  : "floor";

    return new Room(
        config.id,
        new TileMap(roomWidth, roomHeight, tiles, furnitureUnderlay, terrainBeforeFurniture),
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

export function createStudy(width: number, height: number): Room {
    return createRoomFromConfig(studyConfig as RoomConfig, width, height);
}

export function createKitchen(width: number, height: number): Room {
    return createRoomFromConfig(kitchenConfig as RoomConfig, width, height);
}

export function createGarden(width: number, height: number): Room {
    return createRoomFromConfig(gardenConfig as RoomConfig, width, height);
}

export function createCourtyard(width: number, height: number): Room {
    return createRoomFromConfig(courtyardConfig as RoomConfig, width, height);
}

export function createDining(width: number, height: number): Room {
    return createRoomFromConfig(diningConfig as RoomConfig, width, height);
}
