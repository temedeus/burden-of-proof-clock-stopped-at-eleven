/** Anchor tile key (`"x,y"`) of the stove whose stock pot was grabbed in the chase; null while all pots sit on their hobs. */
let takenStove: string | null = null;

export function stoveKey(tileX: number, tileY: number): string {
    return `${tileX},${tileY}`;
}

export function setStovePotTaken(key: string | null): void {
    takenStove = key;
}

export function isStovePotTaken(tileX: number, tileY: number): boolean {
    return takenStove === stoveKey(tileX, tileY);
}
