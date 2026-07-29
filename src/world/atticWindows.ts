/** Attic north-wall windows — each spans two tile columns. */
export const ATTIC_WINDOWS = [
    { id: 5, left: 4, right: 5 },
    { id: 19, left: 18, right: 19 }
] as const;

/** Right-column ids (stable keys for broken state / shove targets). */
export const ATTIC_WINDOW_TILE_XS = ATTIC_WINDOWS.map((w) => w.id);

const brokenWindows = new Set<number>();

export function atticWindowPairForColumn(
    x: number
): (typeof ATTIC_WINDOWS)[number] | null {
    return ATTIC_WINDOWS.find((w) => w.left === x || w.right === x) ?? null;
}

export function markAtticWindowBroken(tileX: number): void {
    brokenWindows.add(tileX);
}

export function isAtticWindowBroken(tileX: number): boolean {
    return brokenWindows.has(tileX);
}

export function resetAtticWindows(): void {
    brokenWindows.clear();
}

export function getBrokenAtticWindowIds(): number[] {
    return Array.from(brokenWindows);
}

export function setBrokenAtticWindows(ids: readonly number[]): void {
    brokenWindows.clear();
    for (const id of ids) {
        brokenWindows.add(id);
    }
}
