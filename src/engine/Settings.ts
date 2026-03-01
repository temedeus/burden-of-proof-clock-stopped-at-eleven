const STORAGE_KEY = "clock-stopped-at-eleven-settings";

export interface GameSettings {
    muteSounds: boolean;
}

const defaults: GameSettings = {
    muteSounds: false
};

export function loadSettings(): GameSettings {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as Partial<GameSettings>;
            return { ...defaults, ...parsed };
        }
    } catch (_) {}
    return { ...defaults };
}

export function saveSettings(settings: GameSettings): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (_) {}
}

export function isMuteSounds(): boolean {
    return loadSettings().muteSounds;
}

export function setMuteSounds(value: boolean): void {
    const s = loadSettings();
    s.muteSounds = value;
    saveSettings(s);
}
