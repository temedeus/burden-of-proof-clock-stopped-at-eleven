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

validateContentAtStartup();

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
ctx.imageSmoothingEnabled = false;

type AppScreen = "main_menu" | "playing" | "pause_menu" | "settings" | "game_over" | "intro";

let appScreen: AppScreen = "main_menu";
let game: Game | null = null;
const sharedInput = new Input();
const menu = new Menu(canvas, "main", sharedInput);
const touchControls = new TouchControls(sharedInput, document.getElementById("touch-controls")!);
let introScreen: IntroScreen | null = null;
let pendingStart: { character: "female_detective" | "male_detective" } | null = null;

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
            const touchUi = shouldShowTouchControls();
            if (!touchUi && e.pointerType !== "mouse") return;
            if (touchUi && e.pointerType !== "touch" && !isSimulateMobile()) return;

            unlockAudio();
            const { x, y } = clientToCanvas(canvas, e.clientX, e.clientY);

            if (appScreen === "intro") {
                sharedInput.tapVirtual("enter");
                return;
            }

            if (appScreen === "playing" && game?.isInventoryOpen()) {
                game.handleInventoryPointer(x, y);
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

// Preload sprites so character select and game can draw them immediately
spriteLoader.load().then(() => {
    loop.start((dt) => {
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
        case "start":
            unlockAudio();
            pendingStart = { character: action.character };
            introScreen = new IntroScreen(sharedInput, action.character, () => {
                if (!pendingStart) return;
                game = new Game(ctx, {
                    difficulty: "medium",
                    playerSprite: pendingStart.character,
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
                        game = null;
                        appScreen = "main_menu";
                        menu.setScreen("main");
                        updateTouchControlsVisibility();
                    },
                    input: sharedInput
                });
                appScreen = "playing";
                pendingStart = null;
                introScreen = null;
                updateTouchControlsVisibility();
            });
            appScreen = "intro";
            updateTouchControlsVisibility();
            break;
        case "open_settings":
            menu.setScreen("settings");
            break;
        case "resume":
            appScreen = "playing";
            updateTouchControlsVisibility();
            break;
        case "quit_to_menu":
            game = null;
            appScreen = "main_menu";
            menu.setScreen("main");
            updateTouchControlsVisibility();
            break;
        case "back":
            menu.setScreen(appScreen === "pause_menu" ? "pause" : "main");
            break;
    }
}
