import { Room } from "../world/Room";
import { createRoomFromConfig } from "../world/Rooms";
import { renderRoomScene } from "../render/roomScene";
import { spawnRoomNpcs, resolveNpcPlacementTile } from "../world/npcSpawn";
import { Input } from "./Input";
import { Player, PlayerSpriteName } from "../entities/Player";
import { DEFAULT_PLAYER_SPRITE } from "@cse/content-schema";
import { NPC } from "../entities/NPC";
import { TILE_SIZE, roomViewportOffset } from "../world/constants";
import { InteractionSystem } from "../systems/InteractionSystem";
import { ClueSystem } from "../systems/ClueSystem";
import { RoomTransitionService } from "../systems/RoomTransitionService";
import { MurdererChaseController, type Difficulty } from "../systems/MurdererChaseController";
import { MurdererConfrontation } from "../systems/MurdererConfrontation";
import { AtticScareChase, DEFAULT_LEDGER_SCARE_MONOLOGUE } from "../systems/AtticScareChase";
import {
    DiningFireCutscene,
    HEARTH_SHOVE_HINT,
    YTTE_HELPED_DIALOG,
    diningHallDoorPosition,
    diningTableRetreatWaypoints,
    getFireplaceHazardBounds,
    playerNearFireplaceHazard
} from "../systems/DiningFireCutscene";
import { MurdererStruggle } from "../systems/MurdererStruggle";
import { VictorySequence } from "../systems/VictorySequence";
import { StudySecretPuzzle } from "../puzzles/StudySecretPuzzle";
import { CellarSecretPuzzle } from "../puzzles/CellarSecretPuzzle";
import { isExitUnlocked, isTransitionConfirm, runPuzzleConfirm, targetRoomFromTransitionConfirm } from "../puzzles/registry";
import { spriteLoader } from "../assets/SpriteLoader";
import { isDebugMode, renderDebugOverlay } from "./DebugOverlay";
import { InventoryPanel } from "./InventoryPanel";
import { renderClueNotification } from "./ClueNotification";
import { loadGameContent, loadFurnitureCatalog } from "../content/loadGameContent";
import { applyStoryToRooms, getMurdererNpcId, getRequiredClueIds } from "../content/applyStoryToGame";
import { buildClueCatalog, getInventoryClueIds, type ClueCatalog } from "../content/clueCatalog";
import { applyStoryDialogOverrides, resolveActiveStory, type ActiveStory } from "../content/loadStoryContent";
import { fireplaceAmbience } from "../audio/FireplaceAmbience";
import { gardenAmbience } from "../audio/GardenAmbience";
import { atticMice } from "../systems/AtticMiceController";
import { courtyardSeagull } from "../systems/CourtyardSeagullController";
import { clueSounds } from "../audio/ClueSounds";
import { pianoSounds } from "../audio/PianoSounds";
import { extractSpokenLine, inferVoiceGender, talkSounds } from "../audio/TalkSounds";
import {
    createRoomTitleBanner,
    drawAccusationBlink,
    drawActionHint,
    drawDiningFireOverlay,
    drawMessageBox,
    drawRoomTitleBanner,
    drawStruggleMeter,
    drawVictoryOverlay,
    paginateDialog,
    tickRoomTitleBanner,
    type RoomTitleBanner
} from "../render/GameHud";
import type { NPCConfig, NPCDialogConfig } from "@cse/content-schema";
import { shouldShowTouchControls } from "./platform";

type GameState =
    | "playing"
    | "interacting"
    | "confirming"
    | "inventory"
    | "victory"
    | "struggling"
    | "cutscene";

const POLICE_NPC_IDS = ["police", "police2"];

