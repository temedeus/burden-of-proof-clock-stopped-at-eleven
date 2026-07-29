import { TILE_SIZE } from "../world/constants";
import { Player } from "../entities/Player";
import { Room } from "../world/Room";
import { getInteractionTiles, getInteractionTilesForFacing, tileBounds } from "../world/interactableTiles";
import type { ClueSystem } from "../systems/ClueSystem";

/**
 * Check if debug mode is enabled via URL params (?debug=true or ?debug=1)
 */
export function isDebugMode(): boolean {
    if (typeof window === "undefined") return false;
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

    // Player feet tile (magenta) — centered foot used for NPC collision; full feet row for walls/furniture
    const feetLeftTile = Math.floor(player.x / TILE_SIZE);
    const feetRightTile = Math.ceil((player.x + player.width) / TILE_SIZE);
    const feetBottomTile = Math.ceil((player.y + player.height) / TILE_SIZE);
    const feetRow = feetBottomTile - 1;
    const feetCenterTileX = Math.floor((player.x + player.width / 2) / TILE_SIZE);
    ctx.fillStyle = "rgba(255, 0, 255, 0.25)";
    ctx.fillRect(feetCenterTileX * TILE_SIZE, feetRow * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    ctx.strokeStyle = "#ff00ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(feetCenterTileX * TILE_SIZE, feetRow * TILE_SIZE, TILE_SIZE, TILE_SIZE);

    // Furniture uses full bottom row (faint magenta outline)
    ctx.strokeStyle = "rgba(255, 0, 255, 0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(feetLeftTile * TILE_SIZE, feetRow * TILE_SIZE, (feetRightTile - feetLeftTile) * TILE_SIZE, TILE_SIZE);

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

    // Collision tiles (green) — movement blocking only
    for (const obj of currentRoom.interactables) {
        if (obj.tiles.length === 0) continue;
        const bounds = tileBounds(obj.tiles);
        if (!bounds) continue;

        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 2;
        ctx.strokeRect(
            bounds.minX * TILE_SIZE,
            bounds.minY * TILE_SIZE,
            (bounds.maxX - bounds.minX + 1) * TILE_SIZE,
            (bounds.maxY - bounds.minY + 1) * TILE_SIZE
        );

        ctx.strokeStyle = "#66ff66";
        ctx.lineWidth = 1;
        for (const tile of obj.tiles) {
            ctx.strokeRect(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }

    // Interaction tiles (cyan) — examine / clue targeting
    for (const obj of currentRoom.interactables) {
        const activeFacingTiles = getInteractionTilesForFacing(obj, player.facing);
        const allInteractTiles = getInteractionTiles(obj);
        if (allInteractTiles.length === 0) continue;

        const activeKeys = new Set(activeFacingTiles.map((t) => `${t.x},${t.y}`));

        for (const tile of allInteractTiles) {
            const isActive = activeKeys.has(`${tile.x},${tile.y}`);
            ctx.fillStyle = isActive ? "rgba(0, 200, 255, 0.35)" : "rgba(0, 200, 255, 0.1)";
            ctx.fillRect(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = isActive ? "#00c8ff" : "#006688";
            ctx.lineWidth = isActive ? 2 : 1;
            ctx.strokeRect(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }

    // Clue placements on interaction area (amber = uncollected, gray = collected)
    for (const obj of currentRoom.interactables) {
        const clueIds = obj.clues ?? [];
        const interactTiles = getInteractionTiles(obj);
        if (clueIds.length === 0 || interactTiles.length === 0) continue;

        const collected = clueCollected(clueSystem, clueIds);
        ctx.fillStyle = collected ? "rgba(140, 140, 140, 0.45)" : "rgba(255, 200, 0, 0.45)";
        for (const tile of interactTiles) {
            ctx.fillRect(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }

        ctx.strokeStyle = collected ? "#aaaaaa" : "#ffcc00";
        ctx.lineWidth = 2;
        if (collected) {
            ctx.setLineDash([4, 4]);
        }
        for (const tile of interactTiles) {
            ctx.strokeRect(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
        ctx.setLineDash([]);

        const bounds = tileBounds(interactTiles);
        if (!bounds) continue;
        const labelX = ((bounds.minX + bounds.maxX + 1) / 2) * TILE_SIZE;
        const labelY = bounds.minY * TILE_SIZE + 10;
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

    // Legend
    const legendX = 8;
    const legendY = 8;
    const lines = [
        "Green = movement block",
        "Cyan = interact (bright = facing)",
        "Magenta = feet (NPC: center tile)",
        "Yellow = interact aim"
    ];
    ctx.font = "11px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fillRect(legendX - 4, legendY - 4, 200, lines.length * 14 + 8);
    for (let i = 0; i < lines.length; i++) {
        ctx.fillStyle = "#ffffff";
        ctx.fillText(lines[i], legendX, legendY + i * 14);
    }
}
