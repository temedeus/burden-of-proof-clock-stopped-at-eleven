import type { Player } from "../entities/Player";
import type { NPC } from "../entities/NPC";
import type { Room } from "../world/Room";
import type { TileMap } from "../world/TileMap";
import type { Interactable } from "../world/Interactable";
import type { DepthActor } from "../render/roomScene";
import { furnitureActorFromInteractable } from "../render/roomScene";
import { TILE_SIZE } from "../world/constants";
import { ballroomWindowRects, type Rect } from "../assets/procedural/ballroom_windows";
import { drawChandelierShards, drawChandelierWreck } from "../assets/procedural/ballroom";
import { getHumanoidFrame } from "../assets/procedural/characterAnimation";
import { getHumanoidStyle } from "../assets/procedural/characters";
import {
    chandelierKey,
    getBrokenChandelier,
    setBrokenChandelier,
    setChandelierVisual
} from "../world/ballroomChandeliers";

/**
 * Ballroom easter eggs:
 * 1. Interacting with a window — a shadow behind the glass makes the detective jump back;
 *    it is only the groundskeeper tending the flowers.
 * 2. Once the window has been checked, whichever chandelier the detective walks under on the
 *    way back to the doors trembles, gives a brief chance to dodge, then crashes to the floor.
 *    Failing to dodge is fatal — the game over vignette shows the fall.
 */

export const BALLROOM_ID = "dancing_room";

export const GROUNDSKEEPER_WINDOW_DIALOG =
    "Groundskeeper: Beg pardon, Detective! Didn't mean to give you a fright.\n\nGroundskeeper: Just tending to the flower beds under the windows. Roses don't stop growing for a murder.";
export const WINDOW_LOOK_TEXT = "Neat flower beds below the window, freshly watered. No one in sight now.";
export const CHANDELIER_DODGED_TEXT =
    "You: That was far too close. Chandeliers don't just fall on their own... do they?";

// Window scare timeline (s)
const FADE_IN_END = 0.9;
const JUMP_START = 0.95;
const JUMP_END = 1.3;
const JUMP_DIST = 40;
const JUMP_HOP = 12;
const EXCLAIM_END = 2.0;
const REVEAL_START = 1.7;
const REVEAL_END = 2.3;
const SCARE_DIALOG_AT = 2.6;
const DUCK_AWAY = 0.6;

// Chandelier trap timeline (s)
export const CHANDELIER_TREMBLE = 1.0;
const FALL_TIME = 0.35;
const AFTERMATH = 1.3;
const DROP_PX = 64;
const DIVE_DIST = 56;
const DIVE_TIME = 0.3;
/** Feet within this box around the impact point trigger the trap. */
const TRIGGER_HALF_W = 56;
const TRIGGER_HALF_H = 36;

function clamp01(t: number): number {
    return Math.max(0, Math.min(1, t));
}

function ramp(t: number, from: number, to: number): number {
    const x = clamp01((t - from) / (to - from));
    return x * x * (3 - 2 * x);
}

interface ScareState {
    glass: Rect;
    t: number;
    startY: number;
    jumpY: number;
    stung: boolean;
    dialogShown: boolean;
    /** Seconds since the dialog closed (groundskeeper ducks below the sill); null before. */
    duck: number | null;
}

interface TrapState {
    key: string;
    impactX: number;
    impactY: number;
    t: number;
    dodged: boolean;
    diveT: number;
    diveFrom: { x: number; y: number };
    diveTo: { x: number; y: number };
    crashed: boolean;
}

export interface ScareTick {
    sting?: boolean;
    dialog?: string;
}

export interface TrapTick {
    crash?: boolean;
    dialog?: string;
    /** Didn't dodge: the chain has snapped and the game over vignette takes over. */
    fatal?: boolean;
}

export class BallroomEasterEggs {
    windowScareDone = false;
    chandelierArmed = false;
    private prevRoomId: string | null = null;
    private scare: ScareState | null = null;
    private trap: TrapState | null = null;
    private silhouette: HTMLCanvasElement | null = null;

