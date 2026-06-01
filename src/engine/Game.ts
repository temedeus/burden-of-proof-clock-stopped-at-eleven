import { Room } from "../world/Room";
import { Interactable } from "../world/Interactable";
import { createRoomFromConfig } from "../world/Rooms";
import {Input} from "./Input";
import { Player, PlayerSpriteName } from "../entities/Player";
import {NPC} from "../entities/NPC";
import {TILE_SIZE} from "../world/constants";
import { InteractionSystem } from "../systems/InteractionSystem";
import { ClueSystem } from "../systems/ClueSystem";
import { spriteLoader } from "../assets/SpriteLoader";
import { isDebugMode, renderDebugOverlay } from "./DebugOverlay";
import { renderInventoryPanel } from "./InventoryPanel";
import { renderClueNotification } from "./ClueNotification";
import { loadGameContent } from "../content/loadGameContent";
import { applyStoryToRooms, getMurdererNpcId, getRequiredClueIds } from "../content/applyStoryToGame";
import { buildClueCatalog, type ClueCatalog } from "../content/clueCatalog";
import { applyStoryDialogOverrides, resolveActiveStory, type ActiveStory } from "../content/loadStoryContent";
import type { NPCConfig, NPCDialogConfig, RoomConfig } from "@cse/content-schema";

type GameState = "playing" | "interacting" | "inventory" | "victory";

type DepthActor = { y: number; height: number; render(ctx: CanvasRenderingContext2D): void };

function furnitureActorFromInteractable(obj: Interactable): DepthActor {
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

    return {
        y: sortY,
        height: sortH,
        render: (ctx: CanvasRenderingContext2D) => {
            spriteLoader.drawSprite(ctx, spriteName, drawX, drawY, drawW, drawH);
        }
    };
}

const POLICE_NPC_IDS = ["police", "police2"];

export type Difficulty = "easy" | "medium" | "hard";

const DIFFICULTY_CONFIG: Record<
    Difficulty,
    { chaseHeadStart: number; murdererChaseSpeed: number; murdererSpawnsIn: number }
> = {
    easy: { chaseHeadStart: 2.5, murdererChaseSpeed: 80, murdererSpawnsIn: 2 },
    medium: { chaseHeadStart: 1.5, murdererChaseSpeed: 100, murdererSpawnsIn: 1.5 },
    hard: { chaseHeadStart: 0.5, murdererChaseSpeed: 120, murdererSpawnsIn: 1 }
};

const ROOM_DISPLAY_TITLES: Record<string, string> = {
    library: "Library",
    hall: "Hall",
    study: "Study",
    kitchen: "Kitchen",
    garden: "Garden",
    courtyard: "Courtyard",
    dining: "Dining Room"
};

const ROOM_TITLE_DURATION = 2;

export class Game {
    private input: Input;
    private rooms: Record<string, Room>;
    private currentRoom: Room;
    private npcDialogs: Record<string, NPCDialogConfig> = {};
    private activeStory: ActiveStory | null = null;
    private clueCatalog: ClueCatalog = buildClueCatalog();

    private player: Player;

    private clueSystem = new ClueSystem();
    private interaction = new InteractionSystem(this.clueSystem);
    private state: GameState = "playing";
    private message: string | null = null;
    private clueNotification: { clueId: string } | null = null;
    private debugMode: boolean = false;
    private roomTransitionCooldown = 0;
    private redBlinkRemaining = 0;
    private accusedMurderer = false; // set when you accuse cook; murderer chases until you're caught or you talk to police
    private chaseStartsIn = 0; // seconds until murderer starts chasing (head start after accusation)
    private murdererSpawnsIn = 0; // after room change: 1.5s before murderer appears in new room
    private murdererSpawnX = 0;
    private murdererSpawnY = 0;
    private difficulty: Difficulty = "medium";
    private victoryPhase = false;
    private victoryTimer = 5; // seconds in victory (fade + text); when <= 0 show "press to return"
    private victoryRoom: Room | null = null; // room where chase happens
    private victoryPoliceId: string | null = null;
    /** Door position (pixel center) the murderer runs toward */
    private victoryDoorTarget: { x: number; y: number } | null = null;
    private onMenuRequest?: () => void;
    private onGameOver?: () => void;
    private onVictoryComplete?: () => void;
    private readonly content = loadGameContent();

    /** Centered room name; fades in and out over `ROOM_TITLE_DURATION` seconds */
    private roomTitleBanner: { title: string; elapsed: number } | null = null;

