import type { FurniturePlacement, NPCConfig, RoomConfig } from "@cse/content-schema";
import { createRoomFromConfig } from "../../world/Rooms";
import { TILE_SIZE } from "../../world/constants";
import { spriteLoader } from "../../assets/SpriteLoader";
import { renderRoomScene, resolveNpcPlacementTile, spawnRoomNpcs } from "../../render/roomScene";
import {
    getPlacementRect,
    gridSizeFromCanvas,
    hitTestDoor,
    hitTestFurniture,
    hitTestNpc,
    resolveExitPosition
} from "./hitTest";
import {
    buildDoorGhost,
    exitFromGhost,
    exitFromNearestWall,
    spawnForExit,
    type DoorGhost
} from "./doorPlacement";
import type { EditTarget, FurnitureConfig, ToolMode } from "../types";

type ActiveDrag =
    | { kind: "furniture"; index: number; offsetX: number; offsetY: number }
    | { kind: "npc"; index: number; offsetX: number; offsetY: number }
    | { kind: "door"; index: number; orientation: "horizontal" | "vertical"; wall: "top" | "bottom" | "left" | "right" };

export interface RoomCanvasDeps {
    getRoomId: () => string;
    getRoom: (roomId: string) => RoomConfig | undefined;
    workingRooms: Record<string, RoomConfig>;
    furnitureById: Record<string, FurnitureConfig>;
    npcConfigs: Record<string, NPCConfig>;
    toolSelect: HTMLSelectElement;
    furnitureSelect: HTMLSelectElement;
    npcSelect: HTMLSelectElement;
    doorTargetRoomSelect: HTMLSelectElement;
    getEditTarget: () => EditTarget;
    findNpcPlacementRoomId: (npcId: string) => string | null;
    onRoomDirty: (roomId: string) => void;
    onSyncTextarea: (roomId: string) => void;
    onFurnitureSelectionChanged: () => void;
    onIssue: (message: string) => void;
    onModeBadgeUpdate: () => void;
}

export class RoomCanvas {
    private readonly ctx: CanvasRenderingContext2D;
    private activeDrag: ActiveDrag | null = null;
    private doorPlacementArmed = false;
    private doorPlacementStartTile: { x: number; y: number } | null = null;
    private doorGhost: DoorGhost | null = null;

    selectedFurnitureIndex: number | null = null;
    selectedNpcIndex: number | null = null;
    selectedDoorIndex: number | null = null;

    constructor(
        private readonly canvas: HTMLCanvasElement,
        private readonly deps: RoomCanvasDeps
    ) {
        this.ctx = canvas.getContext("2d")!;
        this.bindPointerEvents();
    }

    get isDoorPlacementArmed(): boolean {
        return this.doorPlacementArmed;
    }

    resetSelection(): void {
        this.selectedFurnitureIndex = null;
        this.selectedNpcIndex = null;
        this.selectedDoorIndex = null;
        this.deps.onFurnitureSelectionChanged();
        this.cancelDoorPlacement();
        this.activeDrag = null;
    }

    cancelDoorPlacement(): void {
        this.doorPlacementArmed = false;
        this.doorPlacementStartTile = null;
        this.doorGhost = null;
    }

    armDoorPlacement(): void {
        this.doorPlacementArmed = true;
        this.doorPlacementStartTile = null;
        this.doorGhost = null;
    }

    start(): void {
        const loop = () => {
            this.draw();
            requestAnimationFrame(loop);
        };
        void spriteLoader.load().then(() => loop()).catch(() => loop());
    }

    private gridSize(): { width: number; height: number } {
        return gridSizeFromCanvas(this.canvas.width, this.canvas.height);
    }

    private furniturePlacementRect(
        placement: FurniturePlacement
    ): { x: number; y: number; w: number; h: number } | null {
        const config = this.deps.furnitureById[placement.furnitureId];
        if (!config) return null;
        return getPlacementRect(placement, config, this.gridSize());
    }

    private canvasInteractionTarget(): "furniture" | "npc" | "doors" {
        const editTarget = this.deps.getEditTarget();
        return editTarget === "clues" ? "furniture" : editTarget;
    }

    private currentRoom(): RoomConfig | undefined {
        return this.deps.getRoom(this.deps.getRoomId());
    }

