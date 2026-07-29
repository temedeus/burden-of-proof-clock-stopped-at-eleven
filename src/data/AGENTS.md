# Content JSON — agent instructions

JSON under `src/data/` is the **source of truth** for gameplay content. [GAME_REFERENCE.md](../../GAME_REFERENCE.md) is a derived summary for narrative handoffs — edit JSON first, then refresh GAME_REFERENCE if needed.

## Layout

```
src/data/
  rooms/           # one JSON per room (auto-discovered)
  npcs/            # NPC definitions and base dialog
  furniture/       # furniture catalog (table.json, bookshelves.json, decorations.json)
  clues.json       # base clue catalog (fallback)
  story/generated/
    stories/active.json       # active case: clues, culprit, dialog overrides
    story_manifest.json       # manifest (id: active)
```

## Workflows

### New room

1. Create `src/data/rooms/<id>.json` — copy shape from an existing room.
2. Wire bidirectional `exits` in neighboring rooms.
3. Add display title in `src/engine/Game.ts` → `ROOM_DISPLAY_TITLES` if non-obvious.
4. Run `pnpm validate`.

No TypeScript registration — rooms are discovered via `import.meta.glob` in `src/content/loadCatalog.ts`.

### New NPC

1. Create `src/data/npcs/<id>.json` with `dialog` (default + optional `conditions`).
2. Place in a room JSON `npcs` array (each NPC once globally).
3. Run `pnpm validate`.

### Edit active story (clues, culprit, dialog)

Edit `src/data/story/generated/stories/active.json`:

| Field | Purpose |
|-------|---------|
| `generatedClues` | Clue id, name, description; optional `requiresClues`, `blockedHint`, `hideFromInventory` |
| `clueAssignments` | room, furniture index **or** `npcId`, examine hint |
| `culpritNpcId` | Murderer NPC id |
| `npcDialogOverrides` | Per-NPC dialog replacing base JSON when story is active |
| `roomNarratives` | Atmosphere notes for authors / handoffs (not applied to furniture examine text) |

Or use the editor (`pnpm dev:editor:full`) — see [src/editor/AGENTS.md](../editor/AGENTS.md).

### Furniture placement

Reference `furnitureId` from `src/data/furniture/*.json` in a room's `furniture` array. Placement uses `x`, `y`, `anchor` (see `@cse/content-schema`).

## Story vs base content

- **No active story:** base NPC dialog from `src/data/npcs/*.json`; only `torn_page` required to accuse (fallback).
- **Active story loaded:** `applyStoryToGame.ts` places clues on furniture; `loadStoryContent.ts` overrides NPC dialog.

## Local progress saves

Player progress is a single localStorage autosave (`src/engine/SaveGame.ts`). When you ship **breaking** content changes, bump `SAVE_CONTENT_REVISION` so old saves are invalidated (Continue disappears) instead of loading into a broken state:

- Renaming or removing clue / room ids
- Changing secret-passage or unlock wiring
- Replacing the active story case in a way that invalidates prior investigation state

Pure copy/dialog tweaks that keep the same ids and layout do **not** need a revision bump.

## Validation

Always run after edits:

```bash
pnpm validate
```

Checks room layout, NPC placement (each once), furniture/sprite references, story shape, and clue assignments. Rules live in `packages/content-schema`.

## Edit mapping (quick reference)

| If you changed… | Apply in… |
|-----------------|-----------|
| Clue name, description, location, examine hint | `active.json` — `generatedClues`, `clueAssignments` |
| Clue prerequisites, blocked hint, hide from inventory | `active.json` — `generatedClues` |
| NPC examine clue (e.g. body) | `active.json` — `clueAssignments` with `npcId`; `src/data/npcs/<id>.json` — `examineClueId` |
| Confirm-gated clue | furniture JSON — `interactionType: "confirm"`, `confirmRequiresClues`; `Game.ts` puzzle handler |
| Culprit, victim, suspects | `active.json` — `culpritNpcId`, `victim`, `suspects` |
| NPC dialog (active case) | `active.json` — `npcDialogOverrides` |
| NPC dialog (fallback) | `src/data/npcs/<id>.json` |
| Room connections | `src/data/rooms/<id>.json` — `exits` |
| Furniture examine text | `src/data/furniture/*.json` — `description`, `confirmPrompt` |

Full mapping and room catalog: [GAME_REFERENCE.md](../../GAME_REFERENCE.md).
