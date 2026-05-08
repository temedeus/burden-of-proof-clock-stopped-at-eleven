import type { NPCConfig, RoomConfig } from "@cse/content-schema";
import { validateRooms } from "@cse/content-schema";
import { loadGameContent } from "../content/loadGameContent";
import tableConfig from "../data/furniture/table.json";
import bookshelvesConfig from "../data/furniture/bookshelves.json";
import decorationsConfig from "../data/furniture/decorations.json";

type FurnitureConfig = {
    id: string;
    width: number;
    height: number;
    spriteName?: string;
};

const content = loadGameContent();
const workingRooms: Record<string, RoomConfig> = JSON.parse(JSON.stringify(content.rooms));
const backendBase = "http://localhost:8787";
const roomSelect = document.getElementById("room-select") as HTMLSelectElement;
const roomJson = document.getElementById("room-json") as HTMLTextAreaElement;
const issuesEl = document.getElementById("issues") as HTMLDivElement;
const backendStatusEl = document.getElementById("backend-status") as HTMLParagraphElement;
const validateButton = document.getElementById("validate-btn") as HTMLButtonElement;
const validateAllButton = document.getElementById("validate-all-btn") as HTMLButtonElement;
const newRoomButton = document.getElementById("new-room-btn") as HTMLButtonElement;
const renameRoomButton = document.getElementById("rename-room-btn") as HTMLButtonElement;
const deleteRoomButton = document.getElementById("delete-room-btn") as HTMLButtonElement;
const saveJsonButton = document.getElementById("save-json-btn") as HTMLButtonElement;
const exportButton = document.getElementById("export-btn") as HTMLButtonElement;
const reloadBackendButton = document.getElementById("reload-backend-btn") as HTMLButtonElement;

const furnitureById: Record<string, FurnitureConfig> = {
    table: tableConfig as FurnitureConfig,
    bookshelves: bookshelvesConfig as FurnitureConfig,
    ...(decorationsConfig as Record<string, FurnitureConfig>)
};

function refreshRoomOptions() {
    const selected = roomSelect.value;
    roomSelect.innerHTML = "";
    for (const roomId of Object.keys(workingRooms).sort()) {
        const option = document.createElement("option");
        option.value = roomId;
        option.textContent = roomId;
        roomSelect.appendChild(option);
    }
    if (selected && workingRooms[selected]) {
        roomSelect.value = selected;
    } else {
        roomSelect.value = Object.keys(workingRooms)[0] ?? "";
    }
}

function setBackendStatus(online: boolean): void {
    backendStatusEl.textContent = online
        ? "Backend: online (filesystem save enabled)"
        : "Backend: offline (using in-memory rooms only)";
}

