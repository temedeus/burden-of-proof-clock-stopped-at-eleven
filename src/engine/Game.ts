import { Room } from "../world/Room";
import { createLibrary, createHall, createStudy, createKitchen } from "../world/Rooms";
import {Input} from "./Input";
import { Player, PlayerSpriteName } from "../entities/Player";
import {NPC} from "../entities/NPC";
import {TILE_SIZE} from "../world/constants";
import { InteractionSystem } from "../systems/InteractionSystem";
import { ClueSystem } from "../systems/ClueSystem";
import butlerConfig from "../data/npcs/butler.json";
import maidConfig from "../data/npcs/maid.json";
import cookConfig from "../data/npcs/cook.json";
import baronConfig from "../data/npcs/baron.json";
import baronessConfig from "../data/npcs/baroness.json";
import workerManConfig from "../data/npcs/worker_man.json";
import workerBoyConfig from "../data/npcs/worker_boy.json";
import policeConfig from "../data/npcs/police.json";
import police2Config from "../data/npcs/police2.json";
import libraryConfig from "../data/rooms/library.json";
import hallConfig from "../data/rooms/hall.json";
import studyConfig from "../data/rooms/study.json";
import kitchenConfig from "../data/rooms/kitchen.json";
import { spriteLoader } from "../assets/SpriteLoader";
import { isDebugMode, renderDebugOverlay } from "./DebugOverlay";
import { renderInventoryPanel } from "./InventoryPanel";
import { renderClueNotification } from "./ClueNotification";

type GameState = "playing" | "interacting" | "inventory";

interface NPCConfig {
    id: string;
    name: string;
    role?: string;
    spriteName?: string;
    dialog: {
        default: string;
        conditions?: Array<{ requiresClue?: string; dialog: string }>;
    };
}

const MURDERER_NPC_ID = "cook";
const REQUIRED_CLUES_FOR_ACCUSATION = ["torn_page"];

export type Difficulty = "easy" | "medium" | "hard";

const DIFFICULTY_CONFIG: Record<
    Difficulty,
    { chaseHeadStart: number; murdererChaseSpeed: number; murdererSpawnsIn: number }
> = {
    easy: { chaseHeadStart: 2.5, murdererChaseSpeed: 80, murdererSpawnsIn: 2 },
    medium: { chaseHeadStart: 1.5, murdererChaseSpeed: 100, murdererSpawnsIn: 1.5 },
    hard: { chaseHeadStart: 0.5, murdererChaseSpeed: 120, murdererSpawnsIn: 1 }
};

export class Game {
    private input: Input;
    private rooms: Record<string, Room>;
    private currentRoom: Room;
    private npcDialogs: Record<string, any> = {};

    private player: Player;

    private clueSystem = new ClueSystem();
    private interaction = new InteractionSystem(this.clueSystem);
    private state: GameState = "playing";
    private message: string | null = null;
    private clueNotification: { clueId: string } | null = null;
    private debugMode: boolean = false;
    private roomTransitionCooldown = 0;
    private redBlinkRemaining = 0;
    private chaseStartsIn = 0; // seconds until chef starts chasing (1.5s head start after accusation)
    private murdererSpawnsIn = 0; // after room change: 1.5s before murderer appears in new room
    private murdererSpawnX = 0;
    private murdererSpawnY = 0;
    private difficulty: Difficulty = "medium";
    private onMenuRequest?: () => void;
    private onGameOver?: () => void;

    constructor(
        private ctx: CanvasRenderingContext2D,
        options?: { difficulty?: Difficulty; onMenuRequest?: () => void; onGameOver?: () => void; input?: Input; playerSprite?: PlayerSpriteName }
    ) {
        this.difficulty = options?.difficulty ?? "medium";
        this.onMenuRequest = options?.onMenuRequest;
        this.onGameOver = options?.onGameOver;
        this.input = options?.input ?? new Input();
        this.player = new Player("player", 64, 64, options?.playerSprite ?? "female_detective");
        this.debugMode = isDebugMode();
        if (this.debugMode) {
            console.log("🐛 Debug mode enabled! Collision and interaction areas will be visible.");
        }

        const w = Math.floor(ctx.canvas.width / TILE_SIZE);
        const h = Math.floor(ctx.canvas.height / TILE_SIZE);

        this.rooms = {
            library: createLibrary(w, h),
            hall: createHall(w, h),
            study: createStudy(w, h),
            kitchen: createKitchen(w, h)
        };

        // Load NPC configs and initialize NPCs
        this.loadNPCs();

        // Load spritesheet
        spriteLoader.load().catch(err => {
            console.error('Failed to load spritesheet:', err);
        });

        this.currentRoom = this.rooms.library;
    }

