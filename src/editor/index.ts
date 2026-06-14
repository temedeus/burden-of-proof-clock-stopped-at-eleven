import type { NPCConfig, RoomConfig } from "@cse/content-schema";
import { validateRooms } from "@cse/content-schema";
import { CaseEditor } from "./caseEditor";
import { RoomCanvas } from "./canvas/RoomCanvas";
import { RoomEditor } from "./roomEditor";
import {
    fetchAllRooms,
    saveRoom,
    syncAllRooms,
    updateBackendStatusLabel
} from "./roomBackend";
import type { EditTarget, FurnitureConfig } from "./types";
import cluesCatalog from "../data/clues.json";
import { loadGameContent } from "../content/loadGameContent";
import tableConfig from "../data/furniture/table.json";
import bookshelvesConfig from "../data/furniture/bookshelves.json";
import decorationsConfig from "../data/furniture/decorations.json";

const content = loadGameContent();
const workingRooms: Record<string, RoomConfig> = JSON.parse(JSON.stringify(content.rooms));
const backendBase = "http://localhost:8787";
const furnitureById: Record<string, FurnitureConfig> = {
    table: tableConfig as FurnitureConfig,
    bookshelves: bookshelvesConfig as FurnitureConfig,
    ...(decorationsConfig as Record<string, FurnitureConfig>)
};

const roomSelect = document.getElementById("room-select") as HTMLSelectElement;
const roomJson = document.getElementById("room-json") as HTMLTextAreaElement;
const issuesEl = document.getElementById("issues") as HTMLDivElement;
const backendStatusEl = document.getElementById("backend-status") as HTMLParagraphElement;
const dirtyStatusEl = document.getElementById("dirty-status") as HTMLParagraphElement;
const canvas = document.getElementById("room-canvas") as HTMLCanvasElement;
const toolSelect = document.getElementById("tool-select") as HTMLSelectElement;
const modeTargetBadge = document.getElementById("mode-target-badge") as HTMLDivElement;
const tabFurniture = document.getElementById("tab-furniture") as HTMLButtonElement;
const tabNpc = document.getElementById("tab-npc") as HTMLButtonElement;
const tabDoors = document.getElementById("tab-doors") as HTMLButtonElement;
const tabClues = document.getElementById("tab-clues") as HTMLButtonElement;
const furnitureSection = document.getElementById("furniture-section") as HTMLDivElement;
const npcSection = document.getElementById("npc-section") as HTMLDivElement;
const doorsSection = document.getElementById("doors-section") as HTMLDivElement;
const cluesSection = document.getElementById("clues-section") as HTMLDivElement;
const furnitureSelect = document.getElementById("furniture-select") as HTMLSelectElement;
const addFurnitureButton = document.getElementById("add-furniture-btn") as HTMLButtonElement;
const deleteSelectedFurnitureButton = document.getElementById("delete-selected-furniture-btn") as HTMLButtonElement;
const npcSelect = document.getElementById("npc-select") as HTMLSelectElement;
const addNpcButton = document.getElementById("add-npc-btn") as HTMLButtonElement;
const deleteSelectedNpcButton = document.getElementById("delete-selected-npc-btn") as HTMLButtonElement;
const doorTargetRoomSelect = document.getElementById("door-target-room-select") as HTMLSelectElement;
const setDoorTargetButton = document.getElementById("set-door-target-btn") as HTMLButtonElement;
const addDoorButton = document.getElementById("add-door-btn") as HTMLButtonElement;
const deleteSelectedDoorButton = document.getElementById("delete-selected-door-btn") as HTMLButtonElement;
const validateButton = document.getElementById("validate-btn") as HTMLButtonElement;
const validateAllButton = document.getElementById("validate-all-btn") as HTMLButtonElement;
const newRoomButton = document.getElementById("new-room-btn") as HTMLButtonElement;
const renameRoomButton = document.getElementById("rename-room-btn") as HTMLButtonElement;
const deleteRoomButton = document.getElementById("delete-room-btn") as HTMLButtonElement;
const saveJsonButton = document.getElementById("save-json-btn") as HTMLButtonElement;
const saveAllButton = document.getElementById("save-all-btn") as HTMLButtonElement;
const exportButton = document.getElementById("export-btn") as HTMLButtonElement;
const reloadBackendButton = document.getElementById("reload-backend-btn") as HTMLButtonElement;

