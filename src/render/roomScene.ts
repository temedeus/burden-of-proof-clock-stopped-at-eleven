import { drawFireplaceAnimated } from "../assets/procedural/fireplace";
import { drawFountainAnimated } from "../assets/procedural/fountain";
import { drawBallroomClerestoryWindows } from "../assets/procedural/ballroom_windows";
import { drawOilLampAnimated, oilLampAnimPhase, oilLampDrawBounds } from "../assets/procedural/oil_lamp";
import { drawKitchenStoveAnimated, kitchenStoveAnimPhase } from "../assets/procedural/kitchen_stove";
import { drawStableBoothAnimated, horseAnimPhase } from "../assets/procedural/animals";
import { decorWallDrawBounds, wallMountDrawBounds } from "../assets/procedural/wall_align";
import { resolveDecorDrawRectPx } from "@cse/content-schema";
import { spriteLoader } from "../assets/SpriteLoader";
import { drawWineBarrelsAtAnchors } from "./wineBarrelDraw";
import { staircaseSpriteFor, type StairMaterial } from "../assets/procedural/staircase";
import { TILE_ATTIC_FLOOR, TILE_DOOR, TILE_PALE_ROCK, TILE_ROCK } from "../world/TileTypes";
import { drawNorthDoor, drawSideDoorway, drawSouthDoorway, SIDE_OPENING_HEIGHT, southOpeningWidth, type DoorStyle } from "../assets/procedural/doors";
import { TILE_SIZE } from "../world/constants";
import { exitSkipsDoorSprite } from "../world/exitDoor";
import type { Interactable } from "../world/Interactable";
import type { Room } from "../world/Room";
import { renderTileMap } from "./tileMapRender";

export type DepthActor = { y: number; height: number; render(ctx: CanvasRenderingContext2D): void };

export function furnitureActorFromInteractable(
    obj: Interactable,
    getAnimTime: () => number,
    roomSize?: { width: number; height: number; tileAt?: (x: number, y: number) => number }
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

    if (spriteName === "staircase") {
        // Stairs at the south edge lead down; elsewhere they climb into the north wall.
        // Material follows the floor on the room side of the stairs.
        const goesDown = obj.wallAlign === "south";
        const step = goesDown ? -1 : 1;
        const edgeY = goesDown ? minY : maxY;
        let material: StairMaterial = "manor";
        // Sample the floor in front of the stairs (skipping exit/door tiles)
        for (const dy of [step, step * 2]) {
            for (let x = minX; x <= maxX; x++) {
                const floor = roomSize?.tileAt?.(x, edgeY + dy);
                if (floor === TILE_ATTIC_FLOOR) material = "attic";
                else if (floor === TILE_ROCK || floor === TILE_PALE_ROCK) material = "stone";
            }
        }
        spriteName = staircaseSpriteFor(goesDown ? "down" : "up", material);
    }

    const isFireplace = spriteName === "fireplace";
    const isFountain = spriteName === "fountain";
    const isOilLamp = spriteName === "oil_lamp";
    const isKitchenStove = spriteName === "kitchen_stove";
    const isWallMount = Boolean(obj.wallSide) && !isOilLamp && !obj.walkableDecor;
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
        const decorRect = resolveDecorDrawRectPx(minX, minY, {
            width: widthTiles,
            height: heightTiles,
            drawWidth: decorW,
            drawHeight: decorH,
            renderAnchor: obj.renderAnchor,
            drawOffsetX: obj.drawOffsetXPx,
            drawOffsetY: obj.drawOffsetYPx
        }, TILE_SIZE);
        drawW = decorRect.drawW;
        drawH = decorRect.drawH;
        drawX = decorRect.drawX;
        drawY = decorRect.drawY;
    } else {
        drawW = widthTiles * TILE_SIZE;
        drawH = heightTiles * TILE_SIZE;
        drawX = minX * TILE_SIZE;
        drawY = minY * TILE_SIZE;
    }

    if (obj.wallAlign && roomSize && hasDecorDraw) {
        const snapped = decorWallDrawBounds(obj.wallAlign, minX, maxX, maxY, drawW, drawH, roomSize.height);
        drawX = snapped.drawX;
        drawY = snapped.drawY;
    }

    if (isOilLamp && roomSize && obj.wallSide) {
        const bounds = oilLampDrawBounds(minX, minY, obj.wallSide, roomSize.width, roomSize.height);
        drawX = bounds.drawX;
        drawY = bounds.drawY;
        drawW = bounds.drawW;
        drawH = bounds.drawH;
    } else if (isWallMount && roomSize && obj.wallSide) {
        const tileW = decorW ?? 1;
        const tileH = decorH ?? 1;
        const bounds = wallMountDrawBounds(
            minX,
            minY,
            obj.wallSide,
            roomSize.width,
            roomSize.height,
            tileW,
            tileH
        );
        drawX = bounds.drawX;
        drawY = bounds.drawY;
        drawW = bounds.drawW;
        drawH = bounds.drawH;
    }

    const sortY =
        hasDecorDraw || isFireplace || isFountain || isOilLamp || isKitchenStove || isWallMount || isStableBooth
            ? drawY
            : minY * TILE_SIZE;
    const sortH =
        hasDecorDraw || isFireplace || isFountain || isOilLamp || isKitchenStove || isWallMount || isStableBooth
            ? drawH
            : heightTiles * TILE_SIZE;

    return {
        y: sortY,
        height: sortH,
        render: (ctx: CanvasRenderingContext2D) => {
            if (spriteName === "fireplace") {
                drawFireplaceAnimated(ctx, drawX, drawY, drawW, drawH, getAnimTime());
            } else if (spriteName === "kitchen_stove") {
                drawKitchenStoveAnimated(
                    ctx,
                    drawX,
                    drawY,
                    drawW,
                    drawH,
                    getAnimTime(),
                    kitchenStoveAnimPhase(minX, minY)
                );
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
            } else if (obj.id === "secret_cellar_barrels") {
                const anchorXs: number[] = [];
                for (let x = minX; x <= maxX; x++) anchorXs.push(x);
                drawWineBarrelsAtAnchors(ctx, anchorXs, minY);
            } else {
                spriteLoader.drawSprite(ctx, spriteName, drawX, drawY, drawW, drawH);
            }
        }
    };
}

