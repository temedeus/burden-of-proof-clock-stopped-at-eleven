import { ClueSystem } from "../systems/ClueSystem";
import { buildClueCatalog, getClueDisplay, type ClueCatalog } from "../content/clueCatalog";

/**
 * Render the inventory panel showing collected clues
 */
export function renderInventoryPanel(
    ctx: CanvasRenderingContext2D,
    clueSystem: ClueSystem,
    catalog: ClueCatalog = buildClueCatalog()
): void {
    const clues = clueSystem.getAllClues();

    // Dark overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Inventory panel
    const panelWidth = 500;
    const panelHeight = 400;
    const panelX = (ctx.canvas.width - panelWidth) / 2;
    const panelY = (ctx.canvas.height - panelHeight) / 2;

    // Panel background
    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);

    // Border
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

    // Title
    ctx.fillStyle = "#fff";
    ctx.font = "bold 24px serif";
    ctx.textAlign = "center";
    ctx.fillText("Inventory", ctx.canvas.width / 2, panelY + 40);

    // Clues list
    ctx.font = "18px serif";
    ctx.textAlign = "left";

    if (clues.length === 0) {
        ctx.fillStyle = "#888";
        ctx.textAlign = "center";
        ctx.fillText("No clues found yet", ctx.canvas.width / 2, panelY + 120);
    } else {
        let yOffset = panelY + 80;
        clues.forEach((clueId, index) => {
            const clue = getClueDisplay(catalog, clueId);
            ctx.fillStyle = "#ffd700";
            ctx.font = "bold 18px serif";
            ctx.fillText(`${index + 1}. ${clue.name}`, panelX + 30, yOffset);

            ctx.fillStyle = "#ccc";
            ctx.font = "14px serif";
            ctx.fillText(clue.description, panelX + 30, yOffset + 25);

            yOffset += 60;
        });
    }

    // Instructions
    ctx.fillStyle = "#888";
    ctx.font = "14px serif";
    ctx.textAlign = "center";
    ctx.fillText("Press I to close", ctx.canvas.width / 2, panelY + panelHeight - 30);
}
