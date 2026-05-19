import { buildClueCatalog, getClueDisplay, type ClueCatalog } from "../content/clueCatalog";

/**
 * Render the clue found notification overlay
 */
export function renderClueNotification(
    ctx: CanvasRenderingContext2D,
    clueId: string,
    catalog: ClueCatalog = buildClueCatalog()
): void {
    const clueName = getClueDisplay(catalog, clueId).name;

    const notifWidth = 300;
    const notifHeight = 80;
    const notifX = (ctx.canvas.width - notifWidth) / 2;
    const notifY = 50;

    // Background
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(notifX, notifY, notifWidth, notifHeight);

    // Border
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 2;
    ctx.strokeRect(notifX, notifY, notifWidth, notifHeight);

    // Text
    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 16px serif";
    ctx.textAlign = "center";
    ctx.fillText("Clue Found!", ctx.canvas.width / 2, notifY + 30);

    ctx.fillStyle = "#fff";
    ctx.font = "14px serif";
    ctx.fillText(clueName, ctx.canvas.width / 2, notifY + 55);

    ctx.textAlign = "left";
}