    restore(windowScareDone: boolean, chandelierArmed: boolean, brokenChandelier: string | null): void {
        this.windowScareDone = windowScareDone;
        this.chandelierArmed = chandelierArmed && !brokenChandelier;
        setBrokenChandelier(brokenChandelier);
        setChandelierVisual(null);
        this.scare = null;
        this.trap = null;
        this.prevRoomId = null;
    }

    /** Call every frame; leaving the ballroom drops any lingering window figure. */
    trackRoom(roomId: string): void {
        if (this.prevRoomId === BALLROOM_ID && roomId !== BALLROOM_ID) this.scare = null;
        this.prevRoomId = roomId;
    }

    // ------------------------------------------------------------------
    // Window scare
    // ------------------------------------------------------------------

    private windowFacing(player: Player, room: Room): Rect | null {
        if (room.id !== BALLROOM_ID || player.facing !== "up") return null;
        const feetRow = Math.floor((player.y + player.height - 1) / TILE_SIZE);
        if (feetRow > room.northClerestoryRows + 1) return null;
        const cx = player.x + player.width / 2;
        const win = ballroomWindowRects(room.map.width, room.northClerestoryRows).find(
            (w) => cx >= w.frame.x && cx < w.frame.x + w.frame.w
        );
        return win?.glass ?? null;
    }

    /** "scare" starts the jump-scare; "look" is the plain examine afterwards. */
    interactWindow(player: Player, room: Room, map: TileMap, npcs: NPC[]): "scare" | "look" | null {
        const glass = this.windowFacing(player, room);
        if (!glass) return null;
        if (this.windowScareDone || this.scare) return "look";
        const jumpY =
            [JUMP_DIST, JUMP_DIST * 0.75, JUMP_DIST / 2, JUMP_DIST / 4]
                .map((d) => player.y + d)
                .find((y) => !player.wouldCollideAt(player.x, y, map, npcs)) ?? player.y;
        this.scare = {
            glass,
            t: 0,
            startY: player.y,
            jumpY,
            stung: false,
            dialogShown: false,
            duck: null
        };
        player.isMoving = false;
        return "scare";
    }

    updateScare(dt: number, player: Player): ScareTick {
        const s = this.scare;
        if (!s) return {};
        s.t += dt;
        const tick: ScareTick = {};
        if (!s.stung && s.t >= FADE_IN_END) {
            s.stung = true;
            tick.sting = true;
        }
        if (s.t >= JUMP_START) {
            const u = clamp01((s.t - JUMP_START) / (JUMP_END - JUMP_START));
            const ease = 1 - (1 - u) * (1 - u);
            player.y = s.startY + (s.jumpY - s.startY) * ease;
            player.hopPx = u < 1 ? Math.sin(u * Math.PI) * JUMP_HOP : 0;
        }
        if (!s.dialogShown && s.t >= SCARE_DIALOG_AT) {
            s.dialogShown = true;
            player.hopPx = 0;
            tick.dialog = GROUNDSKEEPER_WINDOW_DIALOG;
        }
        return tick;
    }

    /** Groundskeeper's apology done — the next chandelier walked under will fall. */
    onScareDialogClosed(): void {
        this.windowScareDone = true;
        if (!getBrokenChandelier()) this.chandelierArmed = true;
        if (this.scare) this.scare.duck = 0;
    }

    /** Visual-only timers that run in any state (groundskeeper ducking away). */
    tickVisuals(dt: number): void {
        if (this.scare?.duck == null) return;
        this.scare.duck += dt;
        if (this.scare.duck >= DUCK_AWAY) this.scare = null;
    }

    private getSilhouette(frame: HTMLCanvasElement): HTMLCanvasElement {
        if (this.silhouette) return this.silhouette;
        const c = document.createElement("canvas");
        c.width = frame.width;
        c.height = frame.height;
        const g = c.getContext("2d")!;
        g.drawImage(frame, 0, 0);
        g.globalCompositeOperation = "source-in";
        g.fillStyle = "#16121a";
        g.fillRect(0, 0, c.width, c.height);
        this.silhouette = c;
        return c;
    }

