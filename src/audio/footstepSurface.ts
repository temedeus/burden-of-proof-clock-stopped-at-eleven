import { TILE_SIZE } from "../world/constants";
import type { Interactable } from "../world/Interactable";
import type { NPC } from "../entities/NPC";
import type { FootstepSurface } from "./FootstepSounds";

type Tile = { x: number; y: number };

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
    if (value === "glass" || value === "squish") return value;
    return undefined;
}

/** Resolve footstep variant from walkable decor or floor NPCs under the player. */
export function resolveFootstepSound(
    x: number,
    y: number,
    width: number,
    height: number,
    interactables: Interactable[],
    npcs: NPC[] = []
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

    return undefined;
}
