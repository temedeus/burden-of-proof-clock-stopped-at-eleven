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
import libraryConfig from "../data/rooms/library.json";
import hallConfig from "../data/rooms/hall.json";
import studyConfig from "../data/rooms/study.json";
import kitchenConfig from "../data/rooms/kitchen.json";
import gardenConfig from "../data/rooms/garden.json";
import courtyardConfig from "../data/rooms/courtyard.json";
import diningConfig from "../data/rooms/dining.json";

export interface GameContent {
    rooms: Record<string, RoomConfig>;
    npcs: Record<string, NPCConfig>;
}

export function loadGameContent(): GameContent {
    return {
        rooms: {
            library: libraryConfig as RoomConfig,
            hall: hallConfig as RoomConfig,
            study: studyConfig as RoomConfig,
            kitchen: kitchenConfig as RoomConfig,
            garden: gardenConfig as RoomConfig,
            courtyard: courtyardConfig as RoomConfig,
            dining: diningConfig as RoomConfig
        },
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
