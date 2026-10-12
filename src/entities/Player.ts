import { Entity } from "./Entity";
import { Input } from "../engine/Input";
import { TILE_SIZE } from "../world/constants";
import { TileMap } from "../world/TileMap";
import { TILE_WALL, TILE_WOOD_WALL, TILE_ROCK_WALL, TILE_PALE_ROCK_WALL, TILE_MANOR_WALL, TILE_GATE_WALL, TILE_ATTIC_WALL, TILE_PALE_WALL, TILE_INVISIBLE_WALL, TILE_FURNITURE, TILE_FENCE, TILE_FENCE_POST, TILE_BANISTER, TILE_BANISTER_POST, TILE_WOOD_FENCE, TILE_WOOD_FENCE_POST, TILE_WOOD_FENCE_V } from "../world/TileTypes";
import { NPC } from "./NPC";
import { spriteLoader } from "../assets/SpriteLoader";
import type { CharacterPose } from "../assets/procedural/characters";
import { HUMANOID_NATIVE_H, HUMANOID_NATIVE_W } from "../assets/procedural/characterAnimation";
import { P } from "../assets/procedural/palette";
import { shade } from "../assets/procedural/pixel";
import { footstepSounds } from "../audio/FootstepSounds";
import { resolveFootstepSound } from "../audio/footstepSurface";
import type { Interactable } from "../world/Interactable";
import type { PlayerSpriteName } from "@cse/content-schema";
import { DEFAULT_PLAYER_SPRITE } from "@cse/content-schema";

export type { PlayerSpriteName } from "@cse/content-schema";
export type Facing = "up" | "down" | "left" | "right";

export const WALK_ANIM_FPS = 8;

/** Moose-lick reaction timeline (seconds after turning to camera): grimace, then wipe. */
const WIPE_START = 0.6;
const WIPE_END = 2.0;
export const MOOSE_FACE_DURATION = WIPE_END + 0.4;

/** Native-pixel head row and screen-right arm of each detective's front idle frame (see characters.ts). */
const WIPE_GEOMETRY: Record<PlayerSpriteName, { headY: number; armX: number; armTop: number; armLen: number }> = {
    female_detective: { headY: 3, armX: 21, armTop: 12, armLen: 8 },
    male_detective: { headY: 2, armX: 22, armTop: 11, armLen: 9 }
};

function hexRgb(color: string): number {
    return parseInt(color.slice(1, 7), 16);
}

/** Exact colours of the hanging front arm (sleeve shades + hand) so it can be erased from the frame. */
const ARM_COLORS = new Set(
    [P.coatNavy, shade(P.coatNavy, 0.15), shade(P.coatNavy, -0.3), P.skin, shade(P.skin, -0.22)].map(hexRgb)
);

