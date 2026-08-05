/** Shared SNES-style palette for procedural sprites */
export const P = {
    transparent: "rgba(0,0,0,0)",
    black: "#1a1410",
    outline: "#2d2420",
    shadow: "#4a3f38",
    mid: "#6b5d52",
    light: "#9a8b7c",
    highlight: "#c4b5a4",
    cream: "#e8dcc8",
    white: "#f5f0e6",

    woodDark: "#3d2817",
    wood: "#5c3d24",
    woodLight: "#8b5e3c",
    woodHi: "#b8845a",

    /** Side-view legs/feet — warm tones, not near-black */
    pantsSide: "#5c5048",
    pantsSideFar: "#4e4640",
    shoeBrown: "#5a4030",
    shoeBrownHi: "#7a5a42",

    /** Floor — low contrast so tiles blend when repeated */
    floorPlank: "#5c4838",
    floorPlankAlt: "#544032",
    floorSeam: "#443428",
    floorGrain: "#685040",

    /** Aged attic boards — grey-brown, sun-bleached */
    atticWood: "#4a3828",
    atticWoodAlt: "#423020",
    atticWoodLight: "#6a5240",
    atticWoodHi: "#7a6450",
    atticWoodDark: "#2a2018",
    atticWoodSeam: "#1e1810",
    atticWoodCrack: "#14100c",
    atticWoodKnot: "#322820",

    /** Attic perimeter walls — darker than floor boards */
    atticWall: "#322418",
    atticWallAlt: "#2a1c14",
    atticWallLight: "#4a3828",
    atticWallHi: "#544030",
    atticWallDark: "#1a120c",
    atticWallSeam: "#120c08",
    atticWallKnot: "#241810",

    /** Rug — cool plum so it reads apart from wood furniture */
    carpetPlum: "#4a2848",
    carpetPlumLight: "#6a3a62",
    carpetBorder: "#8a5a30",

    silver: "#b8c0c8",
    silverDark: "#889098",
    wine: "#6a2848",
    foodBrown: "#8a5830",
    foodGreen: "#4a6838",
    candle: "#f0e8c0",

    stone: "#5a5a62",
    stoneLight: "#8a8a94",
    stoneHi: "#b0b0bc",

    grassDark: "#2a4a28",
    grass: "#3d6b38",
    grassLight: "#5a9a50",
    grassHi: "#7cc870",

    gravelDark: "#4a4540",
    gravel: "#6a6560",
    gravelLight: "#8a8580",

    sandDark: "#9a7a48",
    sand: "#c4a86a",
    sandLight: "#dfc88a",
    sandHi: "#efe0b0",

    waterDark: "#1a3a5a",
    water: "#2a5a8a",
    waterLight: "#4a8ab8",
    waterHi: "#6ab8e0",

    brick: "#6a3030",
    brickDark: "#4a2020",
    brickLight: "#8a4848",

    gold: "#c8a030",
    goldDark: "#8a7020",
    copper: "#a86830",

    red: "#8a2828",
    redLight: "#b84848",
    blue: "#284a8a",
    blueLight: "#486ab8",
    green: "#286a38",
    greenLight: "#48a058",

    skin: "#c89870",
    skinShadow: "#9a7050",
    skinHi: "#e8b890",

    coatBrown: "#4a3228",
    coatBrownLight: "#6a4a38",
    coatNavy: "#283048",
    coatNavyLight: "#3a4868",
    coatGray: "#484850",
    coatGrayLight: "#686870",

    maidBlack: "#282830",
    maidWhite: "#e8e8f0",
    policeBlue: "#1a2848",
    policeGold: "#d0b040",

    fireOrange: "#c85020",
    fireYellow: "#e8a030",
    fireRed: "#8a2010",

    iron: "#4a4a52",
    ironDark: "#323238",
    glass: "#8a9aa8",
    glassHi: "#b8c8d4",
    glassShine: "#dce8f0",

    leafDark: "#1a3818",
    leaf: "#286830",
    leafLight: "#48a048",

    carpetRed: "#6a1828",
    carpetRedLight: "#9a2840",

    ceramic: "#e4eaee",
    ceramicLight: "#f4f8fa",
    ceramicDark: "#c8d4dc",
    grout: "#a8b4bc",

    marble: "#d8d0c6",
    marbleLight: "#e4dcd2",
    marbleVein: "#b0a698",
    marbleShadow: "#c4bab0",

    paleWall: "#d4ccc2",
    paleWallAlt: "#c8c0b6",
    paleWallTrim: "#a89888",
    paleWallGold: "#9a8860",

    /** Clear red plaster for bedroom & landing north walls (upper half) */
    roseWall: "#b84848",
    roseWallAlt: "#a03838",
    roseWallHi: "#d06060",
    roseWallShade: "#882828",
    roseWallWash: "#c05050",

    rockVoid: "#121016",
    rockShadow: "#1a181e",
    rockDark: "#242228",
    rock: "#2e2c32",
    rockMid: "#38363c",
    rockLight: "#424048",
    rockHi: "#4c4a50",
    rockFleck: "#1c1a20",

    /** Darker cave-floor tones (floor tiles only — walls stay brighter for contrast). */
    rockFloorVoid: "#06050a",
    rockFloorShadow: "#0c0a10",
    rockFloorDark: "#121018",
    rockFloor: "#18161c",
    rockFloorMid: "#1e1c22",
    rockFloorLight: "#242228",
    rockFloorHi: "#2a2830",
    rockFloorFleck: "#08060c",

    /** Kitchen stone — warm brown to match wood furniture; tight value range. */
    paleRockVoid: "#3a2c22",
    paleRockShadow: "#463628",
    paleRockDark: "#524032",
    paleRock: "#5c4a38",
    paleRockMid: "#685440",
    paleRockLight: "#74604c",
    paleRockHi: "#806c58",
    paleRockFleck: "#403028",

    paleRockFloorVoid: "#32281e",
    paleRockFloorShadow: "#3c3024",
    paleRockFloorDark: "#48382c",
    paleRockFloor: "#544234",
    paleRockFloorMid: "#5e4c3c",
    paleRockFloorLight: "#685644",
    paleRockFloorHi: "#72604c",
    paleRockFloorFleck: "#362a20",

    straw: "#a89868",
    strawLight: "#c4b480",
    horseCoat: "#6b4a36",
    horseCoatLight: "#9a7058",
    horseCoatMid: "#7a5844",
    horseCoatDark: "#4a3020",
    horseBay: "#4a2818",
    horseBayLight: "#7a4830",
    horseGray: "#6a6868",
    horseGrayLight: "#9a9898",
    horseGrayMid: "#7a7878",
    horseGrayDark: "#4a4848",
    horseMane: "#1a1410",
    horseManeLight: "#3a3838",
    horseHoof: "#2a2018",
    horseMuzzle: "#8a7060",
    horseNostril: "#2a1810",
    horseEyeWhite: "#ece8e0",
    horseSock: "#d8d0c8",

    // ============================================
    // ENHANCED CHARACTER PALETTE
    // ============================================

    /** Extended skin tones - 8 total for diverse characters */
    // Enhanced skin tones - extending the existing palette
    skinPale: "#f0d4b8",      // Very light, aristocratic
    skinFair: "#e8b890",      // Light
    skinTan: "#b88860",       // Tanned
    skinOlive: "#b08858",     // Olive undertone
    skinDark: "#8a5838",      // Dark
    skinDeep: "#6a4028",      // Very dark
    
    skinPaleShadow: "#d4b498",
    skinFairShadow: "#c89870",
    skinTanShadow: "#9a6848",
    skinOliveShadow: "#906840",
    skinDuskyShadow: "#7a5038",
    skinDarkShadow: "#6a4028",
    skinDeepShadow: "#503020",
    
    skinPaleHi: "#f8e4d0",
    skinFairHi: "#f0c8a8",
    skinTanHi: "#d0a078",
    skinOliveHi: "#c89868",
    skinDarkHi: "#a87048",
    skinDeepHi: "#8a5840",

    /** Extended hair colors - 15 total */
    hairBlonde: "#e8c880",     // Light blonde
    hairGold: "#d0b040",       // Golden blonde
    hairHoney: "#b89030",      // Honey blonde
    hairAuburn: "#8a4820",     // Auburn
    hairChestnut: "#6a3820",   // Chestnut brown
    hairDarkBrown: "#2a1810",  // Dark brown
    hairJetBlack: "#080808",   // Jet black
    hairPlatinum: "#d8d8e0",   // Platinum blonde
    
    /** Hair highlights and shadows */
    hairBlondeHi: "#f0d898",
    hairGoldHi: "#e8c850",
    hairBrownHi: "#8a5030",
    hairBlackHi: "#3a2818",
    hairSilverHi: "#d8d8e0",
    
    hairBlondeShadow: "#b89850",
    hairGoldShadow: "#9a7830",
    hairBrownShadow: "#4a2010",
    hairBlackShadow: "#0a0808",

    /** Eye colors */
    eyeHazel: "#6a5830",       // Hazel
    eyeBrown: "#4a2818",      // Brown
    eyeAmber: "#8a6830",      // Amber
    
    /** Lip colors */
    lipPink: "#a84848",        // Pink
    lipRose: "#8a3838",        // Rose
    lipNatural: "#6a3828",     // Natural tone

    /** Enhanced clothing colors */
    // Coats and jackets
    coatCharcoal: "#282830",   // Charcoal
    coatBurgundy: "#4a1828",    // Burgundy
    coatEmerald: "#186a38",    // Emerald green
    coatTeal: "#185048",       // Teal
    coatMustard: "#8a7020",    // Mustard
    
    // Dress and skirt colors
    dressCrimson: "#6a1828",    // Crimson
    dressViolet: "#4a2848",    // Violet
    dressForest: "#285828",    // Forest green
    dressSapphire: "#18386a",  // Sapphire
    
    // Shirt and blouse colors
    shirtLinen: "#d8c8a8",     // Linen
    shirtSky: "#8ab8d4",      // Sky blue
    shirtLavender: "#b8a8d8", // Lavender
    
    // Accessories and details
    buttonGold: "#c8a030",      // Gold buttons
    buttonBrass: "#a88840",     // Brass buttons
    
    beltBrown: "#5a4030",       // Brown leather
    
    gloveWhite: "#e8e8f0",     // White gloves
    
    // Jewelry
    jewelryGold: "#d0b040",     // Gold jewelry
    jewelrySilver: "#d8d8e0",  // Silver jewelry
    jewelryRuby: "#8a1818",     // Ruby
    jewelrySapphire: "#18388a", // Sapphire
    jewelryEmerald: "#186a38",  // Emerald

    // Shoes extended
    shoeBlack: "#1a1410",       // Black shoes
    shoeOxblood: "#4a1818",     // Oxblood shoes
    shoePolished: "#281810",    // Polished black
    
    // Formal wear
    tuxedoBlack: "#080808",    // Tuxedo black
    tuxedoWhite: "#f8f8f8",    // Tuxedo shirt
    bowtieRed: "#8a1818",      // Red bowtie

    // Fabric patterns (2px micro-patterns for visual texture)
    // These are used in combination to create striped/checkered effects
    fabricPatternA: "#684838", // Pattern color A
    fabricPatternB: "#503828", // Pattern color B

    // Semi-transparent overlays for lighting effects
    overlayShadow: "rgba(0,0,0,0.2)",
    overlayHighlight: "rgba(255,255,255,0.15)",

} as const;