/**
 * Copy an already-drawn tile-space rectangle of the canvas (e.g. an intact wall
 * column) onto another rectangle. Works under the room's translate/scale.
 */
function copyRoomPixels(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    w: number,
    h: number,
    dx: number,
    dy: number
): void {
    const m = ctx.getTransform();
    const prev = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(ctx.canvas, m.a * sx + m.e, m.d * sy + m.f, w * m.a, h * m.d, dx, dy, w, h);
    ctx.imageSmoothingEnabled = prev;
}

function isCarved(room: Room, x: number, y: number): boolean {
    return room.map.getTile(x, y) === TILE_DOOR;
}

function drawDoorAt(ctx: CanvasRenderingContext2D, x: number, y: number, draw: () => void): void {
    ctx.save();
    ctx.translate(x, y);
    draw();
    ctx.restore();
}

/**
 * Doors sit in the room's own wall: the carved exit is first refilled with the
 * neighbouring wall, then a 1x door (north) or open doorway (south/sides) is drawn.
 */
export function drawDoorSprites(ctx: CanvasRenderingContext2D, room: Room): void {
    const T = TILE_SIZE;
    const W = room.map.width;
    const H = room.map.height;
    for (const exit of room.exits) {
        if (exitSkipsDoorSprite(exit, room.interactables, W, H)) continue;

        const style: DoorStyle = exit.doorSprite ?? "door";
        const isTopOrBottom = exit.y === 0 || exit.y === H - 1;
        if (isTopOrBottom) {
            const isNorth = exit.y !== H - 1;
            const depth = isNorth ? Math.max(1, room.northWallThickness) : 1;
            const x0 = (exit.x - 1) * T;
            const y0 = exit.y * T;
            // Refill the 3 carved columns with the nearest intact wall column
            const srcCol = [exit.x - 2, exit.x + 2, exit.x - 3, exit.x + 3].find(
                (cx) => cx > 0 && cx < W - 1 && !isCarved(room, cx, exit.y)
            );
            if (srcCol !== undefined) {
                for (let i = 0; i < 3; i++) copyRoomPixels(ctx, srcCol * T, y0, T, depth * T, x0 + i * T, y0);
            }
            if (isNorth) {
                drawDoorAt(ctx, x0, y0, () => drawNorthDoor(ctx, 3 * T, depth * T, style));
            } else {
                // Floor shows through the opening: copy the floor just inside the room
                const openW = southOpeningWidth(style);
                const ox = x0 + Math.round((3 * T - openW) / 2);
                copyRoomPixels(ctx, ox, (exit.y - 1) * T, openW, T, ox, y0);
                drawDoorAt(ctx, x0, y0, () => drawSouthDoorway(ctx, 3 * T, T, style));
            }
        } else {
            const side = exit.x === 0 ? "west" : "east";
            const x0 = exit.x * T;
            const y0 = (exit.y - 1) * T;
            const srcRow = [exit.y - 2, exit.y + 2, exit.y - 3, exit.y + 3].find(
                (ry) => ry > room.northWallThickness && ry < H - 1 && !isCarved(room, exit.x, ry)
            );
            if (srcRow !== undefined) {
                for (let i = 0; i < 3; i++) copyRoomPixels(ctx, x0, srcRow * T, T, T, x0, y0 + i * T);
            }
            // Floor in the opening, copied from the tile just inside the room
            const insideX = side === "west" ? exit.x + 1 : exit.x - 1;
            const oy = y0 + Math.round((3 * T - SIDE_OPENING_HEIGHT) / 2);
            copyRoomPixels(ctx, insideX * T, oy, T, SIDE_OPENING_HEIGHT, x0, oy);
            drawDoorAt(ctx, x0, y0, () => drawSideDoorway(ctx, T, 3 * T, side, style));
        }
    }
}

