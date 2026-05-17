# clock-stopped-at-eleven

## Quick Start

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Run the game:
   ```bash
   pnpm dev
   ```
3. Open `http://localhost:5173/`.

## Run Modes

| Mode | Command | URL |
|------|---------|-----|
| **Game** | `pnpm dev` | `http://localhost:5173/` |

For the level editor and AI story backend (local or Docker), see **[src/editor/README.md](src/editor/README.md)**.

---

## Game

```bash
pnpm dev
```

Optional debug mode: `http://localhost:5173/?debug=true`

Debug overlays show collision boundaries, interaction targets, and reach lines. Reload without `?debug=true` to disable.

---

## Content validation

```bash
pnpm validate
```

Validates game content (rooms, NPCs, furniture, generated stories). Used during authoring; see [src/editor/README.md](src/editor/README.md) for details.

---

## Deployment

Ship only the game runtime and static data (`src/data/**`). Editor, AI backend, and Ollama are development tools — see [src/editor/README.md](src/editor/README.md).
