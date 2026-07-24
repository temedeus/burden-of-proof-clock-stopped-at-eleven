import { P } from "./palette";
import { grid, r } from "./pixel";
import type { ProceduralSpriteDef } from "./types";

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

type RockFloorGrit = [number, number, number, number, string];
type RockFloorFleck = [number, number, string];

function drawRockFloorVariant(
    ctx: CanvasRenderingContext2D,
    variant: 0 | 1 | 2 | 3
): void {
    r(ctx, 0, 0, 32, 32, P.rockFloorVoid);

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

    const gritSets: RockFloorGrit[][] = [
        [
            [10, 8, 3, 1, P.rockFloorShadow],
            [20, 12, 2, 2, P.rockFloorDark],
            [6, 20, 2, 1, P.rockFloorFleck],
            [24, 6, 2, 1, P.rockFloorShadow],
            [14, 22, 3, 1, P.rockFloorDark],
            [27, 18, 1, 2, P.rockFloorVoid]
        ],
        [
            [8, 10, 2, 2, P.rockFloorShadow],
            [18, 7, 3, 1, P.rockFloorDark],
            [5, 17, 2, 1, P.rockFloorFleck],
            [22, 20, 2, 2, P.rockFloorMid],
            [12, 5, 1, 3, P.rockFloorVoid],
            [28, 11, 1, 2, P.rockFloorShadow]
        ],
        [
            [11, 11, 2, 1, P.rockFloorShadow],
            [7, 7, 2, 2, P.rockFloorDark],
            [21, 9, 2, 1, P.rockFloorFleck],
            [16, 24, 3, 1, P.rockFloorShadow],
            [3, 14, 1, 2, P.rockFloorVoid],
            [26, 26, 2, 1, P.rockFloorDark]
        ],
        [
            [9, 6, 2, 1, P.rockFloorShadow],
            [19, 15, 2, 2, P.rockFloorDark],
            [4, 22, 3, 1, P.rockFloorFleck],
            [23, 4, 2, 1, P.rockFloorShadow],
            [15, 19, 1, 2, P.rockFloorVoid],
            [27, 22, 2, 1, P.rockFloorMid]
        ]
    ];

    const fleckSets: RockFloorFleck[][] = [
        [
            [5, 5, P.rockFloorFleck],
            [16, 3, P.rockFloorShadow],
            [25, 17, P.rockFloorFleck],
            [8, 23, P.rockFloorHi],
            [20, 21, P.rockFloorShadow]
        ],
        [
            [7, 4, P.rockFloorFleck],
            [14, 14, P.rockFloorShadow],
            [24, 8, P.rockFloorFleck],
            [10, 19, P.rockFloorHi],
            [18, 26, P.rockFloorShadow]
        ],
        [
            [6, 8, P.rockFloorFleck],
            [13, 2, P.rockFloorShadow],
            [22, 19, P.rockFloorFleck],
            [4, 16, P.rockFloorHi],
            [17, 24, P.rockFloorShadow]
        ],
        [
            [8, 14, P.rockFloorFleck],
            [15, 6, P.rockFloorShadow],
            [26, 14, P.rockFloorFleck],
            [11, 26, P.rockFloorHi],
            [21, 4, P.rockFloorShadow]
        ]
    ];

    const layout = layouts[variant];
    const offs = offsets[variant];
    for (let i = 0; i < layout.length; i++) {
        grid(ctx, offs[i][0], offs[i][1], 2, layout[i], ROCK_FLOOR);
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

const ROCK_WALL = {
    v: P.rockVoid,
    s: P.rockShadow,
    d: P.rockDark,
    m: P.rock,
    l: P.rockLight,
    h: P.rockHi,
    f: P.rockFleck
};

type RockWallCrack = [number, number, number, number, string];
type RockWallStreak = [number, number, number, number, string];

function drawRockWallVariant(ctx: CanvasRenderingContext2D, variant: 0 | 1 | 2 | 3): void {
    r(ctx, 0, 0, 32, 32, P.rockVoid);

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

    const cracks: RockWallCrack[][] = [
        [
            [10, 0, 1, 32, P.rockVoid],
            [22, 0, 1, 32, P.rockShadow],
            [5, 8, 1, 14, P.rockVoid],
            [27, 12, 1, 12, P.rockShadow]
        ],
        [
            [8, 0, 1, 28, P.rockVoid],
            [19, 2, 1, 30, P.rockShadow],
            [3, 10, 1, 16, P.rockVoid],
            [25, 6, 1, 18, P.rockFleck]
        ],
        [
            [12, 0, 1, 32, P.rockShadow],
            [6, 0, 1, 24, P.rockVoid],
            [23, 4, 1, 20, P.rockVoid],
            [15, 14, 1, 18, P.rockShadow]
        ],
        [
            [9, 0, 1, 30, P.rockVoid],
            [21, 0, 1, 32, P.rockShadow],
            [4, 16, 1, 12, P.rockVoid],
            [28, 8, 1, 14, P.rockFleck]
        ]
    ];

    const streaks: RockWallStreak[][] = [
        [
            [14, 4, 2, 10, P.rockMid],
            [18, 20, 1, 8, P.rockFleck],
            [3, 22, 3, 1, P.rockHi],
            [24, 6, 2, 1, P.rockHi]
        ],
        [
            [11, 6, 2, 12, P.rockMid],
            [20, 18, 1, 9, P.rockFleck],
            [5, 14, 3, 1, P.rockHi],
            [26, 10, 2, 1, P.rockShadow]
        ],
        [
            [16, 3, 1, 14, P.rockMid],
            [7, 20, 2, 1, P.rockHi],
            [22, 24, 1, 6, P.rockFleck],
            [2, 8, 2, 1, P.rockShadow]
        ],
        [
            [13, 8, 2, 8, P.rockMid],
            [6, 4, 1, 10, P.rockFleck],
            [23, 16, 3, 1, P.rockHi],
            [17, 26, 2, 1, P.rockShadow]
        ]
    ];

    const flecks: [number, number, string][][] = [
        [
            [7, 11, P.rockFleck],
            [29, 19, P.rockShadow],
            [16, 28, P.rockHi]
        ],
        [
            [5, 7, P.rockFleck],
            [27, 15, P.rockShadow],
            [12, 24, P.rockHi]
        ],
        [
            [9, 5, P.rockFleck],
            [25, 22, P.rockShadow],
            [18, 12, P.rockHi]
        ],
        [
            [4, 18, P.rockFleck],
            [21, 9, P.rockShadow],
            [14, 30, P.rockHi]
        ]
    ];

    for (let i = 0; i < layouts[variant].length; i++) {
        const [ox, oy] = offsets[variant][i];
        grid(ctx, ox, oy, 2, layouts[variant][i], ROCK_WALL);
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

export function northWallSpriteName(x: number): (typeof NORTH_WALL_SPRITES)[number] {
    return NORTH_WALL_SPRITES[((x % 3) + 3) % 3];
}

function drawManorNorthWallFace(ctx: CanvasRenderingContext2D, variant: 0 | 1 | 2): void {
    const plaster = [P.paleWall, P.paleWallAlt, P.cream][variant];
    const plasterShade = [P.paleWallAlt, P.paleWallTrim, P.marble][variant];
    const plasterHi = [P.cream, P.paleWall, P.white][variant];

    // Full face fill
    r(ctx, 0, 0, 32, 64, plaster);

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

    wall_rock: tile32((ctx) => drawRockWallVariant(ctx, 0)),
    wall_rock_b: tile32((ctx) => drawRockWallVariant(ctx, 1)),
    wall_rock_c: tile32((ctx) => drawRockWallVariant(ctx, 2)),
    wall_rock_d: tile32((ctx) => drawRockWallVariant(ctx, 3)),

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
