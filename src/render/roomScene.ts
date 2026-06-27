import { drawFireplaceAnimated } from "../assets/procedural/fireplace";
import { drawFountainAnimated } from "../assets/procedural/fountain";
import { drawOilLampAnimated, oilLampAnimPhase, oilLampDrawBounds } from "../assets/procedural/oil_lamp";
import { drawStableBoothAnimated, horseAnimPhase } from "../assets/procedural/animals";
import { spriteLoader } from "../assets/SpriteLoader";
import { TILE_SIZE } from "../world/constants";
import { tileBounds } from "../world/interactableTiles";
import type { Interactable } from "../world/Interactable";
import type { DoorExit, Room } from "../world/Room";
import { renderTileMap } from "./tileMapRender";

export type DepthActor = { y: number; height: number; render(ctx: CanvasRenderingContext2D): void };

export function furnitureActorFromInteractable(
    obj: Interactable,
    getAnimTime: () => number,
    roomSize?: { width: number; height: number }
): DepthActor {
    const footprint = obj.footprintTiles && obj.footprintTiles.length > 0 ? obj.footprintTiles : obj.tiles;
    const minX = Math.min(...footprint.map((t) => t.x));
    const maxX = Math.max(...footprint.map((t) => t.x));
    const minY = Math.min(...footprint.map((t) => t.y));
    const maxY = Math.max(...footprint.map((t) => t.y));

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
    const isFountain = spriteName === "fountain";
    const isOilLamp = spriteName === "oil_lamp";
    const isStableBooth = spriteName.startsWith("stable_booth");
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

    if (isOilLamp && roomSize && obj.wallSide) {
        const bounds = oilLampDrawBounds(minX, minY, obj.wallSide, roomSize.width, roomSize.height);
        drawX = bounds.drawX;
        drawY = bounds.drawY;
        drawW = bounds.drawW;
        drawH = bounds.drawH;
    }

    const sortY = hasDecorDraw || isFireplace || isFountain || isOilLamp || isStableBooth ? drawY : minY * TILE_SIZE;
    const sortH = hasDecorDraw || isFireplace || isFountain || isOilLamp || isStableBooth ? drawH : heightTiles * TILE_SIZE;

    return {
        y: sortY,
        height: sortH,
        render: (ctx: CanvasRenderingContext2D) => {
            if (spriteName === "fireplace") {
                drawFireplaceAnimated(ctx, drawX, drawY, drawW, drawH, getAnimTime());
            } else if (spriteName === "fountain") {
                drawFountainAnimated(ctx, drawX, drawY, drawW, drawH, getAnimTime());
            } else if (isOilLamp) {
                drawOilLampAnimated(
                    ctx,
                    drawX,
                    drawY,
                    drawW,
                    drawH,
                    getAnimTime(),
                    obj.wallSide ?? "north",
                    oilLampAnimPhase(minX, minY)
                );
            } else if (isStableBooth) {
                const phase = horseAnimPhase(minX, minY);
                drawStableBoothAnimated(
                    ctx,
                    drawX,
                    drawY,
                    drawW,
                    drawH,
                    getAnimTime(),
                    phase,
                    spriteName
                );
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

export function exitSkipsDoorSprite(room: Room, exit: DoorExit): boolean {
    if (exit.skipDoorSprite) return true;
    return exitHasStaircase(room, exit);
}

export function drawDoorSprites(ctx: CanvasRenderingContext2D, room: Room): void {
    for (const exit of room.exits) {
        if (exitSkipsDoorSprite(room, exit)) continue;

        const doorSprite = exit.doorSprite ?? "door";
        const isTopOrBottom = exit.y === 0 || exit.y === room.map.height - 1;
        if (isTopOrBottom) {
            spriteLoader.drawSprite(
                ctx,
                doorSprite,
                (exit.x - 1) * TILE_SIZE,
                exit.y * TILE_SIZE,
                TILE_SIZE * 3,
                TILE_SIZE
            );
        } else {
            spriteLoader.drawSprite(
                ctx,
                doorSprite,
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

/** Draw order: background → tiles → doors → rugs → furniture/NPCs (depth-sorted). See RenderLayer. */
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

    renderTileMap(ctx, room.map);
    drawDoorSprites(ctx, room);

    const rugActors: DepthActor[] = [];
    const furnitureActors: DepthActor[] = [];
    for (const obj of room.interactables) {
        const actor = furnitureActorFromInteractable(obj, getAnimTime, {
            width: room.map.width,
            height: room.map.height
        });
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
