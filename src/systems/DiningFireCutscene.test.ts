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
        footprintTiles: [
            { x: 10, y: 1 },
            { x: 14, y: 7 }
        ]
    };
    // Expand footprint to a rectangle for the hazard helper
    fireplace.footprintTiles = [];
    for (let x = 10; x <= 14; x++) {
        for (let y = 1; y <= 7; y++) {
            fireplace.footprintTiles.push({ x, y });
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
        expect(
            playerNearFireplaceHazard(player, player.width, player.height, room)
        ).toBe(true);
        player.y = 15 * TILE_SIZE;
        expect(
            playerNearFireplaceHazard(player, player.width, player.height, room)
        ).toBe(false);
    });
});

describe("DiningFireCutscene phases", () => {
    it("runs ignite through blackout then requests aftermath placement", () => {
        const cut = new DiningFireCutscene();
        cut.start();
        expect(cut.phase).toBe("ignite");

        let placed = false;
        for (let i = 0; i < 200 && !placed; i++) {
            const tick = cut.tick(0.1);
            if (tick.placeAftermath) placed = true;
        }
        expect(placed).toBe(true);
        expect(cut.phase).toBe("aftermath_setup");
    });

    it("advances aftermath dialog into drag_out", () => {
        const cut = new DiningFireCutscene();
        cut.start();
        // Fast-forward to aftermath dialog
        for (let i = 0; i < 300; i++) {
            const tick = cut.tick(0.1);
            if (tick.openAftermathDialog) break;
        }
        expect(cut.phase).toBe("aftermath_dialog");
        expect(cut.advanceDialog()).toBe("continue");
        expect(cut.advanceDialog()).toBe("next_phase");
        expect(cut.phase).toBe("drag_out");
    });
});
