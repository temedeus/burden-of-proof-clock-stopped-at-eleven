import { Room } from "./Room";
import { TileMap } from "./TileMap";
import {
    TILE_DOOR,
    TILE_FENCE,
    TILE_FENCE_POST,
    TILE_FLOOR,
    TILE_FURNITURE,
    TILE_GRASS,
    TILE_GRAVEL,
    TILE_WALL,
    TILE_WOOD_WALL,
    TILE_ROCK_WALL,
    TILE_CERAMIC,
    TILE_ROCK
} from "./TileTypes";
import { Interactable } from "./Interactable";
import { NPC } from "../entities/NPC";
import { loadFurnitureCatalog } from "../content/loadCatalog";
import type { FurnitureConfig, FurniturePlacement, GravelPathConfig, InteractionFaceConfig, RoomConfig } from "@cse/content-schema";
import { detectOilLampWallSide } from "../assets/procedural/oil_lamp";
import { getCollisionTileRange, resolvePosition, resolveSpawnY } from "@cse/content-schema";

const furnitureConfigs = loadFurnitureCatalog();

type ObjectFace = "north" | "south" | "east" | "west";
type PlayerFacing = "up" | "down" | "left" | "right";

const FACE_TO_FACING: Record<ObjectFace, PlayerFacing> = {
    north: "down",
    south: "up",
    east: "left",
    west: "right"
};

function buildFootprintTiles(
    startX: number,
    startY: number,
    furniture: FurnitureConfig,
    roomWidth: number,
    roomHeight: number
): { x: number; y: number }[] {
    const tiles: { x: number; y: number }[] = [];
    for (let tileY = startY; tileY < startY + furniture.height; tileY++) {
        for (let tileX = startX; tileX < startX + furniture.width; tileX++) {
            if (tileX >= 0 && tileX < roomWidth && tileY >= 0 && tileY < roomHeight) {
                tiles.push({ x: tileX, y: tileY });
            }
        }
    }
    return tiles;
}

function getDrawTileOrigin(
    startX: number,
    startY: number,
    furniture: FurnitureConfig
): { ix: number; iy: number; iw: number; ih: number } {
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

    return { ix, iy, iw, ih };
}

function hasLegacyInteraction(furniture: FurnitureConfig): boolean {
    return (
        furniture.interactionFaces == null &&
        (furniture.interactionWidth != null ||
            furniture.interactionHeight != null ||
            furniture.interactionOffsetX != null ||
            furniture.interactionOffsetY != null)
    );
}

function buildAutoFaceStrip(
    ix: number,
    iy: number,
    iw: number,
    ih: number,
    face: ObjectFace,
    roomWidth: number,
    roomHeight: number
): { x: number; y: number }[] {
    const tiles: { x: number; y: number }[] = [];
    const push = (x: number, y: number) => {
        if (x >= 0 && x < roomWidth && y >= 0 && y < roomHeight) {
            tiles.push({ x, y });
        }
    };

    switch (face) {
        case "north":
            for (let x = ix; x < ix + iw; x++) push(x, iy);
            break;
        case "south":
            for (let x = ix; x < ix + iw; x++) push(x, iy + ih - 1);
            break;
        case "west":
            for (let y = iy; y < iy + ih; y++) push(ix, y);
            break;
        case "east":
            for (let y = iy; y < iy + ih; y++) push(ix + iw - 1, y);
            break;
    }

    return tiles;
}

