# clock-stopped-at-eleven

A pixel-art murder mystery set at Blackwood Manor. Explore rooms, talk to suspects, collect clues, and work out who stopped the clock at eleven.

**Play online:** [temedeus.codeberg.page/burden-of-proof-clock-stopped-at-eleven](https://temedeus.codeberg.page/burden-of-proof-clock-stopped-at-eleven/)

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

For architecture and content authoring overview, see **[ARCHITECTURE.md](ARCHITECTURE.md)**.

For agent/coding-assistant instructions, see **[AGENTS.md](AGENTS.md)**.

---

## Development

```bash
pnpm typecheck    # TypeScript check
pnpm test         # unit tests
pnpm build        # production build
pnpm preview      # preview production build
```

---

## Game

```bash
pnpm dev
```

Optional debug mode: `http://localhost:5173/?debug=true`

Debug overlays show collision boundaries, interaction targets, and reach lines. Clue objects are highlighted in **amber** (uncollected) or **gray** (already in inventory), with clue ids labeled on the tile. Reload without `?debug=true` to disable.

Optional mobile simulation on desktop: `http://localhost:5173/?simulateMobile=true` (or `?simulateMobile=1`)

Shows the on-screen touch controls (joystick, Interact, Inventory, Menu) and mobile UI hints without a phone or tablet. Useful for testing touch input and layout in the browser devtools. Combine with other params, e.g. `?simulateMobile=true&debug=true`.

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

Live build: [https://temedeus.codeberg.page/burden-of-proof-clock-stopped-at-eleven/](https://temedeus.codeberg.page/burden-of-proof-clock-stopped-at-eleven/)


Ship only the game runtime and static data (`src/data/**`). The editor and file backend are development tools — see [src/editor/README.md](src/editor/README.md).
