import { NPC } from "../entities/NPC";
import { TILE_SIZE } from "../world/constants";
import type { Room } from "../world/Room";

export const DEFAULT_MURDERER_MONOLOGUE = [
    "Ytte: You found the knife. Of course you did — you were always going to end up down here.",
    "Ytte: The Baron uncovered the smuggling ledger. He meant to hand me to the police at dawn.",
    "Ytte: Years of work — my family's future — gone because his conscience woke up at the wrong hour.",
    "Ytte: So I stopped the clock at eleven and made sure he never reached that study meeting.",
    "Ytte: You think you're clever, Detective? No one walks out of here with what you know!"
] as const;

export function doorwayNpcPosition(room: Room): { x: number; y: number } {
    const exit = room.exits.find((e) => !e.interactionOnly) ?? room.exits[0];
    if (!exit) {
        return { x: TILE_SIZE, y: TILE_SIZE };
    }

    const w = room.map.width;
    const h = room.map.height;
    const npcTileW = 2;
    const npcTileH = 2;

    if (exit.x === 0) {
        return { x: TILE_SIZE, y: (exit.y - 1) * TILE_SIZE };
    }
    if (exit.x === w - 1) {
        return { x: (w - 1 - npcTileW) * TILE_SIZE, y: (exit.y - 1) * TILE_SIZE };
    }
    if (exit.y === 0) {
        return { x: (exit.x - 1) * TILE_SIZE, y: TILE_SIZE };
    }
    return { x: (exit.x - 1) * TILE_SIZE, y: (h - 1 - npcTileH) * TILE_SIZE };
}

export class MurdererConfrontation {
    active = false;
    complete = false;
    private lineIndex = 0;
    private readonly lines: readonly string[];

    constructor(lines: readonly string[] = DEFAULT_MURDERER_MONOLOGUE) {
        this.lines = lines.length > 0 ? lines : DEFAULT_MURDERER_MONOLOGUE;
    }

    start(
        murderer: NPC,
        room: Room,
        moveNPCToRoom: (npc: NPC, targetRoom: Room, atX: number, atY: number) => void
    ): void {
        if (this.complete || this.active) return;

        const { x, y } = doorwayNpcPosition(room);
        moveNPCToRoom(murderer, room, x, y);
        murderer.setChasing(false);
        murderer.setFleeing(false);

        this.active = true;
        this.lineIndex = 0;
        this.complete = false;
    }

    getCurrentLine(): string {
        return this.lines[this.lineIndex] ?? this.lines[this.lines.length - 1];
    }

    advance(): "continue" | "done" {
        if (!this.active) return "done";

        if (this.lineIndex < this.lines.length - 1) {
            this.lineIndex += 1;
            return "continue";
        }

        this.active = false;
        this.complete = true;
        return "done";
    }
}
