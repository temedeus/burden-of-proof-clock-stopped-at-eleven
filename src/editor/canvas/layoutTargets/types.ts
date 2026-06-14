import type { FurniturePlacement, NPCConfig, RoomConfig } from "@cse/content-schema";
import type { DoorGhost } from "../doorPlacement";
import type { FurnitureConfig } from "../../types";

export type LayoutTarget = "furniture" | "npc" | "doors";

export type ActiveDrag =
    | { kind: "furniture"; index: number; offsetX: number; offsetY: number }
    | { kind: "npc"; index: number; offsetX: number; offsetY: number }
    | {
          kind: "door";
          index: number;
          orientation: "horizontal" | "vertical";
          wall: "top" | "bottom" | "left" | "right";
      };

export interface PointerContext {
    room: RoomConfig;
    tile: { x: number; y: number };
    grid: { width: number; height: number };
    event: PointerEvent;
    /** False on clues tab — select furniture but do not drag. */
    allowDrag: boolean;
}

export interface LayoutTargetHost {
    readonly furnitureById: Record<string, FurnitureConfig>;
    readonly npcConfigs: Record<string, NPCConfig>;
    readonly workingRooms: Record<string, RoomConfig>;
    readonly furnitureSelect: HTMLSelectElement;
    readonly npcSelect: HTMLSelectElement;
    readonly doorTargetRoomSelect: HTMLSelectElement;
    currentRoom(): RoomConfig | undefined;
    findNpcPlacementRoomId(npcId: string): string | null;
    gridSize(): { width: number; height: number };
    furniturePlacementRect(placement: FurniturePlacement): { x: number; y: number; w: number; h: number } | null;
    markDirty(room: RoomConfig): void;
    syncTextarea(roomId: string): void;
    capturePointer(event: PointerEvent): void;
    setActiveDrag(drag: ActiveDrag | null): void;
    switchToSelectTool(): void;
    reportIssue(message: string): void;
    clearSelectionsExcept(keep: LayoutTarget | null): void;
    getSelectedIndex(target: LayoutTarget): number | null;
    setSelectedIndex(target: LayoutTarget, index: number | null): void;
    onFurnitureSelectionChanged(): void;
    refreshDoorSpawn(exitIndex: number): void;
    doorPlacementIsArmed(): boolean;
    getDoorGhost(): DoorGhost | null;
    cancelDoorPlacement(): void;
    addDoorFromGhost(ghost: DoorGhost): void;
    addDoorAtTile(tileX: number, tileY: number): void;
}

export interface LayoutTargetHandler {
    readonly target: LayoutTarget;
    hitTest(ctx: PointerContext, host: LayoutTargetHost): number;
    hasHover(ctx: PointerContext, host: LayoutTargetHost): boolean;
    deleteAt(ctx: PointerContext, index: number, host: LayoutTargetHost): void;
    deleteSelection(host: LayoutTargetHost): void;
    addAt(ctx: PointerContext, host: LayoutTargetHost): void;
    addAtCenter(host: LayoutTargetHost): void;
    selectAt(ctx: PointerContext, hit: number, host: LayoutTargetHost): void;
    clearSelection(host: LayoutTargetHost): void;
    updateDrag(ctx: PointerContext, drag: ActiveDrag, host: LayoutTargetHost): void;
    drawSelectionHighlight(
        ctx: CanvasRenderingContext2D,
        room: RoomConfig,
        grid: { width: number; height: number },
        host: LayoutTargetHost
    ): void;
}
