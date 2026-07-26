import { P } from "./palette";
import { grid, r } from "./pixel";
import type { ProceduralSpriteDef } from "./types";
import { isAtticWindowBroken, atticWindowPairForColumn } from "../../world/atticWindows";
import { stableWindowPairForColumn } from "../../world/stableWindows";

const C = {
    o: P.outline,
    s: P.shadow,
    m: P.mid,
    l: P.light,
    h: P.highlight,
    w: P.wood,
    W: P.woodLight,
    H: P.woodHi,
    d: P.woodDark,
    g: P.grass,
    G: P.grassLight,
    D: P.grassDark,
    v: P.gravel,
    V: P.gravelLight,
    b: P.brick,
    B: P.brickLight,
    k: P.black
};

function tile32(draw: (ctx: CanvasRenderingContext2D) => void): ProceduralSpriteDef {
    return { nativeWidth: 32, nativeHeight: 32, draw: (ctx) => draw(ctx) };
}

const ROCK_FLOOR = {
    v: P.rockFloorVoid,
    s: P.rockFloorShadow,
    d: P.rockFloorDark,
    m: P.rockFloor,
    l: P.rockFloorLight,
    h: P.rockFloorHi,
    f: P.rockFloorFleck,
    g: P.rockFloorMid
};

const PALE_ROCK_FLOOR = {
    v: P.paleRockFloorVoid,
    s: P.paleRockFloorShadow,
    d: P.paleRockFloorDark,
    m: P.paleRockFloor,
    l: P.paleRockFloorLight,
    h: P.paleRockFloorHi,
    f: P.paleRockFloorFleck,
    g: P.paleRockFloorMid
};

type RockTone = {
    v: string;
    s: string;
    d: string;
    m: string;
    l: string;
    h: string;
    f: string;
    g: string;
};
type RockFloorGrit = [number, number, number, number, string];
type RockFloorFleck = [number, number, string];

function rockFloorGritSets(tones: RockTone): RockFloorGrit[][] {
    return [
        [
            [10, 8, 3, 1, tones.s],
            [20, 12, 2, 2, tones.d],
            [6, 20, 2, 1, tones.f],
            [24, 6, 2, 1, tones.s],
            [14, 22, 3, 1, tones.d],
            [27, 18, 1, 2, tones.v]
        ],
        [
            [8, 10, 2, 2, tones.s],
            [18, 7, 3, 1, tones.d],
            [5, 17, 2, 1, tones.f],
            [22, 20, 2, 2, tones.g],
            [12, 5, 1, 3, tones.v],
            [28, 11, 1, 2, tones.s]
        ],
        [
            [11, 11, 2, 1, tones.s],
            [7, 7, 2, 2, tones.d],
            [21, 9, 2, 1, tones.f],
            [16, 24, 3, 1, tones.s],
            [3, 14, 1, 2, tones.v],
            [26, 26, 2, 1, tones.d]
        ],
        [
            [9, 6, 2, 1, tones.s],
            [19, 15, 2, 2, tones.d],
            [4, 22, 3, 1, tones.f],
            [23, 4, 2, 1, tones.s],
            [15, 19, 1, 2, tones.v],
            [27, 22, 2, 1, tones.g]
        ]
    ];
}

function rockFloorFleckSets(tones: RockTone): RockFloorFleck[][] {
    return [
        [
            [5, 5, tones.f],
            [16, 3, tones.s],
            [25, 17, tones.f],
            [8, 23, tones.h],
            [20, 21, tones.s]
        ],
        [
            [7, 4, tones.f],
            [14, 14, tones.s],
            [24, 8, tones.f],
            [10, 19, tones.h],
            [18, 26, tones.s]
        ],
        [
            [6, 8, tones.f],
            [13, 2, tones.s],
            [22, 19, tones.f],
            [4, 16, tones.h],
            [17, 24, tones.s]
        ],
        [
            [8, 14, tones.f],
            [15, 6, tones.s],
            [26, 14, tones.f],
            [11, 26, tones.h],
            [21, 4, tones.s]
        ]
    ];
}

function drawRockFloorVariant(
    ctx: CanvasRenderingContext2D,
    variant: 0 | 1 | 2 | 3,
    tones: RockTone = ROCK_FLOOR
): void {
    r(ctx, 0, 0, 32, 32, tones.v);

    const layouts: string[][][] = [
        [
            [
                "vvvvvvvvvvvvvvvv",
                "vvvddllhhddvvvvv",
                "vvvdhllllhdvvvvv",
                "vvvdhlfllhdvvvvv",
                "vvvdhllllhdvvvvv",
                "vvvddlllhdvvvvvv",
                "vvvvddhhhdvvvvvv",
                "vvvvvvvvvvvvvvvv"
            ],
            [
                "vvvvdddd",
                "vvvdhlll",
                "vvvdhlll",
                "vvvdhlll",
                "vvvddhld",
                "vvvvdddd",
                "vvvvvvvv",
                "vvvvvvvv"
            ],
            [
                "vvvvvvvv",
                "vvvddddd",
                "vvvdhlll",
                "vvvdhlll",
                "vvvddhld",
                "vvvvdddd",
                "vvvvvvvv",
                "vvvvvvvv"
            ],
            [
                "vvddddvv",
                "vdhllhdv",
                "vdhllhdv",
                "vddllhdv",
                "vvddhhdv",
                "vvvvvvvv"
            ],
            [
                "vvdddd",
                "vdhlll",
                "vdhlll",
                "vddddd"
            ]
        ],
        [
            [
                "vvvvvvvvvvvvvvvv",
                "vvvddhhllldvvvvv",
                "vvvdhlllllldvvvv",
                "vvvdhllfllldvvvv",
                "vvvdhlllllldvvvv",
                "vvvddllllldvvvvv",
                "vvvvddhhhhdvvvvv",
                "vvvvvvvvvvvvvvvv"
            ],
            [
                "ddddvvvv",
                "hllldvvv",
                "hlllldvv",
                "hlllldvv",
                "dhllldvv",
                "ddddvvvv",
                "vvvvvvvv",
                "vvvvvvvv"
            ],
            [
                "vvvvvvvv",
                "vvvvdddd",
                "vvvdhlll",
                "vvvdhlll",
                "vvvdhlll",
                "vvvddddd",
                "vvvvvvvv",
                "vvvvvvvv"
            ],
            [
                "vvdddd",
                "vdllhd",
                "vdllhd",
                "vddhhd",
                "vvvvvv"
            ],
            [
                "vvvv",
                "dhlv",
                "dhlv",
                "dddv"
            ]
        ],
        [
            [
                "vvvvvvvvvvvvvvvv",
                "vvvvvvddvvvvvvvv",
                "vvvvvdhllhdvvvvv",
                "vvvvvdhllhdvvvvv",
                "vvvvvdhllhdvvvvv",
                "vvvvvddllhdvvvvv",
                "vvvvvvddhdvvvvvv",
                "vvvvvvvvvvvvvvvv"
            ],
            [
                "vvvvvvvv",
                "vvvddddd",
                "vvvdhlll",
                "vvvdhlll",
                "vvvddhld",
                "vvvvdddd",
                "vvvvvvvv",
                "vvvvvvvv"
            ],
            [
                "vvvvvvvv",
                "vvvvdddd",
                "vvvvdhll",
                "vvvvdhll",
                "vvvvddhd",
                "vvvvvvvv",
                "vvvvvvvv",
                "vvvvvvvv"
            ],
            [
                "vvvvvv",
                "vddddd",
                "vdhlll",
                "vddddd",
                "vvvvvv"
            ],
            [
                "ddd",
                "hll",
                "ddd"
            ]
        ],
        [
            [
                "vvvvvvvvvvvvvvvv",
                "vvddvvvvvvddvvvv",
                "vdhllhdvvvdhllhd",
                "vdhllhdvvvdhllhd",
                "vddllhdvvvddllhd",
                "vvddhdvvvvddhdvv",
                "vvvvvvvvvvvvvvvv",
                "vvvvvvvvvvvvvvvv"
            ],
            [
                "vvvvdddd",
                "vvvdhlll",
                "vvvdhlll",
                "vvvddhld",
                "vvvvdddd",
                "vvvvvvvv",
                "vvvvvvvv",
                "vvvvvvvv"
            ],
            [
                "ddddvvvv",
                "hllldvvv",
                "hlllldvv",
                "dhllldvv",
                "ddddvvvv",
                "vvvvvvvv",
                "vvvvvvvv",
                "vvvvvvvv"
            ],
            [
                "vvdddd",
                "vdhlll",
                "vdhlll",
                "vddddd"
            ],
            [
                "vvdd",
                "dhll",
                "vvdd"
            ]
        ]
    ];

    const offsets: [number, number][][] = [
        [
            [0, 0],
            [15, 1],
            [1, 15],
            [17, 17],
            [3, 23]
        ],
        [
            [1, 0],
            [14, 2],
            [0, 16],
            [18, 15],
            [25, 22]
        ],
        [
            [2, 1],
            [13, 0],
            [2, 15],
            [16, 18],
            [23, 24]
        ],
        [
            [0, 2],
            [12, 1],
            [1, 14],
            [19, 16],
            [22, 23]
        ]
    ];

    const gritSets = rockFloorGritSets(tones);
    const fleckSets = rockFloorFleckSets(tones);

    const layout = layouts[variant];
    const offs = offsets[variant];
    for (let i = 0; i < layout.length; i++) {
        grid(ctx, offs[i][0], offs[i][1], 2, layout[i], tones);
    }

    for (const [x, y, w, h, color] of gritSets[variant]) {
        r(ctx, x, y, w, h, color);
    }
    for (const [fx, fy, color] of fleckSets[variant]) {
        r(ctx, fx, fy, 1, 1, color);
    }
}