    constructor(
        private ctx: CanvasRenderingContext2D,
        options?: { difficulty?: Difficulty; onMenuRequest?: () => void; onGameOver?: () => void; onVictoryComplete?: () => void; input?: Input; playerSprite?: PlayerSpriteName }
    ) {
        this.difficulty = options?.difficulty ?? "medium";
        this.onMenuRequest = options?.onMenuRequest;
        this.onGameOver = options?.onGameOver;
        this.onVictoryComplete = options?.onVictoryComplete;
        this.input = options?.input ?? new Input();
        this.player = new Player("player", 64, 64, options?.playerSprite ?? "female_detective");
        this.debugMode = isDebugMode();
        if (this.debugMode) {
            console.log(
                "🐛 Debug mode: red=player, blue=NPC, green=furniture, amber=clue (gray when collected), yellow=interact target"
            );
        }

        const w = Math.floor(ctx.canvas.width / TILE_SIZE);
        const h = Math.floor(ctx.canvas.height / TILE_SIZE);

        this.rooms = Object.fromEntries(
            Object.entries(this.content.rooms).map(([id, config]) => [
                id,
                createRoomFromConfig(config, w, h)
            ])
        );

        const resolved = resolveActiveStory();
        if (resolved) {
            this.activeStory = resolved;
            this.clueCatalog = buildClueCatalog(this.activeStory.casePacket.generatedClues);
            applyStoryToRooms(this.rooms, this.activeStory.casePacket);
            if (this.debugMode) {
                console.log(`Active story: ${this.activeStory.id} — ${this.activeStory.title}`);
                console.log(`Culprit: ${this.getMurdererNpcId()}, clues: ${this.getRequiredClueIds().join(", ")}`);
            }
        } else if (this.debugMode) {
            console.log("No generated story loaded; using default NPC dialog and clues.");
        }

        this.loadNPCs();

        spriteLoader.load().catch(err => {
            console.error('Failed to load spritesheet:', err);
        });

        this.currentRoom = this.rooms.library;
        if (this.activeStory) {
            this.showTitleBanner(this.activeStory.title);
        } else {
            this.startRoomTitleBanner("library");
        }
    }

    getActiveStoryId(): string | null {
        return this.activeStory?.id ?? null;
    }

    getActiveStoryTitle(): string | null {
        return this.activeStory?.title ?? null;
    }

    private getMurdererNpcId(): string {
        return getMurdererNpcId(this.activeStory?.casePacket ?? null);
    }

    private getRequiredClueIds(): string[] {
        return getRequiredClueIds(this.activeStory?.casePacket ?? null);
    }

    private getRoomDisplayTitle(roomId: string): string {
        return ROOM_DISPLAY_TITLES[roomId] ?? roomId.charAt(0).toUpperCase() + roomId.slice(1);
    }

    private startRoomTitleBanner(roomId: string): void {
        this.showTitleBanner(this.getRoomDisplayTitle(roomId));
    }

    private showTitleBanner(title: string): void {
        this.roomTitleBanner = { title, elapsed: 0 };
    }

    private loadNPCs() {
        const npcConfigs: Record<string, NPCConfig> = this.content.npcs;

        const baseDialogs = Object.fromEntries(
            Object.entries(npcConfigs).map(([id, config]) => [id, config.dialog])
        );
        this.npcDialogs = this.activeStory
            ? applyStoryDialogOverrides(baseDialogs, this.activeStory.casePacket)
            : baseDialogs;

        const roomConfigs: Record<string, { config: RoomConfig; room: Room }> = {
            library: { config: this.content.rooms.library, room: this.rooms.library },
            hall: { config: this.content.rooms.hall, room: this.rooms.hall },
            study: { config: this.content.rooms.study, room: this.rooms.study },
            kitchen: { config: this.content.rooms.kitchen, room: this.rooms.kitchen },
            garden: { config: this.content.rooms.garden, room: this.rooms.garden },
            courtyard: { config: this.content.rooms.courtyard, room: this.rooms.courtyard },
            dining: { config: this.content.rooms.dining, room: this.rooms.dining }
        };

        for (const { config, room } of Object.values(roomConfigs)) {
            if (!config.npcs) continue;
            for (const npcPlacement of config.npcs) {
                const npcConfig = npcConfigs[npcPlacement.npcId];
                if (npcConfig) {
                    const npcX = this.resolveNPCPosition(npcPlacement.x, "width", config.width) * TILE_SIZE;
                    const npcY = this.resolveNPCPosition(npcPlacement.y, "height", config.height) * TILE_SIZE;
                    room.npcs.push(
                        new NPC(npcConfig.id, npcX, npcY, npcConfig.name, npcConfig.role, npcConfig.spriteName)
                    );
                }
            }
        }
    }

