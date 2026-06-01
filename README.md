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

For the level editor and case authoring backend, see **[src/editor/README.md](src/editor/README.md)**.

---

## Game

```bash
pnpm dev
```

Optional debug mode: `http://localhost:5173/?debug=true`

Debug overlays show collision boundaries, interaction targets, and reach lines. Clue objects are highlighted in **amber** (uncollected) or **gray** (already in inventory), with clue ids labeled on the tile. Reload without `?debug=true` to disable.

### Cases (authored in the editor)

When `src/data/story/generated/stories/active.json` is valid, the game loads that story (clues on furniture, dialog overrides, culprit). Optional URL override (same file):

`http://localhost:5173/?story=active`

Run `pnpm validate` after editing rooms or cases. With no valid manifest entries, the game uses default NPC dialog from `src/data/npcs/`.

---

## Content validation

```bash
pnpm validate
```

Validates rooms, NPC placement, furniture references, and case files. See [src/editor/README.md](src/editor/README.md) for details.

---

## Deployment

Ship only the game runtime and static data (`src/data/**`). The editor and file backend are development tools — see [src/editor/README.md](src/editor/README.md).