export const ROCK_FLOOR_SPRITES = ["rock", "rock_b", "rock_c", "rock_d"] as const;

export function rockFloorSpriteName(x: number, y: number): (typeof ROCK_FLOOR_SPRITES)[number] {
    return ROCK_FLOOR_SPRITES[(x * 17 + y * 31) % 4];
}

export const PALE_ROCK_FLOOR_SPRITES = [
    "pale_rock",
    "pale_rock_b",
    "pale_rock_c",
    "pale_rock_d"
] as const;

export function paleRockFloorSpriteName(x: number, y: number): (typeof PALE_ROCK_FLOOR_SPRITES)[number] {
    return PALE_ROCK_FLOOR_SPRITES[(x * 17 + y * 31) % 4];
}

type AtticCrack = [number, number, number, number];

function drawAtticWoodPlankBase(ctx: CanvasRenderingContext2D, variant: number): void {
    r(ctx, 0, 0, 32, 32, P.atticWoodDark);
    const rowH = 8;
    for (let row = 0; row < 4; row++) {
        const y = row * rowH;
        const tone = (row + variant) % 2 === 0 ? P.atticWood : P.atticWoodAlt;
        r(ctx, 0, y, 32, rowH - 1, tone);
        r(ctx, 0, y + rowH - 1, 32, 1, P.atticWoodSeam);
        r(ctx, 0, y, 32, 1, (row + variant) % 3 === 0 ? P.atticWoodHi : P.atticWoodLight);
        // End-grain stagger at plank joints
        const joint = ((row * 11 + variant * 7) % 5) * 6 + 2;
        r(ctx, joint, y + 2, 1, rowH - 3, P.atticWoodSeam);
    }
    // Sparse knots / nail stains
    const knots: [number, number][] = [
        [4 + variant * 3, 5],
        [22 - variant, 18],
        [12, 26 - (variant % 2) * 4]
    ];
    for (const [kx, ky] of knots) {
        r(ctx, kx, ky, 2, 2, P.atticWoodKnot);
        r(ctx, kx + 1, ky, 1, 1, P.atticWoodDark);
    }
}

const ATTIC_FLOOR_CRACKS: AtticCrack[][] = [
    [
        [4, 14, 10, 1],
        [14, 15, 8, 1],
        [8, 7, 1, 6]
    ],
    [
        [2, 22, 14, 1],
        [18, 6, 1, 9],
        [20, 20, 6, 1]
    ],
    [
        [10, 10, 12, 1],
        [6, 11, 1, 5],
        [22, 2, 1, 8]
    ],
    [
        [0, 18, 16, 1],
        [16, 19, 1, 4],
        [24, 8, 5, 1]
    ],
    [
        [7, 5, 1, 11],
        [12, 24, 11, 1]
    ],
    [
        [3, 12, 20, 1],
        [18, 13, 1, 7],
        [25, 21, 4, 1]
    ]
];

function drawAtticWoodFloorCracks(ctx: CanvasRenderingContext2D, variant: number): void {
    const cracks = ATTIC_FLOOR_CRACKS[variant % ATTIC_FLOOR_CRACKS.length];
    for (const [x, y, w, h] of cracks) {
        r(ctx, x, y, w, h, P.atticWoodCrack);
        if (w >= h) {
            r(ctx, x + Math.floor(w / 2), y, 1, 2, P.atticWoodSeam);
        } else {
            r(ctx, x, y + Math.floor(h / 2), 2, 1, P.atticWoodSeam);
        }
    }
}

function drawAtticWoodFloorVariant(ctx: CanvasRenderingContext2D, variant: 0 | 1 | 2 | 3 | 4 | 5): void {
    drawAtticWoodPlankBase(ctx, variant);
    if (variant % 3 !== 0) {
        drawAtticWoodFloorCracks(ctx, variant);
    }
    // Fine grain scratches
    for (let i = 0; i < 4; i++) {
        const gx = (variant * 5 + i * 7) % 28 + 2;
        const gy = (variant * 3 + i * 5) % 28 + 2;
        r(ctx, gx, gy, 3, 1, P.atticWoodDark);
    }
}

export const ATTIC_FLOOR_SPRITES = [
    "floor_attic",
    "floor_attic_b",
    "floor_attic_c",
    "floor_attic_d",
    "floor_attic_e",
    "floor_attic_f"
] as const;

export function atticFloorSpriteName(x: number, y: number): (typeof ATTIC_FLOOR_SPRITES)[number] {
    return ATTIC_FLOOR_SPRITES[(x * 19 + y * 23) % ATTIC_FLOOR_SPRITES.length];
}

function drawAtticWoodWallVariant(ctx: CanvasRenderingContext2D, variant: 0 | 1 | 2): void {
    r(ctx, 0, 0, 32, 32, P.atticWallDark);
    for (let row = 0; row < 4; row++) {
        const y = row * 8;
        const tone = (row + variant) % 2 === 0 ? P.atticWall : P.atticWallAlt;
        r(ctx, 0, y, 32, 7, tone);
        r(ctx, 0, y + 7, 32, 1, P.atticWallSeam);
        r(ctx, 0, y, 32, 1, P.atticWallHi);
        r(ctx, 2 + ((row + variant) % 4) * 7, y + 3, 2, 2, P.atticWallKnot);
    }
    r(ctx, 0, 0, 2, 32, P.atticWallDark);
    r(ctx, 30, 0, 2, 32, P.atticWallSeam);
    r(ctx, 1, 0, 1, 32, P.atticWallLight);
    r(ctx, 29, 0, 1, 32, P.shadow);
    if (variant > 0) {
        r(ctx, 10, 4, 1, 24, P.atticWoodCrack);
    }
    if (variant === 2) {
        r(ctx, 20, 0, 1, 32, P.atticWallSeam);
    }
    r(ctx, 0, 0, 32, 1, P.outline);
    r(ctx, 0, 31, 32, 1, P.outline);
}

export const ATTIC_WALL_SPRITES = ["wall_attic", "wall_attic_b", "wall_attic_c"] as const;

export function atticWallSpriteName(x: number, y: number): (typeof ATTIC_WALL_SPRITES)[number] {
    return ATTIC_WALL_SPRITES[(x * 13 + y * 29) % ATTIC_WALL_SPRITES.length];
}

/** Continuous 2-tile-tall attic north wall (aged vertical boards). */
export const ATTIC_NORTH_WALL_SPRITES = [
    "wall_attic_north",
    "wall_attic_north_b",
    "wall_attic_north_c"
] as const;

export function atticNorthWallSpriteName(x: number): string {
    const pair = atticWindowPairForColumn(x);
    if (pair) {
        const side = x === pair.left ? "l" : "r";
        if (isAtticWindowBroken(pair.id)) {
            return `wall_attic_north_window_broken_${side}`;
        }
        if (pair.id === 19) {
            return `wall_attic_north_window_cracked_${side}`;
        }
        return `wall_attic_north_window_${side}`;
    }
    return ATTIC_NORTH_WALL_SPRITES[((x % 3) + 3) % 3];
}

function drawAtticNorthWallFace(
    ctx: CanvasRenderingContext2D,
    variant: 0 | 1 | 2,
    windowHalf: null | {
        side: "left" | "right";
        style: "intact" | "cracked" | "broken";
    } = null
): void {
    r(ctx, 0, 0, 32, 64, P.atticWallDark);

    // Vertical weathered boards across the full 2-tile height
    for (let col = 0; col < 4; col++) {
        const x = col * 8;
        const tone =
            (col + variant) % 2 === 0
                ? P.atticWall
                : (col + variant) % 3 === 0
                  ? P.atticWallLight
                  : P.atticWallAlt;
        r(ctx, x, 0, 7, 64, tone);
        r(ctx, x + 7, 0, 1, 64, P.atticWallSeam);
        r(ctx, x, 0, 1, 64, P.atticWallHi);
        // Knots / wormholes
        const knotY = 10 + ((col * 11 + variant * 7) % 40);
        r(ctx, x + 2, knotY, 2, 2, P.atticWallKnot);
        if (variant > 0) {
            r(ctx, x + 3, 20 + col * 8, 1, 10 + variant * 2, P.atticWoodCrack);
        }
    }

    // Top plate / rafter shadow
    r(ctx, 0, 0, 32, 3, P.atticWallDark);
    r(ctx, 0, 1, 32, 1, P.atticWallSeam);
    // Bottom sill plate
    r(ctx, 0, 60, 32, 4, P.atticWallDark);
    r(ctx, 0, 61, 32, 1, P.atticWallHi);
    // Edge shadow
    r(ctx, 0, 0, 1, 64, P.atticWallDark);
    r(ctx, 31, 0, 1, 64, P.atticWallSeam);

    if (windowHalf) {
        drawAtticWallWindowHalf(ctx, windowHalf.side, windowHalf.style);
    }
}

