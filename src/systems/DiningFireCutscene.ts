import type { Interactable } from "../world/Interactable";
import type { Room } from "../world/Room";
import { TILE_SIZE } from "../world/constants";
import type { Entity } from "../entities/Entity";

export const LEDGER_DINING_SCARE_MONOLOGUE = [
    "???: You weren't meant to find that page.",
    "???: Burned evidence still talks — and so will you, if I don't stop you.",
    "You: How did you lock the other door as well?!",
    "???: One turn. Every latch in this room answers at once. Don't stare at the hinges, Detective — stare at me."
] as const;

export const DINING_FIRE_AFTERMATH_LINES = [
    "Lady von Virtanen: Help! Someone — the dining room is on fire!",
    "Lady von Virtanen: You there — get them out! Quickly!"
] as const;

export const DINING_FIRE_WAKE_LINES = [
    "Lady von Virtanen: Easy, Detective. You're in the guest wing.",
    "Lady von Virtanen: The dining room caught fire. Smoke everywhere — I heard shouting and ran in.",
    "Lady von Virtanen: Chef Ytte was already dragging you out. He said you fainted. The hearth… he claimed an accident.",
    "Lady von Virtanen: Rest. When you're steady, keep looking. Something about that fire still smells wrong."
] as const;

export const YTTE_HELPED_DIALOG =
    "You: Why did you help me back there?\n\nChef Ytte: The baroness walked in. If I'd left you in that smoke, she'd have seen what I am. I had no choice.";

export const HEARTH_SHOVE_HINT = "The hearth — shove him into the fire!";

export type DiningFirePhase =
    | "idle"
    | "ignite"
    | "panic_run"
    | "smoke_fill"
    | "blackout"
    | "aftermath_setup"
    | "aftermath_dialog"
    | "drag_out"
    | "wake_fade"
    | "wake_setup"
    | "wake_dialog"
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
    // Apron in front of the hearth so a shove from the dining floor can land.
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

/**
 * Scripted dining-room fire sequence after Ytte is shoved into the fireplace.
 * Game drives dialog advance; this class owns timers, overlays, and phase order.
 */
export class DiningFireCutscene {
    active = false;
    phase: DiningFirePhase = "idle";
    smokeAlpha = 0;
    blackAlpha = 0;
    flameIntensity = 0;
    /** 0..1 — Ytte thrash waypoints during panic_run. */
    panicT = 0;

    private timer = 0;
    private lineIndex = 0;
    private waitingForDialogAdvance = false;

    start(): void {
        this.active = true;
        this.phase = "ignite";
        this.timer = 0;
        this.lineIndex = 0;
        this.smokeAlpha = 0;
        this.blackAlpha = 0;
        this.flameIntensity = 0.35;
        this.panicT = 0;
        this.waitingForDialogAdvance = false;
    }

    getAftermathLine(): string {
        return (
            DINING_FIRE_AFTERMATH_LINES[this.lineIndex] ??
            DINING_FIRE_AFTERMATH_LINES[DINING_FIRE_AFTERMATH_LINES.length - 1]
        );
    }

    getWakeLine(): string {
        return (
            DINING_FIRE_WAKE_LINES[this.lineIndex] ??
            DINING_FIRE_WAKE_LINES[DINING_FIRE_WAKE_LINES.length - 1]
        );
    }

    /** Call when the player advances dialog during aftermath/wake phases. */
    advanceDialog(): "continue" | "next_phase" {
        if (!this.waitingForDialogAdvance) return "continue";

        const lines =
            this.phase === "aftermath_dialog" ? DINING_FIRE_AFTERMATH_LINES : DINING_FIRE_WAKE_LINES;

        if (this.lineIndex < lines.length - 1) {
            this.lineIndex += 1;
            return "continue";
        }

        this.waitingForDialogAdvance = false;
        if (this.phase === "aftermath_dialog") {
            this.phase = "drag_out";
            this.timer = 0;
        } else if (this.phase === "wake_dialog") {
            this.phase = "done";
            this.active = false;
            this.smokeAlpha = 0;
            this.blackAlpha = 0;
            this.flameIntensity = 0;
        }
        return "next_phase";
    }

    tick(dt: number): {
        openAftermathDialog?: boolean;
        openWakeDialog?: boolean;
        placeAftermath?: boolean;
        placeWake?: boolean;
        hideCookAndFinishDrag?: boolean;
        finished?: boolean;
    } {
        if (!this.active || this.waitingForDialogAdvance) return {};

        this.timer += dt;
        const out: ReturnType<DiningFireCutscene["tick"]> = {};

        switch (this.phase) {
            case "ignite": {
                this.flameIntensity = Math.min(1, 0.35 + this.timer * 0.5);
                if (this.timer >= 1.2) {
                    this.phase = "panic_run";
                    this.timer = 0;
                }
                break;
            }
            case "panic_run": {
                this.panicT = Math.min(1, this.timer / 3.2);
                this.flameIntensity = 1;
                this.smokeAlpha = Math.min(0.45, this.timer * 0.12);
                if (this.timer >= 3.2) {
                    this.phase = "smoke_fill";
                    this.timer = 0;
                }
                break;
            }
            case "smoke_fill": {
                this.smokeAlpha = Math.min(0.92, 0.45 + this.timer * 0.35);
                this.blackAlpha = Math.min(0.55, this.timer * 0.25);
                if (this.timer >= 2.2) {
                    this.phase = "blackout";
                    this.timer = 0;
                    this.blackAlpha = 1;
                    this.smokeAlpha = 1;
                }
                break;
            }
            case "blackout": {
                this.blackAlpha = 1;
                if (this.timer >= 1.2) {
                    this.phase = "aftermath_setup";
                    this.timer = 0;
                    out.placeAftermath = true;
                }
                break;
            }
            case "aftermath_setup": {
                this.blackAlpha = Math.max(0, 1 - this.timer / 0.8);
                this.smokeAlpha = Math.max(0.15, 0.5 - this.timer * 0.2);
                this.flameIntensity = Math.max(0.4, 1 - this.timer * 0.3);
                if (this.timer >= 0.9) {
                    this.phase = "aftermath_dialog";
                    this.lineIndex = 0;
                    this.waitingForDialogAdvance = true;
                    out.openAftermathDialog = true;
                }
                break;
            }
            case "drag_out": {
                this.blackAlpha = Math.min(1, this.timer / 1.1);
                if (this.timer >= 1.3) {
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
                if (this.timer >= 0.8) {
                    this.phase = "wake_setup";
                    this.timer = 0;
                    out.placeWake = true;
                }
                break;
            }
            case "wake_setup": {
                this.blackAlpha = Math.max(0, 1 - this.timer / 1.0);
                if (this.timer >= 1.1) {
                    this.phase = "wake_dialog";
                    this.lineIndex = 0;
                    this.waitingForDialogAdvance = true;
                    out.openWakeDialog = true;
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

    /** Waypoints for hooded Ytte thrashing around the dining room (tile coords → pixels). */
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
        this.waitingForDialogAdvance = false;
    }
}