    private loadNPCs() {
        const npcConfigs: Record<string, NPCConfig> = {
            butler: butlerConfig as NPCConfig,
            maid: maidConfig as NPCConfig,
            cook: cookConfig as NPCConfig,
            baron: baronConfig as NPCConfig,
            baroness: baronessConfig as NPCConfig,
            worker_man: workerManConfig as NPCConfig,
            worker_boy: workerBoyConfig as NPCConfig,
            police: policeConfig as NPCConfig,
            police2: police2Config as NPCConfig
        };

        for (const [id, config] of Object.entries(npcConfigs)) {
            this.npcDialogs[id] = config.dialog;
        }

        const roomConfigs: Record<string, { config: any; room: Room }> = {
            library: { config: libraryConfig as any, room: this.rooms.library },
            hall: { config: hallConfig as any, room: this.rooms.hall },
            study: { config: studyConfig as any, room: this.rooms.study },
            kitchen: { config: kitchenConfig as any, room: this.rooms.kitchen }
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
            const found = room.npcs.find((n) => n.id === MURDERER_NPC_ID);
            if (found) return found;
        }
        return null;
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
                    // Accuse murderer: has required clues and talked to chef
                    if (
                        result.speakerId === MURDERER_NPC_ID &&
                        REQUIRED_CLUES_FOR_ACCUSATION.every((c) => this.clueSystem.hasClue(c))
                    ) {
                        const config = DIFFICULTY_CONFIG[this.difficulty];
                        this.redBlinkRemaining = 3;
                        this.chaseStartsIn = config.chaseHeadStart;
                    }
                    this.state = "interacting";
                }
            }
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
                this.roomTransitionCooldown = 0.4;

                // If murderer is chasing, give player 1.5s head start in new room before he spawns at the door
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

    render(ctx: CanvasRenderingContext2D) {
        if (this.state === "inventory") {
            renderInventoryPanel(ctx, this.clueSystem);
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

        // Build furniture "actors" from interactables for depth-sorted rendering
        const furnitureActors = this.currentRoom.interactables.map(obj => {
            const minX = Math.min(...obj.tiles.map(t => t.x));
            const maxX = Math.max(...obj.tiles.map(t => t.x));
            const minY = Math.min(...obj.tiles.map(t => t.y));
            const maxY = Math.max(...obj.tiles.map(t => t.y));

            const widthTiles = maxX - minX + 1;
            const heightTiles = maxY - minY + 1;

            // Map interactable id to sprite name
            let spriteName = "table";
            if (obj.id === "shelves" || obj.id === "bookshelves") {
                spriteName = "bookshelf";
            } else if (obj.id === "table") {
                spriteName = "table";
            }

            return {
                y: minY * TILE_SIZE,
                height: heightTiles * TILE_SIZE,
                render: (ctx: CanvasRenderingContext2D) => {
                    spriteLoader.drawSprite(
                        ctx,
                        spriteName,
                        minX * TILE_SIZE,
                        minY * TILE_SIZE,
                        widthTiles * TILE_SIZE,
                        heightTiles * TILE_SIZE
                    );
                }
            };
        });

        // Render furniture, NPCs, and player with simple Y-sorting so entities "in front"
        // (lower on the screen) are drawn on top of those "behind" them.
        const actors: Array<{ y: number; height: number; render(ctx: CanvasRenderingContext2D): void }> = [
            ...furnitureActors,
            ...this.currentRoom.npcs,
            this.player
        ];

        actors
            .slice() // avoid mutating original arrays
            .sort((a, b) => (a.y + a.height) - (b.y + b.height))
            .forEach(actor => actor.render(ctx));

        if (this.debugMode) {
            renderDebugOverlay(ctx, this.player, this.currentRoom);
        }

        if (this.message) {
            ctx.fillStyle = "rgba(0,0,0,0.7)";
            ctx.fillRect(20, ctx.canvas.height - 60, ctx.canvas.width - 40, 40);

            ctx.fillStyle = "white";
            ctx.font = "16px serif";
            ctx.textAlign = "left";
            ctx.fillText(this.message, 30, ctx.canvas.height - 35);
        }

        if (this.clueNotification) {
            renderClueNotification(ctx, this.clueNotification.clueId);
        }

        // Subtle red blink for 3 seconds after accusing the murderer
        if (this.redBlinkRemaining > 0) {
            const intensity = this.redBlinkRemaining / 3;
            const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008);
            const alpha = 0.12 * intensity * pulse;
            ctx.fillStyle = `rgba(180, 0, 0, ${alpha})`;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
    }
}
