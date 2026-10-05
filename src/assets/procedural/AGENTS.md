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
| `ballroom_windows.ts` | Animated ballroom clerestory windows (dancing_room) |

`oil_lamp` is in `sprites.ts` but drawn at runtime, not baked in `registry.ts`.

**Registry-baked modules:**

| Module | Used for |
|--------|----------|
| `pond.ts` | Garden pond (baked via `POND_SPRITES` in `registry.ts`) |
| `stuffed_moose.ts` | Study moose trophy (32×48 pixel template, baked via `furniture.ts`) |
| `furnitureInterior.ts` | Redrawn interior pieces (shelves, tables, carpet, cabinet, chest, hall clock, barrel, rack) |
| `furnitureBedBath.ts` | Bathroom (tub, toilet, boiler), master bedroom (four-poster, vanity, nightstand), guest + maid beds, and the shared `drawRug` |
| `furnitureOutdoor.ts` | Redrawn garden/courtyard pieces (oak, bush, pond, stable) |
| `staircase.ts` | Staircase variants (manor/attic/stone, up/down); `roomScene.ts` picks one from wall side + floor tile |
| `doors.ts` | Exit doors drawn at 1x by `drawDoorSprites` (`roomScene.ts`): closed doors on north walls, open doorways on south/side walls; the carved wall is refilled from the neighbouring wall first |
| `furnitureKit.ts` | Shared helpers: wood/stone/iron ramps, panels, tabletops, legs, book rows, floor shadows, `line`, `ellipse` |

## Conventions

- Match existing palette colors from `palette.ts`.
- Use `bakeSprite()` and `ProceduralSpriteDef` for registry sprites.
- Keep sprite dimensions consistent with tile grid (see existing definitions).
- **Integer, uniform scale only:** native size × 1 (tile detail) or × 2 (character detail) must equal the draw box from the furniture JSON (`drawWidth`/`drawHeight`, or footprint). Never let a sprite stretch non-uniformly or by a fraction — it drops/duplicates pixel rows. Custom-draw modules (`fireplace.ts`, `fountain.ts`, `kitchen_stove.ts`) follow the same rule via their native constants.
- Use the crisp helpers (`rrCrisp`, `discCrisp`, `triCrisp`, kit `ellipse`/`line`) rather than canvas paths, which anti-alias.
- After adding a new sprite name, run `pnpm validate`.

## Do not

- Add sprites only to room JSON without registering in `sprites.ts`.
- Assume all sprites go through `registry.ts` — check if custom draw is needed first.
