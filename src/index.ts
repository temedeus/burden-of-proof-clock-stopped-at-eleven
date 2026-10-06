import "./styles/game-shell.css";
import { Loop } from "./engine/Loop";
import { Game } from "./engine/Game";
import { Menu, MenuAction } from "./engine/Menu";
import { Input } from "./engine/Input";
import { IntroScreen } from "./engine/IntroScreen";
import { TouchControls } from "./engine/TouchControls";
import { clientToCanvas, isSimulateMobile, shouldShowTouchControls } from "./engine/platform";
import { unlockAudio } from "./audio/audioContext";
import { spriteLoader } from "./assets/SpriteLoader";
import { validateContentAtStartup } from "./content/validateAtStartup";
import { clearSave, loadSave } from "./engine/SaveGame";
import { resetSessionWorldState } from "./engine/resetSessionWorldState";
import { huntTension } from "./audio/HuntTension";
import type { PlayerSpriteName } from "@cse/content-schema";
import type { Difficulty } from "./systems/MurdererChaseController";
import type { GameSaveV1 } from "./engine/SaveGame";
import { DEFAULT_PLAYER_SPRITE } from "@cse/content-schema";
import { DEV_TELEPORT_MOMENTS, isDevTeleportEnabled } from "./engine/devTeleport";

validateContentAtStartup();

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
ctx.imageSmoothingEnabled = false;

type AppScreen = "main_menu" | "playing" | "pause_menu" | "settings" | "game_over" | "intro" | "dev_teleport";

const devTeleport = isDevTeleportEnabled();
let appScreen: AppScreen = devTeleport ? "dev_teleport" : "main_menu";
let devTeleportIndex = 0;
let game: Game | null = null;
const sharedInput = new Input();
const menu = new Menu(canvas, "main", sharedInput);
const touchControls = new TouchControls(sharedInput, document.getElementById("touch-controls")!);
let introScreen: IntroScreen | null = null;
let pendingStart: { character: PlayerSpriteName } | null = null;

const loop = new Loop();

function updateTouchControlsVisibility(): void {
    touchControls.setVisible(appScreen === "playing");
}

function setupAudioUnlock(): void {
    const shell = document.getElementById("game-shell");
    if (!shell) return;

    const unlock = () => {
        unlockAudio();
        shell.removeEventListener("pointerdown", unlock);
        shell.removeEventListener("keydown", unlock);
    };
    shell.addEventListener("pointerdown", unlock, { passive: true });
    shell.addEventListener("keydown", unlock);
}

function setupCanvasPointer(): void {
    canvas.addEventListener(
        "pointerdown",
        (e) => {
            unlockAudio();
            const { x, y } = clientToCanvas(canvas, e.clientX, e.clientY);

            if (appScreen === "playing" && game?.isInventoryOpen()) {
                game.handleInventoryPointer(x, y);
                return;
            }

            const touchUi = shouldShowTouchControls();
            if (!touchUi && e.pointerType !== "mouse") return;
            if (touchUi && e.pointerType !== "touch" && !isSimulateMobile()) return;

            if (appScreen === "intro") {
                sharedInput.tapVirtual("enter");
                return;
            }

            if (
                appScreen === "main_menu" ||
                appScreen === "pause_menu" ||
                appScreen === "settings" ||
                appScreen === "game_over"
            ) {
                const action = menu.handlePointer(x, y);
                if (action) handleMenuAction(action);
            }
        },
        { passive: true }
    );
}

updateTouchControlsVisibility();
setupAudioUnlock();
setupCanvasPointer();

function createGameOptions(opts: {
    playerSprite: PlayerSpriteName;
    difficulty?: Difficulty;
    storyId?: string | null;
}): ConstructorParameters<typeof Game>[1] {
    return {
        difficulty: opts.difficulty ?? "medium",
        playerSprite: opts.playerSprite,
        storyId: opts.storyId,
        onMenuRequest: () => {
            appScreen = "pause_menu";
            menu.setScreen("pause");
            updateTouchControlsVisibility();
        },
        onGameOver: () => {
            appScreen = "game_over";
            menu.setScreen("game_over");
            updateTouchControlsVisibility();
        },
        onVictoryComplete: () => {
            clearSave();
            resetSessionWorldState();
            game = null;
            appScreen = "main_menu";
            menu.setScreen("main");
            updateTouchControlsVisibility();
        },
        input: sharedInput
    };
}

function startFreshGame(character: PlayerSpriteName): void {
    // Drop any in-memory run and module-level world flags before intro.
    game = null;
    resetSessionWorldState();
    clearSave();
    pendingStart = { character };
    introScreen = new IntroScreen(sharedInput, character, () => {
        if (!pendingStart) return;
        // Constructor also resets session world state (belt-and-suspenders).
        game = new Game(ctx, createGameOptions({ playerSprite: pendingStart.character }));
        appScreen = "playing";
        pendingStart = null;
        introScreen = null;
        updateTouchControlsVisibility();
        game.autosave();
    });
    appScreen = "intro";
    updateTouchControlsVisibility();
}

function continueFromSave(save: GameSaveV1): void {
    game = new Game(
        ctx,
        createGameOptions({
            playerSprite: save.playerSprite,
            difficulty: save.difficulty,
            storyId: save.storyId
        })
    );
    game.applySave(save);
    appScreen = "playing";
    updateTouchControlsVisibility();
}

