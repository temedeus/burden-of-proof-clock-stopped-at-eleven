import { Player } from "../entities/Player";
import { TILE_SIZE } from "../world/constants";
import type { DoorExit, Room } from "../world/Room";

export interface RoomTransitionResult {
    nextRoom: Room;
    targetRoomId: string;
    fromRoomId: string;
    spawnX: number;
    spawnY: number;
}

export class RoomTransitionService {
    roomTransitionCooldown = 0;

    checkTransition(
        player: Player,
        currentRoom: Room,
        rooms: Record<string, Room>,
        isExitBlocked: (exit: DoorExit) => boolean
    ): RoomTransitionResult | null {
        if (this.roomTransitionCooldown > 0) return null;

        const playerLeftTile = Math.floor(player.x / TILE_SIZE);
        const playerRightTile = Math.ceil((player.x + player.width) / TILE_SIZE);
        const playerTopTile = Math.floor(player.y / TILE_SIZE);
        const playerBottomTile = Math.ceil((player.y + player.height) / TILE_SIZE);

        for (const exit of currentRoom.exits) {
            if (isExitBlocked(exit)) continue;

            const isTopOrBottom = exit.y === 0 || exit.y === currentRoom.map.height - 1;
            let overlapsDoor = false;

            if (isTopOrBottom) {
                const doorLeft = exit.x - 1;
                const doorRight = exit.x + 2;
                const horizontalOverlap = playerLeftTile < doorRight && playerRightTile > doorLeft;
                const verticalOverlap = playerTopTile <= exit.y && playerBottomTile >= exit.y;
                overlapsDoor = horizontalOverlap && verticalOverlap;
            } else {
                const doorTop = exit.y - 1;
                const doorBottom = exit.y + 2;
                const verticalOverlap = playerTopTile < doorBottom && playerBottomTile > doorTop;
                const horizontalOverlap = playerLeftTile <= exit.x && playerRightTile > exit.x;
                overlapsDoor = horizontalOverlap && verticalOverlap;
            }

            if (overlapsDoor) {
                const nextRoom = rooms[exit.targetRoom];
                if (!nextRoom) continue;

                this.roomTransitionCooldown = 0.65;
                return {
                    nextRoom,
                    targetRoomId: exit.targetRoom,
                    fromRoomId: currentRoom.id,
                    spawnX: exit.spawnX,
                    spawnY: exit.spawnY
                };
            }
        }

        return null;
    }

    tickCooldown(dt: number): void {
        this.roomTransitionCooldown = Math.max(0, this.roomTransitionCooldown - dt);
    }

    placePlayerAfterRoomTransition(
        player: Player,
        fromRoomId: string,
        nextRoom: Room,
        spawnX: number,
        spawnY: number
    ): void {
        player.x = spawnX * TILE_SIZE;
        player.y = spawnY * TILE_SIZE;

        const entryExit = nextRoom.exits.find((e) => e.targetRoom === fromRoomId);
        if (!entryExit) return;

        const insetTiles = 3;
        const roomW = nextRoom.map.width;
        const roomH = nextRoom.map.height;

        if (entryExit.y === 0) {
            player.y = Math.max(player.y, insetTiles * TILE_SIZE);
        } else if (entryExit.y === roomH - 1) {
            player.y = Math.min(player.y, (roomH - 1 - insetTiles) * TILE_SIZE);
        }

        if (entryExit.x === 0) {
            player.x = Math.max(player.x, insetTiles * TILE_SIZE);
        } else if (entryExit.x === roomW - 1) {
            player.x = Math.min(player.x, (roomW - 1 - insetTiles) * TILE_SIZE);
        }

        this.clampPlayerInsideRoom(player, nextRoom);
    }

    clampPlayerInsideRoom(player: Player, room: Room): void {
        const minX = TILE_SIZE;
        const minY = TILE_SIZE;
        const maxX = (room.map.width - 2) * TILE_SIZE;
        const maxY = (room.map.height - 2) * TILE_SIZE;
        player.x = Math.min(Math.max(player.x, minX), maxX);
        player.y = Math.min(Math.max(player.y, minY), maxY);
    }
}
