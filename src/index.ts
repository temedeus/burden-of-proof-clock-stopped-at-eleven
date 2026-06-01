import { Loop } from "./engine/Loop";
import { Game } from "./engine/Game";
import { Menu, MenuAction } from "./engine/Menu";
import { Input } from "./engine/Input";
import { IntroScreen } from "./engine/IntroScreen";
import { spriteLoader } from "./assets/SpriteLoader";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
ctx.imageSmoothingEnabled = false;

type AppScreen = "main_menu" | "playing" | "pause_menu" | "settings" | "game_over" | "intro";

let appScreen: AppScreen = "main_menu";
let game: Game | null = null;
const sharedInput = new Input();
const menu = new Menu(canvas, "main", sharedInput);
let introScreen: IntroScreen | null = null;
let pendingStart: { difficulty: "easy" | "medium" | "hard"; character: "female_detective" | "male_detective" } | null = null;

const loop = new Loop();

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
                (sharedInput.wasPressed("escape") ||
                    sharedInput.wasPressed("enter") ||
                    sharedInput.wasPressed(" ") ||
                    sharedInput.wasPressed("e"))
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
            pendingStart = { difficulty: action.difficulty, character: action.character };
            introScreen = new IntroScreen(sharedInput, action.character, () => {
                if (!pendingStart) return;
                game = new Game(ctx, {
                    difficulty: pendingStart.difficulty,
                    playerSprite: pendingStart.character,
                    onMenuRequest: () => {
                        appScreen = "pause_menu";
                        menu.setScreen("pause");
                    },
                    onGameOver: () => {
                        appScreen = "game_over";
                        menu.setScreen("game_over");
                    },
                    onVictoryComplete: () => {
                        game = null;
                        appScreen = "main_menu";
                        menu.setScreen("main");
                    },
                    input: sharedInput
                });
                appScreen = "playing";
                pendingStart = null;
                introScreen = null;
            });
            appScreen = "intro";
            break;
        case "open_settings":
        case "open_difficulty":
            menu.setScreen(action.type === "open_settings" ? "settings" : "difficulty");
            break;
        case "resume":
            appScreen = "playing";
            break;
        case "quit_to_menu":
            game = null;
            appScreen = "main_menu";
            menu.setScreen("main");
            break;
        case "back":
            menu.setScreen(appScreen === "pause_menu" ? "pause" : "main");
            break;
    }
}
