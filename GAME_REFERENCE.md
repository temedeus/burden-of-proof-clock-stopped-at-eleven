# Clock Stopped at Eleven — World Reference

## Game overview (for AI context)

**Clock Stopped at Eleven** is a top-down, pixel-art murder mystery played in the browser (TypeScript, Vite, Canvas 2D). The player is a detective investigating a killing at **Blackwood Manor** on the night the manor clock stopped at eleven.

**Core loop:** walk room-to-room → examine furniture for clues → talk to suspects and staff → unlock secret passages → collect all evidence → confront the murderer → report to police to win. If the murderer is accused before all clues are found, or the player lingers after accusing them, a chase sequence can end in game over.

**Setting:** A Victorian-style country manor with main floor (hall, dining, kitchen, library, study, garden), upstairs bedrooms, outbuildings (courtyard, stable), cellars, and two hidden areas linked by a secret tunnel.

**Content model:** Rooms, NPCs, furniture, and base dialog live in `src/data/*.json`. Each playable case is a **story packet** (`src/data/story/generated/stories/*.json`) that assigns clues to furniture, sets the culprit, and overrides NPC dialog. The active case is *Clock Stopped at Eleven* — victim Lord Blackwood, culprit the cook.

**This document** maps rooms and connections, lists where dialog text is defined, and catalogs all clues for the active story.

It is a **derived summary**, not the source of truth. The game loads JSON and TypeScript under `src/`; edits here do not apply automatically.

### How to apply changes from this document

When returning an edited copy to a coding agent, ask it to **map your edits to the files below** and then refresh this document if you plan to hand it off again.

| If you changed… | Apply it in… |
|-----------------|--------------|
| Clue name, description, location, examine hint | `src/data/story/generated/stories/active.json` — `generatedClues`, `clueAssignments` |
| Who committed the murder, victim, suspects | `active.json` — `culpritNpcId`, `victim`, `suspects` |
| NPC default or conditional dialog (active case) | `active.json` — `npcDialogOverrides` |
| Base NPC dialog (no story / fallback) | `src/data/npcs/<npc_id>.json` — `dialog` |
| Room connections, doors, locked exits | `src/data/rooms/<room_id>.json` — `exits` |
| NPC placement in a room | `src/data/rooms/<room_id>.json` — `npcs` |
| Furniture layout in a room | `src/data/rooms/<room_id>.json` — `furniture` |
| Default examine text or confirm prompts | `src/data/furniture/*.json` — `description`, `confirmPrompt` |
| Room atmosphere text on all objects | `active.json` — `roomNarratives` |
| Room display name (banner) | `src/engine/Game.ts` — `ROOM_DISPLAY_TITLES` |
| Intro slides, menu copy, victory text | `src/engine/IntroScreen.ts`, `src/engine/Menu.ts`, `src/render/GameHud.ts` |
| Secret passage reveal messages | `src/puzzles/StudySecretPuzzle.ts`, `src/puzzles/CellarSecretPuzzle.ts` |

**Does not map from this doc alone:** tile coordinates, sprite art, new puzzle mechanics, chase/victory logic, or new room/NPC types (those need schema, loaders, and possibly editor updates).

**Suggested prompt when coming back:** “Apply the content changes described in `GAME_REFERENCE.md` to the game data files, then update the document to match.”

---

**Starting room:** Hall (`src/engine/Game.ts`)

**Active story:** `active` — *Clock Stopped at Eleven* (`src/data/story/generated/stories/active.json`)

---

## Room map

### Overview (text diagram)

```
                         ┌──────── Landing ────────┬──────── Guest Room B ── Bathroom B
                         │                         │
                    Hall ┤                    Master Bedroom ── Maid Room ── Attic
                    / | \                         │
         Dining ─ Kitchen   Library ─ Study ═ Hidden Room ═ Secret Tunnel
            |        |                              ║                ║
         Garden   Courtyard ─ Stable                 ║                ║
                      |                              ║                ║
               Cellar Storage ─ Wine Cellar          ═════════════════╝
```

