import { Input } from "./Input";
import { isTouchDevice } from "./platform";

const ROTATE_HINT_KEY = "clock-stopped-at-eleven-rotate-hint-dismissed";

export class TouchControls {
    private active = false;
    private pointerIds = new Map<string, number>();

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

    private bindButtons(): void {
        const buttons = this.root.querySelectorAll<HTMLButtonElement>(".touch-btn[data-key]");

        for (const btn of buttons) {
            const key = btn.dataset.key;
            if (!key) continue;
            const isTap = btn.dataset.tap === "true";

            const onDown = (e: PointerEvent) => {
                e.preventDefault();
                if (this.pointerIds.has(key)) return;
                this.pointerIds.set(key, e.pointerId);
                btn.setPointerCapture(e.pointerId);
                btn.classList.add("active");
                if (isTap) {
                    this.input.tapVirtual(key);
                } else {
                    this.input.setVirtualDown(key, true);
                }
            };

            const onUp = (e: PointerEvent) => {
                if (this.pointerIds.get(key) !== e.pointerId) return;
                this.pointerIds.delete(key);
                btn.classList.remove("active");
                if (!isTap) {
                    this.input.setVirtualDown(key, false);
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
