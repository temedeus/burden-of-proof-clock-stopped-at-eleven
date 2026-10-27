import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { StoryCasePacket } from "@cse/content-schema";
import { loadGameContent } from "./loadGameContent";
import { getRequiredClueIds } from "./applyStoryToGame";
import { formatInvestigationLeads, getInvestigationLeads } from "./investigationLeads";

function loadActiveStory(): StoryCasePacket {
    const path = resolve(process.cwd(), "src/data/story/generated/stories/active.json");
    return JSON.parse(readFileSync(path, "utf8")) as StoryCasePacket;
}

/** Unlocks the detective has by the time they hold these clues (puzzles solved right away). */
function unlocksFor(owned: ReadonlySet<string>): Set<string> {
    const ids = new Set<string>();
    if (owned.has("manor_floor_plans")) ids.add("study_secret");
    if (owned.has("cellar_evidence")) {
        ids.add("cellar_secret");
        ids.add("wine_cellar_door");
    }
    return ids;
}

describe("investigation leads", () => {
    const story = loadActiveStory();
    const content = loadGameContent();

    function leadsFor(owned: ReadonlySet<string>) {
        const unlocked = unlocksFor(owned);
        return getInvestigationLeads(
            story,
            (id) => owned.has(id),
            { rooms: content.rooms, startRoomId: "hall", isUnlocked: (id) => !id || unlocked.has(id) },
            content.npcs
        );
    }

    it("starts the case in the hall, searching rather than talking to the body", () => {
        const leads = leadsFor(new Set());
        expect(leads.map((l) => l.clueId)).toEqual(["examined_body", "examined_clock"]);
        expect(leads.every((l) => l.roomId === "hall" && l.kind === "search")).toBe(true);
        expect(formatInvestigationLeads(leads, () => "Hall")).toEqual(["Search the Hall"]);
    });

    it("always points at the next clue in the chain, and never at an undiscovered room", () => {
        const chain = getRequiredClueIds(story);
        const owned = new Set<string>();
        for (const clueId of chain) {
            const leads = leadsFor(owned);
            expect(leads.map((l) => l.clueId), `before ${clueId}`).toContain(clueId);
            owned.add(clueId);
        }
        expect(leadsFor(owned)).toEqual([]);
    });

    it("after the burned ledger, the diary is the only open lead", () => {
        const owned = new Set([
            "examined_body",
            "examined_clock",
            "maid_statement",
            "torn_appointment_note",
            "burned_ledger_page"
        ]);
        expect(leadsFor(owned).map((l) => l.clueId)).toEqual(["barons_diary"]);
    });

    it("points at the study while the bookshelf passage is still shut", () => {
        const chain = getRequiredClueIds(story);
        const owned = new Set(chain.slice(0, chain.indexOf("manor_floor_plans") + 1));
        const shut = getInvestigationLeads(
            story,
            (id) => owned.has(id),
            { rooms: content.rooms, startRoomId: "hall", isUnlocked: (id) => !id },
            content.npcs
        );
        expect(shut).toEqual([{ clueId: "von_virtanens_journal", roomId: "study", kind: "search" }]);
        expect(leadsFor(owned)).toEqual([{ clueId: "von_virtanens_journal", roomId: "hidden_room", kind: "search" }]);
    });

    it("asks around for clues given in conversation", () => {
        const owned = new Set(["examined_body", "examined_clock"]);
        expect(leadsFor(owned)).toEqual([{ clueId: "maid_statement", roomId: "maid_room", kind: "ask" }]);
        expect(formatInvestigationLeads(leadsFor(owned), () => "Maid Room")).toEqual(["Ask around in the Maid Room"]);
    });

    it("lists at most two distinct lines", () => {
        const leads = [
            { clueId: "a", roomId: "x", kind: "search" as const },
            { clueId: "b", roomId: "x", kind: "search" as const },
            { clueId: "c", roomId: "y", kind: "ask" as const },
            { clueId: "d", roomId: "z", kind: "search" as const }
        ];
        expect(formatInvestigationLeads(leads, (id) => id.toUpperCase())).toEqual([
            "Search the X",
            "Ask around in the Y"
        ]);
    });
});