    private resolveNPCPosition(value: number | "center" | "top" | "bottom", dimension: "width" | "height", roomDimension: number): number {
        if (typeof value === "number") return value;
        if (value === "center") return Math.floor(roomDimension / 2);
        if (value === "top") return 1;
        if (value === "bottom") return roomDimension - 2;
        return 1;
    }

    /** Returns the murderer NPC from whichever room he's in, or null */
    private getMurderer(): NPC | null {
        for (const room of Object.values(this.rooms)) {
            const found = room.npcs.find((n) => n.id === this.getMurdererNpcId());
            if (found) return found;
        }
        return null;
    }

    /** Returns the room that contains the given NPC, or null */
    private getRoomContainingNPC(npcId: string): Room | null {
        for (const room of Object.values(this.rooms)) {
            if (room.npcs.some((n) => n.id === npcId)) return room;
        }
        return null;
    }

    /** Returns the NPC by id from whichever room, or null */
    private getNPCById(npcId: string): NPC | null {
        const room = this.getRoomContainingNPC(npcId);
        return room ? room.npcs.find((n) => n.id === npcId) ?? null : null;
    }

    /** Move an NPC from its current room to target room */
    private moveNPCToRoom(npc: NPC, targetRoom: Room, atX: number, atY: number): void {
        for (const room of Object.values(this.rooms)) {
            const idx = room.npcs.indexOf(npc);
            if (idx >= 0) {
                room.npcs.splice(idx, 1);
                break;
            }
        }
        npc.x = atX;
        npc.y = atY;
        targetRoom.npcs.push(npc);
    }

    private startVictorySequence(policeId: string): void {
        const police = this.getNPCById(policeId);
        const murderer = this.getMurderer();
        if (!police || !murderer) return;

        const room = this.currentRoom;

        // Ensure murderer is in this room (only if they're in another room)
        const murdererRoom = this.getRoomContainingNPC(this.getMurdererNpcId());
        let spawnExitIndex = 0;
        if (murdererRoom !== room) {
            const exit = room.exits[0];
            if (exit) {
                const spawnX = exit.spawnX * TILE_SIZE;
                const spawnY = exit.spawnY * TILE_SIZE;
                this.moveNPCToRoom(murderer, room, spawnX, spawnY);
                spawnExitIndex = 1; // run toward the other door if there is one
            } else {
                this.moveNPCToRoom(murderer, room, murderer.x, murderer.y);
            }
        }

        // Pick a door for the murderer to run to (use a different exit if we have multiple)
        const exitIndex = room.exits.length > 1 ? spawnExitIndex % room.exits.length : 0;
        const exit = room.exits[exitIndex];
        if (!exit) return;
        const doorX = exit.x * TILE_SIZE + TILE_SIZE;
        const doorY = exit.y * TILE_SIZE + TILE_SIZE;

        // Murderer runs toward the door; police chases murderer. Do not move the police.
        murderer.setChasing(false);
        murderer.setFleeing(false);
        murderer.setChasing(true);
        murderer.setChaseSpeed(75);
        police.setChasing(true);
        police.setChaseSpeed(120);

        this.victoryDoorTarget = { x: doorX, y: doorY };
        this.victoryPhase = true;
        this.victoryTimer = 2; // short so "press to return" appears quickly
        this.victoryRoom = room;
        this.victoryPoliceId = policeId;
        this.state = "victory";
        this.message = null;
    }

    private updateVictory(dt: number): void {
        if (this.victoryTimer > 0) {
            this.victoryTimer -= dt;
            if (!this.victoryRoom || !this.victoryPoliceId || !this.victoryDoorTarget) return;
            const murderer = this.getMurderer();
            const police = this.getNPCById(this.victoryPoliceId);
            if (murderer && police) {
                murderer.updateChase(dt, this.victoryDoorTarget.x, this.victoryDoorTarget.y, this.victoryRoom.map);
                const mcx = murderer.x + murderer.width / 2;
                const mcy = murderer.y + murderer.height / 2;
                police.updateChase(dt, mcx, mcy, this.victoryRoom.map);
            }
            return;
        }
        // When timer <= 0, key check is done in index.ts so we don't miss the key
    }

