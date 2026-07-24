import type { Interactable } from "../world/Interactable";
import type { Room } from "../world/Room";
import { TILE_SIZE } from "../world/constants";
import type { Entity } from "../entities/Entity";

export const LEDGER_DINING_SCARE_MONOLOGUE = [
    "???: You weren't meant to find that page.",
    "???: Burned evidence still talks — and so will you, if I don't stop you.",
    "You: How did you lock the other door as well?!",
    "???: I'm exploiting bad writing!"
] as const;

export const DINING_FIRE_WAKE_LINES = [
    "Lady von Virtanen: Easy, Detective. You're in the guest wing.",
    "Lady von Virtanen: The dining room caught fire — smoke everywhere. Good luck Ytte was there to help!",
    "Lady von Virtanen: Rest when you need to. Something about that fire still smells wrong."
] as const;

export const YTTE_HELPED_DIALOG =
    "You: Why did you help me back there?\n\nChef Ytte: The baroness walked in. If I'd left you in that smoke, she'd have seen what I am. I had no choice.";

export const HEARTH_SHOVE_HINT = "The hearth — shove him into the fire!";

export type DiningFirePhase =
    | "idle"
    | "throw_into_fire"
    | "ignite"
    | "panic_run"
    | "player_retreat"
    | "player_collapse"
    | "blackout"
    | "drag_setup"
    | "drag_out"
    | "wake_fade"
    | "wake_setup"
    | "wake_dialog"
    | "baroness_exit"
    | "done";

export interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

/** Pixel bounds of the dining hearth shove zone (fireplace footprint + apron). */
export function getFireplaceHazardBounds(room: Room): Rect | null {
    const fireplace = room.interactables.find((obj) => obj.id === "fireplace");
    if (!fireplace) return null;
    return hazardRectFromFireplace(fireplace);
}

function hazardRectFromFireplace(fireplace: Interactable): Rect {
    const tiles = fireplace.footprintTiles?.length ? fireplace.footprintTiles : fireplace.tiles;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const t of tiles) {
        minX = Math.min(minX, t.x);
        minY = Math.min(minY, t.y);
        maxX = Math.max(maxX, t.x);
        maxY = Math.max(maxY, t.y);
    }
    const apronTiles = 2;
    return {
        x: minX * TILE_SIZE,
        y: minY * TILE_SIZE,
        w: (maxX - minX + 1) * TILE_SIZE,
        h: (maxY - minY + 1 + apronTiles) * TILE_SIZE
    };
}

export function entityCenterOverlapsRect(entity: Entity, rect: Rect, entityW: number, entityH: number): boolean {
    const cx = entity.x + entityW / 2;
    const cy = entity.y + entityH / 2;
    return cx >= rect.x && cx <= rect.x + rect.w && cy >= rect.y && cy <= rect.y + rect.h;
}

/** True when the player is close enough to the hearth to see the shove hint. */
export function playerNearFireplaceHazard(
    player: Entity,
    playerW: number,
    playerH: number,
    room: Room,
    marginPx = TILE_SIZE * 2.5
): boolean {
    const hazard = getFireplaceHazardBounds(room);
    if (!hazard) return false;
    const expanded: Rect = {
        x: hazard.x - marginPx,
        y: hazard.y - marginPx,
        w: hazard.w + marginPx * 2,
        h: hazard.h + marginPx * 2
    };
    return entityCenterOverlapsRect(player, expanded, playerW, playerH);
}

/** Hall door on the south wall of the dining room (collapse / drag target). */
export function diningHallDoorPosition(room: Room, playerW: number): { x: number; y: number } {
    const hallExit = room.exits.find((e) => e.targetRoom === "hall") ?? room.exits[0];
    if (hallExit) {
        return {
            x: hallExit.x * TILE_SIZE + TILE_SIZE - playerW / 2,
            y: Math.max(0, hallExit.y - 1) * TILE_SIZE
        };
    }
    return {
        x: (room.map.width / 2) * TILE_SIZE - playerW / 2,
        y: (room.map.height - 3) * TILE_SIZE
    };
}

