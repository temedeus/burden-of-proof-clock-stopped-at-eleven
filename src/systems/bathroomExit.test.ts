import { describe, expect, it } from "vitest";
import { loadRoomCatalog } from "../content/loadCatalog";
import { Player } from "../entities/Player";
import { TILE_SIZE } from "../world/constants";
import { createRoomFromConfig } from "../world/Rooms";
import { TILE_DOOR, TILE_FURNITURE } from "../world/TileTypes";
import { RoomTransitionService } from "./RoomTransitionService";

function playerBlocksAt(
    player: Player,
    x: number,
    y: number,
    map: ReturnType<typeof createRoomFromConfig>["map"]
): boolean {
    const left = Math.floor(x / TILE_SIZE);
    const right = Math.ceil((x + player.width) / TILE_SIZE) - 1;
    const top = Math.floor(y / TILE_SIZE);
    const bottom = Math.ceil((y + player.height) / TILE_SIZE) - 1;

    for (let ty = top; ty <= bottom; ty++) {
        for (let tx = left; tx <= right; tx++) {
            if (map.isBlocked(tx, ty)) return true;
            if (map.getTile(tx, bottom) === TILE_FURNITURE) return true;
        }
    }
    return false;
}

describe("bathroom A (guest west, bathroom east door)", () => {
    const rooms = loadRoomCatalog();
    const bathroom = createRoomFromConfig(rooms.bathroom_a, undefined, undefined, rooms);
    const guest = createRoomFromConfig(rooms.guest_room_a, undefined, undefined, rooms);
    const exit = bathroom.exits[0];

    it("places door tiles on the east wall", () => {
        expect(exit.x).toBe(11);
        for (let y = exit.y - 1; y <= exit.y + 1; y++) {
            expect(bathroom.map.getTile(11, y)).toBe(TILE_DOOR);
        }
    });

    it("round-trips through the east bathroom door", () => {
        const service = new RoomTransitionService();
        const player = new Player("player", 0, 0);
        service.placePlayerAfterRoomTransition(player, "guest_room_a", bathroom, 10, 4);

        let blocked = false;
        for (let x = player.x; x <= 9 * TILE_SIZE + 16; x += 8) {
            if (playerBlocksAt(player, x, player.y, bathroom.map)) blocked = true;
        }
        expect(blocked).toBe(false);

        player.x = 9 * TILE_SIZE + 16;
        const back = service.checkTransition(
            player,
            bathroom,
            { bathroom_a: bathroom, guest_room_a: guest },
            () => false
        );
        expect(back?.targetRoomId).toBe("guest_room_a");
    });
});

describe("bathroom B (guest east, bathroom west door)", () => {
    const rooms = loadRoomCatalog();
    const bathroom = createRoomFromConfig(rooms.bathroom_b, undefined, undefined, rooms);
    const guest = createRoomFromConfig(rooms.guest_room_b, undefined, undefined, rooms);
    const exit = bathroom.exits[0];

    it("places door tiles on the west wall", () => {
        expect(exit.x).toBe(0);
        for (let y = exit.y - 1; y <= exit.y + 1; y++) {
            expect(bathroom.map.getTile(0, y)).toBe(TILE_DOOR);
        }
    });

    it("mirrors bathroom A fixtures horizontally", () => {
        const bathroomA = createRoomFromConfig(rooms.bathroom_a, undefined, undefined, rooms);
        const width = 12;
        const mirrorX = (x: number, w: number) => width - x - w;
        const a = rooms.bathroom_a.furniture;
        const b = rooms.bathroom_b.furniture;

        for (let i = 0; i < a.length; i++) {
            const aCfg = rooms.bathroom_a.furniture[i];
            const bCfg = b.find((f) => f.furnitureId === aCfg.furnitureId)!;
            const furn = rooms.bathroom_a.furniture[i];
            const furnWidth =
                furn.furnitureId === "bathtub" ? 3 : furn.furnitureId === "toilet" ? 2 : 2;
            expect(bCfg.x).toBe(mirrorX(aCfg.x as number, furnWidth));
            expect(bCfg.y).toBe(aCfg.y);
        }
    });

    it("round-trips through the west bathroom door", () => {
        const service = new RoomTransitionService();
        const player = new Player("player", 0, 0);
        service.placePlayerAfterRoomTransition(player, "guest_room_b", bathroom, 1, 4);

        let blocked = false;
        for (let x = player.x; x >= 0; x -= 8) {
            if (playerBlocksAt(player, x, player.y, bathroom.map)) blocked = true;
        }
        expect(blocked).toBe(false);

        player.x = 0;
        const back = service.checkTransition(
            player,
            bathroom,
            { bathroom_b: bathroom, guest_room_b: guest },
            () => false
        );
        expect(back?.targetRoomId).toBe("guest_room_b");
    });
});

describe("guest room bathroom doors", () => {
    const rooms = loadRoomCatalog();

    it("puts guest room A bathroom door on the west wall", () => {
        const exit = rooms.guest_room_a.exits.find((e) => e.targetRoom === "bathroom_a");
        expect(exit?.x).toBe(0);
    });

    it("puts guest room B bathroom door on the east wall", () => {
        const exit = rooms.guest_room_b.exits.find((e) => e.targetRoom === "bathroom_b");
        expect(exit?.x).toBe(17);
    });

    it("puts master bedroom bathroom door on the east wall", () => {
        const exit = rooms.master_bedroom.exits.find((e) => e.targetRoom === "bathroom_master");
        expect(exit?.x).toBe(24);
    });
});

describe("bathroom master (master east, bathroom west door)", () => {
    const rooms = loadRoomCatalog();
    const bathroom = createRoomFromConfig(rooms.bathroom_master, undefined, undefined, rooms);
    const master = createRoomFromConfig(rooms.master_bedroom, undefined, undefined, rooms);

    it("round-trips through the west bathroom door", () => {
        const service = new RoomTransitionService();
        const player = new Player("player", 0, 0);
        service.placePlayerAfterRoomTransition(player, "master_bedroom", bathroom, 1, 4);

        let blocked = false;
        for (let x = player.x; x >= 0; x -= 8) {
            if (playerBlocksAt(player, x, player.y, bathroom.map)) blocked = true;
        }
        expect(blocked).toBe(false);

        player.x = 0;
        const back = service.checkTransition(
            player,
            bathroom,
            { bathroom_master: bathroom, master_bedroom: master },
            () => false
        );
        expect(back?.targetRoomId).toBe("master_bedroom");
    });
});
