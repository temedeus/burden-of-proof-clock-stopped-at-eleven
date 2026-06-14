import { ACTIVE_STORY_ID } from "@cse/content-schema";
import type { RoomConfig } from "@cse/content-schema";

export type StoryApiMode = "story" | "legacy" | "missing";

export async function probeBackendStoryApi(backendBase: string): Promise<StoryApiMode> {
    try {
        const health = await fetch(`${backendBase}/health`);
        if (!health.ok) return "missing";
        const features = (await health.json()) as { features?: string[] };
        if (features.features?.includes("story")) return "story";
        if (features.features?.includes("cases")) return "legacy";
        const story = await fetch(`${backendBase}/api/story`);
        if (story.ok) return "story";
        const legacy = await fetch(`${backendBase}/api/cases/${ACTIVE_STORY_ID}`);
        if (legacy.ok) return "legacy";
        return "missing";
    } catch {
        return "missing";
    }
}

export async function updateBackendStatusLabel(
    backendBase: string,
    statusEl: HTMLParagraphElement,
    online: boolean
): Promise<void> {
    if (!online) {
        statusEl.textContent = "Backend: offline (rooms in memory; story needs backend)";
        return;
    }
    const storyApi = await probeBackendStoryApi(backendBase);
    if (storyApi === "story") {
        statusEl.textContent = "Backend: online (rooms + story)";
    } else if (storyApi === "legacy") {
        statusEl.textContent = "Backend: online (old API — restart: pnpm dev:editor:backend)";
    } else {
        statusEl.textContent = "Backend: online (rooms only — restart backend for story)";
    }
}

export async function fetchAllRooms(backendBase: string): Promise<Record<string, RoomConfig>> {
    const response = await fetch(`${backendBase}/api/rooms`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = (await response.json()) as { rooms: Record<string, RoomConfig> };
    return payload.rooms;
}

export async function saveRoom(backendBase: string, roomId: string, room: RoomConfig): Promise<void> {
    const response = await fetch(`${backendBase}/api/rooms/${roomId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room })
    });
    if (!response.ok) throw new Error(`Failed to save room '${roomId}'.`);
}

export async function syncAllRooms(
    backendBase: string,
    rooms: Record<string, RoomConfig>
): Promise<void> {
    const response = await fetch(`${backendBase}/api/rooms/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rooms })
    });
    if (!response.ok) throw new Error(`Save all failed with HTTP ${response.status}.`);
}
