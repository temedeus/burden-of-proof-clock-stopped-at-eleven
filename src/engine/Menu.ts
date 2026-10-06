import { Input } from "./Input";
import { loadSettings, setMuteSounds } from "./Settings";
import { spriteLoader } from "../assets/SpriteLoader";
import { shouldShowTouchControls } from "./platform";
import { hasSave } from "./SaveGame";
import { drawMenuBackdrop } from "../render/menuBackdrop";
import type { PlayerSpriteName } from "@cse/content-schema";

export type MenuScreen =
    | "main"
    | "character_select"
    | "new_game_confirm"
    | "pause"
    | "settings"
    | "game_over";

export type MenuAction =
    | { type: "start"; character: PlayerSpriteName }
    | { type: "continue" }
    | { type: "confirm_new_game" }
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

    private getMenuTypography(h: number): {
        title: string;
        item: string;
        itemBold: string;
        hint: string;
        lineHeight: number;
    } {
        const touch = shouldShowTouchControls();
        const scale = h / 600;
        const titlePx = Math.round((touch ? 42 : 36) * scale);
        const itemPx = Math.round((touch ? 34 : 26) * scale);
        const hintPx = Math.round((touch ? 20 : 18) * scale);
        const lineHeight = Math.round((touch ? 68 : 54) * scale);
        return {
            title: `bold ${titlePx}px \"IM Fell English SC\", \"IM Fell English\", \"Libre Baskerville\", serif`,
            item: `${itemPx}px \"IM Fell English\", \"Libre Baskerville\", serif`,
            itemBold: `bold ${itemPx}px \"IM Fell English SC\", \"IM Fell English\", \"Libre Baskerville\", serif`,
            hint: `${hintPx}px \"IM Fell English\", \"Libre Baskerville\", serif`,
            lineHeight
        };
    }

    private getListLayout(h: number): { startY: number; lineHeight: number; count: number } | null {
        const items = this.getMenuItems();
        if (items.length === 0) return null;

        const { lineHeight } = this.getMenuTypography(h);
        const startY =
            this.screen === "main"
                ? this.mainMenuStartY(h, lineHeight, items.length)
                : this.screen === "game_over"
                  ? h * 0.52
                  : this.screen === "new_game_confirm"
                    ? h * 0.55
                    : h * 0.42;
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
        const centerY = h * 0.47;
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
                {
                    id: "female_detective",
                    x: femaleX,
                    y: centerY - spriteSize / 2,
                    w: spriteSize,
                    h: spriteSize
                },
                {
                    id: "male_detective",
                    x: maleX,
                    y: centerY - spriteSize / 2,
                    w: spriteSize,
                    h: spriteSize
                }
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
            if (this.screen === "character_select" || this.screen === "new_game_confirm") {
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
            case "main": {
                const items: { id: string; label: string }[] = [];
                if (hasSave()) {
                    items.push({ id: "continue", label: "Continue" });
                }
                items.push({ id: "start", label: "New Game" });
                items.push({ id: "settings", label: "Settings" });
                return items;
            }
            case "new_game_confirm":
                return [
                    { id: "confirm_new_game", label: "Yes — destroy save" },
                    { id: "cancel_new_game", label: "No — keep save" }
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
            case "continue":
                return { type: "continue" };
            case "start":
                if (hasSave()) {
                    this.setScreen("new_game_confirm");
                    return null;
                }
                this.setScreen("character_select");
                return null;
            case "confirm_new_game":
                this.setScreen("character_select");
                return { type: "confirm_new_game" };
            case "cancel_new_game":
                this.setScreen("main");
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
            drawMenuBackdrop(ctx, w, h, performance.now() / 1000);
            // Darken the grounds so the menu reads over the drive
            const shade = ctx.createLinearGradient(0, h * 0.66, 0, h);
            shade.addColorStop(0, "rgba(0,0,0,0)");
            shade.addColorStop(0.35, "rgba(0,0,0,0.45)");
            shade.addColorStop(1, "rgba(0,0,0,0.7)");
            ctx.fillStyle = shade;
            ctx.fillRect(0, h * 0.66, w, h * 0.34);

            this.drawLogo(ctx, w, h);
            const items = this.getMenuItems();
            const { lineHeight } = this.getMenuTypography(h);
            this.renderMenuList(ctx, w, h, items, this.mainMenuStartY(h, lineHeight, items.length), true);
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

        if (this.screen === "new_game_confirm") {
            this.renderNewGameConfirm(ctx, w, h);
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
        startY: number,
        shadowed = false
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
            if (shadowed) {
                ctx.fillStyle = "rgba(0,0,0,0.85)";
                ctx.fillText(label, w / 2 + 2, y + 2);
            }
            ctx.fillStyle = selected ? HOVER_COLOR : TEXT_COLOR;
            ctx.fillText(label, w / 2, y);
            if (selected && shadowed) {
                // Small diamonds bracket the chosen entry
                const half = ctx.measureText(label).width / 2 + 18;
                const d = Math.max(3, Math.round(type.lineHeight / 14));
                const cy = y - type.lineHeight * 0.18;
                for (const x of [w / 2 - half, w / 2 + half]) {
                    ctx.beginPath();
                    ctx.moveTo(x, cy - d);
                    ctx.lineTo(x + d, cy);
                    ctx.lineTo(x, cy + d);
                    ctx.lineTo(x - d, cy);
                    ctx.closePath();
                    ctx.fill();
                }
            }
        }
    }

    private renderNewGameConfirm(ctx: CanvasRenderingContext2D, w: number, h: number): void {
        const type = this.getMenuTypography(h);
        ctx.fillStyle = MENU_ACCENT;
        ctx.font = type.title;
        ctx.textAlign = "center";
        ctx.fillText("Start New Game?", w / 2, h * 0.28);
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = type.hint;
        ctx.fillText("Overwrite saved progress?", w / 2, h * 0.38);
        ctx.fillText("This will destroy your saved progress.", w / 2, h * 0.44);
        this.renderMenuList(ctx, w, h, this.getMenuItems(), h * 0.55);
        ctx.textAlign = "left";
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
                ctx.strokeRect(slot.x - pad, slot.y - pad, slot.w + pad * 2, slot.h + pad * 2);
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

    /** Main-menu list sits low, over the darkened grounds below the manor. */
    private mainMenuStartY(h: number, lineHeight: number, count: number): number {
        return h - (count - 1) * lineHeight - h * 0.09;
    }

    /**
     * Title logo over the night sky: a small italic "Murder at", the house name in
     * engraved gilt small caps, a ruled flourish and the tagline.
     */
    private drawLogo(ctx: CanvasRenderingContext2D, w: number, h: number): void {
        const scale = h / 600;
        const cx = w / 2;
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";

        ctx.font = `italic ${Math.round(24 * scale)}px "IM Fell English", "Libre Baskerville", serif`;
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillText("Murder at", cx + 2, h * 0.085 + 2);
        ctx.fillStyle = "#cdb98e";
        ctx.fillText("Murder at", cx, h * 0.085);

        const title = "Von Virtanen Manor";
        let px = Math.round(54 * scale);
        ctx.font = `${px}px "IM Fell English SC", "IM Fell English", "Libre Baskerville", serif`;
        const maxW = w * 0.86;
        const measured = ctx.measureText(title).width;
        if (measured > maxW) {
            px = Math.floor((px * maxW) / measured);
            ctx.font = `${px}px "IM Fell English SC", "IM Fell English", "Libre Baskerville", serif`;
        }
        const ty = h * 0.085 + px * 1.02;
        // Deep drop shadow, warm halo, dark engraved edge, then gilt fill
        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.fillText(title, cx + 3, ty + 4);
        ctx.shadowColor = "rgba(255,180,80,0.35)";
        ctx.shadowBlur = 14 * scale;
        ctx.lineJoin = "round";
        ctx.lineWidth = Math.max(2, 3 * scale);
        ctx.strokeStyle = "#2a1406";
        ctx.strokeText(title, cx, ty);
        ctx.shadowBlur = 0;
        const gilt = ctx.createLinearGradient(0, ty - px * 0.72, 0, ty + px * 0.05);
        gilt.addColorStop(0, "#fff0bc");
        gilt.addColorStop(0.45, "#e2b65c");
        gilt.addColorStop(0.55, "#b8812e");
        gilt.addColorStop(1, "#7a4a18");
        ctx.fillStyle = gilt;
        ctx.fillText(title, cx, ty);

        // Ruled flourish: tapering rules with a centre lozenge and end pips
        const fy = Math.round(ty + px * 0.32);
        const span = Math.min(ctx.measureText(title).width * 0.42, w * 0.36);
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(cx - span + 1, fy + 1, span * 2, Math.max(1, Math.round(scale)));
        const rule = ctx.createLinearGradient(cx - span, 0, cx + span, 0);
        rule.addColorStop(0, "rgba(200,160,90,0)");
        rule.addColorStop(0.5, "#d4aa5c");
        rule.addColorStop(1, "rgba(200,160,90,0)");
        ctx.fillStyle = rule;
        ctx.fillRect(cx - span, fy, span * 2, Math.max(1, Math.round(scale)));
        const d = 5 * scale;
        ctx.fillStyle = "#e2b65c";
        ctx.beginPath();
        ctx.moveTo(cx, fy - d);
        ctx.lineTo(cx + d * 1.6, fy);
        ctx.lineTo(cx, fy + d);
        ctx.lineTo(cx - d * 1.6, fy);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#2a1406";
        ctx.fillRect(cx - 1, fy - 1, 2, 2);
        for (const sx of [-1, 1]) {
            ctx.fillStyle = "#b8812e";
            ctx.fillRect(Math.round(cx + sx * span * 0.62) - 1, fy - 1, 3, 3);
        }

        ctx.font = `italic ${Math.round(17 * scale)}px "IM Fell English", "Libre Baskerville", serif`;
        const tagY = fy + 26 * scale;
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillText("The clock stopped at eleven", cx + 1, tagY + 1);
        ctx.fillStyle = "#9fa6b8";
        ctx.fillText("The clock stopped at eleven", cx, tagY);
        ctx.restore();
    }
}
