/** Speaker id used for lines the detective says ("You: …"). */
export const PLAYER_SPEAKER = "player";

export interface DialogSegment {
    /** `PLAYER_SPEAKER`, an NPC id, or null for narration. */
    speakerId: string | null;
    /** Speaker's display name as written in the text (for the fallback message box). */
    speakerName: string | null;
    /** Line with the "Name: " prefix stripped. */
    text: string;
}

const PREFIX = /^([^:\n]{1,40}): ([\s\S]*)$/;

/**
 * Split dialog text into paragraphs attributed to speakers.
 * A "Name: " prefix switches speaker when `resolveNpc` (or "You") recognises the name;
 * unprefixed paragraphs continue the previous speaker, or are narration before anyone speaks.
 */
export function splitDialogSpeakers(
    text: string,
    resolveNpc: (name: string) => string | null
): DialogSegment[] {
    const segments: DialogSegment[] = [];
    let speakerId: string | null = null;
    let speakerName: string | null = null;

    for (const paragraph of text.split(/\n\s*\n/)) {
        const trimmed = paragraph.trim();
        if (!trimmed) continue;
        let body = trimmed;
        const match = PREFIX.exec(trimmed);
        if (match) {
            const name = match[1].trim();
            const id = name === "You" ? PLAYER_SPEAKER : resolveNpc(name);
            if (id) {
                speakerId = id;
                speakerName = name;
                body = match[2].trim();
            }
        }
        segments.push({ speakerId, speakerName, text: body });
    }

    return segments;
}
