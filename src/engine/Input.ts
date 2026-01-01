export class Input {
    private keys = new Set<string>();
    private pressed = new Set<string>();

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

    isDown(key: string): boolean {
        return this.keys.has(key.toLowerCase());
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