    /** Figure behind the glass — drawn over the wall, under furniture and people. */
    renderWindow(ctx: CanvasRenderingContext2D, room: Room): void {
        const s = this.scare;
        if (!s || room.id !== BALLROOM_ID) return;
        const style = getHumanoidStyle("worker_man");
        if (!style) return;
        const frame = getHumanoidFrame(style, "down", "idle");
        const scale = 2;
        const w = frame.width * scale;
        const h = frame.height * scale;
        const sway = s.t < REVEAL_START ? Math.round(Math.sin(s.t * 2.2) * 3) : 0;
        const duck = s.duck == null ? 0 : (s.duck / DUCK_AWAY) * 50;
        const x = Math.round(s.glass.x + s.glass.w / 2 - w / 2 + sway);
        const y = Math.round(s.glass.y + s.glass.h - 46 + duck);
        const shadowAlpha = ramp(s.t, 0, FADE_IN_END) * (1 - ramp(s.t, REVEAL_START, REVEAL_END));
        const revealAlpha = ramp(s.t, REVEAL_START, REVEAL_END);

        ctx.save();
        ctx.beginPath();
        ctx.rect(s.glass.x, s.glass.y, s.glass.w, s.glass.h);
        ctx.clip();
        ctx.imageSmoothingEnabled = false;
        if (shadowAlpha > 0) {
            ctx.globalAlpha = shadowAlpha * 0.9;
            ctx.drawImage(this.getSilhouette(frame), x, y, w, h);
        }
        if (revealAlpha > 0) {
            ctx.globalAlpha = revealAlpha;
            ctx.drawImage(frame, x, y, w, h);
        }
        ctx.restore();
    }

    // ------------------------------------------------------------------
    // Chandelier trap
    // ------------------------------------------------------------------

    private chandeliers(room: Room): { key: string; impactX: number; impactY: number }[] {
        return room.interactables
            .filter((o) => o.spriteName === "chandelier")
            .map((o) => chandelierImpact(o, room));
    }

    /** Starts the trap when the detective walks under a chandelier after it is armed. */
    checkTrap(player: Player, room: Room): boolean {
        if (!this.chandelierArmed || this.trap || getBrokenChandelier() || room.id !== BALLROOM_ID) {
            return false;
        }
        const fx = player.x + player.width / 2;
        const fy = player.y + player.height;
        const hit = this.chandeliers(room).find(
            (c) => Math.abs(fx - c.impactX) < TRIGGER_HALF_W && Math.abs(fy - c.impactY) < TRIGGER_HALF_H
        );
        if (!hit) return false;
        this.trap = {
            ...hit,
            t: 0,
            dodged: false,
            diveT: 0,
            diveFrom: { x: player.x, y: player.y },
            diveTo: { x: player.x, y: player.y },
            crashed: false
        };
        player.isMoving = false;
        return true;
    }

    get dodgeWindowOpen(): boolean {
        return !!this.trap && !this.trap.dodged && this.trap.t < CHANDELIER_TREMBLE;
    }

