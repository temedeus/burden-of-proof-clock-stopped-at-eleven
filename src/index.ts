import { Loop } from "./engine/Loop";
import { Game } from "./engine/Game";
import { Menu, MenuAction } from "./engine/Menu";
<<<<<<< Updated upstream
=======
import { Input } from "./engine/Input";
>>>>>>> Stashed changes

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

type AppScreen = "main_menu" | "playing" | "pause_menu" | "settings";

let appScreen: AppScreen = "main_menu";
let game: Game | null = null;
<<<<<<< Updated upstream
const menu = new Menu(canvas, "main");
=======
const sharedInput = new Input();
const menu = new Menu(canvas, "main", sharedInput);
>>>>>>> Stashed changes

const loop = new Loop();

function handleMenuAction(action: MenuAction): void {
    if (!action) return;
    switch (action.type) {
        case "start":
            game = new Game(ctx, {
                difficulty: action.difficulty,
                onMenuRequest: () => {
                    appScreen = "pause_menu";
                    menu.setScreen("pause");
<<<<<<< Updated upstream
                }
=======
                },
                input: sharedInput
>>>>>>> Stashed changes
            });
            appScreen = "playing";
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
        case "quit_game":
            if (appScreen === "pause_menu") {
                game = null;
                appScreen = "main_menu";
                menu.setScreen("main");
            } else {
                window.close();
            }
            break;
        case "back":
<<<<<<< Updated upstream
            if (menu.getScreen() === "settings") {
                menu.setScreen(appScreen === "playing" ? "main" : "pause");
            }
=======
            menu.setScreen(appScreen === "pause_menu" ? "pause" : "main");
>>>>>>> Stashed changes
            break;
    }
}

loop.start((dt) => {
    if (appScreen === "playing" && game) {
        game.update(dt);
        game.render(ctx);
        return;
    }

    // Menu or pause or settings
    const action = menu.update();
    handleMenuAction(action);
    menu.render(ctx);
});
