import {Room} from "./Room";
import {TileMap} from "./TileMap";
import {TILE_DOOR, TILE_FLOOR, TILE_FURNITURE, TILE_WALL} from "./TileTypes";
import {Interactable} from "./Interactable";

const table: Interactable = {
    id: "table",
    name: "Large Oak Table",
    description: "A heavy oak table, scarred by years of use.",
    tiles: []
};

const shelves: Interactable = {
    id: "shelves",
    name: "Bookshelves",
    description: "Rows of leather-bound volumes. Some seem recently disturbed.",
    tiles: []
};


export function createLibrary(width: number, height: number): Room {
    const tiles = new Array(width * height).fill(TILE_FLOOR);

    // ─────────────────────────
    // OUTER WALLS
    // ─────────────────────────
    for (let x = 0; x < width; x++) {
        tiles[x] = TILE_WALL;
        tiles[(height - 1) * width + x] = TILE_WALL;
    }

    for (let y = 0; y < height; y++) {
        tiles[y * width] = TILE_WALL;
        tiles[y * width + (width - 1)] = TILE_WALL;
    }

    // ─────────────────────────
    // CENTRAL TABLE (3×2)
    // ─────────────────────────
    const cx = Math.floor(width / 2);
    const cy = Math.floor(height / 2);

    // central table (3x2)
    for (let y = cy; y <= cy + 1; y++) {
        for (let x = cx - 1; x <= cx + 1; x++) {
            tiles[y * width + x] = TILE_FURNITURE;
            table.tiles.push({x, y});
        }
    }

    // bookshelves
    for (let x = 2; x < width - 2; x++) {
        const y = height - 3;
        tiles[y * width + x] = TILE_FURNITURE;
        shelves.tiles.push({x, y});
    }

    // ─────────────────────────
    // DOOR (BOTTOM CENTER)
    // ─────────────────────────
    const doorX = Math.floor(width / 2);
    const doorY = height - 1;
    tiles[doorY * width + doorX] = TILE_DOOR;

    return new Room(
        "library",
        new TileMap(width, height, tiles),
        [
            {
                x: doorX,
                y: doorY,
                targetRoom: "hall",
                spawnX: doorX,
                spawnY: 1
            }
        ],
        [table, shelves]
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

    const cy = Math.floor(height / 2);
    tiles[cy * width + 3] = TILE_FURNITURE;
    tiles[cy * width + 4] = TILE_FURNITURE;
    tiles[cy * width + 5] = TILE_FURNITURE;


    return new Room(
        "hall",
        new TileMap(width, height, tiles),
        [
            {
                x: doorX,
                y: 0,
                targetRoom: "library",
                spawnX: doorX,
                spawnY: 1
            }
        ],        []
    );

}