/**
 * Half of a two-tile attic window. Combined opening is ~52×46 px —
 * large enough that shoving a character through reads as natural.
 */
function drawAtticWallWindowHalf(
    ctx: CanvasRenderingContext2D,
    side: "left" | "right",
    style: "intact" | "cracked" | "broken"
): void {
    const isLeft = side === "left";
    // Combined window frame in 64-wide space: (2,4)–(62,58). This half is [0,32] or [32,64].
    const shift = isLeft ? 0 : -32;

    const frame = (gx: number, gy: number, gw: number, gh: number, color: string) => {
        const x0 = gx + shift;
        const x1 = x0 + gw;
        if (x1 <= 0 || x0 >= 32) return;
        const lx = Math.max(0, x0);
        const rw = Math.min(32, x1) - lx;
        if (rw > 0) r(ctx, lx, gy, rw, gh, color);
    };

    // Outer timber frame
    frame(2, 4, 60, 54, P.atticWallDark);
    frame(3, 5, 58, 52, P.atticWall);
    frame(5, 7, 54, 48, P.black);

    if (style === "broken") {
        frame(6, 8, 52, 46, "#0a1018");
        frame(10, 12, 4, 3, "#1a2430");
        // Jagged glass remnants
        frame(7, 9, 6, 5, P.waterDark);
        frame(8, 9, 3, 8, P.glassShine);
        frame(48, 10, 8, 6, P.water);
        frame(50, 11, 4, 10, P.glassShine);
        frame(12, 44, 10, 4, P.waterDark);
        frame(40, 46, 12, 3, P.cream);
        frame(52, 40, 3, 10, P.glassShine);
        // Mullion stubs (center at x=32)
        frame(30, 7, 4, 8, P.atticWallDark);
        frame(5, 28, 10, 3, P.atticWallDark);
        frame(49, 28, 10, 3, P.atticWallDark);
    } else {
        // Dirty daylight panes
        frame(6, 8, 52, 46, P.waterDark);
        frame(7, 9, 50, 44, P.water);
        frame(9, 11, 8, 12, P.waterLight);
        frame(46, 36, 6, 8, P.glassShine);

        // Cross mullion — center of the 2-tile span
        frame(30, 7, 4, 48, P.atticWallDark);
        frame(31, 7, 2, 48, P.atticWall);
        frame(5, 28, 54, 3, P.atticWallDark);
        frame(5, 29, 54, 1, P.atticWall);

        if (style === "cracked") {
            frame(36, 34, 2, 16, P.glassShine);
            frame(37, 38, 10, 2, P.glassShine);
            frame(34, 40, 2, 10, P.cream);
            frame(33, 44, 8, 2, P.cream);
            frame(42, 32, 6, 2, P.glassShine);
            frame(44, 48, 4, 3, P.black);
        }
    }

    // Frame highlight on outer edges of the full window
    if (isLeft) {
        r(ctx, 3, 5, 1, 52, P.atticWallLight);
        r(ctx, 3, 5, 29, 1, P.atticWallLight);
    } else {
        r(ctx, 0, 5, 28, 1, P.atticWallLight);
    }
}

const ROCK_WALL = {
    v: P.rockVoid,
    s: P.rockShadow,
    d: P.rockDark,
    m: P.rock,
    l: P.rockLight,
    h: P.rockHi,
    f: P.rockFleck,
    g: P.rockMid
};

const PALE_ROCK_WALL = {
    v: P.paleRockVoid,
    s: P.paleRockShadow,
    d: P.paleRockDark,
    m: P.paleRock,
    l: P.paleRockLight,
    h: P.paleRockHi,
    f: P.paleRockFleck,
    g: P.paleRockMid
};

type RockWallTone = {
    v: string;
    s: string;
    d: string;
    m: string;
    l: string;
    h: string;
    f: string;
    g: string;
};
type RockWallCrack = [number, number, number, number, string];
type RockWallStreak = [number, number, number, number, string];

function rockWallCrackSets(tones: RockWallTone): RockWallCrack[][] {
    return [
        [
            [10, 0, 1, 32, tones.v],
            [22, 0, 1, 32, tones.s],
            [5, 8, 1, 14, tones.v],
            [27, 12, 1, 12, tones.s]
        ],
        [
            [8, 0, 1, 28, tones.v],
            [19, 2, 1, 30, tones.s],
            [3, 10, 1, 16, tones.v],
            [25, 6, 1, 18, tones.f]
        ],
        [
            [12, 0, 1, 32, tones.s],
            [6, 0, 1, 24, tones.v],
            [23, 4, 1, 20, tones.v],
            [15, 14, 1, 18, tones.s]
        ],
        [
            [9, 0, 1, 30, tones.v],
            [21, 0, 1, 32, tones.s],
            [4, 16, 1, 12, tones.v],
            [28, 8, 1, 14, tones.f]
        ]
    ];
}

function rockWallStreakSets(tones: RockWallTone): RockWallStreak[][] {
    return [
        [
            [14, 4, 2, 10, tones.g],
            [18, 20, 1, 8, tones.f],
            [3, 22, 3, 1, tones.h],
            [24, 6, 2, 1, tones.h]
        ],
        [
            [11, 6, 2, 12, tones.g],
            [20, 18, 1, 9, tones.f],
            [5, 14, 3, 1, tones.h],
            [26, 10, 2, 1, tones.s]
        ],
        [
            [16, 3, 1, 14, tones.g],
            [7, 20, 2, 1, tones.h],
            [22, 24, 1, 6, tones.f],
            [2, 8, 2, 1, tones.s]
        ],
        [
            [13, 8, 2, 8, tones.g],
            [6, 4, 1, 10, tones.f],
            [23, 16, 3, 1, tones.h],
            [17, 26, 2, 1, tones.s]
        ]
    ];
}

function rockWallFleckSets(tones: RockWallTone): [number, number, string][][] {
    return [
        [
            [7, 11, tones.f],
            [29, 19, tones.s],
            [16, 28, tones.h]
        ],
        [
            [5, 7, tones.f],
            [27, 15, tones.s],
            [12, 24, tones.h]
        ],
        [
            [9, 5, tones.f],
            [25, 22, tones.s],
            [18, 12, tones.h]
        ],
        [
            [4, 18, tones.f],
            [21, 9, tones.s],
            [14, 30, tones.h]
        ]
    ];
}

function drawRockWallVariant(
    ctx: CanvasRenderingContext2D,
    variant: 0 | 1 | 2 | 3,
    tones: RockWallTone = ROCK_WALL
): void {
    r(ctx, 0, 0, 32, 32, tones.v);

    const layouts: string[][][] = [
        [
            [
                "vvvvvvvvvvvvvvvv",
                "vddhhlllldddmmvv",
                "vdhllllllllddmmv",
                "vdhllflllllldmmv",
                "vdhllllllllddmmv",
                "vddllllllldddmmv",
                "vvddhhlllddddmmv",
                "vvvdddddhhdddmmv",
                "vvvdddhhlllddmmv",
                "vvddhllllllddmmv",
                "vdhllflllllldmmv",
                "vdhllllllllddmmv",
                "vddllllllldddmmv",
                "vvddhhlllddddmmv",
                "vvvdddddhhdddmmv",
                "vvvvvvvvvvvvvvvv"
            ]
        ],
        [
            [
                "vvvvvvvvvvvvvvvv",
                "vvddhhlllldddmmv",
                "vvvdhllllllddmmv",
                "vvvdhllflllldmmv",
                "vvvdhllllllddmmv",
                "vvvddllllldddmmv",
                "vvvdddhhlllddmmv",
                "vvvddhlllllddmmv",
                "vvvdhllflllldmmv",
                "vvvdhllllllddmmv",
                "vvvddllllldddmmv",
                "vvvdddhhlllddmmv",
                "vvvddhlllllddmmv",
                "vvvdhllllllddmmv",
                "vvvddhhllldddmmv",
                "vvvvvvvvvvvvvvvv"
            ],
            [
                "vvvv",
                "dhlv",
                "dhlv",
                "dhlv",
                "dddv"
            ]
        ],
        [
            [
                "vvvvvvvvvvvvvvvv",
                "vddhhlllldddmmvv",
                "vdhllllllllddmmv",
                "vdhllflllllldmmv",
                "vdhllllllllddmmv",
                "vddllllllldddmmv",
                "vvddhhlllddddmmv",
                "vvvdddddhhdddmmv",
                "vvvdddhhlllddmmv",
                "vvddhllllllddmmv",
                "vdhllflllllldmmv",
                "vdhllllllllddmmv",
                "vddllllllldddmmv",
                "vvddhhlllddddmmv",
                "vvvdddddhhdddmmv",
                "vvvvvvvvvvvvvvvv"
            ],
            [
                "dddd",
                "hlll",
                "hlll",
                "hlll",
                "dddd"
            ]
        ],
        [
            [
                "vvvvvvvvvvvvvvvv",
                "vvvddhhllldddmmv",
                "vvvdhllllllddmmv",
                "vvvdhllflllldmmv",
                "vvvdhllllllddmmv",
                "vvvddllllldddmmv",
                "vvvdddhhlllddmmv",
                "vvvddhlllllddmmv",
                "vvvdhllflllldmmv",
                "vvvdhllllllddmmv",
                "vvvddllllldddmmv",
                "vvvdddhhlllddmmv",
                "vvvddhlllllddmmv",
                "vvvdhllllllddmmv",
                "vvvddhhllldddmmv",
                "vvvvvvvvvvvvvvvv"
            ],
            [
                "vvdd",
                "dhll",
                "dhll",
                "vvdd"
            ]
        ]
    ];

    const offsets: [number, number][][] = [
        [[0, 0]],
        [
            [1, 0],
            [24, 20]
        ],
        [
            [0, 1],
            [20, 22]
        ],
        [
            [2, 0],
            [22, 18]
        ]
    ];

    const cracks = rockWallCrackSets(tones);
    const streaks = rockWallStreakSets(tones);
    const flecks = rockWallFleckSets(tones);

    for (let i = 0; i < layouts[variant].length; i++) {
        const [ox, oy] = offsets[variant][i];
        grid(ctx, ox, oy, 2, layouts[variant][i], tones);
    }
    for (const [x, y, w, h, color] of cracks[variant]) {
        r(ctx, x, y, w, h, color);
    }
    for (const [x, y, w, h, color] of streaks[variant]) {
        r(ctx, x, y, w, h, color);
    }
    for (const [fx, fy, color] of flecks[variant]) {
        r(ctx, fx, fy, 1, 1, color);
    }
}