export class Player extends Entity {
    speed = 180;
    width = TILE_SIZE * 2;
    height = TILE_SIZE * 2;
    facing: Facing = "down";
    isMoving = false;
    /** 0 upright … 1 fully collapsed (cutscene only). */
    cutsceneFall = 0;
    /** Scripted hop height in px (sprite lifts, feet box stays put). */
    hopPx = 0;
    /** Seconds into the post-lick grimace (facing down); null when inactive. */
    mooseLickT: number | null = null;
    private wipeCanvas: HTMLCanvasElement | null = null;
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
        const frame = Math.floor(this.animTime * WALK_ANIM_FPS) % 4;
        switch (frame) {
            case 0: return "walk_a";
            case 1: return "walk_b";
            case 2: return "walk_c";
            case 3: return "walk_d";
            default: return "walk_a";
        }
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
            this.drawFrame(ctx);
            ctx.restore();
            return;
        }

        if (this.mooseLickT !== null) {
            this.drawMooseLickFrame(ctx, this.mooseLickT);
            return;
        }
        this.drawFrame(ctx);
    }

    /** Native-pixel point on the face (side view, facing right) in world px; `fy` is rows below the head top. */
    getFacePoint(fy: number): { x: number; y: number } {
        const scale = this.width / HUMANOID_NATIVE_W;
        const top = this.y + this.height - HUMANOID_NATIVE_H * scale;
        return { x: this.x + 19 * scale, y: top + (WIPE_GEOMETRY[this.spriteName].headY + fy) * scale };
    }

    /**
     * Front idle frame with a disgusted grimace and drool; during the wipe the hanging
     * right arm is erased and redrawn raised, hand sweeping across the face.
     */
    private drawMooseLickFrame(ctx: CanvasRenderingContext2D, t: number): void {
        const w = HUMANOID_NATIVE_W;
        const h = HUMANOID_NATIVE_H;
        if (!this.wipeCanvas) {
            this.wipeCanvas = document.createElement("canvas");
            this.wipeCanvas.width = w;
            this.wipeCanvas.height = h;
        }
        const c = this.wipeCanvas.getContext("2d")!;
        c.clearRect(0, 0, w, h);
        spriteLoader.drawCharacterFrame(c, this.spriteName, "down", "idle", 0, 0, w, h);

        const g = WIPE_GEOMETRY[this.spriteName];
        const hy = g.headY;
        const px = (x: number, y: number, pw: number, ph: number, color: string) => {
            c.fillStyle = color;
            c.fillRect(x, y, pw, ph);
        };
        const sleeve = P.coatNavy;
        const sleeveDark = shade(P.coatNavy, -0.3);
        const skin = P.skin;
        const skinShadow = shade(P.skin, -0.22);
        const drool = "#cfe8c4";
        const droolHi = "#f2fff0";

        // Disgust face: squeezed eyes, furrowed brows, wobbly frown (head is x 12..20)
        px(12, hy + 3, 3, 1, "#2a1a1a");
        px(17, hy + 3, 3, 1, "#2a1a1a");
        px(12, hy + 2, 3, 1, "#5a3a2a");
        px(17, hy + 2, 3, 1, "#5a3a2a");
        px(14, hy + 6, 4, 1, "#7a2a2a");
        px(13, hy + 7, 1, 1, "#7a2a2a");
        px(18, hy + 7, 1, 1, "#7a2a2a");

        const wiping = t >= WIPE_START && t < WIPE_END;
        const wp = wiping ? (t - WIPE_START) / (WIPE_END - WIPE_START) : 0;
        // Drool smear on the licked cheek, wiped away progressively
        if (t < WIPE_END) {
            if (wp < 0.75) px(17, hy + 1, 3, 2, drool);
            if (wp < 0.75) px(18, hy + 1, 1, 1, droolHi);
            if (wp < 0.5) px(18, hy + 3, 2, 4, drool);
            if (wp < 0.25) px(19, hy + 7, 1, 2, drool);
        }

        if (wiping) {
            // Erase the hanging arm (sleeve + hand pixels only, never the body)
            const ax = g.armX;
            const aw = 5;
            const ay = g.armTop;
            const ah = g.armLen + 4;
            const img = c.getImageData(ax, ay, aw, ah);
            for (let i = 0; i < img.data.length; i += 4) {
                const rgb = (img.data[i] << 16) | (img.data[i + 1] << 8) | img.data[i + 2];
                if (img.data[i + 3] > 0 && ARM_COLORS.has(rgb)) img.data[i + 3] = 0;
            }
            c.putImageData(img, ax, ay);

            // Raised arm: shoulder → wrist at the face, hand sweeping across
            const sweep = Math.sin(wp * Math.PI * 4);
            const handX = 15 + Math.round(sweep * 3);
            const handY = hy + 3;
            const shoulderX = g.armX + 1;
            const shoulderY = g.armTop + 1;
            const wristX = handX + 2;
            const wristY = handY + 3;
            const steps = Math.max(Math.abs(wristX - shoulderX), Math.abs(wristY - shoulderY), 1);
            for (let i = 0; i <= steps; i++) {
                const f = i / steps;
                const x = Math.round(shoulderX + (wristX - shoulderX) * f);
                const y = Math.round(shoulderY + (wristY - shoulderY) * f);
                px(x - 1, y - 1, 3, 3, sleeveDark);
            }
            for (let i = 0; i <= steps; i++) {
                const f = i / steps;
                const x = Math.round(shoulderX + (wristX - shoulderX) * f);
                const y = Math.round(shoulderY + (wristY - shoulderY) * f);
                px(x - 1, y - 1, 2, 2, sleeve);
            }
            // Hand palm-in over the face
            px(handX - 1, handY, 4, 3, skin);
            px(handX - 1, handY + 2, 4, 1, skinShadow);
            px(handX + 3, handY + 1, 1, 1, skin);
            // Flung drool flecks
            px(handX + (sweep > 0 ? 5 : -3), handY + 1, 1, 1, drool);
        }

        const scale = this.width / w;
        const drawHeight = h * scale;
        const prevSmoothing = ctx.imageSmoothingEnabled;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
            this.wipeCanvas,
            Math.round(this.x),
            Math.round(this.y + this.height - drawHeight - this.hopPx),
            this.width,
            drawHeight
        );
        ctx.imageSmoothingEnabled = prevSmoothing;
    }

    /** Uniform integer scale (no aspect squash); feet stay on the entity box bottom, head overhangs above. */
    private drawFrame(ctx: CanvasRenderingContext2D): void {
        const scale = this.width / HUMANOID_NATIVE_W;
        const drawHeight = HUMANOID_NATIVE_H * scale;
        spriteLoader.drawCharacterFrame(
            ctx,
            this.spriteName,
            this.facing,
            this.getPose(),
            // Whole-pixel position keeps the 2x art from shimmering as the player moves
            Math.round(this.x),
            Math.round(this.y + this.height - drawHeight),
            this.width,
            drawHeight
        );
    }

    getInteractionPoint(): { x: number; y: number } {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }
}
