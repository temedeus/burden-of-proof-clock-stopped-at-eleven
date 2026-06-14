import type { NPCConfig, RoomConfig } from "@cse/content-schema";
import butlerConfig from "../data/npcs/butler.json";
import maidConfig from "../data/npcs/maid.json";
import cookConfig from "../data/npcs/cook.json";
import baronConfig from "../data/npcs/baron.json";
import baronessConfig from "../data/npcs/baroness.json";
import workerManConfig from "../data/npcs/worker_man.json";
import workerBoyConfig from "../data/npcs/worker_boy.json";
import policeConfig from "../data/npcs/police.json";
import police2Config from "../data/npcs/police2.json";

const roomModules = import.meta.glob("../data/rooms/*.json", { eager: true });

export interface GameContent {
    rooms: Record<string, RoomConfig>;
    npcs: Record<string, NPCConfig>;
}

export function loadGameContent(): GameContent {
    const rooms: Record<string, RoomConfig> = {};
    for (const mod of Object.values(roomModules)) {
        const config = (mod as { default: RoomConfig }).default;
        rooms[config.id] = config;
    }

    return {
        rooms,
        npcs: {
            butler: butlerConfig as NPCConfig,
            maid: maidConfig as NPCConfig,
            cook: cookConfig as NPCConfig,
            baron: baronConfig as NPCConfig,
            baroness: baronessConfig as NPCConfig,
            worker_man: workerManConfig as NPCConfig,
            worker_boy: workerBoyConfig as NPCConfig,
            police: policeConfig as NPCConfig,
            police2: police2Config as NPCConfig
        }
    };
}