/** L-path around the table toward the hall door: east clear of the table, then south to door level. */
export function diningTableRetreatWaypoints(
    room: Room,
    fromX: number,
    fromY: number,
    playerW: number
): [{ x: number; y: number }, { x: number; y: number }] {
    const door = diningHallDoorPosition(room, playerW);
    const table = room.interactables.find((obj) => obj.id === "dining_table");
    if (!table) {
        const eastX = Math.max(fromX + TILE_SIZE * 4, (room.map.width * 0.72) * TILE_SIZE - playerW / 2);
        return [
            { x: eastX, y: fromY },
            { x: eastX, y: door.y }
        ];
    }
    const tiles = table.footprintTiles?.length ? table.footprintTiles : table.tiles;
    let maxX = -Infinity;
    for (const t of tiles) {
        maxX = Math.max(maxX, t.x);
    }
    // Collapse just east of the door line — looks like a dash for the exit.
    const eastX = (maxX + 1.5) * TILE_SIZE;
    return [
        { x: eastX, y: fromY },
        { x: eastX, y: door.y }
    ];
}

/**
 * Scripted dining-room fire sequence after Ytte is shoved into the fireplace.
 * Game drives dialog advance and actor motion; this class owns timers and overlays.
 */
export class DiningFireCutscene {
    active = false;
    phase: DiningFirePhase = "idle";
    smokeAlpha = 0;
    blackAlpha = 0;
    flameIntensity = 0;
    /** 0..1 — Ytte thrash waypoints during panic_run. */
    panicT = 0;
    /** 0..1 — throw arc into the hearth. */
    throwT = 0;
    /** 0..1 — player walk around the table (east, then south). */
    retreatT = 0;
    /** 0..1 — player collapse. */
    collapseT = 0;
    /** 0..1 — drag toward the hall door. */
    dragT = 0;
    /** 0..1 — baroness walking to guest-room exit. */
    baronessExitT = 0;

    throwFrom = { x: 0, y: 0 };
    throwTo = { x: 0, y: 0 };
    retreatFrom = { x: 0, y: 0 };
    /** Corner east of the table, then final spot south of it. */
    retreatVia = { x: 0, y: 0 };
    retreatTo = { x: 0, y: 0 };
    dragFromPlayer = { x: 0, y: 0 };
    dragFromYtte = { x: 0, y: 0 };
    dragTo = { x: 0, y: 0 };
    baronessExitFrom = { x: 0, y: 0 };
    baronessExitTo = { x: 0, y: 0 };

    private timer = 0;
    private lineIndex = 0;
    private waitingForDialogAdvance = false;

    startThrow(fromX: number, fromY: number, toX: number, toY: number): void {
        this.active = true;
        this.phase = "throw_into_fire";
        this.timer = 0;
        this.lineIndex = 0;
        this.smokeAlpha = 0;
        this.blackAlpha = 0;
        this.flameIntensity = 0.15;
        this.panicT = 0;
        this.throwT = 0;
        this.retreatT = 0;
        this.collapseT = 0;
        this.dragT = 0;
        this.baronessExitT = 0;
        this.throwFrom = { x: fromX, y: fromY };
        this.throwTo = { x: toX, y: toY };
        this.waitingForDialogAdvance = false;
    }

    getWakeLine(): string {
        return (
            DINING_FIRE_WAKE_LINES[this.lineIndex] ??
            DINING_FIRE_WAKE_LINES[DINING_FIRE_WAKE_LINES.length - 1]
        );
    }

    /** Call when the player advances dialog during the wake phase. */
    advanceDialog(): "continue" | "next_phase" {
        if (!this.waitingForDialogAdvance || this.phase !== "wake_dialog") return "continue";

        if (this.lineIndex < DINING_FIRE_WAKE_LINES.length - 1) {
            this.lineIndex += 1;
            return "continue";
        }

        this.waitingForDialogAdvance = false;
        this.phase = "baroness_exit";
        this.timer = 0;
        this.baronessExitT = 0;
        return "next_phase";
    }

    beginRetreat(
        fromX: number,
        fromY: number,
        viaX: number,
        viaY: number,
        toX: number,
        toY: number
    ): void {
        this.retreatFrom = { x: fromX, y: fromY };
        this.retreatVia = { x: viaX, y: viaY };
        this.retreatTo = { x: toX, y: toY };
        this.retreatT = 0;
    }

    beginDrag(
        playerX: number,
        playerY: number,
        ytteX: number,
        ytteY: number,
        toX: number,
        toY: number
    ): void {
        this.dragFromPlayer = { x: playerX, y: playerY };
        this.dragFromYtte = { x: ytteX, y: ytteY };
        this.dragTo = { x: toX, y: toY };
        this.dragT = 0;
    }

