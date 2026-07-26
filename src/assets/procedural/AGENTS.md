# Procedural art — agent instructions

Sprites are generated in code under `src/assets/procedural/`. Shared utilities: `pixel.ts`, `palette.ts`, `types.ts`.

## Two paths

### 1. Registry bake (static sprites)

For sprites that don't need per-frame context at draw time.

1. Add definition to the appropriate module (`tiles.ts`, `characters.ts`, `furniture.ts`, `garden.ts`, `exterior.ts`, `animals.ts`, etc.).
2. Ensure it is included in `ALL_DEFS` via [`registry.ts`](registry.ts).
3. Register name in [`packages/content-schema/src/sprites.ts`](../../../packages/content-schema/src/sprites.ts).
4. Add furniture entry in `src/data/furniture/*.json` if placeable.
5. Run `pnpm validate`.

Sprites are baked at load by `SpriteLoader` via `generateAllSprites()`.

### 2. Runtime custom draw (animated / contextual)

For sprites needing animation, wall-side detection, or draw-time state.

1. Create a draw module (e.g. `oil_lamp.ts`, `fireplace.ts`, `fountain.ts`).
2. Register sprite name in `packages/content-schema/src/sprites.ts` (for furniture reference).
3. Wire the draw call in [`src/render/roomScene.ts`](../../render/roomScene.ts).
4. Add furniture entry and place in room JSON.

**Current custom-draw modules:**

| Module | Used for |
|--------|----------|
| `fireplace.ts` | Animated fireplace |
| `kitchen_stove.ts` | Animated kitchen stoves (pans + steam) |
| `fountain.ts` | Animated fountain |
| `oil_lamp.ts` | Wall-mounted lamps with flicker |
| `wall_align.ts` | Wall-side bounds for mounted decor |
| `attic_mouse.ts` | Attic mice (via `AtticMiceController`) |
| `seagull.ts` | Courtyard seagull (via `CourtyardSeagullController`) |
| `animals.ts` | Horses (animated stable booths) |

`oil_lamp` is in `sprites.ts` but drawn at runtime, not baked in `registry.ts`.

## Conventions

- Match existing palette colors from `palette.ts`.
- Use `bakeSprite()` and `ProceduralSpriteDef` for registry sprites.
- Keep sprite dimensions consistent with tile grid (see existing definitions).
- After adding a new sprite name, run `pnpm validate`.

## Do not

- Add sprites only to room JSON without registering in `sprites.ts`.
- Assume all sprites go through `registry.ts` — check if custom draw is needed first.
