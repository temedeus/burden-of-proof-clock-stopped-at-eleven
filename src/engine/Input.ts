export class Input {
    private keys = new Set<string>();
    private pressed = new Set<string>();
    private virtualKeys = new Set<string>();

    constructor() {
        window.addEventListener("keydown", (e) => {
            const key = e.key.toLowerCase();
            if (!this.keys.has(key)) {
                this.pressed.add(key);
            }
            this.keys.add(key);
        });

        window.addEventListener("keyup", (e) => {
            const key = e.key.toLowerCase();
            this.keys.delete(key);
        });
    }

    setVirtualDown(key: string, down: boolean): void {
        const k = key.toLowerCase();
        if (down) {
            if (!this.virtualKeys.has(k)) {
                this.pressed.add(k);
            }
            this.virtualKeys.add(k);
        } else {
            this.virtualKeys.delete(k);
        }
    }

    /** Fire a one-shot press for action buttons (interact, inventory, menu). */
    tapVirtual(key: string): void {
        const k = key.toLowerCase();
        this.pressed.add(k);
    }

    isDown(key: string): boolean {
        const k = key.toLowerCase();
        return this.keys.has(k) || this.virtualKeys.has(k);
    }

    wasPressed(key: string): boolean {
        const k = key.toLowerCase();
        if (this.pressed.has(k)) {
            this.pressed.delete(k);
            return true;
        }
        return false;
    }
}
