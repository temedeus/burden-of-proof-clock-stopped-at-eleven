import { describe, expect, it } from "vitest";
import { MooseLickGag } from "./MooseLickGag";
import { Player } from "../entities/Player";
import { TileMap } from "../world/TileMap";
import { TILE_SIZE } from "../world/constants";
import type { Interactable } from "../world/Interactable";

const moose = {
    tiles: [
        { x: 16, y: 10 },
        { x: 17, y: 10 },
        { x: 16, y: 11 },
        { x: 17, y: 11 }
    ],
    spriteName: "stuffed_moose"
} as unknown as Interactable;

describe("MooseLickGag", () => {
    it("walks the player to the moose's west side, licks, then finishes", () => {
        const map = new TileMap(20, 14, new Array(20 * 14).fill(0));
        const player = new Player("player", 16 * TILE_SIZE, 13 * TILE_SIZE - TILE_SIZE * 2);
        const gag = new MooseLickGag();
        gag.start(player, moose, map, []);

        let licked = false;
        let done = false;
        let maxTilt = 0;
        let maxTongue = 0;
        for (let i = 0; i < 400 && !done; i++) {
            const tick = gag.update(0.02, player);
            if (tick.playLick) licked = true;
            if (tick.done) done = true;
            maxTilt = Math.min(maxTilt, gag.tiltAngle);
            maxTongue = Math.max(maxTongue, gag.tongueExtension);
        }

        expect(player.x).toBe(16 * TILE_SIZE - player.width + 20);
        expect(player.y + player.height).toBe(12.5 * TILE_SIZE);
        expect(licked).toBe(true);
        expect(done).toBe(true);
        expect(maxTilt).toBeLessThan(0);
        expect(maxTongue).toBe(1);
        expect(gag.active).toBe(false);
        expect(player.mooseLickT).toBeNull();
    });
});
