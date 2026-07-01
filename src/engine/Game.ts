import { Room } from "../world/Room";
import { createRoomFromConfig } from "../world/Rooms";
import { renderRoomScene } from "../render/roomScene";
import { spawnRoomNpcs } from "../world/npcSpawn";
import { Input } from "./Input";
import { Player, PlayerSpriteName } from "../entities/Player";
import { NPC } from "../entities/NPC";
import { TILE_SIZE, roomViewportOffset } from "../world/constants";
import { InteractionSystem } from "../systems/InteractionSystem";
import { ClueSystem } from "../systems/ClueSystem";
import { RoomTransitionService } from "../systems/RoomTransitionService";
import { MurdererChaseController, type Difficulty } from "../systems/MurdererChaseController";
import { VictorySequence } from "../systems/VictorySequence";
import { StudySecretPuzzle } from "../puzzles/StudySecretPuzzle";
import { CellarSecretPuzzle } from "../puzzles/CellarSecretPuzzle";
import { isExitUnlocked, isTransitionConfirm, runPuzzleConfirm, targetRoomFromTransitionConfirm } from "../puzzles/registry";
import { spriteLoader } from "../assets/SpriteLoader";
import { isDebugMode, renderDebugOverlay } from "./DebugOverlay";
import { renderInventoryPanel } from "./InventoryPanel";
import { renderClueNotification } from "./ClueNotification";
import { loadGameContent } from "../content/loadGameContent";
import { applyStoryToRooms, getMurdererNpcId, getRequiredClueIds } from "../content/applyStoryToGame";
import { buildClueCatalog, type ClueCatalog } from "../content/clueCatalog";
import { applyStoryDialogOverrides, resolveActiveStory, type ActiveStory } from "../content/loadStoryContent";
import { fireplaceAmbience } from "../audio/FireplaceAmbience";
import { gardenAmbience } from "../audio/GardenAmbience";
import { clueSounds } from "../audio/ClueSounds";
import { extractSpokenLine, inferVoiceGender, talkSounds } from "../audio/TalkSounds";
import {
    createRoomTitleBanner,
    drawAccusationBlink,
    drawMessageBox,
    drawRoomTitleBanner,
    drawVictoryOverlay,
    tickRoomTitleBanner,
    type RoomTitleBanner
} from "../render/GameHud";
import type { NPCConfig, NPCDialogConfig } from "@cse/content-schema";
import { shouldShowTouchControls } from "./platform";

type GameState = "playing" | "interacting" | "confirming" | "inventory" | "victory";

const POLICE_NPC_IDS = ["police", "police2"];

const ROOM_DISPLAY_TITLES: Record<string, string> = {
    library: "Library",
    hall: "Hall",
    study: "Study",
    kitchen: "Kitchen",
    garden: "Garden",
    courtyard: "Courtyard",
    dining: "Dining Room",
    hidden_room: "Hidden Room",
    stable: "Stable",
    landing: "Landing",
    guest_room_a: "Guest Room A",
    guest_room_b: "Guest Room B",
    bathroom_a: "Bathroom A",
    bathroom_b: "Bathroom B",
    master_bedroom: "Master Bedroom",
    maid_room: "Maid Room",
    attic: "Attic",
    cellar_storage: "Cellar Storage",
    wine_cellar: "Wine Cellar",
    secret_tunnel: "Secret Tunnel"
};

