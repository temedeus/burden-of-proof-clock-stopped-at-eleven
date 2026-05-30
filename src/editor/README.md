# Level editor

Authoring tools for rooms, NPCs, doors, and **murder-mystery cases** (clues, culprit, assignments). The game runtime reads the JSON you save here; nothing runs at play time except static data.

## Quick start

```bash
pnpm install
pnpm dev:editor:full
```

- Editor UI: `http://localhost:5173/editor.html`
- File backend: `http://localhost:8787`

Or run separately:

```bash
pnpm dev:editor:backend   # terminal 1
pnpm dev:editor           # terminal 2
```

## Workflow

1. **Rooms** — Place furniture, NPCs, and doors on the canvas. Save rooms to disk (`Save Room` / `Save All`).
2. **Story** — Title, culprit, validate, and save.
3. **Clues tab** — Choose a clue from the dropdown (or add/remove clues). Set id/name/description, **room**, **furniture**, and examine hint for that clue.
4. **Validate & save** — `Validate Story`, then `Save Story`. Each save archives the previous `active.json` under `stories/archive/<timestamp>/` and removes any other story JSON in `stories/`. Run `pnpm validate` from the repo root.
5. **Playtest** — **Play story in game** → `http://localhost:5173/?story=active`

The game uses one story file:

- `src/data/story/generated/stories/active.json`
- `src/data/story/generated/story_manifest.json` (single entry, id `active`)

## Backend API

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | `{ ok, features: ["rooms","story"] }` |
| `GET` | `/api/rooms` | Load all room JSON |
| `PUT` | `/api/rooms/:id` | Save one room |
| `POST` | `/api/rooms/sync` | Save all rooms from editor |
| `GET` | `/api/story` | Load the active story packet |
| `PUT` | `/api/story` | Save story (archive previous, purge other story files) |

Implementation: `scripts/editor-backend.mjs`.

## Validation

```bash
pnpm validate
```

Checks room layout, global NPC placement (each NPC once), furniture/sprite references, and case shape (exactly 5 clues and assignments, valid culprit, furniture slots exist). Shared rules live in `packages/content-schema`.

## Docker (optional)

```bash
pnpm docker:up      # editor-app + editor-backend
pnpm docker:down
pnpm docker:clean   # removes editor_node_modules volume
```

## Game vs editor

| | Game | Editor |
|---|------|--------|
| Command | `pnpm dev` | `pnpm dev:editor:full` |
| Needs backend | No | Yes (to write files) |
| Ollama / AI | No | Removed — cases are hand-authored |

Do not ship the editor or backend with a production game build.