    /** True when victory screen is showing and we're waiting for the user to press a key to return to menu */
    isWaitingForVictoryInput(): boolean {
        return this.victoryPhase;
    }

    /** Call when user presses key to leave victory screen (called from main loop in index.ts) */
    returnToMenuFromVictory(): void {
        this.onVictoryComplete?.();
    }

    private npcOverlapsPlayer(npc: NPC): boolean {
        return (
            this.player.x < npc.x + npc.width &&
            this.player.x + this.player.width > npc.x &&
            this.player.y < npc.y + npc.height &&
            this.player.y + this.player.height > npc.y
        );
    }

    /** Move murderer to current room at the stored spawn position (after room change head start) */
    private spawnMurdererInCurrentRoom(): void {
        const chef = this.getMurderer();
        if (!chef) return;
        for (const room of Object.values(this.rooms)) {
            const idx = room.npcs.indexOf(chef);
            if (idx >= 0) {
                room.npcs.splice(idx, 1);
                break;
            }
        }
        chef.x = this.murdererSpawnX;
        chef.y = this.murdererSpawnY;
        this.currentRoom.npcs.push(chef);
    }

    update(dt: number) {
        if (this.roomTitleBanner) {
            this.roomTitleBanner.elapsed += dt;
            if (this.roomTitleBanner.elapsed >= ROOM_TITLE_DURATION) {
                this.roomTitleBanner = null;
            }
        }

        // Handle victory first so Escape/Enter go to main menu, not pause
        if (this.state === "victory") {
            this.updateVictory(dt);
            return;
        }

        if (this.input.wasPressed("escape")) {
            this.onMenuRequest?.();
            return;
        }

        // Handle inventory toggle
        if (this.input.wasPressed("i")) {
            if (this.state === "inventory") {
                this.state = "playing";
            } else if (this.state === "playing") {
                this.state = "inventory";
            }
            return;
        }

        if (this.state === "playing") {
            this.player.update(dt, this.input, this.currentRoom.map, this.currentRoom.npcs);
            this.roomTransitionCooldown = Math.max(0, this.roomTransitionCooldown - dt);
            this.redBlinkRemaining = Math.max(0, this.redBlinkRemaining - dt);

            // Check interaction first so talking to police triggers victory before "murderer caught you"
            if (this.input.wasPressed("e") || this.input.wasPressed(" ")) {
                const result = this.interaction.interact(
                    this.player,
                    this.currentRoom,
                    this.npcDialogs
                );

                if (result) {
                    this.message = result.description;
                    if (result.clues.length > 0) {
                        this.clueNotification = { clueId: result.clues[0] };
                    }
                    if (
                        result.speakerId === this.getMurdererNpcId() &&
                        this.getRequiredClueIds().every((c) => this.clueSystem.hasClue(c))
                    ) {
                        this.accusedMurderer = true;
                        this.redBlinkRemaining = 3;
                        this.chaseStartsIn = DIFFICULTY_CONFIG[this.difficulty].chaseHeadStart;
                        this.message = result.description + " Find a police officer!";
                    }
                    if (
                        result.speakerId && POLICE_NPC_IDS.includes(result.speakerId) &&
                        this.accusedMurderer
                    ) {
                        this.startVictorySequence(result.speakerId);
                        return;
                    }
                    this.state = "interacting";
                }
            }

            // Murderer chase: after head start he chases player; if he catches you = game over
            if (this.chaseStartsIn > 0) {
                this.chaseStartsIn -= dt;
                if (this.chaseStartsIn <= 0) {
                    const chef = this.getMurderer();
                    if (chef) {
                        chef.setChasing(true);
                        chef.setChaseSpeed(DIFFICULTY_CONFIG[this.difficulty].murdererChaseSpeed);
                    }
                    this.chaseStartsIn = 0;
                }
            }
            if (this.murdererSpawnsIn > 0) {
                this.murdererSpawnsIn -= dt;
                if (this.murdererSpawnsIn <= 0) {
                    this.spawnMurdererInCurrentRoom();
                    this.murdererSpawnsIn = 0;
                }
            }
            const playerCenterX = this.player.x + this.player.width / 2;
            const playerCenterY = this.player.y + this.player.height / 2;
            for (const npc of this.currentRoom.npcs) {
                if (npc.isChasing()) {
                    npc.updateChase(dt, playerCenterX, playerCenterY, this.currentRoom.map);
                    if (this.npcOverlapsPlayer(npc)) {
                        this.onGameOver?.();
                        return;
                    }
                }
            }

            this.checkRoomTransition();
        } else if (this.state === "interacting") {
            if (this.input.wasPressed("e") || this.input.wasPressed(" ")) {
                this.message = null;
                this.clueNotification = null; // Clear clue notification on dismiss
                this.state = "playing";
            }
        }
    }

