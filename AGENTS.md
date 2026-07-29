# Agent instructions

Pixel-art Canvas 2D murder mystery. JSON-driven content; procedural sprites. No runtime npm dependencies.

## Commands

```bash
pnpm install          # install dependencies
pnpm dev              # game at http://localhost:5173/
pnpm dev:editor:full  # editor UI + file backend (see src/editor/AGENTS.md)
pnpm validate         # validate all content JSON
pnpm test             # unit tests (vitest)
pnpm typecheck        # tsc --noEmit
pnpm build            # production build
pnpm preview          # preview production build
```

## Entry points

| Entry | File |
|-------|------|
| Game bootstrap | `src/index.ts` |
| Game coordinator | `src/engine/Game.ts` |
| Editor bootstrap | `src/editor/index.ts` |
| Content schema | `packages/content-schema/` |

## Directory map

| Path | Role |
|------|------|
| `src/engine/` | App shell: Loop, Menu, IntroScreen, Input, Game, SaveGame, Settings |
| `src/world/` | Room, TileMap, room factory, NPC spawn |
| `src/entities/` | Player, NPC |
| `src/systems/` | Clues, dialog, interaction, transitions, chase, victory |
| `src/puzzles/` | Secret passage puzzles, confirm/unlock registry |
| `src/content/` | JSON loaders, story application, startup validation |
| `src/data/` | Authoritative content JSON — see `src/data/AGENTS.md` |
| `src/render/` | Canvas room scene, HUD |
| `src/assets/` | SpriteLoader, SpriteMap |
| `src/assets/procedural/` | Sprite generators — see `src/assets/procedural/AGENTS.md` |
| `src/audio/` | Footsteps, ambience, SFX |
| `src/editor/` | Level/case editor — see `src/editor/AGENTS.md` |

## Where to change what

| Change | Location |
|--------|----------|
| Room layout, doors, NPC placement | `src/data/rooms/<id>.json` |
| NPC base dialog | `src/data/npcs/<id>.json` |
| Story clues, culprit, dialog overrides | `src/data/story/generated/stories/active.json` |
| Furniture definitions | `src/data/furniture/*.json` |
| Room display title (banner) | `src/engine/Game.ts` — `ROOM_DISPLAY_TITLES` |
| New sprite | `packages/content-schema/src/sprites.ts` + procedural art |
| Gameplay systems | `src/systems/`, `src/puzzles/` |
| UI copy (menu, intro, victory) | `src/engine/`, `src/render/GameHud.ts` |
| Local progress save / Continue | `src/engine/SaveGame.ts`, `Game.ts` (`applySave` / `autosave`), `Menu.ts`, `index.ts` |

For narrative/content handoffs, see [GAME_REFERENCE.md](GAME_REFERENCE.md). For code layout, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Conventions

- **Data-driven rooms** — new rooms need only JSON + `pnpm validate`; auto-discovered via `import.meta.glob`.
- **Story overrides base dialog** — when `active.json` is valid, story `npcDialogOverrides` replace NPC JSON dialog.
- **Minimal diffs** — match existing patterns; don't refactor unrelated code.
- **Validate after content edits** — always run `pnpm validate`.
- **Test when touching gameplay** — run `pnpm test` for systems, puzzles, or render changes.
- **Breaking content vs saves** — bump `SAVE_CONTENT_REVISION` in `SaveGame.ts` when clue/room ids or puzzle wiring change incompatibly (see `src/data/AGENTS.md`).

## Rendering

Canvas 2D with y-sorted `DepthActor`s — **not a scene graph**. Draw passes live in `src/render/roomScene.ts`.

Procedural art has two paths: registry-baked sprites (`registry.ts`) and runtime custom draw (`fireplace`, `fountain`, `oil_lamp`, etc.). See `src/assets/procedural/AGENTS.md`.

## Do not

- Edit `GAME_REFERENCE.md` expecting runtime changes — it is a derived summary; edit JSON instead.
- Add runtime npm dependencies.
- Ship the editor or file backend in production builds.
- Assume Three.js or WebGL — this project uses Canvas 2D only.

## Nested agent docs

| File | Scope |
|------|-------|
| [src/data/AGENTS.md](src/data/AGENTS.md) | Content JSON authoring |
| [src/assets/procedural/AGENTS.md](src/assets/procedural/AGENTS.md) | Procedural sprite art |
| [src/editor/AGENTS.md](src/editor/AGENTS.md) | Level/case editor |
