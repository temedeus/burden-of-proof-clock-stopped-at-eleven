import { NPC } from "../entities/NPC";
import { doorwayNpcPosition } from "./MurdererConfrontation";
import type { Room } from "../world/Room";
import { DIFFICULTY_CONFIG, type Difficulty } from "./MurdererChaseController";

export const DEFAULT_ATTIC_SCARE_MONOLOGUE = [
    "???: You've been poking around where you shouldn't, Detective.",
    "???: Too nosy. Far too nosy."
] as const;

export { LEDGER_DINING_SCARE_MONOLOGUE as DEFAULT_LEDGER_SCARE_MONOLOGUE } from "./DiningFireCutscene";

/**
 * One-shot room-local scare: hooded murderer appears, monologues, then chases
 * only inside the scare room. Attic scare ends when you leave; dining ledger
 * scare locks exits and resolves via the fireplace cutscene instead.
 * Does not set accusedMurderer — the finale chase is separate.
 */
export class AtticScareChase {
    /** Waiting for the clue dialog to close before starting. */
    armed = false;
    active = false;
    complete = false;
    monologueActive = false;
    redBlinkRemaining = 0;
    chaseStartsIn = 0;

    private lineIndex = 0;
    private readonly lines: readonly string[];
    private homeRoomId: string | null = null;
    private homeX = 0;
    private homeY = 0;
    private originalSprite = "worker_man";
    private originalName = "";
    private originalShowNameLabel = true;

    constructor(
        private difficulty: Difficulty,
        private scareRoomId: string = "attic",
        lines: readonly string[] = DEFAULT_ATTIC_SCARE_MONOLOGUE
    ) {
        this.lines = lines.length > 0 ? lines : DEFAULT_ATTIC_SCARE_MONOLOGUE;
    }

    armAfterDialog(): void {
        if (this.complete || this.active) return;
        this.armed = true;
    }

    start(
        murderer: NPC,
        scareRoom: Room,
        homeRoom: Room | null,
        moveNPCToRoom: (npc: NPC, targetRoom: Room, atX: number, atY: number) => void
    ): void {
        if (this.complete || this.active) return;

        this.armed = false;
        this.homeRoomId = homeRoom?.id ?? null;
        this.homeX = murderer.x;
        this.homeY = murderer.y;
        this.originalSprite = murderer.getSpriteName();
        this.originalName = murderer.name;
        this.originalShowNameLabel = murderer.getShowNameLabel();

        const { x, y } = doorwayNpcPosition(scareRoom);
        moveNPCToRoom(murderer, scareRoom, x, y);
        murderer.setChasing(false);
        murderer.setFleeing(false);
        murderer.setSpriteName("hooded_figure");
        murderer.setName("???");
        murderer.setShowNameLabel(true);
        murderer.setSwingingKnife(false);

        this.active = true;
        this.monologueActive = true;
        this.lineIndex = 0;
        this.chaseStartsIn = 0;
        this.redBlinkRemaining = 0;
    }

    getCurrentLine(): string {
        return this.lines[this.lineIndex] ?? this.lines[this.lines.length - 1];
    }

    advanceMonologue(): "continue" | "start_chase" {
        if (!this.monologueActive) return "start_chase";

        if (this.lineIndex < this.lines.length - 1) {
            this.lineIndex += 1;
            return "continue";
        }

        this.monologueActive = false;
        this.redBlinkRemaining = 2.5;
        this.chaseStartsIn = Math.min(0.75, DIFFICULTY_CONFIG[this.difficulty].chaseHeadStart);
        return "start_chase";
    }

    tick(dt: number): { startChase: boolean } {
        this.redBlinkRemaining = Math.max(0, this.redBlinkRemaining - dt);

        let startChase = false;
        if (this.active && !this.monologueActive && this.chaseStartsIn > 0) {
            this.chaseStartsIn -= dt;
            if (this.chaseStartsIn <= 0) {
                this.chaseStartsIn = 0;
                startChase = true;
            }
        }
        return { startChase };
    }

    beginChase(murderer: NPC): void {
        murderer.setChasing(true);
        murderer.setChaseSpeed(DIFFICULTY_CONFIG[this.difficulty].murdererChaseSpeed);
        murderer.setSwingingKnife(true);
    }

    /** Call when the player leaves the scare room during an active scare. */
    endScare(
        murderer: NPC,
        allRooms: Record<string, Room>,
        moveNPCToRoom: (npc: NPC, targetRoom: Room, atX: number, atY: number) => void
    ): void {
        if (!this.active) return;

        murderer.clearStun();
        murderer.setChasing(false);
        murderer.setSwingingKnife(false);
        murderer.setSpriteName(this.originalSprite);
        murderer.setName(this.originalName);
        murderer.setShowNameLabel(this.originalShowNameLabel);

        const home =
            (this.homeRoomId ? allRooms[this.homeRoomId] : null) ??
            Object.values(allRooms).find((room) => room.id !== this.scareRoomId) ??
            null;
        if (home) {
            moveNPCToRoom(murderer, home, this.homeX, this.homeY);
        }

        this.active = false;
        this.monologueActive = false;
        this.armed = false;
        this.complete = true;
        this.chaseStartsIn = 0;
        this.redBlinkRemaining = 0;
    }
}
