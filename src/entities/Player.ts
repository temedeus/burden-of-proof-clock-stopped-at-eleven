import { Entity } from "./Entity";
import { Input } from "../engine/Input";
import { TILE_SIZE } from "../world/constants";
import { TileMap } from "../world/TileMap";
import { NPC } from "./NPC";
import { spriteLoader } from "../assets/SpriteLoader";

export type Facing = "up" | "down" | "left" | "right";

export type PlayerSpriteName = "male_detective" | "female_detective";

export class Player extends Entity {
    speed = 180;
    width = TILE_SIZE * 2;
    height = TILE_SIZE * 2;
    facing: Facing = "down";
    private spriteName: string;

    constructor(id: string, x: number, y: number, spriteName: PlayerSpriteName = "female_detective") {
        super(id, x, y);
        this.spriteName = spriteName;
    }

    update(dt: number, input: Input, map: TileMap, npcs: NPC[] = []) {
        let dx = 0;
        let dy = 0;

        if (input.isDown("w") || input.isDown("arrowup")) dy -= 1;
        if (input.isDown("s") || input.isDown("arrowdown")) dy += 1;
        if (input.isDown("a") || input.isDown("arrowleft")) dx -= 1;
        if (input.isDown("d") || input.isDown("arrowright")) dx += 1;

        if (dx > 0) this.facing = "right";
        else if (dx < 0) this.facing = "left";
        else if (dy > 0) this.facing = "down";
        else if (dy < 0) this.facing = "up";

        const moveX = dx * this.speed * dt;
        const moveY = dy * this.speed * dt;

        // move X, then resolve collision
        this.tryMove(moveX, 0, map, npcs);

        // move Y, then resolve collision
        this.tryMove(0, moveY, map, npcs);
    }

    private tryMove(dx: number, dy: number, map: TileMap, npcs: NPC[] = []) {
        const nextX = this.x + dx;
        const nextY = this.y + dy;

        if (!this.collides(nextX, nextY, map, npcs)) {
            this.x = nextX;
            this.y = nextY;
        }
    }

    private collides(x: number, y: number, map: TileMap, npcs: NPC[] = []): boolean {
        // Use exact pixel position (same as sprite rendering)
        // Calculate all tiles the player's collision box overlaps (pixel-precise)
        // Use Math.floor for left/top (inclusive) and Math.ceil for right/bottom (exclusive)
        const leftTile = Math.floor(x / TILE_SIZE);
        const rightTile = Math.ceil((x + this.width) / TILE_SIZE);
        const topTile = Math.floor(y / TILE_SIZE);
        const bottomTile = Math.ceil((y + this.height) / TILE_SIZE);

        // Only check bottom 2 tiles (bottom row) for collision with NPCs/furniture
        // This allows player to get closer from top/left/right directions
        const bottomRow = bottomTile - 1; // Bottom row of player's 2x2 grid
        
        // Check walls for all tiles (strict collision)
        for (let ty = topTile; ty < bottomTile; ty++) {
            for (let tx = leftTile; tx < rightTile; tx++) {
                if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) {
                    return true;
                }
                const tile = map.getTile(tx, ty);
                if (tile === 1) { // TILE_WALL - strict collision
                    return true;
                }
            }
        }

        // Check furniture - only check bottom row of player's tiles
        for (let tx = leftTile; tx < rightTile; tx++) {
            if (tx < 0 || tx >= map.width || bottomRow < 0 || bottomRow >= map.height) {
                continue;
            }
            const tile = map.getTile(tx, bottomRow);
            if (tile === 2) { // TILE_FURNITURE - only bottom row checks
                return true;
            }
        }

        // Check NPCs - only check bottom row of player's tiles (pixel-based)
        // This allows player to get closer from top/left/right directions
        for (const npc of npcs) {
            // Player's bottom row spans from y + height - TILE_SIZE to y + height
            const playerBottomRowTop = y + this.height - TILE_SIZE;
            const playerBottomRowBottom = y + this.height;
            
            // NPC's bottom row spans from npc.y + npc.height - TILE_SIZE to npc.y + npc.height
            const npcBottomRowTop = npc.y + npc.height - TILE_SIZE;
            const npcBottomRowBottom = npc.y + npc.height;
            
            // Only check collision if player's bottom row overlaps with NPC's bottom row
            // This allows passing when player and NPC are at different vertical levels
            if (playerBottomRowBottom > npcBottomRowTop && playerBottomRowTop < npcBottomRowBottom) {
                // Check horizontal overlap using pixel bounds
                const playerRightX = x + this.width;
                const npcRightX = npc.x + npc.width;
                
                // Only collide if there's actual overlap (not just touching)
                if (playerRightX > npc.x && x < npcRightX) {
                    return true; // Collision detected
                }
            }
        }

        return false;
    }

    render(ctx: CanvasRenderingContext2D) {
        spriteLoader.drawSprite(ctx, this.spriteName, this.x, this.y, this.width, this.height);
    }

    getInteractionPoint(): { x: number; y: number } {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }
}
