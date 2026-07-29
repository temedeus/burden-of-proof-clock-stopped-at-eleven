import { Entity } from "./Entity";
import { Input } from "../engine/Input";
import { TILE_SIZE } from "../world/constants";
import { TileMap } from "../world/TileMap";
import { TILE_WALL, TILE_WOOD_WALL, TILE_ROCK_WALL, TILE_PALE_ROCK_WALL, TILE_MANOR_WALL, TILE_GATE_WALL, TILE_ATTIC_WALL, TILE_PALE_WALL, TILE_INVISIBLE_WALL, TILE_FURNITURE, TILE_FENCE, TILE_FENCE_POST, TILE_BANISTER, TILE_BANISTER_POST, TILE_WOOD_FENCE, TILE_WOOD_FENCE_POST, TILE_WOOD_FENCE_V } from "../world/TileTypes";
import { NPC } from "./NPC";
import { spriteLoader } from "../assets/SpriteLoader";
import type { CharacterPose } from "../assets/procedural/characters";
import { footstepSounds } from "../audio/FootstepSounds";
import { resolveFootstepSound } from "../audio/footstepSurface";
import type { Interactable } from "../world/Interactable";
import type { PlayerSpriteName } from "@cse/content-schema";
import { DEFAULT_PLAYER_SPRITE } from "@cse/content-schema";

export type { PlayerSpriteName } from "@cse/content-schema";
export type Facing = "up" | "down" | "left" | "right";

export const WALK_ANIM_FPS = 8;

export class Player extends Entity {
    speed = 180;
    width = TILE_SIZE * 2;
    height = TILE_SIZE * 2;
    facing: Facing = "down";
    isMoving = false;
    /** 0 upright … 1 fully collapsed (cutscene only). */
    cutsceneFall = 0;
    private animTime = 0;
    private spriteName: PlayerSpriteName;

    constructor(id: string, x: number, y: number, spriteName: PlayerSpriteName = DEFAULT_PLAYER_SPRITE) {
        super(id, x, y);
        this.spriteName = spriteName;
    }

    getSpriteName(): PlayerSpriteName {
        return this.spriteName;
    }

    /** Feet-tile collision check used by save restore walkability snap. */
    wouldCollideAt(x: number, y: number, map: TileMap, npcs: NPC[] = []): boolean {
        return this.collides(x, y, map, npcs);
    }

    update(dt: number, input: Input, map: TileMap, npcs: NPC[] = [], interactables: Interactable[] = []) {
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

        this.isMoving = dx !== 0 || dy !== 0;
        if (this.isMoving) {
            this.animTime += dt;
        } else {
            this.animTime = 0;
        }

        const moveX = dx * this.speed * dt;
        const moveY = dy * this.speed * dt;

        // move X, then resolve collision
        this.tryMove(moveX, 0, map, npcs);

        // move Y, then resolve collision
        this.tryMove(0, moveY, map, npcs);

        const surface = resolveFootstepSound(
            this.x,
            this.y,
            this.width,
            this.height,
            interactables,
            npcs,
            map
        );
        footstepSounds.updateWalkAnim(this.animTime, this.isMoving, surface ?? "default");
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
        const bottomTile = Math.ceil((y + this.height) / TILE_SIZE);

        // Feet-only collision for walls and furniture so the sprite can overlap tall
        // north walls / wall-mounted shelves and still interact with them.
        const bottomRow = bottomTile - 1; // Bottom row of player's 2x2 grid

        for (let tx = leftTile; tx < rightTile; tx++) {
            if (tx < 0 || tx >= map.width || bottomRow < 0 || bottomRow >= map.height) {
                return true;
            }
            const tile = map.getTile(tx, bottomRow);
            if (
                tile === TILE_WALL ||
                tile === TILE_WOOD_WALL ||
                tile === TILE_ROCK_WALL ||
                tile === TILE_PALE_ROCK_WALL ||
                tile === TILE_MANOR_WALL ||
                tile === TILE_GATE_WALL ||
                tile === TILE_ATTIC_WALL ||
                tile === TILE_PALE_WALL ||
                tile === TILE_INVISIBLE_WALL ||
                tile === TILE_FURNITURE ||
                tile === TILE_FENCE ||
                tile === TILE_FENCE_POST ||
                tile === TILE_BANISTER ||
                tile === TILE_BANISTER_POST ||
                tile === TILE_WOOD_FENCE ||
                tile === TILE_WOOD_FENCE_POST ||
                tile === TILE_WOOD_FENCE_V
            ) {
                return true;
            }
        }

        // Check NPCs — single centered foot tile (allows squeezing past diagonal pairs)
        const playerFeetTileX = Math.floor((x + this.width / 2) / TILE_SIZE);
        const playerFeetRowTop = y + this.height - TILE_SIZE;
        const playerFeetRowBottom = y + this.height;

        for (const npc of npcs) {
            if (npc.walkable) continue;
            const npcFeetTileX = Math.floor((npc.x + npc.width / 2) / TILE_SIZE);
            const npcFeetRowTop = npc.y + npc.height - TILE_SIZE;
            const npcFeetRowBottom = npc.y + npc.height;

            if (playerFeetRowBottom > npcFeetRowTop && playerFeetRowTop < npcFeetRowBottom) {
                if (playerFeetTileX === npcFeetTileX) {
                    return true;
                }
            }
        }

        return false;
    }

    /** Advance walk animation during scripted cutscene movement. */
    advanceCutsceneWalk(dt: number): void {
        this.isMoving = true;
        this.animTime += dt;
    }

    private getPose(): CharacterPose {
        if (!this.isMoving) return "idle";
        return Math.floor(this.animTime * WALK_ANIM_FPS) % 2 === 0 ? "walk_a" : "walk_b";
    }

    render(ctx: CanvasRenderingContext2D) {
        const fall = Math.max(0, Math.min(1, this.cutsceneFall));
        if (fall > 0.001) {
            const angle = fall * (Math.PI / 2);
            const pivotX = this.x + this.width / 2;
            const pivotY = this.y + this.height - 4;
            const sink = fall * this.height * 0.12;
            ctx.save();
            ctx.translate(pivotX, pivotY + sink);
            ctx.rotate(angle);
            ctx.translate(-pivotX, -pivotY);
            spriteLoader.drawCharacterFrame(
                ctx,
                this.spriteName,
                this.facing,
                this.getPose(),
                this.x,
                this.y,
                this.width,
                this.height
            );
            ctx.restore();
            return;
        }

        spriteLoader.drawCharacterFrame(
            ctx,
            this.spriteName,
            this.facing,
            this.getPose(),
            this.x,
            this.y,
            this.width,
            this.height
        );
    }

    getInteractionPoint(): { x: number; y: number } {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }
}