`═` = secret passages (locked until puzzle solved).  
Hall is the central hub; the player begins here.

### All rooms (20)

| ID | Display name |
|----|--------------|
| `hall` | Hall |
| `dining` | Dining Room |
| `kitchen` | Kitchen |
| `library` | Library |
| `study` | Study |
| `garden` | Garden |
| `courtyard` | Courtyard |
| `stable` | Stable |
| `landing` | Landing |
| `guest_room_a` | Guest Room A |
| `guest_room_b` | Guest Room B |
| `bathroom_a` | Bathroom A |
| `bathroom_b` | Bathroom B |
| `master_bedroom` | Master Bedroom |
| `maid_room` | Maid Room |
| `attic` | Attic |
| `cellar_storage` | Cellar Storage |
| `wine_cellar` | Wine Cellar |
| `hidden_room` | Hidden Room |
| `secret_tunnel` | Secret Tunnel |

### Connections by room

Each line is a bidirectional connection unless noted.

#### Main floor

| From | To | Notes |
|------|-----|-------|
| **hall** | dining | West door |
| **hall** | library | South |
| **hall** | garden | South (outdoor) |
| **hall** | landing | North (stairs) |
| **dining** | hall | |
| **dining** | kitchen | West |
| **dining** | garden | North; no door sprite (open passage) |
| **kitchen** | dining | |
| **kitchen** | courtyard | South |
| **library** | hall | West |
| **library** | study | North |
| **study** | library | South |
| **study** | hidden_room | North; **locked** until `study_secret` puzzle |
| **garden** | hall | North |

#### Upper floor

| From | To | Notes |
|------|-----|-------|
| **landing** | hall | South (stairs) |
| **landing** | guest_room_a | |
| **landing** | guest_room_b | |
| **landing** | master_bedroom | |
| **guest_room_a** | landing | |
| **guest_room_a** | bathroom_a | |
| **guest_room_b** | landing | |
| **guest_room_b** | bathroom_b | |
| **bathroom_a** | guest_room_a | |
| **bathroom_b** | guest_room_b | |
| **master_bedroom** | landing | |
| **master_bedroom** | maid_room | |
| **maid_room** | master_bedroom | |
| **maid_room** | attic | |
| **attic** | maid_room | |

#### Outbuildings & cellars

| From | To | Notes |
|------|-----|-------|
| **courtyard** | kitchen | North |
| **courtyard** | stable | South; wooden door |
| **courtyard** | cellar_storage | Cellar hatch; **interaction only** (confirm prompt, no walk-through) |
| **stable** | courtyard | |
| **cellar_storage** | courtyard | Stairs up to hatch |
| **cellar_storage** | wine_cellar | South |
| **cellar_storage** | secret_tunnel | South; **locked** until `cellar_secret` puzzle |
| **wine_cellar** | cellar_storage | North |

#### Secret areas

| From | To | Notes |
|------|-----|-------|
| **hidden_room** | study | South; **locked** until `study_secret` |
| **hidden_room** | secret_tunnel | North; always passable once reached |
| **secret_tunnel** | hidden_room | South |
| **secret_tunnel** | cellar_storage | North; **locked** until `cellar_secret` |

### Secret puzzles

| Unlock ID | Trigger | Rooms opened | Reveal message |
|-----------|---------|--------------|----------------|
| `study_secret` | Pull loose book on secret bookshelf in **study** | study ↔ hidden_room | “The bookshelf grinds aside, revealing a hidden passage.” |
| `cellar_secret` | Pull lever between barrels in **cellar_storage** | cellar_storage ↔ secret_tunnel | “The barrels roll aside, revealing a hidden passage.” |

Switches in **hidden_room** and **secret_tunnel** can reopen passages from the far side.

### NPC placements (by room)

