import { describe, expect, it } from "vitest";
import { NPC } from "../entities/NPC";
import { TILE_SIZE } from "../world/constants";
import { Room } from "../world/Room";
import { TileMap } from "../world/TileMap";
import { doorwayNpcPosition, MurdererConfrontation } from "./MurdererConfrontation";

describe("MurdererConfrontation", () => {
    it("places the murderer beside the primary doorway", () => {
        const room = new Room(
            "wine_cellar",
            new TileMap(25, 18, new Array(25 * 18).fill(0)),
            [{ x: 0, y: 9, targetRoom: "cellar_storage", spawnX: 17, spawnY: 9 }],
            [],
            []
        );

        expect(doorwayNpcPosition(room)).toEqual({ x: TILE_SIZE, y: 8 * TILE_SIZE });
    });

    it("steps through monologue lines and finishes once", () => {
        const confrontation = new MurdererConfrontation(["Ytte: One.", "Ytte: Two."]);
        const hall = new Room("hall", new TileMap(10, 10, new Array(100).fill(0)), [], [], []);
        const murderer = new NPC("cook", 0, 0, "Ytte", "Cook", "worker_man");

        confrontation.start(murderer, hall, (npc, targetRoom, x, y) => {
            npc.x = x;
            npc.y = y;
            targetRoom.npcs.push(npc);
        });

        expect(confrontation.getCurrentLine()).toBe("Ytte: One.");
        expect(confrontation.advance()).toBe("continue");
        expect(confrontation.getCurrentLine()).toBe("Ytte: Two.");
        expect(confrontation.advance()).toBe("done");
        expect(confrontation.active).toBe(false);
        expect(confrontation.complete).toBe(true);
        expect(confrontation.advance()).toBe("done");
    });
});