/** Stage a key scene from the dev teleport list (never writes saves). */
function startDevTeleport(index: number): void {
    const moment = DEV_TELEPORT_MOMENTS[index];
    if (!moment) return;
    resetSessionWorldState();
    game = new Game(ctx, createGameOptions({ playerSprite: DEFAULT_PLAYER_SPRITE }));
    if (!game.stageDevMoment(moment)) {
        console.warn(`[devTeleport] Could not place the player at "${moment.id}"`);
    }
    appScreen = "playing";
    updateTouchControlsVisibility();
}

function updateDevTeleport(): void {
    const n = DEV_TELEPORT_MOMENTS.length;
    if (sharedInput.wasPressed("arrowup") || sharedInput.wasPressed("w")) devTeleportIndex = (devTeleportIndex + n - 1) % n;
    if (sharedInput.wasPressed("arrowdown") || sharedInput.wasPressed("s")) devTeleportIndex = (devTeleportIndex + 1) % n;
    if (sharedInput.wasPressed("enter") || sharedInput.wasPressed(" ")) {
        unlockAudio();
        startDevTeleport(devTeleportIndex);
        return;
    }
    if (sharedInput.wasPressed("escape")) {
        appScreen = "main_menu";
        menu.setScreen("main");
    }
}

function renderDevTeleport(c: CanvasRenderingContext2D): void {
    const w = c.canvas.width;
    const h = c.canvas.height;
    c.fillStyle = "#14100c";
    c.fillRect(0, 0, w, h);
    c.textAlign = "left";
    c.fillStyle = "#e8c860";
    c.font = "bold 22px monospace";
    c.fillText("DEV TELEPORT", 48, 64);
    c.fillStyle = "#a89c88";
    c.font = "14px monospace";
    c.fillText("Stages the story just before a key scene. Staged runs never save.", 48, 90);
    DEV_TELEPORT_MOMENTS.forEach((m, i) => {
        const y = 140 + i * 56;
        const selected = i === devTeleportIndex;
        if (selected) {
            c.fillStyle = "rgba(232,200,96,0.14)";
            c.fillRect(36, y - 24, w - 72, 50);
        }
        c.fillStyle = selected ? "#ffffff" : "#d8ccb0";
        c.font = "bold 18px monospace";
        c.fillText(`${selected ? "▶" : " "} ${i + 1}. ${m.label}`, 48, y);
        c.fillStyle = "#8a8070";
        c.font = "14px monospace";
        c.fillText(`   ${m.roomId} — then: ${m.action}`, 48, y + 18);
    });
    c.fillStyle = "#6a6050";
    c.font = "13px monospace";
    c.fillText("↑/↓ choose · Enter jump · Esc main menu · 1–5 jump directly", 48, h - 32);
}

// Preload sprites so character select and game can draw them immediately
spriteLoader.load().then(() => {
    loop.start((dt) => {
        if (appScreen === "dev_teleport") {
            for (let i = 0; i < DEV_TELEPORT_MOMENTS.length; i++) {
                if (sharedInput.wasPressed(String(i + 1))) {
                    unlockAudio();
                    startDevTeleport(i);
                    return;
                }
            }
            updateDevTeleport();
            if (appScreen === "dev_teleport") renderDevTeleport(ctx);
            return;
        }

        if (appScreen === "intro" && introScreen) {
            introScreen.update();
            if (introScreen) introScreen.render(ctx);
            return;
        }

        if (appScreen === "playing" && game) {
            game.update(dt);
            game.render(ctx);
            // Handle victory return-to-menu in main loop so we reliably catch the key
            if (
                game.isWaitingForVictoryInput() &&
                (sharedInput.wasPressed("escape") || sharedInput.wasPressed("enter"))
            ) {
                game.returnToMenuFromVictory();
            }
            return;
        }

        if (appScreen === "game_over") {
            const action = menu.update();
            handleMenuAction(action);
            menu.render(ctx);
            return;
        }

        const action = menu.update();
        handleMenuAction(action);
        menu.render(ctx);
    });
}).catch((err) => console.error("Failed to load sprites:", err));

function handleMenuAction(action: MenuAction): void {
    if (!action) return;
    switch (action.type) {
        case "continue": {
            unlockAudio();
            const save = loadSave();
            if (!save) {
                menu.setScreen("main");
                return;
            }
            continueFromSave(save);
            break;
        }
        case "confirm_new_game":
            // Confirmed overwrite: destroy save and clear leaked module state now,
            // before character select / intro (so a prior attic break cannot linger).
            game = null;
            clearSave();
            resetSessionWorldState();
            break;
        case "start":
            unlockAudio();
            startFreshGame(action.character);
            break;
        case "open_settings":
            menu.setScreen("settings");
            break;
        case "resume":
            appScreen = "playing";
            updateTouchControlsVisibility();
            break;
        case "quit_to_menu":
            game?.saveCheckpoint();
            huntTension.stop();
            game = null;
            appScreen = devTeleport ? "dev_teleport" : "main_menu";
            menu.setScreen("main");
            updateTouchControlsVisibility();
            break;
        case "back":
            menu.setScreen(appScreen === "pause_menu" ? "pause" : "main");
            break;
    }
}
