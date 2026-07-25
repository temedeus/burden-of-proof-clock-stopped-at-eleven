import { describe, expect, it } from "vitest";
import { NPC } from "../entities/NPC";
import { TILE_SIZE } from "../world/constants";
import { Room } from "../world/Room";
import { TileMap } from "../world/TileMap";
import { AtticScareChase } from "./AtticScareChase";

function makeRoom(id: string): Room {
    return new Room(id, new TileMap(10, 10, new Array(100).fill(0)), [
        { x: 5, y: 9, targetRoom: "other", spawnX: 5, spawnY: 1 }
    ], [], []);
}

describe("AtticScareChase", () => {
    it("arms once, then starts monologue with hooded disguise without accusing", () => {
        const scare = new AtticScareChase("medium");
        const attic = makeRoom("attic");
        const kitchen = makeRoom("kitchen");
        const murderer = new NPC("cook", 32, 32, "Chef Ytte", "Cook", "worker_man");
        kitchen.npcs.push(murderer);

        scare.armAfterDialog();
        expect(scare.armed).toBe(true);

        scare.start(murderer, attic, kitchen, (npc, room, x, y) => {
            kitchen.npcs = kitchen.npcs.filter((n) => n !== npc);
            attic.npcs = attic.npcs.filter((n) => n !== npc);
            npc.x = x;
            npc.y = y;
            room.npcs.push(npc);
        });

        expect(scare.active).toBe(true);
        expect(scare.monologueActive).toBe(true);
        expect(scare.armed).toBe(false);
        expect(murderer.getSpriteName()).toBe("hooded_figure");
        expect(murderer.name).toBe("???");
        expect(attic.npcs).toContain(murderer);
        expect(murderer.isChasing()).toBe(false);
    });

    it("starts a room-local knife chase after the monologue, then restores on endScare", () => {
        const scare = new AtticScareChase("hard");
        const attic = makeRoom("attic");
        const kitchen = makeRoom("kitchen");
        const murderer = new NPC("cook", 3 * TILE_SIZE, 4 * TILE_SIZE, "Chef Ytte", "Cook", "worker_man");
        kitchen.npcs.push(murderer);

        scare.start(murderer, attic, kitchen, (npc, room, x, y) => {
            for (const r of [attic, kitchen]) {
                const idx = r.npcs.indexOf(npc);
                if (idx >= 0) r.npcs.splice(idx, 1);
            }
            npc.x = x;
            npc.y = y;
            room.npcs.push(npc);
        });

        expect(scare.advanceMonologue()).toBe("continue");
        expect(scare.advanceMonologue()).toBe("continue");
        expect(scare.advanceMonologue()).toBe("start_chase");
        expect(scare.monologueActive).toBe(false);

        let tick = scare.tick(0.2);
        expect(tick.startChase).toBe(false);
        tick = scare.tick(1);
        expect(tick.startChase).toBe(true);

        scare.beginChase(murderer);
        expect(murderer.isChasing()).toBe(true);
        expect(murderer.isSwingingKnife()).toBe(true);

        scare.endScare(murderer, { attic, kitchen }, (npc, room, x, y) => {
            for (const r of [attic, kitchen]) {
                const idx = r.npcs.indexOf(npc);
                if (idx >= 0) r.npcs.splice(idx, 1);
            }
            npc.x = x;
            npc.y = y;
            room.npcs.push(npc);
        });

        expect(scare.active).toBe(false);
        expect(scare.complete).toBe(true);
        expect(murderer.isChasing()).toBe(false);
        expect(murderer.isSwingingKnife()).toBe(false);
        expect(murderer.getSpriteName()).toBe("worker_man");
        expect(murderer.name).toBe("Chef Ytte");
        expect(kitchen.npcs).toContain(murderer);
        expect(attic.npcs).not.toContain(murderer);
    });

    it("does not re-arm after the scare has completed", () => {
        const scare = new AtticScareChase("easy");
        scare.complete = true;
        scare.armAfterDialog();
        expect(scare.armed).toBe(false);
    });
});
