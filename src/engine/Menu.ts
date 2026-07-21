import { Input } from "./Input";
import { loadSettings, setMuteSounds } from "./Settings";
import { spriteLoader } from "../assets/SpriteLoader";
import { shouldShowTouchControls } from "./platform";
import type { PlayerSpriteName } from "@cse/content-schema";

export type MenuScreen = "main" | "character_select" | "pause" | "settings" | "game_over";

export type MenuAction =
    | { type: "start"; character: PlayerSpriteName }
    | { type: "open_settings" }
    | { type: "resume" }
    | { type: "quit_to_menu" }
    | { type: "back" }
    | null;

const MENU_ACCENT = "#8b4513";
const TEXT_COLOR = "#e8e0d5";
const HOVER_COLOR = "#c4a574";

type CharacterId = PlayerSpriteName;

interface CharacterOption {
    id: CharacterId;
    label: string;
}

const CHARACTER_OPTIONS: CharacterOption[] = [
    {
        id: "female_detective",
        label: "Clara Case"
    },
    {
        id: "male_detective",
        label: "Max Trace"
    }
];

export class Menu {
    private selectedIndex = 0;
    private input: Input;

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

    /** Handle a tap on the canvas (canvas pixel coordinates). */
    handlePointer(x: number, y: number): MenuAction | null {
        const w = this.canvas.width;
        const h = this.canvas.height;

        if (this.screen === "character_select") {
            const layout = this.getCharacterSelectLayout(w, h);
            const type = this.getMenuTypography(h);

            if (layout.continueButton) {
                const btn = layout.continueButton;
                if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
                    return this.activateItem(this.getMenuItems()[this.selectedIndex]);
                }
            }

            for (let i = 0; i < layout.slots.length; i++) {
                const slot = layout.slots[i];
                const pad = 12;
                const labelY = slot.y + slot.h + layout.labelGap;
                const labelBottom = labelY + type.lineHeight * 0.4;
                if (
                    x >= slot.x - pad &&
                    x <= slot.x + slot.w + pad &&
                    y >= slot.y - pad &&
                    y <= labelBottom + pad
                ) {
                    this.selectedIndex = i;
                    return null;
                }
            }
            return null;
        }

        const layout = this.getListLayout(h);
        if (!layout) return null;

