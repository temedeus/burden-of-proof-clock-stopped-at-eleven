import { TILE_SIZE } from "../world/constants";
import type { Interactable } from "../world/Interactable";
import type { NPC } from "../entities/NPC";
import type { TileMap } from "../world/TileMap";
import type { FootstepSurface } from "./FootstepSounds";
import {
    TILE_ATTIC_FLOOR,
    TILE_GRASS,
    TILE_GRAVEL,
    TILE_PALE_ROCK,
    TILE_ROCK,
    TILE_SAND
} from "../world/TileTypes";

type Tile = { x: number; y: number };

const FOOTSTEP_SURFACES = new Set<FootstepSurface>([
    "default",
    "glass",
    "squish",
    "grass",
    "gravel",
    "sand",
    "rock",
    "pale_rock",
    "attic_wood"
]);

function getActorTiles(x: number, y: number, width: number, height: number): Tile[] {
    const leftTile = Math.floor(x / TILE_SIZE);
    const rightTile = Math.ceil((x + width) / TILE_SIZE);
    const topTile = Math.floor(y / TILE_SIZE);
    const bottomTile = Math.ceil((y + height) / TILE_SIZE) - 1;
    const tiles: Tile[] = [];
    for (let ty = topTile; ty <= bottomTile; ty++) {
        for (let tx = leftTile; tx < rightTile; tx++) {
            tiles.push({ x: tx, y: ty });
        }
    }
    return tiles;
}

function tilesOverlap(a: Tile[], b: Tile[]): boolean {
    const occupied = new Set(b.map((t) => `${t.x},${t.y}`));
    return a.some((t) => occupied.has(`${t.x},${t.y}`));
}

function asFootstepSurface(value: string | undefined): FootstepSurface | undefined {
    if (value && FOOTSTEP_SURFACES.has(value as FootstepSurface)) {
        return value as FootstepSurface;
    }
    return undefined;
}

/** Map terrain under the player's feet to a footstep variant. */
export function surfaceFromTile(tile: number): FootstepSurface | undefined {
    switch (tile) {
        case TILE_GRASS:
            return "grass";
        case TILE_GRAVEL:
            return "gravel";
        case TILE_SAND:
            return "sand";
        case TILE_ROCK:
            return "rock";
        case TILE_PALE_ROCK:
            return "pale_rock";
        case TILE_ATTIC_FLOOR:
            return "attic_wood";
        default:
            return undefined;
    }
}

function resolveMapSurface(
    map: TileMap,
    x: number,
    y: number,
    width: number,
    height: number
): FootstepSurface | undefined {
    const feetTx = Math.floor((x + width / 2) / TILE_SIZE);
    const feetTy = Math.ceil((y + height) / TILE_SIZE) - 1;
    if (feetTx < 0 || feetTy < 0 || feetTx >= map.width || feetTy >= map.height) {
        return undefined;
    }
    return surfaceFromTile(map.getTile(feetTx, feetTy));
}

/**
 * Resolve footstep variant: walkable decor / floor NPCs first, then terrain underfoot.
 */
export function resolveFootstepSound(
    x: number,
    y: number,
    width: number,
    height: number,
    interactables: Interactable[],
    npcs: NPC[] = [],
    map?: TileMap
): FootstepSurface | undefined {
    const playerTiles = getActorTiles(x, y, width, height);

    for (const obj of interactables) {
        if (!obj.footstepSound) continue;
        const surfaceTiles = obj.footprintTiles ?? obj.tiles;
        if (tilesOverlap(playerTiles, surfaceTiles)) {
            return asFootstepSurface(obj.footstepSound);
        }
    }

    for (const npc of npcs) {
        if (!npc.walkable || !npc.footstepSound) continue;
        const npcTiles = getActorTiles(npc.x, npc.y, npc.width, npc.height);
        if (tilesOverlap(playerTiles, npcTiles)) {
            return asFootstepSurface(npc.footstepSound);
        }
    }

    if (map) {
        return resolveMapSurface(map, x, y, width, height);
    }

    return undefined;
}
