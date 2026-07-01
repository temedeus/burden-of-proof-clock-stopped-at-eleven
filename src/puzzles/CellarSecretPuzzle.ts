import { spriteLoader } from "../assets/SpriteLoader";
import { TILE_SIZE } from "../world/constants";
import { removeInteractableById, setHiddenExitDoorOpen } from "../world/Rooms";
import type { Room } from "../world/Room";

const REVEAL_DURATION = 1.4;

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
        const y = 16 * TILE_SIZE;

        if (rawT < 0.12) {
            const nudge = easeInOutCubic(rawT / 0.12) * 3;
            spriteLoader.drawSprite(
                ctx,
                "secret_cellar_barrels",
                11 * TILE_SIZE - nudge,
                y,
                TILE_SIZE * 3,
                TILE_SIZE * 2
            );
            return;
        }

        const slideT = easeInOutCubic((rawT - 0.12) / 0.88);
        const slides: [number, number][] = [
            [11, 9],
            [12, 10],
            [13, 14]
        ];

        for (const [from, to] of slides) {
            const x = (from + (to - from) * slideT) * TILE_SIZE;
            spriteLoader.drawSprite(ctx, "wine_barrel", x, y, TILE_SIZE, TILE_SIZE * 2);
        }

        if (slideT > 0.3) {
            const fade = Math.min(1, (slideT - 0.3) / 0.7);
            ctx.save();
            ctx.globalAlpha = fade;
            spriteLoader.drawSprite(ctx, "wine_barrel", 15 * TILE_SIZE, y, TILE_SIZE, TILE_SIZE * 2);
            ctx.restore();
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
