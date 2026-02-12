import { TILE_SIZE } from "./constants";
import {
    TILE_WALL,
    TILE_FURNITURE,
    TILE_DOOR
} from "./TileTypes";
import { NPC } from "../entities/NPC";

export class TileMap {
    constructor(
        public width: number,
        public height: number,
        public tiles: number[]
    ) {}

    isBlocked(tx: number, ty: number, npcs: NPC[] = []): boolean {
        if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) {
            return true;
        }

        const tile = this.tiles[ty * this.width + tx];
        if (tile === TILE_WALL || tile === TILE_FURNITURE) {
            return true;
        }

        // Check if any NPC occupies this tile
        for (const npc of npcs) {
            const npcLeftTile = Math.floor(npc.x / TILE_SIZE);
            const npcRightTile = Math.floor((npc.x + npc.width) / TILE_SIZE);
            const npcTopTile = Math.floor(npc.y / TILE_SIZE);
            const npcBottomTile = Math.floor((npc.y + npc.height) / TILE_SIZE);

            // Check if the given tile coordinates overlap with NPC's tile bounds
            if (
                tx >= npcLeftTile &&
                tx <= npcRightTile &&
                ty >= npcTopTile &&
                ty <= npcBottomTile
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

    render(ctx: CanvasRenderingContext2D) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.tiles[y * this.width + x];

                if (tile === TILE_DOOR) {
                    ctx.fillStyle = "#886644"; // wooden door
                } else if (tile === TILE_WALL) {
                    ctx.fillStyle = "#555";
                } else if (tile === TILE_FURNITURE) {
                    ctx.fillStyle = "#3a2f28";
                } else {
                    continue;
                }

                ctx.fillRect(
                    x * TILE_SIZE,
                    y * TILE_SIZE,
                    TILE_SIZE,
                    TILE_SIZE
                );
            }
        }
    }
}
