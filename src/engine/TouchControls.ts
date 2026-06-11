import { Input } from "./Input";
import { isSimulateMobile, isTouchDevice, shouldShowTouchControls } from "./platform";

const ROTATE_HINT_KEY = "clock-stopped-at-eleven-rotate-hint-dismissed";

const MOVEMENT_KEYS = ["arrowup", "arrowdown", "arrowleft", "arrowright"] as const;

/** Eight compass sectors (E, SE, S, SW, W, NW, N, NE) from atan2 angle. */
const SECTOR_KEYS: readonly (readonly string[])[] = [
    ["arrowright"],
    ["arrowdown", "arrowright"],
    ["arrowdown"],
    ["arrowdown", "arrowleft"],
    ["arrowleft"],
    ["arrowup", "arrowleft"],
    ["arrowup"],
    ["arrowup", "arrowright"]
];

export class TouchControls {
    private active = false;
    private dpadEl: HTMLElement | null = null;
    private dpadPointerId: number | null = null;
    private dpadSector: number | null = null;
    private dpadActiveKeys = new Set<string>();
    private sectorButtons: HTMLElement[] = [];

    constructor(
        private input: Input,
        private root: HTMLElement
    ) {
        if (!shouldShowTouchControls()) return;

        this.active = true;
        this.root.hidden = false;
        this.dpadEl = this.root.querySelector(".touch-dpad");
        this.sectorButtons = Array.from(
            this.root.querySelectorAll<HTMLElement>(".touch-dpad [data-sector]")
        );
        this.bindDpad();
        this.bindActionButtons();
        this.setupRotateHint();

        if (isSimulateMobile()) {
            console.log("📱 simulateMobile: touch controls enabled for desktop testing");
        }
    }

    isActive(): boolean {
        return this.active;
    }

    setVisible(visible: boolean): void {
        if (!this.active) return;
        this.root.hidden = !visible;
    }

    private bindDpad(): void {
        if (!this.dpadEl) return;

        const onDown = (e: PointerEvent) => {
            if (this.dpadPointerId !== null) return;
            e.preventDefault();
            this.dpadPointerId = e.pointerId;
            this.dpadEl!.setPointerCapture(e.pointerId);
            this.updateDpadFromPointer(e.clientX, e.clientY);
        };

        const onMove = (e: PointerEvent) => {
            if (this.dpadPointerId !== e.pointerId) return;
            e.preventDefault();
            this.updateDpadFromPointer(e.clientX, e.clientY);
        };

        const onEnd = (e: PointerEvent) => {
            if (this.dpadPointerId !== e.pointerId) return;
            this.dpadPointerId = null;
            this.clearDpad();
        };

        this.dpadEl.addEventListener("pointerdown", onDown, { passive: false });
        this.dpadEl.addEventListener("pointermove", onMove, { passive: false });
        this.dpadEl.addEventListener("pointerup", onEnd);
        this.dpadEl.addEventListener("pointercancel", onEnd);
        this.dpadEl.addEventListener("lostpointercapture", onEnd);
    }

    private updateDpadFromPointer(clientX: number, clientY: number): void {
        if (!this.dpadEl) return;

        const rect = this.dpadEl.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = clientX - cx;
        const dy = clientY - cy;
        const dist = Math.hypot(dx, dy);
        const deadRadius = Math.min(rect.width, rect.height) * 0.14;

        let sector: number | null = null;
        if (dist >= deadRadius) {
            let angle = Math.atan2(dy, dx);
            if (angle < 0) angle += Math.PI * 2;
            sector = Math.floor((angle + Math.PI / 8) / (Math.PI / 4)) % 8;
        }

        if (sector === this.dpadSector) return;

        this.dpadSector = sector;
        const keys = sector === null ? [] : [...SECTOR_KEYS[sector]];
        this.syncDpadKeys(keys);
        this.highlightSector(sector);
    }

    private syncDpadKeys(keys: string[]): void {
        const next = new Set(keys);
        for (const key of MOVEMENT_KEYS) {
            if (this.dpadActiveKeys.has(key) && !next.has(key)) {
                this.input.setVirtualDown(key, false);
            }
            if (!this.dpadActiveKeys.has(key) && next.has(key)) {
                this.input.setVirtualDown(key, true);
            }
        }
        this.dpadActiveKeys = next;
    }

    private clearDpad(): void {
        this.syncDpadKeys([]);
        this.dpadSector = null;
        this.highlightSector(null);
    }

    private highlightSector(sector: number | null): void {
        for (const btn of this.sectorButtons) {
            const s = btn.dataset.sector;
            btn.classList.toggle("active", s !== undefined && sector !== null && Number(s) === sector);
        }
    }

    private bindActionButtons(): void {
        const buttons = this.root.querySelectorAll<HTMLButtonElement>(
            ".touch-actions .touch-btn[data-key]"
        );

        for (const btn of buttons) {
            const key = btn.dataset.key;
            if (!key) continue;

            const onDown = (e: PointerEvent) => {
                e.preventDefault();
                btn.setPointerCapture(e.pointerId);
                btn.classList.add("active");
                this.input.tapVirtual(key);
            };

            const onUp = (e: PointerEvent) => {
                btn.classList.remove("active");
            };

            btn.addEventListener("pointerdown", onDown, { passive: false });
            btn.addEventListener("pointerup", onUp);
            btn.addEventListener("pointercancel", onUp);
            btn.addEventListener("lostpointercapture", onUp);
        }
    }

    private setupRotateHint(): void {
        if (!isTouchDevice() || isSimulateMobile()) return;

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
