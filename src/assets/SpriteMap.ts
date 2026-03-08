/**
 * Sprite mapping system for the spritesheet
 * Spritesheet dimensions: 1536x1024 pixels
 * Sprites are scaled down to TILE_SIZE (32px) when rendered
 */

export interface SpriteCoords {
    x: number;  // X position in spritesheet (in pixels)
    y: number;  // Y position in spritesheet (in pixels)
    width: number;  // Sprite width in spritesheet (in pixels)
    height: number; // Sprite height in spritesheet (in pixels)
}

export const SPRITESHEET_WIDTH = 1536;
export const SPRITESHEET_HEIGHT = 1024;

/**
 * Sprite coordinates in the spritesheet
 * Based on the spritesheet layout (estimated from image description):
 * Top row: Wall tile, Floor tile, Table furniture
 * Bottom row: Bookshelf furniture, Male NPC, Female NPC
 * 
 * Note: These coordinates assume sprites are arranged in a grid.
 * Adjust these values based on the actual spritesheet layout.
 * Sprites will be scaled down to TILE_SIZE (32px) when rendered.
 */
export const SPRITE_MAP: Record<string, SpriteCoords> = {
    // Tile sprites (top row, y=0)
    // Assuming sprites are 512x512 pixels each in the spritesheet
    wall: {
        x: 200,
        y: 76,
        width: 320,  // Source size in spritesheet
        height: 276  // Will be scaled to 32x32 when rendered
    },
    floor: {
        x: 612,
        y: 62,
        width: 308,
        height: 276
    },
    door: {
        x: 538,
        y: 382,
        width: 416,
        height: 250
    },
    
    // Furniture sprites
    table: {
        x: 1024,  // Same as door, or adjust if table is separate
        y: 0,
        width: 512,
        height: 512
    },
    bookshelf: {
        x: 250,  // First sprite in bottom row
        y: 384,
        width: 202,
        height: 504
    },
    
    // NPC sprites (bottom row, y=512)
    npc_male: {
        x: 654  ,  // Second sprite in bottom row
        y: 638,
        width: 226,
        height: 254
    },
    npc_female: {
        x: 1024,  // Third sprite in bottom row
        y: 512,
        width: 512,
        height: 512
    },
    
    // Player sprite (placeholder - adjust based on actual spritesheet)
    player: {
        x: 1040,  // Placeholder - might be in a different location
        y: 626,
        width: 200,
        height: 282
    }
};

/**
 * Maps tile types to sprite names
 */
export const TILE_TO_SPRITE: Record<number, string> = {
    0: 'floor',  // TILE_FLOOR
    1: 'wall',   // TILE_WALL
    2: 'floor',  // TILE_FURNITURE is rendered separately as furniture sprites
    3: 'door'    // TILE_DOOR
};

/**
 * Spritesheet 2: character sprites (female_detective, male_detective, baron, etc.)
 * Positions: x, y - width and height derived from bounds.
 */
export const SPRITE_MAP_2: Record<string, SpriteCoords> = {
    female_detective: { x: 86, y: 250, width: 260 - 86, height: 548 - 250 },
    male_detective: { x: 302, y: 250, width: 482 - 302, height: 548 - 250 },
    baron: { x: 526, y: 250, width: 692 - 526, height: 548 - 250 },
    baroness: { x: 738, y: 250, width: 922 - 738, height: 548 - 250 },
    maid: { x: 964, y: 250, width: 1124 - 964, height: 548 - 250 },
    worker_man: { x: 1150, y: 250, width: 1308 - 1150, height: 548 - 250 },
    worker_boy: { x: 1326, y: 250, width: 1484 - 1326, height: 548 - 250 }
};
