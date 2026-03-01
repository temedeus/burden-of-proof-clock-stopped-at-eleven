import { Loop } from "./engine/Loop";
import { Game } from "./engine/Game";
import { Menu, MenuAction } from "./engine/Menu";
import { Input } from "./engine/Input";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

type AppScreen = "main_menu" | "playing" | "pause_menu" | "settings" | "game_over";

let appScreen: AppScreen = "main_menu";
let game: Game | null = null;
const sharedInput = new Input();
const menu = new Menu(canvas, "main", sharedInput);

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
                },
                onGameOver: () => {
                    appScreen = "game_over";
                    menu.setScreen("game_over");
                },
                input: sharedInput
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
        case "back":
            menu.setScreen(appScreen === "pause_menu" ? "pause" : "main");
            break;
    }
}

loop.start((dt) => {
    if (appScreen === "playing" && game) {
        game.update(dt);
        game.render(ctx);
        return;
    }

    if (appScreen === "game_over" && game) {
        game.render(ctx);
    }

    const action = menu.update();
    handleMenuAction(action);
    menu.render(ctx);
});
