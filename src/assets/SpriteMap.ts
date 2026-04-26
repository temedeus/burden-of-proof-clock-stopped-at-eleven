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
    3: 'door',   // TILE_DOOR (drawn separately in Game)
    4: 'grass',  // TILE_GRASS (spritesheet4)
    5: 'gravel'  // TILE_GRAVEL (spritesheet4)
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
    worker_boy: { x: 1326, y: 250, width: 1484 - 1326, height: 548 - 250 },
    police: { x: 86, y: 632, width: 248 - 86, height: 954 - 632 },
    police2: { x: 340, y: 632, width: 534 - 340, height: 954 - 632 }
};

/**
 * Garden / outdoor objects — spritesheet3.png (garden atlas)
 */
export const SPRITE_MAP_GARDEN: Record<string, SpriteCoords> = {
    fountain: { x: 0, y: 0, width: 442, height: 504 },
    tree: { x: 434, y: 76, width: 656, height: 620 },
    bush: { x: 350, y: 690, width: 344, height: 224 },
    pond_corner_flower: { x: 1473, y: 397, width: 283, height: 248 },
    pond_corner_plain: { x: 1762, y: 397, width: 241, height: 242 },
    pond_corner_grass: { x: 1477, y: 668, width: 283, height: 239 },
    pond_corner_rock: { x: 1759, y: 661, width: 247, height: 246 },
    water_reeds: { x: 1019, y: 942, width: 295, height: 248 },
    water_ripple: { x: 1333, y: 939, width: 292, height: 247 },
    water_lily: { x: 1648, y: 937, width: 358, height: 259 }
};

/**
 * Exterior / terrain objects — spritesheet4.png (exterior atlas)
 */
export const SPRITE_MAP_EXTERIOR: Record<string, SpriteCoords> = {
    grass: { x: 51, y: 228, width: 261, height: 177 },
    gravel: { x: 363, y: 234, width: 246, height: 171 },
    manor_gate: { x: 667, y: 192, width: 329, height: 211 },
    manor_building: { x: 16, y: 605, width: 1338, height: 876 }
};

/**
 * Interior objects — spritesheet5.png (interior atlas)
 */
export const SPRITE_MAP_INTERIOR: Record<string, SpriteCoords> = {
    fireplace: { x: 84, y: 106, width: 1903, height: 1164 },
    dining_table: { x: 830, y: 111, width: 1049, height: 558 }
};

/**
 * Unified enum for garden / exterior / interior sprite names (optional convenience)
 */
export enum SpriteId {
    Fountain = "fountain",
    Tree = "tree",
    Bush = "bush",
    PondCornerFlower = "pond_corner_flower",
    PondCornerPlain = "pond_corner_plain",
    PondCornerGrass = "pond_corner_grass",
    PondCornerRock = "pond_corner_rock",
    WaterReeds = "water_reeds",
    WaterRipple = "water_ripple",
    WaterLily = "water_lily",

    Grass = "grass",
    Gravel = "gravel",
    ManorGate = "manor_gate",
    ManorBuilding = "manor_building",

    Fireplace = "fireplace",
    DiningTable = "dining_table"
}
