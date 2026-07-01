import { TILE_SIZE } from "../world/constants";
import { drawWineBarrelsAtAnchors, wineBarrelDrawY, WINE_BARREL_DRAW_PX } from "../render/wineBarrelDraw";
import { spriteLoader } from "../assets/SpriteLoader";
import { addFurnitureToRoom, removeInteractableById, setHiddenExitDoorOpen } from "../world/Rooms";
import type { Room } from "../world/Room";

const REVEAL_DURATION = 1.4;

/** Clustered barrel anchors before the passage opens (tiles 10–13). */
const BARREL_START_X = [10, 11, 12, 13] as const;
/** Left pair west of the door; right pair east. */
const BARREL_END_X = [8, 9, 14, 15] as const;
const BARREL_Y = 15;

function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export interface CellarSecretRevealResult {
    message: string;
    enterDialog: boolean;
}

export class CellarSecretPuzzle {
    revealed = false;
    private anim: { elapsed: number; duration: number; doorOpened: boolean } | null = null;

    constructor(
        private getCellarRoom: () => Room,
        private getTunnelRoom: () => Room
    ) {}

    isAnimating(): boolean {
        return this.anim != null;
    }

    applyDoorState(): void {
        setHiddenExitDoorOpen(this.getCellarRoom(), this.revealed, "secret_tunnel");
        setHiddenExitDoorOpen(this.getTunnelRoom(), this.revealed, "cellar_storage");
    }

    startReveal(): void {
        if (this.revealed || this.anim) return;
        removeInteractableById(this.getCellarRoom(), "secret_cellar_barrels");
        removeInteractableById(this.getTunnelRoom(), "cellar_passage_switch");
        this.anim = { elapsed: 0, duration: REVEAL_DURATION, doorOpened: false };
    }

    update(dt: number): CellarSecretRevealResult | null {
        const anim = this.anim;
        if (!anim) return null;

        anim.elapsed += dt;
        const t = Math.min(1, anim.elapsed / anim.duration);

        if (!anim.doorOpened && t >= 0.55) {
            setHiddenExitDoorOpen(this.getCellarRoom(), true, "secret_tunnel");
            setHiddenExitDoorOpen(this.getTunnelRoom(), true, "cellar_storage");
            anim.doorOpened = true;
        }

        if (anim.elapsed >= anim.duration) {
            return this.finish();
        }
        return null;
    }

    private finish(): CellarSecretRevealResult {
        if (this.revealed) {
            this.anim = null;
            return { message: "", enterDialog: false };
        }

        this.revealed = true;
        this.anim = null;

        const cellar = this.getCellarRoom();
        for (const x of BARREL_END_X) {
            addFurnitureToRoom(cellar, { furnitureId: "wine_barrel", x, y: BARREL_Y, anchor: "top-left" });
        }
        setHiddenExitDoorOpen(cellar, true, "secret_tunnel");
        setHiddenExitDoorOpen(this.getTunnelRoom(), true, "cellar_storage");

        return {
            message: "The barrels roll aside, revealing a hidden passage.",
            enterDialog: true
        };
    }

    render(ctx: CanvasRenderingContext2D, currentRoomId: string): void {
        const anim = this.anim;
        if (!anim || currentRoomId !== "cellar_storage") return;

        const rawT = Math.min(1, anim.elapsed / anim.duration);

        if (rawT < 0.12) {
            const nudge = easeInOutCubic(rawT / 0.12) * 3;
            drawWineBarrelsAtAnchors(ctx, BARREL_START_X, BARREL_Y, -nudge);
            return;
        }

        const slideT = easeInOutCubic((rawT - 0.12) / 0.88);
        const drawY = wineBarrelDrawY(BARREL_Y);
        for (let i = 0; i < BARREL_START_X.length; i++) {
            const from = BARREL_START_X[i];
            const to = BARREL_END_X[i];
            const x = (from + (to - from) * slideT) * TILE_SIZE;
            spriteLoader.drawSprite(ctx, "wine_barrel", x, drawY, WINE_BARREL_DRAW_PX, WINE_BARREL_DRAW_PX);
        }
    }

    isExitBlocked(fromRoomId: string, exitTargetRoom: string): boolean {
        if (this.revealed && !this.isAnimating()) return false;
        return (
            (fromRoomId === "cellar_storage" && exitTargetRoom === "secret_tunnel") ||
            (fromRoomId === "secret_tunnel" && exitTargetRoom === "cellar_storage")
        );
    }
}
