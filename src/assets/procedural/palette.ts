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

    leafDark: "#1a3818",
    leaf: "#286830",
    leafLight: "#48a048",

    carpetRed: "#6a1828",
    carpetRedLight: "#9a2840",

    ceramic: "#e4eaee",
    ceramicLight: "#f4f8fa",
    ceramicDark: "#c8d4dc",
    grout: "#a8b4bc"
} as const;
