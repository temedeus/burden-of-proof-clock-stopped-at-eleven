import { describe, expect, it } from "vitest";
import { validateStoryCasePacket } from "./validateStory";
import type { RoomConfig } from "./rooms";
import type { StoryCasePacket } from "./story";

function validPacket(overrides: Partial<StoryCasePacket> = {}): StoryCasePacket {
    return {
        title: "Test Case",
        victim: { name: "Victim", roomId: "library", time: "eleven" },
        culpritNpcId: "cook",
        suspects: [
            {
                npcId: "cook",
                motive: "Money",
                opportunity: "Kitchen",
                alibi: "Was cooking"
            }
        ],
        roomNarratives: [{ roomId: "library", summary: "Quiet room." }],
        generatedClues: [
            {
                id: "clue_1",
                name: "Clue",
                description: "A clue"
            }
        ],
        clueAssignments: [
            {
                clueId: "clue_1",
                roomId: "library",
                furnitureId: "table",
                furnitureIndex: 0,
                hint: "Look closely."
            }
        ],
        npcDialogOverrides: [{ npcId: "cook", default: "I saw nothing." }],
        ...overrides
    };
}

const context = {
    roomIds: ["library"],
    npcIds: ["cook"],
    clueIds: ["clue_1"],
    rooms: {
        library: {
            id: "library",
            width: 10,
            height: 10,
            furniture: [{ furnitureId: "table", x: 2, y: 2, anchor: "top-left" }],
            exits: []
        } satisfies RoomConfig
    }
};

describe("validateStoryCasePacket", () => {
    it("accepts a well-formed packet", () => {
        expect(validateStoryCasePacket("active", validPacket(), context)).toEqual([]);
    });

    it("checks sceneTriggers name known scenes and story clues", () => {
        expect(
            validateStoryCasePacket(
                "active",
                validPacket({ sceneTriggers: { ledger_scare: "clue_1" } }),
                context
            )
        ).toEqual([]);
        const messages = validateStoryCasePacket(
            "active",
            validPacket({
                sceneTriggers: { confrontation: "missing_clue", tea_party: "clue_1" } as StoryCasePacket["sceneTriggers"]
            }),
            context
        ).map((issue) => issue.message);
        expect(messages).toEqual([
            "sceneTriggers.confrontation needs a culpritConfrontationMonologue.",
            "sceneTriggers 'confrontation' uses unknown clue 'missing_clue'.",
            "Unknown sceneTriggers scene 'tea_party'."
        ]);
    });

    it("requires a confession when the story triggers the confrontation", () => {
        const packet = validPacket({ sceneTriggers: { confrontation: "clue_1" } });
        expect(validateStoryCasePacket("active", packet, context).map((i) => i.message)).toEqual([
            "sceneTriggers.confrontation needs a culpritConfrontationMonologue."
        ]);
        packet.culpritConfrontationMonologue = ["Cook: It was me."];
        expect(validateStoryCasePacket("active", packet, context)).toEqual([]);
    });

    it("flags unknown requiresScenes on dialog conditions", () => {
        const packet = validPacket({
            npcDialogOverrides: [
                {
                    npcId: "cook",
                    default: "I saw nothing.",
                    conditions: [
                        { requiresScenes: ["ledger_scare"], dialog: "After the fire." },
                        { requiresScenes: ["tea_party" as "ledger_scare"], dialog: "Never." }
                    ]
                }
            ]
        });
        expect(validateStoryCasePacket("active", packet, context).map((i) => i.message)).toEqual([
            "Unknown requiresScenes 'tea_party' for npc 'cook'."
        ]);
    });

    it("rejects non-object packets", () => {
        const issues = validateStoryCasePacket("active", null, context);
        expect(issues[0]?.message).toContain("not an object");
    });

    it("flags invalid culpritNpcId", () => {
        const issues = validateStoryCasePacket(
            "active",
            validPacket({ culpritNpcId: "ghost" }),
            context
        );
        expect(issues.some((i) => i.message.includes("culpritNpcId"))).toBe(true);
    });

    it("flags clue assignment pointing at missing furniture slot", () => {
        const issues = validateStoryCasePacket(
            "active",
            validPacket({
                clueAssignments: [
                    {
                        clueId: "clue_1",
                        roomId: "library",
                        furnitureId: "table",
                        furnitureIndex: 3,
                        hint: "Nowhere"
                    }
                ]
            }),
            context
        );
        expect(issues.some((i) => i.message.includes("missing furniture"))).toBe(true);
    });

    it("flags unassigned generated clues", () => {
        const issues = validateStoryCasePacket(
            "active",
            validPacket({
                generatedClues: [
                    { id: "clue_1", name: "One", description: "First" },
                    { id: "clue_2", name: "Two", description: "Second" }
                ],
                clueAssignments: [
                    {
                        clueId: "clue_1",
                        roomId: "library",
                        furnitureId: "table",
                        furnitureIndex: 0,
                        hint: "Only one assigned"
                    }
                ]
            }),
            context
        );
        expect(issues.some((i) => i.message.includes("clue_2"))).toBe(true);
    });

    it("flags clue dependency cycles", () => {
        const issues = validateStoryCasePacket(
            "active",
            validPacket({
                generatedClues: [
                    { id: "clue_1", name: "One", description: "First", requiresClues: ["clue_2"] },
                    { id: "clue_2", name: "Two", description: "Second", requiresClues: ["clue_1"] }
                ],
                clueAssignments: [
                    {
                        clueId: "clue_1",
                        roomId: "library",
                        furnitureId: "table",
                        furnitureIndex: 0,
                        hint: "One"
                    },
                    {
                        clueId: "clue_2",
                        roomId: "library",
                        furnitureId: "table",
                        furnitureIndex: 0,
                        hint: "Two"
                    }
                ]
            }),
            context
        );
        expect(issues.some((i) => i.message.includes("cycle"))).toBe(true);
    });
});
