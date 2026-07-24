import { describe, expect, it } from "vitest";
import { NPC } from "../entities/NPC";
import { TILE_SIZE } from "../world/constants";
import { Interactable } from "../world/Interactable";
import { Room } from "../world/Room";
import { TileMap } from "../world/TileMap";
import {
    DiningFireCutscene,
    entityCenterOverlapsRect,
    getFireplaceHazardBounds,
    playerNearFireplaceHazard
} from "./DiningFireCutscene";

function makeDiningWithFireplace(): Room {
    const fireplace: Interactable = {
        id: "fireplace",
        name: "Fireplace",
        description: "Cold ashes fill the hearth.",
        tiles: [
            { x: 10, y: 1 },
            { x: 11, y: 1 },
            { x: 12, y: 1 },
            { x: 13, y: 1 },
            { x: 14, y: 1 },
            { x: 10, y: 2 },
            { x: 11, y: 2 },
            { x: 12, y: 2 },
            { x: 13, y: 2 },
            { x: 14, y: 2 }
        ],
        footprintTiles: []
    };
    for (let x = 10; x <= 14; x++) {
        for (let y = 1; y <= 7; y++) {
            fireplace.footprintTiles!.push({ x, y });
        }
    }
    return new Room(
        "dining",
        new TileMap(25, 18, new Array(25 * 18).fill(0)),
        [{ x: 12, y: 17, targetRoom: "hall", spawnX: 1, spawnY: 8 }],
        [fireplace],
        []
    );
}

describe("DiningFireCutscene hazard", () => {
    it("detects shove into fireplace apron", () => {
        const room = makeDiningWithFireplace();
        const hazard = getFireplaceHazardBounds(room);
        expect(hazard).not.toBeNull();
        const npc = new NPC("cook", 12 * TILE_SIZE, 8 * TILE_SIZE, "???", undefined, "hooded_figure");
        expect(entityCenterOverlapsRect(npc, hazard!, npc.width, npc.height)).toBe(true);
        npc.y = 14 * TILE_SIZE;
        expect(entityCenterOverlapsRect(npc, hazard!, npc.width, npc.height)).toBe(false);
    });

    it("shows proximity hint near the hearth", () => {
        const room = makeDiningWithFireplace();
        const player = new NPC("player", 12 * TILE_SIZE, 9 * TILE_SIZE, "Detective");
        expect(playerNearFireplaceHazard(player, player.width, player.height, room)).toBe(true);
        player.y = 15 * TILE_SIZE;
        expect(playerNearFireplaceHazard(player, player.width, player.height, room)).toBe(false);
    });
});

describe("DiningFireCutscene phases", () => {
    it("throws into the fire then reaches drag placement after collapse/blackout", () => {
        const cut = new DiningFireCutscene();
        cut.startThrow(100, 200, 150, 80);
        expect(cut.phase).toBe("throw_into_fire");

        let placedDrag = false;
        for (let i = 0; i < 400 && !placedDrag; i++) {
            const tick = cut.tick(0.1);
            if (tick.placeDrag) placedDrag = true;
        }
        expect(placedDrag).toBe(true);
        expect(cut.phase).toBe("drag_setup");
    });

    it("advances wake dialog into baroness exit", () => {
        const cut = new DiningFireCutscene();
        cut.startThrow(0, 0, 10, 10);
        for (let i = 0; i < 500; i++) {
            const tick = cut.tick(0.1);
            if (tick.openWakeDialog) break;
        }
        expect(cut.phase).toBe("wake_dialog");
        expect(cut.advanceDialog()).toBe("continue");
        expect(cut.advanceDialog()).toBe("continue");
        expect(cut.advanceDialog()).toBe("next_phase");
        expect(cut.phase).toBe("baroness_exit");
    });
});