export interface RenderRoomSceneOptions {
    getAnimTime?: () => number;
    extraActors?: DepthActor[];
    /** Drawn after overhead decor (roof beams, cobwebs), above the player. */
    extraOverheadActors?: DepthActor[];
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
    if (room.northClerestoryRows > 0) {
        drawBallroomClerestoryWindows(ctx, room.map.width, room.northClerestoryRows);
    }
    drawDoorSprites(ctx, room);

    const rugActors: DepthActor[] = [];
    const furnitureActors: DepthActor[] = [];
    const overheadActors: DepthActor[] = [];
    for (const obj of room.interactables) {
        if (obj.footstepOnlyDecor) continue;
        const actor = furnitureActorFromInteractable(obj, getAnimTime, {
            width: room.map.width,
            height: room.map.height,
            tileAt: (x, y) => room.map.getTile(x, y)
        });
        if (obj.overheadDecor) {
            overheadActors.push(actor);
        } else if (obj.walkableDecor) {
            rugActors.push(actor);
        } else {
            furnitureActors.push(actor);
        }
    }

    rugActors
        .slice()
        .sort((a, b) => a.y + a.height - (b.y + b.height))
        .forEach((a) => a.render(ctx));

    const floorNpcActors: DepthActor[] = [];
    const standingNpcActors: DepthActor[] = [];
    for (const npc of room.npcs) {
        if (npc.walkable) {
            floorNpcActors.push(npc);
        } else {
            standingNpcActors.push(npc);
        }
    }

    floorNpcActors
        .slice()
        .sort((a, b) => a.y + a.height - (b.y + b.height))
        .forEach((a) => a.render(ctx));

    const actors: DepthActor[] = [
        ...furnitureActors,
        ...standingNpcActors,
        ...(options.extraActors ?? [])
    ];

    actors
        .slice()
        .sort((a, b) => a.y + a.height - (b.y + b.height))
        .forEach((a) => a.render(ctx));

    overheadActors
        .slice()
        .sort((a, b) => a.y + a.height - (b.y + b.height))
        .forEach((a) => a.render(ctx));

    const overheadExtras = options.extraOverheadActors ?? [];
    overheadExtras
        .slice()
        .sort((a, b) => a.y + a.height - (b.y + b.height))
        .forEach((a) => a.render(ctx));
}
