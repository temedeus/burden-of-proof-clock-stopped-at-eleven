import type { PlayerSpriteName } from "@cse/content-schema";
import type { Facing } from "../entities/Player";
import type { Difficulty } from "../systems/MurdererChaseController";
import { loadGameContent } from "../content/loadGameContent";
import { buildClueCatalog } from "../content/clueCatalog";
import { resolveActiveStory } from "../content/loadStoryContent";

export const SAVE_STORAGE_KEY = "clock-stopped-at-eleven-save";

/**
 * Bump when content changes make old progress unsafe
 * (room graph, clue ids, puzzle wiring, story case swap).
 */
export const SAVE_CONTENT_REVISION = "2026-07-29";

export const SAVE_FORMAT_VERSION = 1 as const;

export interface GameSaveV1 {
    version: typeof SAVE_FORMAT_VERSION;
    contentRevision: string;
    savedAt: number;
    storyId: string;
    difficulty: Difficulty;
    playerSprite: PlayerSpriteName;
    roomId: string;
    player: { x: number; y: number; facing: Facing };
    discoveredClueIds: string[];
    studySecretRevealed: boolean;
    cellarSecretRevealed: boolean;
    diningFireResolved: boolean;
    atticScareComplete: boolean;
    ledgerScareComplete: boolean;
    confrontationComplete: boolean;
    accusedMurderer: boolean;
    cookHiddenAfterDiningScare: boolean;
    brokenAtticWindowIds: number[];
}

export interface SaveValidationContext {
    roomIds: Set<string>;
    storyIds: Set<string>;
    clueIds: Set<string>;
}

const FACINGS = new Set<Facing>(["up", "down", "left", "right"]);
const DIFFICULTIES = new Set<Difficulty>(["easy", "medium", "hard"]);
const PLAYER_SPRITES = new Set<PlayerSpriteName>(["female_detective", "male_detective"]);

/** Build validation context from currently loaded game content. */
export function createSaveValidationContext(): SaveValidationContext {
    const content = loadGameContent();
    const roomIds = new Set(Object.keys(content.rooms));
    const active = resolveActiveStory();
    const storyIds = new Set<string>(active ? [active.id] : []);
    const catalog = buildClueCatalog(active?.casePacket.generatedClues);
    const clueIds = new Set(Object.keys(catalog));
    return { roomIds, storyIds, clueIds };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
}

function parseSaveShape(raw: unknown): GameSaveV1 | null {
    if (!isRecord(raw)) return null;
    if (raw.version !== SAVE_FORMAT_VERSION) return null;
    if (raw.contentRevision !== SAVE_CONTENT_REVISION) return null;
    if (typeof raw.storyId !== "string" || raw.storyId.length === 0) return null;
    if (typeof raw.difficulty !== "string" || !DIFFICULTIES.has(raw.difficulty as Difficulty)) {
        return null;
    }
    if (
        typeof raw.playerSprite !== "string" ||
        !PLAYER_SPRITES.has(raw.playerSprite as PlayerSpriteName)
    ) {
        return null;
    }
    if (typeof raw.roomId !== "string" || raw.roomId.length === 0) return null;
    if (!isRecord(raw.player)) return null;
    if (!isFiniteNumber(raw.player.x) || !isFiniteNumber(raw.player.y)) return null;
    if (typeof raw.player.facing !== "string" || !FACINGS.has(raw.player.facing as Facing)) {
        return null;
    }
    if (!Array.isArray(raw.discoveredClueIds)) return null;
    if (!raw.discoveredClueIds.every((id) => typeof id === "string")) return null;
    if (!Array.isArray(raw.brokenAtticWindowIds)) return null;
    if (!raw.brokenAtticWindowIds.every((id) => typeof id === "number" && Number.isFinite(id))) {
        return null;
    }
    if (!isFiniteNumber(raw.savedAt)) return null;

    const boolFields = [
        "studySecretRevealed",
        "cellarSecretRevealed",
        "diningFireResolved",
        "atticScareComplete",
        "ledgerScareComplete",
        "confrontationComplete",
        "accusedMurderer",
        "cookHiddenAfterDiningScare"
    ] as const;
    for (const key of boolFields) {
        if (typeof raw[key] !== "boolean") return null;
    }

    return {
        version: SAVE_FORMAT_VERSION,
        contentRevision: SAVE_CONTENT_REVISION,
        savedAt: raw.savedAt,
        storyId: raw.storyId,
        difficulty: raw.difficulty as Difficulty,
        playerSprite: raw.playerSprite as PlayerSpriteName,
        roomId: raw.roomId,
        player: {
            x: raw.player.x,
            y: raw.player.y,
            facing: raw.player.facing as Facing
        },
        discoveredClueIds: raw.discoveredClueIds as string[],
        studySecretRevealed: raw.studySecretRevealed as boolean,
        cellarSecretRevealed: raw.cellarSecretRevealed as boolean,
        diningFireResolved: raw.diningFireResolved as boolean,
        atticScareComplete: raw.atticScareComplete as boolean,
        ledgerScareComplete: raw.ledgerScareComplete as boolean,
        confrontationComplete: raw.confrontationComplete as boolean,
        accusedMurderer: raw.accusedMurderer as boolean,
        cookHiddenAfterDiningScare: raw.cookHiddenAfterDiningScare as boolean,
        brokenAtticWindowIds: raw.brokenAtticWindowIds as number[]
    };
}

/** Fail-closed content checks. Unknown clue ids are filtered, not rejected. */
export function validateSaveAgainstContent(
    save: GameSaveV1,
    ctx: SaveValidationContext
): GameSaveV1 | null {
    const story = resolveActiveStory(save.storyId);
    if (!story || story.id !== save.storyId) return null;
    if (!ctx.roomIds.has(save.roomId)) return null;

    const catalog = buildClueCatalog(story.casePacket.generatedClues);
    const knownClues = new Set(Object.keys(catalog));
    const discoveredClueIds = save.discoveredClueIds.filter((id) => knownClues.has(id));

    return { ...save, discoveredClueIds };
}

export function saveGame(save: GameSaveV1): void {
    try {
        localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(save));
    } catch (_) {
        /* private mode / quota */
    }
}

export function clearSave(): void {
    try {
        localStorage.removeItem(SAVE_STORAGE_KEY);
    } catch (_) {
        /* ignore */
    }
}

export function loadSave(ctx?: SaveValidationContext): GameSaveV1 | null {
    try {
        const raw = localStorage.getItem(SAVE_STORAGE_KEY);
        if (!raw) return null;
        const parsed = parseSaveShape(JSON.parse(raw) as unknown);
        if (!parsed) return null;
        return validateSaveAgainstContent(parsed, ctx ?? createSaveValidationContext());
    } catch (_) {
        return null;
    }
}

export function hasSave(ctx?: SaveValidationContext): boolean {
    return loadSave(ctx) != null;
}

/** Exposed for unit tests — schema parse only, no content checks. */
export function parseSaveForTests(raw: unknown): GameSaveV1 | null {
    return parseSaveShape(raw);
}