let selectionBadgeExtra = "";
let editTarget: EditTarget = "furniture";

const caseEditor = new CaseEditor(
    {
        backendBase,
        workingRooms,
        npcIds: Object.keys(content.npcs),
        clueCatalogIds: Object.keys(cluesCatalog),
        reportIssue: (message) => {
            issuesEl.textContent = message;
        },
        onSelectionBadgeExtra: (extra) => {
            selectionBadgeExtra = extra;
            updateModeTargetBadge();
        }
    },
    document
);

function refreshRoomOptions(): void {
    const selected = roomSelect.value;
    roomSelect.innerHTML = "";
    for (const roomId of Object.keys(workingRooms).sort()) {
        const option = document.createElement("option");
        option.value = roomId;
        option.textContent = roomId;
        roomSelect.appendChild(option);
    }
    if (selected && workingRooms[selected]) roomSelect.value = selected;
    else roomSelect.value = Object.keys(workingRooms)[0] ?? "";
}

function refreshDoorTargetOptions(): void {
    const current = roomSelect.value;
    const selected = doorTargetRoomSelect.value;
    doorTargetRoomSelect.innerHTML = "";
    for (const roomId of Object.keys(workingRooms).sort()) {
        if (roomId === current) continue;
        const option = document.createElement("option");
        option.value = roomId;
        option.textContent = roomId;
        doorTargetRoomSelect.appendChild(option);
    }
    if (selected && Array.from(doorTargetRoomSelect.options).some((o) => o.value === selected)) {
        doorTargetRoomSelect.value = selected;
    }
}

const roomEditor = new RoomEditor({
    workingRooms,
    furnitureById,
    npcConfigs: content.npcs as Record<string, NPCConfig>,
    roomSelect,
    roomJson,
    dirtyStatusEl,
    issuesEl,
    refreshRoomOptions,
    onRoomSelected: () => {
        roomCanvas.resetSelection();
        refreshDoorTargetOptions();
    }
});

const roomCanvas = new RoomCanvas(canvas, {
    getRoomId: () => roomSelect.value,
    getRoom: (roomId) => workingRooms[roomId],
    workingRooms,
    furnitureById,
    npcConfigs: content.npcs as Record<string, NPCConfig>,
    toolSelect,
    furnitureSelect,
    npcSelect,
    doorTargetRoomSelect,
    getEditTarget: () => editTarget,
    findNpcPlacementRoomId: (npcId) => roomEditor.findNpcPlacementRoomId(npcId),
    onRoomDirty: (roomId) => roomEditor.markDirty(roomId),
    onSyncTextarea: (roomId) => roomEditor.syncTextareaFromRoom(roomId),
    onFurnitureSelectionChanged: () => notifyFurnitureSelection(),
    onIssue: (message) => {
        issuesEl.textContent = message;
    },
    onModeBadgeUpdate: () => updateModeTargetBadge()
});

function refreshFurnitureOptions(): void {
    furnitureSelect.innerHTML = "";
    for (const [id, cfg] of Object.entries(furnitureById)) {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = `${id} (${cfg.width}x${cfg.height})`;
        furnitureSelect.appendChild(option);
    }
}

function refreshNpcOptions(): void {
    npcSelect.innerHTML = "";
    for (const [id, cfg] of Object.entries(content.npcs as Record<string, NPCConfig>)) {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = `${id} (${cfg.name})`;
        npcSelect.appendChild(option);
    }
}

