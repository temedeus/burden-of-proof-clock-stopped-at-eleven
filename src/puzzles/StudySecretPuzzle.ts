import { spriteLoader } from "../assets/SpriteLoader";
import { TILE_SIZE } from "../world/constants";
import {
    addFurnitureToRoom,
    removeInteractableById,
    setHiddenExitDoorOpen
} from "../world/Rooms";
import type { Room } from "../world/Room";

const REVEAL_DURATION = 1.4;

function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export interface StudySecretRevealResult {
    message: string;
    enterDialog: boolean;
}

export class StudySecretPuzzle {
    revealed = false;
    private anim: { elapsed: number; duration: number; doorOpened: boolean } | null = null;

    constructor(private getStudyRoom: () => Room) {}

    isAnimating(): boolean {
        return this.anim != null;
    }

    applyDoorState(): void {
        setHiddenExitDoorOpen(this.getStudyRoom(), this.revealed);
    }

    startReveal(): void {
        if (this.revealed || this.anim) return;
        removeInteractableById(this.getStudyRoom(), "secret_bookshelf");
        this.anim = { elapsed: 0, duration: REVEAL_DURATION, doorOpened: false };
    }

    update(dt: number): StudySecretRevealResult | null {
        const anim = this.anim;
        if (!anim) return null;

        anim.elapsed += dt;
        const t = Math.min(1, anim.elapsed / anim.duration);

        if (!anim.doorOpened && t >= 0.55) {
            setHiddenExitDoorOpen(this.getStudyRoom(), true);
            anim.doorOpened = true;
        }

        if (anim.elapsed >= anim.duration) {
            return this.finish();
        }
        return null;
    }

    private finish(): StudySecretRevealResult {
        if (this.revealed) {
            this.anim = null;
            return { message: "", enterDialog: false };
        }

        this.revealed = true;
        this.anim = null;

        const study = this.getStudyRoom();
        for (const x of [9, 10, 14, 15]) {
            addFurnitureToRoom(study, { furnitureId: "bookshelves", x, y: 1, anchor: "top-left" });
        }
        setHiddenExitDoorOpen(study, true);

        return {
            message: "The bookshelf grinds aside, revealing a hidden passage.",
            enterDialog: true
        };
    }

    render(ctx: CanvasRenderingContext2D, currentRoomId: string): void {
        const anim = this.anim;
        if (!anim || currentRoomId !== "study") return;

        const rawT = Math.min(1, anim.elapsed / anim.duration);
        const y = TILE_SIZE;

        if (rawT < 0.12) {
            const nudge = easeInOutCubic(rawT / 0.12) * 3;
            spriteLoader.drawSprite(
                ctx,
                "secret_bookshelf",
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
            spriteLoader.drawSprite(ctx, "bookshelf", x, y, TILE_SIZE, TILE_SIZE * 2);
        }

        if (slideT > 0.3) {
            const fade = Math.min(1, (slideT - 0.3) / 0.7);
            ctx.save();
            ctx.globalAlpha = fade;
            spriteLoader.drawSprite(ctx, "bookshelf", 15 * TILE_SIZE, y, TILE_SIZE, TILE_SIZE * 2);
            ctx.restore();
        }
    }

    isExitBlocked(exitTargetRoom: string): boolean {
        return exitTargetRoom === "hidden_room" && (!this.revealed || this.isAnimating());
    }
}
