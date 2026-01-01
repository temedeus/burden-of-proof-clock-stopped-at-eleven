import { Room } from "./Room";
import { TileMap } from "./TileMap";
import { TILE_FLOOR, TILE_WALL, TILE_DOOR } from "./TileTypes";

export function createLibrary(width: number, height: number): Room {
    const tiles = new Array(width * height).fill(TILE_FLOOR);

    // walls
    for (let x = 0; x < width; x++) {
        tiles[x] = TILE_WALL;
        tiles[(height - 1) * width + x] = TILE_WALL;
    }
    for (let y = 0; y < height; y++) {
        tiles[y * width] = TILE_WALL;
        tiles[y * width + (width - 1)] = TILE_WALL;
    }

    // door at bottom center
    const doorX = Math.floor(width / 2);
    const doorY = height - 1;
    tiles[doorY * width + doorX] = TILE_DOOR;

    return new Room(
        "library",
        new TileMap(width, height, tiles),
        [{
            x: doorX,
            y: doorY,
            targetRoom: "hall",
            spawnX: doorX,
            spawnY: 1
        }]
    );
}

export function createHall(width: number, height: number): Room {
    const tiles = new Array(width * height).fill(TILE_FLOOR);

    // walls
    for (let x = 0; x < width; x++) {
        tiles[x] = TILE_WALL;
        tiles[(height - 1) * width + x] = TILE_WALL;
    }
    for (let y = 0; y < height; y++) {
        tiles[y * width] = TILE_WALL;
        tiles[y * width + (width - 1)] = TILE_WALL;
    }

    // door at top center
    const doorX = Math.floor(width / 2);
    tiles[0 * width + doorX] = TILE_DOOR;

    return new Room(
        "hall",
        new TileMap(width, height, tiles),
        [{
            x: doorX,
            y: 0,
            targetRoom: "library",
            spawnX: doorX,
            spawnY: height - 2
        }]
    );
}
