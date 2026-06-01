import { VALID_SPRITE_NAMES, type SpriteName } from "@cse/content-schema";
import { bakeSprite } from "./pixel";
import type { ProceduralSpriteDef } from "./types";
import { TILE_SPRITES } from "./tiles";
import { CHARACTER_SPRITES } from "./characters";
import { FURNITURE_SPRITES } from "./furniture";
import { GARDEN_SPRITES } from "./garden";
import { EXTERIOR_SPRITES } from "./exterior";
import { POND_SPRITES } from "./pond";

const ALL_DEFS: Record<string, ProceduralSpriteDef> = {
    ...TILE_SPRITES,
    ...CHARACTER_SPRITES,
    ...FURNITURE_SPRITES,
    ...GARDEN_SPRITES,
    ...EXTERIOR_SPRITES,
    ...POND_SPRITES
};

export function getSpriteDef(name: string): ProceduralSpriteDef | undefined {
    return ALL_DEFS[name];
}

export function generateAllSprites(): Map<SpriteName, HTMLCanvasElement> {
    const cache = new Map<SpriteName, HTMLCanvasElement>();

    for (const name of VALID_SPRITE_NAMES) {
        const def = ALL_DEFS[name];
        if (!def) {
            console.warn(`No procedural definition for sprite "${name}"`);
            continue;
        }
        cache.set(name, bakeSprite(def));
    }

    return cache;
}

export { ALL_DEFS };
