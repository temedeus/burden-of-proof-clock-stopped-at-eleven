import { Room } from "../world/Room";
import { createLibrary, createHall } from "../world/Rooms";
import {Input} from "./Input";
import {Player} from "../entities/Player";
import {NPC} from "../entities/NPC";
import {TILE_SIZE} from "../world/constants";
import { InteractionSystem } from "../systems/InteractionSystem";
import { ClueSystem } from "../systems/ClueSystem";
import butlerConfig from "../data/npcs/butler.json";
import maidConfig from "../data/npcs/maid.json";
import cookConfig from "../data/npcs/cook.json";
import libraryConfig from "../data/rooms/library.json";
import hallConfig from "../data/rooms/hall.json";
import { spriteLoader } from "../assets/SpriteLoader";
import { isDebugMode, renderDebugOverlay } from "./DebugOverlay";
import { renderInventoryPanel } from "./InventoryPanel";
import { renderClueNotification } from "./ClueNotification";

type GameState = "playing" | "interacting" | "inventory";

interface NPCConfig {
    id: string;
    name: string;
    role?: string;
    dialog: {
        default: string;
        conditions?: Array<{ requiresClue?: string; dialog: string }>;
    };
}

const MURDERER_NPC_ID = "cook";
const REQUIRED_CLUES_FOR_ACCUSATION = ["torn_page"];

export class Game {
    private input = new Input();
    private rooms: Record<string, Room>;
    private currentRoom: Room;
    private npcDialogs: Record<string, any> = {};

    private player = new Player("player", 64, 64);

    private clueSystem = new ClueSystem();
    private interaction = new InteractionSystem(this.clueSystem);
    private state: GameState = "playing";
    private message: string | null = null;
    private clueNotification: { clueId: string } | null = null;
    private debugMode: boolean = false;
    private roomTransitionCooldown = 0;
    private redBlinkRemaining = 0; // seconds of red blink after accusing murderer


    constructor(private ctx: CanvasRenderingContext2D) {
        this.debugMode = isDebugMode();
        if (this.debugMode) {
            console.log("🐛 Debug mode enabled! Collision and interaction areas will be visible.");
        }

        const w = Math.floor(ctx.canvas.width / TILE_SIZE);
        const h = Math.floor(ctx.canvas.height / TILE_SIZE);

        this.rooms = {
            library: createLibrary(w, h),
            hall: createHall(w, h)
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
            cook: cookConfig as NPCConfig
        };

        for (const [id, config] of Object.entries(npcConfigs)) {
            this.npcDialogs[id] = config.dialog;
        }

        const roomConfigs: Record<string, { config: any; room: Room }> = {
            library: { config: libraryConfig as any, room: this.rooms.library },
            hall: { config: hallConfig as any, room: this.rooms.hall }
        };

        for (const { config, room } of Object.values(roomConfigs)) {
            if (!config.npcs) continue;
            for (const npcPlacement of config.npcs) {
                const npcConfig = npcConfigs[npcPlacement.npcId];
                if (npcConfig) {
                    const npcX = this.resolveNPCPosition(npcPlacement.x, "width", config.width) * TILE_SIZE;
                    const npcY = this.resolveNPCPosition(npcPlacement.y, "height", config.height) * TILE_SIZE;
                    room.npcs.push(
                        new NPC(npcConfig.id, npcX, npcY, npcConfig.name, npcConfig.role)
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

    update(dt: number) {
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
            const playerCenterX = this.player.x + this.player.width / 2;
            const playerCenterY = this.player.y + this.player.height / 2;
            for (const npc of this.currentRoom.npcs) {
                if (npc.isChasing()) {
                    npc.updateChase(dt, playerCenterX, playerCenterY, this.currentRoom.map);
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
                        this.redBlinkRemaining = 3;
                        const chef = this.currentRoom.npcs.find((n) => n.id === MURDERER_NPC_ID);
                        if (chef) chef.setChasing(true);
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

                // Move to the target room
                this.currentRoom = nextRoom;

                // Spawn at the DOOR ENTRY POINT, not the room default
                this.player.x = exit.spawnX * TILE_SIZE;
                this.player.y = exit.spawnY * TILE_SIZE;

                // Cooldown prevents immediate re-trigger (spawn position may overlap door)
                this.roomTransitionCooldown = 0.4;

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