export const ROCK_WALL_SPRITES = ["wall_rock", "wall_rock_b", "wall_rock_c", "wall_rock_d"] as const;

export function rockWallSpriteName(x: number, y: number): (typeof ROCK_WALL_SPRITES)[number] {
    return ROCK_WALL_SPRITES[(x * 23 + y * 37) % 4];
}

export const PALE_ROCK_WALL_SPRITES = [
    "wall_pale_rock",
    "wall_pale_rock_b",
    "wall_pale_rock_c",
    "wall_pale_rock_d"
] as const;

export function paleRockWallSpriteName(x: number, y: number): (typeof PALE_ROCK_WALL_SPRITES)[number] {
    return PALE_ROCK_WALL_SPRITES[(x * 23 + y * 37) % 4];
}

/** Continuous 2-tile-tall pale limestone north wall face. */
export const PALE_ROCK_NORTH_WALL_SPRITES = [
    "wall_pale_rock_north",
    "wall_pale_rock_north_b",
    "wall_pale_rock_north_c"
] as const;

export function paleRockNorthWallSpriteName(x: number): string {
    return PALE_ROCK_NORTH_WALL_SPRITES[((x % 3) + 3) % 3];
}

function drawPaleRockNorthWallFace(ctx: CanvasRenderingContext2D, variant: 0 | 1 | 2): void {
    const t = PALE_ROCK_WALL;
    r(ctx, 0, 0, 32, 64, t.v);

    // Stacked ashlar courses across the full 2-tile face
    const courseH = 8;
    for (let row = 0; row < 8; row++) {
        const y = row * courseH;
        const stagger = ((row + variant) % 2) * 6;
        const blockW = [10, 12, 14, 11][(row + variant) % 4];
        let x = -((stagger + variant * 2) % blockW);
        let toneFlip = 0;
        while (x < 32) {
            const w = Math.min(blockW, 32 - x);
            if (w > 0 && x + w > 0) {
                const bx = Math.max(0, x);
                const bw = Math.min(32, x + w) - bx;
                const base = (row + toneFlip + variant) % 2 === 0 ? t.m : t.d;
                r(ctx, bx, y, bw, courseH - 1, base);
                r(ctx, bx, y, bw, 1, t.l);
                r(ctx, bx, y + courseH - 2, bw, 1, t.s);
                if (bw > 3) {
                    r(ctx, bx + 1, y + 2, 1, courseH - 4, t.h);
                }
            }
            x += blockW;
            toneFlip++;
        }
        r(ctx, 0, y + courseH - 1, 32, 1, t.v);
    }

    // Soft vertical seams so columns read as one surface
    r(ctx, 0, 0, 1, 64, t.s);
    r(ctx, 31, 0, 1, 64, t.s);

    // Crown + baseboard shadows
    r(ctx, 0, 0, 32, 2, t.d);
    r(ctx, 0, 1, 32, 1, t.s);
    r(ctx, 0, 62, 32, 2, t.d);
    r(ctx, 0, 62, 32, 1, t.v);

    // Sparse flecks / mineral grit
    const flecks: [number, number][] = [
        [4 + variant, 10],
        [18, 22 + variant],
        [12, 36],
        [26 - variant, 48],
        [8, 54]
    ];
    for (const [fx, fy] of flecks) {
        r(ctx, fx, fy, 1, 1, t.f);
    }
    r(ctx, 20 + variant, 14, 2, 1, t.h);
    r(ctx, 6, 40 + variant, 2, 1, t.h);
}

const WOOD_WALL_GRAIN_H: [number, number][] = [
    [4, 5],
    [17, 2],
    [25, 11],
    [9, 18],
    [22, 24],
    [6, 27]
];

function drawWoodPlanksHorizontal(
    ctx: CanvasRenderingContext2D,
    x0 = 0,
    y0 = 0,
    w = 32,
    h = 32
): void {
    r(ctx, x0, y0, w, h, P.woodDark);
    for (let row = 0; row < 4; row++) {
        const y = y0 + row * 8;
        if (y >= y0 + h) break;
        const plankH = Math.min(7, y0 + h - y - 1);
        r(ctx, x0, y, w, plankH, row % 2 === 0 ? P.wood : P.woodLight);
        if (y + plankH < y0 + h) {
            r(ctx, x0, y + plankH, w, 1, P.woodDark);
        }
        r(ctx, x0, y, w, 1, row % 2 === 0 ? P.woodHi : P.wood);
    }
    for (const [gx, gy] of WOOD_WALL_GRAIN_H) {
        if (gx >= x0 && gx + 2 <= x0 + w && gy >= y0 && gy + 1 <= y0 + h) {
            r(ctx, gx, gy, 2, 1, P.woodDark);
        }
    }
}

function drawWoodPlanksVertical(
    ctx: CanvasRenderingContext2D,
    x0 = 0,
    y0 = 0,
    w = 32,
    h = 32
): void {
    r(ctx, x0, y0, w, h, P.woodDark);
    for (let col = 0; col < 4; col++) {
        const x = x0 + col * 8;
        if (x >= x0 + w) break;
        const plankW = Math.min(7, x0 + w - x - 1);
        r(ctx, x, y0, plankW, h, col % 2 === 0 ? P.wood : P.woodLight);
        if (x + plankW < x0 + w) {
            r(ctx, x + plankW, y0, 1, h, P.woodDark);
        }
        r(ctx, x, y0, 1, h, col % 2 === 0 ? P.woodHi : P.wood);
    }
    for (const [gx, gy] of WOOD_WALL_GRAIN_H) {
        if (gx + 1 >= x0 && gx + 1 < x0 + w && gy >= y0 && gy + 2 <= y0 + h) {
            r(ctx, gx + 1, gy, 1, 2, P.woodDark);
        }
    }
}

/** End-grain corner post where two plank runs meet. */
function drawWoodCornerPost(ctx: CanvasRenderingContext2D, size = 10): void {
    r(ctx, 0, 0, size, size, P.woodDark);
    for (let ring = 0; ring < 3; ring++) {
        const inset = 2 + ring * 2;
        const s = size - inset * 2;
        if (s > 0) {
            r(ctx, inset, inset, s, s, ring % 2 === 0 ? P.wood : P.woodLight);
        }
    }
    r(ctx, Math.floor(size / 2) - 1, Math.floor(size / 2) - 1, 2, 2, P.woodHi);
}

export function manorInteriorWallDraw(
    x: number,
    y: number,
    mapW: number,
    mapH: number
): { sprite: string; flipX: boolean; flipY: boolean } {
    const north = y === 0;
    const south = y === mapH - 1;
    const west = x === 0;
    const east = x === mapW - 1;

    if (north && west) return { sprite: "wall_corner", flipX: false, flipY: false };
    if (north && east) return { sprite: "wall_corner", flipX: true, flipY: false };
    if (south && west) return { sprite: "wall_corner", flipX: false, flipY: true };
    if (south && east) return { sprite: "wall_corner", flipX: true, flipY: true };
    if (west || east) return { sprite: "wall_v", flipX: east, flipY: false };
    return { sprite: "wall", flipX: false, flipY: false };
}

/** Continuous 2-tile-tall north wall face (plaster over wood wainscoting). */
export const NORTH_WALL_SPRITES = ["wall_north", "wall_north_b", "wall_north_c"] as const;
export const NORTH_WALL_ROSE_SPRITES = [
    "wall_north_rose",
    "wall_north_rose_b",
    "wall_north_rose_c"
] as const;

