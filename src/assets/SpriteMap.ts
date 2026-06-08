/**
 * Sprite name mappings for tiles and content references.
 * Art is generated procedurally — see src/assets/procedural/
 */

export const TILE_TO_SPRITE: Record<number, string> = {
    0: 'floor',
    1: 'wall',
    2: 'floor',
    3: 'door',
    4: 'grass',
    5: 'gravel'
};

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
    Pond = "pond",

    Grass = "grass",
    Gravel = "gravel",
    ManorGate = "manor_gate",
    ManorBuilding = "manor_building",

    Fireplace = "fireplace",
    DiningTable = "dining_table",
    KitchenTable = "kitchen_table",
    BoozeTable = "booze_table",
    DrinkingChair = "drinking_chair",
    Carpet = "carpet"
}
