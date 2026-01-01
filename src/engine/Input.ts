export class Input {
    private keys = new Set<string>();

    constructor() {
        window.addEventListener("keydown", (e) => {
            this.keys.add(e.key.toLowerCase());
        });

        window.addEventListener("keyup", (e) => {
            this.keys.delete(e.key.toLowerCase());
        });
    }

    isDown(key: string): boolean {
        return this.keys.has(key.toLowerCase());
    }
}
