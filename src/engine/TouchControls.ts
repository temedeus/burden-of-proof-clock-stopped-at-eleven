import { Input } from "./Input";
import { isTouchDevice } from "./platform";

const ROTATE_HINT_KEY = "clock-stopped-at-eleven-rotate-hint-dismissed";

export class TouchControls {
    private active = false;
    private pointerKeys = new Map<number, string[]>();
    private keyRefCount = new Map<string, number>();

    constructor(
        private input: Input,
        private root: HTMLElement
    ) {
        if (!isTouchDevice()) return;

        this.active = true;
        this.root.hidden = false;
        this.bindButtons();
        this.setupRotateHint();
    }

    isActive(): boolean {
        return this.active;
    }

    setVisible(visible: boolean): void {
        if (!this.active) return;
        this.root.hidden = !visible;
    }

    private getButtonKeys(btn: HTMLButtonElement): string[] {
        if (btn.dataset.keys) {
            return btn.dataset.keys.split(",").map((k) => k.trim()).filter(Boolean);
        }
        if (btn.dataset.key) {
            return [btn.dataset.key];
        }
        return [];
    }

    private pressKey(key: string): void {
        const count = this.keyRefCount.get(key) ?? 0;
        if (count === 0) {
            this.input.setVirtualDown(key, true);
        }
        this.keyRefCount.set(key, count + 1);
    }

    private releaseKey(key: string): void {
        const count = this.keyRefCount.get(key) ?? 0;
        if (count <= 1) {
            this.keyRefCount.delete(key);
            this.input.setVirtualDown(key, false);
        } else {
            this.keyRefCount.set(key, count - 1);
        }
    }

    private bindButtons(): void {
        const buttons = this.root.querySelectorAll<HTMLButtonElement>(".touch-btn[data-key], .touch-btn[data-keys]");

        for (const btn of buttons) {
            const keys = this.getButtonKeys(btn);
            if (keys.length === 0) continue;
            const isTap = btn.dataset.tap === "true";

            const onDown = (e: PointerEvent) => {
                e.preventDefault();
                if (this.pointerKeys.has(e.pointerId)) return;
                this.pointerKeys.set(e.pointerId, keys);
                btn.setPointerCapture(e.pointerId);
                btn.classList.add("active");
                if (isTap) {
                    for (const key of keys) {
                        this.input.tapVirtual(key);
                    }
                } else {
                    for (const key of keys) {
                        this.pressKey(key);
                    }
                }
            };

            const onUp = (e: PointerEvent) => {
                const held = this.pointerKeys.get(e.pointerId);
                if (!held) return;
                this.pointerKeys.delete(e.pointerId);
                btn.classList.remove("active");
                if (!isTap) {
                    for (const key of held) {
                        this.releaseKey(key);
                    }
                }
            };

            btn.addEventListener("pointerdown", onDown, { passive: false });
            btn.addEventListener("pointerup", onUp);
            btn.addEventListener("pointercancel", onUp);
            btn.addEventListener("lostpointercapture", onUp);
        }
    }

    private setupRotateHint(): void {
        const hint = document.getElementById("rotate-hint");
        const dismiss = document.getElementById("rotate-hint-dismiss");
        if (!hint || !dismiss) return;

        try {
            if (localStorage.getItem(ROTATE_HINT_KEY) === "1") return;
        } catch (_) {}

        hint.classList.add("visible");
        dismiss.addEventListener("click", () => {
            hint.classList.remove("visible");
            try {
                localStorage.setItem(ROTATE_HINT_KEY, "1");
            } catch (_) {}
        });
    }
}
