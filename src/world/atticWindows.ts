/** North-wall attic window columns (matches procedural tile art). */
export const ATTIC_WINDOW_TILE_XS = [5, 19] as const;

const brokenWindows = new Set<number>();

export function markAtticWindowBroken(tileX: number): void {
    brokenWindows.add(tileX);
}

export function isAtticWindowBroken(tileX: number): boolean {
    return brokenWindows.has(tileX);
}

export function resetAtticWindows(): void {
    brokenWindows.clear();
}
