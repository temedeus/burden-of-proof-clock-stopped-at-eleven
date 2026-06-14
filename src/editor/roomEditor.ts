import type { NPCConfig, RoomConfig } from "@cse/content-schema";
import { validateRooms } from "@cse/content-schema";
import type { FurnitureConfig } from "./types";

export interface RoomEditorDeps {
    workingRooms: Record<string, RoomConfig>;
    furnitureById: Record<string, FurnitureConfig>;
    npcConfigs: Record<string, NPCConfig>;
    roomSelect: HTMLSelectElement;
    roomJson: HTMLTextAreaElement;
    dirtyStatusEl: HTMLParagraphElement;
    issuesEl: HTMLDivElement;
    onRoomSelected: () => void;
    refreshRoomOptions: () => void;
}

export class RoomEditor {
    readonly dirtyRooms = new Set<string>();
    private suppressDirtyTracking = false;
    currentRoomId = "";

    constructor(private readonly deps: RoomEditorDeps) {}

    setDirtyStatus(): void {
        this.deps.dirtyStatusEl.textContent =
            this.dirtyRooms.size === 0
                ? "Unsaved changes: none"
                : `Unsaved changes: ${Array.from(this.dirtyRooms).sort().join(", ")}`;
    }

    markDirty(roomId: string): void {
        if (!roomId) return;
        this.dirtyRooms.add(roomId);
        this.setDirtyStatus();
    }

    clearDirty(roomId: string): void {
        this.dirtyRooms.delete(roomId);
        this.setDirtyStatus();
    }

    syncTextareaFromRoom(roomId: string): void {
        const room = this.deps.workingRooms[roomId];
        if (!room) return;
        this.suppressDirtyTracking = true;
        this.deps.roomJson.value = JSON.stringify(room, null, 2);
        this.suppressDirtyTracking = false;
    }

    renderSelectedRoom(): void {
        const selected = this.deps.roomSelect.value;
        this.currentRoomId = selected;
        if (!this.deps.workingRooms[selected]) {
            this.deps.roomJson.value = "";
            return;
        }
        this.syncTextareaFromRoom(selected);
        this.deps.onRoomSelected();
        this.deps.issuesEl.textContent = "";
    }

    onJsonInput(roomId: string): void {
        if (this.suppressDirtyTracking) return;
        this.markDirty(roomId);
    }

    findNpcPlacementRoomId(npcId: string): string | null {
        for (const [roomId, room] of Object.entries(this.deps.workingRooms)) {
            if ((room.npcs ?? []).some((npc) => npc.npcId === npcId)) {
                return roomId;
            }
        }
        return null;
    }

    validateSelectedRoom(): void {
        try {
            const parsed = JSON.parse(this.deps.roomJson.value) as RoomConfig;
            const issues = validateRooms([parsed], this.deps.furnitureById, this.deps.npcConfigs);
            this.deps.issuesEl.textContent =
                issues.length === 0
                    ? "No validation issues."
                    : issues.map((issue) => `[${issue.roomId}] ${issue.message}`).join("\n");
        } catch (error) {
            this.deps.issuesEl.textContent = `Invalid JSON: ${(error as Error).message}`;
        }
    }

    validateAllRooms(): void {
        const issues = validateRooms(
            Object.values(this.deps.workingRooms),
            this.deps.furnitureById,
            this.deps.npcConfigs
        );
        this.deps.issuesEl.textContent =
            issues.length === 0
                ? "All rooms valid."
                : issues.map((issue) => `[${issue.roomId}] ${issue.message}`).join("\n");
    }

    applyCurrentJsonToWorkingRooms(): void {
        const selected = this.deps.roomSelect.value;
        if (selected && this.deps.roomJson.value.trim()) {
            const parsed = JSON.parse(this.deps.roomJson.value) as RoomConfig;
            parsed.id = selected;
            this.deps.workingRooms[selected] = parsed;
        }
    }

    createRoom(): void {
        const newId = window.prompt("New room id (e.g. attic):");
        if (!newId) return;
        if (this.deps.workingRooms[newId]) {
            this.deps.issuesEl.textContent = `Room '${newId}' already exists.`;
            return;
        }
        this.deps.workingRooms[newId] = {
            id: newId,
            width: 20,
            height: 15,
            floorTile: "floor",
            furniture: [],
            exits: [],
            npcs: []
        };
        this.deps.refreshRoomOptions();
        this.deps.roomSelect.value = newId;
        this.renderSelectedRoom();
        this.markDirty(newId);
    }

    renameRoom(): void {
        const currentId = this.deps.roomSelect.value;
        if (!currentId) return;
        const newId = window.prompt(`Rename '${currentId}' to:`, currentId);
        if (!newId || newId === currentId) return;
        if (this.deps.workingRooms[newId]) {
            this.deps.issuesEl.textContent = `Room '${newId}' already exists.`;
            return;
        }
        const room = this.deps.workingRooms[currentId];
        delete this.deps.workingRooms[currentId];
        room.id = newId;
        this.deps.workingRooms[newId] = room;
        for (const candidate of Object.values(this.deps.workingRooms)) {
            for (const exit of candidate.exits) {
                if (exit.targetRoom === currentId) {
                    exit.targetRoom = newId;
                    this.markDirty(candidate.id);
                }
            }
        }
        this.markDirty(newId);
        this.clearDirty(currentId);
        this.deps.refreshRoomOptions();
        this.deps.roomSelect.value = newId;
        this.renderSelectedRoom();
    }

    deleteRoom(): void {
        const currentId = this.deps.roomSelect.value;
        if (!currentId) return;
        if (Object.keys(this.deps.workingRooms).length <= 1) {
            this.deps.issuesEl.textContent = "Cannot delete the last remaining room.";
            return;
        }
        if (!window.confirm(`Delete room '${currentId}'?`)) return;
        delete this.deps.workingRooms[currentId];
        this.clearDirty(currentId);
        this.deps.refreshRoomOptions();
        this.renderSelectedRoom();
    }

    exportRoomsJson(): void {
        const blob = new Blob([JSON.stringify(this.deps.workingRooms, null, 2)], {
            type: "application/json"
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "rooms-export.json";
        anchor.click();
        URL.revokeObjectURL(url);
    }
}
