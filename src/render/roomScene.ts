import { drawFireplaceAnimated } from "../assets/procedural/fireplace";
import { drawFountainAnimated } from "../assets/procedural/fountain";
import { spriteLoader } from "../assets/SpriteLoader";
import { NPC } from "../entities/NPC";
import { TILE_SIZE } from "../world/constants";
import { tileBounds } from "../world/interactableTiles";
import type { Interactable } from "../world/Interactable";
import type { DoorExit, Room } from "../world/Room";
import type { NPCConfig, RoomConfig } from "@cse/content-schema";

export type DepthActor = { y: number; height: number; render(ctx: CanvasRenderingContext2D): void };

export function resolveNpcPlacementTile(
    value: number | "center" | "top" | "bottom",
    dimension: "width" | "height",
    grid: { width: number; height: number }
): number {
    if (typeof value === "number") return value;
    if (value === "center") return Math.floor((dimension === "width" ? grid.width : grid.height) / 2);
    if (value === "top") return 1;
    return (dimension === "width" ? grid.width : grid.height) - 2;
}

export function spawnRoomNpcs(
    room: Room,
    config: RoomConfig,
    npcConfigs: Record<string, NPCConfig>
): void {
    room.npcs.length = 0;
    const grid = { width: room.map.width, height: room.map.height };
    for (const placement of config.npcs ?? []) {
        const npcConfig = npcConfigs[placement.npcId];
        if (!npcConfig) continue;
        const npcX = resolveNpcPlacementTile(placement.x, "width", grid) * TILE_SIZE;
        const npcY = resolveNpcPlacementTile(placement.y, "height", grid) * TILE_SIZE;
        room.npcs.push(
            new NPC(npcConfig.id, npcX, npcY, npcConfig.name, npcConfig.role, npcConfig.spriteName)
        );
    }
}

export function furnitureActorFromInteractable(
    obj: Interactable,
    getAnimTime: () => number
): DepthActor {
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
    } else if (obj.id === "secret_bookshelf" || obj.spriteName === "secret_bookshelf") {
        spriteName = "secret_bookshelf";
    } else if (obj.id === "table") {
        spriteName = "table";
    }

    const isFireplace = spriteName === "fireplace";
    const isFountain = spriteName === "fountain";
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

    const sortY = hasDecorDraw || isFireplace || isFountain ? drawY : minY * TILE_SIZE;
    const sortH = hasDecorDraw || isFireplace || isFountain ? drawH : heightTiles * TILE_SIZE;

    return {
        y: sortY,
        height: sortH,
        render: (ctx: CanvasRenderingContext2D) => {
            if (spriteName === "fireplace") {
                drawFireplaceAnimated(ctx, drawX, drawY, drawW, drawH, getAnimTime());
            } else if (spriteName === "fountain") {
                drawFountainAnimated(ctx, drawX, drawY, drawW, drawH, getAnimTime());
            } else {
                spriteLoader.drawSprite(ctx, spriteName, drawX, drawY, drawW, drawH);
            }
        }
    };
}

export function exitHasStaircase(room: Room, exit: DoorExit): boolean {
    const w = room.map.width;
    const h = room.map.height;
    const isTopOrBottom = exit.y === 0 || exit.y === h - 1;

    for (const obj of room.interactables) {
        if (obj.spriteName !== "staircase") continue;
        const bounds = tileBounds(obj.tiles);
        if (!bounds) continue;

        if (isTopOrBottom) {
            const onWall =
                (exit.y === 0 && bounds.minY <= 2) || (exit.y === h - 1 && bounds.maxY >= h - 2);
            if (!onWall) continue;
            const doorLeft = exit.x - 1;
            const doorRight = exit.x + 1;
            if (bounds.maxX >= doorLeft && bounds.minX <= doorRight) return true;
        } else {
            const onWall =
                (exit.x === 0 && bounds.minX <= 2) || (exit.x === w - 1 && bounds.maxX >= w - 2);
            if (!onWall) continue;
            const doorTop = exit.y - 1;
            const doorBottom = exit.y + 1;
            if (bounds.maxY >= doorTop && bounds.minY <= doorBottom) return true;
        }
    }
    return false;
}

const HIDDEN_PASSAGE_PAIRS = new Set([
    "study:hidden_room",
    "hidden_room:study",
    "hidden_room:secret_tunnel",
    "secret_tunnel:hidden_room"
]);

export function exitSkipsDoorSprite(room: Room, exit: DoorExit): boolean {
    if (exitHasStaircase(room, exit)) return true;
    return HIDDEN_PASSAGE_PAIRS.has(`${room.id}:${exit.targetRoom}`);
}

export function drawDoorSprites(ctx: CanvasRenderingContext2D, room: Room): void {
    for (const exit of room.exits) {
        if (exitSkipsDoorSprite(room, exit)) continue;

        const isTopOrBottom = exit.y === 0 || exit.y === room.map.height - 1;
        if (isTopOrBottom) {
            spriteLoader.drawSprite(
                ctx,
                "door",
                (exit.x - 1) * TILE_SIZE,
                exit.y * TILE_SIZE,
                TILE_SIZE * 3,
                TILE_SIZE
            );
        } else {
            spriteLoader.drawSprite(
                ctx,
                "door",
                exit.x * TILE_SIZE - 1,
                (exit.y - 1) * TILE_SIZE - 1,
                TILE_SIZE + 2,
                TILE_SIZE * 3 + 2
            );
        }
    }
}

export interface RenderRoomSceneOptions {
    getAnimTime?: () => number;
    extraActors?: DepthActor[];
    clearColor?: string;
    /** When the canvas is translated (e.g. centered small room), skip fill — caller clears screen space first. */
    skipClear?: boolean;
}

export function renderRoomScene(
    ctx: CanvasRenderingContext2D,
    room: Room,
    options: RenderRoomSceneOptions = {}
): void {
    const getAnimTime = options.getAnimTime ?? (() => 0);
    const clearColor = options.clearColor ?? "#222";

    if (!options.skipClear) {
        ctx.fillStyle = clearColor;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    room.map.render(ctx);
    drawDoorSprites(ctx, room);

    const rugActors: DepthActor[] = [];
    const furnitureActors: DepthActor[] = [];
    for (const obj of room.interactables) {
        const actor = furnitureActorFromInteractable(obj, getAnimTime);
        if (obj.walkableDecor) {
            rugActors.push(actor);
        } else {
            furnitureActors.push(actor);
        }
    }

    rugActors
        .slice()
        .sort((a, b) => a.y + a.height - (b.y + b.height))
        .forEach((a) => a.render(ctx));

    const actors: DepthActor[] = [
        ...furnitureActors,
        ...room.npcs,
        ...(options.extraActors ?? [])
    ];

    actors
        .slice()
        .sort((a, b) => a.y + a.height - (b.y + b.height))
        .forEach((a) => a.render(ctx));
}
