import { describe, expect, it } from "vitest";
import { loadGameContent } from "../content/loadGameContent";
import { createRoomFromConfig } from "../world/Rooms";
import { Player } from "../entities/Player";
import { TILE_SIZE } from "../world/constants";
import { getBrokenChandelier, resetBallroomChandeliers } from "../world/ballroomChandeliers";
import {
    BALLROOM_ID,
    BallroomEasterEggs,
    CHANDELIER_DODGED_TEXT,
    CHANDELIER_HIT_TEXT,
    GROUNDSKEEPER_WINDOW_DIALOG,
    chandelierImpact
} from "./BallroomEasterEggs";

function ballroom() {
    const content = loadGameContent();
    return createRoomFromConfig(content.rooms[BALLROOM_ID], undefined, undefined, content.rooms);
}

function run(eggs: BallroomEasterEggs, player: Player, room: ReturnType<typeof ballroom>, dodgeAt: number | null) {
    let dialog: string | undefined;
    let crashed = false;
    for (let i = 0; i < 300 && !dialog; i++) {
        const t = i * 0.02;
        const tick = eggs.updateTrap(0.02, player, room.map, room.npcs, dodgeAt !== null && Math.abs(t - dodgeAt) < 0.01);
        if (tick.crash) crashed = true;
        dialog = tick.dialog;
    }
    return { dialog, crashed };
}

function standUnderChandelier(room: ReturnType<typeof ballroom>, player: Player) {
    const chandelier = room.interactables.find((o) => o.spriteName === "chandelier")!;
    const impact = chandelierImpact(chandelier, room);
    player.x = impact.impactX - player.width / 2;
    player.y = impact.impactY - player.height;
    return impact;
}

describe("BallroomEasterEggs", () => {
    it("window scare: detective jumps back, groundskeeper speaks, then it is a plain look", () => {
        const room = ballroom();
        const eggs = new BallroomEasterEggs();
        const player = new Player("p", 17 * TILE_SIZE, (room.northClerestoryRows + 2) * TILE_SIZE - TILE_SIZE * 2);
        player.facing = "up";
        const startY = player.y;

        expect(eggs.interactWindow(player, room, room.map, room.npcs)).toBe("scare");
        let dialog: string | undefined;
        let sting = false;
        for (let i = 0; i < 200 && !dialog; i++) {
            const tick = eggs.updateScare(0.02, player);
            if (tick.sting) sting = true;
            dialog = tick.dialog;
        }
        expect(sting).toBe(true);
        expect(dialog).toBe(GROUNDSKEEPER_WINDOW_DIALOG);
        expect(player.y).toBeGreaterThan(startY);

        eggs.onScareDialogClosed();
        expect(eggs.windowScareDone).toBe(true);
        expect(eggs.chandelierArmed).toBe(true);
        player.y = startY;
        expect(eggs.interactWindow(player, room, room.map, room.npcs)).toBe("look");
    });

    it("arms the chandelier as soon as the window has been checked", () => {
        resetBallroomChandeliers();
        const room = ballroom();
        const eggs = new BallroomEasterEggs();
        const player = new Player("p", 0, 0);
        standUnderChandelier(room, player);

        expect(eggs.checkTrap(player, room)).toBe(false);
        eggs.onScareDialogClosed();
        expect(eggs.checkTrap(player, room)).toBe(true);
    });

    it("dodging in time moves the detective clear; missing it knocks them down", () => {
        for (const dodgeAt of [0.4, null]) {
            resetBallroomChandeliers();
            const room = ballroom();
            const eggs = new BallroomEasterEggs();
            eggs.chandelierArmed = true;
            const player = new Player("p", 0, 0);
            const impact = standUnderChandelier(room, player);
            expect(eggs.checkTrap(player, room)).toBe(true);
            const { dialog, crashed } = run(eggs, player, room, dodgeAt);
            expect(crashed).toBe(true);
            expect(getBrokenChandelier()).toBe(impact.key);
            expect(eggs.chandelierArmed).toBe(false);
            expect(player.cutsceneFall).toBe(0);
            if (dodgeAt !== null) {
                expect(dialog).toBe(CHANDELIER_DODGED_TEXT);
                expect(Math.abs(player.x + player.width / 2 - impact.impactX)).toBeGreaterThan(40);
            } else {
                expect(dialog).toBe(CHANDELIER_HIT_TEXT);
            }
        }
        resetBallroomChandeliers();
    });
});
