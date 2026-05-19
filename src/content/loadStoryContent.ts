import type { NPCDialogConfig, StoryCasePacket, StoryManifest } from "@cse/content-schema";
import storyManifestJson from "../data/story/generated/story_manifest.json";

const storyModules = import.meta.glob("../data/story/generated/stories/*.json", { eager: true });

export interface ActiveStory {
    id: string;
    title: string;
    casePacket: StoryCasePacket;
}

function loadStoriesById(): Map<string, StoryCasePacket> {
    const stories = new Map<string, StoryCasePacket>();
    for (const [path, mod] of Object.entries(storyModules)) {
        const fileName = path.split("/").pop() ?? "";
        if (!fileName.endsWith(".json")) continue;
        const id = fileName.replace(/\.json$/, "");
        const raw = mod as StoryCasePacket | { default: StoryCasePacket };
        const packet = "default" in raw && raw.default ? raw.default : (raw as StoryCasePacket);
        stories.set(id, packet);
    }
    return stories;
}

export function getStoryIdFromUrl(): string | null {
    const params = new URLSearchParams(window.location.search);
    const story = params.get("story")?.trim();
    return story || null;
}

export function pickActiveStory(
    manifest: StoryManifest,
    storiesById: Map<string, StoryCasePacket>,
    requestedId?: string | null
): ActiveStory | null {
    const playable = (manifest.stories ?? []).filter((entry) => entry.isValid !== false);
    if (playable.length === 0) return null;

    const tryPick = (entry: (typeof playable)[number]): ActiveStory | null => {
        const packet = storiesById.get(entry.id);
        if (!packet) {
            console.warn(`[story] Missing file for manifest entry '${entry.id}'.`);
            return null;
        }
        return {
            id: entry.id,
            title: packet.title ?? entry.title,
            casePacket: packet
        };
    };

    if (requestedId) {
        const entry = playable.find((s) => s.id === requestedId);
        if (entry) {
            const picked = tryPick(entry);
            if (picked) return picked;
        }
        console.warn(`[story] Requested story '${requestedId}' not found or invalid; picking at random.`);
    }

    const shuffled = [...playable].sort(() => Math.random() - 0.5);
    for (const entry of shuffled) {
        const picked = tryPick(entry);
        if (picked) return picked;
    }
    return null;
}

/** Resolves the story for this play session (URL `?story=` or random valid manifest entry). */
export function resolveActiveStory(requestedId?: string | null): ActiveStory | null {
    const manifest = storyManifestJson as StoryManifest;
    const storiesById = loadStoriesById();
    const id = requestedId ?? getStoryIdFromUrl();
    return pickActiveStory(manifest, storiesById, id);
}

export function applyStoryDialogOverrides(
    baseDialogs: Record<string, NPCDialogConfig>,
    casePacket: StoryCasePacket
): Record<string, NPCDialogConfig> {
    const merged = { ...baseDialogs };
    for (const override of casePacket.npcDialogOverrides ?? []) {
        merged[override.npcId] = {
            default: override.default,
            conditions: override.conditions
        };
    }
    return merged;
}
