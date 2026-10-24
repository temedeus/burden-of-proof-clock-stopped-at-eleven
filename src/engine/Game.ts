import { Room, type DoorExit } from "../world/Room";
import { createRoomFromConfig } from "../world/Rooms";
import type { DevTeleportMoment } from "./devTeleport";
import type { Facing } from "../entities/Player";
import { renderRoomScene } from "../render/roomScene";
import { spawnRoomNpcs, resolveNpcPlacementTile } from "../world/npcSpawn";
import { Input } from "./Input";
import { Player, PlayerSpriteName } from "../entities/Player";
import { DEFAULT_PLAYER_SPRITE } from "@cse/content-schema";
import { NPC } from "../entities/NPC";
import { TILE_SIZE, roomViewportOffset } from "../world/constants";
import { HUMANOID_NATIVE_H, HUMANOID_NATIVE_W } from "../assets/procedural/characterAnimation";
import { InteractionSystem } from "../systems/InteractionSystem";
import { ClueSystem } from "../systems/ClueSystem";
import { RoomTransitionService } from "../systems/RoomTransitionService";
import { DIFFICULTY_CONFIG, MurdererChaseController, type Difficulty } from "../systems/MurdererChaseController";
import { ChaseField } from "../world/pathfinding";
import { MurdererConfrontation } from "../systems/MurdererConfrontation";
import { AtticScareChase, DEFAULT_LEDGER_SCARE_MONOLOGUE } from "../systems/AtticScareChase";
import {
    DiningFireCutscene,
    DINING_FIRE_PANIC_LINE,
    DINING_FIRE_WAKE_THOUGHT,
    HEARTH_SHOVE_HINT,
    YTTE_AFTER_ATTIC_DIALOG,
    YTTE_HELPED_DIALOG,
    diningHallDoorPosition,
    diningHearthLandingPosition,
    diningTableRetreatWaypoints,
    getFireplaceHazardBounds,
    playerNearFireplaceHazard
} from "../systems/DiningFireCutscene";
import {
    AtticWindowCutscene,
    ATTIC_WINDOW_SHOVE_HINT,
    nearestAtticWindowLanding,
    playerNearAtticWindow
} from "../systems/AtticWindowCutscene";
import { scareSounds } from "../audio/ScareSounds";
import { resolveEventNpcDialog } from "../content/eventNpcDialog";
import { drawBurningFigure, drawFireSpot, drawScorch } from "../render/fireEffects";
import { drawDragGrip } from "../render/dragGrip";
import {
    computeDiningBurnLayout,
    diningBurnActors,
    drawDiningFloorDamage,
    type DiningBurnLayout
} from "../render/diningBurnDamage";
import { furnitureActorFromInteractable, type DepthActor } from "../render/roomScene";
import type { Interactable } from "../world/Interactable";
import { BLOOD_CRATE_H, BLOOD_CRATE_W, drawCrateKey } from "../assets/procedural/bloodCrate";
import { MurdererStruggle } from "../systems/MurdererStruggle";
import { DoorBarricade } from "../systems/DoorBarricade";
import { FIGHT_OUTRO_SECONDS, FistFight } from "../systems/FistFight";
import { drawFistFightScene } from "../render/fistFightScene";
import { fightSounds } from "../audio/FightSounds";
import { carriedDoorBarActor, doorBarActor, doorBarCenter } from "../render/doorBarDraw";
import { BarDoorAnimation, facingTowardExit } from "../systems/BarDoorAnimation";
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
import { kitchenAmbience } from "../audio/KitchenAmbience";
import { huntTension } from "../audio/HuntTension";
import { atticMice } from "../systems/AtticMiceController";
import { courtyardSeagull } from "../systems/CourtyardSeagullController";
import { clueSounds } from "../audio/ClueSounds";
import { pianoSounds } from "../audio/PianoSounds";
import { harpSounds } from "../audio/HarpSounds";
import { mooseSounds } from "../audio/MooseSounds";
import { kitchenSounds } from "../audio/KitchenSounds";
import { armorSounds } from "../audio/ArmorSounds";
import { doorSounds } from "../audio/DoorSounds";
import { ballroomSounds } from "../audio/BallroomSounds";
import {
    BallroomEasterEggs,
    CHANDELIER_TREMBLE,
    WINDOW_LOOK_TEXT
} from "../systems/BallroomEasterEggs";
import { getBrokenChandelier } from "../world/ballroomChandeliers";
import {
    applyArmorCollapsedToRooms,
    isArmorCollapsed,
    setArmorCollapsed,
    startArmorCollapse,
    tickArmorCollapse
} from "../world/armorCollapse";
import { MooseLickGag } from "../systems/MooseLickGag";
import {
    KitchenPanSplash,
    nearestKitchenStove,
    PAN_SPLASH_FLIGHT,
    PAN_SPLASH_STUN_MULTIPLIER,
    STOVE_STRUGGLE_TITLE
} from "../systems/KitchenPanSplash";
import { drawMooseTongue, stuffedMooseMouth, STUFFED_MOOSE_H, STUFFED_MOOSE_W } from "../assets/procedural/stuffed_moose";
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
    DIALOG_LINES_PER_PAGE,
    paginateDialog,
    tickRoomTitleBanner,
    type RoomTitleBanner
} from "../render/GameHud";
import type { NPCConfig, NPCDialogConfig } from "@cse/content-schema";
import { shouldShowTouchControls } from "./platform";
import {
    SAVE_CONTENT_REVISION,
    SAVE_FORMAT_VERSION,
    saveGame,
    type GameSaveV1
} from "./SaveGame";
import {
    getBrokenAtticWindowIds,
    setBrokenAtticWindows
} from "../world/atticWindows";
import { resetSessionWorldState } from "./resetSessionWorldState";
import type { GameOverSceneInfo } from "../render/gameOverScene";
import { CHANDELIER_GAME_OVER_CRASH_AT } from "../render/chandelierGameOverScene";
import { GAME_OVER_STAB_AT } from "../render/gameOverScene";
import { cluesForRetry, SCRIPTED_SCENES, scenesTriggeredBy, type SceneId } from "../systems/scriptedScenes";
import { CUFF_CLICK_TIMES } from "../render/arrestScene";
import { drawDialogBubble, drawPanicBubble, SPEECH_BUBBLE_TEXT_WIDTH } from "../render/speechBubble";
import { PLAYER_SPEAKER, splitDialogSpeakers, type DialogSegment } from "../systems/dialogSpeakers";

type GameState =
    | "playing"
    | "interacting"
    | "confirming"
    | "inventory"
    | "victory"
    | "struggling"
    | "cutscene"
    | "moose_lick"
    | "armor_collapse"
    | "window_scare"
    | "chandelier_trap"
    | "pan_splash"
    | "barring_door"
    | "fist_fight";

const POLICE_NPC_IDS = ["police", "police2"];

/** Ytte goads the detective into a fist fight the first time he corners them in the secret tunnel. */
const FIST_FIGHT_TAUNT =
    "Chef Ytte: Running again, Detective? Bok bok bok! Are you a chicken?\n\n" +
    "Chef Ytte: Tell you what — I'll put the knife away. Bare knuckles. Let's see what you're made of.\n\n" +
    "You: Nobody calls me a chicken. Put 'em up, Ytte.";
