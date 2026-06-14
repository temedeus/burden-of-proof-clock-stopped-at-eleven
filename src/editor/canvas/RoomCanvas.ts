import type { FurniturePlacement, NPCConfig, RoomConfig } from "@cse/content-schema";
import { createRoomFromConfig } from "../../world/Rooms";
import { TILE_SIZE } from "../../world/constants";
import { spriteLoader } from "../../assets/SpriteLoader";
import { renderRoomScene, spawnRoomNpcs } from "../../render/roomScene";
import { getPlacementRect, gridSizeFromCanvas } from "./hitTest";
import { buildDoorGhost, exitFromGhost, spawnForExit, type DoorGhost } from "./doorPlacement";
import {
    applyDoorTarget,
    drawAllSelectionHighlights,
    getLayoutHandler,
    handlerForDrag,
    pushDoorAtTile,
    type ActiveDrag,
    type LayoutTarget,
    type LayoutTargetHost,
    type PointerContext
} from "./layoutTargets";
import type { EditTarget, FurnitureConfig, ToolMode } from "../types";

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

export class RoomCanvas implements LayoutTargetHost {
    private readonly ctx: CanvasRenderingContext2D;
    private readonly canvas: HTMLCanvasElement;
    private activeDrag: ActiveDrag | null = null;
    private doorPlacementArmed = false;
    private doorPlacementStartTile: { x: number; y: number } | null = null;
    private doorGhost: DoorGhost | null = null;

    selectedFurnitureIndex: number | null = null;
    selectedNpcIndex: number | null = null;
    selectedDoorIndex: number | null = null;

    readonly furnitureById: Record<string, FurnitureConfig>;
    readonly npcConfigs: Record<string, NPCConfig>;
    readonly workingRooms: Record<string, RoomConfig>;
    readonly furnitureSelect: HTMLSelectElement;
    readonly npcSelect: HTMLSelectElement;
    readonly doorTargetRoomSelect: HTMLSelectElement;

