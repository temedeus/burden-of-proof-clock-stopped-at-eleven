import type { NPCConfig, RoomConfig } from "@cse/content-schema";
import { resolveNpcPlacementTile } from "@cse/content-schema";
import { NPC } from "../entities/NPC";
import { TILE_SIZE } from "./constants";
import type { Room } from "./Room";

export { resolveNpcPlacementTile };

export function spawnRoomNpcs(
    room: Room,
    config: RoomConfig,
    npcConfigs: Record<string, NPCConfig>
): void {
    room.npcs.length = 0;
    const grid = { width: room.map.width, height: room.map.height };
    for (const placement of config.npcs ?? []) {
        const npcConfig = npcConfigs[placement.npcId];
        if (!npcConfig) continue;
        const npcX = resolveNpcPlacementTile(placement.x, grid.width) * TILE_SIZE;
        const npcY = resolveNpcPlacementTile(placement.y, grid.height) * TILE_SIZE;
        room.npcs.push(
            new NPC(npcConfig.id, npcX, npcY, npcConfig.name, npcConfig.role, npcConfig.spriteName)
        );
    }
}