function setEditTarget(target: EditTarget): void {
    editTarget = target;
    tabFurniture.classList.toggle("active", target === "furniture");
    tabNpc.classList.toggle("active", target === "npc");
    tabDoors.classList.toggle("active", target === "doors");
    tabClues.classList.toggle("active", target === "clues");
    furnitureSection.classList.toggle("active", target === "furniture");
    npcSection.classList.toggle("active", target === "npc");
    doorsSection.classList.toggle("active", target === "doors");
    cluesSection.classList.toggle("active", target === "clues");
    if (target === "clues") {
        toolSelect.value = "select";
        roomCanvas.cancelDoorPlacement();
        caseEditor.onRoomsUpdated();
        notifyFurnitureSelection();
    }
    updateModeTargetBadge();
}

function updateModeTargetBadge(): void {
    const modeLabel = toolSelect.value.charAt(0).toUpperCase() + toolSelect.value.slice(1);
    const targetLabel =
        editTarget === "furniture"
            ? "Furniture"
            : editTarget === "npc"
              ? "NPCs"
              : editTarget === "doors"
                ? "Doors"
                : "Clues";
    const armed = roomCanvas.isDoorPlacementArmed ? " | Door placement armed" : "";
    modeTargetBadge.textContent = `Mode: ${modeLabel} | Target: ${targetLabel}${armed}${selectionBadgeExtra}`;
}

function notifyFurnitureSelection(): void {
    caseEditor.onFurnitureSelected(roomSelect.value, roomCanvas.selectedFurnitureIndex);
}

async function fetchRoomsFromBackend(force = false): Promise<boolean> {
    if (!force && roomEditor.dirtyRooms.size > 0) {
        const proceed = window.confirm("You have unsaved changes. Reloading will discard them. Continue?");
        if (!proceed) return false;
    }
    try {
        const rooms = await fetchAllRooms(backendBase);
        for (const key of Object.keys(workingRooms)) delete workingRooms[key];
        Object.assign(workingRooms, rooms);
        roomEditor.dirtyRooms.clear();
        roomEditor.setDirtyStatus();
        void updateBackendStatusLabel(backendBase, backendStatusEl, true);
        await caseEditor.bootstrap();
        refreshRoomOptions();
        roomEditor.renderSelectedRoom();
        return true;
    } catch {
        void updateBackendStatusLabel(backendBase, backendStatusEl, false);
        return false;
    }
}

async function saveCurrentJson(): Promise<void> {
    const selected = roomSelect.value;
    if (!selected) return;
    try {
        const parsed = JSON.parse(roomJson.value) as RoomConfig;
        if (!parsed.id) parsed.id = selected;
        if (parsed.id !== selected) {
            issuesEl.textContent = "Room id inside JSON must match selected room.";
            return;
        }
        workingRooms[selected] = parsed;
        await saveRoom(backendBase, selected, parsed);
        void updateBackendStatusLabel(backendBase, backendStatusEl, true);
        roomEditor.clearDirty(selected);
        issuesEl.textContent = `Saved room '${selected}' to backend and workspace state.`;
    } catch (error) {
        issuesEl.textContent = `Save failed: ${(error as Error).message}`;
        void updateBackendStatusLabel(backendBase, backendStatusEl, false);
    }
}

async function saveAllRooms(): Promise<void> {
    try {
        roomEditor.applyCurrentJsonToWorkingRooms();
        const validationIssues = validateRooms(
            Object.values(workingRooms),
            furnitureById,
            content.npcs as Record<string, NPCConfig>
        );
        if (validationIssues.length > 0) {
            issuesEl.textContent = validationIssues
                .map((issue) => `[${issue.roomId}] ${issue.message}`)
                .join("\n");
            return;
        }
        await syncAllRooms(backendBase, workingRooms);
        roomEditor.dirtyRooms.clear();
        roomEditor.setDirtyStatus();
        void updateBackendStatusLabel(backendBase, backendStatusEl, true);
        issuesEl.textContent = "Saved all rooms to backend.";
    } catch (error) {
        void updateBackendStatusLabel(backendBase, backendStatusEl, false);
        issuesEl.textContent = `Save all failed: ${(error as Error).message}`;
    }
}