        const halfLine = layout.lineHeight / 2;
        for (let i = 0; i < layout.count; i++) {
            const itemY = layout.startY + i * layout.lineHeight;
            if (y >= itemY - halfLine && y <= itemY + halfLine) {
                this.selectedIndex = i;
                return this.activateItem(this.getMenuItems()[i]);
            }
        }
        return null;
    }

    private getMenuTypography(h: number): { title: string; item: string; itemBold: string; hint: string; lineHeight: number } {
        const touch = shouldShowTouchControls();
        const scale = h / 600;
        const titlePx = Math.round((touch ? 42 : 36) * scale);
        const itemPx = Math.round((touch ? 34 : 26) * scale);
        const hintPx = Math.round((touch ? 20 : 18) * scale);
        const lineHeight = Math.round((touch ? 68 : 54) * scale);
        return {
            title: `bold ${titlePx}px serif`,
            item: `${itemPx}px serif`,
            itemBold: `bold ${itemPx}px serif`,
            hint: `${hintPx}px serif`,
            lineHeight
        };
    }

    private getListLayout(h: number): { startY: number; lineHeight: number; count: number } | null {
        const items = this.getMenuItems();
        if (items.length === 0) return null;

        const { lineHeight } = this.getMenuTypography(h);
        const startY = h * (this.screen === "game_over" ? 0.52 : 0.42);
        return { startY, lineHeight, count: items.length };
    }

    private getCharacterSelectLayout(w: number, h: number): {
        spriteSize: number;
        centerY: number;
        labelGap: number;
        slots: { id: CharacterId; x: number; y: number; w: number; h: number }[];
        continueButton: { x: number; y: number; w: number; h: number } | null;
    } {
        const touch = shouldShowTouchControls();
        const spriteSize = Math.min(Math.round(w * 0.22), Math.round(h * 0.28));
        const gap = Math.max(32, w * 0.1);
        const centerY = h * 0.4;
        const labelGap = Math.round(h * 0.085);
        const femaleX = w / 2 - gap / 2 - spriteSize;
        const maleX = w / 2 + gap / 2;

        let continueButton: { x: number; y: number; w: number; h: number } | null = null;
        if (touch) {
            const btnW = Math.min(280, Math.round(w * 0.5));
            const btnH = Math.round(h * 0.09);
            continueButton = {
                x: (w - btnW) / 2,
                y: h * 0.82 - btnH / 2,
                w: btnW,
                h: btnH
            };
        }

        return {
            spriteSize,
            centerY,
            labelGap,
            slots: [
                { id: "female_detective", x: femaleX, y: centerY - spriteSize / 2, w: spriteSize, h: spriteSize },
                { id: "male_detective", x: maleX, y: centerY - spriteSize / 2, w: spriteSize, h: spriteSize }
            ],
            continueButton
        };
    }

    update(): MenuAction {
        const up = this.input.wasPressed("arrowup") || this.input.wasPressed("w");
        const down = this.input.wasPressed("arrowdown") || this.input.wasPressed("s");
        const enter = this.input.wasPressed("enter") || this.input.wasPressed(" ");
        const escape = this.input.wasPressed("escape");

        if (escape) {
            if (this.screen === "settings") {
                return { type: "back" };
            }
            if (this.screen === "character_select") {
                this.setScreen("main");
                return null;
            }
            if (this.screen === "pause") {
                return { type: "resume" };
            }
            if (this.screen === "game_over") {
                return { type: "quit_to_menu" };
            }
        }

        const items = this.getMenuItems();
        if (this.screen === "character_select") {
            const left = this.input.wasPressed("arrowleft") || this.input.wasPressed("a");
            const right = this.input.wasPressed("arrowright") || this.input.wasPressed("d");
            if (left) this.selectedIndex = (this.selectedIndex - 1 + items.length) % items.length;
            if (right) this.selectedIndex = (this.selectedIndex + 1) % items.length;
        } else {
            if (up) this.selectedIndex = (this.selectedIndex - 1 + items.length) % items.length;
            if (down) this.selectedIndex = (this.selectedIndex + 1) % items.length;
        }

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
            case "character_select":
                return CHARACTER_OPTIONS.map((c) => ({ id: c.id, label: c.label }));
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
                this.setScreen("character_select");
                return null;
            case "female_detective":
                return { type: "start", character: "female_detective" };
            case "male_detective":
                return { type: "start", character: "male_detective" };
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

        if (this.screen === "main") {
            this.renderMainMenuBackground(ctx, w, h);
            ctx.fillStyle = "rgba(0,0,0,0.58)";
            ctx.fillRect(0, 0, w, h);

            const type = this.getMenuTypography(h);
            ctx.fillStyle = MENU_ACCENT;
            ctx.font = type.title;
            ctx.textAlign = "center";
            ctx.fillText("Murder at von Virtanen Manor", w / 2, h * 0.28);

            this.renderMenuList(ctx, w, h, this.getMenuItems(), h * 0.42);
            ctx.textAlign = "left";
            return;
        }

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

        if (this.screen === "character_select") {
            this.renderCharacterSelect(ctx, w, h);
            return;
        }

        const type = this.getMenuTypography(h);
        ctx.fillStyle = MENU_ACCENT;
        ctx.font = type.title;
        ctx.textAlign = "center";
        ctx.fillText("Paused", w / 2, h * 0.28);

        this.renderMenuList(ctx, w, h, this.getMenuItems(), h * 0.42);
        ctx.textAlign = "left";
    }

    private renderMenuList(
        ctx: CanvasRenderingContext2D,
        w: number,
        h: number,
        items: { id: string; label: string }[],
        startY: number
    ): void {
        const type = this.getMenuTypography(h);
        ctx.textAlign = "center";

        for (let i = 0; i < items.length; i++) {
            const label =
                items[i].id === "mute_toggle"
                    ? `Mute sounds: ${loadSettings().muteSounds ? "On" : "Off"}`
                    : items[i].label;
            const y = startY + i * type.lineHeight;
            const selected = i === this.selectedIndex;
            ctx.font = selected ? type.itemBold : type.item;
            ctx.fillStyle = selected ? HOVER_COLOR : TEXT_COLOR;
            ctx.fillText(label, w / 2, y);
        }
    }

    private renderCharacterSelect(ctx: CanvasRenderingContext2D, w: number, h: number): void {
        const type = this.getMenuTypography(h);
        const layout = this.getCharacterSelectLayout(w, h);
        const touch = shouldShowTouchControls();

        ctx.fillStyle = MENU_ACCENT;
        ctx.font = type.title;
        ctx.textAlign = "center";
        ctx.fillText("Select Character", w / 2, h * 0.16);

        ctx.font = type.hint;
        ctx.fillStyle = TEXT_COLOR;
        const charHint = touch
            ? "Tap a character, then Continue"
            : "← → to choose    Enter to confirm    Esc to go back";
        ctx.fillText(charHint, w / 2, h * 0.24);

        for (let i = 0; i < CHARACTER_OPTIONS.length; i++) {
            const character = CHARACTER_OPTIONS[i];
            const slot = layout.slots[i];
            const isSelected = i === this.selectedIndex;

            if (isSelected) {
                const pad = 8;
                ctx.strokeStyle = HOVER_COLOR;
                ctx.lineWidth = 3;
                ctx.strokeRect(
                    slot.x - pad,
                    slot.y - pad,
                    slot.w + pad * 2,
                    slot.h + pad * 2
                );
            }

            ctx.save();
            ctx.globalAlpha = isSelected ? 1 : 0.45;
            spriteLoader.drawSprite(ctx, character.id, slot.x, slot.y, slot.w, slot.h);
            ctx.restore();

            ctx.font = isSelected ? type.itemBold : type.item;
            ctx.fillStyle = isSelected ? HOVER_COLOR : TEXT_COLOR;
            ctx.fillText(
                character.label,
                slot.x + slot.w / 2,
                slot.y + slot.h + layout.labelGap
            );
        }

        if (layout.continueButton) {
            const btn = layout.continueButton;
            ctx.fillStyle = MENU_ACCENT;
            ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
            ctx.strokeStyle = HOVER_COLOR;
            ctx.lineWidth = 2;
            ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
            ctx.font = type.itemBold;
            ctx.fillStyle = TEXT_COLOR;
            ctx.textBaseline = "middle";
            ctx.fillText("Continue", btn.x + btn.w / 2, btn.y + btn.h / 2);
            ctx.textBaseline = "alphabetic";
        }

        ctx.textAlign = "left";
    }

    private renderGameOver(ctx: CanvasRenderingContext2D, w: number, h: number): void {
        const type = this.getMenuTypography(h);
        ctx.fillStyle = "#8b0000";
        ctx.font = type.title;
        ctx.textAlign = "center";
        ctx.fillText("Game Over", w / 2, h * 0.35);
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = type.hint;
        ctx.fillText("The murderer has caught you.", w / 2, h * 0.42);
        this.renderMenuList(ctx, w, h, this.getMenuItems(), h * 0.52);
        ctx.textAlign = "left";
    }

    private renderSettings(ctx: CanvasRenderingContext2D, w: number, h: number): void {
        const type = this.getMenuTypography(h);
        ctx.fillStyle = MENU_ACCENT;
        ctx.font = type.title;
        ctx.textAlign = "center";
        ctx.fillText("Settings", w / 2, h * 0.28);
        this.renderMenuList(ctx, w, h, this.getMenuItems(), h * 0.42);
        ctx.textAlign = "left";
    }

    /** Full-screen manor background for main menu (spritesheet3: manor_building) */
    private renderMainMenuBackground(ctx: CanvasRenderingContext2D, w: number, h: number): void {
        spriteLoader.drawSprite(ctx, "manor_building", 0, 0, w, h);
    }
}
