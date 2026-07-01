import { Player } from "../entities/Player";
import { TILE_SIZE } from "../world/constants";
import type { DoorExit, Room } from "../world/Room";

function isPerimeterExit(exit: Pick<DoorExit, "x" | "y">, width: number, height: number): boolean {
    return exit.y === 0 || exit.y === height - 1 || exit.x === 0 || exit.x === width - 1;
}

function overlapsExitZone(
    exit: Pick<DoorExit, "x" | "y">,
    playerLeftTile: number,
    playerRightTile: number,
    playerTopTile: number,
    playerFeetRow: number,
    playerFeetCol: number,
    room: Room
): boolean {
    const doorLeft = exit.x - 1;
    const doorRight = exit.x + 2;
    const doorTop = exit.y - 1;
    const doorBottom = exit.y + 2;

    if (isPerimeterExit(exit, room.map.width, room.map.height)) {
        const isTopOrBottom = exit.y === 0 || exit.y === room.map.height - 1;
        if (isTopOrBottom) {
            const horizontalOverlap = playerLeftTile < doorRight && playerRightTile > doorLeft;
            const verticalOverlap =
                exit.y === room.map.height - 1
                    ? playerFeetRow >= exit.y
                    : playerTopTile <= exit.y;
            return horizontalOverlap && verticalOverlap;
        }
        const verticalOverlap = playerTopTile < doorBottom && playerFeetRow >= doorTop;
        const horizontalOverlap =
            exit.x === room.map.width - 1 ? playerFeetCol >= exit.x : playerLeftTile <= exit.x;
        return horizontalOverlap && verticalOverlap;
    }

    const horizontalOverlap = playerLeftTile < doorRight && playerRightTile > doorLeft;
    const verticalOverlap = playerTopTile < doorBottom && playerFeetRow >= doorTop;
    return horizontalOverlap && verticalOverlap;
}

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
        const playerFeetRow = Math.ceil((player.y + player.height) / TILE_SIZE) - 1;
        const playerFeetCol = Math.ceil((player.x + player.width) / TILE_SIZE) - 1;

        for (const exit of currentRoom.exits) {
            if (isExitBlocked(exit)) continue;

            if (
                overlapsExitZone(
                    exit,
                    playerLeftTile,
                    playerRightTile,
                    playerTopTile,
                    playerFeetRow,
                    playerFeetCol,
                    currentRoom
                )
            ) {
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
        const roomW = nextRoom.map.width;
        const roomH = nextRoom.map.height;
        const playerTileW = Math.ceil(player.width / TILE_SIZE);
        const playerTileH = Math.ceil(player.height / TILE_SIZE);

        const entryExit = nextRoom.exits.find((e) => e.targetRoom === fromRoomId);

        if (entryExit) {
            if (isPerimeterExit(entryExit, roomW, roomH)) {
                const isTopOrBottom = entryExit.y === 0 || entryExit.y === roomH - 1;

                if (isTopOrBottom) {
                    player.x = (entryExit.x - Math.floor(playerTileW / 2)) * TILE_SIZE;
                    if (entryExit.y === 0) {
                        player.y = TILE_SIZE;
                    } else {
                        player.y = (entryExit.y - playerTileH) * TILE_SIZE;
                    }
                } else {
                    player.y = (entryExit.y - Math.floor(playerTileH / 2)) * TILE_SIZE;
                    if (entryExit.x === 0) {
                        player.x = TILE_SIZE;
                    } else {
                        player.x = (entryExit.x - playerTileW) * TILE_SIZE;
                    }
                }
            } else {
                player.x = (entryExit.x - Math.floor(playerTileW / 2)) * TILE_SIZE;
                player.y = (entryExit.y - Math.floor(playerTileH / 2)) * TILE_SIZE;
            }
        } else {
            player.x = spawnX * TILE_SIZE;
            player.y = spawnY * TILE_SIZE;
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