    beginBaronessExit(fromX: number, fromY: number, toX: number, toY: number): void {
        this.baronessExitFrom = { x: fromX, y: fromY };
        this.baronessExitTo = { x: toX, y: toY };
        this.baronessExitT = 0;
    }

    tick(dt: number): {
        openWakeDialog?: boolean;
        placeDrag?: boolean;
        placeWake?: boolean;
        hideCookAndFinishDrag?: boolean;
        startBaronessExit?: boolean;
        finished?: boolean;
    } {
        if (!this.active || this.waitingForDialogAdvance) return {};

        this.timer += dt;
        const out: ReturnType<DiningFireCutscene["tick"]> = {};

        switch (this.phase) {
            case "throw_into_fire": {
                this.throwT = Math.min(1, this.timer / 0.55);
                this.flameIntensity = 0.15 + this.throwT * 0.35;
                if (this.throwT >= 1) {
                    this.phase = "ignite";
                    this.timer = 0;
                }
                break;
            }
            case "ignite": {
                this.flameIntensity = Math.min(1, 0.5 + this.timer * 0.5);
                if (this.timer >= 0.9) {
                    this.phase = "panic_run";
                    this.timer = 0;
                }
                break;
            }
            case "panic_run": {
                this.panicT = Math.min(1, this.timer / 2.8);
                this.flameIntensity = 1;
                this.smokeAlpha = Math.min(0.35, this.timer * 0.1);
                if (this.timer >= 2.8) {
                    this.phase = "player_retreat";
                    this.timer = 0;
                    this.retreatT = 0;
                }
                break;
            }
            case "player_retreat": {
                // East leg ~45%, south leg ~55% of the walk.
                this.retreatT = Math.min(1, this.timer / 2.2);
                this.smokeAlpha = Math.min(0.55, 0.35 + this.timer * 0.1);
                this.flameIntensity = 1;
                if (this.retreatT >= 1) {
                    this.phase = "player_collapse";
                    this.timer = 0;
                    this.collapseT = 0;
                }
                break;
            }
            case "player_collapse": {
                this.collapseT = Math.min(1, this.timer / 0.85);
                this.smokeAlpha = Math.min(0.85, 0.55 + this.timer * 0.35);
                this.blackAlpha = Math.min(0.7, this.timer * 0.55);
                if (this.timer >= 1.1) {
                    this.phase = "blackout";
                    this.timer = 0;
                    this.blackAlpha = 1;
                    this.smokeAlpha = 1;
                    this.collapseT = 1;
                }
                break;
            }
            case "blackout": {
                this.blackAlpha = 1;
                if (this.timer >= 1.0) {
                    this.phase = "drag_setup";
                    this.timer = 0;
                    out.placeDrag = true;
                }
                break;
            }
            case "drag_setup": {
                this.blackAlpha = Math.max(0, 1 - this.timer / 0.7);
                this.smokeAlpha = Math.max(0.2, 0.55 - this.timer * 0.25);
                this.flameIntensity = Math.max(0.35, 0.8 - this.timer * 0.3);
                this.collapseT = 1;
                if (this.timer >= 0.75) {
                    this.phase = "drag_out";
                    this.timer = 0;
                    this.dragT = 0;
                }
                break;
            }
            case "drag_out": {
                this.dragT = Math.min(1, this.timer / 2.4);
                this.collapseT = 1;
                this.blackAlpha = this.dragT > 0.7 ? Math.min(1, (this.dragT - 0.7) / 0.3) : 0;
                if (this.dragT >= 1) {
                    this.phase = "wake_fade";
                    this.timer = 0;
                    this.blackAlpha = 1;
                    out.hideCookAndFinishDrag = true;
                }
                break;
            }
            case "wake_fade": {
                this.blackAlpha = 1;
                this.smokeAlpha = 0;
                this.flameIntensity = 0;
                this.collapseT = 0;
                if (this.timer >= 0.7) {
                    this.phase = "wake_setup";
                    this.timer = 0;
                    out.placeWake = true;
                }
                break;
            }
            case "wake_setup": {
                this.blackAlpha = Math.max(0, 1 - this.timer / 1.0);
                if (this.timer >= 1.05) {
                    this.phase = "wake_dialog";
                    this.lineIndex = 0;
                    this.waitingForDialogAdvance = true;
                    out.openWakeDialog = true;
                }
                break;
            }
            case "baroness_exit": {
                this.baronessExitT = Math.min(1, this.timer / 1.5);
                if (this.baronessExitT >= 1) {
                    this.phase = "done";
                    this.active = false;
                    this.smokeAlpha = 0;
                    this.blackAlpha = 0;
                    this.flameIntensity = 0;
                    out.finished = true;
                }
                break;
            }
            case "done": {
                out.finished = true;
                break;
            }
            default:
                break;
        }

        return out;
    }

