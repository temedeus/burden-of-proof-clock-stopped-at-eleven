import { describe, expect, it } from "vitest";
import { loadGameContent } from "../content/loadGameContent";
import { TILE_SIZE } from "../world/constants";
import { feetBlocked } from "../world/pathfinding";
import { createRoomFromConfig } from "../world/Rooms";
import { nearestKitchenStove } from "./KitchenPanSplash";
import { Player } from "../entities/Player";
import {
    KitchenTableVault,
    planKitchenVault,
    VAULT_LAND_PAUSE,
    VAULT_SECONDS
} from "./KitchenTableVault";

const T = TILE_SIZE;
const kitchen = () => createRoomFromConfig(loadGameContent().rooms.kitchen);

/** A 2×2-tile box whose feet sit on `feetRow`, centred on tile column `cx`. */
function at(cx: number, feetRow: number) {
    return { x: (cx - 1) * T, y: (feetRow - 1) * T, width: 2 * T, height: 2 * T };
}

describe("kitchen table vault", () => {
    it("lands Ytte in the stove corridor ahead of the detective, beside a stove", () => {
        const room = kitchen();
        const player = { ...at(5, 4), facing: "right" as const };
        const ytte = at(7, 9);
        const plan = planKitchenVault(room, ytte, player);
        expect(plan).not.toBeNull();
        // Ahead of where the detective will have run to by the time he lands
        expect(plan!.toX + T - (player.x + T)).toBeGreaterThanOrEqual(180 * VAULT_SECONDS + 3 * T);
        expect(feetBlocked(room.map, plan!.toX, plan!.toY, 2 * T, 2 * T)).toBe(false);

        // He fills the corridor: any route past him overlaps his body
        const landed = { x: plan!.toX, y: plan!.toY, width: 2 * T, height: 2 * T };
        for (let feetRow = 3; feetRow <= 5; feetRow++) {
            const passer = at(plan!.toX / T + 1, feetRow);
            if (feetBlocked(room.map, passer.x, passer.y, passer.width, passer.height)) continue;
            expect(passer.y < landed.y + landed.height && passer.y + passer.height > landed.y).toBe(true);
        }

        // Caught there, the struggle throws the stove pot
        const caught = new Player("player", landed.x - T, landed.y);
        expect(nearestKitchenStove(caught, room, T * 2.5)).not.toBeNull();
    });

    it("only fires with the detective in the corridor and Ytte across the tables", () => {
        const room = kitchen();
        // Detective in the open south half
        expect(planKitchenVault(room, at(7, 9), { ...at(10, 12), facing: "right" })).toBeNull();
        // Ytte already in the corridor behind them
        expect(planKitchenVault(room, at(3, 4), { ...at(8, 4), facing: "right" })).toBeNull();
        // Just climbing in from the west end: he cuts them off further east
        const climbing = planKitchenVault(room, at(7, 9), { ...at(2, 4), facing: "up" });
        expect(climbing).not.toBeNull();
        expect(climbing!.toX).toBeGreaterThan(at(2, 4).x);
        // Too far down the room to leap the table
        expect(planKitchenVault(room, at(7, 15), { ...at(5, 4), facing: "right" })).toBeNull();
    });

    it("arcs over, lands, then gives chase after a beat", () => {
        const vault = new KitchenTableVault();
        vault.start({ fromX: 0, fromY: 9 * T, toX: 4 * T, toY: 3 * T });
        vault.tick(VAULT_SECONDS / 2);
        expect(vault.airborne).toBe(true);
        // Mid-leap he's lifted above the straight line between take-off and landing
        expect(vault.offset().y).toBeLessThan((3 * T - 9 * T) / 2);
        const land = vault.tick(VAULT_SECONDS / 2 + 0.01);
        expect(land.landed).toBe(true);
        expect(vault.shoutRemaining).toBeGreaterThan(0);
        expect(vault.tick(VAULT_LAND_PAUSE).resume).toBe(true);
        expect(vault.active).toBe(false);
        expect(vault.used).toBe(true);
    });
});
