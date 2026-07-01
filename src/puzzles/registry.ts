/** Map confirmation ids from content to puzzle handlers. */
export type PuzzleConfirmHandlers = Record<string, () => void>;

const TRANSITION_CONFIRM_PREFIX = "transition:";

export function isTransitionConfirm(id: string): boolean {
    return id.startsWith(TRANSITION_CONFIRM_PREFIX);
}

export function targetRoomFromTransitionConfirm(id: string): string {
    return id.slice(TRANSITION_CONFIRM_PREFIX.length);
}

export function runPuzzleConfirm(id: string, handlers: PuzzleConfirmHandlers): boolean {
    const handler = handlers[id];
    if (!handler) return false;
    handler();
    return true;
}

/** Unlock ids satisfied by puzzles (e.g. study secret opens hidden room exit). */
export function isExitUnlocked(
    requiresUnlock: string | undefined,
    unlockedIds: ReadonlySet<string>
): boolean {
    if (!requiresUnlock) return true;
    return unlockedIds.has(requiresUnlock);
}
