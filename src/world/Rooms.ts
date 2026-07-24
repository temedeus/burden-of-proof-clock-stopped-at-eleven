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
    TILE_SAND,
    TILE_INVISIBLE_WALL,
    TILE_WALL,
    TILE_WOOD_WALL,
    TILE_ROCK_WALL,
    TILE_MANOR_WALL,
    TILE_GATE_WALL,
    TILE_CERAMIC,
    TILE_ROCK,
    TILE_ATTIC_FLOOR,
    TILE_ATTIC_WALL,
    TILE_MARBLE,
    TILE_PALE_WALL,
    TILE_BANISTER,
    TILE_BANISTER_POST,
    TILE_WOOD_FENCE,
    TILE_WOOD_FENCE_POST,
    TILE_WOOD_FENCE_V
} from "./TileTypes";
import { Interactable } from "./Interactable";
import { NPC } from "../entities/NPC";
import { loadFurnitureCatalog } from "../content/loadCatalog";
import type {
    FenceRectConfig,
    FurnitureConfig,
    FurniturePlacement,
    GravelPathConfig,
    InteractionFaceConfig,
    PerimeterWallStyle,
    PerimeterWallsConfig,
    RoomConfig,
    TerrainPatchConfig
} from "@cse/content-schema";
import { detectOilLampWallSide } from "../assets/procedural/oil_lamp";
import { inferWallAlign } from "../assets/procedural/wall_align";
import { exitSkipsDoorTiles } from "./exitDoor";
import { getCollisionTileRange, resolveDecorDrawOrigin, resolvePosition, resolveSpawnY } from "@cse/content-schema";

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
    return resolveDecorDrawOrigin(startX, startY, furniture);
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

