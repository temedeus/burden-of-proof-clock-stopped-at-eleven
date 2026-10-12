/**
 * Ballroom chandelier easter egg — render-facing state read by `roomScene`.
 * Keys are the chandelier's anchor tile (`"x,y"`).
 */

export interface ChandelierVisual {
    /** Horizontal tremble in screen px. */
    jitter: number;
    /** How far the body has dropped below its chain, screen px. */
    drop: number;
}

let brokenKey: string | null = null;
let active: { key: string; visual: ChandelierVisual } | null = null;

export function chandelierKey(x: number, y: number): string {
    return `${x},${y}`;
}

export function getBrokenChandelier(): string | null {
    return brokenKey;
}

export function setBrokenChandelier(key: string | null): void {
    brokenKey = key;
}

export function setChandelierVisual(key: string | null, visual?: ChandelierVisual): void {
    active = key && visual ? { key, visual } : null;
}

/** Tremble/drop for the chandelier at `key`; `broken` once it has fallen. */
export function getChandelierState(key: string): (ChandelierVisual & { broken: boolean }) | null {
    if (brokenKey === key) return { jitter: 0, drop: 0, broken: true };
    if (active?.key === key) return { ...active.visual, broken: false };
    return null;
}

export function resetBallroomChandeliers(): void {
    brokenKey = null;
    active = null;
}
