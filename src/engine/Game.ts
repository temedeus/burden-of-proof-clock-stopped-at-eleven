import { Room } from "../world/Room";
import { createLibrary, createHall } from "../world/Rooms";
import {Input} from "./Input";
import {Player} from "../entities/Player";
import {NPC} from "../entities/NPC";
import {TILE_SIZE} from "../world/constants";
import { InteractionSystem } from "../systems/InteractionSystem";
import { ClueSystem } from "../systems/ClueSystem";
import cluesData from "../data/clues.json";
import butlerConfig from "../data/npcs/butler.json";
import libraryConfig from "../data/rooms/library.json";
import { spriteLoader } from "../assets/SpriteLoader";

type GameState = "playing" | "interacting" | "inventory";

interface ClueData {
    name: string;
    description: string;
}

interface CluesData {
    [key: string]: ClueData;
}

interface NPCConfig {
    id: string;
    name: string;
    role?: string;
    dialog: {
        default: string;
        conditions?: Array<{ requiresClue?: string; dialog: string }>;
    };
}

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
    private roomTransitionCooldown = 0; // seconds - prevents immediate re-trigger after spawn


    constructor(private ctx: CanvasRenderingContext2D) {
        // Check for debug flag in URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        this.debugMode = urlParams.get('debug') === 'true' || urlParams.get('debug') === '1';
        
        if (this.debugMode) {
            console.log('🐛 Debug mode enabled! Collision and interaction areas will be visible.');
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
        // Load NPC configs
        const npcConfigs: Record<string, NPCConfig> = {
            butler: butlerConfig as NPCConfig
        };

        // Store dialog configs
        for (const [id, config] of Object.entries(npcConfigs)) {
            this.npcDialogs[id] = config.dialog;
        }

        // Initialize NPCs in rooms based on room config
        const libConfig = libraryConfig as any;
        if (libConfig.npcs) {
            for (const npcPlacement of libConfig.npcs) {
                const npcConfig = npcConfigs[npcPlacement.npcId];
                if (npcConfig) {
                    const npcX = this.resolveNPCPosition(npcPlacement.x, "width", libConfig.width) * TILE_SIZE;
                    const npcY = this.resolveNPCPosition(npcPlacement.y, "height", libConfig.height) * TILE_SIZE;
                    
                    const npc = new NPC(
                        npcConfig.id,
                        npcX,
                        npcY,
                        npcConfig.name,
                        npcConfig.role
                    );
                    this.rooms.library.npcs.push(npc);
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
            this.checkRoomTransition();

            if (this.input.wasPressed("e") || this.input.wasPressed(" ")) {
                console.log("wasPressed", this.player.facing);

                const result = this.interaction.interact(
                    this.player,
                    this.currentRoom,
                    this.npcDialogs
                );

                if (result) {
                    this.message = result.description;
                    // Show notification for first clue found
                    if (result.clues.length > 0) {
                        this.clueNotification = {
                            clueId: result.clues[0]
                        };
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
            this.renderInventory(ctx);
            return;
        }

        ctx.fillStyle = "#222";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        this.currentRoom.map.render(ctx);

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

        // Debug visualization for collision and interaction areas (only when debug mode is enabled)
        if (this.debugMode) {
            this.renderDebugOverlay(ctx);
        }

        if (this.message) {
            ctx.fillStyle = "rgba(0,0,0,0.7)";
            ctx.fillRect(20, ctx.canvas.height - 60, ctx.canvas.width - 40, 40);

            ctx.fillStyle = "white";
            ctx.font = "16px serif";
            ctx.textAlign = "left";
            ctx.fillText(this.message, 30, ctx.canvas.height - 35);
        }

        // Render clue notification
        if (this.clueNotification) {
            this.renderClueNotification(ctx);
        }
    }

    private renderInventory(ctx: CanvasRenderingContext2D) {
        // Dark overlay
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        const clues = this.clueSystem.getAllClues();
        const cluesDataTyped = cluesData as CluesData;

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
                const clue = cluesDataTyped[clueId];
                if (clue) {
                    // Clue name
                    ctx.fillStyle = "#ffd700";
                    ctx.font = "bold 18px serif";
                    ctx.fillText(`${index + 1}. ${clue.name}`, panelX + 30, yOffset);
                    
                    // Clue description
                    ctx.fillStyle = "#ccc";
                    ctx.font = "14px serif";
                    ctx.fillText(clue.description, panelX + 30, yOffset + 25);
                    
                    yOffset += 60;
                } else {
                    // Fallback if clue data not found
                    ctx.fillStyle = "#ffd700";
                    ctx.font = "bold 18px serif";
                    ctx.fillText(`${index + 1}. ${clueId}`, panelX + 30, yOffset);
                    yOffset += 40;
                }
            });
        }

        // Instructions
        ctx.fillStyle = "#888";
        ctx.font = "14px serif";
        ctx.textAlign = "center";
        ctx.fillText("Press I to close", ctx.canvas.width / 2, panelY + panelHeight - 30);
    }

    private renderDebugOverlay(ctx: CanvasRenderingContext2D) {

        // Draw player collision box (red outline)
        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Draw player tile boundaries
        const playerLeftTile = Math.floor(this.player.x / TILE_SIZE);
        const playerRightTile = Math.floor((this.player.x + this.player.width) / TILE_SIZE);
        const playerTopTile = Math.floor(this.player.y / TILE_SIZE);
        const playerBottomTile = Math.floor((this.player.y + this.player.height) / TILE_SIZE);
        
        ctx.strokeStyle = "#ff6666";
        ctx.lineWidth = 1;
        for (let ty = playerTopTile; ty < playerBottomTile; ty++) {
            for (let tx = playerLeftTile; tx < playerRightTile; tx++) {
                ctx.strokeRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }

        // Draw NPC collision boxes (blue outline)
        for (const npc of this.currentRoom.npcs) {
            ctx.strokeStyle = "#0000ff";
            ctx.lineWidth = 2;
            ctx.strokeRect(npc.x, npc.y, npc.width, npc.height);
            
            // Draw NPC tile boundaries
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
        for (const obj of this.currentRoom.interactables) {
            const minX = Math.min(...obj.tiles.map(t => t.x));
            const maxX = Math.max(...obj.tiles.map(t => t.x));
            const minY = Math.min(...obj.tiles.map(t => t.y));
            const maxY = Math.max(...obj.tiles.map(t => t.y));
            
            ctx.strokeStyle = "#00ff00";
            ctx.lineWidth = 2;
            ctx.strokeRect(minX * TILE_SIZE, minY * TILE_SIZE, (maxX - minX + 1) * TILE_SIZE, (maxY - minY + 1) * TILE_SIZE);
            
            // Draw furniture tile boundaries
            ctx.strokeStyle = "#66ff66";
            ctx.lineWidth = 1;
            for (const tile of obj.tiles) {
                ctx.strokeRect(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }

        // Draw interaction target tile (yellow highlight)
        const interactionPoint = this.player.getInteractionPoint();
        const reach = TILE_SIZE * 0.6;
        let targetX = interactionPoint.x;
        let targetY = interactionPoint.y;
        
        switch (this.player.facing) {
            case "up": targetY -= reach; break;
            case "down": targetY += reach; break;
            case "left": targetX -= reach; break;
            case "right": targetX += reach; break;
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

    private renderClueNotification(ctx: CanvasRenderingContext2D) {
        const cluesDataTyped = cluesData as CluesData;
        const clue = cluesDataTyped[this.clueNotification!.clueId];
        const clueName = clue ? clue.name : this.clueNotification!.clueId;

        // Notification panel
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
        
        // Reset text alignment for other rendering
        ctx.textAlign = "left";
    }
}