    private markDirty(room: RoomConfig): void {
        this.deps.onRoomDirty(room.id);
    }

    draw(): void {
        const room = this.currentRoom();
        const ctx = this.ctx;
        if (!room) {
            ctx.fillStyle = "#111";
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            return;
        }

        const runtime = this.gridSize();
        const builtRoom = createRoomFromConfig(room, runtime.width, runtime.height);
        spawnRoomNpcs(builtRoom, room, this.deps.npcConfigs);
        renderRoomScene(ctx, builtRoom, { clearColor: "#111" });

        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        for (let x = 0; x <= runtime.width; x++) {
            ctx.beginPath();
            ctx.moveTo(x * TILE_SIZE + 0.5, 0);
            ctx.lineTo(x * TILE_SIZE + 0.5, runtime.height * TILE_SIZE);
            ctx.stroke();
        }
        for (let y = 0; y <= runtime.height; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * TILE_SIZE + 0.5);
            ctx.lineTo(runtime.width * TILE_SIZE, y * TILE_SIZE + 0.5);
            ctx.stroke();
        }

        if (this.selectedFurnitureIndex != null) {
            const placement = room.furniture[this.selectedFurnitureIndex];
            const rect = placement ? this.furniturePlacementRect(placement) : null;
            if (rect) {
                ctx.strokeStyle = "rgba(0, 220, 255, 0.95)";
                ctx.lineWidth = 2;
                ctx.strokeRect(
                    rect.x * TILE_SIZE + 1,
                    rect.y * TILE_SIZE + 1,
                    rect.w * TILE_SIZE - 2,
                    rect.h * TILE_SIZE - 2
                );
                ctx.lineWidth = 1;
            }
        }

        if (this.selectedNpcIndex != null && room.npcs?.[this.selectedNpcIndex]) {
            const npc = room.npcs[this.selectedNpcIndex];
            const nx = resolveNpcPlacementTile(npc.x, "width", runtime);
            const ny = resolveNpcPlacementTile(npc.y, "height", runtime);
            ctx.strokeStyle = "rgba(255, 220, 0, 0.95)";
            ctx.lineWidth = 2;
            ctx.strokeRect(nx * TILE_SIZE + 1, ny * TILE_SIZE + 1, TILE_SIZE * 2 - 2, TILE_SIZE * 2 - 2);
            ctx.lineWidth = 1;
        }

        if (this.selectedDoorIndex != null && room.exits[this.selectedDoorIndex]) {
            const exit = room.exits[this.selectedDoorIndex];
            const x = resolveExitPosition(exit.x as number | "center" | "top" | "bottom", runtime.width);
            const y = resolveExitPosition(exit.y as number | "center" | "top" | "bottom", runtime.height);
            const isTopOrBottom = y === 0 || y === runtime.height - 1;
            ctx.strokeStyle = "rgba(255, 120, 0, 0.95)";
            ctx.lineWidth = 2;
            if (isTopOrBottom) {
                ctx.strokeRect((x - 1) * TILE_SIZE + 1, y * TILE_SIZE + 1, TILE_SIZE * 3 - 2, TILE_SIZE - 2);
            } else {
                ctx.strokeRect(x * TILE_SIZE + 1, (y - 1) * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE * 3 - 2);
            }
            ctx.lineWidth = 1;
        }

