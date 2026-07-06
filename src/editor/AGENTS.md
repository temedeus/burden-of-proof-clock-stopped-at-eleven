# Editor — agent instructions

Level/case authoring tool. Separate Vite entry; writes JSON to disk via a file backend. Not shipped in production.

## Quick start

```bash
pnpm dev:editor:full
```

- Editor UI: `http://localhost:5173/editor.html`
- File backend: `http://localhost:8787`

Or run separately: `pnpm dev:editor:backend` + `pnpm dev:editor`.

## Workflow

1. **Rooms** — Place furniture, NPCs, doors. Save via `Save Room` / `Save All`.
2. **Story** — Set title, culprit. Use Clues tab for clue assignments.
3. **Validate** — `Validate Story`, then `Save Story`.
4. **Verify** — `pnpm validate` from repo root.
5. **Playtest** — `http://localhost:5173/?story=active`

Story output:

- `src/data/story/generated/stories/active.json`
- `src/data/story/generated/story_manifest.json`

Each story save archives the previous `active.json` under `stories/archive/<timestamp>/`.

## Backend API

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Backend health check |
| `GET` | `/api/rooms` | Load all room JSON |
| `PUT` | `/api/rooms/:id` | Save one room |
| `POST` | `/api/rooms/sync` | Save all rooms |
| `GET` | `/api/story` | Load active story |
| `PUT` | `/api/story` | Save story (archive + purge) |

Implementation: `scripts/editor-backend.mjs`.

## Preview parity

Editor shares game rendering via `renderRoomScene` and `createRoomFromConfig` — preview should match runtime.

## Key modules

| Module | Role |
|--------|------|
| `index.ts` | Bootstrap, tabs, DOM wiring |
| `caseEditor.ts` | Story/clue form, story API |
| `roomEditor.ts` | Room CRUD, dirty tracking |
| `roomBackend.ts` | Rooms HTTP client |
| `canvas/RoomCanvas.ts` | Render loop, tool dispatch |

## Conventions

- Backend must be running to save files.
- Run `pnpm validate` after room or story saves.
- Do not add runtime dependencies for editor-only features.

More detail: [README.md](README.md).
