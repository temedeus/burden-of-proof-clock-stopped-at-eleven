import { ARMOR_COLLAPSE_DURATION, ARMOR_LAND_TIMES } from "../assets/procedural/armorStand";
import type { Room } from "./Room";

/** Examine text once the landing's suit of armor has been shaken apart. */
export const ARMOR_HEAP_DESCRIPTION =
    "A heap of dented plate armor. Best not to mention this to the Baroness.";

/** Seconds into the collapse; null while the armor still stands. Session state, saved with progress. */
let collapseT: number | null = null;

export function startArmorCollapse(): void {
    collapseT = 0;
}

export function getArmorCollapseT(): number | null {
    return collapseT;
}

export function isArmorCollapsed(): boolean {
    return collapseT !== null;
}

/** Restore from a save: collapsed armor is drawn as the settled heap. */
export function setArmorCollapsed(collapsed: boolean): void {
    collapseT = collapsed ? ARMOR_COLLAPSE_DURATION : null;
}

export function resetArmorCollapse(): void {
    collapseT = null;
}

/** Advance the collapse; `impacts` counts pieces that hit the floor this frame. */
export function tickArmorCollapse(dt: number): { impacts: number; done: boolean } {
    if (collapseT === null || collapseT >= ARMOR_COLLAPSE_DURATION) return { impacts: 0, done: false };
    const prev = collapseT;
    collapseT = Math.min(ARMOR_COLLAPSE_DURATION, collapseT + dt);
    const now = collapseT;
    const impacts = ARMOR_LAND_TIMES.filter((t) => t > prev && t <= now).length;
    return { impacts, done: now >= ARMOR_COLLAPSE_DURATION };
}

/** The heap can only be examined — no more shake prompt. */
export function applyArmorCollapsedToRooms(rooms: Record<string, Room>): void {
    for (const room of Object.values(rooms)) {
        for (const obj of room.interactables) {
            if (obj.spriteName !== "armor_stand") continue;
            obj.interactionType = undefined;
            obj.confirmId = undefined;
            obj.confirmPrompt = undefined;
            obj.description = ARMOR_HEAP_DESCRIPTION;
        }
    }
}
