import type { NPCConfig, RoomConfig, FurniturePlacement } from "@cse/content-schema";
import { validateRooms } from "@cse/content-schema";
import { createRoomFromConfig } from "../world/Rooms";
import { TILE_SIZE } from "../world/constants";
import { spriteLoader } from "../assets/SpriteLoader";
import type { Interactable } from "../world/Interactable";
import { NPC } from "../entities/NPC";
import { loadGameContent } from "../content/loadGameContent";
import tableConfig from "../data/furniture/table.json";
import bookshelvesConfig from "../data/furniture/bookshelves.json";
import decorationsConfig from "../data/furniture/decorations.json";

type FurnitureConfig = {
    id: string;
    name: string;
    description: string;
    width: number;
    height: number;
    drawWidth?: number;
    drawHeight?: number;
    renderAnchor?: "center" | "bottom";
    spriteName?: string;
};

type ToolMode = "add" | "select" | "delete";

const content = loadGameContent();
const workingRooms: Record<string, RoomConfig> = JSON.parse(JSON.stringify(content.rooms));
const backendBase = "http://localhost:8787";
const roomSelect = document.getElementById("room-select") as HTMLSelectElement;
const roomJson = document.getElementById("room-json") as HTMLTextAreaElement;
const issuesEl = document.getElementById("issues") as HTMLDivElement;
const backendStatusEl = document.getElementById("backend-status") as HTMLParagraphElement;
const dirtyStatusEl = document.getElementById("dirty-status") as HTMLParagraphElement;
const canvas = document.getElementById("room-canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const toolSelect = document.getElementById("tool-select") as HTMLSelectElement;
const modeTargetBadge = document.getElementById("mode-target-badge") as HTMLDivElement;
const tabFurniture = document.getElementById("tab-furniture") as HTMLButtonElement;
const tabNpc = document.getElementById("tab-npc") as HTMLButtonElement;
const tabDoors = document.getElementById("tab-doors") as HTMLButtonElement;
const furnitureSection = document.getElementById("furniture-section") as HTMLDivElement;
const npcSection = document.getElementById("npc-section") as HTMLDivElement;
const doorsSection = document.getElementById("doors-section") as HTMLDivElement;
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

const dirtyRooms = new Set<string>();
const furnitureById: Record<string, FurnitureConfig> = {
    table: tableConfig as FurnitureConfig,
    bookshelves: bookshelvesConfig as FurnitureConfig,
    ...(decorationsConfig as Record<string, FurnitureConfig>)
};

let suppressDirtyTracking = false;
let currentRoomId = "";
let selectedFurnitureIndex: number | null = null;
let selectedNpcIndex: number | null = null;
let selectedDoorIndex: number | null = null;
let editTarget: "furniture" | "npc" | "doors" = "furniture";
let activeDrag:
    | { kind: "furniture"; index: number; offsetX: number; offsetY: number }
    | { kind: "npc"; index: number; offsetX: number; offsetY: number }
    | { kind: "door"; index: number; orientation: "horizontal" | "vertical"; wall: "top" | "bottom" | "left" | "right" }
    | null = null;
let doorPlacementArmed = false;
let doorPlacementStartTile: { x: number; y: number } | null = null;
let doorGhost:
    | { orientation: "horizontal" | "vertical"; wall: "top" | "bottom" | "left" | "right"; x: number; y: number }
    | null = null;

function getRuntimeRoomSize(): { width: number; height: number } {
    return {
        width: Math.floor(canvas.width / TILE_SIZE),
        height: Math.floor(canvas.height / TILE_SIZE)
    };
}

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

function setEditTarget(target: "furniture" | "npc" | "doors"): void {
    editTarget = target;
    tabFurniture.classList.toggle("active", target === "furniture");
    tabNpc.classList.toggle("active", target === "npc");
    tabDoors.classList.toggle("active", target === "doors");
    furnitureSection.classList.toggle("active", target === "furniture");
    npcSection.classList.toggle("active", target === "npc");
    doorsSection.classList.toggle("active", target === "doors");
    updateModeTargetBadge();
}

function updateModeTargetBadge(): void {
    const modeLabel = toolSelect.value.charAt(0).toUpperCase() + toolSelect.value.slice(1);
    const targetLabel = editTarget === "furniture" ? "Furniture" : editTarget === "npc" ? "NPCs" : "Doors";
    const armed = doorPlacementArmed ? " | Door placement armed" : "";
    modeTargetBadge.textContent = `Mode: ${modeLabel} | Target: ${targetLabel}${armed}`;
}

function resolvePosition(value: number | "center" | "top" | "bottom", dimension: number): number {
    if (typeof value === "number") return value;
    if (value === "center") return Math.floor(dimension / 2);
    if (value === "top") return 0;
    return dimension - 1;
}

function getPlacementRect(room: RoomConfig, placement: FurniturePlacement): { x: number; y: number; w: number; h: number } | null {
    const config = furnitureById[placement.furnitureId];
    if (!config) return null;
    const runtime = getRuntimeRoomSize();
    let x = typeof placement.x === "number" ? placement.x : Math.floor(runtime.width / 2);
    let y = resolvePosition(placement.y, runtime.height);
    if (placement.anchor === "center") {
        x -= Math.floor(config.width / 2);
        y -= Math.floor(config.height / 2);
    }
    return { x, y, w: config.width, h: config.height };
}

function hitTestFurniture(room: RoomConfig, tileX: number, tileY: number): number {
    for (let i = room.furniture.length - 1; i >= 0; i--) {
        const rect = getPlacementRect(room, room.furniture[i]);
        if (!rect) continue;
        if (tileX >= rect.x && tileX < rect.x + rect.w && tileY >= rect.y && tileY < rect.y + rect.h) {
            return i;
        }
    }
    return -1;
}

function resolveNpcPlacementTile(
    value: number | "center" | "top" | "bottom",
    dimension: "width" | "height",
    runtime: { width: number; height: number }
): number {
    if (typeof value === "number") return value;
    if (value === "center") return Math.floor((dimension === "width" ? runtime.width : runtime.height) / 2);
    if (value === "top") return 1;
    return (dimension === "width" ? runtime.width : runtime.height) - 2;
}

function hitTestNpc(room: RoomConfig, tileX: number, tileY: number): number {
    const runtime = getRuntimeRoomSize();
    for (let i = (room.npcs?.length ?? 0) - 1; i >= 0; i--) {
        const npc = room.npcs![i];
        const x = resolveNpcPlacementTile(npc.x, "width", runtime);
        const y = resolveNpcPlacementTile(npc.y, "height", runtime);
        if (tileX >= x && tileX <= x + 1 && tileY >= y && tileY <= y + 1) return i;
    }
    return -1;
}

function resolveExitPos(value: number | "center" | "top" | "bottom", dimension: number): number {
    return resolvePosition(value, dimension);
}

function hitTestDoor(room: RoomConfig, tileX: number, tileY: number): number {
    const runtime = getRuntimeRoomSize();
    for (let i = room.exits.length - 1; i >= 0; i--) {
        const exit = room.exits[i];
        const x = resolveExitPos(exit.x as number | "center" | "top" | "bottom", runtime.width);
        const y = resolveExitPos(exit.y as number | "center" | "top" | "bottom", runtime.height);
        const isTopOrBottom = y === 0 || y === runtime.height - 1;
        if (isTopOrBottom) {
            if (tileY === y && tileX >= x - 1 && tileX <= x + 1) return i;
        } else {
            if (tileX === x && tileY >= y - 1 && tileY <= y + 1) return i;
        }
    }
    return -1;
}

function nearestWallPlacement(tileX: number, tileY: number, runtime: { width: number; height: number }) {
    const dTop = tileY;
    const dBottom = runtime.height - 1 - tileY;
    const dLeft = tileX;
    const dRight = runtime.width - 1 - tileX;
    const minDist = Math.min(dTop, dBottom, dLeft, dRight);
    if (minDist === dTop) return { x: tileX, y: "top" as const, side: "top" as const };
    if (minDist === dBottom) return { x: tileX, y: "bottom" as const, side: "bottom" as const };
    if (minDist === dLeft) return { x: "top" as const, y: "center" as const, side: "left" as const };
    return { x: "bottom" as const, y: "center" as const, side: "right" as const };
}

function autoSpawnForTargetRoom(targetRoomId: string, side: "top" | "bottom" | "left" | "right", alignTile: number) {
    const targetRoom = workingRooms[targetRoomId];
    if (!targetRoom) return { spawnX: "center" as const, spawnY: "center" as const };
    const width = targetRoom.width;
    const height = targetRoom.height;
    const clampedX = Math.max(2, Math.min(width - 3, alignTile));
    const clampedY = Math.max(2, Math.min(height - 3, alignTile));
    if (side === "top") return { spawnX: clampedX, spawnY: 2 };
    if (side === "bottom") return { spawnX: clampedX, spawnY: height - 3 };
    if (side === "left") return { spawnX: 2, spawnY: clampedY };
    return { spawnX: width - 3, spawnY: clampedY };
}

function buildDoorGhost(
    tileX: number,
    tileY: number,
    runtime: { width: number; height: number },
    startTile: { x: number; y: number } | null
): { orientation: "horizontal" | "vertical"; wall: "top" | "bottom" | "left" | "right"; x: number; y: number } {
    const dx = startTile ? tileX - startTile.x : 0;
    const dy = startTile ? tileY - startTile.y : 0;
    const orientation: "horizontal" | "vertical" = Math.abs(dx) >= Math.abs(dy) ? "horizontal" : "vertical";

    if (orientation === "horizontal") {
        const wall: "top" | "bottom" =
            tileY <= (runtime.height - 1 - tileY) ? "top" : "bottom";
        return {
            orientation,
            wall,
            x: Math.max(1, Math.min(runtime.width - 2, tileX)),
            y: wall === "top" ? 0 : runtime.height - 1
        };
    }

    const wall: "left" | "right" =
        tileX <= (runtime.width - 1 - tileX) ? "left" : "right";
    return {
        orientation,
        wall,
        x: wall === "left" ? 0 : runtime.width - 1,
        y: Math.max(1, Math.min(runtime.height - 2, tileY))
    };
}

function refreshRoomOptions() {
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

function setBackendStatus(online: boolean): void {
    backendStatusEl.textContent = online
        ? "Backend: online (filesystem save enabled)"
        : "Backend: offline (using in-memory rooms only)";
}

function setDirtyStatus(): void {
    dirtyStatusEl.textContent = dirtyRooms.size === 0
        ? "Unsaved changes: none"
        : `Unsaved changes: ${Array.from(dirtyRooms).sort().join(", ")}`;
}

function markDirty(roomId: string): void {
    if (!roomId) return;
    dirtyRooms.add(roomId);
    setDirtyStatus();
}

function clearDirty(roomId: string): void {
    dirtyRooms.delete(roomId);
    setDirtyStatus();
}

async function fetchRoomsFromBackend(force = false): Promise<boolean> {
    if (!force && dirtyRooms.size > 0) {
        const proceed = window.confirm("You have unsaved changes. Reloading will discard them. Continue?");
        if (!proceed) return false;
    }
    try {
        const response = await fetch(`${backendBase}/api/rooms`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = (await response.json()) as { rooms: Record<string, RoomConfig> };
        for (const key of Object.keys(workingRooms)) delete workingRooms[key];
        Object.assign(workingRooms, payload.rooms);
        dirtyRooms.clear();
        setDirtyStatus();
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

function syncTextareaFromRoom(roomId: string): void {
    const room = workingRooms[roomId];
    if (!room) return;
    suppressDirtyTracking = true;
    roomJson.value = JSON.stringify(room, null, 2);
    suppressDirtyTracking = false;
}

function renderSelectedRoom() {
    const selected = roomSelect.value;
    currentRoomId = selected;
    if (!workingRooms[selected]) {
        roomJson.value = "";
        return;
    }
    syncTextareaFromRoom(selected);
    selectedFurnitureIndex = null;
    selectedNpcIndex = null;
    selectedDoorIndex = null;
    doorPlacementArmed = false;
    doorPlacementStartTile = null;
    doorGhost = null;
    activeDrag = null;
    refreshDoorTargetOptions();
    issuesEl.textContent = "";
}

function furnitureActorFromInteractable(obj: Interactable) {
    const minX = Math.min(...obj.tiles.map((t) => t.x));
    const maxX = Math.max(...obj.tiles.map((t) => t.x));
    const minY = Math.min(...obj.tiles.map((t) => t.y));
    const maxY = Math.max(...obj.tiles.map((t) => t.y));
    const widthTiles = maxX - minX + 1;
    const heightTiles = maxY - minY + 1;
    let spriteName = "table";
    if (obj.spriteName) {
        spriteName = obj.spriteName;
    } else if (obj.id === "shelves" || obj.id === "bookshelves") {
        spriteName = "bookshelf";
    } else if (obj.id === "table") {
        spriteName = "table";
    }
    const isFireplace = spriteName === "fireplace";
    const decorW = obj.drawWidthTiles;
    const decorH = obj.drawHeightTiles;
    const hasDecorDraw = decorW != null && decorH != null;
    let drawW: number;
    let drawH: number;
    let drawX: number;
    let drawY: number;
    if (isFireplace && !hasDecorDraw) {
        drawW = TILE_SIZE * 3;
        drawH = TILE_SIZE;
        drawX = minX * TILE_SIZE;
        drawY = minY * TILE_SIZE;
    } else if (hasDecorDraw) {
        drawW = decorW * TILE_SIZE;
        drawH = decorH * TILE_SIZE;
        const footW = widthTiles * TILE_SIZE;
        const footH = heightTiles * TILE_SIZE;
        const baseX = minX * TILE_SIZE + (footW - drawW) / 2;
        if (obj.renderAnchor === "bottom") {
            drawX = baseX;
            drawY = (maxY + 1) * TILE_SIZE - drawH;
        } else {
            drawX = baseX;
            drawY = minY * TILE_SIZE + (footH - drawH) / 2;
        }
    } else {
        drawW = widthTiles * TILE_SIZE;
        drawH = heightTiles * TILE_SIZE;
        drawX = minX * TILE_SIZE;
        drawY = minY * TILE_SIZE;
    }
    const sortY = hasDecorDraw || isFireplace ? drawY : minY * TILE_SIZE;
    const sortH = hasDecorDraw || isFireplace ? drawH : heightTiles * TILE_SIZE;
    return { y: sortY, height: sortH, render: () => spriteLoader.drawSprite(ctx, spriteName, drawX, drawY, drawW, drawH) };
}

function drawRoomPreview(): void {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const room = workingRooms[roomSelect.value];
    if (!room) return;
    const runtime = getRuntimeRoomSize();
    const builtRoom = createRoomFromConfig(room, runtime.width, runtime.height);
    builtRoom.map.render(ctx);
    for (const exit of builtRoom.exits) {
        const isTopOrBottom = exit.y === 0 || exit.y === builtRoom.map.height - 1;
        if (isTopOrBottom) {
            spriteLoader.drawSprite(ctx, "door", (exit.x - 1) * TILE_SIZE, exit.y * TILE_SIZE, TILE_SIZE * 3, TILE_SIZE);
        } else {
            spriteLoader.drawSprite(ctx, "door", exit.x * TILE_SIZE - 1, (exit.y - 1) * TILE_SIZE - 1, TILE_SIZE + 2, TILE_SIZE * 3 + 2);
        }
    }
    // Rebuild NPC preview using the same placement semantics as game.
    for (const placement of room.npcs ?? []) {
        const npcCfg = (content.npcs as Record<string, NPCConfig>)[placement.npcId];
        if (!npcCfg) continue;
        const npcX = resolveNpcPlacementTile(placement.x, "width", runtime) * TILE_SIZE;
        const npcY = resolveNpcPlacementTile(placement.y, "height", runtime) * TILE_SIZE;
        builtRoom.npcs.push(new NPC(npcCfg.id, npcX, npcY, npcCfg.name, npcCfg.role, npcCfg.spriteName));
    }

    const rugActors = builtRoom.interactables
        .filter((i) => i.walkableDecor)
        .map(furnitureActorFromInteractable)
        .sort((a, b) => a.y + a.height - (b.y + b.height));
    for (const actor of rugActors) actor.render();

    const actors = [
        ...builtRoom.interactables.filter((i) => !i.walkableDecor).map(furnitureActorFromInteractable),
        ...builtRoom.npcs
    ].sort((a, b) => a.y + a.height - (b.y + b.height));
    for (const actor of actors) actor.render(ctx);

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

    if (selectedFurnitureIndex != null) {
        const placement = room.furniture[selectedFurnitureIndex];
        const rect = placement ? getPlacementRect(room, placement) : null;
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

    if (selectedNpcIndex != null && room.npcs && room.npcs[selectedNpcIndex]) {
        const npc = room.npcs[selectedNpcIndex];
        const nx = resolveNpcPlacementTile(npc.x, "width", runtime);
        const ny = resolveNpcPlacementTile(npc.y, "height", runtime);
        ctx.strokeStyle = "rgba(255, 220, 0, 0.95)";
        ctx.lineWidth = 2;
        ctx.strokeRect(nx * TILE_SIZE + 1, ny * TILE_SIZE + 1, TILE_SIZE * 2 - 2, TILE_SIZE * 2 - 2);
        ctx.lineWidth = 1;
    }

    if (selectedDoorIndex != null && room.exits[selectedDoorIndex]) {
        const exit = room.exits[selectedDoorIndex];
        const x = resolveExitPos(exit.x as any, runtime.width);
        const y = resolveExitPos(exit.y as any, runtime.height);
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

    if (doorPlacementArmed && doorGhost) {
        ctx.save();
        ctx.globalAlpha = 0.55;
        if (doorGhost.orientation === "horizontal") {
            spriteLoader.drawSprite(
                ctx,
                "door",
                (doorGhost.x - 1) * TILE_SIZE,
                doorGhost.y * TILE_SIZE,
                TILE_SIZE * 3,
                TILE_SIZE
            );
        } else {
            spriteLoader.drawSprite(
                ctx,
                "door",
                doorGhost.x * TILE_SIZE - 1,
                (doorGhost.y - 1) * TILE_SIZE - 1,
                TILE_SIZE + 2,
                TILE_SIZE * 3 + 2
            );
        }
        ctx.restore();
    }
}

function getMouseTile(event: MouseEvent | PointerEvent, room: RoomConfig): { x: number; y: number } {
    const runtime = getRuntimeRoomSize();
    const rect = canvas.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    return {
        x: Math.max(0, Math.min(runtime.width - 1, Math.floor(px / TILE_SIZE))),
        y: Math.max(0, Math.min(runtime.height - 1, Math.floor(py / TILE_SIZE)))
    };
}

function updateCanvasCursor(tileX: number, tileY: number): void {
    const room = workingRooms[roomSelect.value];
    if (!room) {
        canvas.style.cursor = "default";
        return;
    }
    if (toolSelect.value === "select") {
        if (activeDrag) {
            canvas.style.cursor = "grabbing";
            return;
        }
        const target = editTarget;
        const hasHoverTarget =
            (target === "furniture" && hitTestFurniture(room, tileX, tileY) >= 0) ||
            (target === "npc" && hitTestNpc(room, tileX, tileY) >= 0) ||
            (target === "doors" && hitTestDoor(room, tileX, tileY) >= 0);
        canvas.style.cursor = hasHoverTarget ? "grab" : "default";
        return;
    }
    canvas.style.cursor = "crosshair";
}

function placeFurnitureAtCurrentTile(tileX: number, tileY: number): void {
    const room = workingRooms[roomSelect.value];
    const furnitureId = furnitureSelect.value;
    if (!room || !furnitureById[furnitureId]) return;
    room.furniture.push({ furnitureId, x: tileX, y: tileY, anchor: "top-left" });
    selectedFurnitureIndex = room.furniture.length - 1;
    markDirty(room.id);
    syncTextareaFromRoom(room.id);
}

function addSelectedFurnitureAtCenter(): void {
    const room = workingRooms[roomSelect.value];
    const furnitureId = furnitureSelect.value;
    const config = furnitureById[furnitureId];
    if (!room || !config) return;
    const runtime = getRuntimeRoomSize();
    const x = Math.max(0, Math.floor((runtime.width - config.width) / 2));
    const y = Math.max(0, Math.floor((runtime.height - config.height) / 2));
    room.furniture.push({ furnitureId, x, y, anchor: "top-left" });
    selectedFurnitureIndex = room.furniture.length - 1;
    selectedNpcIndex = null;
    markDirty(room.id);
    syncTextareaFromRoom(room.id);
}

function deleteSelectedFurniture(): void {
    const room = workingRooms[roomSelect.value];
    if (!room || selectedFurnitureIndex == null) return;
    if (selectedFurnitureIndex < 0 || selectedFurnitureIndex >= room.furniture.length) return;
    room.furniture.splice(selectedFurnitureIndex, 1);
    selectedFurnitureIndex = null;
    markDirty(room.id);
    syncTextareaFromRoom(room.id);
}

function addSelectedNpcAtCenter(): void {
    const room = workingRooms[roomSelect.value];
    const npcId = npcSelect.value;
    if (!room || !(content.npcs as Record<string, NPCConfig>)[npcId]) return;
    if (!room.npcs) room.npcs = [];
    const runtime = getRuntimeRoomSize();
    const x = Math.max(0, Math.floor((runtime.width - 2) / 2));
    const y = Math.max(0, Math.floor((runtime.height - 2) / 2));
    room.npcs.push({ npcId, x, y });
    selectedNpcIndex = room.npcs.length - 1;
    selectedFurnitureIndex = null;
    markDirty(room.id);
    syncTextareaFromRoom(room.id);
}

function deleteSelectedNpc(): void {
    const room = workingRooms[roomSelect.value];
    if (!room || !room.npcs || selectedNpcIndex == null) return;
    if (selectedNpcIndex < 0 || selectedNpcIndex >= room.npcs.length) return;
    room.npcs.splice(selectedNpcIndex, 1);
    selectedNpcIndex = null;
    markDirty(room.id);
    syncTextareaFromRoom(room.id);
}

function addDoorAtTile(tileX: number, tileY: number): void {
    const room = workingRooms[roomSelect.value];
    const targetRoom = doorTargetRoomSelect.value;
    if (!room || !targetRoom) return;
    const runtime = getRuntimeRoomSize();
    const placement = nearestWallPlacement(tileX, tileY, runtime);
    const align = placement.side === "top" || placement.side === "bottom" ? tileX : tileY;
    const spawn = autoSpawnForTargetRoom(targetRoom, placement.side, align);
    room.exits.push({
        x: placement.x as any,
        y: placement.y as any,
        targetRoom,
        spawnX: spawn.spawnX as any,
        spawnY: spawn.spawnY as any
    });
    selectedDoorIndex = room.exits.length - 1;
    selectedFurnitureIndex = null;
    selectedNpcIndex = null;
    markDirty(room.id);
    syncTextareaFromRoom(room.id);
}

function addDoorFromGhost(ghost: { orientation: "horizontal" | "vertical"; wall: "top" | "bottom" | "left" | "right"; x: number; y: number }): void {
    const room = workingRooms[roomSelect.value];
    const targetRoom = doorTargetRoomSelect.value;
    if (!room || !targetRoom) return;
    const align = ghost.orientation === "horizontal" ? ghost.x : ghost.y;
    const spawn = autoSpawnForTargetRoom(targetRoom, ghost.wall, align);
    room.exits.push({
        x: ghost.orientation === "horizontal"
            ? ghost.x as any
            : (ghost.wall === "left" ? "top" : "bottom") as any,
        y: ghost.orientation === "horizontal"
            ? (ghost.wall === "top" ? "top" : "bottom") as any
            : ghost.y as any,
        targetRoom,
        spawnX: spawn.spawnX as any,
        spawnY: spawn.spawnY as any
    });
    selectedDoorIndex = room.exits.length - 1;
    selectedFurnitureIndex = null;
    selectedNpcIndex = null;
    markDirty(room.id);
    syncTextareaFromRoom(room.id);
}

function deleteSelectedDoor(): void {
    const room = workingRooms[roomSelect.value];
    if (!room || selectedDoorIndex == null) return;
    if (selectedDoorIndex < 0 || selectedDoorIndex >= room.exits.length) return;
    room.exits.splice(selectedDoorIndex, 1);
    selectedDoorIndex = null;
    markDirty(room.id);
    syncTextareaFromRoom(room.id);
}

function deleteCurrentSelection(): void {
    if (editTarget === "furniture") {
        deleteSelectedFurniture();
    } else if (editTarget === "npc") {
        deleteSelectedNpc();
    } else {
        deleteSelectedDoor();
    }
}

function setSelectedDoorTarget(): void {
    const room = workingRooms[roomSelect.value];
    const targetRoom = doorTargetRoomSelect.value;
    if (!room || selectedDoorIndex == null || !targetRoom) return;
    const exit = room.exits[selectedDoorIndex];
    if (!exit) return;
    exit.targetRoom = targetRoom;
    const runtime = getRuntimeRoomSize();
    const x = resolveExitPos(exit.x as any, runtime.width);
    const y = resolveExitPos(exit.y as any, runtime.height);
    const side = y === 0 ? "top" : y === runtime.height - 1 ? "bottom" : x === 0 ? "left" : "right";
    const align = side === "top" || side === "bottom" ? x : y;
    const spawn = autoSpawnForTargetRoom(targetRoom, side, align);
    exit.spawnX = spawn.spawnX as any;
    exit.spawnY = spawn.spawnY as any;
    markDirty(room.id);
    syncTextareaFromRoom(room.id);
}

function refreshDoorSpawn(exitIndex: number): void {
    const room = workingRooms[roomSelect.value];
    if (!room) return;
    const exit = room.exits[exitIndex];
    if (!exit) return;
    const targetRoom = exit.targetRoom;
    const runtime = getRuntimeRoomSize();
    const x = resolveExitPos(exit.x as any, runtime.width);
    const y = resolveExitPos(exit.y as any, runtime.height);
    const side = y === 0 ? "top" : y === runtime.height - 1 ? "bottom" : x === 0 ? "left" : "right";
    const align = side === "top" || side === "bottom" ? x : y;
    const spawn = autoSpawnForTargetRoom(targetRoom, side, align);
    exit.spawnX = spawn.spawnX as any;
    exit.spawnY = spawn.spawnY as any;
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
        clearDirty(selected);
        issuesEl.textContent = `Saved room '${selected}' to backend and workspace state.`;
    } catch (error) {
        issuesEl.textContent = `Save failed: ${(error as Error).message}`;
        setBackendStatus(false);
    }
}

async function saveAllRooms(): Promise<void> {
    try {
        const selected = roomSelect.value;
        if (selected && roomJson.value.trim()) {
            const parsed = JSON.parse(roomJson.value) as RoomConfig;
            parsed.id = selected;
            workingRooms[selected] = parsed;
        }
        const validationIssues = validateRooms(Object.values(workingRooms), furnitureById, content.npcs as Record<string, NPCConfig>);
        if (validationIssues.length > 0) {
            issuesEl.textContent = validationIssues.map((issue) => `[${issue.roomId}] ${issue.message}`).join("\n");
            return;
        }
        const response = await fetch(`${backendBase}/api/rooms/sync`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rooms: workingRooms })
        });
        if (!response.ok) throw new Error(`Save all failed with HTTP ${response.status}.`);
        dirtyRooms.clear();
        setDirtyStatus();
        setBackendStatus(true);
        issuesEl.textContent = "Saved all rooms to backend.";
    } catch (error) {
        setBackendStatus(false);
        issuesEl.textContent = `Save all failed: ${(error as Error).message}`;
    }
}

async function createRoom() {
    const newId = window.prompt("New room id (e.g. attic):");
    if (!newId) return;
    if (workingRooms[newId]) return void (issuesEl.textContent = `Room '${newId}' already exists.`);
    workingRooms[newId] = { id: newId, width: 20, height: 15, floorTile: "floor", furniture: [], exits: [], npcs: [] };
    refreshRoomOptions();
    roomSelect.value = newId;
    renderSelectedRoom();
    markDirty(newId);
}

async function renameRoom() {
    const currentId = roomSelect.value;
    if (!currentId) return;
    const newId = window.prompt(`Rename '${currentId}' to:`, currentId);
    if (!newId || newId === currentId) return;
    if (workingRooms[newId]) return void (issuesEl.textContent = `Room '${newId}' already exists.`);
    const room = workingRooms[currentId];
    delete workingRooms[currentId];
    room.id = newId;
    workingRooms[newId] = room;
    for (const candidate of Object.values(workingRooms)) {
        for (const exit of candidate.exits) {
            if (exit.targetRoom === currentId) {
                exit.targetRoom = newId;
                markDirty(candidate.id);
            }
        }
    }
    markDirty(newId);
    clearDirty(currentId);
    refreshRoomOptions();
    roomSelect.value = newId;
    renderSelectedRoom();
}

async function deleteRoom() {
    const currentId = roomSelect.value;
    if (!currentId) return;
    if (Object.keys(workingRooms).length <= 1) return void (issuesEl.textContent = "Cannot delete the last remaining room.");
    if (!window.confirm(`Delete room '${currentId}'?`)) return;
    delete workingRooms[currentId];
    clearDirty(currentId);
    refreshRoomOptions();
    renderSelectedRoom();
}

function validateAllRooms() {
    const issues = validateRooms(Object.values(workingRooms), furnitureById, content.npcs as Record<string, NPCConfig>);
    issuesEl.textContent = issues.length === 0 ? "All rooms valid." : issues.map((issue) => `[${issue.roomId}] ${issue.message}`).join("\n");
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

canvas.addEventListener("pointerdown", (event) => {
    const room = workingRooms[roomSelect.value];
    if (!room) return;
    const tile = getMouseTile(event, room);
    const tool = toolSelect.value as ToolMode;
    const target = editTarget;
    const furnitureHit = hitTestFurniture(room, tile.x, tile.y);
    const npcHit = hitTestNpc(room, tile.x, tile.y);
    const doorHit = hitTestDoor(room, tile.x, tile.y);
    if (tool === "delete") {
        let deletedByClick = false;
        if (target === "furniture" && furnitureHit >= 0) {
            room.furniture.splice(furnitureHit, 1);
            selectedFurnitureIndex = null;
            markDirty(room.id);
            syncTextareaFromRoom(room.id);
            deletedByClick = true;
        } else if (target === "npc" && npcHit >= 0 && room.npcs) {
            room.npcs.splice(npcHit, 1);
            selectedNpcIndex = null;
            markDirty(room.id);
            syncTextareaFromRoom(room.id);
            deletedByClick = true;
        } else if (target === "doors" && doorHit >= 0) {
            room.exits.splice(doorHit, 1);
            selectedDoorIndex = null;
            markDirty(room.id);
            syncTextareaFromRoom(room.id);
            deletedByClick = true;
        }
        if (!deletedByClick) {
            deleteCurrentSelection();
        }
        return;
    }
    if (tool === "add") {
        if (target === "furniture") {
            placeFurnitureAtCurrentTile(tile.x, tile.y);
            toolSelect.value = "select";
            updateModeTargetBadge();
        } else if (target === "npc") {
            if (!room.npcs) room.npcs = [];
            room.npcs.push({ npcId: npcSelect.value, x: tile.x, y: tile.y });
            selectedNpcIndex = room.npcs.length - 1;
            selectedFurnitureIndex = null;
            selectedDoorIndex = null;
            markDirty(room.id);
            syncTextareaFromRoom(room.id);
            toolSelect.value = "select";
            updateModeTargetBadge();
        } else {
            if (doorPlacementArmed && doorGhost) {
                addDoorFromGhost(doorGhost);
                doorPlacementArmed = false;
                doorPlacementStartTile = null;
                doorGhost = null;
                issuesEl.textContent = "Door added.";
                toolSelect.value = "select";
                updateModeTargetBadge();
            } else {
                addDoorAtTile(tile.x, tile.y);
                toolSelect.value = "select";
                updateModeTargetBadge();
            }
        }
        return;
    }
    if (tool === "select" && target === "furniture") {
        selectedFurnitureIndex = furnitureHit >= 0 ? furnitureHit : null;
        selectedNpcIndex = null;
        selectedDoorIndex = null;
        if (furnitureHit >= 0) {
            canvas.setPointerCapture(event.pointerId);
            const rect = getPlacementRect(room, room.furniture[furnitureHit]);
            if (rect) {
                activeDrag = {
                    kind: "furniture",
                    index: furnitureHit,
                    offsetX: tile.x - rect.x,
                    offsetY: tile.y - rect.y
                };
            }
        }
    } else if (tool === "select" && target === "npc") {
        selectedNpcIndex = npcHit >= 0 ? npcHit : null;
        selectedFurnitureIndex = null;
        selectedDoorIndex = null;
        if (npcHit >= 0 && room.npcs) {
            canvas.setPointerCapture(event.pointerId);
            const runtime = getRuntimeRoomSize();
            const npc = room.npcs[npcHit];
            const x = resolveNpcPlacementTile(npc.x, "width", runtime);
            const y = resolveNpcPlacementTile(npc.y, "height", runtime);
            activeDrag = {
                kind: "npc",
                index: npcHit,
                offsetX: tile.x - x,
                offsetY: tile.y - y
            };
        }
    } else if (tool === "select" && target === "doors" && doorHit >= 0) {
        canvas.setPointerCapture(event.pointerId);
        selectedDoorIndex = doorHit;
        selectedFurnitureIndex = null;
        selectedNpcIndex = null;
        doorTargetRoomSelect.value = room.exits[doorHit].targetRoom;
        const runtime = getRuntimeRoomSize();
        const exit = room.exits[doorHit];
        const x = resolveExitPos(exit.x as any, runtime.width);
        const y = resolveExitPos(exit.y as any, runtime.height);
        const isHorizontal = y === 0 || y === runtime.height - 1;
        const wall =
            y === 0 ? "top" :
            y === runtime.height - 1 ? "bottom" :
            x === 0 ? "left" : "right";
        activeDrag = {
            kind: "door",
            index: doorHit,
            orientation: isHorizontal ? "horizontal" : "vertical",
            wall
        };
    } else if (tool === "select") {
        // Clicking empty space clears selection in current target.
        if (target === "doors") selectedDoorIndex = null;
        if (target === "furniture") selectedFurnitureIndex = null;
        if (target === "npc") selectedNpcIndex = null;
        activeDrag = null;
    }
});

canvas.addEventListener("pointermove", (event) => {
    const room = workingRooms[roomSelect.value];
    if (!room) return;
    const runtime = getRuntimeRoomSize();
    const tile = getMouseTile(event, room);
    updateCanvasCursor(tile.x, tile.y);
    if (doorPlacementArmed && editTarget === "doors" && toolSelect.value === "add") {
        if (!doorPlacementStartTile) {
            doorPlacementStartTile = { x: tile.x, y: tile.y };
        }
        doorGhost = buildDoorGhost(tile.x, tile.y, runtime, doorPlacementStartTile);
    }
    if (toolSelect.value === "select" && activeDrag) {
        if (activeDrag.kind === "furniture") {
            const placement = room.furniture[activeDrag.index];
            if (!placement) return;
            const config = furnitureById[placement.furnitureId];
            const maxX = Math.max(0, runtime.width - config.width);
            const maxY = Math.max(0, runtime.height - config.height);
            placement.x = Math.max(0, Math.min(maxX, tile.x - activeDrag.offsetX));
            placement.y = Math.max(0, Math.min(maxY, tile.y - activeDrag.offsetY));
            placement.anchor = "top-left";
            markDirty(room.id);
            return;
        }
        if (activeDrag.kind === "npc") {
            if (!room.npcs) return;
            const npc = room.npcs[activeDrag.index];
            if (!npc) return;
            const maxX = Math.max(0, runtime.width - 2);
            const maxY = Math.max(0, runtime.height - 2);
            npc.x = Math.max(0, Math.min(maxX, tile.x - activeDrag.offsetX));
            npc.y = Math.max(0, Math.min(maxY, tile.y - activeDrag.offsetY));
            markDirty(room.id);
            return;
        }
        const exit = room.exits[activeDrag.index];
        if (!exit) return;
        if (activeDrag.orientation === "horizontal") {
            const x = Math.max(1, Math.min(runtime.width - 2, tile.x));
            exit.x = x as any;
            exit.y = (activeDrag.wall === "top" ? "top" : "bottom") as any;
        } else {
            const y = Math.max(1, Math.min(runtime.height - 2, tile.y));
            exit.y = y as any;
            exit.x = (activeDrag.wall === "left" ? "top" : "bottom") as any;
        }
        refreshDoorSpawn(activeDrag.index);
        markDirty(room.id);
    }
});

canvas.addEventListener("pointerup", (event) => {
    const room = workingRooms[roomSelect.value];
    if (room && activeDrag) {
        syncTextareaFromRoom(room.id);
    }
    activeDrag = null;
    canvas.style.cursor = "default";
    if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
    }
});

canvas.addEventListener("pointercancel", (event) => {
    activeDrag = null;
    canvas.style.cursor = "default";
    if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
    }
});

roomSelect.addEventListener("change", () => {
    const nextId = roomSelect.value;
    if (currentRoomId && nextId !== currentRoomId && dirtyRooms.has(currentRoomId)) {
        const proceed = window.confirm(`Room '${currentRoomId}' has unsaved changes. Continue switching anyway?`);
        if (!proceed) {
            refreshRoomOptions();
            roomSelect.value = currentRoomId;
            return;
        }
    }
    renderSelectedRoom();
});

roomJson.addEventListener("input", () => {
    if (suppressDirtyTracking) return;
    markDirty(roomSelect.value);
});

window.addEventListener("beforeunload", (event) => {
    if (dirtyRooms.size > 0) event.preventDefault();
});

validateButton.addEventListener("click", validateSelectedRoom);
validateAllButton.addEventListener("click", validateAllRooms);
newRoomButton.addEventListener("click", () => { void createRoom(); });
renameRoomButton.addEventListener("click", () => { void renameRoom(); });
deleteRoomButton.addEventListener("click", () => { void deleteRoom(); });
saveJsonButton.addEventListener("click", () => { void saveCurrentJson(); });
saveAllButton.addEventListener("click", () => { void saveAllRooms(); });
exportButton.addEventListener("click", exportRoomsJson);
reloadBackendButton.addEventListener("click", () => { void fetchRoomsFromBackend(); });
addFurnitureButton.addEventListener("click", addSelectedFurnitureAtCenter);
deleteSelectedFurnitureButton.addEventListener("click", deleteSelectedFurniture);
addNpcButton.addEventListener("click", addSelectedNpcAtCenter);
deleteSelectedNpcButton.addEventListener("click", deleteSelectedNpc);
setDoorTargetButton.addEventListener("click", setSelectedDoorTarget);
addDoorButton.addEventListener("click", () => {
    setEditTarget("doors");
    toolSelect.value = "add";
    doorPlacementArmed = true;
    doorPlacementStartTile = null;
    doorGhost = null;
    issuesEl.textContent = "Door placement armed: move mouse to preview ghost, click to place. Press Esc to cancel.";
    updateModeTargetBadge();
});
deleteSelectedDoorButton.addEventListener("click", deleteSelectedDoor);

function renderLoop() {
    drawRoomPreview();
    requestAnimationFrame(renderLoop);
}

refreshFurnitureOptions();
refreshNpcOptions();
refreshRoomOptions();
renderSelectedRoom();
setDirtyStatus();
setEditTarget("furniture");
toolSelect.value = "select";
toolSelect.addEventListener("change", () => updateModeTargetBadge());
tabFurniture.addEventListener("click", () => setEditTarget("furniture"));
tabNpc.addEventListener("click", () => setEditTarget("npc"));
tabDoors.addEventListener("click", () => setEditTarget("doors"));
window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && doorPlacementArmed) {
        doorPlacementArmed = false;
        doorPlacementStartTile = null;
        doorGhost = null;
        issuesEl.textContent = "Door placement cancelled.";
        updateModeTargetBadge();
    }
});
updateModeTargetBadge();
canvas.style.cursor = "default";
void fetchRoomsFromBackend();
void spriteLoader.load().then(() => renderLoop()).catch(() => renderLoop());
