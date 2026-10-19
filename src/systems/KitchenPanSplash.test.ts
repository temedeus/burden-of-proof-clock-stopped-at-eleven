import { describe, expect, it } from "vitest";
import { loadGameContent } from "../content/loadGameContent";
import { NPC } from "../entities/NPC";
import { Player } from "../entities/Player";
import { furnitureActorFromInteractable } from "../render/roomScene";
import { createRoomFromConfig } from "../world/Rooms";
import { TILE_SIZE } from "../world/constants";
import { isStovePotTaken } from "../world/kitchenStovePot";
import {
    getKitchenStoveBounds,
    KitchenPanSplash,
    nearestKitchenStove,
    playerNearKitchenStove,
    type PanSplashTick
} from "./KitchenPanSplash";

function kitchen() {
    return createRoomFromConfig(loadGameContent().rooms.kitchen);
}

describe("KitchenPanSplash", () => {
    it("finds every stove in the kitchen", () => {
        expect(getKitchenStoveBounds(kitchen())).toHaveLength(3);
    });

    it("is in reach just below a stove but not across the room", () => {
        const room = kitchen();
        const stove = getKitchenStoveBounds(room)[0];
        const player = new Player("player", stove.x, stove.y + stove.h + TILE_SIZE / 2);
        expect(playerNearKitchenStove(player, room)).toBe(true);

        player.y = (room.map.height - 3) * TILE_SIZE;
        expect(playerNearKitchenStove(player, room)).toBe(false);
    });

    it("walks to the stove, takes the pot, throws, and leaves it on the floor", () => {
        const room = kitchen();
        const bounds = getKitchenStoveBounds(room)[0];
        const player = new Player("player", bounds.x, bounds.y + bounds.h + TILE_SIZE);
        const ytte = new NPC("cook", player.x + TILE_SIZE * 8, player.y + TILE_SIZE, "Chef Ytte");
        const stove = nearestKitchenStove(player, room)!;
        const footprint = stove.footprintTiles?.length ? stove.footprintTiles : stove.tiles;
        const [sx, sy] = [Math.min(...footprint.map((t) => t.x)), Math.min(...footprint.map((t) => t.y))];
        const drawRect = furnitureActorFromInteractable(stove, () => 0, {
            width: room.map.width,
            height: room.map.height
        }).drawRect;

        const splash = new KitchenPanSplash();
        splash.start(player, ytte, stove, drawRect, room.map, room.npcs);
        expect(isStovePotTaken(sx, sy)).toBe(false);

        const ticks: PanSplashTick[] = [];
        for (let i = 0; i < 200 && splash.active; i++) {
            ticks.push(splash.update(1 / 60, player));
            if (i === 40) expect(isStovePotTaken(sx, sy)).toBe(true);
        }
        expect(ticks.filter((t) => t.throwStarted)).toHaveLength(1);
        expect(ticks.filter((t) => t.landed)).toHaveLength(1);
        expect(ticks.findIndex((t) => t.throwStarted)).toBeLessThan(ticks.findIndex((t) => t.landed));
        // Turned to face Ytte for the throw, standing in front of the stove
        expect(player.facing).toBe("right");
        expect(player.wouldCollideAt(player.x, player.y, room.map, [])).toBe(false);
        expect(splash.worldActors(player)).toHaveLength(1);

        splash.stop();
        expect(isStovePotTaken(sx, sy)).toBe(false);
        expect(splash.worldActors(player)).toEqual([]);
    });
});