export function northWallSpriteName(
    x: number,
    accent: "none" | "rose" = "none"
): string {
    const sprites = accent === "rose" ? NORTH_WALL_ROSE_SPRITES : NORTH_WALL_SPRITES;
    return sprites[((x % 3) + 3) % 3];
}

/** Continuous 2-tile-tall barn wood north wall (vertical boards). */
export const WOOD_NORTH_WALL_SPRITES = [
    "wall_wood_north",
    "wall_wood_north_b",
    "wall_wood_north_c"
] as const;

export function woodNorthWallSpriteName(x: number): string {
    const pair = stableWindowPairForColumn(x);
    if (pair) {
        return x === pair.left ? "wall_wood_north_window_l" : "wall_wood_north_window_r";
    }
    return WOOD_NORTH_WALL_SPRITES[((x % 3) + 3) % 3];
}

function drawWoodNorthWallFace(
    ctx: CanvasRenderingContext2D,
    variant: 0 | 1 | 2,
    windowHalf: null | "left" | "right" = null
): void {
    r(ctx, 0, 0, 32, 64, P.woodDark);

    // Full-height vertical barn boards (board-and-batten), not small plank tiles
    const boardLayouts: [number, number][][] = [
        [
            [0, 12],
            [12, 10],
            [22, 10]
        ],
        [
            [0, 10],
            [10, 12],
            [22, 10]
        ],
        [
            [0, 11],
            [11, 9],
            [20, 12]
        ]
    ];
    const boards = boardLayouts[variant];
    const tones = [P.wood, P.woodLight, P.wood, P.woodDark];

    for (let i = 0; i < boards.length; i++) {
        const [bx, bw] = boards[i];
        const tone = tones[(i + variant) % tones.length];
        r(ctx, bx, 0, bw, 64, tone);
        // Left edge highlight / right seam so boards read as separate planks
        r(ctx, bx, 0, 1, 64, P.woodHi);
        r(ctx, bx + bw - 1, 0, 1, 64, P.woodDark);
        // Thin batten over the seam
        if (i < boards.length - 1) {
            r(ctx, bx + bw - 2, 0, 2, 64, P.woodDark);
            r(ctx, bx + bw - 1, 0, 1, 64, P.outline);
        }
        // Vertical grain
        for (let g = 0; g < 3; g++) {
            const gx = bx + 2 + ((g * 3 + variant + i) % Math.max(2, bw - 4));
            const gy = 8 + ((i * 11 + g * 17 + variant * 5) % 40);
            r(ctx, gx, gy, 1, 10 + g * 2, P.woodDark);
        }
        // Knot
        const kx = bx + Math.floor(bw / 2) - 1;
        const ky = 14 + ((i * 19 + variant * 9) % 30);
        r(ctx, kx, ky, 2, 2, P.atticWoodKnot);
        r(ctx, kx + 1, ky, 1, 1, P.woodDark);
    }

    // Heavy top plate (rafter beam)
    r(ctx, 0, 0, 32, 6, P.woodDark);
    r(ctx, 0, 1, 32, 3, P.wood);
    r(ctx, 0, 2, 32, 1, P.woodHi);
    r(ctx, 0, 5, 32, 1, P.outline);

    // Mid girder / loft rail — barns read with one strong horizontal member
    r(ctx, 0, 28, 32, 5, P.woodDark);
    r(ctx, 0, 29, 32, 2, P.wood);
    r(ctx, 0, 29, 32, 1, P.woodHi);
    r(ctx, 0, 32, 32, 1, P.outline);

    // Bottom kickboard / sill
    r(ctx, 0, 58, 32, 6, P.woodDark);
    r(ctx, 0, 59, 32, 3, P.wood);
    r(ctx, 0, 59, 32, 1, P.woodHi);
    r(ctx, 0, 63, 32, 1, P.outline);

    // Soft column edge so neighboring tiles blend as one wall
    r(ctx, 0, 6, 1, 52, P.shadow);
    r(ctx, 31, 6, 1, 52, P.shadow);

    if (windowHalf) {
        drawStableWallWindowHalf(ctx, windowHalf);
    }
}

/**
 * Half of a two-tile stable window looking out onto yard / trees.
 * Combined opening spans ~52×46 px across left+right halves.
 */
function drawStableWallWindowHalf(ctx: CanvasRenderingContext2D, side: "left" | "right"): void {
    const isLeft = side === "left";
    const shift = isLeft ? 0 : -32;

    const frame = (gx: number, gy: number, gw: number, gh: number, color: string) => {
        const x0 = gx + shift;
        const x1 = x0 + gw;
        if (x1 <= 0 || x0 >= 32) return;
        const lx = Math.max(0, x0);
        const rw = Math.min(32, x1) - lx;
        if (rw > 0) r(ctx, lx, gy, rw, gh, color);
    };

    // Timber frame
    frame(2, 6, 60, 50, P.woodDark);
    frame(3, 7, 58, 48, P.wood);
    frame(5, 9, 54, 44, P.outline);

    // Outdoor view — sky band
    frame(6, 10, 52, 18, "#4a6a88");
    frame(7, 11, 50, 10, "#6a8aa8");
    frame(8, 12, 12, 6, "#8aaac0");
    frame(40, 14, 10, 4, P.glassShine);

    // Distant tree line / hills
    frame(6, 26, 52, 10, P.grassDark);
    frame(8, 24, 8, 8, P.grass);
    frame(18, 22, 10, 10, P.grassDark);
    frame(30, 25, 7, 7, P.grass);
    frame(40, 23, 12, 9, P.grassDark);
    frame(10, 28, 3, 6, P.atticWoodDark);
    frame(22, 27, 2, 7, P.atticWoodDark);
    frame(44, 26, 3, 8, P.atticWoodDark);

    // Near grass / yard
    frame(6, 36, 52, 16, P.grass);
    frame(7, 38, 50, 6, P.grassLight);
    frame(8, 44, 20, 4, P.grassDark);
    frame(32, 42, 18, 5, P.grassHi);
    frame(12, 46, 8, 2, P.gravel);
    frame(40, 47, 10, 2, P.gravelLight);

    // Cross mullion
    frame(30, 9, 4, 44, P.woodDark);
    frame(31, 9, 2, 44, P.wood);
    frame(5, 30, 54, 3, P.woodDark);
    frame(5, 31, 54, 1, P.wood);

    // Frame edge highlight
    if (isLeft) {
        r(ctx, 3, 7, 1, 48, P.woodHi);
        r(ctx, 3, 7, 29, 1, P.woodHi);
    } else {
        r(ctx, 0, 7, 28, 1, P.woodHi);
    }
}

function drawManorNorthWallFace(
    ctx: CanvasRenderingContext2D,
    variant: 0 | 1 | 2,
    accent: "none" | "rose" = "none"
): void {
    const plasterBase =
        accent === "rose"
            ? [P.roseWall, P.roseWallAlt, P.roseWallHi][variant]
            : [P.paleWall, P.paleWallAlt, P.cream][variant];
    const plasterShade =
        accent === "rose"
            ? [P.roseWallAlt, P.roseWallShade, P.roseWall][variant]
            : [P.paleWallAlt, P.paleWallTrim, P.marble][variant];
    const plasterHi =
        accent === "rose"
            ? [P.roseWallHi, P.roseWall, P.cream][variant]
            : [P.cream, P.paleWall, P.white][variant];

    // Full face fill
    r(ctx, 0, 0, 32, 64, plasterBase);

    // Crown molding
    r(ctx, 0, 0, 32, 3, P.woodDark);
    r(ctx, 0, 1, 32, 2, P.wood);
    r(ctx, 0, 2, 32, 1, P.woodHi);

    // Upper plaster field with soft mottling
    const mottles: [number, number, number, number][] = [
        [3 + variant, 8, 4, 2],
        [14, 11 + variant, 5, 2],
        [22 - variant, 7, 3, 3],
        [6, 18, 3, 2],
        [18 + variant, 16, 4, 2],
        [10, 22, 2, 2]
    ];
    for (const [mx, my, mw, mh] of mottles) {
        r(ctx, mx, my, mw, mh, plasterShade);
    }
    r(ctx, 8 + variant * 2, 12, 2, 1, plasterHi);
    r(ctx, 20, 20 - variant, 3, 1, plasterHi);

    // Faint rose wash confined to the upper tile of the thick wall
    if (accent === "rose") {
        for (const [rx, ry, rw, rh] of [
            [2, 5, 8, 3],
            [12, 9, 10, 2],
            [4, 15, 6, 2],
            [18, 18, 7, 3],
            [8, 24, 12, 2]
        ] as [number, number, number, number][]) {
            r(ctx, rx, ry, rw, rh, P.roseWallWash);
        }
    }

    // Chair rail
    r(ctx, 0, 28, 32, 4, P.woodDark);
    r(ctx, 0, 29, 32, 2, P.wood);
    r(ctx, 0, 30, 32, 1, P.woodHi);

    // Lower wainscot panels (two raised panels)
    r(ctx, 0, 32, 32, 28, P.woodDark);
    const panelInset = variant === 1 ? 1 : 0;
    for (const px of [2, 17]) {
        r(ctx, px + panelInset, 34, 13 - panelInset, 22, P.wood);
        r(ctx, px + 1 + panelInset, 35, 11 - panelInset, 20, P.woodLight);
        r(ctx, px + 2 + panelInset, 36, 9 - panelInset, 1, P.woodHi);
        r(ctx, px + 2 + panelInset, 36, 1, 18, P.woodHi);
        r(ctx, px + 10, 37, 1, 16, P.woodDark);
        r(ctx, px + 3, 52, 7, 1, P.woodDark);
    }

    // Baseboard
    r(ctx, 0, 60, 32, 4, P.woodDark);
    r(ctx, 0, 61, 32, 2, P.wood);
    r(ctx, 0, 61, 32, 1, P.woodHi);

    // Soft vertical edge shadow so adjacent columns read as one surface
    r(ctx, 0, 3, 1, 25, plasterShade);
    r(ctx, 31, 3, 1, 25, plasterShade);
}

