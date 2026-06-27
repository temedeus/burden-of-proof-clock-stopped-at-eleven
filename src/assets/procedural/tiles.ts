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

export const TILE_SPRITES: Record<string, ProceduralSpriteDef> = {
    wall: tile32((ctx) => {
        grid(ctx, 0, 0, 2, [
            "oooooooooooooooo",
            "obBbBbBbBbBbBbBo",
            "oBsBsBsBsBsBsBsBo",
            "obBbBbBbBbBbBbBo",
            "oBsBsBsBsBsBsBsBo",
            "obBbBbBbBbBbBbBo",
            "oBsBsBsBsBsBsBsBo",
            "obBbBbBbBbBbBbBo",
            "oBsBsBsBsBsBsBsBo",
            "obBbBbBbBbBbBbBo",
            "oBsBsBsBsBsBsBsBo",
            "obBbBbBbBbBbBbBo",
            "oBsBsBsBsBsBsBsBo",
            "obBbBbBbBbBbBbBo",
            "oBsBsBsBsBsBsBsBo",
            "oooooooooooooooo"
        ], C);
    }),

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