roomSelect.addEventListener("change", () => {
    const nextId = roomSelect.value;
    if (
        roomEditor.currentRoomId &&
        nextId !== roomEditor.currentRoomId &&
        roomEditor.dirtyRooms.has(roomEditor.currentRoomId)
    ) {
        const proceed = window.confirm(
            `Room '${roomEditor.currentRoomId}' has unsaved changes. Continue switching anyway?`
        );
        if (!proceed) {
            refreshRoomOptions();
            roomSelect.value = roomEditor.currentRoomId;
            return;
        }
    }
    roomEditor.renderSelectedRoom();
});

roomJson.addEventListener("input", () => roomEditor.onJsonInput(roomSelect.value));

window.addEventListener("beforeunload", (event) => {
    if (roomEditor.dirtyRooms.size > 0) event.preventDefault();
});

validateButton.addEventListener("click", () => roomEditor.validateSelectedRoom());
validateAllButton.addEventListener("click", () => roomEditor.validateAllRooms());
newRoomButton.addEventListener("click", () => roomEditor.createRoom());
renameRoomButton.addEventListener("click", () => roomEditor.renameRoom());
deleteRoomButton.addEventListener("click", () => roomEditor.deleteRoom());
saveJsonButton.addEventListener("click", () => { void saveCurrentJson(); });
saveAllButton.addEventListener("click", () => { void saveAllRooms(); });
exportButton.addEventListener("click", () => roomEditor.exportRoomsJson());
reloadBackendButton.addEventListener("click", () => { void fetchRoomsFromBackend(); });
document.getElementById("reload-story-btn")?.addEventListener("click", () => {
    void caseEditor.loadStory();
});
addFurnitureButton.addEventListener("click", () => roomCanvas.addFurnitureAtCenter());
deleteSelectedFurnitureButton.addEventListener("click", () => roomCanvas.deleteSelectedFurniture());
addNpcButton.addEventListener("click", () => roomCanvas.addNpcAtCenter());
deleteSelectedNpcButton.addEventListener("click", () => roomCanvas.deleteSelectedNpc());
setDoorTargetButton.addEventListener("click", () => roomCanvas.setSelectedDoorTarget());
addDoorButton.addEventListener("click", () => {
    setEditTarget("doors");
    toolSelect.value = "add";
    roomCanvas.armDoorPlacement();
    issuesEl.textContent =
        "Door placement armed: move mouse to preview ghost, click to place. Press Esc to cancel.";
    updateModeTargetBadge();
});
deleteSelectedDoorButton.addEventListener("click", () => roomCanvas.deleteSelectedDoor());

toolSelect.addEventListener("change", () => updateModeTargetBadge());
tabFurniture.addEventListener("click", () => setEditTarget("furniture"));
tabNpc.addEventListener("click", () => setEditTarget("npc"));
tabDoors.addEventListener("click", () => setEditTarget("doors"));
tabClues.addEventListener("click", () => setEditTarget("clues"));
window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && roomCanvas.isDoorPlacementArmed) {
        roomCanvas.cancelDoorPlacement();
        issuesEl.textContent = "Door placement cancelled.";
        updateModeTargetBadge();
    }
});

refreshFurnitureOptions();
refreshNpcOptions();
refreshRoomOptions();
roomEditor.renderSelectedRoom();
roomEditor.setDirtyStatus();
setEditTarget("furniture");
toolSelect.value = "select";
updateModeTargetBadge();
canvas.style.cursor = "default";
void fetchRoomsFromBackend();
roomCanvas.start();