const ROOM_DISPLAY_TITLES: Record<string, string> = {
    library: "Library",
    hall: "Hall",
    dancing_room: "Dancing Room",
    study: "Study",
    kitchen: "Kitchen",
    garden: "Garden",
    courtyard: "Courtyard",
    dining: "Dining Room",
    hidden_room: "Hidden Room",
    stable: "Stable",
    landing: "Landing",
    landing_west: "West Landing",
    landing_east: "East Landing",
    guest_room_a: "Guest Room A",
    guest_room_b: "Guest Room B",
    bathroom_a: "Bathroom A",
    bathroom_b: "Bathroom B",
    bathroom_master: "Master Bathroom",
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
    private murdererConfrontation: MurdererConfrontation;
    private atticScare: AtticScareChase;
    private ledgerScare: AtticScareChase;
    private diningFire = new DiningFireCutscene();
    private murdererStruggle: MurdererStruggle;
    /** Chef Ytte is removed from the map after the dining scare until the hidden-room safe is opened. */
    private cookHiddenAfterDiningScare: NPC | null = null;
    /** Set after the dining fireplace cutscene; changes mid-game cook dialog. */
    private diningFireResolved = false;
    /** Baroness home pose while temporarily moved into the dining fire aftermath. */
    private baronessCutsceneHome: { roomId: string; x: number; y: number } | null = null;
    private lockedDoorHintUntil = 0;
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
    private messagePages: string[] = [];
    private messagePageIndex = 0;
    private confirmPages: string[] = [];
    private confirmPageIndex = 0;
    private pendingConfirmation: { id: string; prompt: string } | null = null;
    private clueNotification: { clueId: string } | null = null;
    private debugMode = false;
    private onMenuRequest?: () => void;
    private onGameOver?: () => void;
    private onVictoryComplete?: () => void;
    private readonly content = loadGameContent();

    private roomTitleBanner: RoomTitleBanner | null = null;
    private decorAnimTime = 0;
    private inventoryPanel = new InventoryPanel();
    private furnitureCatalog = loadFurnitureCatalog();

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
        const difficulty = options?.difficulty ?? "medium";
        this.murdererChase = new MurdererChaseController(difficulty);
        this.murdererConfrontation = new MurdererConfrontation();
        this.atticScare = new AtticScareChase(difficulty, "attic");
        this.ledgerScare = new AtticScareChase(difficulty, "dining", DEFAULT_LEDGER_SCARE_MONOLOGUE);
        this.murdererStruggle = new MurdererStruggle(difficulty);
        this.onMenuRequest = options?.onMenuRequest;
        this.onGameOver = options?.onGameOver;
        this.onVictoryComplete = options?.onVictoryComplete;
        this.input = options?.input ?? new Input();
        this.player = new Player("player", 64, 64, options?.playerSprite ?? DEFAULT_PLAYER_SPRITE);
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
            this.murdererConfrontation = new MurdererConfrontation(
                this.activeStory.casePacket.culpritConfrontationMonologue
            );
            applyStoryToRooms(this.rooms, this.activeStory.casePacket, {
                hasClue: (id) => this.clueSystem.hasClue(id)
            });
        }

        this.loadNPCs();
        this.studySecret.applyDoorState();
        this.cellarSecret.applyDoorState();

        spriteLoader.load().catch((err) => console.error("Failed to load spritesheet:", err));

        this.currentRoom = this.rooms.hall;
        this.syncRoomAmbience();
        const hallCx = Math.floor(this.currentRoom.map.width / 2);
        const hallCy = Math.floor(this.currentRoom.map.height / 2);
        this.player.x = (hallCx - 1) * TILE_SIZE;
        this.player.y = (hallCy - 1) * TILE_SIZE;
        this.roomTransitions.clampPlayerInsideRoom(this.player, this.currentRoom);
        if (this.activeStory) {
            this.roomTitleBanner = createRoomTitleBanner(this.activeStory.title);
        } else {
            this.roomTitleBanner = createRoomTitleBanner(this.getRoomDisplayTitle("hall"));
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
        if (this.clueSystem.hasClue("cellar_evidence")) ids.add("wine_cellar_door");
        return ids;
    }

    private getRoomDisplayTitle(roomId: string): string {
        return ROOM_DISPLAY_TITLES[roomId] ?? roomId.charAt(0).toUpperCase() + roomId.slice(1);
    }

    private refreshStoryState(): void {
        if (!this.activeStory) return;
        applyStoryToRooms(this.rooms, this.activeStory.casePacket, {
            hasClue: (id) => this.clueSystem.hasClue(id)
        });
    }

    private openDialog(text: string): void {
        this.messagePages = paginateDialog(this.ctx, text);
        this.messagePageIndex = 0;
        this.message = this.messagePages[0] ?? null;
        this.state = "interacting";
    }

    private advanceOrCloseDialog(): void {
        if (this.messagePageIndex < this.messagePages.length - 1) {
            this.messagePageIndex += 1;
            this.message = this.messagePages[this.messagePageIndex];
            return;
        }
        talkSounds.stopDialogue();
        this.message = null;
        this.messagePages = [];
        this.messagePageIndex = 0;
        this.clueNotification = null;
        this.state = "playing";
        if (this.ledgerScare.armed) {
            this.beginRoomScare(this.ledgerScare, "dining");
        } else if (this.atticScare.armed) {
            this.beginRoomScare(this.atticScare, "attic");
        }
    }

    private beginRoomScare(scare: AtticScareChase, roomId: string): void {
        if (scare.complete || scare.active) {
            scare.armed = false;
            return;
        }
        if (this.currentRoom.id !== roomId) {
            scare.armed = false;
            return;
        }

        const murderer = this.getMurderer();
        const scareRoom = this.rooms[roomId];
        if (!murderer || !scareRoom) {
            scare.armed = false;
            return;
        }

        const homeRoom = this.getRoomContainingNPC(this.getMurdererNpcId());
        scare.start(murderer, scareRoom, homeRoom, (npc, room, x, y) =>
            this.moveNPCToRoom(npc, room, x, y)
        );
        this.openDialog(scare.getCurrentLine());
        talkSounds.startDialogue("male", extractSpokenLine(scare.getCurrentLine(), "???"));
    }

    private advanceRoomScareMonologue(scare: AtticScareChase): void {
        const result = scare.advanceMonologue();
        if (result === "continue") {
            this.openDialog(scare.getCurrentLine());
            talkSounds.startDialogue("male", extractSpokenLine(scare.getCurrentLine(), "???"));
            return;
        }

        talkSounds.stopDialogue();
        this.message = null;
        this.messagePages = [];
        this.messagePageIndex = 0;
        this.state = "playing";
    }

    /** Finale chase persists across rooms; attic scare ends when you leave. Dining scare cannot be escaped. */
    private handleMurdererAfterRoomChange(): void {
        const murderer = this.getMurderer();
        if (!murderer) return;

        if (this.atticScare.active) {
            this.atticScare.endScare(murderer, this.rooms, (npc, room, x, y) =>
                this.moveNPCToRoom(npc, room, x, y)
            );
            return;
        }

        if (this.murdererChase.accusedMurderer) {
            // Stunned or mid-chase — reset and respawn into the new room as usual
            murderer.clearStun();
            this.murdererChase.startMurdererChase(murderer);
            this.murdererChase.scheduleSpawnAfterRoomChange(this.player);
        }
    }

    private openConfirmDialog(prompt: string, hint: string): void {
        this.confirmPages = paginateDialog(this.ctx, `${prompt}\n\n${hint}`);
        this.confirmPageIndex = 0;
    }

    private advanceConfirmDialog(): boolean {
        if (this.confirmPageIndex < this.confirmPages.length - 1) {
            this.confirmPageIndex += 1;
            return false;
        }
        this.confirmPages = [];
        this.confirmPageIndex = 0;
        return true;
    }

    private getClueAssignmentHint(clueId: string): string {
        const assignment = this.activeStory?.casePacket.clueAssignments.find(
            (entry) => entry.clueId === clueId
        );
        return assignment?.hint ?? "You found something important.";
    }

    private grantConfirmClue(clueId: string): void {
        if (this.clueSystem.hasClue(clueId)) {
            this.openDialog(this.getClueAssignmentHint(clueId));
            return;
        }
        this.clueSystem.addClue(clueId);
        this.refreshStoryState();
        if (clueId === "smuggling_documents") {
            this.restoreCookAfterSafeOpened();
        }
        clueSounds.playFound();
        this.clueNotification = { clueId };
        this.openDialog(this.getClueAssignmentHint(clueId));
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

    /** After the dining ledger scare, Ytte vanishes until the hidden-room safe is opened. */
    private hideCookAfterDiningScare(murderer: NPC): void {
        for (const room of Object.values(this.rooms)) {
            const idx = room.npcs.indexOf(murderer);
            if (idx >= 0) {
                room.npcs.splice(idx, 1);
                break;
            }
        }
        murderer.clearStun();
        murderer.setChasing(false);
        murderer.setFleeing(false);
        murderer.setSwingingKnife(false);
        this.cookHiddenAfterDiningScare = murderer;
    }

    private restoreCookAfterSafeOpened(): void {
        const cook = this.cookHiddenAfterDiningScare;
        if (!cook) return;
        this.cookHiddenAfterDiningScare = null;
        const kitchen = this.rooms.kitchen;
        if (!kitchen) return;
        const placement = this.content.rooms.kitchen?.npcs?.find((n) => n.npcId === cook.id);
        const x = (placement ? resolveNpcPlacementTile(placement.x, kitchen.map.width) : 8) * TILE_SIZE;
        const y = (placement ? resolveNpcPlacementTile(placement.y, kitchen.map.height) : 7) * TILE_SIZE;
        this.moveNPCToRoom(cook, kitchen, x, y);
    }

    private startMurdererConfrontation(): void {
        if (this.murdererConfrontation.complete || this.murdererConfrontation.active) return;
        if (!this.clueSystem.hasClue("murder_weapon")) return;

        const murderer = this.getMurderer();
        if (!murderer) return;

        this.murdererConfrontation.start(murderer, this.currentRoom, (npc, room, x, y) =>
            this.moveNPCToRoom(npc, room, x, y)
        );
        this.openDialog(this.murdererConfrontation.getCurrentLine());
        const npcCfg = this.content.npcs[this.getMurdererNpcId()];
        talkSounds.startDialogue(
            inferVoiceGender(this.getMurdererNpcId(), npcCfg?.spriteName),
            extractSpokenLine(this.murdererConfrontation.getCurrentLine(), "Chef Ytte")
        );
    }

    private advanceMurdererConfrontation(): void {
        const advance = this.murdererConfrontation.advance();
        if (advance === "continue") {
            this.openDialog(this.murdererConfrontation.getCurrentLine());
            const npcCfg = this.content.npcs[this.getMurdererNpcId()];
            talkSounds.startDialogue(
                inferVoiceGender(this.getMurdererNpcId(), npcCfg?.spriteName),
                extractSpokenLine(this.murdererConfrontation.getCurrentLine(), "Chef Ytte")
            );
            return;
        }

        talkSounds.stopDialogue();
        this.murdererChase.triggerAccusation();
        this.openDialog("Chef Ytte is after you! Find a police officer before he catches you!");
    }

    private beginStruggle(murderer: NPC): void {
        talkSounds.stopDialogue();
        murderer.setChasing(false);
        this.murdererStruggle.start();
        this.state = "struggling";
    }

    private updateStruggle(dt: number): void {
        if (this.input.wasPressed("e") || this.input.wasPressed(" ")) {
            this.murdererStruggle.press();
        }

        const result = this.murdererStruggle.tick(dt);
        if (result === "fail") {
            this.onGameOver?.();
            return;
        }
        if (result === "success") {
            const murderer = this.getMurderer();
            if (murderer) {
                if (
                    this.ledgerScare.active &&
                    this.currentRoom.id === "dining" &&
                    playerNearFireplaceHazard(
                        this.player,
                        this.player.width,
                        this.player.height,
                        this.currentRoom
                    )
                ) {
                    this.beginDiningFireCutscene(murderer);
                    return;
                }
                const fallSign = this.shoveMurdererAway(murderer);
                murderer.stun(this.murdererStruggle.stunSeconds, fallSign);
                this.murdererStruggle.beginCatchCooldown();
            }
            this.state = "playing";
        }
    }

    private beginDiningFireCutscene(murderer: NPC): void {
        talkSounds.stopDialogue();
        murderer.clearStun();
        murderer.setChasing(false);
        murderer.setFleeing(false);
        murderer.setSwingingKnife(false);

        const hazard = getFireplaceHazardBounds(this.currentRoom);
        const toX = hazard
            ? hazard.x + hazard.w / 2 - murderer.width / 2
            : murderer.x;
        const toY = hazard ? hazard.y + TILE_SIZE * 1.5 : murderer.y - TILE_SIZE * 2;
        const fallSign = toX + murderer.width / 2 >= murderer.x + murderer.width / 2 ? 1 : -1;
        murderer.stun(0.7, fallSign);

        this.diningFire.startThrow(murderer.x, murderer.y, toX, toY);
        this.state = "cutscene";
        this.message = null;
        this.messagePages = [];
        this.messagePageIndex = 0;
    }

    private placeDiningFireDrag(): void {
        const dining = this.rooms.dining;
        const murderer = this.getMurderer();
        if (!dining || !murderer) return;

        // Stay collapsed where the retreat ended; Ytte appears unmasked beside the player.
        this.player.isMoving = false;
        this.player.cutsceneFall = 1;
        this.player.facing = "down";

        murderer.setSpriteName("worker_man");
        murderer.setName("Chef Ytte");
        murderer.setShowNameLabel(true);
        murderer.clearStun();
        murderer.x = this.player.x + this.player.width * 0.55;
        murderer.y = this.player.y - TILE_SIZE * 0.15;
        this.moveNPCToRoom(murderer, dining, murderer.x, murderer.y);

        // Drag into the hall door (west along the south wall from the collapse spot).
        const door = diningHallDoorPosition(dining, this.player.width);
        this.diningFire.beginDrag(
            this.player.x,
            this.player.y,
            murderer.x,
            murderer.y,
            door.x,
            door.y
        );

        this.currentRoom = dining;
        this.syncRoomAmbience();
    }

    private placeDiningFireWake(): void {
        const guest = this.rooms.guest_room_a;
        if (!guest) return;

        this.player.cutsceneFall = 0;
        this.player.isMoving = false;

        const bed = guest.interactables.find((obj) => obj.id === "guest_bed");
        if (bed?.tiles?.length) {
            const tx = bed.tiles.reduce((s, t) => s + t.x, 0) / bed.tiles.length;
            const ty = bed.tiles.reduce((s, t) => s + t.y, 0) / bed.tiles.length;
            this.player.x = tx * TILE_SIZE;
            this.player.y = (ty + 1) * TILE_SIZE;
        } else {
            this.player.x = (guest.map.width / 2) * TILE_SIZE;
            this.player.y = 5 * TILE_SIZE;
        }
        this.player.facing = "down";

        const baroness = this.getNPCById("baroness");
        if (baroness) {
            const home = this.getRoomContainingNPC("baroness");
            if (home && !this.baronessCutsceneHome) {
                this.baronessCutsceneHome = { roomId: home.id, x: baroness.x, y: baroness.y };
            }
            this.moveNPCToRoom(
                baroness,
                guest,
                this.player.x + this.player.width + TILE_SIZE,
                this.player.y
            );
        }

        this.currentRoom = guest;
        this.syncRoomAmbience();
        this.roomTitleBanner = createRoomTitleBanner(this.getRoomDisplayTitle("guest_room_a"));
    }

    private startBaronessExitWalk(): void {
        const baroness = this.getNPCById("baroness");
        const guest = this.rooms.guest_room_a;
        if (!baroness || !guest) return;

        const exit = guest.exits.find((e) => e.targetRoom === "landing") ?? guest.exits[0];
        const toX = exit
            ? (typeof exit.x === "number" ? exit.x : guest.map.width / 2) * TILE_SIZE
            : (guest.map.width / 2) * TILE_SIZE;
        const toY = exit
            ? (typeof exit.y === "number" ? exit.y : guest.map.height - 1) * TILE_SIZE
            : (guest.map.height - 2) * TILE_SIZE;
        this.diningFire.beginBaronessExit(baroness.x, baroness.y, toX, toY);
    }

    private restoreBaronessAfterCutscene(): void {
        const baroness = this.getNPCById("baroness");
        const home = this.baronessCutsceneHome;
        this.baronessCutsceneHome = null;
        if (!baroness || !home) return;
        const room = this.rooms[home.roomId];
        if (!room) return;
        this.moveNPCToRoom(baroness, room, home.x, home.y);
    }

    private finishDiningFireDrag(): void {
        const murderer = this.getMurderer();
        if (murderer) {
            this.ledgerScare.active = false;
            this.ledgerScare.monologueActive = false;
            this.ledgerScare.complete = true;
            this.ledgerScare.armed = false;
            this.hideCookAfterDiningScare(murderer);
        }
        this.diningFireResolved = true;
    }

    private completeDiningFireCutscene(): void {
        this.player.cutsceneFall = 0;
        this.player.isMoving = false;
        this.diningFire.reset();
        this.message = null;
        this.messagePages = [];
        this.messagePageIndex = 0;
        this.state = "playing";
        this.restoreBaronessAfterCutscene();
    }

    private openCutsceneDialog(text: string, speakerId: string): void {
        this.messagePages = paginateDialog(this.ctx, text);
        this.messagePageIndex = 0;
        this.message = this.messagePages[0] ?? null;
        const npcCfg = this.content.npcs[speakerId];
        talkSounds.startDialogue(
            inferVoiceGender(speakerId, npcCfg?.spriteName),
            extractSpokenLine(text, npcCfg?.name ?? "Lady von Virtanen")
        );
    }

    private updateDiningFireCutscene(dt: number): void {
        if (
            this.diningFire.phase === "wake_dialog" &&
            (this.input.wasPressed("e") || this.input.wasPressed(" "))
        ) {
            if (this.messagePageIndex < this.messagePages.length - 1) {
                this.messagePageIndex += 1;
                this.message = this.messagePages[this.messagePageIndex];
                return;
            }
            const result = this.diningFire.advanceDialog();
            if (result === "continue") {
                this.openCutsceneDialog(this.diningFire.getWakeLine(), "baroness");
                return;
            }
            talkSounds.stopDialogue();
            this.message = null;
            this.messagePages = [];
            this.messagePageIndex = 0;
            this.startBaronessExitWalk();
            return;
        }

        const murderer = this.getMurderer();
        const phase = this.diningFire.phase;

        if (murderer && phase === "throw_into_fire") {
            const pos = this.diningFire.throwPosition();
            murderer.x = pos.x;
            murderer.y = pos.y;
            murderer.tickStun(dt);
        }

        if (murderer && phase === "panic_run" && this.currentRoom.id === "dining") {
            murderer.clearStun();
            const pos = this.diningFire.panicPosition(
                this.currentRoom.map.width,
                this.currentRoom.map.height
            );
            murderer.x = pos.x;
            murderer.y = pos.y;
        }

        if (phase === "player_retreat") {
            const pos = this.diningFire.retreatPosition();
            this.player.x = pos.x;
            this.player.y = pos.y;
            this.player.facing = this.diningFire.retreatFacing();
            this.player.cutsceneFall = 0;
            if (this.diningFire.retreatT < 1) {
                this.player.advanceCutsceneWalk(dt);
            } else {
                this.player.isMoving = false;
            }
        }

        if (phase === "player_collapse") {
            this.player.isMoving = false;
            this.player.cutsceneFall = this.diningFire.collapseT;
        }

        if (murderer && (phase === "drag_setup" || phase === "drag_out")) {
            this.player.cutsceneFall = 1;
            this.player.isMoving = false;
            if (phase === "drag_out") {
                const p = this.diningFire.dragPlayerPosition();
                const y = this.diningFire.dragYttePosition(this.player.width);
                this.player.x = p.x;
                this.player.y = p.y;
                murderer.x = y.x;
                murderer.y = y.y;
            }
        }

        if (phase === "baroness_exit") {
            const baroness = this.getNPCById("baroness");
            if (baroness) {
                const pos = this.diningFire.baronessExitPosition();
                baroness.x = pos.x;
                baroness.y = pos.y;
            }
        }

        const prevPhase = this.diningFire.phase;
        const tick = this.diningFire.tick(dt);

        if (prevPhase === "panic_run" && this.diningFire.phase === "player_retreat") {
            const [via, to] = diningTableRetreatWaypoints(
                this.currentRoom,
                this.player.x,
                this.player.y,
                this.player.width
            );
            this.diningFire.beginRetreat(
                this.player.x,
                this.player.y,
                via.x,
                via.y,
                to.x,
                to.y
            );
        }

        if (tick.placeDrag) this.placeDiningFireDrag();
        if (tick.hideCookAndFinishDrag) this.finishDiningFireDrag();
        if (tick.placeWake) this.placeDiningFireWake();
        if (tick.openWakeDialog) {
            this.openCutsceneDialog(this.diningFire.getWakeLine(), "baroness");
        }
        if (tick.finished) {
            this.completeDiningFireCutscene();
        }
    }

    /** Shoves the murderer away; returns tip direction for the fall animation. */
    private shoveMurdererAway(murderer: NPC): number {
        const px = this.player.x + this.player.width / 2;
        const py = this.player.y + this.player.height / 2;
        const mx = murderer.x + murderer.width / 2;
        const my = murderer.y + murderer.height / 2;
        let dx = mx - px;
        let dy = my - py;
        const len = Math.hypot(dx, dy) || 1;
        dx /= len;
        dy /= len;
        const shove = TILE_SIZE * 1.5;
        murderer.x += dx * shove;
        murderer.y += dy * shove;
        return dx >= 0 ? 1 : -1;
    }

    private resumeChaseAfterStun(npc: NPC): void {
        if (this.murdererChase.accusedMurderer) {
            this.murdererChase.startMurdererChase(npc);
            return;
        }
        if (this.atticScare.active || this.ledgerScare.active) {
            npc.setChasing(true);
            npc.setSwingingKnife(true);
        }
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
        this.messagePages = [];
        this.messagePageIndex = 0;
    }

    isWaitingForVictoryInput(): boolean {
        return this.victory.isWaitingForInput();
    }

    isInventoryOpen(): boolean {
        return this.state === "inventory";
    }

    handleInventoryPointer(x: number, y: number): void {
        if (this.state !== "inventory") return;
        const layout = this.inventoryPanel.getLayoutForHitTest(this.ctx, this.clueSystem, this.clueCatalog);
        const hit = this.inventoryPanel.handlePointer(x, y, this.clueSystem, this.clueCatalog, layout);
        if (hit === "backdrop") {
            this.state = "playing";
        }
    }

    returnToMenuFromVictory(): void {
        this.onVictoryComplete?.();
    }

    update(dt: number) {
        this.decorAnimTime += dt;
        atticMice.update(dt, this.currentRoom.id);
        courtyardSeagull.update(dt, this.currentRoom.id);
        this.roomTitleBanner = tickRoomTitleBanner(this.roomTitleBanner, dt);

        if (this.state === "victory") {
            this.victory.update(dt, () => this.getMurderer(), (id) => this.getNPCById(id));
            return;
        }

        if (this.state === "cutscene") {
            this.lockedDoorHintUntil = Math.max(0, this.lockedDoorHintUntil - dt);
            this.updateDiningFireCutscene(dt);
            return;
        }

        this.lockedDoorHintUntil = Math.max(0, this.lockedDoorHintUntil - dt);

        if (this.input.wasPressed("escape")) {
            if (this.state === "confirming") {
                this.pendingConfirmation = null;
                this.confirmPages = [];
                this.confirmPageIndex = 0;
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
                this.inventoryPanel.reset();
                this.state = "inventory";
            }
            return;
        }

        if (this.state === "inventory") {
            const clues = getInventoryClueIds(this.clueSystem.getAllClues(), this.clueCatalog);
            const layout = this.inventoryPanel.getLayoutForHitTest(this.ctx, this.clueSystem, this.clueCatalog);
            this.inventoryPanel.update(
                this.input,
                this.clueSystem,
                this.clueCatalog,
                layout.cols,
                clues.length
            );
            return;
        }

        if (this.state === "struggling") {
            this.updateStruggle(dt);
            return;
        }

        if (this.state === "playing") {
            this.murdererStruggle.tick(dt);
            this.player.update(dt, this.input, this.currentRoom.map, this.currentRoom.npcs, this.currentRoom.interactables);
            this.roomTransitions.tickCooldown(dt);

            const chaseTick = this.murdererChase.tick(dt);
            if (chaseTick.startChase) {
                const murderer = this.getMurderer();
                if (murderer) this.murdererChase.startMurdererChase(murderer);
            }
            if (chaseTick.spawnInRoom) {
                const murderer = this.getMurderer();
                if (murderer) {
                    murderer.clearStun();
                    this.murdererChase.spawnMurdererInRoom(murderer, this.currentRoom, this.rooms);
                    this.murdererChase.startMurdererChase(murderer);
                }
            }

            const ledgerTick = this.ledgerScare.tick(dt);
            if (ledgerTick.startChase) {
                const murderer = this.getMurderer();
                if (murderer) this.ledgerScare.beginChase(murderer);
            }

            const scareTick = this.atticScare.tick(dt);
            if (scareTick.startChase) {
                const murderer = this.getMurderer();
                if (murderer) this.atticScare.beginChase(murderer);
            }

            if (this.input.wasPressed("e") || this.input.wasPressed(" ")) {
                const result = this.interaction.interact(
                    this.player,
                    this.currentRoom,
                    this.npcDialogs,
                    this.content.npcs
                );

                if (result) {
                    if (result.confirmation) {
                        this.pendingConfirmation = result.confirmation;
                        const confirmHint = shouldShowTouchControls()
                            ? "Tap Interact to confirm    Tap Menu to cancel"
                            : "E — Yes    Esc — No";
                        this.openConfirmDialog(result.confirmation.prompt, confirmHint);
                        this.state = "confirming";
                        return;
                    }

                    if (
                        result.speakerId === "cook" &&
                        this.diningFireResolved &&
                        !this.clueSystem.hasClue("bloody_apron")
                    ) {
                        this.openDialog(YTTE_HELPED_DIALOG);
                        talkSounds.startDialogue(
                            "male",
                            extractSpokenLine(YTTE_HELPED_DIALOG, "Chef Ytte")
                        );
                        return;
                    }

                    this.openDialog(result.description);
                    if (result.interactionSound === "piano") {
                        pianoSounds.playChord();
                    }
                    if (result.clues.length > 0) {
                        clueSounds.playFound();
                        this.clueNotification = { clueId: result.clues[0] };
                        this.refreshStoryState();
                        if (result.clues.includes("murder_weapon")) {
                            this.startMurdererConfrontation();
                            return;
                        }
                        if (result.clues.includes("burned_ledger_page")) {
                            if (!this.ledgerScare.complete && !this.ledgerScare.active) {
                                this.ledgerScare.armAfterDialog();
                            }
                        }
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
                }
            }

            const playerCenterX = this.player.x + this.player.width / 2;
            const playerCenterY = this.player.y + this.player.height / 2;
            for (const npc of this.currentRoom.npcs) {
                if (npc.tickStun(dt)) {
                    this.resumeChaseAfterStun(npc);
                }
                if (npc.isChasing()) {
                    npc.updateChase(dt, playerCenterX, playerCenterY, this.currentRoom.map);
                    if (
                        this.murdererStruggle.canCatch() &&
                        this.murdererChase.npcOverlapsPlayer(this.player, npc)
                    ) {
                        this.beginStruggle(npc);
                        return;
                    }
                }
            }

            this.handleRoomTransition();

            if (this.ledgerScare.active && this.currentRoom.id === "dining") {
                const map = this.currentRoom.map;
                const nearEdge =
                    this.player.x < TILE_SIZE * 2.5 ||
                    this.player.y < TILE_SIZE * 2.5 ||
                    this.player.x + this.player.width > (map.width - 2.5) * TILE_SIZE ||
                    this.player.y + this.player.height > (map.height - 2.5) * TILE_SIZE;
                if (nearEdge) this.lockedDoorHintUntil = 0.5;
            }
        }

        const studyReveal = this.studySecret.update(dt);
        const cellarReveal = this.cellarSecret.update(dt);
        const revealResult =
            studyReveal?.enterDialog ? studyReveal : cellarReveal?.enterDialog ? cellarReveal : null;
        if (revealResult?.enterDialog) {
            this.openDialog(revealResult.message);
        }

        if (this.state === "confirming") {
            if (this.input.wasPressed("escape") || this.input.wasPressed("n")) {
                this.pendingConfirmation = null;
                this.confirmPages = [];
                this.confirmPageIndex = 0;
                this.state = "playing";
            } else if (
                this.input.wasPressed("y") ||
                this.input.wasPressed("enter") ||
                this.input.wasPressed("e") ||
                this.input.wasPressed(" ")
            ) {
                if (!this.advanceConfirmDialog()) {
                    return;
                }

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
                              },
                              hidden_cabinet: () => {
                                  this.grantConfirmClue("smuggling_documents");
                              },
                              attic_chest: () => {
                                  this.grantConfirmClue("manor_floor_plans");
                                  if (!this.atticScare.complete && !this.atticScare.active) {
                                      this.atticScare.armAfterDialog();
                                  }
                              }
                          })
                        : false;
                    if (!handled) {
                        this.state = "playing";
                    }
                }
            }
        } else if (this.state === "interacting") {
            if (this.input.wasPressed("e") || this.input.wasPressed(" ")) {
                if (this.messagePageIndex < this.messagePages.length - 1) {
                    this.advanceOrCloseDialog();
                    return;
                }
                if (this.murdererConfrontation.active) {
                    this.advanceMurdererConfrontation();
                    return;
                }
                if (this.ledgerScare.monologueActive) {
                    this.advanceRoomScareMonologue(this.ledgerScare);
                    return;
                }
                if (this.atticScare.monologueActive) {
                    this.advanceRoomScareMonologue(this.atticScare);
                    return;
                }
                this.advanceOrCloseDialog();
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

        this.handleMurdererAfterRoomChange();
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
                if (this.ledgerScare.active && this.currentRoom.id === "dining") {
                    return true;
                }
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

        this.handleMurdererAfterRoomChange();
    }

    private syncRoomAmbience(): void {
        fireplaceAmbience.syncForRoom(this.currentRoom);
        gardenAmbience.syncForRoom(this.currentRoom);
        atticMice.syncForRoom(this.currentRoom.id);
        courtyardSeagull.syncForRoom(this.currentRoom.id);
    }

    render(ctx: CanvasRenderingContext2D) {
        if (this.state === "inventory") {
            this.inventoryPanel.render(
                ctx,
                this.clueSystem,
                this.clueCatalog,
                this.activeStory?.casePacket.clueAssignments,
                this.furnitureCatalog,
                this.content.npcs
            );
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
            extraOverheadActors: [
                ...atticMice.getActors(() => this.decorAnimTime),
                ...courtyardSeagull.getActors()
            ],
            skipClear: needsCentering
        });

        this.studySecret.render(ctx, this.currentRoom.id);
        this.cellarSecret.render(ctx, this.currentRoom.id);

        if (this.debugMode) {
            renderDebugOverlay(ctx, this.player, this.currentRoom, this.clueSystem);
        }

        ctx.restore();

        if (this.diningFire.active) {
            drawDiningFireOverlay(
                ctx,
                this.diningFire.smokeAlpha,
                this.diningFire.blackAlpha,
                this.diningFire.flameIntensity,
                this.decorAnimTime
            );
        }

        if (this.message) {
            drawMessageBox(ctx, this.message, {
                pageIndex: this.messagePageIndex,
                pageCount: this.messagePages.length
            });
        }

        if (this.state === "confirming" && this.pendingConfirmation && this.confirmPages.length > 0) {
            drawMessageBox(ctx, this.confirmPages[this.confirmPageIndex], {
                pageIndex: this.confirmPageIndex,
                pageCount: this.confirmPages.length
            });
        }

        if (this.clueNotification) {
            renderClueNotification(ctx, this.clueNotification.clueId, this.clueCatalog);
        }

        if (this.roomTitleBanner) {
            drawRoomTitleBanner(ctx, this.roomTitleBanner);
        }

        drawAccusationBlink(
            ctx,
            Math.max(
                this.murdererChase.redBlinkRemaining,
                this.atticScare.redBlinkRemaining,
                this.ledgerScare.redBlinkRemaining
            )
        );

        if (this.state === "struggling") {
            const nearHearth =
                this.ledgerScare.active &&
                this.currentRoom.id === "dining" &&
                playerNearFireplaceHazard(
                    this.player,
                    this.player.width,
                    this.player.height,
                    this.currentRoom
                );
            drawStruggleMeter(
                ctx,
                this.murdererStruggle.progress,
                shouldShowTouchControls(),
                nearHearth ? "Into the fire!" : "Push him off!"
            );
        }

        if (
            this.state === "playing" &&
            this.ledgerScare.active &&
            this.currentRoom.id === "dining" &&
            !this.ledgerScare.monologueActive
        ) {
            if (
                playerNearFireplaceHazard(
                    this.player,
                    this.player.width,
                    this.player.height,
                    this.currentRoom
                )
            ) {
                drawActionHint(ctx, HEARTH_SHOVE_HINT);
            } else if (this.lockedDoorHintUntil > 0) {
                drawActionHint(ctx, "The doors won't budge.");
            }
        }

        if (this.victory.active) {
            drawVictoryOverlay(ctx, this.victory.timer);
        }
    }
}
