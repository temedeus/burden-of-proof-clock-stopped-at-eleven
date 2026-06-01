import { TILE_SIZE } from "../world/constants";
import { Player } from "../entities/Player";
import { Room } from "../world/Room";
import type { ClueSystem } from "../systems/ClueSystem";

/**
 * Check if debug mode is enabled via URL params (?debug=true or ?debug=1)
 */
export function isDebugMode(): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("debug") === "true" || urlParams.get("debug") === "1";
}

function clueCollected(clueSystem: ClueSystem | undefined, clueIds: string[]): boolean {
    if (!clueSystem || clueIds.length === 0) return false;
    return clueIds.every((id) => clueSystem.hasClue(id));
}

/**
 * Render collision, interaction, and clue-placement debug overlay
 */
export function renderDebugOverlay(
    ctx: CanvasRenderingContext2D,
    player: Player,
    currentRoom: Room,
    clueSystem?: ClueSystem
): void {
    // Draw player collision box (red outline)
    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = 2;
    ctx.strokeRect(player.x, player.y, player.width, player.height);

    // Draw player tile boundaries
    const playerLeftTile = Math.floor(player.x / TILE_SIZE);
    const playerRightTile = Math.floor((player.x + player.width) / TILE_SIZE);
    const playerTopTile = Math.floor(player.y / TILE_SIZE);
    const playerBottomTile = Math.floor((player.y + player.height) / TILE_SIZE);

    ctx.strokeStyle = "#ff6666";
    ctx.lineWidth = 1;
    for (let ty = playerTopTile; ty < playerBottomTile; ty++) {
        for (let tx = playerLeftTile; tx < playerRightTile; tx++) {
            ctx.strokeRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }

    // Draw NPC collision boxes (blue outline)
    for (const npc of currentRoom.npcs) {
        ctx.strokeStyle = "#0000ff";
        ctx.lineWidth = 2;
        ctx.strokeRect(npc.x, npc.y, npc.width, npc.height);

        const npcLeftTile = Math.floor(npc.x / TILE_SIZE);
        const npcRightTile = Math.floor((npc.x + npc.width) / TILE_SIZE);
        const npcTopTile = Math.floor(npc.y / TILE_SIZE);
        const npcBottomTile = Math.floor((npc.y + npc.height) / TILE_SIZE);

        ctx.strokeStyle = "#6666ff";
        ctx.lineWidth = 1;
        for (let ty = npcTopTile; ty < npcBottomTile; ty++) {
            for (let tx = npcLeftTile; tx < npcRightTile; tx++) {
                ctx.strokeRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // Draw furniture collision areas (green outline)
    for (const obj of currentRoom.interactables) {
        const minX = Math.min(...obj.tiles.map((t) => t.x));
        const maxX = Math.max(...obj.tiles.map((t) => t.x));
        const minY = Math.min(...obj.tiles.map((t) => t.y));
        const maxY = Math.max(...obj.tiles.map((t) => t.y));

        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 2;
        ctx.strokeRect(
            minX * TILE_SIZE,
            minY * TILE_SIZE,
            (maxX - minX + 1) * TILE_SIZE,
            (maxY - minY + 1) * TILE_SIZE
        );

        ctx.strokeStyle = "#66ff66";
        ctx.lineWidth = 1;
        for (const tile of obj.tiles) {
            ctx.strokeRect(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }

    // Clue placements (amber = uncollected, gray = collected)
    for (const obj of currentRoom.interactables) {
        const clueIds = obj.clues ?? [];
        if (clueIds.length === 0 || obj.tiles.length === 0) continue;

        const collected = clueCollected(clueSystem, clueIds);
        ctx.fillStyle = collected ? "rgba(140, 140, 140, 0.45)" : "rgba(255, 200, 0, 0.45)";
        for (const tile of obj.tiles) {
            ctx.fillRect(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }

        ctx.strokeStyle = collected ? "#aaaaaa" : "#ffcc00";
        ctx.lineWidth = 2;
        if (collected) {
            ctx.setLineDash([4, 4]);
        }
        for (const tile of obj.tiles) {
            ctx.strokeRect(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
        ctx.setLineDash([]);

        const minX = Math.min(...obj.tiles.map((t) => t.x));
        const maxX = Math.max(...obj.tiles.map((t) => t.x));
        const minY = Math.min(...obj.tiles.map((t) => t.y));
        const maxY = Math.max(...obj.tiles.map((t) => t.y));
        const labelX = ((minX + maxX + 1) / 2) * TILE_SIZE;
        const labelY = minY * TILE_SIZE + 10;
        const label = clueIds.join(", ");

        ctx.font = "11px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.strokeText(label, labelX, labelY);
        ctx.fillStyle = collected ? "#dddddd" : "#fff8dc";
        ctx.fillText(label, labelX, labelY);
    }

    // Draw interaction target tile (yellow highlight)
    const interactionPoint = player.getInteractionPoint();
    const reach = TILE_SIZE * 0.6;
    let targetX = interactionPoint.x;
    let targetY = interactionPoint.y;

    switch (player.facing) {
        case "up":
            targetY -= reach;
            break;
        case "down":
            targetY += reach;
            break;
        case "left":
            targetX -= reach;
            break;
        case "right":
            targetX += reach;
            break;
    }

    const targetTileX = Math.floor(targetX / TILE_SIZE);
    const targetTileY = Math.floor(targetY / TILE_SIZE);

    ctx.fillStyle = "rgba(255, 255, 0, 0.3)";
    ctx.fillRect(targetTileX * TILE_SIZE, targetTileY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    ctx.strokeStyle = "#ffff00";
    ctx.lineWidth = 2;
    ctx.strokeRect(targetTileX * TILE_SIZE, targetTileY * TILE_SIZE, TILE_SIZE, TILE_SIZE);

    // Draw interaction point (orange circle)
    ctx.fillStyle = "#ff8800";
    ctx.beginPath();
    ctx.arc(interactionPoint.x, interactionPoint.y, 3, 0, Math.PI * 2);
    ctx.fill();

    // Draw reach line (orange)
    ctx.strokeStyle = "#ff8800";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(interactionPoint.x, interactionPoint.y);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();
    ctx.setLineDash([]);
}