/** How many tiles deep each auto-generated interaction face extends toward the player. */
const INTERACTION_FACE_DEPTH = 2;

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

    // Two tiles deep inward from the draw edge on the approached side.
    switch (face) {
        case "north":
            for (let d = 0; d < INTERACTION_FACE_DEPTH; d++) {
                for (let x = ix; x < ix + iw; x++) push(x, iy + d);
            }
            break;
        case "south":
            for (let d = 0; d < INTERACTION_FACE_DEPTH; d++) {
                for (let x = ix; x < ix + iw; x++) push(x, iy + ih - 1 - d);
            }
            break;
        case "west":
            for (let d = 0; d < INTERACTION_FACE_DEPTH; d++) {
                for (let y = iy; y < iy + ih; y++) push(ix + d, y);
            }
            break;
        case "east":
            for (let d = 0; d < INTERACTION_FACE_DEPTH; d++) {
                for (let y = iy; y < iy + ih; y++) push(ix + iw - 1 - d, y);
            }
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

/** Interaction tiles in front of wall-mounted objects (switches, sconces with examine). */
function buildWallMountInteractionTilesByFacing(
    anchorX: number,
    anchorY: number,
    wallSide: "north" | "south" | "east" | "west",
    roomWidth: number,
    roomHeight: number
): Partial<Record<PlayerFacing, { x: number; y: number }[]>> {
    const depth = INTERACTION_FACE_DEPTH;
    const push = (tiles: { x: number; y: number }[], x: number, y: number) => {
        if (x >= 0 && x < roomWidth && y >= 0 && y < roomHeight) {
            tiles.push({ x, y });
        }
    };

    const result: Partial<Record<PlayerFacing, { x: number; y: number }[]>> = {};

    switch (wallSide) {
        case "north": {
            const tiles: { x: number; y: number }[] = [];
            for (let d = 1; d <= depth; d++) push(tiles, anchorX, anchorY + d);
            result.up = tiles;
            break;
        }
        case "south": {
            const tiles: { x: number; y: number }[] = [];
            for (let d = 1; d <= depth; d++) push(tiles, anchorX, anchorY - d);
            result.down = tiles;
            break;
        }
        case "west": {
            const tiles: { x: number; y: number }[] = [];
            for (let d = 1; d <= depth; d++) push(tiles, anchorX + d, anchorY);
            result.left = tiles;
            break;
        }
        case "east": {
            const tiles: { x: number; y: number }[] = [];
            for (let d = 1; d <= depth; d++) push(tiles, anchorX - d, anchorY);
            result.right = tiles;
            break;
        }
    }

    return result;
}

function buildInteractionTiles(
    startX: number,
    startY: number,
    furniture: FurnitureConfig,
    roomWidth: number,
    roomHeight: number
): { x: number; y: number }[] {
    const { ix, iy, iw, ih } = getDrawTileOrigin(startX, startY, furniture);

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
        ...(furniture.drawOffsetX != null ? { drawOffsetXPx: furniture.drawOffsetX } : {}),
        ...(furniture.drawOffsetY != null ? { drawOffsetYPx: furniture.drawOffsetY } : {}),
        ...(furniture.walkableDecor ? { walkableDecor: true } : {}),
        ...(furniture.noCollision ? { noCollision: true } : {}),
        ...(furniture.overheadDecor ? { overheadDecor: true } : {}),
        ...(furniture.nonInteractive ? { nonInteractive: true } : {}),
        ...(furniture.interactionType === "confirm"
            ? {
                  interactionType: "confirm" as const,
                  confirmId: furniture.confirmId,
                  confirmPrompt: furniture.confirmPrompt,
                  ...(furniture.confirmRequiresClues?.length
                      ? { confirmRequiresClues: furniture.confirmRequiresClues }
                      : {}),
                  ...(furniture.blockedConfirmHint
                      ? { blockedConfirmHint: furniture.blockedConfirmHint }
                      : {})
              }
            : {}),
        ...(furniture.interactionSound ? { interactionSound: furniture.interactionSound } : {}),
        ...(furniture.footstepSound ? { footstepSound: furniture.footstepSound } : {}),
        ...(furniture.footstepOnlyDecor ? { footstepOnlyDecor: true } : {})
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
        const wallSide = detectOilLampWallSide(startX, startY, width, height);
        interactable.footprintTiles = [{ x: startX, y: startY }];
        interactable.tiles = [{ x: startX, y: startY }];
        interactable.wallSide = wallSide;
        if (furniture.nonInteractive) {
            interactable.interactionTiles = [];
        } else {
            const interactionTilesByFacing = buildWallMountInteractionTilesByFacing(
                startX,
                startY,
                wallSide,
                width,
                height
            );
            interactable.interactionTilesByFacing = interactionTilesByFacing;
            interactable.interactionTiles = unionInteractionTiles(interactionTilesByFacing);
        }
        return interactable;
    }

    if (furniture.walkableDecor) {
        interactable.footprintTiles = buildFootprintTiles(startX, startY, furniture, width, height);
        for (const tile of interactable.footprintTiles) {
            interactable.tiles.push(tile);
        }
        if (placement.furnitureId === "staircase") {
            const align = inferWallAlign(startY, furniture.height, height);
            if (align) interactable.wallAlign = align;
        }
        interactable.interactionTiles = furniture.nonInteractive ? [] : [...interactable.tiles];
        return interactable;
    }

    interactable.footprintTiles = buildFootprintTiles(startX, startY, furniture, width, height);

    if (furniture.noCollision || furniture.overheadDecor) {
        if (!furniture.nonInteractive && !furniture.overheadDecor) {
            interactable.tiles = interactable.footprintTiles.map((tile) => ({ ...tile }));
            interactable.interactionTiles = [...interactable.footprintTiles];
        } else {
            interactable.interactionTiles = [];
        }
        return interactable;
    }

    if (furniture.wallAlign) {
        interactable.wallAlign = furniture.wallAlign;
    } else if (placement.furnitureId === "staircase") {
        const align = inferWallAlign(startY, furniture.height, height);
        if (align) interactable.wallAlign = align;
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
        case "attic_wood":
            return TILE_ATTIC_FLOOR;
        case "marble":
            return TILE_MARBLE;
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
    const isRock = room.map.furnitureUnderlay === "rock";
    const closedTile = isRock ? TILE_ROCK_WALL : TILE_WALL;
    const openTile = isRock ? TILE_ROCK : TILE_DOOR;
    for (const dx of [exit.x - 1, exit.x, exit.x + 1]) {
        if (dx < 0 || dx >= w) continue;
        room.map.tiles[exit.y * w + dx] = open ? openTile : closedTile;
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
    gateWidthTiles: number,
    gapTile: number,
    segmentTile: number,
    postTile: number
): void {
    const bottomY = roomHeight - 1;
    const gateRadius = gateWidthTiles > 0 ? Math.floor(gateWidthTiles / 2) : -1;

    for (let x = 0; x < roomWidth; x++) {
        const idx = bottomY * roomWidth + x;
        if (gateRadius >= 0 && Math.abs(x - gateCenterX) <= gateRadius) {
            tiles[idx] = gapTile;
            continue;
        }
        tiles[idx] = x === 0 || x === roomWidth - 1 ? postTile : segmentTile;
    }
}

function getGravelPaths(config: RoomConfig): GravelPathConfig[] {
    const paths: GravelPathConfig[] = [];
    if (config.gravelPath) paths.push(config.gravelPath);
    if (config.gravelPaths) paths.push(...config.gravelPaths);
    return paths;
}

function getSouthGatePath(config: RoomConfig): GravelPathConfig | undefined {
    const paths = getGravelPaths(config);
    return paths.find((path) => path.orientation !== "horizontal") ?? paths[0];
}

function isPathBlockingTile(tile: number): boolean {
    return (
        tile === TILE_WALL ||
        tile === TILE_MANOR_WALL ||
        tile === TILE_GATE_WALL ||
        tile === TILE_INVISIBLE_WALL
    );
}

function paintGravelTile(
    tiles: number[],
    roomWidth: number,
    roomHeight: number,
    x: number,
    y: number
): void {
    if (x < 1 || x >= roomWidth - 1 || y < 1 || y >= roomHeight - 1) return;
    const idx = y * roomWidth + x;
    if (isPathBlockingTile(tiles[idx])) return;
    tiles[idx] = TILE_GRAVEL;
}

function applyGravelPath(
    tiles: number[],
    roomWidth: number,
    roomHeight: number,
    path: GravelPathConfig
): void {
    const w = path.widthTiles;

    if (path.orientation === "horizontal") {
        const cy = resolvePosition(path.centerY ?? "center", roomHeight);
        const startRow = cy - Math.floor(w / 2);
        const xStart = path.start ?? 1;
        const xEnd = path.end ?? roomWidth - 2;
        for (let x = xStart; x <= xEnd; x++) {
            for (let i = 0; i < w; i++) {
                paintGravelTile(tiles, roomWidth, roomHeight, x, startRow + i);
            }
        }
        return;
    }

    const cx = resolvePosition(path.centerX ?? "center", roomWidth);
    const startCol = cx - Math.floor(w / 2);
    const yStart = path.start ?? 1;
    const yEnd = path.end ?? roomHeight - 2;
    for (let y = yStart; y <= yEnd; y++) {
        for (let i = 0; i < w; i++) {
            paintGravelTile(tiles, roomWidth, roomHeight, startCol + i, y);
        }
    }
}

function paintTerrainTile(
    tiles: number[],
    roomWidth: number,
    roomHeight: number,
    x: number,
    y: number,
    tile: number
): void {
    if (x < 0 || x >= roomWidth || y < 1 || y >= roomHeight - 1) return;
    const idx = y * roomWidth + x;
    const current = tiles[idx];
    if (current === TILE_INVISIBLE_WALL) {
        tiles[idx] = tile;
        return;
    }
    if (isPathBlockingTile(current)) return;
    tiles[idx] = tile;
}

function applyTerrainPatch(
    tiles: number[],
    roomWidth: number,
    roomHeight: number,
    patch: TerrainPatchConfig
): void {
    const tile = patch.tile === "sand" ? TILE_SAND : TILE_GRAVEL;
    for (let y = patch.y; y < patch.y + patch.height; y++) {
        for (let x = patch.x; x < patch.x + patch.width; x++) {
            paintTerrainTile(tiles, roomWidth, roomHeight, x, y, tile);
        }
    }
}

function isFenceGateCell(rect: FenceRectConfig, x: number, y: number): boolean {
    const gate = rect.gate;
    if (!gate) return false;
    const gateW = Math.max(1, gate.widthTiles ?? 2);
    const start = gate.center - Math.floor((gateW - 1) / 2);
    const end = start + gateW - 1;
    const x0 = rect.x;
    const y0 = rect.y;
    const x1 = rect.x + rect.width - 1;
    const y1 = rect.y + rect.height - 1;
    switch (gate.side) {
        case "west":
            return x === x0 && y >= start && y <= end;
        case "east":
            return x === x1 && y >= start && y <= end;
        case "north":
            return y === y0 && x >= start && x <= end;
        case "south":
            return y === y1 && x >= start && x <= end;
    }
}

function applyFenceRect(
    tiles: number[],
    roomWidth: number,
    roomHeight: number,
    rect: FenceRectConfig
): void {
    const x0 = rect.x;
    const y0 = rect.y;
    const x1 = rect.x + rect.width - 1;
    const y1 = rect.y + rect.height - 1;
    const wood = rect.style === "wood";
    // Horizontal runs keep the landing-style wood rail; vertical runs use a thin top-down line.
    const hSeg = wood ? TILE_BANISTER : TILE_FENCE;
    const vSeg = wood ? TILE_WOOD_FENCE_V : TILE_FENCE;
    const post = wood ? TILE_BANISTER_POST : TILE_FENCE_POST;
    const open = new Set(rect.openSides ?? []);

    const paint = (x: number, y: number, tile: number) => {
        if (x < 0 || x >= roomWidth || y < 1 || y >= roomHeight - 1) return;
        if (isFenceGateCell(rect, x, y)) return;
        const current = tiles[y * roomWidth + x];
        if (isPathBlockingTile(current) && current !== TILE_INVISIBLE_WALL) return;
        tiles[y * roomWidth + x] = tile;
    };

    if (!open.has("north")) {
        for (let x = x0; x <= x1; x++) {
            const isCorner =
                (!open.has("west") && x === x0) || (!open.has("east") && x === x1);
            paint(x, y0, isCorner ? post : hSeg);
        }
    }
    if (!open.has("south")) {
        for (let x = x0; x <= x1; x++) {
            const isCorner =
                (!open.has("west") && x === x0) || (!open.has("east") && x === x1);
            paint(x, y1, isCorner ? post : hSeg);
        }
    }
    if (!open.has("west")) {
        for (let y = y0 + 1; y < y1; y++) {
            paint(x0, y, vSeg);
        }
    }
    if (!open.has("east")) {
        for (let y = y0 + 1; y < y1; y++) {
            paint(x1, y, vSeg);
        }
    }
}

/** Fence tiles store themselves in the terrain snapshot — restore sand/gravel/grass underlay. */
function restoreFenceUnderlaysFromProbe(
    tiles: number[],
    terrainBeforeFurniture: number[],
    underlayProbe: number[]
): void {
    for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];
        if (!isFenceLikeTile(tile)) continue;
        const under = underlayProbe[i];
        if (
            under === TILE_SAND ||
            under === TILE_GRAVEL ||
            under === TILE_GRASS ||
            under === TILE_FLOOR
        ) {
            terrainBeforeFurniture[i] = under;
        }
    }
}