    private checkRoomTransition() {
        if (this.roomTransitionCooldown > 0) return;

        // Calculate player's occupied tiles (use ceil for right/bottom to match Player collision logic)
        const playerLeftTile = Math.floor(this.player.x / TILE_SIZE);
        const playerRightTile = Math.ceil((this.player.x + this.player.width) / TILE_SIZE);
        const playerTopTile = Math.floor(this.player.y / TILE_SIZE);
        const playerBottomTile = Math.ceil((this.player.y + this.player.height) / TILE_SIZE);

        for (const exit of this.currentRoom.exits) {
            // Check if player overlaps with door (3 tiles wide/tall)
            // Determine door orientation: if on top/bottom wall, door is horizontal; if on left/right wall, door is vertical
            const isTopOrBottom = exit.y === 0 || exit.y === this.currentRoom.map.height - 1;
            
            let overlapsDoor = false;
            
            if (isTopOrBottom) {
                // Horizontal door (on top or bottom wall) - 3 tiles wide (exit.x-1, exit.x, exit.x+1)
                const doorLeft = exit.x - 1;
                const doorRight = exit.x + 2; // exclusive
                
                // Check if player's horizontal range overlaps with door tiles
                const horizontalOverlap = (
                    (playerLeftTile < doorRight && playerRightTile > doorLeft)
                );
                
                // Check if player's vertical position overlaps with door row
                const verticalOverlap = (
                    (playerTopTile <= exit.y && playerBottomTile >= exit.y)
                );
                
                overlapsDoor = horizontalOverlap && verticalOverlap;
            } else {
                // Vertical door (on left or right wall) - 3 tiles tall (exit.y-1, exit.y, exit.y+1)
                const doorTop = exit.y - 1;
                const doorBottom = exit.y + 2; // exclusive
                
                // Check if player's vertical range overlaps with door tiles
                const verticalOverlap = (
                    (playerTopTile < doorBottom && playerBottomTile > doorTop)
                );
                
                // Check if player's horizontal position overlaps with door column
                const horizontalOverlap = (
                    (playerLeftTile <= exit.x && playerRightTile > exit.x)
                );
                
                overlapsDoor = horizontalOverlap && verticalOverlap;
            }
            
            if (overlapsDoor) {
                const nextRoom = this.rooms[exit.targetRoom];

                this.currentRoom = nextRoom;
                this.player.x = exit.spawnX * TILE_SIZE;
                this.player.y = exit.spawnY * TILE_SIZE;
                this.roomTransitionCooldown = 0.65;
                this.startRoomTitleBanner(exit.targetRoom);

                // If murderer is chasing, give player head start in new room before he spawns at the door
                const chef = this.getMurderer();
                if (chef?.isChasing()) {
                    this.murdererSpawnsIn = DIFFICULTY_CONFIG[this.difficulty].murdererSpawnsIn;
                    this.murdererSpawnX = exit.spawnX * TILE_SIZE;
                    this.murdererSpawnY = exit.spawnY * TILE_SIZE;
                }

                return;
            }
        }
    }

    private wrapDialogText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
        const lines: string[] = [];
        const paragraphs = text.split("\n");

