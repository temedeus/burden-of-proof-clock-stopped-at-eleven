import { describe, expect, it } from "vitest";
import { NPC } from "../entities/NPC";
import { TILE_SIZE } from "../world/constants";
import { Interactable } from "../world/Interactable";
import { Room } from "../world/Room";
import { TileMap } from "../world/TileMap";
import {
    DiningFireCutscene,
    diningHearthLandingPosition,
    diningTablePanicWaypoints,
    diningTableRetreatWaypoints,
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

function withDiningTable(room: Room): Room {
    const table: Interactable = {
        id: "dining_table",
        name: "Dining table",
        description: "table",
        tiles: [],
        footprintTiles: []
    };
    for (let x = 8; x <= 15; x++) {
        for (let y = 9; y <= 11; y++) {
            table.footprintTiles!.push({ x, y });
        }
    }
    room.interactables.push(table);
    return room;
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

    it("lands Ytte on the apron in front of the hearth", () => {
        const room = makeDiningWithFireplace();
        const landing = diningHearthLandingPosition(room, 32, 48);
        expect(landing).not.toBeNull();
        const hazard = getFireplaceHazardBounds(room)!;
        expect(landing!.y + 48 * 0.5).toBeGreaterThan(hazard.y + hazard.h * 0.5);
        expect(landing!.x + 16).toBeGreaterThan(hazard.x);
        expect(landing!.x + 16).toBeLessThan(hazard.x + hazard.w);
    });
});

describe("DiningFireCutscene retreat path", () => {
    it("routes east of the table then south past it", () => {
        const room = withDiningTable(makeDiningWithFireplace());

        const [via, to] = diningTableRetreatWaypoints(room, 10 * TILE_SIZE, 8 * TILE_SIZE, 32);
        expect(via.x).toBeGreaterThan(15 * TILE_SIZE);
        expect(via.y).toBe(8 * TILE_SIZE);
        expect(to.x).toBe(via.x);
        expect(to.y).toBeGreaterThanOrEqual((room.map.height - 4) * TILE_SIZE);
    });
});

describe("DiningFireCutscene panic path", () => {
    it("skirts the table instead of cutting through its footprint", () => {
        const room = withDiningTable(makeDiningWithFireplace());
        const waypoints = diningTablePanicWaypoints(room);
        expect(waypoints.length).toBeGreaterThanOrEqual(4);

        const tableMinX = 8 * TILE_SIZE;
        const tableMaxX = 16 * TILE_SIZE;
        const tableMinY = 9 * TILE_SIZE;
        const tableMaxY = 12 * TILE_SIZE;
        for (const p of waypoints) {
            const insideX = p.x > tableMinX && p.x < tableMaxX;
            const insideY = p.y > tableMinY && p.y < tableMaxY;
            expect(insideX && insideY).toBe(false);
        }
    });
});

describe("DiningFireCutscene phases", () => {
    it("throws into the fire then reaches drag placement after collapse/blackout", () => {
        const cut = new DiningFireCutscene();
        cut.startThrow(100, 200, 150, 80);
        expect(cut.phase).toBe("throw_into_fire");
        expect(cut.ytteOnFire).toBe(false);

        let placedDrag = false;
        let openedPanicCry = false;
        for (let i = 0; i < 400 && !placedDrag; i++) {
            const tick = cut.tick(0.1);
            if (tick.openPanicCry) openedPanicCry = true;
            if (cut.phase === "ignite" || cut.phase === "panic_run") {
                expect(cut.ytteOnFire).toBe(true);
            }
            if (tick.placeDrag) placedDrag = true;
        }
        expect(openedPanicCry).toBe(true);
        expect(placedDrag).toBe(true);
        expect(cut.phase).toBe("drag_setup");
    });

    it("opens aftermath dialog before drag-out, then wake dialog into baroness exit", () => {
        const cut = new DiningFireCutscene();
        cut.startThrow(0, 0, 10, 10);

        let openedAftermath = false;
        for (let i = 0; i < 500; i++) {
            const tick = cut.tick(0.1);
            if (tick.openAftermathDialog) {
                openedAftermath = true;
                break;
            }
        }
        expect(openedAftermath).toBe(true);
        expect(cut.phase).toBe("aftermath_dialog");
        expect(cut.advanceDialog()).toBe("continue");
        expect(cut.advanceDialog()).toBe("next_phase");
        expect(cut.phase).toBe("drag_out");

        let openedWake = false;
        for (let i = 0; i < 500; i++) {
            const tick = cut.tick(0.1);
            if (tick.openWakeDialog) {
                openedWake = true;
                break;
            }
        }
        expect(openedWake).toBe(true);
        expect(cut.phase).toBe("wake_dialog");
        expect(cut.advanceDialog()).toBe("continue");
        expect(cut.advanceDialog()).toBe("continue");
        expect(cut.advanceDialog()).toBe("continue");
        expect(cut.advanceDialog()).toBe("next_phase");
        expect(cut.phase).toBe("baroness_exit");

        let openedThought = false;
        for (let i = 0; i < 50; i++) {
            const tick = cut.tick(0.1);
            if (tick.openWakeThought) {
                openedThought = true;
                break;
            }
        }
        expect(openedThought).toBe(true);
        expect(cut.phase).toBe("wake_thought");
        expect(cut.advanceDialog()).toBe("next_phase");
        expect(cut.phase).toBe("done");
    });
});

describe("DiningFireCutscene spreading fire", () => {
    function burningScene(): { scene: DiningFireCutscene; room: Room } {
        const room = withDiningTable(makeDiningWithFireplace());
        const scene = new DiningFireCutscene();
        scene.startThrow(0, 0, 10, 10);
        // Advance through the throw into "ignite" so the figure is on fire
        for (let i = 0; i < 40; i++) scene.tick(0.05);
        return { scene, room };
    }

    it("drops a trail of fires behind the running figure", () => {
        const { scene, room } = burningScene();
        expect(scene.ytteOnFire).toBe(true);
        for (let x = 2; x < 6; x += 0.25) {
            scene.spreadFire(x * TILE_SIZE, 5 * TILE_SIZE, room);
        }
        const floor = scene.fires.filter((f) => f.source === "floor");
        expect(floor.length).toBeGreaterThanOrEqual(3);
    });

    it("ignites the dining table once when the figure passes close to it", () => {
        const { scene, room } = burningScene();
        scene.spreadFire(12 * TILE_SIZE, 8 * TILE_SIZE, room);
        scene.spreadFire(12.5 * TILE_SIZE, 8 * TILE_SIZE, room);
        const table = scene.fires.filter((f) => f.source === "dining_table");
        expect(table.length).toBe(6);
        // Furniture fires sort at the table's bottom so they draw over it
        expect(table.every((f) => f.sortY > 11 * TILE_SIZE)).toBe(true);
    });

    it("does not ignite furniture that is out of range", () => {
        const { scene, room } = burningScene();
        scene.spreadFire(2 * TILE_SIZE, 2 * TILE_SIZE, room);
        expect(scene.fires.some((f) => f.source === "dining_table")).toBe(false);
    });

    it("grows fires over time and clears them on reset", () => {
        const { scene, room } = burningScene();
        scene.spreadFire(3 * TILE_SIZE, 5 * TILE_SIZE, room);
        const spot = scene.fires[0];
        expect(scene.fireGrowth(spot)).toBeLessThan(0.1);
        scene.tick(1);
        expect(scene.fireGrowth(spot)).toBeGreaterThan(0.5);
        scene.reset();
        expect(scene.fires).toHaveLength(0);
    });
});