    throwPosition(): { x: number; y: number } {
        const t = this.throwT;
        // Slight arc upward while flying into the hearth.
        const lift = Math.sin(t * Math.PI) * TILE_SIZE * 1.2;
        return {
            x: this.throwFrom.x + (this.throwTo.x - this.throwFrom.x) * t,
            y: this.throwFrom.y + (this.throwTo.y - this.throwFrom.y) * t - lift
        };
    }

    retreatPosition(): { x: number; y: number } {
        const t = this.retreatT;
        const eastShare = 0.45;
        if (t <= eastShare) {
            const u = eastShare > 0 ? t / eastShare : 1;
            return {
                x: this.retreatFrom.x + (this.retreatVia.x - this.retreatFrom.x) * u,
                y: this.retreatFrom.y + (this.retreatVia.y - this.retreatFrom.y) * u
            };
        }
        const u = (t - eastShare) / (1 - eastShare);
        return {
            x: this.retreatVia.x + (this.retreatTo.x - this.retreatVia.x) * u,
            y: this.retreatVia.y + (this.retreatTo.y - this.retreatVia.y) * u
        };
    }

    /** Facing while walking the L-path around the table. */
    retreatFacing(): "right" | "down" {
        return this.retreatT <= 0.45 ? "right" : "down";
    }

    dragPlayerPosition(): { x: number; y: number } {
        const t = this.dragT;
        return {
            x: this.dragFromPlayer.x + (this.dragTo.x - this.dragFromPlayer.x) * t,
            y: this.dragFromPlayer.y + (this.dragTo.y - this.dragFromPlayer.y) * t
        };
    }

    dragYttePosition(playerW: number): { x: number; y: number } {
        const player = this.dragPlayerPosition();
        return {
            x: player.x + playerW * 0.55,
            y: player.y - TILE_SIZE * 0.15
        };
    }

    baronessExitPosition(): { x: number; y: number } {
        const t = this.baronessExitT;
        return {
            x: this.baronessExitFrom.x + (this.baronessExitTo.x - this.baronessExitFrom.x) * t,
            y: this.baronessExitFrom.y + (this.baronessExitTo.y - this.baronessExitFrom.y) * t
        };
    }

    /** Waypoints for hooded Ytte thrashing around the dining room. */
    panicPosition(roomWidth: number, roomHeight: number): { x: number; y: number } {
        const cx = (roomWidth / 2) * TILE_SIZE;
        const waypoints = [
            { x: cx - 2 * TILE_SIZE, y: 5 * TILE_SIZE },
            { x: cx + 4 * TILE_SIZE, y: 7 * TILE_SIZE },
            { x: cx - 5 * TILE_SIZE, y: 9 * TILE_SIZE },
            { x: cx + 2 * TILE_SIZE, y: 6 * TILE_SIZE },
            { x: cx - 1 * TILE_SIZE, y: 8 * TILE_SIZE }
        ];
        const clamped = waypoints.map((p) => ({
            x: Math.max(TILE_SIZE, Math.min((roomWidth - 3) * TILE_SIZE, p.x)),
            y: Math.max(TILE_SIZE * 3, Math.min((roomHeight - 3) * TILE_SIZE, p.y))
        }));
        const seg = Math.min(clamped.length - 1.001, this.panicT * (clamped.length - 1));
        const i = Math.floor(seg);
        const f = seg - i;
        const a = clamped[i];
        const b = clamped[Math.min(i + 1, clamped.length - 1)];
        return {
            x: a.x + (b.x - a.x) * f,
            y: a.y + (b.y - a.y) * f
        };
    }

    reset(): void {
        this.active = false;
        this.phase = "idle";
        this.timer = 0;
        this.lineIndex = 0;
        this.smokeAlpha = 0;
        this.blackAlpha = 0;
        this.flameIntensity = 0;
        this.panicT = 0;
        this.throwT = 0;
        this.retreatT = 0;
        this.collapseT = 0;
        this.dragT = 0;
        this.baronessExitT = 0;
        this.waitingForDialogAdvance = false;
        this.retreatVia = { x: 0, y: 0 };
    }
}
