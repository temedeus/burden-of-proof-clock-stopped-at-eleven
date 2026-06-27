import { TILE_SIZE } from "./constants";
import {
    TILE_WALL,
    TILE_WOOD_WALL,
    TILE_ROCK_WALL,
    TILE_FURNITURE,
    TILE_DOOR,
    TILE_FLOOR,
    TILE_GRASS,
    TILE_GRAVEL,
    TILE_FENCE,
    TILE_FENCE_POST,
    TILE_CERAMIC,
    TILE_ROCK
} from "./TileTypes";
import { NPC } from "../entities/NPC";
import { renderTileMap } from "../render/tileMapRender";

export class TileMap {
    constructor(
        public width: number,
        public height: number,
        public tiles: number[],
        /** Fallback when `terrainBeforeFurniture` is absent (interior rooms use parquet `floor`) */
        public furnitureUnderlay: "floor" | "grass" | "gravel" | "ceramic" | "rock" = "floor",
        /** Snapshot of terrain before furniture was placed; transparent props show grass/gravel/floor per cell */
        public terrainBeforeFurniture: number[] | null = null
    ) {}

    isBlocked(tx: number, ty: number, npcs: NPC[] = []): boolean {
        if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) {
            return true;
        }

        const tile = this.tiles[ty * this.width + tx];
        if (
            tile === TILE_WALL ||
            tile === TILE_WOOD_WALL ||
            tile === TILE_ROCK_WALL ||
            tile === TILE_FURNITURE ||
            tile === TILE_FENCE ||
            tile === TILE_FENCE_POST
        ) {
            return true;
        }

        for (const npc of npcs) {
            const npcLeftTile = Math.floor(npc.x / TILE_SIZE);
            const npcRightTile = Math.floor((npc.x + npc.width) / TILE_SIZE);
            const npcTopTile = Math.floor(npc.y / TILE_SIZE);
            const npcBottomTile = Math.floor((npc.y + npc.height) / TILE_SIZE);

            if (
                tx >= npcLeftTile &&
                tx < npcRightTile &&
                ty >= npcTopTile &&
                ty < npcBottomTile
            ) {
                return true;
            }
        }

        return false;
    }

    getTile(tx: number, ty: number): number {
        if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) {
            return -1;
        }
        return this.tiles[ty * this.width + tx];
    }

    render(ctx: CanvasRenderingContext2D): void {
        renderTileMap(ctx, this);
    }
}
