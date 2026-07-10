import { TILE_SIZE } from "../world/constants";
import type { Interactable } from "../world/Interactable";

/** Resolve footstep variant from walkable decor under the player's feet. */
export function resolveFootstepSound(
    x: number,
    y: number,
    width: number,
    height: number,
    interactables: Interactable[]
): string | undefined {
    const leftTile = Math.floor(x / TILE_SIZE);
    const rightTile = Math.ceil((x + width) / TILE_SIZE);
    const bottomRow = Math.ceil((y + height) / TILE_SIZE) - 1;

    for (const obj of interactables) {
        if (!obj.footstepSound) continue;
        const tiles = obj.footprintTiles ?? obj.tiles;
        for (let tx = leftTile; tx < rightTile; tx++) {
            if (tiles.some((t) => t.x === tx && t.y === bottomRow)) {
                return obj.footstepSound;
            }
        }
    }

    return undefined;
}
