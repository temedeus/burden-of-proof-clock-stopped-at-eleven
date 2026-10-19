import { NPC } from "../entities/NPC";
import { Player } from "../entities/Player";
import type { Room } from "../world/Room";

export type Difficulty = "easy" | "medium" | "hard";

export const DIFFICULTY_CONFIG: Record<
    Difficulty,
    {
        chaseHeadStart: number;
        murdererChaseSpeed: number;
        murdererSpawnsIn: number;
        /** Seconds before the chaser re-routes after you change tile — he briefly loses the scent on easier levels. */
        chaseRepathSeconds: number;
    }
> = {
    easy: { chaseHeadStart: 2.5, murdererChaseSpeed: 90, murdererSpawnsIn: 2, chaseRepathSeconds: 0.5 },
    medium: { chaseHeadStart: 1.5, murdererChaseSpeed: 112, murdererSpawnsIn: 1.5, chaseRepathSeconds: 0.25 },
    hard: { chaseHeadStart: 0.5, murdererChaseSpeed: 135, murdererSpawnsIn: 1, chaseRepathSeconds: 0 }
};

export interface MurdererChaseTickResult {
    startChase: boolean;
    spawnInRoom: boolean;
}

export class MurdererChaseController {
    accusedMurderer = false;
    chaseStartsIn = 0;
    murdererSpawnsIn = 0;
    redBlinkRemaining = 0;
    private murdererSpawnX = 0;
    private murdererSpawnY = 0;
    private spawnPending = false;

    constructor(private difficulty: Difficulty) {}

    triggerAccusation(): void {
        this.accusedMurderer = true;
        this.redBlinkRemaining = 3;
        this.chaseStartsIn = DIFFICULTY_CONFIG[this.difficulty].chaseHeadStart;
    }

    scheduleSpawnAfterRoomChange(player: Player): void {
        this.murdererSpawnsIn = DIFFICULTY_CONFIG[this.difficulty].murdererSpawnsIn;
        this.murdererSpawnX = player.x;
        this.murdererSpawnY = player.y;
        this.spawnPending = true;
    }

    tick(dt: number): MurdererChaseTickResult {
        this.redBlinkRemaining = Math.max(0, this.redBlinkRemaining - dt);

        let startChase = false;
        if (this.chaseStartsIn > 0) {
            this.chaseStartsIn -= dt;
            if (this.chaseStartsIn <= 0) {
                this.chaseStartsIn = 0;
                startChase = this.accusedMurderer;
            }
        }

        let spawnInRoom = false;
        if (this.spawnPending && this.murdererSpawnsIn > 0) {
            this.murdererSpawnsIn -= dt;
            if (this.murdererSpawnsIn <= 0) {
                this.murdererSpawnsIn = 0;
                spawnInRoom = true;
                this.spawnPending = false;
            }
        }

        return { startChase, spawnInRoom };
    }

    spawnMurdererInRoom(murderer: NPC, currentRoom: Room, allRooms: Record<string, Room>): void {
        for (const room of Object.values(allRooms)) {
            const idx = room.npcs.indexOf(murderer);
            if (idx >= 0) {
                room.npcs.splice(idx, 1);
                break;
            }
        }
        murderer.x = this.murdererSpawnX;
        murderer.y = this.murdererSpawnY;
        currentRoom.npcs.push(murderer);
    }

    startMurdererChase(murderer: NPC): void {
        murderer.setChasing(true);
        murderer.setChaseSpeed(DIFFICULTY_CONFIG[this.difficulty].murdererChaseSpeed);
        murderer.setSwingingKnife(true);
    }

    npcOverlapsPlayer(player: Player, npc: NPC): boolean {
        return (
            player.x < npc.x + npc.width &&
            player.x + player.width > npc.x &&
            player.y < npc.y + npc.height &&
            player.y + player.height > npc.y
        );
    }
}