    constructor(canvas: HTMLCanvasElement, private readonly deps: RoomCanvasDeps) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.furnitureById = deps.furnitureById;
        this.npcConfigs = deps.npcConfigs;
        this.workingRooms = deps.workingRooms;
        this.furnitureSelect = deps.furnitureSelect;
        this.npcSelect = deps.npcSelect;
        this.doorTargetRoomSelect = deps.doorTargetRoomSelect;
        this.bindPointerEvents();
    }

    findNpcPlacementRoomId(npcId: string): string | null {
        return this.deps.findNpcPlacementRoomId(npcId);
    }

    get isDoorPlacementArmed(): boolean {
        return this.doorPlacementArmed;
    }

    currentRoom(): RoomConfig | undefined {
        return this.deps.getRoom(this.deps.getRoomId());
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

    gridSize(): { width: number; height: number } {
        return gridSizeFromCanvas(this.canvas.width, this.canvas.height);
    }

    furniturePlacementRect(
        placement: FurniturePlacement
    ): { x: number; y: number; w: number; h: number } | null {
        const config = this.furnitureById[placement.furnitureId];
        if (!config) return null;
        return getPlacementRect(placement, config, this.gridSize());
    }

    markDirty(room: RoomConfig): void {
        this.deps.onRoomDirty(room.id);
    }

    syncTextarea(roomId: string): void {
        this.deps.onSyncTextarea(roomId);
    }

    capturePointer(event: PointerEvent): void {
        this.canvas.setPointerCapture(event.pointerId);
    }

    setActiveDrag(drag: ActiveDrag | null): void {
        this.activeDrag = drag;
    }

    switchToSelectTool(): void {
        this.deps.toolSelect.value = "select";
        this.deps.onModeBadgeUpdate();
    }

    reportIssue(message: string): void {
        this.deps.onIssue(message);
    }

    clearSelectionsExcept(keep: LayoutTarget | null): void {
        if (keep !== "furniture") this.selectedFurnitureIndex = null;
        if (keep !== "npc") this.selectedNpcIndex = null;
        if (keep !== "doors") this.selectedDoorIndex = null;
    }

    getSelectedIndex(target: LayoutTarget): number | null {
        if (target === "furniture") return this.selectedFurnitureIndex;
        if (target === "npc") return this.selectedNpcIndex;
        return this.selectedDoorIndex;
    }

    setSelectedIndex(target: LayoutTarget, index: number | null): void {
        if (target === "furniture") this.selectedFurnitureIndex = index;
        else if (target === "npc") this.selectedNpcIndex = index;
        else this.selectedDoorIndex = index;
    }

    onFurnitureSelectionChanged(): void {
        this.deps.onFurnitureSelectionChanged();
    }

    refreshDoorSpawn(exitIndex: number): void {
        const room = this.currentRoom();
        if (!room) return;
        const exit = room.exits[exitIndex];
        if (!exit) return;
        const spawn = spawnForExit(exit, this.workingRooms[exit.targetRoom], this.gridSize());
        exit.spawnX = spawn.spawnX;
        exit.spawnY = spawn.spawnY;
    }

    doorPlacementIsArmed(): boolean {
        return this.doorPlacementArmed;
    }

    getDoorGhost(): DoorGhost | null {
        return this.doorGhost;
    }

    addDoorFromGhost(ghost: DoorGhost): void {
        const room = this.currentRoom();
        const targetRoomId = this.doorTargetRoomSelect.value;
        if (!room || !targetRoomId) return;
        room.exits.push(exitFromGhost(ghost, targetRoomId, this.workingRooms[targetRoomId]));
        this.clearSelectionsExcept("doors");
        this.setSelectedIndex("doors", room.exits.length - 1);
        this.markDirty(room);
        this.syncTextarea(room.id);
    }

    addDoorAtTile(tileX: number, tileY: number): void {
        pushDoorAtTile(this, tileX, tileY);
    }

    addFurnitureAtCenter(): void {
        getLayoutHandler("furniture").addAtCenter(this);
    }

    deleteSelectedFurniture(): void {
        getLayoutHandler("furniture").deleteSelection(this);
    }

    addNpcAtCenter(): void {
        getLayoutHandler("npc").addAtCenter(this);
    }

    deleteSelectedNpc(): void {
        getLayoutHandler("npc").deleteSelection(this);
    }

    deleteSelectedDoor(): void {
        getLayoutHandler("doors").deleteSelection(this);
    }

    deleteCurrentSelection(editTarget: EditTarget): void {
        const target: LayoutTarget = editTarget === "clues" ? "furniture" : editTarget;
        getLayoutHandler(target).deleteSelection(this);
    }

    setSelectedDoorTarget(): void {
        applyDoorTarget(this, this.doorTargetRoomSelect.value);
    }

    private canvasInteractionTarget(): LayoutTarget {
        const editTarget = this.deps.getEditTarget();
        return editTarget === "clues" ? "furniture" : editTarget;
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
        spawnRoomNpcs(builtRoom, room, this.npcConfigs);
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

        drawAllSelectionHighlights(ctx, room, runtime, this);

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

    private pointerContext(room: RoomConfig, event: PointerEvent): PointerContext {
        return {
            room,
            tile: this.getMouseTile(event),
            grid: this.gridSize(),
            event,
            allowDrag: this.deps.getEditTarget() !== "clues"
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
            const handler = getLayoutHandler(this.canvasInteractionTarget());
            const ctx: PointerContext = {
                room,
                tile: { x: tileX, y: tileY },
                grid: this.gridSize(),
                event: new PointerEvent("pointermove"),
                allowDrag: true
            };
            this.canvas.style.cursor = handler.hasHover(ctx, this) ? "grab" : "default";
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

        const tool = this.deps.toolSelect.value as ToolMode;
        const editTarget = this.deps.getEditTarget();
        const layoutTarget = this.canvasInteractionTarget();
        const handler = getLayoutHandler(layoutTarget);
        const ctx = this.pointerContext(room, event);

        if (editTarget === "clues" && tool !== "select") {
            this.deps.toolSelect.value = "select";
            this.reportIssue(
                "Clues tab: edit clues in the panel. Switch to Furniture/NPCs/Doors to change the layout."
            );
            this.deps.onModeBadgeUpdate();
            return;
        }

        const hit = handler.hitTest(ctx, this);

        if (tool === "delete") {
            if (hit >= 0) {
                handler.deleteAt(ctx, hit, this);
            } else {
                this.deleteCurrentSelection(editTarget);
            }
            return;
        }

        if (tool === "add") {
            handler.addAt(ctx, this);
            return;
        }

        if (tool === "select") {
            if (layoutTarget === "doors" && hit < 0) {
                handler.clearSelection(this);
                this.setActiveDrag(null);
            } else {
                handler.selectAt(ctx, hit, this);
            }
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
            const ctx: PointerContext = {
                room,
                tile,
                grid: runtime,
                event,
                allowDrag: true
            };
            handlerForDrag(this.activeDrag).updateDrag(ctx, this.activeDrag, this);
        }
    }

    private onPointerUp(event: PointerEvent): void {
        const room = this.currentRoom();
        if (room && this.activeDrag) {
            this.syncTextarea(room.id);
        }
        this.activeDrag = null;
        this.canvas.style.cursor = "default";
        if (this.canvas.hasPointerCapture(event.pointerId)) {
            this.canvas.releasePointerCapture(event.pointerId);
        }
    }
}
