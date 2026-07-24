import type { ClueAssignment, FurnitureConfig, NPCConfig } from "@cse/content-schema";
import { spriteLoader } from "../assets/SpriteLoader";
import {
    getClueDisplay,
    getInventoryClueIds,
    resolveClueIconSprite,
    type ClueCatalog
} from "../content/clueCatalog";
import { ClueSystem } from "../systems/ClueSystem";
import { shouldShowTouchControls } from "./platform";
import type { Input } from "./Input";

const PANEL_FILL = "#2a2a2a";
const PANEL_BORDER = "#666";
const SELECTED_BORDER = "#ffd700";
const SLOT_FILL = "#1e1e1e";
const DETAIL_BG = "#1a1a1a";

export interface InventorySlot {
    clueId: string;
    x: number;
    y: number;
    size: number;
}

export interface InventoryLayout {
    panelX: number;
    panelY: number;
    panelWidth: number;
    panelHeight: number;
    slots: InventorySlot[];
    cols: number;
}

export function computeInventoryLayout(
    canvasWidth: number,
    canvasHeight: number,
    clueCount: number
): InventoryLayout {
    const panelWidth = Math.min(560, Math.round(canvasWidth * 0.9));
    const panelHeight = Math.min(440, Math.round(canvasHeight * 0.82));
    const panelX = (canvasWidth - panelWidth) / 2;
    const panelY = (canvasHeight - panelHeight) / 2;

    if (clueCount <= 0) {
        return { panelX, panelY, panelWidth, panelHeight, slots: [], cols: 0 };
    }

    const iconSize = Math.min(64, Math.max(44, Math.round(panelWidth / 8)));
    const gap = Math.round(iconSize * 0.22);
    const cols = Math.min(5, Math.max(2, Math.ceil(Math.sqrt(clueCount))));
    const rows = Math.ceil(clueCount / cols);
    const gridWidth = cols * iconSize + (cols - 1) * gap;
    const gridHeight = rows * iconSize + (rows - 1) * gap;
    const gridX = panelX + (panelWidth - gridWidth) / 2;
    const gridY = panelY + 72 + Math.max(0, (panelHeight - 196 - gridHeight) / 2);

    const slots: InventorySlot[] = [];
    for (let i = 0; i < clueCount; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        slots.push({
            clueId: "",
            x: gridX + col * (iconSize + gap),
            y: gridY + row * (iconSize + gap),
            size: iconSize
        });
    }

    return { panelX, panelY, panelWidth, panelHeight, slots, cols };
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const lines: string[] = [];
    for (const paragraph of text.split("\n")) {
        const words = paragraph.split(" ");
        let current = "";
        for (const word of words) {
            const next = current ? `${current} ${word}` : word;
            if (ctx.measureText(next).width <= maxWidth) {
                current = next;
            } else {
                if (current) lines.push(current);
                current = word;
            }
        }
        if (current) lines.push(current);
    }
    return lines.length > 0 ? lines : [text];
}

export class InventoryPanel {
    private selectedIndex = 0;
    private detailClueId: string | null = null;

    reset(): void {
        this.selectedIndex = 0;
        this.detailClueId = null;
    }

    update(
        input: Input,
        clueSystem: ClueSystem,
        catalog: ClueCatalog,
        cols: number,
        clueCount: number
    ): void {
        if (clueCount === 0) return;

        const touch = shouldShowTouchControls();
        const left = input.wasPressed("arrowleft") || input.wasPressed("a");
        const right = input.wasPressed("arrowright") || input.wasPressed("d");
        const up = input.wasPressed("arrowup") || input.wasPressed("w");
        const down = input.wasPressed("arrowdown") || input.wasPressed("s");
        const action =
            input.wasPressed("e") || input.wasPressed(" ") || input.wasPressed("enter");

        if (!touch && (left || right || up || down)) {
            const row = Math.floor(this.selectedIndex / cols);
            const col = this.selectedIndex % cols;
            let nextRow = row;
            let nextCol = col;

            if (left) nextCol = col - 1;
            if (right) nextCol = col + 1;
            if (up) nextRow = row - 1;
            if (down) nextRow = row + 1;

            if (nextCol >= 0 && nextCol < cols) {
                const nextIndex = nextRow * cols + nextCol;
                if (nextIndex >= 0 && nextIndex < clueCount) {
                    this.selectedIndex = nextIndex;
                }
            } else if (up && row > 0) {
                const nextIndex = (row - 1) * cols + col;
                if (nextIndex < clueCount) this.selectedIndex = nextIndex;
            } else if (down) {
                const nextIndex = (row + 1) * cols + col;
                if (nextIndex < clueCount) this.selectedIndex = nextIndex;
            }
        }

        if (!touch && action) {
            const clues = getInventoryClueIds(clueSystem.getAllClues(), catalog);
            const clueId = clues[this.selectedIndex];
            if (clueId) {
                this.detailClueId = this.detailClueId === clueId ? null : clueId;
            }
        }
    }