async function fetchRoomsFromBackend(): Promise<boolean> {
    try {
        const response = await fetch(`${backendBase}/api/rooms`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = (await response.json()) as { rooms: Record<string, RoomConfig> };
        for (const key of Object.keys(workingRooms)) delete workingRooms[key];
        Object.assign(workingRooms, payload.rooms);
        setBackendStatus(true);
        refreshRoomOptions();
        renderSelectedRoom();
        return true;
    } catch {
        setBackendStatus(false);
        return false;
    }
}

async function saveRoomToBackend(roomId: string, room: RoomConfig): Promise<void> {
    const response = await fetch(`${backendBase}/api/rooms/${roomId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room })
    });
    if (!response.ok) throw new Error(`Failed to save room '${roomId}'.`);
}

function renderSelectedRoom() {
    const selected = roomSelect.value;
    const room = workingRooms[selected];
    if (!room) {
        roomJson.value = "";
        return;
    }
    roomJson.value = JSON.stringify(room, null, 2);
    issuesEl.textContent = "";
}

function validateSelectedRoom() {
    try {
        const parsed = JSON.parse(roomJson.value) as RoomConfig;
        const issues = validateRooms([parsed], furnitureById, content.npcs as Record<string, NPCConfig>);
        issuesEl.textContent = issues.length === 0
            ? "No validation issues."
            : issues.map((issue) => `[${issue.roomId}] ${issue.message}`).join("\n");
    } catch (error) {
        issuesEl.textContent = `Invalid JSON: ${(error as Error).message}`;
    }
}

async function saveCurrentJson() {
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
        await saveRoomToBackend(selected, parsed);
        setBackendStatus(true);
        issuesEl.textContent = `Saved room '${selected}' to backend and workspace state.`;
    } catch (error) {
        issuesEl.textContent = `Save failed: ${(error as Error).message}`;
        setBackendStatus(false);
    }
}

async function createRoom() {
    const newId = window.prompt("New room id (e.g. attic):");
    if (!newId) return;
    if (workingRooms[newId]) {
        issuesEl.textContent = `Room '${newId}' already exists.`;
        return;
    }
    workingRooms[newId] = {
        id: newId,
        width: 20,
        height: 15,
        floorTile: "floor",
        furniture: [],
        exits: [],
        npcs: []
    };
    try {
        await saveRoomToBackend(newId, workingRooms[newId]);
        setBackendStatus(true);
    } catch {
        setBackendStatus(false);
    }
    refreshRoomOptions();
    roomSelect.value = newId;
    renderSelectedRoom();
}

async function renameRoom() {
    const currentId = roomSelect.value;
    if (!currentId) return;
    const newId = window.prompt(`Rename '${currentId}' to:`, currentId);
    if (!newId || newId === currentId) return;
    if (workingRooms[newId]) {
        issuesEl.textContent = `Room '${newId}' already exists.`;
        return;
    }
    const room = workingRooms[currentId];
    try {
        const renameResponse = await fetch(`${backendBase}/api/rooms/rename`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fromId: currentId, toId: newId })
        });
        if (!renameResponse.ok) throw new Error();
        setBackendStatus(true);
    } catch {
        setBackendStatus(false);
    }
    delete workingRooms[currentId];
    room.id = newId;
    workingRooms[newId] = room;
    for (const candidate of Object.values(workingRooms)) {
        for (const exit of candidate.exits) {
            if (exit.targetRoom === currentId) exit.targetRoom = newId;
        }
    }
    refreshRoomOptions();
    roomSelect.value = newId;
    renderSelectedRoom();
}

async function deleteRoom() {
    const currentId = roomSelect.value;
    if (!currentId) return;
    if (Object.keys(workingRooms).length <= 1) {
        issuesEl.textContent = "Cannot delete the last remaining room.";
        return;
    }
    if (!window.confirm(`Delete room '${currentId}'?`)) return;
    try {
        const response = await fetch(`${backendBase}/api/rooms/${currentId}`, { method: "DELETE" });
        if (!response.ok) throw new Error();
        setBackendStatus(true);
    } catch {
        setBackendStatus(false);
    }
    delete workingRooms[currentId];
    refreshRoomOptions();
    renderSelectedRoom();
}

function validateAllRooms() {
    const rooms = Object.values(workingRooms);
    const issues = validateRooms(rooms, furnitureById, content.npcs as Record<string, NPCConfig>);
    issuesEl.textContent = issues.length === 0
        ? "All rooms valid."
        : issues.map((issue) => `[${issue.roomId}] ${issue.message}`).join("\n");
}

function exportRoomsJson() {
    const blob = new Blob([JSON.stringify(workingRooms, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "rooms-export.json";
    anchor.click();
    URL.revokeObjectURL(url);
}

roomSelect.addEventListener("change", renderSelectedRoom);
validateButton.addEventListener("click", validateSelectedRoom);
validateAllButton.addEventListener("click", validateAllRooms);
newRoomButton.addEventListener("click", () => { void createRoom(); });
renameRoomButton.addEventListener("click", () => { void renameRoom(); });
deleteRoomButton.addEventListener("click", () => { void deleteRoom(); });
saveJsonButton.addEventListener("click", () => { void saveCurrentJson(); });
exportButton.addEventListener("click", exportRoomsJson);
reloadBackendButton.addEventListener("click", () => { void fetchRoomsFromBackend(); });

refreshRoomOptions();
renderSelectedRoom();
void fetchRoomsFromBackend();