| Room | NPCs |
|------|------|
| hall | Mrs. Clarke (maid), Chef Pierre (cook), Lady Blackwood (baroness), Inspector Walsh (police) |
| library | Mr. Thompson (butler), Baron Blackwood (baron) |
| kitchen | Groundskeeper (worker_man) |
| study | Constable Reed (police2), Stable Boy (worker_boy) |

---

## Dialog — source files

Dialog and player-facing text come from several layers. At runtime, **story overrides replace base NPC dialog** when an active story is loaded (`src/content/loadStoryContent.ts` → `applyStoryDialogOverrides`).

### Primary dialog data (JSON)

| File | Contents |
|------|----------|
| `src/data/npcs/butler.json` | Mr. Thompson — default + conditional (base game: `torn_page`) |
| `src/data/npcs/cook.json` | Chef Pierre — default + conditional (base game: `torn_page`; murderer confession line) |
| `src/data/npcs/maid.json` | Mrs. Clarke — default only |
| `src/data/npcs/baron.json` | Baron Blackwood — default only |
| `src/data/npcs/baroness.json` | Lady Blackwood — default only |
| `src/data/npcs/police.json` | Inspector Walsh — default only |
| `src/data/npcs/police2.json` | Constable Reed — default only |
| `src/data/npcs/worker_man.json` | Groundskeeper — default only |
| `src/data/npcs/worker_boy.json` | Stable Boy — default only |
| `src/data/story/generated/stories/active.json` | **Active story overrides** — `npcDialogOverrides` for butler, maid, cook, baron, baroness (replaces base NPC files when story is active) |

### Intro & menu (TypeScript, hardcoded)

| File | Contents |
|------|----------|
| `src/engine/IntroScreen.ts` | Premise slide, household character introductions (9 slides), detective arrival slide |
| `src/engine/Menu.ts` | Main menu, character select, game over, settings labels |
| `src/render/GameHud.ts` | Victory overlay (“Congratulations!”, “The murderer is being apprehended.”) |
| `src/engine/ClueNotification.ts` | “Clue Found!” notification |
| `src/engine/InventoryPanel.ts` | Inventory panel copy (“No clues found yet”, etc.) |

### Examine text & confirmation prompts (furniture)

| File | Contents |
|------|----------|
| `src/data/furniture/decorations.json` | Descriptions and `confirmPrompt` for fountain, fireplace, cellar hatch, secret bookshelf, passage levers, horses, wine barrels, etc. |
| `src/data/furniture/table.json` | Table examine text |
| `src/data/furniture/bookshelves.json` | Bookshelf examine text |
| `src/data/rooms/library.json` | Override description on one bookshelf placement |

Story **clue examine hints** and **room narrative summaries** are applied at runtime from `active.json` via `src/content/applyStoryToGame.ts` (overwrites furniture descriptions where clues are assigned).

### Puzzle & gameplay messages (TypeScript)

| File | Contents |
|------|----------|
| `src/puzzles/StudySecretPuzzle.ts` | Bookshelf reveal message |
| `src/puzzles/CellarSecretPuzzle.ts` | Barrel reveal message |
| `src/engine/Game.ts` | Appends `" Find a police officer!"` when accusing the murderer with all clues collected |

### Dialog resolution

- **NPC talk:** `src/systems/DialogSystem.ts` picks `conditions[].dialog` when `requiresClue` is satisfied, else `default`.
- **Rendering:** `src/systems/InteractionSystem.ts` formats as `"Name: line"`; `src/render/GameHud.ts` draws the message box.

### Base NPC dialog (used when no story override)

| NPC | Default | Conditional (`requiresClue`) |
|-----|---------|------------------------------|
| Butler | “Good evening, sir. Is there anything I can help you with?” | `torn_page` → study reference |
| Cook | “Dinner will be ready at eight. I hope nothing spoils the evening.” | `torn_page` → murderer threat |
| Maid | “I've been cleaning the hall all morning. Have you seen the master?” | — |
| Baron | “I trust you are finding everything in order, Detective. This household has seen better days.” | — |
| Baroness | “Please find whoever did this. The staff are beside themselves.” | — |
| Inspector Walsh | “We've secured the scene. Report any findings to me at once.” | — |
| Constable Reed | “No one leaves the manor until the Inspector says so.” | — |
| Groundskeeper | “I was out by the shed when I heard the commotion. Didn't see nothing.” | — |
| Stable Boy | “The horses are spooked. Something's not right tonight.” | — |