    updateTrap(dt: number, player: Player, map: TileMap, npcs: NPC[], dodgePressed: boolean): TrapTick {
        const tr = this.trap;
        if (!tr) return {};
        tr.t += dt;
        const tick: TrapTick = {};

        if (dodgePressed && !tr.dodged && tr.t < CHANDELIER_TREMBLE) {
            tr.dodged = true;
            tr.diveFrom = { x: player.x, y: player.y };
            const away = player.x + player.width / 2 < tr.impactX ? -1 : 1;
            const options = [
                { x: player.x + away * DIVE_DIST, y: player.y },
                { x: player.x - away * DIVE_DIST, y: player.y },
                { x: player.x, y: player.y + DIVE_DIST },
                { x: player.x, y: player.y - DIVE_DIST }
            ];
            tr.diveTo = options.find((o) => !player.wouldCollideAt(o.x, o.y, map, npcs)) ?? tr.diveFrom;
            if (tr.diveTo.x !== tr.diveFrom.x) player.facing = tr.diveTo.x > tr.diveFrom.x ? "right" : "left";
        }

        if (tr.dodged && tr.diveT < DIVE_TIME) {
            tr.diveT = Math.min(DIVE_TIME, tr.diveT + dt);
            const u = tr.diveT / DIVE_TIME;
            const ease = 1 - (1 - u) * (1 - u);
            player.x = tr.diveFrom.x + (tr.diveTo.x - tr.diveFrom.x) * ease;
            player.y = tr.diveFrom.y + (tr.diveTo.y - tr.diveFrom.y) * ease;
            player.hopPx = u < 1 ? Math.sin(u * Math.PI) * 10 : 0;
            if (u < 1) player.advanceCutsceneWalk(dt);
            else player.isMoving = false;
        }

        if (!tr.dodged && tr.t >= CHANDELIER_TREMBLE) {
            setChandelierVisual(null);
            player.isMoving = false;
            this.trap = null;
            tick.fatal = true;
            return tick;
        }

        const impactAt = CHANDELIER_TREMBLE + FALL_TIME;
        if (!tr.crashed) {
            const trembling = tr.t < CHANDELIER_TREMBLE;
            const jitter = trembling
                ? Math.round(Math.sin(tr.t * 55) * (1 + (tr.t / CHANDELIER_TREMBLE) * 2))
                : 0;
            const f = clamp01((tr.t - CHANDELIER_TREMBLE) / FALL_TIME);
            setChandelierVisual(tr.key, { jitter, drop: trembling ? 0 : f * f * DROP_PX });
        }
        if (!tr.crashed && tr.t >= impactAt) {
            tr.crashed = true;
            setChandelierVisual(null);
            setBrokenChandelier(tr.key);
            tick.crash = true;
        }
        if (tr.t >= impactAt + AFTERMATH) {
            player.hopPx = 0;
            player.isMoving = false;
            tick.dialog = CHANDELIER_DODGED_TEXT;
            this.trap = null;
            this.chandelierArmed = false;
        }
        return tick;
    }

    /** Wreck on the floor once a chandelier has fallen. */
    drawFloor(ctx: CanvasRenderingContext2D, room: Room): void {
        const broken = getBrokenChandelier();
        if (!broken || room.id !== BALLROOM_ID) return;
        const c = this.chandeliers(room).find((ch) => ch.key === broken);
        if (c) drawChandelierWreck(ctx, c.impactX, c.impactY);
    }

    /** "!" over a startled detective, flying crystal after the crash. */
    overheadActors(player: Player): DepthActor[] {
        const actors: DepthActor[] = [];
        const s = this.scare;
        if (s && s.t >= JUMP_START - 0.05 && s.t < EXCLAIM_END) {
            actors.push({
                y: 0,
                height: 0,
                render: (ctx) => drawExclaim(ctx, player.x + player.width / 2, player.y + player.height - 80 - player.hopPx - 10)
            });
        }
        const tr = this.trap;
        if (tr?.crashed) {
            const since = tr.t - CHANDELIER_TREMBLE - FALL_TIME;
            actors.push({
                y: 0,
                height: 0,
                render: (ctx) => drawChandelierShards(ctx, tr.impactX, tr.impactY - 8, since)
            });
        }
        return actors;
    }
}

/** Where a chandelier lands: under its hanging body, DROP_PX below. */
export function chandelierImpact(obj: Interactable, room: Room): { key: string; impactX: number; impactY: number } {
    const tiles = obj.footprintTiles?.length ? obj.footprintTiles : obj.tiles;
    const minX = Math.min(...tiles.map((t) => t.x));
    const minY = Math.min(...tiles.map((t) => t.y));
    const rect = furnitureActorFromInteractable(obj, () => 0, {
        width: room.map.width,
        height: room.map.height
    }).drawRect;
    return {
        key: chandelierKey(minX, minY),
        impactX: rect.x + rect.w / 2,
        impactY: rect.y + Math.round((rect.h * 56) / 64) + DROP_PX
    };
}

/** Pixel speech-bubble "!" centred above (cx, bottomY). */
function drawExclaim(ctx: CanvasRenderingContext2D, cx: number, bottomY: number): void {
    const x = Math.round(cx) - 7;
    const y = Math.round(bottomY) - 22;
    ctx.fillStyle = "#1a1418";
    ctx.fillRect(x, y, 14, 22);
    ctx.fillStyle = "#f8f2e4";
    ctx.fillRect(x + 2, y + 2, 10, 18);
    ctx.fillStyle = "#b8202a";
    ctx.fillRect(x + 5, y + 4, 4, 9);
    ctx.fillRect(x + 5, y + 15, 4, 3);
}