    handlePointer(
        x: number,
        y: number,
        clueSystem: ClueSystem,
        catalog: ClueCatalog,
        layout: InventoryLayout
    ): "slot" | "backdrop" | null {
        const clues = getInventoryClueIds(clueSystem.getAllClues(), catalog);

        for (let i = 0; i < layout.slots.length; i++) {
            const slot = layout.slots[i];
            const clueId = clues[i];
            if (!clueId) continue;

            if (x >= slot.x && x <= slot.x + slot.size && y >= slot.y && y <= slot.y + slot.size) {
                this.selectedIndex = i;
                this.detailClueId = this.detailClueId === clueId ? null : clueId;
                return "slot";
            }
        }

        const insidePanel =
            x >= layout.panelX &&
            x <= layout.panelX + layout.panelWidth &&
            y >= layout.panelY &&
            y <= layout.panelY + layout.panelHeight;

        if (!insidePanel) {
            return "backdrop";
        }

        return null;
    }

    render(
        ctx: CanvasRenderingContext2D,
        clueSystem: ClueSystem,
        catalog: ClueCatalog,
        _assignments: ClueAssignment[] | undefined,
        _furnitureById: Record<string, FurnitureConfig>,
        _npcs: Record<string, NPCConfig>
    ): void {
        const clues = getInventoryClueIds(clueSystem.getAllClues(), catalog);
        const layout = computeInventoryLayout(ctx.canvas.width, ctx.canvas.height, clues.length);
        const touch = shouldShowTouchControls();

        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        const { panelX, panelY, panelWidth, panelHeight } = layout;
        ctx.fillStyle = PANEL_FILL;
        ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        ctx.strokeStyle = PANEL_BORDER;
        ctx.lineWidth = 2;
        ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

        ctx.fillStyle = "#fff";
        ctx.font = "bold 24px serif";
        ctx.textAlign = "center";
        ctx.fillText("Inventory", ctx.canvas.width / 2, panelY + 40);

        if (clues.length === 0) {
            ctx.fillStyle = "#888";
            ctx.font = "18px serif";
            ctx.fillText("No clues found yet", ctx.canvas.width / 2, panelY + 120);
            this.drawFooterHint(ctx, panelY, panelHeight);
            ctx.textAlign = "left";
            return;
        }

        if (this.selectedIndex >= clues.length) {
            this.selectedIndex = clues.length - 1;
        }

        for (let i = 0; i < layout.slots.length; i++) {
            const slot = layout.slots[i];
            const clueId = clues[i];
            if (!clueId) continue;

            const selected = !touch && i === this.selectedIndex;
            const showingDetail = this.detailClueId === clueId;

            ctx.fillStyle = SLOT_FILL;
            ctx.fillRect(slot.x, slot.y, slot.size, slot.size);

            if (selected) {
                ctx.strokeStyle = SELECTED_BORDER;
                ctx.lineWidth = showingDetail ? 3 : 2;
                ctx.strokeRect(slot.x - 1, slot.y - 1, slot.size + 2, slot.size + 2);
            } else {
                ctx.strokeStyle = "#444";
                ctx.lineWidth = 1;
                ctx.strokeRect(slot.x, slot.y, slot.size, slot.size);
            }

            const spriteName = resolveClueIconSprite(clueId);
            const pad = Math.round(slot.size * 0.1);
            spriteLoader.drawSprite(
                ctx,
                spriteName,
                slot.x + pad,
                slot.y + pad,
                slot.size - pad * 2,
                slot.size - pad * 2
            );
        }

        if (this.detailClueId) {
            this.drawDetail(ctx, catalog, this.detailClueId, panelX, panelY, panelWidth, panelHeight);
        }

        this.drawFooterHint(ctx, panelY, panelHeight);
        ctx.textAlign = "left";
    }

    getLayoutForHitTest(
        ctx: CanvasRenderingContext2D,
        clueSystem: ClueSystem,
        catalog: ClueCatalog
    ): InventoryLayout {
        const clues = getInventoryClueIds(clueSystem.getAllClues(), catalog);
        return computeInventoryLayout(ctx.canvas.width, ctx.canvas.height, clues.length);
    }

    private drawDetail(
        ctx: CanvasRenderingContext2D,
        catalog: ClueCatalog,
        clueId: string,
        panelX: number,
        panelY: number,
        panelWidth: number,
        panelHeight: number
    ): void {
        const clue = getClueDisplay(catalog, clueId);
        const padding = 16;
        const boxX = panelX + padding;
        const boxY = panelY + panelHeight - 166;
        const boxWidth = panelWidth - padding * 2;
        const boxHeight = 136;

        ctx.fillStyle = DETAIL_BG;
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        ctx.strokeStyle = SELECTED_BORDER;
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        ctx.textAlign = "left";
        ctx.fillStyle = SELECTED_BORDER;
        ctx.font = "bold 16px serif";
        ctx.fillText(clue.name, boxX + 12, boxY + 24);

        ctx.fillStyle = "#ccc";
        ctx.font = "14px serif";
        const lines = wrapText(ctx, clue.description, boxWidth - 24).slice(0, 5);
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], boxX + 12, boxY + 48 + i * 18);
        }
    }

    private drawFooterHint(ctx: CanvasRenderingContext2D, panelY: number, panelHeight: number): void {
        ctx.fillStyle = "#888";
        ctx.font = "14px serif";
        ctx.textAlign = "center";
        const touch = shouldShowTouchControls();
        const hint = touch
            ? "Tap an item for details · Tap outside or Inventory to close"
            : "Arrow keys to select · E for details · I to close";
        ctx.fillText(hint, ctx.canvas.width / 2, panelY + panelHeight - 24);
    }
}
