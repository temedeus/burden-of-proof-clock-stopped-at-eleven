# Level Editor & AI Backend

Authoring tools for rooms, NPC placement, doors, and AI-generated story variants. The game runtime does not depend on these tools.

**AI is authoring-time only.** Generation writes static JSON files under `src/data/story/`; the game reads them like any other content (no live inference during play).

---

## Run Modes

| Mode | Command | URLs |
|------|---------|------|
| **Editor (local)** | `pnpm dev:editor:full` | `http://localhost:5173/editor.html` |
| **Editor + AI (Docker)** | `pnpm docker:up` | Editor: `http://localhost:5173/editor.html`, Backend: `http://localhost:8787`, Ollama: `http://localhost:11434` |

From the repo root. Install dependencies first: `pnpm install`.

---

## Level Editor (Local)

Runs the editor UI and local backend on your machine (no Docker).

1. Start both processes:
   ```bash
   pnpm dev:editor:full
   ```
2. Open `http://localhost:5173/editor.html`.
3. Edit rooms on the canvas; use **Save Room To Backend** or **Save All Rooms To Backend**.
4. Validate content:
   ```bash
   pnpm validate
   ```

Room files are written to `src/data/rooms/*.json`.

If the UI shows **Backend: offline**, start only the backend:

```bash
pnpm dev:editor:backend
```

### Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev:editor` | Vite dev server for `editor.html` |
| `pnpm dev:editor:backend` | Room CRUD + AI API on port `8787` |
| `pnpm dev:editor:full` | Backend + editor together |

### Key paths

| Path | Purpose |
|------|---------|
| `editor.html` | Editor entry page |
| `src/editor/index.ts` | Editor UI |
| `scripts/editor-backend.mjs` | HTTP API for rooms and AI generation |

---

## AI Story Generation

In the editor, use **Generate Story (AI)**. Choose quality mode (`Fast Local` / `Quality Local`) and variant count.

Output:

- `src/data/story/generated/stories/*.json`
- `src/data/story/generated/story_manifest.json`

Requires Ollama at `http://localhost:11434` (local install or Docker stack below).

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API base URL |
| `AI_MODEL_DEFAULT` | `mistral` | Model for fast generation |
| `AI_MODEL_QUALITY` | `mistral` | Model for quality generation |
| `EDITOR_BACKEND_PORT` | `8787` | Backend listen port |

In Docker, `OLLAMA_BASE_URL` is set to `http://ollama:11434` for the backend service.

### Backend API (selected)

| Method | Path | Description |
|--------|------|-------------|
| `GET/PUT/POST/DELETE` | `/api/rooms` | Room CRUD |
| `POST` | `/api/ai/generate-case` | Generate story variants |
| `POST` | `/api/ai/preview-case` | Dry-run generation (no writes) |
| `GET` | `/api/ai/stories` | Read story manifest |
| `DELETE` | `/api/ai/stories/:id` | Remove a variant |

---

## Docker: Editor + AI Backend

Brings up editor UI, backend, and Ollama:

```bash
pnpm docker:up
```

Stop:

```bash
pnpm docker:down
```

Services are defined in `docker-compose.yml` at the repo root (`editor-app`, `editor-backend`, `ollama`).

### Local Docker without Docker Desktop (macOS)

```bash
brew install colima docker docker-compose
colima start --cpu 4 --memory 8 --disk 40
docker version
docker compose version
pnpm docker:up
```

First run may take a while (image and model pulls). Open `http://localhost:5173/editor.html` manually in the browser.

---

## Validation

From the repo root:

```bash
pnpm validate
```

Checks rooms, NPC placement (each NPC exactly once globally), furniture/sprite references, exit links, and generated story manifest consistency when story files exist. Shared rules live in `packages/content-schema`.

---

## Deployment

Do not ship the editor, backend, or Ollama with a production game build. Deploy only game runtime + static data (`src/data/**`). Generated story files are normal static content and can be included in a game release after authoring.