export type { Difficulty };

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
    private roomTransitions = new RoomTransitionService();
    private murdererChase: MurdererChaseController;
    private victory = new VictorySequence();
    private studySecret = new StudySecretPuzzle(
        () => this.rooms.study,
        () => this.rooms.hidden_room
    );
    private cellarSecret = new CellarSecretPuzzle(
        () => this.rooms.cellar_storage,
        () => this.rooms.secret_tunnel
    );

    private state: GameState = "playing";
    private message: string | null = null;
    private pendingConfirmation: { id: string; prompt: string } | null = null;
    private clueNotification: { clueId: string } | null = null;
    private debugMode = false;
    private onMenuRequest?: () => void;
    private onGameOver?: () => void;
    private onVictoryComplete?: () => void;
    private readonly content = loadGameContent();

    private roomTitleBanner: RoomTitleBanner | null = null;
    private decorAnimTime = 0;

    constructor(
        private ctx: CanvasRenderingContext2D,
        options?: {
            difficulty?: Difficulty;
            onMenuRequest?: () => void;
            onGameOver?: () => void;
            onVictoryComplete?: () => void;
            input?: Input;
            playerSprite?: PlayerSpriteName;
        }
    ) {
        this.murdererChase = new MurdererChaseController(options?.difficulty ?? "medium");
        this.onMenuRequest = options?.onMenuRequest;
        this.onGameOver = options?.onGameOver;
        this.onVictoryComplete = options?.onVictoryComplete;
        this.input = options?.input ?? new Input();
        this.player = new Player("player", 64, 64, options?.playerSprite ?? "female_detective");
        this.debugMode = isDebugMode();

        this.rooms = Object.fromEntries(
            Object.entries(this.content.rooms).map(([id, config]) => [
                id,
                createRoomFromConfig(config, undefined, undefined, this.content.rooms)
            ])
        );

        const resolved = resolveActiveStory();
        if (resolved) {
            this.activeStory = resolved;
            this.clueCatalog = buildClueCatalog(this.activeStory.casePacket.generatedClues);
            applyStoryToRooms(this.rooms, this.activeStory.casePacket);
        }

        this.loadNPCs();
        this.studySecret.applyDoorState();
        this.cellarSecret.applyDoorState();

        spriteLoader.load().catch((err) => console.error("Failed to load spritesheet:", err));

        this.currentRoom = this.rooms.library;
        this.syncRoomAmbience();
        if (this.activeStory) {
            this.roomTitleBanner = createRoomTitleBanner(this.activeStory.title);
        } else {
            this.roomTitleBanner = createRoomTitleBanner(this.getRoomDisplayTitle("library"));
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

    private getUnlockedIds(): Set<string> {
        const ids = new Set<string>();
        if (this.studySecret.revealed) ids.add("study_secret");
        if (this.cellarSecret.revealed) ids.add("cellar_secret");
        return ids;
    }

    private getRoomDisplayTitle(roomId: string): string {
        return ROOM_DISPLAY_TITLES[roomId] ?? roomId.charAt(0).toUpperCase() + roomId.slice(1);
    }

    private loadNPCs(): void {
        const npcConfigs: Record<string, NPCConfig> = this.content.npcs;
        const baseDialogs = Object.fromEntries(
            Object.entries(npcConfigs).map(([id, config]) => [id, config.dialog])
        );
        this.npcDialogs = this.activeStory
            ? applyStoryDialogOverrides(baseDialogs, this.activeStory.casePacket)
            : baseDialogs;

        for (const [roomId, config] of Object.entries(this.content.rooms)) {
            const room = this.rooms[roomId];
            if (room) spawnRoomNpcs(room, config, npcConfigs);
        }
    }

    private getMurderer(): NPC | null {
        for (const room of Object.values(this.rooms)) {
            const found = room.npcs.find((n) => n.id === this.getMurdererNpcId());
            if (found) return found;
        }
        return null;
    }

    private getRoomContainingNPC(npcId: string): Room | null {
        for (const room of Object.values(this.rooms)) {
            if (room.npcs.some((n) => n.id === npcId)) return room;
        }
        return null;
    }

    private getNPCById(npcId: string): NPC | null {
        const room = this.getRoomContainingNPC(npcId);
        return room ? (room.npcs.find((n) => n.id === npcId) ?? null) : null;
    }

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

        this.victory.start(
            police,
            murderer,
            this.currentRoom,
            (npc, room, x, y) => this.moveNPCToRoom(npc, room, x, y),
            this.getRoomContainingNPC(this.getMurdererNpcId())
        );
        this.state = "victory";
        this.message = null;
    }

    isWaitingForVictoryInput(): boolean {
        return this.victory.isWaitingForInput();
    }

    returnToMenuFromVictory(): void {
        this.onVictoryComplete?.();
    }

    update(dt: number) {
        this.decorAnimTime += dt;
        this.roomTitleBanner = tickRoomTitleBanner(this.roomTitleBanner, dt);

        if (this.state === "victory") {
            this.victory.update(dt, () => this.getMurderer(), (id) => this.getNPCById(id));
            return;
        }

        if (this.input.wasPressed("escape")) {
            if (this.state === "confirming") {
                this.pendingConfirmation = null;
                this.state = "playing";
                return;
            }
            talkSounds.stopDialogue();
            this.onMenuRequest?.();
            return;
        }

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
            this.roomTransitions.tickCooldown(dt);

            const chaseTick = this.murdererChase.tick(dt);
            if (chaseTick.startChase) {
                const murderer = this.getMurderer();
                if (murderer) this.murdererChase.startMurdererChase(murderer);
            }
            if (chaseTick.spawnInRoom) {
                const murderer = this.getMurderer();
                if (murderer) {
                    this.murdererChase.spawnMurdererInRoom(murderer, this.currentRoom, this.rooms);
                }
            }

            if (this.input.wasPressed("e") || this.input.wasPressed(" ")) {
                const result = this.interaction.interact(
                    this.player,
                    this.currentRoom,
                    this.npcDialogs
                );

                if (result) {
                    if (result.confirmation) {
                        this.pendingConfirmation = result.confirmation;
                        this.state = "confirming";
                        return;
                    }

                    this.message = result.description;
                    if (result.clues.length > 0) {
                        clueSounds.playFound();
                        this.clueNotification = { clueId: result.clues[0] };
                    }
                    if (
                        result.speakerId === this.getMurdererNpcId() &&
                        this.getRequiredClueIds().every((c) => this.clueSystem.hasClue(c))
                    ) {
                        this.murdererChase.triggerAccusation();
                        this.message = result.description + " Find a police officer!";
                    }
                    if (
                        result.speakerId &&
                        POLICE_NPC_IDS.includes(result.speakerId) &&
                        this.murdererChase.accusedMurderer
                    ) {
                        talkSounds.stopDialogue();
                        this.startVictorySequence(result.speakerId);
                        return;
                    }
                    if (result.speakerId && result.speaker) {
                        const npcCfg = this.content.npcs[result.speakerId];
                        const spokenLine = extractSpokenLine(result.description, result.speaker);
                        talkSounds.startDialogue(
                            inferVoiceGender(result.speakerId, npcCfg?.spriteName),
                            spokenLine
                        );
                    }
                    this.state = "interacting";
                }
            }

            const playerCenterX = this.player.x + this.player.width / 2;
            const playerCenterY = this.player.y + this.player.height / 2;
            for (const npc of this.currentRoom.npcs) {
                if (npc.isChasing()) {
                    npc.updateChase(dt, playerCenterX, playerCenterY, this.currentRoom.map);
                    if (this.murdererChase.npcOverlapsPlayer(this.player, npc)) {
                        talkSounds.stopDialogue();
                        this.onGameOver?.();
                        return;
                    }
                }
            }

            this.handleRoomTransition();
        }

        const studyReveal = this.studySecret.update(dt);
        const cellarReveal = this.cellarSecret.update(dt);
        const revealResult =
            studyReveal?.enterDialog ? studyReveal : cellarReveal?.enterDialog ? cellarReveal : null;
        if (revealResult?.enterDialog) {
            this.message = revealResult.message;
            this.state = "interacting";
        }

        if (this.state === "confirming") {
            if (
                this.input.wasPressed("y") ||
                this.input.wasPressed("enter") ||
                this.input.wasPressed("e") ||
                this.input.wasPressed(" ")
            ) {
                const pending = this.pendingConfirmation;
                this.pendingConfirmation = null;
                if (pending && isTransitionConfirm(pending.id)) {
                    this.transitionViaInteractionExit(targetRoomFromTransitionConfirm(pending.id));
                    this.state = "playing";
                } else {
                    const handled = pending
                        ? runPuzzleConfirm(pending.id, {
                              study_secret: () => {
                                  this.studySecret.startReveal();
                                  this.state = "playing";
                              },
                              cellar_secret: () => {
                                  this.cellarSecret.startReveal();
                                  this.state = "playing";
                              }
                          })
                        : false;
                    if (!handled) {
                        this.state = "playing";
                    }
                }
            } else if (this.input.wasPressed("n")) {
                this.pendingConfirmation = null;
                this.state = "playing";
            }
        } else if (this.state === "interacting") {
            if (this.input.wasPressed("e") || this.input.wasPressed(" ")) {
                talkSounds.stopDialogue();
                this.message = null;
                this.clueNotification = null;
                this.state = "playing";
            }
        }
    }

    private transitionViaInteractionExit(targetRoomId: string): void {
        const exit = this.currentRoom.exits.find(
            (e) => e.interactionOnly && e.targetRoom === targetRoomId
        );
        if (!exit) return;

        const nextRoom = this.rooms[targetRoomId];
        if (!nextRoom) return;

        const fromRoomId = this.currentRoom.id;
        this.roomTransitions.roomTransitionCooldown = 0.65;
        this.currentRoom = nextRoom;
        this.syncRoomAmbience();
        this.roomTransitions.placePlayerAfterRoomTransition(
            this.player,
            fromRoomId,
            nextRoom,
            exit.spawnX,
            exit.spawnY
        );
        this.roomTitleBanner = createRoomTitleBanner(this.getRoomDisplayTitle(targetRoomId));

        const murderer = this.getMurderer();
        if (murderer?.isChasing()) {
            this.murdererChase.scheduleSpawnAfterRoomChange(this.player);
        }
    }

    private handleRoomTransition(): void {
        const unlocked = this.getUnlockedIds();
        const transition = this.roomTransitions.checkTransition(
            this.player,
            this.currentRoom,
            this.rooms,
            (exit) => {
                if (this.studySecret.isExitBlocked(this.currentRoom.id, exit.targetRoom)) return true;
                if (this.cellarSecret.isExitBlocked(this.currentRoom.id, exit.targetRoom)) return true;
                if (exit.requiresUnlock && !isExitUnlocked(exit.requiresUnlock, unlocked)) {
                    return true;
                }
                return false;
            }
        );

        if (!transition) return;

        this.currentRoom = transition.nextRoom;
        this.syncRoomAmbience();
        this.roomTransitions.placePlayerAfterRoomTransition(
            this.player,
            transition.fromRoomId,
            transition.nextRoom,
            transition.spawnX,
            transition.spawnY
        );
        this.roomTitleBanner = createRoomTitleBanner(this.getRoomDisplayTitle(transition.targetRoomId));

        const murderer = this.getMurderer();
        if (murderer?.isChasing()) {
            this.murdererChase.scheduleSpawnAfterRoomChange(this.player);
        }
    }

    private syncRoomAmbience(): void {
        fireplaceAmbience.syncForRoom(this.currentRoom);
        gardenAmbience.syncForRoom(this.currentRoom);
    }

    render(ctx: CanvasRenderingContext2D) {
        if (this.state === "inventory") {
            renderInventoryPanel(ctx, this.clueSystem, this.clueCatalog);
            return;
        }

        const roomPixelW = this.currentRoom.map.width * TILE_SIZE;
        const roomPixelH = this.currentRoom.map.height * TILE_SIZE;
        const needsCentering =
            roomPixelW < ctx.canvas.width || roomPixelH < ctx.canvas.height;

        ctx.fillStyle = "#222";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        const offset = needsCentering
            ? roomViewportOffset(
                  ctx.canvas.width,
                  ctx.canvas.height,
                  this.currentRoom.map.width,
                  this.currentRoom.map.height
              )
            : { x: 0, y: 0 };
        ctx.save();
        ctx.translate(offset.x, offset.y);

        renderRoomScene(ctx, this.currentRoom, {
            getAnimTime: () => this.decorAnimTime,
            extraActors: [this.player],
            skipClear: needsCentering
        });

        this.studySecret.render(ctx, this.currentRoom.id);
        this.cellarSecret.render(ctx, this.currentRoom.id);

        if (this.debugMode) {
            renderDebugOverlay(ctx, this.player, this.currentRoom, this.clueSystem);
        }

        ctx.restore();

        if (this.message) {
            drawMessageBox(ctx, this.message);
        }

        if (this.state === "confirming" && this.pendingConfirmation) {
            const confirmHint = shouldShowTouchControls()
                ? "Tap Interact to confirm    Tap Menu to cancel"
                : "E — Yes    Esc — No";
            drawMessageBox(ctx, `${this.pendingConfirmation.prompt}\n\n${confirmHint}`);
        }

        if (this.clueNotification) {
            renderClueNotification(ctx, this.clueNotification.clueId, this.clueCatalog);
        }

        if (this.roomTitleBanner) {
            drawRoomTitleBanner(ctx, this.roomTitleBanner);
        }

        drawAccusationBlink(ctx, this.murdererChase.redBlinkRemaining);

        if (this.victory.active) {
            drawVictoryOverlay(ctx, this.victory.timer);
        }
    }
}