function buildExplicitFaceTiles(
    ix: number,
    iy: number,
    iw: number,
    ih: number,
    face: ObjectFace,
    faceConfig: InteractionFaceConfig,
    roomWidth: number,
    roomHeight: number
): { x: number; y: number }[] {
    const faceW = faceConfig.width;
    const faceH = faceConfig.height;
    const offsetX = faceConfig.offsetX ?? 0;
    const offsetY = faceConfig.offsetY ?? 0;

    let tileStartX: number;
    let tileStartY: number;

    switch (face) {
        case "north":
            tileStartX = ix + Math.floor((iw - faceW) / 2) + offsetX;
            tileStartY = iy + offsetY;
            break;
        case "south":
            tileStartX = ix + Math.floor((iw - faceW) / 2) + offsetX;
            tileStartY = iy + ih - faceH + offsetY;
            break;
        case "west":
            tileStartX = ix + offsetX;
            tileStartY = iy + Math.floor((ih - faceH) / 2) + offsetY;
            break;
        case "east":
            tileStartX = ix + iw - faceW + offsetX;
            tileStartY = iy + Math.floor((ih - faceH) / 2) + offsetY;
            break;
    }

    const tiles: { x: number; y: number }[] = [];
    for (let tileY = tileStartY; tileY < tileStartY + faceH; tileY++) {
        for (let tileX = tileStartX; tileX < tileStartX + faceW; tileX++) {
            if (tileX >= 0 && tileX < roomWidth && tileY >= 0 && tileY < roomHeight) {
                tiles.push({ x: tileX, y: tileY });
            }
        }
    }
    return tiles;
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

function buildInteractionTilesByFacing(
    startX: number,
    startY: number,
    furniture: FurnitureConfig,
    roomWidth: number,
    roomHeight: number
): Partial<Record<PlayerFacing, { x: number; y: number }[]>> {
    const { ix, iy, iw, ih } = getDrawTileOrigin(startX, startY, furniture);
    const result: Partial<Record<PlayerFacing, { x: number; y: number }[]>> = {};
    const legacySouth = hasLegacyInteraction(furniture)
        ? buildInteractionTiles(startX, startY, furniture, roomWidth, roomHeight)
        : null;

    const faces: ObjectFace[] = ["north", "south", "east", "west"];
    for (const face of faces) {
        const facing = FACE_TO_FACING[face];
        const faceConfig = furniture.interactionFaces?.[face];
        let tiles: { x: number; y: number }[];

        if (faceConfig) {
            tiles = buildExplicitFaceTiles(ix, iy, iw, ih, face, faceConfig, roomWidth, roomHeight);
        } else if (face === "south" && legacySouth && legacySouth.length > 0) {
            tiles = legacySouth;
        } else {
            tiles = buildAutoFaceStrip(ix, iy, iw, ih, face, roomWidth, roomHeight);
        }

        result[facing] = tiles;
    }

    return result;
}

function unionInteractionTiles(
    byFacing: Partial<Record<PlayerFacing, { x: number; y: number }[]>>
): { x: number; y: number }[] {
    const seen = new Set<string>();
    const tiles: { x: number; y: number }[] = [];
    for (const facingTiles of Object.values(byFacing)) {
        if (!facingTiles) continue;
        for (const tile of facingTiles) {
            const key = `${tile.x},${tile.y}`;
            if (!seen.has(key)) {
                seen.add(key);
                tiles.push(tile);
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
        ...(furniture.walkableDecor ? { walkableDecor: true } : {}),
        ...(furniture.nonInteractive ? { nonInteractive: true } : {}),
        ...(furniture.interactionType === "confirm"
            ? {
                  interactionType: "confirm" as const,
                  confirmId: furniture.confirmId,
                  confirmPrompt: furniture.confirmPrompt
              }
            : {})
    };

    let startX: number;
    let startY: number;

    if (placement.anchor === "center") {
        startX = resolvePosition(placement.x, width) - Math.floor(furniture.width / 2);
        startY = resolvePosition(placement.y, height) - Math.floor(furniture.height / 2);
    } else {
        startX = resolvePosition(placement.x, width);
        startY = resolvePosition(placement.y, height);
    }

    if (furniture.wallMount) {
        interactable.footprintTiles = [{ x: startX, y: startY }];
        interactable.tiles = [{ x: startX, y: startY }];
        interactable.wallSide = detectOilLampWallSide(startX, startY, width, height);
        interactable.interactionTiles = [];
        return interactable;
    }

    if (furniture.walkableDecor) {
        interactable.footprintTiles = buildFootprintTiles(startX, startY, furniture, width, height);
        for (const tile of interactable.footprintTiles) {
            interactable.tiles.push(tile);
        }
        interactable.interactionTiles = furniture.nonInteractive ? [] : [...interactable.tiles];
        return interactable;
    }

    interactable.footprintTiles = buildFootprintTiles(startX, startY, furniture, width, height);

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

    const interactionTilesByFacing = buildInteractionTilesByFacing(
        startX,
        startY,
        furniture,
        width,
        height
    );
    interactable.interactionTilesByFacing = interactionTilesByFacing;
    interactable.interactionTiles = unionInteractionTiles(interactionTilesByFacing);

    return interactable;
}

function floorTileForUnderlay(underlay: TileMap["furnitureUnderlay"]): number {
    switch (underlay) {
        case "grass":
            return TILE_GRASS;
        case "gravel":
            return TILE_GRAVEL;
        case "ceramic":
            return TILE_CERAMIC;
        case "rock":
            return TILE_ROCK;
        default:
            return TILE_FLOOR;
    }
}

export function setHiddenExitDoorOpen(
    room: Room,
    open: boolean,
    targetRoomId = "hidden_room"
): void {
    const exit = room.exits.find((e) => e.targetRoom === targetRoomId);
    if (!exit) return;
    const w = room.map.width;
    for (const dx of [exit.x - 1, exit.x, exit.x + 1]) {
        if (dx < 0 || dx >= w) continue;
        room.map.tiles[exit.y * w + dx] = open ? TILE_DOOR : TILE_WALL;
    }
}

export function removeInteractableById(room: Room, interactableId: string): void {
    const idx = room.interactables.findIndex((i) => i.id === interactableId);
    if (idx < 0) return;
    const obj = room.interactables[idx];
    const floor = floorTileForUnderlay(room.map.furnitureUnderlay);
    for (const t of obj.tiles) {
        room.map.tiles[t.y * room.map.width + t.x] = floor;
    }
    room.interactables.splice(idx, 1);
}

export function addFurnitureToRoom(room: Room, placement: FurniturePlacement): void {
    const furnitureConfig = furnitureConfigs[placement.furnitureId];
    if (!furnitureConfig) return;
    const interactable = placeFurniture(
        room.map.tiles,
        room.map.width,
        room.map.height,
        furnitureConfig,
        placement
    );
    room.interactables.push(interactable);
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
    const cx = resolvePosition(path.centerX, roomWidth);
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
    const perimeterWall =
        config.wallTile === "wood"
            ? TILE_WOOD_WALL
            : config.wallTile === "rock"
              ? TILE_ROCK_WALL
              : TILE_WALL;
    const tiles = new Array(roomWidth * roomHeight).fill(baseFloor);

    for (let x = 0; x < roomWidth; x++) {
        tiles[x] = perimeterWall;
        tiles[(roomHeight - 1) * roomWidth + x] = perimeterWall;
    }

    for (let y = 0; y < roomHeight; y++) {
        tiles[y * roomWidth] = perimeterWall;
        tiles[y * roomWidth + (roomWidth - 1)] = perimeterWall;
    }

    if (config.gravelPath) {
        applyGravelPath(tiles, roomWidth, roomHeight, config.gravelPath);
    }

    if (config.southFenceBorder) {
        const gateCx = config.gravelPath
            ? resolvePosition(config.gravelPath.centerX, roomWidth)
            : Math.floor(roomWidth / 2);
        const gateW = config.gravelPath?.widthTiles ?? 3;
        applySouthFenceBorder(tiles, roomWidth, roomHeight, gateCx, gateW);
    }

    const terrainBeforeFurniture = tiles.slice();

    if (config.southFenceBorder || config.gravelPath) {
        const cx = config.gravelPath
            ? resolvePosition(config.gravelPath.centerX, roomWidth)
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

    const interactables: Interactable[] = [];
    for (const placement of config.furniture) {
        const furnitureConfig = furnitureConfigs[placement.furnitureId];
        if (furnitureConfig) {
            const interactable = placeFurniture(tiles, roomWidth, roomHeight, furnitureConfig, placement);
            interactables.push(interactable);
        }
    }

    const exits = config.exits.map((exit) => {
        const target = allRoomConfigs?.[exit.targetRoom];
        const spawnW = target?.width ?? roomWidth;
        const spawnH = target?.height ?? roomHeight;
        return {
            x: resolvePosition(exit.x, roomWidth),
            y: resolvePosition(exit.y, roomHeight),
            targetRoom: exit.targetRoom,
            spawnX: resolvePosition(exit.spawnX, spawnW),
            spawnY: resolveSpawnY(exit.spawnY, spawnH),
            ...(exit.skipDoorSprite ? { skipDoorSprite: true } : {}),
            ...(exit.doorSprite ? { doorSprite: exit.doorSprite } : {}),
            ...(exit.requiresUnlock ? { requiresUnlock: exit.requiresUnlock } : {})
        };
    });

    exits.forEach((exit) => {
        const isTopOrBottom = exit.y === 0 || exit.y === roomHeight - 1;

        if (isTopOrBottom) {
            const doorX1 = exit.x - 1;
            const doorX2 = exit.x;
            const doorX3 = exit.x + 1;

            for (const doorX of [doorX1, doorX2, doorX3]) {
                if (doorX >= 0 && doorX < roomWidth) {
                    tiles[exit.y * roomWidth + doorX] = TILE_DOOR;
                }
            }
        } else {
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