export const TILE_SPRITES: Record<string, ProceduralSpriteDef> = {
    wall: tile32((ctx) => drawWoodPlanksHorizontal(ctx)),

    wall_v: tile32((ctx) => drawWoodPlanksVertical(ctx)),

    wall_corner: tile32((ctx) => {
        drawWoodPlanksHorizontal(ctx);
        drawWoodPlanksVertical(ctx, 0, 0, 8, 32);
        drawWoodCornerPost(ctx, 10);
    }),

    wall_north: {
        nativeWidth: 32,
        nativeHeight: 64,
        draw: (ctx) => drawManorNorthWallFace(ctx, 0)
    },
    wall_north_b: {
        nativeWidth: 32,
        nativeHeight: 64,
        draw: (ctx) => drawManorNorthWallFace(ctx, 1)
    },
    wall_north_c: {
        nativeWidth: 32,
        nativeHeight: 64,
        draw: (ctx) => drawManorNorthWallFace(ctx, 2)
    },
    wall_north_rose: {
        nativeWidth: 32,
        nativeHeight: 64,
        draw: (ctx) => drawManorNorthWallFace(ctx, 0, "rose")
    },
    wall_north_rose_b: {
        nativeWidth: 32,
        nativeHeight: 64,
        draw: (ctx) => drawManorNorthWallFace(ctx, 1, "rose")
    },
    wall_north_rose_c: {
        nativeWidth: 32,
        nativeHeight: 64,
        draw: (ctx) => drawManorNorthWallFace(ctx, 2, "rose")
    },

    wall_wood: tile32((ctx) => {
        r(ctx, 0, 0, 32, 32, P.woodDark);
        for (let row = 0; row < 4; row++) {
            const y = row * 8;
            r(ctx, 0, y, 32, 7, row % 2 === 0 ? P.wood : P.woodLight);
            r(ctx, 0, y + 7, 32, 1, P.woodDark);
            r(ctx, 0, y, 32, 1, row % 2 === 0 ? P.woodHi : P.wood);
        }
        r(ctx, 0, 0, 3, 32, P.woodDark);
        r(ctx, 29, 0, 3, 32, P.woodDark);
        r(ctx, 2, 0, 1, 32, P.woodHi);
        r(ctx, 29, 0, 1, 32, P.shadow);
        r(ctx, 0, 0, 32, 1, P.outline);
        r(ctx, 0, 31, 32, 1, P.outline);
    }),

    wall_wood_north: {
        nativeWidth: 32,
        nativeHeight: 64,
        draw: (ctx) => drawWoodNorthWallFace(ctx, 0)
    },
    wall_wood_north_b: {
        nativeWidth: 32,
        nativeHeight: 64,
        draw: (ctx) => drawWoodNorthWallFace(ctx, 1)
    },
    wall_wood_north_c: {
        nativeWidth: 32,
        nativeHeight: 64,
        draw: (ctx) => drawWoodNorthWallFace(ctx, 2)
    },
    wall_wood_north_window_l: {
        nativeWidth: 32,
        nativeHeight: 64,
        draw: (ctx) => drawWoodNorthWallFace(ctx, 0, "left")
    },
    wall_wood_north_window_r: {
        nativeWidth: 32,
        nativeHeight: 64,
        draw: (ctx) => drawWoodNorthWallFace(ctx, 0, "right")
    },

    wall_rock: tile32((ctx) => drawRockWallVariant(ctx, 0)),
    wall_rock_b: tile32((ctx) => drawRockWallVariant(ctx, 1)),
    wall_rock_c: tile32((ctx) => drawRockWallVariant(ctx, 2)),
    wall_rock_d: tile32((ctx) => drawRockWallVariant(ctx, 3)),

    wall_pale_rock: tile32((ctx) => drawRockWallVariant(ctx, 0, PALE_ROCK_WALL)),
    wall_pale_rock_b: tile32((ctx) => drawRockWallVariant(ctx, 1, PALE_ROCK_WALL)),
    wall_pale_rock_c: tile32((ctx) => drawRockWallVariant(ctx, 2, PALE_ROCK_WALL)),
    wall_pale_rock_d: tile32((ctx) => drawRockWallVariant(ctx, 3, PALE_ROCK_WALL)),

    wall_pale_rock_north: {
        nativeWidth: 32,
        nativeHeight: 64,
        draw: (ctx) => drawPaleRockNorthWallFace(ctx, 0)
    },
    wall_pale_rock_north_b: {
        nativeWidth: 32,
        nativeHeight: 64,
        draw: (ctx) => drawPaleRockNorthWallFace(ctx, 1)
    },
    wall_pale_rock_north_c: {
        nativeWidth: 32,
        nativeHeight: 64,
        draw: (ctx) => drawPaleRockNorthWallFace(ctx, 2)
    },

    floor: tile32((ctx) => {
        // Horizontal planks — tiles seamlessly; no checkerboard
        for (let row = 0; row < 4; row++) {
            const y = row * 8;
            r(ctx, 0, y, 32, 7, row % 2 === 0 ? P.floorPlank : P.floorPlankAlt);
            r(ctx, 0, y + 7, 32, 1, P.floorSeam);
        }
        // Occasional grain knots (sparse, low contrast)
        const knots: [number, number][] = [
            [6, 5], [19, 2], [27, 13], [11, 21], [4, 26], [22, 25]
        ];
        for (const [kx, ky] of knots) {
            r(ctx, kx, ky, 2, 1, P.floorGrain);
        }
    }),

    floor_attic: tile32((ctx) => drawAtticWoodFloorVariant(ctx, 0)),
    floor_attic_b: tile32((ctx) => drawAtticWoodFloorVariant(ctx, 1)),
    floor_attic_c: tile32((ctx) => drawAtticWoodFloorVariant(ctx, 2)),
    floor_attic_d: tile32((ctx) => drawAtticWoodFloorVariant(ctx, 3)),
    floor_attic_e: tile32((ctx) => drawAtticWoodFloorVariant(ctx, 4)),
    floor_attic_f: tile32((ctx) => drawAtticWoodFloorVariant(ctx, 5)),

    wall_attic: tile32((ctx) => drawAtticWoodWallVariant(ctx, 0)),
    wall_attic_b: tile32((ctx) => drawAtticWoodWallVariant(ctx, 1)),
    wall_attic_c: tile32((ctx) => drawAtticWoodWallVariant(ctx, 2)),

    wall_attic_north: {
        nativeWidth: 32,
        nativeHeight: 64,
        draw: (ctx) => drawAtticNorthWallFace(ctx, 0)
    },
    wall_attic_north_b: {
        nativeWidth: 32,
        nativeHeight: 64,
        draw: (ctx) => drawAtticNorthWallFace(ctx, 1)
    },
    wall_attic_north_c: {
        nativeWidth: 32,
        nativeHeight: 64,
        draw: (ctx) => drawAtticNorthWallFace(ctx, 2)
    },
    wall_attic_north_window_l: {
        nativeWidth: 32,
        nativeHeight: 64,
        draw: (ctx) => drawAtticNorthWallFace(ctx, 0, { side: "left", style: "intact" })
    },
    wall_attic_north_window_r: {
        nativeWidth: 32,
        nativeHeight: 64,
        draw: (ctx) => drawAtticNorthWallFace(ctx, 0, { side: "right", style: "intact" })
    },
    wall_attic_north_window_cracked_l: {
        nativeWidth: 32,
        nativeHeight: 64,
        draw: (ctx) => drawAtticNorthWallFace(ctx, 1, { side: "left", style: "cracked" })
    },
    wall_attic_north_window_cracked_r: {
        nativeWidth: 32,
        nativeHeight: 64,
        draw: (ctx) => drawAtticNorthWallFace(ctx, 1, { side: "right", style: "cracked" })
    },
    wall_attic_north_window_broken_l: {
        nativeWidth: 32,
        nativeHeight: 64,
        draw: (ctx) => drawAtticNorthWallFace(ctx, 0, { side: "left", style: "broken" })
    },
    wall_attic_north_window_broken_r: {
        nativeWidth: 32,
        nativeHeight: 64,
        draw: (ctx) => drawAtticNorthWallFace(ctx, 0, { side: "right", style: "broken" })
    },

    grass: tile32((ctx) => {
        // Uniform fill — no outline ring so repeated tiles blend
        r(ctx, 0, 0, 32, 32, P.grass);
        const tufts: [number, number, number, number, string][] = [
            [2, 3, 2, 3, P.grassLight],
            [8, 6, 1, 4, P.grassHi],
            [14, 2, 3, 2, P.grassDark],
            [19, 9, 2, 5, P.grassLight],
            [25, 4, 1, 3, P.grassHi],
            [5, 14, 4, 2, P.grassLight],
            [13, 12, 2, 4, P.grassDark],
            [22, 15, 3, 2, P.grassLight],
            [28, 11, 2, 3, P.grassHi],
            [1, 22, 3, 2, P.grassDark],
            [10, 20, 2, 5, P.grassLight],
            [17, 24, 1, 2, P.grassHi],
            [24, 21, 4, 2, P.grassLight],
            [7, 27, 2, 3, P.grassDark],
            [15, 18, 2, 2, P.grassHi]
        ];
        for (const [x, y, w, h, color] of tufts) {
            r(ctx, x, y, w, h, color);
        }
    }),

    gravel: tile32((ctx) => {
        // Uniform fill — no outline ring so path tiles blend with each other and grass edges
        r(ctx, 0, 0, 32, 32, P.gravel);
        const pebbles: [number, number, number, number, string][] = [
            [2, 4, 2, 2, P.gravelLight],
            [9, 2, 3, 2, P.gravelDark],
            [16, 6, 2, 3, P.gravelLight],
            [23, 3, 2, 2, P.gravelDark],
            [28, 8, 2, 2, P.gravelLight],
            [5, 12, 2, 2, P.gravelDark],
            [13, 11, 3, 2, P.gravelLight],
            [20, 14, 2, 2, P.gravelDark],
            [26, 17, 3, 2, P.gravelLight],
            [1, 19, 2, 2, P.gravelLight],
            [8, 22, 2, 3, P.gravelDark],
            [15, 20, 2, 2, P.gravelLight],
            [22, 24, 3, 2, P.gravelDark],
            [27, 21, 2, 2, P.gravelLight],
            [4, 27, 2, 2, P.gravelDark],
            [12, 26, 2, 2, P.gravelLight],
            [18, 28, 3, 2, P.gravelDark],
            [25, 27, 2, 2, P.gravelLight]
        ];
        for (const [x, y, w, h, color] of pebbles) {
            r(ctx, x, y, w, h, color);
        }
    }),

    sand: tile32((ctx) => {
        r(ctx, 0, 0, 32, 32, P.sand);
        const grains: [number, number, number, number, string][] = [
            [3, 5, 2, 2, P.sandLight],
            [10, 3, 3, 2, P.sandDark],
            [17, 7, 2, 2, P.sandHi],
            [24, 4, 2, 3, P.sandLight],
            [6, 13, 2, 2, P.sandDark],
            [14, 12, 3, 2, P.sandLight],
            [21, 15, 2, 2, P.sandDark],
            [27, 11, 2, 2, P.sandHi],
            [2, 20, 3, 2, P.sandLight],
            [9, 23, 2, 2, P.sandDark],
            [16, 21, 2, 3, P.sandLight],
            [23, 25, 3, 2, P.sandDark],
            [28, 22, 2, 2, P.sandHi],
            [5, 28, 2, 2, P.sandLight],
            [12, 27, 2, 2, P.sandDark],
            [19, 29, 3, 2, P.sandLight]
        ];
        for (const [x, y, w, h, color] of grains) {
            r(ctx, x, y, w, h, color);
        }
    }),

    ceramic: tile32((ctx) => {
        const tile = 8;
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const x = col * tile;
                const y = row * tile;
                r(ctx, x, y, tile, tile, (row + col) % 2 === 0 ? P.ceramicLight : P.ceramic);
                r(ctx, x, y, tile, 1, P.grout);
                r(ctx, x, y, 1, tile, P.grout);
            }
        }
        r(ctx, 0, 31, 32, 1, P.grout);
        r(ctx, 31, 0, 1, 32, P.grout);
    }),

    floor_marble: tile32((ctx) => {
        r(ctx, 0, 0, 32, 32, P.marbleLight);
        r(ctx, 0, 0, 32, 1, P.marbleShadow);
        r(ctx, 0, 0, 1, 32, P.marbleShadow);
        r(ctx, 31, 0, 1, 32, P.marbleVein);
        r(ctx, 0, 31, 32, 1, P.marbleVein);
        const veins: [number, number, number, number][] = [
            [4, 6, 12, 1],
            [18, 3, 10, 1],
            [8, 14, 16, 1],
            [2, 22, 14, 1],
            [20, 18, 8, 1],
            [14, 26, 12, 1]
        ];
        for (const [x, y, w, h] of veins) {
            r(ctx, x, y, w, h, P.marbleVein);
        }
        r(ctx, 10, 10, 3, 2, P.marble);
        r(ctx, 22, 8, 2, 3, P.marbleShadow);
    }),

    wall_pale: tile32((ctx) => {
        r(ctx, 0, 0, 32, 32, P.paleWall);
        for (let row = 0; row < 4; row++) {
            const y = row * 8;
            r(ctx, 0, y, 32, 7, row % 2 === 0 ? P.paleWall : P.paleWallAlt);
            r(ctx, 0, y + 7, 32, 1, P.paleWallTrim);
        }
        r(ctx, 0, 0, 32, 2, P.paleWallGold);
        r(ctx, 0, 30, 32, 2, P.paleWallTrim);
        r(ctx, 0, 0, 2, 32, P.paleWallTrim);
        r(ctx, 30, 0, 2, 32, P.paleWallTrim);
        r(ctx, 4, 12, 24, 1, P.paleWallGold);
        r(ctx, 4, 20, 24, 1, P.paleWallGold);
    }),

    rock: tile32((ctx) => drawRockFloorVariant(ctx, 0)),
    rock_b: tile32((ctx) => drawRockFloorVariant(ctx, 1)),
    rock_c: tile32((ctx) => drawRockFloorVariant(ctx, 2)),
    rock_d: tile32((ctx) => drawRockFloorVariant(ctx, 3)),

    pale_rock: tile32((ctx) => drawRockFloorVariant(ctx, 0, PALE_ROCK_FLOOR)),
    pale_rock_b: tile32((ctx) => drawRockFloorVariant(ctx, 1, PALE_ROCK_FLOOR)),
    pale_rock_c: tile32((ctx) => drawRockFloorVariant(ctx, 2, PALE_ROCK_FLOOR)),
    pale_rock_d: tile32((ctx) => drawRockFloorVariant(ctx, 3, PALE_ROCK_FLOOR)),

    door: {
        nativeWidth: 32,
        nativeHeight: 48,
        draw(ctx) {
            r(ctx, 2, 0, 28, 48, P.woodDark);
            r(ctx, 4, 2, 24, 44, P.wood);
            r(ctx, 6, 4, 20, 38, P.woodLight);
            r(ctx, 8, 8, 16, 30, P.woodHi);
            r(ctx, 22, 24, 4, 4, P.gold);
            r(ctx, 10, 6, 12, 2, P.shadow);
            r(ctx, 2, 0, 2, 48, P.outline);
            r(ctx, 28, 0, 2, 48, P.outline);
            r(ctx, 2, 0, 28, 2, P.outline);
        }
    },

    door_wood: {
        nativeWidth: 32,
        nativeHeight: 48,
        draw(ctx) {
            // Rustic barn door — double planks with diagonal braces
            r(ctx, 0, 0, 32, 48, P.woodDark);
            r(ctx, 2, 2, 13, 44, P.wood);
            r(ctx, 17, 2, 13, 44, P.woodLight);
            r(ctx, 3, 4, 11, 18, P.woodHi);
            r(ctx, 18, 4, 11, 18, P.wood);
            r(ctx, 3, 24, 11, 20, P.wood);
            r(ctx, 18, 24, 11, 20, P.woodHi);
            // X braces on each leaf
            for (let i = 0; i < 10; i++) {
                r(ctx, 4 + i, 6 + i, 2, 2, P.woodDark);
                r(ctx, 13 - i, 6 + i, 2, 2, P.woodDark);
                r(ctx, 19 + i, 6 + i, 2, 2, P.woodDark);
                r(ctx, 28 - i, 6 + i, 2, 2, P.woodDark);
            }
            r(ctx, 14, 0, 4, 48, P.woodDark);
            r(ctx, 6, 22, 3, 4, P.mid);
            r(ctx, 23, 22, 3, 4, P.mid);
            r(ctx, 0, 0, 32, 2, P.outline);
            r(ctx, 0, 46, 32, 2, P.outline);
            r(ctx, 0, 0, 2, 48, P.outline);
            r(ctx, 30, 0, 2, 48, P.outline);
        }
    },

    /** Grand double doors for the master suite — wide ornate panels, brass hardware. */
    door_manor: {
        nativeWidth: 96,
        nativeHeight: 32,
        draw(ctx) {
            const W = 96;
            const H = 32;
            // Marble threshold
            r(ctx, 0, H - 4, W, 4, P.stoneLight);
            r(ctx, 0, H - 4, W, 1, P.stoneHi);
            // Outer frame
            r(ctx, 0, 0, W, H - 4, P.woodDark);
            r(ctx, 2, 2, W - 4, H - 8, P.wood);
            // Architrave band
            r(ctx, 2, 2, W - 4, 5, P.woodDark);
            r(ctx, 4, 3, W - 8, 3, P.goldDark);
            // Carved flourish crest (center top)
            r(ctx, 42, 3, 12, 3, P.gold);
            r(ctx, 44, 2, 8, 1, P.gold);
            r(ctx, 46, 4, 4, 2, P.goldDark);
            // Left leaf
            r(ctx, 4, 8, 40, H - 12, P.woodDark);
            r(ctx, 6, 10, 36, H - 16, P.woodLight);
            r(ctx, 8, 12, 14, 8, P.woodHi);
            r(ctx, 24, 12, 14, 8, P.wood);
            r(ctx, 8, 22, 14, H - 26, P.wood);
            r(ctx, 24, 22, 14, H - 26, P.woodHi);
            r(ctx, 6, 10, 2, H - 16, P.goldDark);
            r(ctx, 40, 10, 2, H - 16, P.goldDark);
            // Right leaf
            r(ctx, 52, 8, 40, H - 12, P.woodDark);
            r(ctx, 54, 10, 36, H - 16, P.woodLight);
            r(ctx, 56, 12, 14, 8, P.wood);
            r(ctx, 72, 12, 14, 8, P.woodHi);
            r(ctx, 56, 22, 14, H - 26, P.woodHi);
            r(ctx, 72, 22, 14, H - 26, P.wood);
            r(ctx, 54, 10, 2, H - 16, P.goldDark);
            r(ctx, 88, 10, 2, H - 16, P.goldDark);
            // Center mullion / newel
            r(ctx, 45, 6, 6, H - 10, P.woodDark);
            r(ctx, 46, 4, 4, 4, P.gold);
            r(ctx, 47, 5, 2, 2, P.goldDark);
            // Brass handles
            r(ctx, 38, Math.floor(H / 2) - 1, 4, 4, P.gold);
            r(ctx, 54, Math.floor(H / 2) - 1, 4, 4, P.gold);
            r(ctx, 39, Math.floor(H / 2), 2, 2, P.goldDark);
            r(ctx, 55, Math.floor(H / 2), 2, 2, P.goldDark);
            // Outline
            r(ctx, 0, 0, W, 1, P.outline);
            r(ctx, 0, H - 5, W, 1, P.outline);
            r(ctx, 0, 0, 1, H - 4, P.outline);
            r(ctx, W - 1, 0, 1, H - 4, P.outline);
        }
    },

    /** Ballroom French doors — muted frame with darker glass panes. */
    door_glass: {
        nativeWidth: 96,
        nativeHeight: 32,
        draw(ctx) {
            const W = 96;
            const H = 32;
            const pane = "#5a6a78";
            const paneHi = "#7a8a98";
            const paneShine = "#9aaab0";
            r(ctx, 0, H - 3, W, 3, P.marbleVein);
            r(ctx, 0, H - 3, W, 1, P.marbleShadow);
            // Darker painted frame
            r(ctx, 0, 0, W, H - 3, P.paleWallTrim);
            r(ctx, 2, 2, W - 4, H - 7, P.paleWallAlt);
            r(ctx, 2, 2, W - 4, 4, P.paleWallGold);
            // Center stile
            r(ctx, 45, 4, 6, H - 8, P.paleWallTrim);
            r(ctx, 46, 5, 4, H - 10, P.woodDark);
            // Left glass leaf — 2×2 panes
            r(ctx, 5, 7, 38, H - 12, P.paleWallTrim);
            for (const gx of [7, 24]) {
                for (const gy of [9, 18]) {
                    r(ctx, gx, gy, 15, 7, pane);
                    r(ctx, gx + 1, gy + 1, 6, 2, paneHi);
                    r(ctx, gx + 10, gy + 4, 4, 2, paneShine);
                }
            }
            // Right glass leaf
            r(ctx, 53, 7, 38, H - 12, P.paleWallTrim);
            for (const gx of [55, 72]) {
                for (const gy of [9, 18]) {
                    r(ctx, gx, gy, 15, 7, pane);
                    r(ctx, gx + 1, gy + 1, 6, 2, paneHi);
                    r(ctx, gx + 10, gy + 4, 4, 2, paneShine);
                }
            }
            // Handles
            r(ctx, 40, Math.floor(H / 2) - 1, 3, 3, P.silverDark);
            r(ctx, 53, Math.floor(H / 2) - 1, 3, 3, P.silverDark);
            r(ctx, 0, 0, W, 1, P.outline);
            r(ctx, 0, H - 4, W, 1, P.outline);
            r(ctx, 0, 0, 1, H - 3, P.outline);
            r(ctx, W - 1, 0, 1, H - 3, P.outline);
        }
    },

    /** Heavy castle doors for the garden entrance — iron-banded oak under a stone arch. */
    door_castle: {
        nativeWidth: 96,
        nativeHeight: 32,
        draw(ctx) {
            const W = 96;
            const H = 32;
            // Stone threshold / step
            r(ctx, 0, H - 4, W, 4, P.rockDark);
            r(ctx, 2, H - 3, W - 4, 2, P.stone);
            // Stone arch surround
            r(ctx, 0, 0, W, H - 4, P.rockDark);
            r(ctx, 3, 2, W - 6, H - 8, P.stone);
            r(ctx, 6, 0, W - 12, 5, P.stoneLight);
            r(ctx, 40, 0, 16, 3, P.rockDark);
            // Heavy oak leaves
            r(ctx, 8, 6, 36, H - 12, P.woodDark);
            r(ctx, 10, 8, 32, H - 16, P.woodDark);
            r(ctx, 52, 6, 36, H - 12, P.woodDark);
            r(ctx, 54, 8, 32, H - 16, P.wood);
            // Vertical plank lines
            for (let i = 0; i < 4; i++) {
                r(ctx, 12 + i * 8, 8, 1, H - 16, P.woodDark);
                r(ctx, 56 + i * 8, 8, 1, H - 16, P.woodDark);
            }
            // Iron bands
            r(ctx, 8, 10, 36, 3, P.ironDark);
            r(ctx, 8, 20, 36, 3, P.ironDark);
            r(ctx, 52, 10, 36, 3, P.ironDark);
            r(ctx, 52, 20, 36, 3, P.ironDark);
            r(ctx, 8, 11, 36, 1, P.iron);
            r(ctx, 52, 11, 36, 1, P.iron);
            // Rivets
            for (const bx of [12, 28, 40, 56, 72, 84]) {
                r(ctx, bx, 10, 2, 2, P.silverDark);
                r(ctx, bx, 20, 2, 2, P.silverDark);
            }
            // Center seam + iron ring handles
            r(ctx, 45, 6, 6, H - 12, P.woodDark);
            r(ctx, 36, 14, 6, 6, P.iron);
            r(ctx, 54, 14, 6, 6, P.iron);
            r(ctx, 37, 15, 4, 4, P.ironDark);
            r(ctx, 55, 15, 4, 4, P.ironDark);
            r(ctx, 38, 16, 2, 2, P.silver);
            r(ctx, 56, 16, 2, 2, P.silver);
            // Outline
            r(ctx, 0, 0, W, 1, P.outline);
            r(ctx, 0, H - 5, W, 1, P.outline);
            r(ctx, 0, 0, 1, H - 4, P.outline);
            r(ctx, W - 1, 0, 1, H - 4, P.outline);
        }
    },

    table: {
        nativeWidth: 32,
        nativeHeight: 32,
        draw(ctx) {
            r(ctx, 2, 10, 28, 8, P.woodLight);
            r(ctx, 2, 10, 28, 2, P.woodHi);
            r(ctx, 2, 16, 28, 2, P.woodDark);
            r(ctx, 2, 10, 2, 8, P.woodHi);
            r(ctx, 28, 10, 2, 8, P.woodDark);
            r(ctx, 6, 18, 4, 12, P.woodDark);
            r(ctx, 22, 18, 4, 12, P.woodDark);
            r(ctx, 7, 18, 2, 2, P.wood);
            r(ctx, 23, 18, 2, 2, P.wood);
        }
    },

    bookshelf: {
        nativeWidth: 32,
        nativeHeight: 48,
        draw(ctx) {
            r(ctx, 2, 0, 28, 48, P.woodDark);
            r(ctx, 4, 2, 24, 44, P.wood);
            for (let y = 6; y < 44; y += 12) {
                r(ctx, 4, y, 24, 2, P.woodLight);
            }
            const bookColors = [P.red, P.blue, P.green, P.gold, P.redLight];
            for (let shelf = 0; shelf < 3; shelf++) {
                const by = 8 + shelf * 12;
                for (let i = 0; i < 5; i++) {
                    r(ctx, 6 + i * 4, by, 3, 8, bookColors[i % bookColors.length]);
                }
            }
            r(ctx, 2, 0, 2, 48, P.outline);
            r(ctx, 28, 0, 2, 48, P.outline);
        }
    }
};
