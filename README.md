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
3. Open `http://localhost:5173`.

## Level Editor (Simple)

1. Start editor + local backend:
   ```bash
   pnpm dev:editor:full
   ```
2. Open `http://localhost:5173/editor.html` (it may open automatically).
3. Select a room, edit the JSON, then click **Save Room To Backend**.
4. Create/rename/delete rooms with the buttons on the left.
5. Click **Validate Selected JSON** or **Validate All Rooms** to check for issues.

### Notes

- Room files are saved directly to `src/data/rooms/*.json`.
- If you see `Backend: offline`, start:
  ```bash
  pnpm dev:editor:backend
  ```
- Run global content checks anytime with:
  ```bash
  pnpm validate
  ```

## AI Story Generation (Local)

The editor can generate static story variants locally through the backend.
This is an offline authoring step (not live gameplay inference).

1. Start editor + backend:
   ```bash
   pnpm dev:editor:full
   ```
2. In the editor, use **Generate Story (AI)**.
3. Choose quality mode (`Fast Local` or `Quality Local`) and variant count.
4. Generated files are written to:
   - `src/data/story/generated/stories/*.json`
   - `src/data/story/generated/story_manifest.json`

### Ollama setup

- Backend expects local Ollama API at `http://localhost:11434` by default.
- Env overrides:
  - `OLLAMA_BASE_URL`
  - `AI_MODEL_DEFAULT`
  - `AI_MODEL_QUALITY`

## Docker (Optional Local Stack)

Bring up editor + backend + Ollama:

```bash
pnpm docker:up
```

Stop services:

```bash
pnpm docker:down
```

### Local Docker Setup (No Docker Desktop)

If you do not want Docker Desktop on macOS, use Colima + Docker CLI.

1. Install runtime + CLI tools:
   ```bash
   brew install colima docker docker-compose
   ```
2. Start Colima:
   ```bash
   colima start --cpu 4 --memory 8 --disk 40
   ```
3. Verify Docker/Compose:
   ```bash
   docker version
   docker compose version
   ```
4. Start project stack:
   ```bash
   pnpm docker:up
   ```
5. Stop project stack:
   ```bash
   pnpm docker:down
   ```

Notes:
- First run may take a while due to image/model pulls.
- If `docker compose` is unavailable, try `docker-compose up`.

## Debug Mode

To enable debug visualization for collision and interaction areas, add `?debug=true` to the URL when running the game.

### How to Use Debug Mode

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open the game with debug flag:**
   - Navigate to: `http://localhost:5173/?debug=true`
   - Or: `http://localhost:5173/index.html?debug=true`

3. **Debug overlays will show:**
   - **Red outline + grid**: Player collision box and occupied tiles
   - **Blue outline + grid**: NPC collision boxes and occupied tiles  
   - **Green outline + grid**: Furniture collision areas and occupied tiles
   - **Yellow highlight**: Interaction target tile (where you're facing)
   - **Orange dot**: Player's interaction point (center)
   - **Orange dashed line**: Interaction reach line from interaction point to target tile

### Debug Mode Features

- Visualize collision boundaries for all entities
- See which tiles are occupied by player, NPCs, and furniture
- Check if interaction target tile overlaps with interactable objects
- Diagnose collision/interaction issues

### Disable Debug Mode

Simply reload the page without the `?debug=true` parameter, or use `?debug=false`.
