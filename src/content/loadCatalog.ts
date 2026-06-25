import type { FurnitureConfig, NPCConfig, RoomConfig } from "@cse/content-schema";
import { buildFurnitureCatalog } from "@cse/content-schema";
import tableConfig from "../data/furniture/table.json";
import bookshelvesConfig from "../data/furniture/bookshelves.json";
import decorationsConfig from "../data/furniture/decorations.json";

const roomModules = import.meta.glob("../data/rooms/*.json", { eager: true });
const npcModules = import.meta.glob("../data/npcs/*.json", { eager: true });

export function loadFurnitureCatalog(): Record<string, FurnitureConfig> {
    return buildFurnitureCatalog(
        tableConfig as FurnitureConfig,
        bookshelvesConfig as FurnitureConfig,
        decorationsConfig as Record<string, FurnitureConfig>
    );
}

export function loadRoomCatalog(): Record<string, RoomConfig> {
    const rooms: Record<string, RoomConfig> = {};
    for (const mod of Object.values(roomModules)) {
        const config = (mod as { default: RoomConfig }).default;
        rooms[config.id] = config;
    }
    return rooms;
}

export function loadNpcCatalog(): Record<string, NPCConfig> {
    const npcs: Record<string, NPCConfig> = {};
    for (const mod of Object.values(npcModules)) {
        const config = (mod as { default: NPCConfig }).default;
        npcs[config.id] = config;
    }
    return npcs;
}
