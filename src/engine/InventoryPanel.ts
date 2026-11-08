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

const PANEL_FILL = "#26211d";
const PANEL_INNER = "#1c1815";
const PANEL_BORDER = "#8a7a5a";
const PANEL_BORDER_DARK = "#0e0b09";
const SELECTED_BORDER = "#ffd700";
const SLOT_FILL = "#2f2822";
const SLOT_FILL_SELECTED = "#473a28";
const SLOT_BORDER = "#5a4c3a";
const DETAIL_BG = "#15110e";
const LEAD_TEXT = "#c9b98a";
const BODY_FONT = '"IM Fell English", "Libre Baskerville", serif';
const TITLE_FONT = '"IM Fell English SC", "IM Fell English", "Libre Baskerville", serif';

const HEADER_HEIGHT = 100;
const FOOTER_HEIGHT = 36;
const SIDE_PAD = 24;

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
    /** Region reserved for the selected clue's name and description. */
    detail: { x: number; y: number; width: number; height: number };
}

export function computeInventoryLayout(
    canvasWidth: number,
    canvasHeight: number,
    clueCount: number
): InventoryLayout {
    const panelWidth = Math.min(640, Math.round(canvasWidth * 0.94));
    const panelHeight = Math.min(540, Math.round(canvasHeight * 0.94));
    const panelX = Math.round((canvasWidth - panelWidth) / 2);
    const panelY = Math.round((canvasHeight - panelHeight) / 2);
    const innerWidth = panelWidth - SIDE_PAD * 2;
    const gridTop = panelY + HEADER_HEIGHT;
    const bottomLimit = panelY + panelHeight - FOOTER_HEIGHT;
    const minDetailHeight = 150;

    const empty = {
        panelX,
        panelY,
        panelWidth,
        panelHeight,
        slots: [] as InventorySlot[],
        cols: 0,
        detail: { x: panelX + SIDE_PAD, y: gridTop, width: innerWidth, height: bottomLimit - gridTop }
    };
    if (clueCount <= 0) return empty;

    // Pick the largest icon size whose grid still leaves room for the detail pane.
    let iconSize = 60;
    let cols = 1;
    let rows = 1;
    let gap = 10;
    for (; iconSize >= 36; iconSize -= 4) {
        gap = Math.round(iconSize * 0.17);
        cols = Math.max(1, Math.min(clueCount, Math.floor((innerWidth + gap) / (iconSize + gap))));
        rows = Math.ceil(clueCount / cols);
        const gridHeight = rows * iconSize + (rows - 1) * gap;
        if (gridTop + gridHeight + 14 + minDetailHeight <= bottomLimit) break;
    }
    const gridWidth = cols * iconSize + (cols - 1) * gap;
    const gridHeight = rows * iconSize + (rows - 1) * gap;
    const gridX = panelX + (panelWidth - gridWidth) / 2;

    const slots: InventorySlot[] = [];
    for (let i = 0; i < clueCount; i++) {
        slots.push({
            clueId: "",
            x: gridX + (i % cols) * (iconSize + gap),
            y: gridTop + Math.floor(i / cols) * (iconSize + gap),
            size: iconSize
        });
    }

    const detailY = gridTop + gridHeight + 16;
    return {
        panelX,
        panelY,
        panelWidth,
        panelHeight,
        slots,
        cols,
        detail: { x: panelX + SIDE_PAD, y: detailY, width: innerWidth, height: bottomLimit - detailY }
    };
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

    reset(): void {
        this.selectedIndex = 0;
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
        /** "Current lead" lines shown under the title (see `investigationLeads.ts`). */
        leads: readonly string[] = []
    ): void {
        const clues = getInventoryClueIds(clueSystem.getAllClues(), catalog);
        const layout = computeInventoryLayout(ctx.canvas.width, ctx.canvas.height, clues.length);
        const { panelX, panelY, panelWidth, panelHeight } = layout;
        const cx = panelX + panelWidth / 2;

        ctx.fillStyle = "rgba(0, 0, 0, 0.82)";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Panel: dark frame, bevelled border, inner field
        ctx.fillStyle = PANEL_BORDER_DARK;
        ctx.fillRect(panelX - 2, panelY - 2, panelWidth + 4, panelHeight + 4);
        ctx.fillStyle = PANEL_BORDER;
        ctx.fillRect(panelX - 1, panelY - 1, panelWidth + 2, panelHeight + 2);
        ctx.fillStyle = PANEL_FILL;
        ctx.fillRect(panelX + 2, panelY + 2, panelWidth - 4, panelHeight - 4);
        ctx.strokeStyle = PANEL_BORDER_DARK;
        ctx.lineWidth = 1;
        ctx.strokeRect(panelX + 6.5, panelY + 6.5, panelWidth - 13, panelHeight - 13);

        // Title
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.font = `bold 26px ${TITLE_FONT}`;
        ctx.fillStyle = "#000";
        ctx.fillText("Inventory", cx + 1, panelY + 41);
        ctx.fillStyle = "#f3ead2";
        ctx.fillText("Inventory", cx, panelY + 40);
        if (clues.length > 0) {
            ctx.font = `13px ${BODY_FONT}`;
            ctx.fillStyle = "#8a7d66";
            ctx.textAlign = "right";
            ctx.fillText(`${clues.length} ${clues.length === 1 ? "clue" : "clues"}`, panelX + panelWidth - SIDE_PAD, panelY + 38);
        }
        // Divider
        ctx.fillStyle = PANEL_BORDER;
        ctx.fillRect(panelX + SIDE_PAD, panelY + 52, panelWidth - SIDE_PAD * 2, 1);

        this.drawLeads(ctx, leads, panelX + SIDE_PAD, panelY + 58, panelWidth - SIDE_PAD * 2);

        if (clues.length === 0) {
            ctx.fillStyle = "#9a8d76";
            ctx.font = `italic 18px ${BODY_FONT}`;
            ctx.textAlign = "center";
            ctx.fillText("No clues found yet", cx, panelY + panelHeight / 2);
            this.drawFooterHint(ctx, cx, panelX + panelWidth - SIDE_PAD * 2, panelY + panelHeight);
            ctx.textAlign = "left";
            return;
        }

        if (this.selectedIndex >= clues.length) this.selectedIndex = clues.length - 1;

        for (let i = 0; i < layout.slots.length; i++) {
            const clueId = clues[i];
            if (!clueId) continue;
            this.drawSlot(ctx, layout.slots[i], clueId, i === this.selectedIndex);
        }

        this.drawDetail(ctx, catalog, clues[this.selectedIndex], layout.detail);
        this.drawFooterHint(ctx, cx, panelX + panelWidth - SIDE_PAD * 2, panelY + panelHeight);
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

    private drawSlot(
        ctx: CanvasRenderingContext2D,
        slot: InventorySlot,
        clueId: string,
        selected: boolean
    ): void {
        const { x, y, size } = slot;
        ctx.fillStyle = "#0e0b09";
        ctx.fillRect(x - 1, y - 1, size + 2, size + 2);
        ctx.fillStyle = selected ? SLOT_FILL_SELECTED : SLOT_FILL;
        ctx.fillRect(x, y, size, size);
        // inset bevel
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(x, y, size, 2);
        ctx.fillRect(x, y, 2, size);
        ctx.fillStyle = "rgba(255,240,200,0.08)";
        ctx.fillRect(x, y + size - 2, size, 2);
        ctx.fillRect(x + size - 2, y, 2, size);

        const pad = Math.round(size * 0.08);
        spriteLoader.drawSprite(ctx, resolveClueIconSprite(clueId), x + pad, y + pad, size - pad * 2, size - pad * 2);

        if (selected) {
            ctx.strokeStyle = SELECTED_BORDER;
            ctx.lineWidth = 2;
            ctx.strokeRect(x - 2, y - 2, size + 4, size + 4);
        } else {
            ctx.strokeStyle = SLOT_BORDER;
            ctx.lineWidth = 1;
            ctx.strokeRect(x - 0.5, y - 0.5, size + 1, size + 1);
        }
    }

    private drawDetail(
        ctx: CanvasRenderingContext2D,
        catalog: ClueCatalog,
        clueId: string | undefined,
        area: { x: number; y: number; width: number; height: number }
    ): void {
        if (!clueId) return;
        const clue = getClueDisplay(catalog, clueId);
        const { x, y, width, height } = area;

        ctx.fillStyle = DETAIL_BG;
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = SELECTED_BORDER;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);

        const pad = 14;
        const iconSize = 40;
        const textX = x + pad + iconSize + 12;
        const textWidth = width - pad * 2 - iconSize - 12;
        const innerHeight = height - pad * 2;

        spriteLoader.drawSprite(ctx, resolveClueIconSprite(clueId), x + pad, y + pad, iconSize, iconSize);

        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";

        // Shrink the type until name + description fit completely.
        let nameSize = 20;
        let bodySize = 16;
        let nameLines: string[] = [];
        let bodyLines: string[] = [];
        let nameLine = 0;
        let bodyLine = 0;
        for (;;) {
            ctx.font = `bold ${nameSize}px ${TITLE_FONT}`;
            nameLines = wrapText(ctx, clue.name, textWidth);
            ctx.font = `${bodySize}px ${BODY_FONT}`;
            bodyLines = wrapText(ctx, clue.description, textWidth);
            nameLine = nameSize + 4;
            bodyLine = bodySize + 5;
            const total = nameLines.length * nameLine + 8 + bodyLines.length * bodyLine;
            if (total <= innerHeight || bodySize <= 10) break;
            bodySize -= 1;
            nameSize = Math.max(14, Math.min(nameSize, bodySize + 4));
        }

        let cy = y + pad + nameSize;
        ctx.font = `bold ${nameSize}px ${TITLE_FONT}`;
        ctx.fillStyle = SELECTED_BORDER;
        for (const line of nameLines) {
            ctx.fillText(line, textX, cy);
            cy += nameLine;
        }
        cy += 4;
        ctx.font = `${bodySize}px ${BODY_FONT}`;
        ctx.fillStyle = "#ddd3bd";
        for (const line of bodyLines) {
            ctx.fillText(line, textX, cy);
            cy += bodyLine;
        }
    }

    private drawLeads(
        ctx: CanvasRenderingContext2D,
        leads: readonly string[],
        x: number,
        y: number,
        maxWidth: number
    ): void {
        if (leads.length === 0) return;
        const label = leads.length > 1 ? "Current leads" : "Current lead";
        const text = `${label}: ${leads.join(" · ")}`;
        ctx.fillStyle = LEAD_TEXT;
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        // Wrap (never drop a lead); shrink until it fits the 2-line header slot.
        let size = 14;
        let lines: string[] = [];
        for (;;) {
            ctx.font = `italic ${size}px ${BODY_FONT}`;
            lines = wrapText(ctx, text, maxWidth);
            if (lines.length <= 2 || size <= 10) break;
            size -= 1;
        }
        const lineH = size + 4;
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], x, y + 14 + i * lineH);
        }
    }

    private drawFooterHint(
        ctx: CanvasRenderingContext2D,
        cx: number,
        maxWidth: number,
        panelBottom: number
    ): void {
        const touch = shouldShowTouchControls();
        const hint = touch
            ? "Tap an item to inspect · Tap outside to close"
            : "Arrow keys to select · I to close";
        let size = 14;
        ctx.textAlign = "center";
        ctx.fillStyle = "#8a7d66";
        for (; size > 9; size--) {
            ctx.font = `${size}px ${BODY_FONT}`;
            if (ctx.measureText(hint).width <= maxWidth) break;
        }
        ctx.fillText(hint, cx, panelBottom - 16);
    }
}