        if (this.doorPlacementArmed && this.doorGhost) {
            ctx.save();
            ctx.globalAlpha = 0.55;
            if (this.doorGhost.orientation === "horizontal") {
                spriteLoader.drawSprite(
                    ctx,
                    "door",
                    (this.doorGhost.x - 1) * TILE_SIZE,
                    this.doorGhost.y * TILE_SIZE,
                    TILE_SIZE * 3,
                    TILE_SIZE
                );
            } else {
                spriteLoader.drawSprite(
                    ctx,
                    "door",
                    this.doorGhost.x * TILE_SIZE - 1,
                    (this.doorGhost.y - 1) * TILE_SIZE - 1,
                    TILE_SIZE + 2,
                    TILE_SIZE * 3 + 2
                );
            }
            ctx.restore();
        }
    }

    placeFurnitureAtTile(tileX: number, tileY: number): void {
        const room = this.currentRoom();
        const furnitureId = this.deps.furnitureSelect.value;
        if (!room || !this.deps.furnitureById[furnitureId]) return;
        room.furniture.push({ furnitureId, x: tileX, y: tileY, anchor: "top-left" });
        this.selectedFurnitureIndex = room.furniture.length - 1;
        this.markDirty(room);
        this.deps.onSyncTextarea(room.id);
    }

    addFurnitureAtCenter(): void {
        const room = this.currentRoom();
        const furnitureId = this.deps.furnitureSelect.value;
        const config = this.deps.furnitureById[furnitureId];
        if (!room || !config) return;
        const runtime = this.gridSize();
        const x = Math.max(0, Math.floor((runtime.width - config.width) / 2));
        const y = Math.max(0, Math.floor((runtime.height - config.height) / 2));
        room.furniture.push({ furnitureId, x, y, anchor: "top-left" });
        this.selectedFurnitureIndex = room.furniture.length - 1;
        this.selectedNpcIndex = null;
        this.markDirty(room);
        this.deps.onSyncTextarea(room.id);
    }

    deleteSelectedFurniture(): void {
        const room = this.currentRoom();
        if (!room || this.selectedFurnitureIndex == null) return;
        if (this.selectedFurnitureIndex < 0 || this.selectedFurnitureIndex >= room.furniture.length) return;
        room.furniture.splice(this.selectedFurnitureIndex, 1);
        this.selectedFurnitureIndex = null;
        this.deps.onFurnitureSelectionChanged();
        this.markDirty(room);
        this.deps.onSyncTextarea(room.id);
    }

    addNpcAtCenter(): void {
        const room = this.currentRoom();
        const npcId = this.deps.npcSelect.value;
        if (!room || !this.deps.npcConfigs[npcId]) return;
        const existingRoomId = this.deps.findNpcPlacementRoomId(npcId);
        if (existingRoomId) {
            this.deps.onIssue(`Cannot add '${npcId}': already placed in room '${existingRoomId}'.`);
            return;
        }
        if (!room.npcs) room.npcs = [];
        const runtime = this.gridSize();
        const x = Math.max(0, Math.floor((runtime.width - 2) / 2));
        const y = Math.max(0, Math.floor((runtime.height - 2) / 2));
        room.npcs.push({ npcId, x, y });
        this.selectedNpcIndex = room.npcs.length - 1;
        this.selectedFurnitureIndex = null;
        this.markDirty(room);
        this.deps.onSyncTextarea(room.id);
    }

    deleteSelectedNpc(): void {
        const room = this.currentRoom();
        if (!room || !room.npcs || this.selectedNpcIndex == null) return;
        if (this.selectedNpcIndex < 0 || this.selectedNpcIndex >= room.npcs.length) return;
        room.npcs.splice(this.selectedNpcIndex, 1);
        this.selectedNpcIndex = null;
        this.markDirty(room);
        this.deps.onSyncTextarea(room.id);
    }

    addDoorAtTile(tileX: number, tileY: number): void {
        const room = this.currentRoom();
        const targetRoomId = this.deps.doorTargetRoomSelect.value;
        if (!room || !targetRoomId) return;
        room.exits.push(
            exitFromNearestWall(
                tileX,
                tileY,
                this.gridSize(),
                targetRoomId,
                this.deps.workingRooms[targetRoomId]
            )
        );
        this.selectedDoorIndex = room.exits.length - 1;
        this.selectedFurnitureIndex = null;
        this.selectedNpcIndex = null;
        this.markDirty(room);
        this.deps.onSyncTextarea(room.id);
    }

    addDoorFromGhost(ghost: DoorGhost): void {
        const room = this.currentRoom();
        const targetRoomId = this.deps.doorTargetRoomSelect.value;
        if (!room || !targetRoomId) return;
        room.exits.push(exitFromGhost(ghost, targetRoomId, this.deps.workingRooms[targetRoomId]));
        this.selectedDoorIndex = room.exits.length - 1;
        this.selectedFurnitureIndex = null;
        this.selectedNpcIndex = null;
        this.markDirty(room);
        this.deps.onSyncTextarea(room.id);
    }

    deleteSelectedDoor(): void {
        const room = this.currentRoom();
        if (!room || this.selectedDoorIndex == null) return;
        if (this.selectedDoorIndex < 0 || this.selectedDoorIndex >= room.exits.length) return;
        room.exits.splice(this.selectedDoorIndex, 1);
        this.selectedDoorIndex = null;
        this.markDirty(room);
        this.deps.onSyncTextarea(room.id);
    }

    deleteCurrentSelection(editTarget: EditTarget): void {
        if (editTarget === "furniture") {
            this.deleteSelectedFurniture();
        } else if (editTarget === "npc") {
            this.deleteSelectedNpc();
        } else {
            this.deleteSelectedDoor();
        }
    }

    setSelectedDoorTarget(): void {
        const room = this.currentRoom();
        const targetRoomId = this.deps.doorTargetRoomSelect.value;
        if (!room || this.selectedDoorIndex == null || !targetRoomId) return;
        const exit = room.exits[this.selectedDoorIndex];
        if (!exit) return;
        exit.targetRoom = targetRoomId;
        const spawn = spawnForExit(exit, this.deps.workingRooms[targetRoomId], this.gridSize());
        exit.spawnX = spawn.spawnX;
        exit.spawnY = spawn.spawnY;
        this.markDirty(room);
        this.deps.onSyncTextarea(room.id);
    }

    private refreshDoorSpawn(exitIndex: number): void {
        const room = this.currentRoom();
        if (!room) return;
        const exit = room.exits[exitIndex];
        if (!exit) return;
        const spawn = spawnForExit(exit, this.deps.workingRooms[exit.targetRoom], this.gridSize());
        exit.spawnX = spawn.spawnX;
        exit.spawnY = spawn.spawnY;
    }

    private getMouseTile(event: MouseEvent | PointerEvent): { x: number; y: number } {
        const runtime = this.gridSize();
        const rect = this.canvas.getBoundingClientRect();
        const px = event.clientX - rect.left;
        const py = event.clientY - rect.top;
        return {
            x: Math.max(0, Math.min(runtime.width - 1, Math.floor(px / TILE_SIZE))),
            y: Math.max(0, Math.min(runtime.height - 1, Math.floor(py / TILE_SIZE)))
        };
    }

    private updateCanvasCursor(tileX: number, tileY: number): void {
        const room = this.currentRoom();
        if (!room) {
            this.canvas.style.cursor = "default";
            return;
        }
        if (this.deps.toolSelect.value === "select") {
            if (this.activeDrag) {
                this.canvas.style.cursor = "grabbing";
                return;
            }
            const target = this.canvasInteractionTarget();
            const grid = this.gridSize();
            const hasHoverTarget =
                (target === "furniture" &&
                    hitTestFurniture(room, tileX, tileY, this.deps.furnitureById, grid) >= 0) ||
                (target === "npc" && hitTestNpc(room, tileX, tileY, grid) >= 0) ||
                (target === "doors" && hitTestDoor(room, tileX, tileY, grid) >= 0);
            this.canvas.style.cursor = hasHoverTarget ? "grab" : "default";
            return;
        }
        this.canvas.style.cursor = "crosshair";
    }

    private bindPointerEvents(): void {
        this.canvas.addEventListener("pointerdown", (event) => this.onPointerDown(event));
        this.canvas.addEventListener("pointermove", (event) => this.onPointerMove(event));
        this.canvas.addEventListener("pointerup", (event) => this.onPointerUp(event));
        this.canvas.addEventListener("pointercancel", (event) => this.onPointerUp(event));
    }

    private onPointerDown(event: PointerEvent): void {
        const room = this.currentRoom();
        if (!room) return;

        const tile = this.getMouseTile(event);
        const tool = this.deps.toolSelect.value as ToolMode;
        const target = this.canvasInteractionTarget();
        const editTarget = this.deps.getEditTarget();
        const grid = this.gridSize();
        const furnitureHit = hitTestFurniture(room, tile.x, tile.y, this.deps.furnitureById, grid);
        const npcHit = hitTestNpc(room, tile.x, tile.y, grid);
        const doorHit = hitTestDoor(room, tile.x, tile.y, grid);

        if (editTarget === "clues" && tool !== "select") {
            this.deps.toolSelect.value = "select";
            this.deps.onIssue(
                "Clues tab: edit clues in the panel. Switch to Furniture/NPCs/Doors to change the layout."
            );
            this.deps.onModeBadgeUpdate();
            return;
        }

        if (tool === "delete") {
            let deletedByClick = false;
            if (target === "furniture" && furnitureHit >= 0) {
                room.furniture.splice(furnitureHit, 1);
                this.selectedFurnitureIndex = null;
                this.markDirty(room);
                this.deps.onSyncTextarea(room.id);
                deletedByClick = true;
            } else if (target === "npc" && npcHit >= 0 && room.npcs) {
                room.npcs.splice(npcHit, 1);
                this.selectedNpcIndex = null;
                this.markDirty(room);
                this.deps.onSyncTextarea(room.id);
                deletedByClick = true;
            } else if (target === "doors" && doorHit >= 0) {
                room.exits.splice(doorHit, 1);
                this.selectedDoorIndex = null;
                this.markDirty(room);
                this.deps.onSyncTextarea(room.id);
                deletedByClick = true;
            }
            if (!deletedByClick) {
                this.deleteCurrentSelection(editTarget);
            }
            return;
        }

        if (tool === "add") {
            if (target === "furniture") {
                this.placeFurnitureAtTile(tile.x, tile.y);
                this.deps.toolSelect.value = "select";
                this.deps.onModeBadgeUpdate();
            } else if (target === "npc") {
                const npcId = this.deps.npcSelect.value;
                const existingRoomId = this.deps.findNpcPlacementRoomId(npcId);
                if (existingRoomId) {
                    this.deps.onIssue(`Cannot add '${npcId}': already placed in room '${existingRoomId}'.`);
                    return;
                }
                if (!room.npcs) room.npcs = [];
                room.npcs.push({ npcId, x: tile.x, y: tile.y });
                this.selectedNpcIndex = room.npcs.length - 1;
                this.selectedFurnitureIndex = null;
                this.selectedDoorIndex = null;
                this.markDirty(room);
                this.deps.onSyncTextarea(room.id);
                this.deps.toolSelect.value = "select";
                this.deps.onModeBadgeUpdate();
            } else if (this.doorPlacementArmed && this.doorGhost) {
                this.addDoorFromGhost(this.doorGhost);
                this.cancelDoorPlacement();
                this.deps.onIssue("Door added.");
                this.deps.toolSelect.value = "select";
                this.deps.onModeBadgeUpdate();
            } else {
                this.addDoorAtTile(tile.x, tile.y);
                this.deps.toolSelect.value = "select";
                this.deps.onModeBadgeUpdate();
            }
            return;
        }

        if (tool === "select" && (target === "furniture" || editTarget === "clues")) {
            this.selectedFurnitureIndex = furnitureHit >= 0 ? furnitureHit : null;
            this.selectedNpcIndex = null;
            this.selectedDoorIndex = null;
            this.deps.onFurnitureSelectionChanged();
            if (editTarget === "clues" && furnitureHit < 0) {
                this.activeDrag = null;
                return;
            }
            if (furnitureHit >= 0 && editTarget !== "clues") {
                this.canvas.setPointerCapture(event.pointerId);
                const rect = this.furniturePlacementRect(room.furniture[furnitureHit]);
                if (rect) {
                    this.activeDrag = {
                        kind: "furniture",
                        index: furnitureHit,
                        offsetX: tile.x - rect.x,
                        offsetY: tile.y - rect.y
                    };
                }
            }
        } else if (tool === "select" && target === "npc") {
            this.selectedNpcIndex = npcHit >= 0 ? npcHit : null;
            this.selectedFurnitureIndex = null;
            this.selectedDoorIndex = null;
            if (npcHit >= 0 && room.npcs) {
                this.canvas.setPointerCapture(event.pointerId);
                const npc = room.npcs[npcHit];
                const x = resolveNpcPlacementTile(npc.x, "width", grid);
                const y = resolveNpcPlacementTile(npc.y, "height", grid);
                this.activeDrag = {
                    kind: "npc",
                    index: npcHit,
                    offsetX: tile.x - x,
                    offsetY: tile.y - y
                };
            }
        } else if (tool === "select" && target === "doors" && doorHit >= 0) {
            this.canvas.setPointerCapture(event.pointerId);
            this.selectedDoorIndex = doorHit;
            this.selectedFurnitureIndex = null;
            this.selectedNpcIndex = null;
            this.deps.doorTargetRoomSelect.value = room.exits[doorHit].targetRoom;
            const exit = room.exits[doorHit];
            const x = resolveExitPosition(exit.x as number | "center" | "top" | "bottom", grid.width);
            const y = resolveExitPosition(exit.y as number | "center" | "top" | "bottom", grid.height);
            const isHorizontal = y === 0 || y === grid.height - 1;
            const wall =
                y === 0 ? "top" : y === grid.height - 1 ? "bottom" : x === 0 ? "left" : "right";
            this.activeDrag = {
                kind: "door",
                index: doorHit,
                orientation: isHorizontal ? "horizontal" : "vertical",
                wall
            };
        } else if (tool === "select") {
            if (target === "doors") this.selectedDoorIndex = null;
            if (target === "furniture" || editTarget === "clues") {
                this.selectedFurnitureIndex = null;
                this.deps.onFurnitureSelectionChanged();
            }
            if (target === "npc") this.selectedNpcIndex = null;
            this.activeDrag = null;
        }
    }

    private onPointerMove(event: PointerEvent): void {
        const room = this.currentRoom();
        if (!room) return;

        const runtime = this.gridSize();
        const tile = this.getMouseTile(event);
        this.updateCanvasCursor(tile.x, tile.y);

        if (
            this.doorPlacementArmed &&
            this.deps.getEditTarget() === "doors" &&
            this.deps.toolSelect.value === "add"
        ) {
            if (!this.doorPlacementStartTile) {
                this.doorPlacementStartTile = { x: tile.x, y: tile.y };
            }
            this.doorGhost = buildDoorGhost(tile.x, tile.y, runtime, this.doorPlacementStartTile);
        }

        if (this.deps.toolSelect.value === "select" && this.activeDrag) {
            if (this.activeDrag.kind === "furniture") {
                const placement = room.furniture[this.activeDrag.index];
                if (!placement) return;
                const config = this.deps.furnitureById[placement.furnitureId];
                const maxX = Math.max(0, runtime.width - config.width);
                const maxY = Math.max(0, runtime.height - config.height);
                placement.x = Math.max(0, Math.min(maxX, tile.x - this.activeDrag.offsetX));
                placement.y = Math.max(0, Math.min(maxY, tile.y - this.activeDrag.offsetY));
                placement.anchor = "top-left";
                this.markDirty(room);
                return;
            }
            if (this.activeDrag.kind === "npc") {
                if (!room.npcs) return;
                const npc = room.npcs[this.activeDrag.index];
                if (!npc) return;
                const maxX = Math.max(0, runtime.width - 2);
                const maxY = Math.max(0, runtime.height - 2);
                npc.x = Math.max(0, Math.min(maxX, tile.x - this.activeDrag.offsetX));
                npc.y = Math.max(0, Math.min(maxY, tile.y - this.activeDrag.offsetY));
                this.markDirty(room);
                return;
            }
            const exit = room.exits[this.activeDrag.index];
            if (!exit) return;
            if (this.activeDrag.orientation === "horizontal") {
                const x = Math.max(1, Math.min(runtime.width - 2, tile.x));
                exit.x = x as any;
                exit.y = (this.activeDrag.wall === "top" ? "top" : "bottom") as any;
            } else {
                const y = Math.max(1, Math.min(runtime.height - 2, tile.y));
                exit.y = y as any;
                exit.x = (this.activeDrag.wall === "left" ? "top" : "bottom") as any;
            }
            this.refreshDoorSpawn(this.activeDrag.index);
            this.markDirty(room);
        }
    }

    private onPointerUp(event: PointerEvent): void {
        const room = this.currentRoom();
        if (room && this.activeDrag) {
            this.deps.onSyncTextarea(room.id);
        }
        this.activeDrag = null;
        this.canvas.style.cursor = "default";
        if (this.canvas.hasPointerCapture(event.pointerId)) {
            this.canvas.releasePointerCapture(event.pointerId);
        }
    }
}
