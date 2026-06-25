import type { NPCConfig, RoomConfig } from "@cse/content-schema";
import { loadFurnitureCatalog, loadNpcCatalog, loadRoomCatalog } from "./loadCatalog";

export interface GameContent {
    rooms: Record<string, RoomConfig>;
    npcs: Record<string, NPCConfig>;
}

export function loadGameContent(): GameContent {
    return {
        rooms: loadRoomCatalog(),
        npcs: loadNpcCatalog()
    };
}

export { loadFurnitureCatalog, loadNpcCatalog, loadRoomCatalog };