function isFenceLikeTile(tile: number): boolean {
    return (
        tile === TILE_FENCE ||
        tile === TILE_FENCE_POST ||
        tile === TILE_BANISTER ||
        tile === TILE_BANISTER_POST ||
        tile === TILE_WOOD_FENCE ||
        tile === TILE_WOOD_FENCE_POST ||
        tile === TILE_WOOD_FENCE_V
    );
}

function wallTileForStyle(style: PerimeterWallStyle, perimeterWall: number): number {
    switch (style) {
        case "wood":
            return TILE_WOOD_WALL;
        case "rock":
            return TILE_ROCK_WALL;
        case "manor":
            return TILE_MANOR_WALL;
        case "gate_side":
            return TILE_GATE_WALL;
        case "invisible":
            return TILE_INVISIBLE_WALL;
        default:
            return perimeterWall;
    }
}

/** Re-apply collision-only perimeter after terrain/furniture so walkable floors stay blocked. */
function sealInvisiblePerimeter(
    tiles: number[],
    roomWidth: number,
    roomHeight: number,
    walls: PerimeterWallsConfig
): void {
    const sealColumn = (x: number) => {
        for (let y = 0; y < roomHeight; y++) {
            const idx = y * roomWidth + x;
            const t = tiles[idx];
            if (
                t === TILE_FURNITURE ||
                t === TILE_DOOR ||
                t === TILE_MANOR_WALL ||
                isFenceLikeTile(t)
            ) {
                continue;
            }
            tiles[idx] = TILE_INVISIBLE_WALL;
        }
    };
    if (walls.east === "invisible") sealColumn(roomWidth - 1);
    if (walls.west === "invisible") sealColumn(0);
}

