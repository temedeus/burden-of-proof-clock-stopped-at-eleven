import { Input } from "./Input";
import { loadSettings, setMuteSounds } from "./Settings";

export type MenuScreen = "main" | "difficulty" | "character_select" | "pause" | "settings" | "game_over";

export type MenuAction =
    | { type: "start"; difficulty: "easy" | "medium" | "hard"; character: "male_detective" | "female_detective" }
    | { type: "open_settings" }
    | { type: "open_difficulty" }
    | { type: "resume" }
    | { type: "quit_to_menu" }
    | { type: "back" }
    | null;

const MENU_COLOR = "#2a1f1f";
const MENU_ACCENT = "#8b4513";
const TEXT_COLOR = "#e8e0d5";
const HOVER_COLOR = "#c4a574";

export class Menu {
    private selectedIndex = 0;
    private input: Input;
    private pendingDifficulty: "easy" | "medium" | "hard" = "medium";

    constructor(
        private canvas: HTMLCanvasElement,
        private screen: MenuScreen,
        input?: Input
    ) {
        this.input = input ?? new Input();
    }

    setScreen(screen: MenuScreen): void {
        this.screen = screen;
        this.selectedIndex = 0;
    }

    getScreen(): MenuScreen {
        return this.screen;
    }

    update(): MenuAction {
        const up = this.input.wasPressed("arrowup") || this.input.wasPressed("w");
        const down = this.input.wasPressed("arrowdown") || this.input.wasPressed("s");
        const enter = this.input.wasPressed("enter") || this.input.wasPressed(" ");
        const escape = this.input.wasPressed("escape");

        if (escape) {
            if (this.screen === "settings" || this.screen === "difficulty") {
                return { type: "back" };
            }
            if (this.screen === "character_select") {
                this.setScreen("difficulty");
                return null;
            }
            if (this.screen === "pause") {
                return { type: "resume" };
            }
        }

        const items = this.getMenuItems();
        if (up) this.selectedIndex = (this.selectedIndex - 1 + items.length) % items.length;
        if (down) this.selectedIndex = (this.selectedIndex + 1) % items.length;

        if (enter) {
            return this.activateItem(items[this.selectedIndex]);
        }

        return null;
    }

    private getMenuItems(): { id: string; label: string }[] {
        switch (this.screen) {
            case "main":
                return [
                    { id: "start", label: "Start Game" },
                    { id: "settings", label: "Settings" }
                ];
            case "difficulty":
                return [
                    { id: "easy", label: "Easy" },
                    { id: "medium", label: "Medium" },
                    { id: "hard", label: "Hard" }
                ];
            case "character_select":
                return [
                    { id: "female_detective", label: "Female Detective" },
                    { id: "male_detective", label: "Male Detective" }
                ];
            case "pause":
                return [
                    { id: "resume", label: "Resume" },
                    { id: "settings", label: "Settings" },
                    { id: "quit_to_menu", label: "Quit to Menu" }
                ];
            case "game_over":
                return [{ id: "quit_to_menu", label: "Back to Menu" }];
            case "settings":
                return [{ id: "mute_toggle", label: "" }, { id: "back", label: "Back" }];
            default:
                return [];
        }
    }

    private activateItem(item: { id: string; label: string }): MenuAction {
        switch (item.id) {
            case "start":
                this.setScreen("difficulty");
                return null;
            case "easy":
                this.pendingDifficulty = "easy";
                this.setScreen("character_select");
                return null;
            case "medium":
                this.pendingDifficulty = "medium";
                this.setScreen("character_select");
                return null;
            case "hard":
                this.pendingDifficulty = "hard";
                this.setScreen("character_select");
                return null;
            case "female_detective":
                return { type: "start", difficulty: this.pendingDifficulty, character: "female_detective" };
            case "male_detective":
                return { type: "start", difficulty: this.pendingDifficulty, character: "male_detective" };
            case "settings":
                if (this.screen === "main") return { type: "open_settings" };
                if (this.screen === "pause") return { type: "open_settings" };
                return null;
            case "resume":
                return { type: "resume" };
            case "quit_to_menu":
                return { type: "quit_to_menu" };
            case "mute_toggle":
                setMuteSounds(!loadSettings().muteSounds);
                return null;
            case "back":
                return { type: "back" };
            default:
                return null;
        }
    }

    render(ctx: CanvasRenderingContext2D): void {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;

        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.fillRect(0, 0, w, h);

        if (this.screen === "settings") {
            this.renderSettings(ctx, w, h);
            return;
        }

        if (this.screen === "game_over") {
            this.renderGameOver(ctx, w, h);
            return;
        }

        const title =
            this.screen === "main"
                ? "Murder at Blackwood Manor"
                : this.screen === "difficulty"
                  ? "Select Difficulty"
                  : this.screen === "character_select"
                    ? "Select Character"
                    : this.screen === "game_over"
                      ? "Game Over"
                      : "Paused";

        ctx.fillStyle = MENU_ACCENT;
        ctx.font = "bold 36px serif";
        ctx.textAlign = "center";
        ctx.fillText(title, w / 2, h * 0.28);

        const items = this.getMenuItems();
        const startY =
            this.screen === "difficulty"
                ? h * 0.4
                : this.screen === "character_select"
                  ? h * 0.4
                  : this.screen === "game_over"
                    ? h * 0.5
                    : h * 0.42;
        const lineHeight = 44;

        ctx.font = "22px serif";
        for (let i = 0; i < items.length; i++) {
            const label =
                items[i].id === "mute_toggle"
                    ? `Mute sounds: ${loadSettings().muteSounds ? "On" : "Off"}`
                    : items[i].label;
            const y = startY + i * lineHeight;
            ctx.fillStyle = i === this.selectedIndex ? HOVER_COLOR : TEXT_COLOR;
            ctx.fillText(label, w / 2, y);
        }

        ctx.textAlign = "left";
    }

    private renderGameOver(ctx: CanvasRenderingContext2D, w: number, h: number): void {
        ctx.fillStyle = "#8b0000";
        ctx.font = "bold 42px serif";
        ctx.textAlign = "center";
        ctx.fillText("Game Over", w / 2, h * 0.35);
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = "20px serif";
        ctx.fillText("The murderer has caught you.", w / 2, h * 0.42);
        ctx.font = "22px serif";
        const y = h * 0.52;
        ctx.fillStyle = this.selectedIndex === 0 ? HOVER_COLOR : TEXT_COLOR;
        ctx.fillText("Back to Menu", w / 2, y);
        ctx.textAlign = "left";
    }

    private renderSettings(ctx: CanvasRenderingContext2D, w: number, h: number): void {
        ctx.fillStyle = MENU_ACCENT;
        ctx.font = "bold 36px serif";
        ctx.textAlign = "center";
        ctx.fillText("Settings", w / 2, h * 0.28);

        const mute = loadSettings().muteSounds;
        const items = this.getMenuItems();
        const startY = h * 0.42;
        const lineHeight = 44;

        ctx.font = "22px serif";
        ctx.fillStyle = this.selectedIndex === 0 ? HOVER_COLOR : TEXT_COLOR;
        ctx.fillText(`Mute sounds: ${mute ? "On" : "Off"}`, w / 2, startY);
        ctx.fillStyle = this.selectedIndex === 1 ? HOVER_COLOR : TEXT_COLOR;
        ctx.fillText("Back", w / 2, startY + lineHeight);
        ctx.textAlign = "left";
    }
}
