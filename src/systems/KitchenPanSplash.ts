import { drawStockPot, KITCHEN_STOVE_NATIVE_W, STOVE_POT_NATIVE } from "../assets/procedural/kitchen_stove";
import { HUMANOID_NATIVE_H, HUMANOID_NATIVE_W } from "../assets/procedural/characterAnimation";
import type { NPC } from "../entities/NPC";
import type { Facing, Player } from "../entities/Player";
import type { DepthActor } from "../render/roomScene";
import { drawPanicBubble } from "../render/speechBubble";
import type { Interactable } from "../world/Interactable";
import type { Room } from "../world/Room";
import type { TileMap } from "../world/TileMap";
import { TILE_SIZE } from "../world/constants";
import { setStovePotTaken, stoveKey } from "../world/kitchenStovePot";
import { entityCenterOverlapsRect } from "./DiningFireCutscene";
import { CUTSCENE_TEXT } from "../content/cutsceneText";

/**
 * Finale-chase easter egg: win the struggle beside a kitchen stove and the
 * detective steps up to the range, lifts the boiling stock pot off the hob,
 * turns and hurls the water at Ytte. He goes down steaming for longer than a
 * plain shove; the empty pot is left on the floor.
 */

export const STOVE_STRUGGLE_TITLE = "Grab the boiling pan!";
/** Scalded stun lasts this much longer than a normal shove. */
export const PAN_SPLASH_STUN_MULTIPLIER = 2;
/** Water lands on Ytte this long after it leaves the pot. */
export const PAN_SPLASH_FLIGHT = 0.3;

const WALK_SPEED = 220;
// Timeline in seconds after the detective reaches the stove
const GRAB_END = 0.35;
const TURN_END = 0.55;
const WINDUP_END = 0.75;
const THROW_END = 0.85;
/** Water leaves the pot at the start of the forward swing. */
const RELEASE_AT = WINDUP_END;
const LAND_AT = RELEASE_AT + PAN_SPLASH_FLIGHT;
const DROP_FOR = 0.2;
const SHOUT_FOR = 1.4;
const STEAM_FOR = 2.8;
const DROPLETS = 26;

const SHOUTS = CUTSCENE_TEXT.finale.panSplashShouts;

interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

interface Point {
    x: number;
    y: number;
}

export interface PanSplashTick {
    /** Pot starts its forward swing (play the slosh + sizzle). */
    throwStarted?: boolean;
    /** Water hit Ytte: knock him down and hand control back. */
    landed?: boolean;
}

function footprintOf(obj: Interactable): { x: number; y: number }[] {
    return obj.footprintTiles?.length ? obj.footprintTiles : obj.tiles;
}