function applyPerimeterWalls(
    tiles: number[],
    roomWidth: number,
    roomHeight: number,
    walls: PerimeterWallsConfig,
    perimeterWall: number
): void {
    // West/east first; north last so the manor top row spans the full width (corners included).
    if (walls.west) {
        const tile = wallTileForStyle(walls.west, perimeterWall);
        for (let y = 0; y < roomHeight; y++) tiles[y * roomWidth] = tile;
    }
    if (walls.east) {
        const tile = wallTileForStyle(walls.east, perimeterWall);
        for (let y = 0; y < roomHeight; y++) tiles[y * roomWidth + (roomWidth - 1)] = tile;
    }
    if (walls.south) {
        const tile = wallTileForStyle(walls.south, perimeterWall);
        const row = (roomHeight - 1) * roomWidth;
        for (let x = 0; x < roomWidth; x++) tiles[row + x] = tile;
    }
    if (walls.north) {
        const tile = wallTileForStyle(walls.north, perimeterWall);
        for (let x = 0; x < roomWidth; x++) tiles[x] = tile;
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
                  : config.floorTile === "attic_wood"
                    ? TILE_ATTIC_FLOOR
                    : config.floorTile === "marble"
                      ? TILE_MARBLE
                      : TILE_FLOOR;
    const perimeterWall =
        config.wallTile === "wood"
            ? TILE_WOOD_WALL
            : config.wallTile === "rock"
              ? TILE_ROCK_WALL
              : config.wallTile === "attic_wood"
                ? TILE_ATTIC_WALL
                : config.wallTile === "pale"
                  ? TILE_PALE_WALL
                  : TILE_WALL;
    const northWallRow = config.northClerestoryRows ?? 0;
    const northWallThickness = Math.max(1, config.northWallThickness ?? 1);
    const tiles = new Array(roomWidth * roomHeight).fill(baseFloor);

    for (let x = 0; x < roomWidth; x++) {
        for (let i = 0; i < northWallThickness; i++) {
            const row = northWallRow + i;
            if (row < roomHeight - 1) {
                tiles[row * roomWidth + x] = perimeterWall;
            }
        }
        tiles[(roomHeight - 1) * roomWidth + x] = perimeterWall;
    }

    for (let y = 0; y < roomHeight; y++) {
        tiles[y * roomWidth] = perimeterWall;
        tiles[y * roomWidth + (roomWidth - 1)] = perimeterWall;
    }

    if (config.perimeterWalls) {
        applyPerimeterWalls(tiles, roomWidth, roomHeight, config.perimeterWalls, perimeterWall);
    }

    const gravelPaths = getGravelPaths(config);
    for (const path of gravelPaths) {
        applyGravelPath(tiles, roomWidth, roomHeight, path);
    }

    const terrainPatches = config.terrainPatches ?? [];
    for (const patch of terrainPatches) {
        applyTerrainPatch(tiles, roomWidth, roomHeight, patch);
    }

    if (config.southFenceBorder) {
        const gatePath = getSouthGatePath(config);
        const gateCx = gatePath
            ? resolvePosition(gatePath.centerX ?? "center", roomWidth)
            : Math.floor(roomWidth / 2);
        const gateW = config.southFenceGapWidth ?? gatePath?.widthTiles ?? 3;
        const gapTile = config.southFenceOpening === "floor" ? baseFloor : TILE_GRAVEL;
        const wood = config.southFenceStyle === "wood";
        const segmentTile = wood ? TILE_BANISTER : TILE_FENCE;
        const postTile = wood ? TILE_BANISTER_POST : TILE_FENCE_POST;
        applySouthFenceBorder(tiles, roomWidth, roomHeight, gateCx, gateW, gapTile, segmentTile, postTile);
    }

    for (const rect of config.fenceRects ?? []) {
        applyFenceRect(tiles, roomWidth, roomHeight, rect);
    }

    const terrainBeforeFurniture = tiles.slice();
    // Fence tiles replaced floor cells — restore the pre-fence underlay for rendering.
    if ((config.fenceRects?.length ?? 0) > 0) {
        // Re-derive underlay from gravel + patches (fence paint wiped those cells).
        const underlayProbe = new Array(roomWidth * roomHeight).fill(baseFloor);
        for (const path of gravelPaths) {
            applyGravelPath(underlayProbe, roomWidth, roomHeight, path);
        }
        for (const patch of terrainPatches) {
            applyTerrainPatch(underlayProbe, roomWidth, roomHeight, patch);
        }
        restoreFenceUnderlaysFromProbe(tiles, terrainBeforeFurniture, underlayProbe);
    }

    if (config.southFenceBorder || gravelPaths.length > 0) {
        const gatePath = getSouthGatePath(config);
        const cx = gatePath
            ? resolvePosition(gatePath.centerX ?? "center", roomWidth)
            : Math.floor(roomWidth / 2);
        const bottomY = roomHeight - 1;
        const gateRadius =
            (config.southFenceGapWidth ?? gatePath?.widthTiles ?? 3) > 0
                ? Math.floor((config.southFenceGapWidth ?? gatePath?.widthTiles ?? 3) / 2)
                : -1;
        const gapUnderlay = config.southFenceOpening === "floor" ? baseFloor : TILE_GRAVEL;
        for (let x = 0; x < roomWidth; x++) {
            const idx = bottomY * roomWidth + x;
            if (gateRadius >= 0 && Math.abs(x - cx) <= gateRadius) {
                terrainBeforeFurniture[idx] = gapUnderlay;
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
            ...(exit.requiresUnlock ? { requiresUnlock: exit.requiresUnlock } : {}),
            ...(exit.interactionOnly ? { interactionOnly: true } : {})
        };
    });

    exits.forEach((exit) => {
        if (exit.interactionOnly) return;
        if (exitSkipsDoorTiles(interactables, exit, roomWidth, roomHeight)) return;

        const isTopOrBottom = exit.y === 0 || exit.y === roomHeight - 1;
        const isLeftOrRight = exit.x === 0 || exit.x === roomWidth - 1;

        if (isTopOrBottom) {
            const doorX1 = exit.x - 1;
            const doorX2 = exit.x;
            const doorX3 = exit.x + 1;
            const depth =
                exit.y === northWallRow || exit.y === 0 ? northWallThickness : 1;

            for (let i = 0; i < depth; i++) {
                const doorY = exit.y + i;
                if (doorY < 0 || doorY >= roomHeight) continue;
                for (const doorX of [doorX1, doorX2, doorX3]) {
                    if (doorX >= 0 && doorX < roomWidth) {
                        tiles[doorY * roomWidth + doorX] = TILE_DOOR;
                    }
                }
            }
        } else if (isLeftOrRight) {
            const doorY1 = exit.y - 1;
            const doorY2 = exit.y;
            const doorY3 = exit.y + 1;

            for (const doorY of [doorY1, doorY2, doorY3]) {
                if (doorY >= 0 && doorY < roomHeight) {
                    tiles[doorY * roomWidth + exit.x] = TILE_DOOR;
                }
            }
        } else {
            // Interior door (e.g. stable building south face)
            for (const doorX of [exit.x - 1, exit.x, exit.x + 1]) {
                if (doorX >= 0 && doorX < roomWidth) {
                    tiles[exit.y * roomWidth + doorX] = TILE_DOOR;
                }
            }
        }
    });

    if (config.perimeterWalls) {
        sealInvisiblePerimeter(tiles, roomWidth, roomHeight, config.perimeterWalls);
    }

    const npcs: NPC[] = [];

    const furnitureUnderlay: "floor" | "grass" | "gravel" | "ceramic" | "rock" | "attic_wood" | "marble" =
        config.floorTile === "grass"
            ? "grass"
            : config.floorTile === "gravel"
              ? "gravel"
              : config.floorTile === "ceramic"
                ? "ceramic"
                : config.floorTile === "rock"
                  ? "rock"
                  : config.floorTile === "attic_wood"
                    ? "attic_wood"
                    : config.floorTile === "marble"
                      ? "marble"
                      : "floor";

    return new Room(
        config.id,
        new TileMap(
            roomWidth,
            roomHeight,
            tiles,
            furnitureUnderlay,
            terrainBeforeFurniture,
            config.northWallAccent === "rose" ? "rose" : "none"
        ),
        exits,
        interactables,
        npcs,
        northWallRow,
        northWallThickness
    );
}