        for (const paragraph of paragraphs) {
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

    render(ctx: CanvasRenderingContext2D) {
        if (this.state === "inventory") {
            renderInventoryPanel(ctx, this.clueSystem, this.clueCatalog);
            return;
        }

        ctx.fillStyle = "#222";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        this.currentRoom.map.render(ctx);

        // Render doors as single sprite spanning 3 tiles (horizontal or vertical)
        for (const exit of this.currentRoom.exits) {
            const isTopOrBottom = exit.y === 0 || exit.y === this.currentRoom.map.height - 1;
            if (isTopOrBottom) {
                const x = (exit.x - 1) * TILE_SIZE;
                const y = exit.y * TILE_SIZE;
                spriteLoader.drawSprite(ctx, 'door', x, y, TILE_SIZE * 3, TILE_SIZE);
            } else {
                // Vertical door: extend bounds slightly to cover floor visible at edges
                const x = exit.x * TILE_SIZE - 1;
                const y = (exit.y - 1) * TILE_SIZE - 1;
                spriteLoader.drawSprite(ctx, 'door', x, y, TILE_SIZE + 2, TILE_SIZE * 3 + 2);
            }
        }

        // Walkable floor decals (rugs): no collision; drawn under entities so transparency still reads as floor.
        const rugActors: DepthActor[] = [];
        const furnitureActors: DepthActor[] = [];
        for (const obj of this.currentRoom.interactables) {
            const actor = furnitureActorFromInteractable(obj);
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

        // Furniture, NPCs, and player — Y-sort so nearer screen-bottom draws on top.
        const actors: DepthActor[] = [
            ...furnitureActors,
            ...this.currentRoom.npcs,
            this.player
        ];

        actors
            .slice()
            .sort((a, b) => a.y + a.height - (b.y + b.height))
            .forEach((a) => a.render(ctx));

        if (this.debugMode) {
            renderDebugOverlay(ctx, this.player, this.currentRoom, this.clueSystem);
        }

        if (this.message) {
            ctx.font = "16px serif";
            ctx.textAlign = "left";

            const boxWidth = Math.floor(ctx.canvas.width / 3);
            const padding = 12;
            const lineHeight = 20;
            const maxTextWidth = boxWidth - padding * 2;
            const lines = this.wrapDialogText(ctx, this.message, maxTextWidth);
            const boxHeight = padding * 2 + lines.length * lineHeight;
            const boxX = 20;
            const boxY = ctx.canvas.height - 20 - boxHeight;

            ctx.fillStyle = "rgba(0,0,0,0.78)";
            ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

            ctx.fillStyle = "white";
            for (let i = 0; i < lines.length; i++) {
                ctx.fillText(lines[i], boxX + padding, boxY + padding + 16 + i * lineHeight);
            }
        }

        if (this.clueNotification) {
            renderClueNotification(ctx, this.clueNotification.clueId, this.clueCatalog);
        }

        if (this.roomTitleBanner) {
            const t = Math.min(this.roomTitleBanner.elapsed, ROOM_TITLE_DURATION);
            const alpha = Math.sin((t / ROOM_TITLE_DURATION) * Math.PI);
            if (alpha > 0.01) {
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.font = "bold 36px serif";
                ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
                ctx.strokeStyle = "rgba(0, 0, 0, 0.55)";
                ctx.lineWidth = 4;
                const cx = ctx.canvas.width / 2;
                const cy = ctx.canvas.height / 2;
                ctx.strokeText(this.roomTitleBanner.title, cx, cy);
                ctx.fillText(this.roomTitleBanner.title, cx, cy);
                ctx.restore();
            }
        }

        // Subtle red blink for 3 seconds after accusing the murderer
        if (this.redBlinkRemaining > 0) {
            const intensity = this.redBlinkRemaining / 3;
            const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008);
            const alpha = 0.12 * intensity * pulse;
            ctx.fillStyle = `rgba(180, 0, 0, ${alpha})`;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }

        // Victory: fade in immediately, then congratulations, then "press to return to menu"
        if (this.victoryPhase) {
            const elapsed = 2 - this.victoryTimer;
            // Start fading immediately (full black in ~0.8s)
            const fadeAlpha = this.victoryTimer <= 0 ? 1 : Math.min(1, elapsed / 0.8);
            if (fadeAlpha > 0) {
                ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            }
            // Show text once fade is underway (after ~0.4s)
            const showText = elapsed >= 0.4 || this.victoryTimer <= 0;
            if (showText) {
                const textAlpha = this.victoryTimer <= 0 ? 1 : Math.min(1, (elapsed - 0.4) / 0.3);
                ctx.save();
                ctx.globalAlpha = textAlpha;
                ctx.fillStyle = "#fff";
                ctx.font = "bold 48px serif";
                ctx.textAlign = "center";
                ctx.fillText("Congratulations!", ctx.canvas.width / 2, ctx.canvas.height / 2 - 40);
                ctx.font = "24px serif";
                ctx.fillText("The murderer is being apprehended.", ctx.canvas.width / 2, ctx.canvas.height / 2 + 10);
                if (this.victoryTimer <= 0) {
                    ctx.font = "20px serif";
                    ctx.fillStyle = "rgba(255,255,255,0.9)";
                    ctx.fillText("Press Enter or Escape to return to main menu", ctx.canvas.width / 2, ctx.canvas.height / 2 + 70);
                }
                ctx.restore();
            }
        }
    }
}