function tileBounds(tiles: { x: number; y: number }[]): Rect {
    const xs = tiles.map((t) => t.x);
    const ys = tiles.map((t) => t.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    return {
        x: minX * TILE_SIZE,
        y: minY * TILE_SIZE,
        w: (Math.max(...xs) - minX + 1) * TILE_SIZE,
        h: (Math.max(...ys) - minY + 1) * TILE_SIZE
    };
}

function kitchenStoves(room: Room): Interactable[] {
    return room.interactables.filter((obj) => obj.spriteName === "kitchen_stove" && obj.tiles.length > 0);
}

/** Stove footprints in the room, in pixels. */
export function getKitchenStoveBounds(room: Room): Rect[] {
    return kitchenStoves(room).map((obj) => tileBounds(obj.tiles));
}

function expand(rect: Rect, margin: number): Rect {
    return { x: rect.x - margin, y: rect.y - margin, w: rect.w + margin * 2, h: rect.h + margin * 2 };
}

/** Closest stove within reach of the player, if any. */
export function nearestKitchenStove(
    player: Player,
    room: Room,
    marginPx = TILE_SIZE * 2
): Interactable | null {
    const px = player.x + player.width / 2;
    let best: { obj: Interactable; d: number } | null = null;
    for (const obj of kitchenStoves(room)) {
        const bounds = tileBounds(obj.tiles);
        if (!entityCenterOverlapsRect(player, expand(bounds, marginPx), player.width, player.height)) continue;
        const d = Math.abs(bounds.x + bounds.w / 2 - px);
        if (!best || d < best.d) best = { obj, d };
    }
    return best?.obj ?? null;
}

/** True when the player stands close enough to a stove to grab a pan. */
export function playerNearKitchenStove(player: Player, room: Room, marginPx = TILE_SIZE * 2): boolean {
    return nearestKitchenStove(player, room, marginPx) != null;
}

function facingToward(dx: number, dy: number): Facing {
    if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? "right" : "left";
    return dy > 0 ? "down" : "up";
}

function smoothstep(t: number): number {
    const x = Math.max(0, Math.min(1, t));
    return x * x * (3 - 2 * x);
}

function lerp(a: Point, b: Point, t: number): Point {
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export class KitchenPanSplash {
    /** Scripted part running (gameplay frozen) — ends when the water lands. */
    active = false;
    private t = 0;
    private walkTarget: Point | null = null;
    private target: NPC | null = null;
    private takenStove: string | null = null;
    /** Pot centre on the hob, in world pixels. */
    private potHome: Point = { x: 0, y: 0 };
    private potScale = 2;
    private throwDir = 1;
    private throwFacing: Facing = "up";
    private releaseFrom: Point = { x: 0, y: 0 };
    private droppedAt: Point | null = null;
    private shout = SHOUTS[0];
    private shoutIndex = 0;
    /** Seconds since the water landed; null before it lands. */
    private sinceLand: number | null = null;
    /** Per-droplet spread so the arc reads as a sloshing sheet of water. */
    private spread: { dx: number; dy: number; lag: number }[] = [];

    /** @param stoveDrawRect the stove's sprite rect in world pixels (the pot sits on its right hob) */
    start(
        player: Player,
        murderer: NPC,
        stove: Interactable,
        stoveDrawRect: Rect,
        map: TileMap,
        npcs: NPC[]
    ): void {
        this.stop();
        this.active = true;
        this.t = 0;
        this.target = murderer;
        this.throwFacing = "up";
        this.potScale = stoveDrawRect.w / KITCHEN_STOVE_NATIVE_W;
        this.potHome = {
            x: stoveDrawRect.x + STOVE_POT_NATIVE.x * this.potScale,
            y: stoveDrawRect.y + STOVE_POT_NATIVE.y * this.potScale
        };
        this.shout = SHOUTS[this.shoutIndex++ % SHOUTS.length];
        this.spread = Array.from({ length: DROPLETS }, (_, i) => ({
            dx: Math.sin(i * 12.9898) * 7,
            dy: Math.cos(i * 78.233) * 6,
            lag: (i / DROPLETS) * 0.1
        }));

        const footprint = footprintOf(stove);
        this.takenStove = stoveKey(Math.min(...footprint.map((t) => t.x)), Math.min(...footprint.map((t) => t.y)));

        // Step up to the hob, right under the pot, when there is room to stand there
        const bounds = tileBounds(footprint);
        const standX = Math.round(this.potHome.x - player.width / 2);
        const front = bounds.y + bounds.h;
        for (let dy = 0; dy <= TILE_SIZE * 2; dy += 4) {
            if (!player.wouldCollideAt(standX, front + dy, map, npcs)) {
                this.walkTarget = { x: standX, y: front + dy };
                break;
            }
        }
    }

    /** Ends everything and puts the pot back on its hob (room change). */
    stop(): void {
        this.active = false;
        this.target = null;
        this.walkTarget = null;
        this.droppedAt = null;
        this.sinceLand = null;
        this.takenStove = null;
        setStovePotTaken(null);
    }

    update(dt: number, player: Player): PanSplashTick {
        if (this.sinceLand != null) {
            this.sinceLand += dt;
            if (this.sinceLand >= STEAM_FOR) this.target = null;
        }
        if (!this.active) return {};

        if (this.walkTarget) {
            this.walk(dt, player);
            return {};
        }

        const prev = this.t;
        this.t += dt;
        const t = this.t;
        const tick: PanSplashTick = {};

        if (prev === 0) {
            player.facing = "up";
            setStovePotTaken(this.takenStove);
        }
        if (prev < GRAB_END && t >= GRAB_END && this.target) {
            const box = this.target.getSpriteBox();
            const dx = box.x + box.w / 2 - (player.x + player.width / 2);
            const dy = box.y + box.h / 2 - (player.y + player.height / 2);
            this.throwFacing = facingToward(dx, dy);
            this.throwDir = dx >= 0 ? 1 : -1;
            player.facing = this.throwFacing;
        }
        if (prev < RELEASE_AT && t >= RELEASE_AT) {
            this.releaseFrom = this.potPosition(player);
            tick.throwStarted = true;
        }
        if (prev < LAND_AT && t >= LAND_AT) {
            this.sinceLand = 0;
            this.droppedAt = {
                x: player.x + player.width / 2 + this.throwDir * player.width * 0.45,
                y: player.y + player.height
            };
            this.active = false;
            tick.landed = true;
        }
        return tick;
    }

    private walk(dt: number, player: Player): void {
        const wp = this.walkTarget!;
        const dx = wp.x - player.x;
        const dy = wp.y - player.y;
        const dist = Math.hypot(dx, dy);
        const step = WALK_SPEED * dt;
        if (dist <= step) {
            player.x = wp.x;
            player.y = wp.y;
            player.isMoving = false;
            player.facing = "up";
            this.walkTarget = null;
            return;
        }
        player.facing = facingToward(dx, dy);
        player.x += (dx / dist) * step;
        player.y += (dy / dist) * step;
        player.advanceCutsceneWalk(dt);
    }

    /** Where the detective's hands hold the pot; `lift` raises it in native sprite pixels. */
    private hands(player: Player, lift: number): Point {
        const scale = player.width / HUMANOID_NATIVE_W;
        const top = player.y + player.height - HUMANOID_NATIVE_H * scale;
        const sideways = this.throwFacing === "left" || this.throwFacing === "right";
        return {
            x: player.x + player.width / 2 + (sideways ? this.throwDir * 7 * scale : 0),
            y: top + (24 - lift) * scale
        };
    }

    private potPosition(player: Player): Point {
        const t = this.t;
        // Hoisted clear above the head so it stays visible while the detective faces the stove
        const overhead = { x: player.x + player.width / 2, y: this.hands(player, 32).y };
        if (t < GRAB_END) {
            // Lift off the hob in a little hop, ending held up in front of the face
            const p = smoothstep(t / GRAB_END);
            const pos = lerp(this.potHome, overhead, p);
            return { x: pos.x, y: pos.y - Math.sin(p * Math.PI) * 6 };
        }
        const held = this.hands(player, 4);
        if (t < TURN_END) return lerp(overhead, held, smoothstep((t - GRAB_END) / (TURN_END - GRAB_END)));
        const back = { x: held.x - this.throwDir * 6, y: held.y - 4 };
        if (t < WINDUP_END) return lerp(held, back, smoothstep((t - TURN_END) / (WINDUP_END - TURN_END)));
        const forward = { x: held.x + this.throwDir * 8, y: held.y - 2 };
        return lerp(back, forward, smoothstep((t - WINDUP_END) / (THROW_END - WINDUP_END)));
    }

    private potTilt(): number {
        const t = this.t;
        if (t < TURN_END) return 0;
        if (t < WINDUP_END) return -0.35 * this.throwDir * smoothstep((t - TURN_END) / (WINDUP_END - TURN_END));
        const p = smoothstep((t - WINDUP_END) / (THROW_END - WINDUP_END));
        return this.throwDir * (-0.35 + 2.1 * p);
    }

    /** The pot, held or dropped — depth-sorted with the player and furniture. */
    worldActors(player: Player): DepthActor[] {
        if (this.active && !this.walkTarget) {
            const pos = this.potPosition(player);
            const tilt = this.potTilt();
            const water = this.t < RELEASE_AT ? 1 : 0;
            return [
                {
                    y: player.y + player.height + 1,
                    height: 0,
                    render: (c) => drawStockPot(c, pos.x, pos.y, this.potScale, tilt, water)
                }
            ];
        }
        const at = this.droppedAt;
        if (!at) return [];
        const drop = smoothstep((this.sinceLand ?? 0) / DROP_FOR);
        const lieY = at.y - 3 * this.potScale;
        const fromY = at.y - 14 * this.potScale;
        return [
            {
                y: at.y,
                height: 0,
                render: (c) =>
                    drawStockPot(c, at.x, fromY + (lieY - fromY) * drop, this.potScale, this.throwDir * 1.57 * drop, 0)
            }
        ];
    }

    /** Flying water, steam and Ytte's yelp — drawn above everything. */
    overheadActors(roomW: number): DepthActor[] {
        const npc = this.target;
        if (!npc) return [];
        const box = npc.getSpriteBox();
        const actors: DepthActor[] = [];
        const sinceRelease = this.t - RELEASE_AT + (this.sinceLand ?? 0);
        if (sinceRelease >= 0 && sinceRelease < PAN_SPLASH_FLIGHT + 0.15) {
            const to = { x: box.x + box.w / 2, y: box.y + box.h * 0.3 };
            actors.push({ y: 0, height: 0, render: (c) => this.drawWater(c, to, sinceRelease) });
        }
        const since = this.sinceLand;
        if (since != null && since < STEAM_FOR) {
            actors.push({ y: 0, height: 0, render: (c) => drawSteam(c, box, since) });
            if (since < SHOUT_FOR) {
                const tipY = Math.max(30, box.y - (npc.getShowNameLabel() ? 20 : 2));
                actors.push({
                    y: 0,
                    height: 0,
                    render: (c) => drawPanicBubble(c, this.shout, box.x + box.w / 2, tipY, since, 2, roomW - 2)
                });
            }
        }
        return actors;
    }

    private drawWater(c: CanvasRenderingContext2D, to: Point, sinceRelease: number): void {
        const from = this.releaseFrom;
        c.save();
        for (const d of this.spread) {
            const p = Math.min(1, Math.max(0, (sinceRelease - d.lag) / PAN_SPLASH_FLIGHT));
            if (p <= 0) continue;
            const x = from.x + (to.x - from.x) * p + d.dx * p;
            const arc = Math.sin(p * Math.PI) * TILE_SIZE * 0.8;
            const y = from.y + (to.y - from.y) * p - arc + d.dy * p;
            c.fillStyle = p >= 1 ? "rgba(190,225,245,0.5)" : "rgba(170,215,240,0.9)";
            const size = d.lag < 0.05 ? 4 : 3;
            c.fillRect(Math.round(x) - 1, Math.round(y) - 1, size, size);
        }
        c.restore();
    }
}

function drawSteam(c: CanvasRenderingContext2D, box: Rect, since: number): void {
    const fade = 1 - Math.min(1, since / STEAM_FOR);
    c.save();
    for (let i = 0; i < 8; i++) {
        const life = (since * 0.9 + i / 8) % 1;
        const x = box.x + box.w * (0.15 + 0.7 * ((i * 0.37) % 1)) + Math.sin(since * 3 + i) * 3;
        const y = box.y + box.h * 0.55 - life * TILE_SIZE * 1.4;
        c.globalAlpha = fade * (1 - life) * 0.7;
        c.fillStyle = "#eef2f4";
        c.beginPath();
        c.arc(Math.round(x), Math.round(y), 3 + life * 5, 0, Math.PI * 2);
        c.fill();
    }
    c.restore();
}