const FIST_FIGHT_WON_TEXT = "Chef Ytte crumples onto the tunnel floor, out cold. Run — before he comes to!";
/** How long Ytte stays down after losing the fist fight. */
const FIST_FIGHT_KO_SECONDS = 6;

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
    /** Cached scorch layout for the dining room after the fire (keyed by room object). */
    private diningBurnCache: { room: Room; layout: DiningBurnLayout } | null = null;
    /** Set by dev teleport: this session never writes saves. */
    private devStaged = false;
    private atticWindow = new AtticWindowCutscene();
    private murdererStruggle: MurdererStruggle;
    /** Finale: the bar Ytte drops across the wine cellar door after his confession. */
    private doorBarricade: DoorBarricade;
    /** Ytte heaving the bar into place (cellar cutscene). */
    private barDoorAnim = new BarDoorAnimation();
    /** Secret tunnel brawl during the finale chase — happens once, later catches are the usual struggle. */
    private fistFight: FistFight;
    private fistFightPending = false;
    private fistFightDone = false;
    private fistFightThudPlayed = false;
    /** Chef Ytte is removed from the map after the dining scare until the attic scare ends. */
    private cookHiddenAfterDiningScare: NPC | null = null;
    /** Set after the dining fireplace cutscene; changes mid-game cook dialog. */
    private diningFireResolved = false;
    /** Baroness home pose while temporarily moved into the dining fire aftermath. */
    private baronessCutsceneHome: { roomId: string; x: number; y: number } | null = null;
    private lockedDoorHintUntil = 0;
    /** Hint for a story-locked door the player is at (e.g. the wine cellar). */
    private lockedExitHint: string | null = null;
    /** Edge-trigger for the rattle so it plays once per approach, not every frame. */
    private atLockedDoor = false;
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
    private mooseLickPending = false;
    private ballroomEggs = new BallroomEasterEggs();
    private ballroomScareDialogOpen = false;
    private mooseLick = new MooseLickGag();
    private panSplash = new KitchenPanSplash();
    /** Distance field toward the player that chasers route along. */
    private chaseField: ChaseField;
    private panSplashFallSign = 1;
    private mooseRect: { x: number; y: number; w: number; h: number } | null = null;
    private message: string | null = null;
    private messagePages: string[] = [];
    /** Who says each page (parallel to `messagePages`); speakers get a bubble, narration the box. */
    private messageSpeakers: DialogSegment[] = [];
    private messagePageIndex = 0;
    private confirmPages: string[] = [];
    private confirmPageIndex = 0;
    private pendingConfirmation: { id: string; prompt: string } | null = null;
    private clueNotification: { clueId: string } | null = null;
    private debugMode = false;
    private onMenuRequest?: () => void;
    private onGameOver?: () => void;
    /** Which game over vignette to show. */
    private gameOverCause: NonNullable<GameOverSceneInfo["cause"]> = "stabbed";
    private onVictoryComplete?: () => void;
    private readonly content = loadGameContent();
    private readonly difficulty: Difficulty;

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
            /** When continuing a save, pin the story id from the save. */
            storyId?: string | null;
        }
    ) {
        resetSessionWorldState();
        const difficulty = options?.difficulty ?? "medium";
        this.difficulty = difficulty;
        this.murdererChase = new MurdererChaseController(difficulty);
        this.chaseField = new ChaseField(DIFFICULTY_CONFIG[difficulty].chaseRepathSeconds);
        this.murdererConfrontation = new MurdererConfrontation();
        this.atticScare = new AtticScareChase(difficulty, "attic");
        this.ledgerScare = new AtticScareChase(difficulty, "dining", DEFAULT_LEDGER_SCARE_MONOLOGUE);
        this.murdererStruggle = new MurdererStruggle(difficulty);
        this.doorBarricade = new DoorBarricade(difficulty);
        this.fistFight = new FistFight(difficulty);
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

        const resolved = resolveActiveStory(options?.storyId);
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

    /** True when mid-cutscene / struggle / victory — do not checkpoint. */
    /** Runtime hooks for each scripted scene in `SCRIPTED_SCENES`. */
    private readonly scenes: Record<
        SceneId,
        { isComplete(): boolean; isActive(): boolean; setComplete(done: boolean): void; start(): void }
    > = {
        ledger_scare: {
            isComplete: () => this.ledgerScare.complete,
            isActive: () => this.ledgerScare.active,
            setComplete: (done) => {
                this.ledgerScare.complete = done;
            },
            start: () => this.ledgerScare.armAfterDialog()
        },
        attic_scare: {
            isComplete: () => this.atticScare.complete,
            isActive: () => this.atticScare.active,
            setComplete: (done) => {
                this.atticScare.complete = done;
            },
            start: () => this.atticScare.armAfterDialog()
        },
        confrontation: {
            isComplete: () => this.murdererConfrontation.complete,
            isActive: () => this.murdererConfrontation.active,
            setComplete: (done) => {
                this.murdererConfrontation.complete = done;
                this.murdererConfrontation.active = false;
            },
            start: () => this.startMurdererConfrontation()
        }
    };

    private sceneComplete(id: SceneId): boolean {
        return this.scenes[id].isComplete();
    }

    /** Start every unfinished scene triggered by these new clues; returns those started. */
    private triggerScenes(clueIds: readonly string[]): SceneId[] {
        const started = scenesTriggeredBy(clueIds).filter(
            (id) => !this.scenes[id].isComplete() && !this.scenes[id].isActive()
        );
        for (const id of started) this.scenes[id].start();
        return started;
    }

    canAutosave(): boolean {
        // Mid-scene saves would resume outside the scene; keep the save from the clue pickup.
        if (SCRIPTED_SCENES.some((s) => this.scenes[s.id].isActive())) return false;
        // Same for the finale chase: Continue replays the confrontation from the weapon pickup.
        if (this.murdererChase.accusedMurderer) return false;
        return (
            this.state === "playing" ||
            this.state === "interacting" ||
            this.state === "confirming" ||
            this.state === "inventory"
        );
    }

    snapshotSave(): GameSaveV1 | null {
        const storyId = this.activeStory?.id;
        if (!storyId) return null;
        return {
            version: SAVE_FORMAT_VERSION,
            contentRevision: SAVE_CONTENT_REVISION,
            savedAt: Date.now(),
            storyId,
            difficulty: this.difficulty,
            playerSprite: this.player.getSpriteName(),
            roomId: this.currentRoom.id,
            player: {
                x: this.player.x,
                y: this.player.y,
                facing: this.player.facing
            },
            discoveredClueIds: this.clueSystem.getAllClues(),
            studySecretRevealed: this.studySecret.revealed,
            cellarSecretRevealed: this.cellarSecret.revealed,
            diningFireResolved: this.diningFireResolved,
            completedScenes: SCRIPTED_SCENES.filter((s) => this.sceneComplete(s.id)).map((s) => s.id),
            accusedMurderer: this.murdererChase.accusedMurderer,
            cookHiddenAfterDiningScare: this.cookHiddenAfterDiningScare != null,
            brokenAtticWindowIds: getBrokenAtticWindowIds(),
            armorCollapsed: isArmorCollapsed(),
            ballroomWindowScareDone: this.ballroomEggs.windowScareDone,
            chandelierTrapArmed: this.ballroomEggs.chandelierArmed,
            brokenChandelier: getBrokenChandelier()
        };
    }

    /** Persist progress if not mid-cutscene / struggle / victory. */
    autosave(): void {
        if (this.devStaged || !this.canAutosave()) return;
        const snap = this.snapshotSave();
        if (snap) saveGame(snap);
    }

    /** Force-write current snapshot when quitting from a durable state. */
    saveCheckpoint(): void {
        if (this.devStaged || !this.canAutosave()) return;
        const snap = this.snapshotSave();
        if (snap) saveGame(snap);
    }

    /** The iron key on the stained crate's nail, shown until the player takes it. */
    private crateKeyActor(): DepthActor[] {
        const room = this.currentRoom;
        if (this.clueSystem.hasClue("cellar_evidence")) return [];
        const crate = room.interactables.find((o) => o.id === "blood_crate");
        if (!crate) return [];
        const size = { width: room.map.width, height: room.map.height };
        const actor = furnitureActorFromInteractable(crate, () => 0, size);
        const rect = actor.drawRect;
        const sx = rect.w / BLOOD_CRATE_W;
        const sy = rect.h / BLOOD_CRATE_H;
        return [
            {
                y: actor.y + actor.height + 0.5,
                height: 0,
                render: (c: CanvasRenderingContext2D) => {
                    const t = this.decorAnimTime;
                    c.save();
                    c.translate(rect.x, rect.y);
                    c.scale(sx, sy);
                    drawCrateKey(c, 0, 0, Math.sin(t * 1.3) * 0.8, t % 5 < 0.25);
                    c.restore();
                }
            }
        ];
    }

    /**
     * Permanent fire damage in the dining room once the fire is over: scorch
     * marks, burned tablecloth and rug, soot on the fireplace and ceiling.
     */
    private diningBurnDamage(): { floor: (c: CanvasRenderingContext2D) => void; actors: DepthActor[] } | null {
        const room = this.currentRoom;
        if (room.id !== "dining" || !this.diningFireResolved || this.diningFire.active) return null;
        if (this.diningBurnCache?.room !== room) {
            this.diningBurnCache = { room, layout: computeDiningBurnLayout(room) };
        }
        const layout = this.diningBurnCache.layout;
        const size = { width: room.map.width, height: room.map.height };
        const fireplaceRect = layout.fireplace
            ? furnitureActorFromInteractable(layout.fireplace, () => 0, size).drawRect
            : null;
        return {
            floor: (c) => drawDiningFloorDamage(c, layout, room.map.width * TILE_SIZE),
            actors: diningBurnActors(layout, fireplaceRect)
        };
    }

    /**
     * Dev teleport: stage the story state just before a key scene and put the
     * player beside its trigger (left for you to activate). Never autosaves.
     */
    stageDevMoment(moment: DevTeleportMoment): boolean {
        const base = this.snapshotSave();
        if (!base || !this.rooms[moment.roomId]) return false;
        this.devStaged = true;
        const f = moment.flags;
        this.applySave({
            ...base,
            roomId: moment.roomId,
            discoveredClueIds: [...moment.clues],
            studySecretRevealed: !!f.studySecretRevealed,
            cellarSecretRevealed: !!f.cellarSecretRevealed,
            diningFireResolved: !!f.diningFireResolved,
            completedScenes: [...(f.completedScenes ?? [])],
            accusedMurderer: false,
            cookHiddenAfterDiningScare: !!f.cookHiddenAfterDiningScare,
            brokenAtticWindowIds: [],
            player: { x: 0, y: 0, facing: "down" }
        });
        // Saves never resume mid-chase, so the hunt is switched on after loading
        if (f.finaleChase) this.murdererChase.accusedMurderer = true;
        if (moment.enterFrom) return this.placePlayerEnteringFrom(moment.enterFrom);
        return moment.trigger ? this.placePlayerAtTrigger(moment.trigger) : false;
    }

    /** As if the detective just came through the door from `fromRoomId` (a chasing Ytte follows). */
    private placePlayerEnteringFrom(fromRoomId: string): boolean {
        const exit = this.rooms[fromRoomId]?.exits.find((e) => e.targetRoom === this.currentRoom.id);
        if (!exit) return false;
        this.roomTransitions.placePlayerAfterRoomTransition(
            this.player,
            fromRoomId,
            this.currentRoom,
            exit.spawnX,
            exit.spawnY
        );
        // Ytte will come through the door the detective entered by
        this.handleMurdererAfterRoomChange();
        // A few steps in from the door, so the pursuer arrives behind the detective rather than on top of them
        const { map } = this.currentRoom;
        const cx = (map.width * TILE_SIZE) / 2 - this.player.width / 2;
        const cy = (map.height * TILE_SIZE) / 2 - this.player.height / 2;
        const len = Math.hypot(cx - this.player.x, cy - this.player.y);
        if (len > 0) {
            const stepX = ((cx - this.player.x) / len) * 4;
            const stepY = ((cy - this.player.y) / len) * 4;
            for (let i = 0; i < (TILE_SIZE * 3) / 4; i++) {
                const nx = this.player.x + stepX;
                const ny = this.player.y + stepY;
                if (this.player.wouldCollideAt(nx, ny, map, this.currentRoom.npcs)) break;
                this.player.x = nx;
                this.player.y = ny;
            }
        }
        return true;
    }

    private placePlayerAtTrigger(trigger: NonNullable<DevTeleportMoment["trigger"]>): boolean {
        const room = this.currentRoom;
        const { confirmId, clueId } = trigger;
        const target = room.interactables.find(
            (obj) =>
                (confirmId && obj.confirmId === confirmId) ||
                (clueId &&
                    (obj.clues?.includes(clueId) || obj.collectibleClues?.some((c) => c.clueId === clueId)))
        );
        if (!target) return false;
        const tiles = target.interactionTiles?.length ? target.interactionTiles : target.tiles;
        if (!tiles.length) return false;
        const cx = tiles.reduce((a, t) => a + t.x, 0) / tiles.length;
        const cy = tiles.reduce((a, t) => a + t.y, 0) / tiles.length;
        let best: { x: number; y: number; facing: Facing; d: number } | null = null;
        const facings: Facing[] = ["up", "down", "left", "right"];
        for (let ty = Math.floor(cy) - 5; ty <= Math.ceil(cy) + 5; ty++) {
            for (let tx = Math.floor(cx) - 5; tx <= Math.ceil(cx) + 5; tx++) {
                const x = tx * TILE_SIZE;
                const y = ty * TILE_SIZE;
                if (this.player.wouldCollideAt(x, y, room.map, room.npcs)) continue;
                for (const facing of facings) {
                    this.player.x = x;
                    this.player.y = y;
                    this.player.facing = facing;
                    if (!this.interaction.wouldTarget(this.player, target)) continue;
                    const d = Math.hypot(tx + 1 - cx, ty + 1 - cy) + (facing === "up" ? 0 : 0.01);
                    if (!best || d < best.d) best = { x, y, facing, d };
                }
            }
        }
        if (!best) return false;
        this.player.x = best.x;
        this.player.y = best.y;
        this.player.facing = best.facing;
        return true;
    }

    applySave(save: GameSaveV1): void {
        // Older saves could land mid-finale-chase with Ytte on top of the player.
        // Roll those back to just before picking up the confrontation's trigger clue.
        const rollBackFinale = save.accusedMurderer;
        if (rollBackFinale) {
            save = {
                ...save,
                accusedMurderer: false,
                completedScenes: save.completedScenes.filter((id) => id !== "confrontation")
            };
        }
        const completed = new Set(save.completedScenes);
        this.clueSystem.restoreClues(cluesForRetry(save.discoveredClueIds, completed));
        this.refreshStoryState();

        if (save.studySecretRevealed) {
            this.studySecret.applyRevealedFromSave();
        }
        if (save.cellarSecretRevealed) {
            this.cellarSecret.applyRevealedFromSave();
        }

        this.diningFireResolved = save.diningFireResolved;
        for (const { id } of SCRIPTED_SCENES) this.scenes[id].setComplete(completed.has(id));

        setBrokenAtticWindows(save.brokenAtticWindowIds);
        setArmorCollapsed(save.armorCollapsed ?? false);
        if (save.armorCollapsed) applyArmorCollapsedToRooms(this.rooms);
        this.ballroomEggs.restore(
            save.ballroomWindowScareDone ?? false,
            save.chandelierTrapArmed ?? false,
            save.brokenChandelier ?? null
        );

        const confrontationClue = SCRIPTED_SCENES.find((s) => s.id === "confrontation")!.triggerClue;
        const finaleRoom = rollBackFinale ? this.findRoomWithClue(confrontationClue) : null;
        const room = finaleRoom ?? this.rooms[save.roomId];
        if (!room) return;
        this.currentRoom = room;
        this.placePlayerFromSave(room, save.player.x, save.player.y, save.player.facing);
        if (finaleRoom) this.placePlayerAtTrigger({ clueId: confrontationClue });
        this.syncRoomAmbience();
        this.roomTitleBanner = createRoomTitleBanner(this.getRoomDisplayTitle(room.id));

        const murderer = this.getMurderer();
        if (save.cookHiddenAfterDiningScare && murderer) {
            this.hideCookAfterDiningScare(murderer);
        } else if (
            save.diningFireResolved &&
            murderer &&
            !save.accusedMurderer &&
            !completed.has("confrontation")
        ) {
            // After dining scare Ytte is either hidden or back in kitchen (post attic).
            if (completed.has("attic_scare")) {
                this.placeCookInKitchen(murderer);
            }
        } else if (completed.has("attic_scare") && murderer && !save.accusedMurderer) {
            this.placeCookInKitchen(murderer);
        }

        this.state = "playing";
        this.refreshStoryState();
    }

    private placePlayerFromSave(
        room: Room,
        x: number,
        y: number,
        facing: "up" | "down" | "left" | "right"
    ): void {
        this.player.x = x;
        this.player.y = y;
        this.player.facing = facing;
        this.roomTransitions.clampPlayerInsideRoom(this.player, room);
        if (!this.player.wouldCollideAt(this.player.x, this.player.y, room.map, room.npcs)) return;

        // Nearest free tile-aligned spot, searched in growing rings around the save position
        const ox = Math.round(this.player.x / TILE_SIZE);
        const oy = Math.round(this.player.y / TILE_SIZE);
        const maxR = Math.max(room.map.width, room.map.height);
        for (let r = 1; r <= maxR; r++) {
            let best: { x: number; y: number; d: number } | null = null;
            for (let ty = oy - r; ty <= oy + r; ty++) {
                for (let tx = ox - r; tx <= ox + r; tx++) {
                    if (Math.max(Math.abs(tx - ox), Math.abs(ty - oy)) !== r) continue;
                    const px = tx * TILE_SIZE;
                    const py = ty * TILE_SIZE;
                    if (px < 0 || py < 0) continue;
                    if (px + this.player.width > room.map.width * TILE_SIZE) continue;
                    if (py + this.player.height > room.map.height * TILE_SIZE) continue;
                    if (this.player.wouldCollideAt(px, py, room.map, room.npcs)) continue;
                    const d = Math.hypot(tx - ox, ty - oy);
                    if (!best || d < best.d) best = { x: px, y: py, d };
                }
            }
            if (best) {
                this.player.x = best.x;
                this.player.y = best.y;
                return;
            }
        }
    }

    private findRoomWithClue(clueId: string): Room | null {
        return (
            Object.values(this.rooms).find((room) =>
                room.interactables.some(
                    (obj) => obj.clues?.includes(clueId) || obj.collectibleClues?.some((c) => c.clueId === clueId)
                )
            ) ?? null
        );
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
        this.setDialogPages(text);
        this.state = "interacting";
        // Nobody freezes mid-scratch or mid-stride while the dialog is up
        for (const npc of this.currentRoom.npcs) npc.interruptIdle();
    }

    /** Paginate dialog per speaker: spoken lines wrap to bubble width, narration to the message box. */
    private setDialogPages(text: string): void {
        const segments = splitDialogSpeakers(
            text,
            (name) => this.currentRoom.npcs.find((npc) => npc.name === name)?.id ?? null
        );
        this.messagePages = [];
        this.messageSpeakers = [];
        for (const segment of segments) {
            const pages = segment.speakerId
                ? paginateDialog(this.ctx, segment.text, DIALOG_LINES_PER_PAGE, SPEECH_BUBBLE_TEXT_WIDTH)
                : paginateDialog(this.ctx, segment.text);
            for (const page of pages) {
                this.messagePages.push(page);
                this.messageSpeakers.push(segment);
            }
        }
        if (this.messagePages.length === 0) {
            this.messagePages = [text];
            this.messageSpeakers = [{ speakerId: null, speakerName: null, text }];
        }
        this.messagePageIndex = 0;
        this.message = this.messagePages[0];
    }

    /** Sprite box of whoever speaks the current page, if they are on screen. */
    private dialogSpeakerBox(speakerId: string): { x: number; y: number; w: number; h: number; labelGap: number } | null {
        if (speakerId === PLAYER_SPEAKER) {
            const h = Math.round(HUMANOID_NATIVE_H * (this.player.width / HUMANOID_NATIVE_W));
            return { x: this.player.x, y: this.player.y + this.player.height - h, w: this.player.width, h, labelGap: 2 };
        }
        const npc = this.currentRoom.npcs.find((n) => n.id === speakerId);
        if (!npc || npc.cutsceneAlpha <= 0.01) return null;
        return { ...npc.getSpriteBox(), labelGap: npc.getShowNameLabel() ? 20 : 2 };
    }

    private updateArmorCollapse(dt: number): void {
        const tick = tickArmorCollapse(dt);
        for (let i = 0; i < Math.min(tick.impacts, 2); i++) armorSounds.playClank();
        if (tick.done) {
            applyArmorCollapsedToRooms(this.rooms);
            this.openDialog(
                "CRASH! The suit of armor comes apart and clatters across the floorboards in pieces.\n\nYou: ...I'm sure it was like that when I got here."
            );
            this.autosave();
        }
    }

    private startMooseLick(): void {
        const mooses = this.currentRoom.interactables.filter((o) => o.spriteName === "stuffed_moose");
        const moose = mooses.find((o) => this.interaction.wouldTarget(this.player, o)) ?? mooses[0];
        if (!moose) return;
        const map = this.currentRoom.map;
        this.mooseRect = furnitureActorFromInteractable(moose, () => 0, {
            width: map.width,
            height: map.height,
            tileAt: (x, y) => map.getTile(x, y)
        }).drawRect;
        this.mooseLick.start(this.player, moose, map, this.currentRoom.npcs);
        this.state = "moose_lick";
    }

    private updateMooseLick(dt: number): void {
        const tick = this.mooseLick.update(dt, this.player);
        if (tick.playLick) mooseSounds.playLick();
        if (tick.done) {
            this.mooseRect = null;
            this.openDialog("You: Ugh. Moose drool. Disgusting.");
        }
    }

    /** Tongue from the tilted moose's mouth to the player's face, drawn above the player. */
    /** "Eek!" bubbles over bystanders panicking during the murderer chase. */
    private panicBubbleActors(): DepthActor[] {
        const roomW = this.currentRoom.map.width * TILE_SIZE;
        const actors: DepthActor[] = [];
        for (const npc of this.currentRoom.npcs) {
            const shout = npc.isPanicking() ? npc.getPanicShout() : null;
            if (!shout) continue;
            const box = npc.getSpriteBox();
            // Clear the name label when it is shown; clamped so the bubble stays inside the room's top edge
            const tipY = Math.max(30, box.y - (npc.getShowNameLabel() ? 20 : 2));
            actors.push({
                y: box.y,
                height: box.h,
                render: (c) => drawPanicBubble(c, shout, box.x + box.w / 2, tipY, npc.getPanicTime(), 2, roomW - 2)
            });
        }
        return actors;
    }

    private mooseTongueActors(): DepthActor[] {
        const rect = this.mooseRect;
        const ext = this.mooseLick.tongueExtension;
        if (!rect || ext <= 0) return [];
        const sx = rect.w / STUFFED_MOOSE_W;
        const sy = rect.h / STUFFED_MOOSE_H;
        const mouth = stuffedMooseMouth(this.mooseLick.tiltAngle);
        const startX = rect.x + mouth.x * sx;
        const startY = rect.y + mouth.y * sy;
        // Tongue tip slides up the player's cheek from chin to brow
        const face = this.player.getFacePoint(7 - 6 * this.mooseLick.slurp);
        const endX = startX + (face.x - startX) * ext;
        const endY = startY + (face.y - startY) * ext;
        return [{ y: 0, height: 0, render: (ctx) => drawMooseTongue(ctx, startX, startY, endX, endY, sx) }];
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
        if (this.ballroomScareDialogOpen) {
            this.ballroomScareDialogOpen = false;
            this.ballroomEggs.onScareDialogClosed();
            this.autosave();
        }
        if (this.mooseLickPending) {
            this.mooseLickPending = false;
            this.startMooseLick();
            return;
        }
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

        // Pull Ytte out of post-dining hiding so the attic scare can spawn him.
        const wasHidden = this.cookHiddenAfterDiningScare === murderer;
        if (wasHidden) {
            this.cookHiddenAfterDiningScare = null;
        }

        // After dining fire he returns to the kitchen when the attic scare ends.
        const homeRoom = wasHidden
            ? this.rooms.kitchen ?? null
            : this.getRoomContainingNPC(this.getMurdererNpcId());
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
        this.panSplash.stop();
        this.chaseField.reset();
        const murderer = this.getMurderer();
        if (!murderer) return;

        if (this.atticScare.active) {
            // After the dining fire he was hidden; leaving the attic returns him to the kitchen.
            this.atticScare.endScare(murderer, this.rooms, (npc, room, x, y) => {
                if (this.diningFireResolved) {
                    this.placeCookInKitchen(npc);
                    return;
                }
                this.moveNPCToRoom(npc, room, x, y);
            });
            this.cookHiddenAfterDiningScare = null;
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
        this.autosave();
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
        // Still available while stashed after the dining fire (needed for attic scare).
        if (this.cookHiddenAfterDiningScare?.id === this.getMurdererNpcId()) {
            return this.cookHiddenAfterDiningScare;
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

    /** After the dining ledger scare, Ytte vanishes until the attic scare ends. */
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

    private placeCookInKitchen(cook: NPC): void {
        const kitchen = this.rooms.kitchen;
        if (!kitchen) return;
        const placement = this.content.rooms.kitchen?.npcs?.find((n) => n.npcId === cook.id);
        const x = (placement ? resolveNpcPlacementTile(placement.x, kitchen.map.width) : 8) * TILE_SIZE;
        const y = (placement ? resolveNpcPlacementTile(placement.y, kitchen.map.height) : 7) * TILE_SIZE;
        cook.clearStun();
        cook.setChasing(false);
        cook.setFleeing(false);
        cook.setSwingingKnife(false);
        cook.setSpriteName(this.atticScare.complete ? "worker_man_bandaged" : "worker_man");
        cook.setName("Chef Ytte");
        cook.setShowNameLabel(true);
        this.moveNPCToRoom(cook, kitchen, x, y);
    }

    private restoreCookAfterSafeOpened(): void {
        const cook = this.cookHiddenAfterDiningScare ?? this.getMurderer();
        this.cookHiddenAfterDiningScare = null;
        if (!cook) return;
        // Already back after attic — nothing to do.
        if (this.getRoomContainingNPC(cook.id)?.id === "kitchen") return;
        this.placeCookInKitchen(cook);
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
        this.message = null;
        this.messagePages = [];
        this.messagePageIndex = 0;
        const murderer = this.getMurderer();
        const exit = this.currentRoom.exits.find((e) => !e.interactionOnly);
        if (!murderer || !exit) {
            this.beginFinaleChase();
            return;
        }
        // He bars the cellar door before the chase begins
        this.startBarDoor(murderer, exit);
        this.state = "barring_door";
    }

    private beginFinaleChase(): void {
        this.murdererChase.triggerAccusation();
        this.openDialog("Chef Ytte is after you! Find a police officer before he catches you!");
    }

    private startBarDoor(murderer: NPC, exit: DoorExit): void {
        murderer.setChasing(false);
        murderer.setSwingingKnife(false);
        murderer.setFacing(facingTowardExit(exit, this.currentRoom.map.width, this.currentRoom.map.height));
        this.barDoorAnim.start(this.currentRoom.id, exit);
    }

    /** Advance Ytte barring the door; true once he is done and turns on the detective. */
    private tickBarDoor(dt: number): boolean {
        const exit = this.barDoorAnim.exit;
        const roomId = this.barDoorAnim.roomId;
        const tick = this.barDoorAnim.tick(dt);
        this.getMurderer()?.setHeavingOverhead(this.barDoorAnim.armsUp);
        if (tick.slam && exit && roomId) {
            this.doorBarricade.place(roomId, exit);
            doorSounds.playBarSlam();
        }
        if (!tick.done) return false;
        this.barDoorAnim.stop();
        const murderer = this.getMurderer();
        if (murderer) {
            murderer.setHeavingOverhead(false);
            // Turns from the door to glare at the detective
            const dx = this.player.x - murderer.x;
            const dy = this.player.y - murderer.y;
            murderer.setFacing(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
        }
        return true;
    }

    private updateBarringDoor(dt: number): void {
        if (this.tickBarDoor(dt)) {
            this.state = "playing";
            this.beginFinaleChase();
        }
    }

    /** The plank in Ytte's hands while he heaves it up and slams it across the door. */
    private carriedBarActors(): DepthActor[] {
        const exit = this.barDoorAnim.exit;
        const murderer = this.getMurderer();
        if (!this.barDoorAnim.carrying || !exit || !murderer || this.barDoorAnim.roomId !== this.currentRoom.id) {
            return [];
        }
        const box = murderer.getSpriteBox();
        const handX = box.x + box.w / 2;
        const handY = box.y + box.h * this.barDoorAnim.carryHeight;
        const slot = doorBarCenter(this.currentRoom, exit);
        const t = this.barDoorAnim.dropT;
        const x = handX + (slot.x - handX) * t;
        const y = handY + (slot.y - handY) * t;
        // Sorted over Ytte's sprite: it is in his hands
        return [carriedDoorBarActor(this.currentRoom, exit, x, y, t, murderer.y + murderer.height + 1)];
    }

    /** Ytte stops in the tunnel to goad the detective; the fight starts when the taunt is dismissed. */
    private tauntIntoFistFight(murderer: NPC): void {
        murderer.setChasing(false);
        murderer.setSwingingKnife(false);
        const dx = this.player.x - murderer.x;
        const dy = this.player.y - murderer.y;
        murderer.setFacing(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
        this.fistFightPending = true;
        this.openDialog(FIST_FIGHT_TAUNT);
        const npcCfg = this.content.npcs[this.getMurdererNpcId()];
        talkSounds.startDialogue(
            inferVoiceGender(this.getMurdererNpcId(), npcCfg?.spriteName),
            extractSpokenLine(FIST_FIGHT_TAUNT, "Chef Ytte")
        );
    }

    private beginFistFight(): void {
        talkSounds.stopDialogue();
        this.message = null;
        this.messagePages = [];
        this.messagePageIndex = 0;
        this.fistFightPending = false;
        this.fistFightThudPlayed = false;
        this.fistFight.start();
        this.state = "fist_fight";
    }

    private updateFistFight(dt: number): void {
        const fight = this.fistFight;
        if (this.input.wasPressed("e") || this.input.wasPressed(" ")) {
            const event = fight.press();
            if (event === "dodge" || (event && fight.ducked)) fightSounds.playWhoosh();
            if (event === "hit_ytte") {
                fightSounds.playPunch(fight.result === "won");
                // Knockout blow: the slow-motion "ooaargghhh"
                if (fight.result === "won") fightSounds.playSlowMoGroan();
            }
            else if (event === "chip_ytte") fightSounds.playBlock();
        }
        for (const event of fight.tick(dt)) {
            if (event === "hit_player") fightSounds.playPunch(true);
            else if (event === "chip_player") fightSounds.playBlock();
        }
        if (fight.result === "ongoing") return;

        if (!this.fistFightThudPlayed && fight.outroTime >= FIGHT_OUTRO_SECONDS * 0.4) {
            this.fistFightThudPlayed = true;
            fightSounds.playThud();
        }
        if (fight.outroTime < FIGHT_OUTRO_SECONDS) return;

        fight.stop();
        if (fight.result === "lost") {
            // Out on the floor — Ytte reaches for the knife after all
            this.gameOverCause = "stabbed";
            scareSounds.playStab(GAME_OVER_STAB_AT);
            this.onGameOver?.();
            return;
        }

        this.fistFightDone = true;
        this.state = "playing";
        const murderer = this.getMurderer();
        if (murderer) {
            murderer.stun(FIST_FIGHT_KO_SECONDS, murderer.x >= this.player.x ? 1 : -1);
            this.murdererStruggle.beginCatchCooldown();
        }
        this.openDialog(FIST_FIGHT_WON_TEXT);
    }

    private beginStruggle(murderer: NPC): void {
        talkSounds.stopDialogue();
        murderer.setChasing(false);
        this.murdererStruggle.start();
        this.doorBarricade.cancelPry();
        this.state = "struggling";
    }

    private updateStruggle(dt: number): void {
        if (this.input.wasPressed("e") || this.input.wasPressed(" ")) {
            this.murdererStruggle.press();
        }

        const result = this.murdererStruggle.tick(dt);
        if (result === "fail") {
            this.gameOverCause = "stabbed";
            // The vignette starts now; the knife lands GAME_OVER_STAB_AT seconds in
            scareSounds.playStab(GAME_OVER_STAB_AT);
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
                if (
                    this.atticScare.active &&
                    this.currentRoom.id === "attic" &&
                    playerNearAtticWindow(this.player, this.player.width, this.player.height)
                ) {
                    this.beginAtticWindowCutscene(murderer);
                    return;
                }
                const fallSign = this.shoveMurdererAway(murderer);
                if (this.beginPanSplash(murderer, fallSign)) return;
                murderer.stun(this.murdererStruggle.stunSeconds, fallSign);
                this.murdererStruggle.beginCatchCooldown();
            }
            this.state = "playing";
        }
    }

    /** Shoved-off Ytte staggers while the detective grabs the stove's pot and douses him. */
    private beginPanSplash(murderer: NPC, fallSign: number): boolean {
        const stove = this.stoveInReachForPanSplash();
        if (!stove) return false;
        const map = this.currentRoom.map;
        const drawRect = furnitureActorFromInteractable(stove, () => 0, {
            width: map.width,
            height: map.height,
            tileAt: (x, y) => map.getTile(x, y)
        }).drawRect;
        this.panSplash.start(this.player, murderer, stove, drawRect, map, this.currentRoom.npcs);
        this.panSplashFallSign = fallSign;
        this.state = "pan_splash";
        return true;
    }

    private updatePanSplash(dt: number): void {
        const tick = this.panSplash.update(dt, this.player);
        if (tick.throwStarted) kitchenSounds.playPanSplash(PAN_SPLASH_FLIGHT);
        if (!tick.landed) return;
        const murderer = this.getMurderer();
        if (murderer) {
            murderer.stun(this.murdererStruggle.stunSeconds * PAN_SPLASH_STUN_MULTIPLIER, this.panSplashFallSign);
            this.murdererStruggle.beginCatchCooldown();
        }
        this.state = "playing";
    }

    private beginAtticWindowCutscene(murderer: NPC): void {
        talkSounds.stopDialogue();
        murderer.clearStun();
        murderer.clearCutscenePose();
        murderer.setChasing(false);
        murderer.setFleeing(false);
        murderer.setSwingingKnife(false);
        murderer.setShowNameLabel(false);

        const landing = nearestAtticWindowLanding(
            murderer.x,
            murderer.y,
            murderer.width,
            murderer.height
        );
        const fallSign = landing.x + murderer.width / 2 >= murderer.x + murderer.width / 2 ? 1 : -1;

        this.atticWindow.start(
            murderer.x,
            murderer.y,
            landing.x,
            landing.y,
            landing.tileX,
            fallSign
        );
        this.state = "cutscene";
        this.message = null;
        this.messagePages = [];
        this.messagePageIndex = 0;
    }

    private hideMurdererDuringAtticCrash(murderer: NPC): void {
        for (const room of Object.values(this.rooms)) {
            const idx = room.npcs.indexOf(murderer);
            if (idx >= 0) {
                room.npcs.splice(idx, 1);
                break;
            }
        }
        murderer.clearStun();
        murderer.clearCutscenePose();
        murderer.setChasing(false);
        murderer.setFleeing(false);
        murderer.setSwingingKnife(false);
        this.cookHiddenAfterDiningScare = murderer;
    }

    private completeAtticWindowCutscene(): void {
        const murderer = this.getMurderer();
        if (murderer) {
            this.atticScare.resolveScare(murderer);
            this.placeCookInKitchen(murderer);
        } else {
            this.atticScare.complete = true;
            this.atticScare.active = false;
            this.atticScare.monologueActive = false;
            this.atticScare.armed = false;
        }
        this.cookHiddenAfterDiningScare = null;
        this.atticWindow.reset();
        talkSounds.stopDialogue();
        this.message = null;
        this.messagePages = [];
        this.messagePageIndex = 0;
        this.state = "playing";
        this.autosave();
    }

    private updateAtticWindowCutscene(dt: number): void {
        const murderer = this.getMurderer();
        if (murderer && this.atticWindow.phase === "throw") {
            const pose = this.atticWindow.throwPose();
            murderer.x = pose.x;
            murderer.y = pose.y;
            murderer.cutsceneScale = pose.scale;
            murderer.cutsceneAlpha = pose.alpha;
            murderer.cutsceneTilt = pose.tilt;
        }

        const tick = this.atticWindow.tick(dt);
        if (tick.playCrash) {
            scareSounds.playWindowCrash();
            scareSounds.playArgh();
        }
        if (tick.hideMurderer && murderer) {
            this.hideMurdererDuringAtticCrash(murderer);
        }
        if (tick.openCry) {
            this.openCutsceneDialog(DINING_FIRE_PANIC_LINE, "cook");
        }
        if (tick.clearCry) {
            talkSounds.stopDialogue();
            this.message = null;
            this.messagePages = [];
            this.messagePageIndex = 0;
        }
        if (tick.finished) {
            this.completeAtticWindowCutscene();
        }
    }

    private beginDiningFireCutscene(murderer: NPC): void {
        talkSounds.stopDialogue();
        murderer.clearStun();
        murderer.setChasing(false);
        murderer.setFleeing(false);
        murderer.setSwingingKnife(false);

        const landing = diningHearthLandingPosition(
            this.currentRoom,
            murderer.width,
            murderer.height
        );
        const toX = landing?.x ?? murderer.x;
        const toY = landing?.y ?? murderer.y - TILE_SIZE * 2;
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

        // Unmasked, grinning: he only saves the detective because the baroness is watching
        murderer.setSpriteName("worker_man_grin");
        murderer.setName("Chef Ytte");
        murderer.setShowNameLabel(true);
        murderer.clearStun();
        murderer.clearCutscenePose();
        murderer.x = this.player.x + this.player.width * 0.55;
        murderer.y = this.player.y - TILE_SIZE * 0.15;
        this.moveNPCToRoom(murderer, dining, murderer.x, murderer.y);

        const baroness = this.getNPCById("baroness");
        if (baroness) {
            const home = this.getRoomContainingNPC("baroness");
            if (home && !this.baronessCutsceneHome) {
                this.baronessCutsceneHome = { roomId: home.id, x: baroness.x, y: baroness.y };
            }
            const door = diningHallDoorPosition(dining, baroness.width);
            // Enter from the hall door, a step into the room.
            this.moveNPCToRoom(
                baroness,
                dining,
                door.x - TILE_SIZE * 1.5,
                door.y - TILE_SIZE * 0.5
            );
        }

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
        // Take hold on the door side of the detective, grinning out at us
        const lead = this.diningFire.dragYttePosition(this.player.width);
        murderer.x = lead.x;
        murderer.y = lead.y;
        murderer.setFacing("down");

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
            murderer.clearCutscenePose();
            this.ledgerScare.active = false;
            this.ledgerScare.monologueActive = false;
            this.ledgerScare.complete = true;
            this.ledgerScare.armed = false;
            this.hideCookAfterDiningScare(murderer);
        }
        this.diningFireResolved = true;
        this.syncRoomAmbience();
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
        this.autosave();
    }

    private openCutsceneDialog(text: string, speakerId: string): void {
        this.setDialogPages(text);
        const npcCfg = this.content.npcs[speakerId];
        talkSounds.startDialogue(
            inferVoiceGender(speakerId, npcCfg?.spriteName),
            extractSpokenLine(text, npcCfg?.name ?? "Lady von Virtanen")
        );
    }

    private updateDiningFireCutscene(dt: number): void {
        const dialogPhase =
            this.diningFire.phase === "aftermath_dialog" ||
            this.diningFire.phase === "wake_dialog" ||
            this.diningFire.phase === "wake_thought";
        if (dialogPhase && (this.input.wasPressed("e") || this.input.wasPressed(" "))) {
            if (this.messagePageIndex < this.messagePages.length - 1) {
                this.messagePageIndex += 1;
                this.message = this.messagePages[this.messagePageIndex];
                return;
            }
            const result = this.diningFire.advanceDialog();
            if (result === "continue") {
                const line =
                    this.diningFire.phase === "aftermath_dialog"
                        ? this.diningFire.getAftermathLine()
                        : this.diningFire.getWakeLine();
                this.openCutsceneDialog(line, "baroness");
                return;
            }
            talkSounds.stopDialogue();
            this.message = null;
            this.messagePages = [];
            this.messagePageIndex = 0;
            if (this.diningFire.phase === "baroness_exit") {
                this.startBaronessExitWalk();
            } else if (this.diningFire.phase === "done" || !this.diningFire.active) {
                this.completeDiningFireCutscene();
            }
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

        if (murderer && (phase === "ignite" || phase === "panic_run")) {
            murderer.clearStun();
        }

        if (murderer && phase === "panic_run" && this.currentRoom.id === "dining") {
            const pos = this.diningFire.panicPosition();
            const nx = pos.x - murderer.width / 2;
            const ny = pos.y - murderer.height / 2;
            murderer.animateWalk(dt, nx - murderer.x, ny - murderer.y);
            murderer.x = nx;
            murderer.y = ny;
        }

        // The burning figure spreads fire along its path and to furniture it passes
        if (murderer && (phase === "ignite" || phase === "panic_run") && this.currentRoom.id === "dining") {
            this.diningFire.spreadFire(murderer.x + murderer.width / 2, murderer.y + murderer.height, this.currentRoom);
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

        if (
            murderer &&
            (phase === "drag_setup" || phase === "aftermath_dialog" || phase === "drag_out")
        ) {
            this.player.cutsceneFall = 1;
            this.player.isMoving = false;
            if (phase === "drag_out") {
                const p = this.diningFire.dragPlayerPosition();
                const lead = this.diningFire.dragYttePosition(this.player.width);
                const strain = this.diningFire.dragStrain();
                const dir = this.diningFire.dragDirection();
                const prevX = murderer.x;
                const prevY = murderer.y;
                this.player.x = p.x;
                this.player.y = p.y;
                // Shaking with effort mid-heave
                const shake = strain > 0.55 ? (Math.floor(this.decorAnimTime * 30) % 2 === 0 ? 1 : -1) : 0;
                murderer.x = lead.x + shake;
                murderer.y = lead.y;
                if (this.diningFire.isDragPulling()) {
                    murderer.animateWalk(dt, lead.x - prevX, lead.y - prevY);
                } else {
                    // Catching his breath, he turns to grin out at us
                    murderer.setFacing("down");
                }
                // Lean back against the dead weight
                murderer.cutsceneTilt = -(dir.x >= 0 ? 1 : -1) * 0.16 * strain;
            }
        }

        if (phase === "baroness_exit") {
            const baroness = this.getNPCById("baroness");
            if (baroness) {
                const pos = this.diningFire.baronessExitPosition();
                baroness.animateWalk(dt, pos.x - baroness.x, pos.y - baroness.y);
                baroness.x = pos.x;
                baroness.y = pos.y;
            }
        }

        const prevPhase = this.diningFire.phase;
        const tick = this.diningFire.tick(dt);

        if (prevPhase === "ignite" && this.diningFire.phase === "panic_run") {
            this.diningFire.beginPanic(this.currentRoom);
        }

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
        if (tick.openPanicCry) {
            scareSounds.playArgh();
            this.openCutsceneDialog(DINING_FIRE_PANIC_LINE, "cook");
        }
        if (tick.clearPanicCry) {
            talkSounds.stopDialogue();
            this.message = null;
            this.messagePages = [];
            this.messagePageIndex = 0;
        }
        if (tick.openAftermathDialog) {
            this.openCutsceneDialog(this.diningFire.getAftermathLine(), "baroness");
        }
        if (tick.openWakeDialog) {
            this.openCutsceneDialog(this.diningFire.getWakeLine(), "baroness");
        }
        if (tick.openWakeThought) {
            this.setDialogPages(DINING_FIRE_WAKE_THOUGHT);
        }
        if (tick.finished) {
            this.completeDiningFireCutscene();
        }
    }

    /** Finale chase only: a stove within reach turns the shove into a boiling-pan splash. */
    private stoveInReachForPanSplash(): Interactable | null {
        if (!this.murdererChase.accusedMurderer || this.currentRoom.id !== "kitchen") return null;
        return nearestKitchenStove(this.player, this.currentRoom);
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
        // Full shove, or as far as the room allows (never into furniture or walls)
        const map = this.currentRoom.map;
        for (let shove = TILE_SIZE * 1.5; shove > 0; shove -= TILE_SIZE / 4) {
            const x = murderer.x + dx * shove;
            const y = murderer.y + dy * shove;
            if (!murderer.wouldCollideAt(x, y, map)) {
                murderer.x = x;
                murderer.y = y;
                break;
            }
        }
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
        huntTension.stop();
        const police = this.getNPCById(policeId);
        const murderer = this.getMurderer();
        if (!police || !murderer) return;
        murderer.setSwingingKnife(false);

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

    /** A visible door still locked by the story (e.g. wine cellar) that the player is standing at. */
    private lockedExitNearPlayer(): DoorExit | null {
        const unlocked = this.getUnlockedIds();
        const pcx = this.player.x + this.player.width / 2;
        const pcy = this.player.y + this.player.height / 2;
        for (const exit of this.currentRoom.exits) {
            if (!exit.requiresUnlock || exit.skipDoorSprite || exit.interactionOnly) continue;
            if (isExitUnlocked(exit.requiresUnlock, unlocked)) continue;
            const dx = pcx - (exit.x + 0.5) * TILE_SIZE;
            const dy = pcy - (exit.y + 0.5) * TILE_SIZE;
            if (Math.hypot(dx, dy) < TILE_SIZE * 1.75) return exit;
        }
        return null;
    }

    /** Cast for the game over vignette (Ytte as they looked when they caught you, or the chandelier). */
    getGameOverSceneInfo(): GameOverSceneInfo {
        return {
            playerSprite: this.player.getSpriteName(),
            murdererSprite: this.getMurderer()?.getSpriteName() ?? "worker_man_grin",
            cause: this.gameOverCause
        };
    }

    returnToMenuFromVictory(): void {
        this.onVictoryComplete?.();
    }

    update(dt: number) {
        this.decorAnimTime += dt;
        if (this.state !== "pan_splash") this.panSplash.update(dt, this.player);
        atticMice.update(dt, this.currentRoom.id);
        courtyardSeagull.update(dt, this.currentRoom.id);
        this.roomTitleBanner = tickRoomTitleBanner(this.roomTitleBanner, dt);
        this.syncHuntAudio();
        this.ballroomEggs.trackRoom(this.currentRoom.id);
        this.ballroomEggs.tickVisuals(dt);

        if (this.state === "victory") {
            const sceneBefore = this.victory.sceneTime;
            this.victory.update(dt, () => this.getMurderer(), (id) => this.getNPCById(id));
            for (const at of CUFF_CLICK_TIMES) {
                if (sceneBefore < at && this.victory.sceneTime >= at) armorSounds.playCuffClick();
            }
            return;
        }

        if (this.state === "moose_lick") {
            this.updateMooseLick(dt);
            return;
        }

        if (this.state === "armor_collapse") {
            this.updateArmorCollapse(dt);
            return;
        }

        if (this.state === "window_scare") {
            const tick = this.ballroomEggs.updateScare(dt, this.player);
            if (tick.sting) ballroomSounds.playSting();
            if (tick.dialog) {
                this.openDialog(tick.dialog);
                talkSounds.startDialogue("male", extractSpokenLine(tick.dialog, "Groundskeeper"));
                this.ballroomScareDialogOpen = true;
            }
            return;
        }

        if (this.state === "chandelier_trap") {
            const dodge = this.input.wasPressed("e") || this.input.wasPressed(" ");
            const tick = this.ballroomEggs.updateTrap(
                dt,
                this.player,
                this.currentRoom.map,
                this.currentRoom.npcs,
                dodge
            );
            if (tick.crash) ballroomSounds.playCrash();
            if (tick.fatal) {
                // No autosave: Continue resumes from before the trap, still armed
                this.state = "playing";
                this.gameOverCause = "chandelier";
                window.setTimeout(() => ballroomSounds.playCrash(), CHANDELIER_GAME_OVER_CRASH_AT * 1000);
                this.onGameOver?.();
                return;
            }
            if (tick.dialog) {
                this.openDialog(tick.dialog);
                this.autosave();
            }
            return;
        }

        if (this.state === "cutscene") {
            this.lockedDoorHintUntil = Math.max(0, this.lockedDoorHintUntil - dt);
            if (this.atticWindow.active) {
                this.updateAtticWindowCutscene(dt);
            } else {
                this.updateDiningFireCutscene(dt);
            }
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

        if (this.state === "barring_door") {
            this.updateBarringDoor(dt);
            return;
        }

        if (this.state === "fist_fight") {
            this.updateFistFight(dt);
            return;
        }

        if (this.state === "pan_splash") {
            this.updatePanSplash(dt);
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
                    if (this.currentRoom.id === "secret_tunnel" && !this.fistFightDone && !this.fistFightPending) {
                        this.tauntIntoFistFight(murderer);
                        return;
                    }
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

            const barInReach = this.doorBarricade.inReach(
                this.currentRoom.id,
                this.player.x + this.player.width / 2,
                this.player.y + this.player.height / 2
            );
            const holdingAction = this.input.isDown("e") || this.input.isDown(" ");
            const pryTick = this.doorBarricade.tick(dt, holdingAction, barInReach);
            if (pryTick === "removed") doorSounds.playBarLifted();

            const actionPressed = this.input.wasPressed("e") || this.input.wasPressed(" ");
            // At the barred door the action key pries at the bar instead of interacting
            if (actionPressed && !barInReach) {
                const result = this.interaction.interact(
                    this.player,
                    this.currentRoom,
                    this.npcDialogs,
                    this.content.npcs,
                    // While Ytte hunts you nobody stops to chat — only the police can end it
                    this.murdererChase.accusedMurderer ? (npc) => POLICE_NPC_IDS.includes(npc.id) : undefined
                );

                if (!result) {
                    const windowEgg = this.ballroomEggs.interactWindow(
                        this.player,
                        this.currentRoom,
                        this.currentRoom.map,
                        this.currentRoom.npcs
                    );
                    if (windowEgg === "scare") {
                        this.state = "window_scare";
                        return;
                    }
                    if (windowEgg === "look") {
                        this.openDialog(WINDOW_LOOK_TEXT);
                        return;
                    }
                }

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
                        const cookLine = this.atticScare.complete
                            ? YTTE_AFTER_ATTIC_DIALOG
                            : YTTE_HELPED_DIALOG;
                        this.openDialog(cookLine);
                        talkSounds.startDialogue(
                            "male",
                            extractSpokenLine(cookLine, "Chef Ytte")
                        );
                        return;
                    }

                    // Either officer ends the chase — must run before event dialog overrides
                    // (Reed's weapon line would otherwise return early and skip victory).
                    if (
                        result.speakerId &&
                        POLICE_NPC_IDS.includes(result.speakerId) &&
                        this.murdererChase.accusedMurderer
                    ) {
                        talkSounds.stopDialogue();
                        this.startVictorySequence(result.speakerId);
                        return;
                    }

                    if (result.speakerId) {
                        const eventLine = resolveEventNpcDialog({
                            speakerId: result.speakerId,
                            diningFireResolved: this.diningFireResolved,
                            atticScareComplete: this.atticScare.complete,
                            hasClue: (id) => this.clueSystem.hasClue(id)
                        });
                        if (eventLine) {
                            this.openDialog(eventLine);
                            const npcCfg = this.content.npcs[result.speakerId];
                            talkSounds.startDialogue(
                                inferVoiceGender(result.speakerId, npcCfg?.spriteName),
                                extractSpokenLine(eventLine, result.speaker ?? npcCfg?.name ?? "???")
                            );
                            return;
                        }
                    }

                    this.openDialog(result.description);
                    if (result.interactionSound === "piano") {
                        pianoSounds.playChord();
                    }
                    if (result.interactionSound === "harp") {
                        harpSounds.playGlissando();
                    }
                    if (result.interactionSound === "moose_lick") {
                        this.mooseLickPending = true;
                    }
                    if (result.clues.length > 0) {
                        clueSounds.playFound();
                        this.clueNotification = { clueId: result.clues[0] };
                        this.refreshStoryState();
                        this.autosave();
                        // The confrontation opens its own dialog in place of the clue text
                        if (this.triggerScenes(result.clues).includes("confrontation")) return;
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
            const murdererLoose = this.murdererChase.accusedMurderer;
            const murdererId = this.getMurdererNpcId();
            if (this.currentRoom.npcs.some((npc) => npc.isChasing())) {
                const { map } = this.currentRoom;
                this.chaseField.update(dt, map, this.player.x, this.player.y, this.player.width, this.player.height);
            }
            const idleObstacles = [this.player, ...this.currentRoom.npcs];
            for (const npc of this.currentRoom.npcs) {
                // Bystanders wave in panic while the murderer hunts you; police keep their composure
                npc.setPanicking(
                    murdererLoose && npc.canPanic() && npc.id !== murdererId && !POLICE_NPC_IDS.includes(npc.id)
                );
                npc.tickPanic(dt);
                // Ytte stays put while a scare or the finale has him on a script
                const scripted =
                    npc.id === murdererId && (murdererLoose || this.ledgerScare.active || this.atticScare.active);
                if (
                    npc.canIdle() &&
                    !scripted &&
                    !npc.isPanicking() &&
                    !npc.isChasing() &&
                    !npc.isFleeing() &&
                    !npc.isStunned()
                ) {
                    npc.updateIdle(dt, this.currentRoom.map, idleObstacles);
                } else {
                    npc.interruptIdle();
                }
                if (npc.tickStun(dt)) {
                    this.resumeChaseAfterStun(npc);
                }
                if (npc.isChasing()) {
                    npc.updateChase(dt, playerCenterX, playerCenterY, this.currentRoom.map, this.chaseField);
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

            if (this.ballroomEggs.checkTrap(this.player, this.currentRoom)) {
                ballroomSounds.playTinkle(CHANDELIER_TREMBLE);
                this.state = "chandelier_trap";
                return;
            }

            let atLockedDoor = false;
            const lockedExit = this.lockedExitNearPlayer();
            if (lockedExit) {
                atLockedDoor = true;
                this.lockedDoorHintUntil = 0.5;
                this.lockedExitHint = `The ${this.getRoomDisplayTitle(lockedExit.targetRoom)} door is locked.`;
            }

            if (barInReach && pryTick === "idle") atLockedDoor = true;

            if (this.ledgerScare.active && this.currentRoom.id === "dining") {
                const map = this.currentRoom.map;
                const nearEdge =
                    this.player.x < TILE_SIZE * 2.5 ||
                    this.player.y < TILE_SIZE * 2.5 ||
                    this.player.x + this.player.width > (map.width - 2.5) * TILE_SIZE ||
                    this.player.y + this.player.height > (map.height - 2.5) * TILE_SIZE;
                if (nearEdge) {
                    this.lockedDoorHintUntil = 0.5;
                    atLockedDoor = true;
                }
            }

            if (this.atticScare.active && this.currentRoom.id === "attic") {
                const map = this.currentRoom.map;
                const nearEdge =
                    this.player.x < TILE_SIZE * 2.5 ||
                    this.player.y < TILE_SIZE * 2.5 ||
                    this.player.x + this.player.width > (map.width - 2.5) * TILE_SIZE ||
                    this.player.y + this.player.height > (map.height - 2.5) * TILE_SIZE;
                if (nearEdge) {
                    this.lockedDoorHintUntil = 0.5;
                    atLockedDoor = true;
                }
            }

            if (atLockedDoor && !this.atLockedDoor) doorSounds.playLockedRattle();
            this.atLockedDoor = atLockedDoor;
        }

        const studyReveal = this.studySecret.update(dt);
        const cellarReveal = this.cellarSecret.update(dt);
        const revealResult =
            studyReveal?.enterDialog ? studyReveal : cellarReveal?.enterDialog ? cellarReveal : null;
        if (revealResult?.enterDialog) {
            this.openDialog(revealResult.message);
            this.autosave();
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
                              armor_shake: () => {
                                  if (isArmorCollapsed()) {
                                      this.state = "playing";
                                      return;
                                  }
                                  startArmorCollapse();
                                  armorSounds.playRattle();
                                  this.state = "armor_collapse";
                              },
                              attic_chest: () => {
                                  this.grantConfirmClue("manor_floor_plans");
                                  this.triggerScenes(["manor_floor_plans"]);
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
                if (this.fistFightPending) {
                    this.beginFistFight();
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
        this.autosave();
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
                if (this.atticScare.active && this.currentRoom.id === "attic") {
                    return true;
                }
                if (this.doorBarricade.isBlocking(this.currentRoom.id, exit)) return true;
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
        this.autosave();
    }

    private syncRoomAmbience(): void {
        // The dining fireplace stays cold after the fire
        fireplaceAmbience.syncForRoom(
            this.currentRoom,
            !(this.currentRoom.id === "dining" && this.diningFireResolved)
        );
        gardenAmbience.syncForRoom(this.currentRoom);
        kitchenAmbience.syncForRoom(this.currentRoom);
        atticMice.syncForRoom(this.currentRoom.id);
        courtyardSeagull.syncForRoom(this.currentRoom.id);
        this.syncHuntAudio();
    }

    /** Psycho tension bed while the murderer is hunting (finale or scare chase). */
    private syncHuntAudio(): void {
        huntTension.sync(this.isKillerHunting());
    }

    private isKillerHunting(): boolean {
        if (this.state === "victory" || this.state === "cutscene") return false;
        // Entire finale after accusation (head-start, chase, stun, struggle).
        if (this.murdererChase.accusedMurderer) return true;
        // Room scares: hunting once monologue ends (chase imminent or active).
        if (this.atticScare.active && !this.atticScare.monologueActive) return true;
        if (this.ledgerScare.active && !this.ledgerScare.monologueActive) return true;
        const murderer = this.getMurderer();
        return murderer?.isChasing() === true;
    }

    render(ctx: CanvasRenderingContext2D) {
        if (this.state === "fist_fight") {
            drawFistFightScene(
                ctx,
                this.fistFight,
                {
                    playerSprite: this.player.getSpriteName(),
                    murdererSprite: this.getMurderer()?.getSpriteName() ?? "worker_man_grin"
                },
                this.decorAnimTime,
                shouldShowTouchControls()
            );
            return;
        }
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

        const murdererForFire = this.getMurderer();
        const ytteFireActors =
            this.diningFire.ytteOnFire && murdererForFire
                ? [
                      {
                          y: murdererForFire.y,
                          height: murdererForFire.height,
                          render: (c: CanvasRenderingContext2D) => {
                              const box = murdererForFire.getSpriteBox();
                              drawBurningFigure(c, box.x, box.y, box.w, box.h, this.decorAnimTime);
                          }
                      }
                  ]
                : [];
        // Ytte's grip on the detective's arm (and huffs of breath) while he hauls him out
        const dragPhase = this.diningFire.phase;
        const dragGripActors =
            this.diningFire.active &&
            murdererForFire &&
            (dragPhase === "aftermath_dialog" || dragPhase === "drag_out")
                ? [
                      {
                          // Sorted just after the detective so the hand shows on the arm
                          y: this.player.y + 1,
                          height: this.player.height,
                          render: (c: CanvasRenderingContext2D) =>
                              drawDragGrip(
                                  c,
                                  murdererForFire.getSpriteBox(),
                                  // Grip at the shoulders: the collapsed body lies head-east from the feet pivot
                                  this.player.x + this.player.width / 2 + this.player.width * 0.85,
                                  this.player.y + this.player.height * 1.02,
                                  this.diningFire.dragDirection(),
                                  dragPhase === "drag_out" ? this.diningFire.dragPauseT() : 0,
                                  this.decorAnimTime
                              )
                      }
                  ]
                : [];
        // Fires spread through the dining room, depth-sorted with the furniture they sit on
        const spreadFireActors =
            this.diningFire.active && this.currentRoom.id === "dining"
                ? this.diningFire.fires.map((spot) => ({
                      y: spot.sortY - 1,
                      height: 1,
                      render: (c: CanvasRenderingContext2D) => {
                          const view = {
                              x: spot.x,
                              y: spot.y,
                              size: this.diningFire.fireGrowth(spot),
                              maxHeight: spot.maxHeight,
                              seed: spot.seed
                          };
                          drawScorch(c, view);
                          drawFireSpot(c, view, this.decorAnimTime, 1);
                      }
                  }))
                : [];

        const burn = this.diningBurnDamage();
        const crateKey = this.crateKeyActor();
        const doorBar =
            this.doorBarricade.exit && this.doorBarricade.roomId === this.currentRoom.id
                ? [
                      doorBarActor(
                          this.currentRoom,
                          this.doorBarricade.exit,
                          Math.max(this.doorBarricade.progress, this.barDoorAnim.slamShake),
                          this.decorAnimTime
                      )
                  ]
                : [];

        renderRoomScene(ctx, this.currentRoom, {
            getAnimTime: () => this.decorAnimTime,
            getMooseTilt: () => this.mooseLick.tiltAngle,
            wallOverlay: (c) => this.ballroomEggs.renderWindow(c, this.currentRoom),
            floorDecals: (c) => {
                burn?.floor?.(c);
                this.ballroomEggs.drawFloor(c, this.currentRoom);
            },
            extraActors: [this.player, ...this.panSplash.worldActors(this.player), ...spreadFireActors, ...dragGripActors, ...(burn?.actors ?? []), ...crateKey, ...doorBar, ...this.carriedBarActors()],
            extraOverheadActors: [
                ...atticMice.getActors(() => this.decorAnimTime),
                ...courtyardSeagull.getActors(),
                ...ytteFireActors,
                ...this.mooseTongueActors(),
                ...this.panSplash.overheadActors(this.currentRoom.map.width * TILE_SIZE),
                ...this.ballroomEggs.overheadActors(this.player),
                ...this.panicBubbleActors()
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
            const segment = this.messageSpeakers[this.messagePageIndex];
            const box = segment?.speakerId ? this.dialogSpeakerBox(segment.speakerId) : null;
            if (box) {
                drawDialogBubble(ctx, this.message.split("\n"), {
                    cx: offset.x + box.x + box.w / 2,
                    aboveY: offset.y + box.y - box.labelGap,
                    belowY: offset.y + box.y + box.h + 2,
                    showContinue: this.messagePageIndex < this.messagePages.length - 1,
                    time: this.decorAnimTime
                });
            } else {
                // Speaker off screen (or narration): classic box, name restored
                const text = segment?.speakerId && segment.speakerName
                    ? `${segment.speakerName}: ${this.message}`
                    : this.message;
                drawMessageBox(ctx, text, {
                    pageIndex: this.messagePageIndex,
                    pageCount: this.messagePages.length
                });
            }
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

        if (this.state === "chandelier_trap" && this.ballroomEggs.dodgeWindowOpen) {
            drawActionHint(ctx, shouldShowTouchControls() ? "The chandelier! Tap Interact to dodge!" : "The chandelier! Press E to dodge!");
        }

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
            const nearWindow =
                this.atticScare.active &&
                this.currentRoom.id === "attic" &&
                playerNearAtticWindow(this.player, this.player.width, this.player.height);
            drawStruggleMeter(
                ctx,
                this.murdererStruggle.progress,
                shouldShowTouchControls(),
                nearHearth
                    ? "Into the fire!"
                    : nearWindow
                      ? "Out the window!"
                      : this.stoveInReachForPanSplash()
                        ? STOVE_STRUGGLE_TITLE
                        : "Push him off!"
            );
        }

        if (
            this.state === "playing" &&
            this.doorBarricade.inReach(
                this.currentRoom.id,
                this.player.x + this.player.width / 2,
                this.player.y + this.player.height / 2
            )
        ) {
            if (this.doorBarricade.progress > 0) {
                drawStruggleMeter(
                    ctx,
                    this.doorBarricade.progress,
                    shouldShowTouchControls(),
                    "Lift the bar!",
                    shouldShowTouchControls() ? "Keep holding Interact!" : "Keep holding E / Space!"
                );
            } else {
                drawActionHint(
                    ctx,
                    shouldShowTouchControls()
                        ? "Ytte barred the door! Hold Interact to lift the bar."
                        : "Ytte barred the door! Hold E to lift the bar."
                );
            }
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

        if (this.state === "playing" && this.lockedExitHint && this.lockedDoorHintUntil > 0) {
            drawActionHint(ctx, this.lockedExitHint);
        } else if (this.lockedDoorHintUntil <= 0) {
            this.lockedExitHint = null;
        }

        if (
            this.state === "playing" &&
            this.atticScare.active &&
            this.currentRoom.id === "attic" &&
            !this.atticScare.monologueActive
        ) {
            if (playerNearAtticWindow(this.player, this.player.width, this.player.height)) {
                drawActionHint(ctx, ATTIC_WINDOW_SHOVE_HINT);
            } else if (this.lockedDoorHintUntil > 0) {
                drawActionHint(ctx, "The door won't budge.");
            }
        }

        if (this.victory.active) {
            drawVictoryOverlay(ctx, this.victory.timer, this.victory.sceneTime);
        }
    }
}
