import { NPC } from "../entities/NPC";
import { TILE_SIZE } from "../world/constants";
import type { Room } from "../world/Room";

export class VictorySequence {
    active = false;
    timer = 2;
    room: Room | null = null;
    policeId: string | null = null;
    private doorTarget: { x: number; y: number } | null = null;

    start(
        police: NPC,
        murderer: NPC,
        room: Room,
        moveNPCToRoom: (npc: NPC, targetRoom: Room, atX: number, atY: number) => void,
        murdererRoom: Room | null
    ): void {
        let spawnExitIndex = 0;
        if (murdererRoom !== room) {
            const exit = room.exits[0];
            if (exit) {
                moveNPCToRoom(murderer, room, exit.spawnX * TILE_SIZE, exit.spawnY * TILE_SIZE);
                spawnExitIndex = 1;
            } else {
                moveNPCToRoom(murderer, room, murderer.x, murderer.y);
            }
        }

        const exitIndex = room.exits.length > 1 ? spawnExitIndex % room.exits.length : 0;
        const exit = room.exits[exitIndex];
        if (!exit) return;

        murderer.setChasing(false);
        murderer.setFleeing(false);
        murderer.setChasing(true);
        murderer.setChaseSpeed(75);
        police.setChasing(true);
        police.setChaseSpeed(120);

        this.doorTarget = {
            x: exit.x * TILE_SIZE + TILE_SIZE,
            y: exit.y * TILE_SIZE + TILE_SIZE
        };
        this.active = true;
        this.timer = 2;
        this.room = room;
        this.policeId = police.id;
    }

    update(dt: number, getMurderer: () => NPC | null, getPolice: (id: string) => NPC | null): void {
        if (!this.active || this.timer <= 0) return;

        this.timer -= dt;
        if (!this.room || !this.policeId || !this.doorTarget) return;

        const murderer = getMurderer();
        const police = getPolice(this.policeId);
        if (murderer && police) {
            murderer.updateChase(dt, this.doorTarget.x, this.doorTarget.y, this.room.map);
            const mcx = murderer.x + murderer.width / 2;
            const mcy = murderer.y + murderer.height / 2;
            police.updateChase(dt, mcx, mcy, this.room.map);
        }
    }

    isWaitingForInput(): boolean {
        return this.active && this.timer <= 0;
    }

    reset(): void {
        this.active = false;
        this.timer = 2;
        this.room = null;
        this.policeId = null;
        this.doorTarget = null;
    }
}
