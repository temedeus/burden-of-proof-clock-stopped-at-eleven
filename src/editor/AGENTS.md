# Editor — agent instructions

Level/case authoring tool. Separate Vite entry; writes JSON to disk via a file backend. Not shipped in production.

Quick start, authoring workflow, backend API and source layout: [README.md](README.md).

```bash
pnpm dev:editor:full   # editor UI http://localhost:5173/editor.html + backend http://localhost:8787
```

## Conventions

- Backend must be running to save files.
- Run `pnpm validate` after room or story saves.
- Preview parity: the editor shares `renderRoomScene` and `createRoomFromConfig` with the game — fix rendering differences there, not in editor-only code.
- Do not add runtime dependencies for editor-only features.