### Active story NPC overrides (`active.json`)

| NPC | Default | Conditional |
|-----|---------|-------------|
| Butler | “Good evening. I trust you will be discreet.” | `silver_key` → denies ownership |
| Maid | “I've finished in the kitchen, if that is what you need.” | `torn_page` → library alibi |
| Cook | “The roast was perfect. I have nothing to hide.” | `bloody_apron` → stain excuse |
| Baron | “I retired early. These old bones need rest.” | `torn_page` → ledger denial |
| Baroness | “The garden air helps me think. Do not disturb me long.” | `wilting_rose` → rose gift |

---

## Clues

### Clue catalog files

| File | Role |
|------|------|
| `src/data/clues.json` | Base clue catalog (fallback); defines `torn_page` |
| `src/data/story/generated/stories/active.json` | **Active story clues** — `generatedClues` + `clueAssignments` |
| `src/content/clueCatalog.ts` | Merges base + story clues for inventory display |
| `src/content/applyStoryToGame.ts` | Places clues on furniture at runtime |

Without an active story, only `torn_page` is required to accuse the murderer (`getRequiredClueIds` fallback).

### Active story clues (5 required)

| ID | Name | Description | Location | Furniture | Examine hint |
|----|------|-------------|----------|-----------|--------------|
| `torn_page` | Torn Page | A torn page from a ledger, the ink still fresh. | library | table (index 0) | Pages are scattered across the table. One sheet was torn out deliberately. |
| `bloody_apron` | Stained Apron | A kitchen apron with a faint rust-coloured stain. | kitchen | kitchen_table (index 0) | A stained apron hangs over the back of a chair. |
| `silver_key` | Silver Key | A small key that does not match any obvious lock in the hall. | hall | bookshelves (index 0) | Something glints between the books on the lower shelf. |
| `wilting_rose` | Wilting Rose | A rose dropped near the fountain, petals crushed underfoot. | garden | fountain (index 0) | Petals float in the fountain basin. |
| `charred_note` | Charred Note | Most of a note burned away; only a time remains legible: eleven. | dining | fireplace (index 0) | Ashes in the grate still smell of burnt paper. |

### Base catalog clue (`clues.json`)

| ID | Name | Description |
|----|------|-------------|
| `torn_page` | Torn Page | A torn page from a book, with handwriting that seems urgent. |

*(When the active story runs, story definitions take precedence for name/description.)*

### Legacy / editor clue templates

| Source | Notes |
|--------|-------|
| `src/data/rooms/library.json` | Bookshelf placement has hardcoded `"clues": ["torn_page"]` — **overwritten** when story is applied |
| `packages/content-schema/src/normalizeStory.ts` | Template names for procedurally generated stories: Torn Note, Stained Glove, Broken Watch, Smudged Letter, Missing Key |

### Clue-driven dialog gates

Clues unlock conditional NPC lines via `requiresClue` in NPC JSON or `npcDialogOverrides` in the active story (see tables above).

### Win condition

Collect all required clues → talk to the **murderer** (active story: **cook**) → talk to **Inspector Walsh** or **Constable Reed** to trigger the victory sequence.

**Murderer (active story):** `cook` (Chef Pierre)  
**Victim:** Lord Blackwood, hall, eleven o'clock

---

## Room narratives (active story)

Applied to all interactables in these rooms when the story loads:

| Room | Summary |
|------|---------|
| hall | The grand hall feels colder than it should. Something happened here recently. |
| library | Books are out of place, as if someone searched in haste. |
| dining | The table is set, but one chair was pushed back violently. |
