/** Stable north-wall windows — each spans two tile columns. */
export const STABLE_WINDOWS = [
    { id: 6, left: 5, right: 6 },
    { id: 18, left: 17, right: 18 }
] as const;

export function stableWindowPairForColumn(
    x: number
): (typeof STABLE_WINDOWS)[number] | null {
    return STABLE_WINDOWS.find((w) => w.left === x || w.right === x) ?? null;
}
