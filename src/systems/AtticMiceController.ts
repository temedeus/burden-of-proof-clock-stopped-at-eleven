import { ATTIC_BEAM_SURFACE_Y_OFFSET, drawAtticMouse } from "../assets/procedural/attic_mouse";
import type { DepthActor } from "../render/roomScene";
import { TILE_SIZE } from "../world/constants";

const ATTIC_ROOM_ID = "attic";
const BEAM_ROWS = [5, 12] as const;
const BEAM_MIN_TILE_X = 2;
const BEAM_MAX_TILE_X = 22;
const MOUSE_COUNT = 3;

type MouseMode = "run" | "pause";

interface AtticMouse {
    id: number;
    beamRow: number;
    x: number;
    dir: 1 | -1;
    mode: MouseMode;
    modeElapsed: number;
    modeDuration: number;
    runSpeed: number;
    rng: () => number;
}

function mulberry32(seed: number): () => number {
    let s = seed | 0;
    return () => {
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function beamMinX(): number {
    return BEAM_MIN_TILE_X * TILE_SIZE + 10;
}

function beamMaxX(): number {
    return BEAM_MAX_TILE_X * TILE_SIZE + TILE_SIZE - 10;
}

function beamSurfaceY(row: number): number {
    return row * TILE_SIZE + ATTIC_BEAM_SURFACE_Y_OFFSET;
}

function pickRunDuration(rng: () => number): number {
    return 1.4 + rng() * 3.6;
}

function pickPauseDuration(rng: () => number): number {
    return 1.1 + rng() * 2.8;
}

function pickRunSpeed(rng: () => number): number {
    return 24 + rng() * 38;
}

function spawnMouse(id: number): AtticMouse {
    const rng = mulberry32(0xac71c000 + id * 7919);
    const beamRow = BEAM_ROWS[Math.floor(rng() * BEAM_ROWS.length)];
    const dir: 1 | -1 = rng() < 0.5 ? -1 : 1;
    const span = beamMaxX() - beamMinX();
    const x = beamMinX() + rng() * span;
    return {
        id,
        beamRow,
        x,
        dir,
        mode: rng() < 0.25 ? "pause" : "run",
        modeElapsed: 0,
        modeDuration: 0,
        runSpeed: pickRunSpeed(rng),
        rng
    };
}

function beginMode(mouse: AtticMouse, mode: MouseMode): void {
    mouse.mode = mode;
    mouse.modeElapsed = 0;
    if (mode === "run") {
        mouse.modeDuration = pickRunDuration(mouse.rng);
        mouse.runSpeed = pickRunSpeed(mouse.rng);
    } else {
        mouse.modeDuration = pickPauseDuration(mouse.rng);
    }
}

function ensureModeDuration(mouse: AtticMouse): void {
    if (mouse.modeDuration <= 0) {
        beginMode(mouse, mouse.mode);
    }
}

export class AtticMiceController {
    private mice: AtticMouse[] = [];
    private activeRoomId: string | null = null;

    syncForRoom(roomId: string): void {
        if (roomId === this.activeRoomId) return;
        this.activeRoomId = roomId;
        if (roomId !== ATTIC_ROOM_ID) {
            this.mice = [];
            return;
        }
        this.mice = Array.from({ length: MOUSE_COUNT }, (_, i) => {
            const mouse = spawnMouse(i);
            beginMode(mouse, mouse.mode);
            return mouse;
        });
    }

    update(dt: number, roomId: string): void {
        this.syncForRoom(roomId);
        if (roomId !== ATTIC_ROOM_ID || this.mice.length === 0) return;

        const minX = beamMinX();
        const maxX = beamMaxX();

        for (const mouse of this.mice) {
            ensureModeDuration(mouse);
            mouse.modeElapsed += dt;

            if (mouse.mode === "pause") {
                if (mouse.modeElapsed >= mouse.modeDuration) {
                    beginMode(mouse, "run");
                    if (mouse.rng() < 0.5) mouse.dir = (mouse.dir * -1) as 1 | -1;
                }
                continue;
            }

            mouse.x += mouse.dir * mouse.runSpeed * dt;

            if (mouse.x <= minX) {
                mouse.x = minX;
                mouse.dir = 1;
                beginMode(mouse, mouse.rng() < 0.55 ? "pause" : "run");
            } else if (mouse.x >= maxX) {
                mouse.x = maxX;
                mouse.dir = -1;
                beginMode(mouse, mouse.rng() < 0.55 ? "pause" : "run");
            } else if (mouse.modeElapsed >= mouse.modeDuration) {
                beginMode(mouse, mouse.rng() < 0.42 ? "pause" : "run");
            }
        }
    }

    getActors(getAnimTime: () => number): DepthActor[] {
        if (this.activeRoomId !== ATTIC_ROOM_ID) return [];

        return this.mice.map((mouse) => {
            const y = beamSurfaceY(mouse.beamRow);
            const running = mouse.mode === "run";
            return {
                y,
                height: 8,
                render: (ctx) => {
                    drawAtticMouse(ctx, mouse.x, y, mouse.dir, getAnimTime() + mouse.id * 1.7, running);
                }
            };
        });
    }
}

export const atticMice = new AtticMiceController();
