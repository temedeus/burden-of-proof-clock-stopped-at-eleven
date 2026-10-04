import { drawPond } from "./furnitureOutdoor";
import type { ProceduralSpriteDef } from "./types";

export const POND_SPRITES: Record<string, ProceduralSpriteDef> = {
    pond: {
        nativeWidth: 48,
        nativeHeight: 80,
        draw(ctx) {
            drawPond(ctx);
        }
    }
};
