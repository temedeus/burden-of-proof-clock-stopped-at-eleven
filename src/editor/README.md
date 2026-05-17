# Level Editor & AI Backend

Authoring tools for rooms, NPC placement, doors, and AI-generated story variants. The game runtime does not depend on these tools.

**AI is authoring-time only.** Generation writes static JSON files under `src/data/story/`; the game reads them like any other content (no live inference during play).

---

## Run Modes

| Mode | Command | URLs |
|------|---------|------|
| **Editor + backend (local)** | `pnpm dev:editor:full` | `http://localhost:5173/editor.html`, backend `http://localhost:8787` |
| **Editor + backend (local), Ollama (Docker)** | see [Hybrid setup](#editor--backend-local-ollama-in-docker) | Same editor/backend URLs; Ollama `http://localhost:11434` |
| **Everything in Docker** | `pnpm docker:up` | Editor: `http://localhost:5173/editor.html`, Backend: `http://localhost:8787`, Ollama: `http://localhost:11434` |

From the repo root. Install dependencies first: `pnpm install`.

---

## Editor + backend (local), Ollama in Docker

Use this when you want the editor and Node backend on your machine (fast reload, direct file saves) but only run **Ollama** in Docker.

**Terminal 1 — Ollama in Docker:**

```bash
pnpm docker:ollama:up
docker compose exec ollama ollama pull tinyllama
```

**Terminal 2 — editor + backend on the host:**

```bash
pnpm dev:editor:full
```

Open `http://localhost:5173/editor.html`.

The local backend defaults to `OLLAMA_BASE_URL=http://localhost:11434`, which reaches the Docker-published Ollama port. No extra env vars needed.

Stop Ollama when done:

```bash
pnpm docker:ollama:down
```

### Editor + backend only (no AI)

Same as above but skip Ollama. Room editing and save still work; **Generate Story (AI)** needs Ollama running (Docker or native install).

```bash
pnpm dev:editor:full
```

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

If rooms work but **Generate Story (AI)** returns HTTP 404, an old backend process is probably still bound to port `8787`. Stop it and restart:

```bash
pnpm dev:editor:backend
```

With Docker: `docker compose restart editor-backend`

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

In the editor, use **Generate Story (AI)** and set the variant count. Uses the local `tinyllama` model by default (~1 GB RAM).

Output:

- `src/data/story/generated/stories/*.json`
- `src/data/story/generated/story_manifest.json`

Requires Ollama at `http://localhost:11434` (local install or Docker stack below).

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API base URL |
| `AI_MODEL` | `tinyllama` | Ollama model name (`AI_MODEL_DEFAULT` also accepted) |
| `EDITOR_BACKEND_PORT` | `8787` | Backend listen port |

In Docker, `OLLAMA_BASE_URL` is set to `http://ollama:11434` for the backend service.

### Troubleshooting: `Ollama request failed` / HTTP 500

Check Ollama logs:

```bash
docker compose logs ollama --tail 20
```

**Out of memory** — logs look like:

```text
model requires more system memory (4.5 GiB) than is available (1.9 GiB)
```

Default `tinyllama` fits in ~2 GB. If you switched to a larger model, either pull `tinyllama` again or give Colima more RAM:

```bash
colima stop
colima start --cpu 4 --memory 8 --disk 40
```

**Model not found (HTTP 404):**

Usually the backend is still running **old code** (asking for `mistral`) or `tinyllama` was never pulled.

```bash
docker compose exec ollama ollama pull tinyllama
# restart backend so it picks up AI_MODEL=tinyllama:
pnpm dev:editor:backend
```

Check backend + Ollama alignment:

```bash
curl -s http://localhost:8787/health | python3 -m json.tool
curl -s http://localhost:11434/api/tags
```

`health` should show `"aiModel": "tinyllama"` and `"aiModelReady": true`.

### Backend API (selected)

| Method | Path | Description |
|--------|------|-------------|
| `GET/PUT/POST/DELETE` | `/api/rooms` | Room CRUD |
| `POST` | `/api/ai/generate-case` | Generate story variants |
| `POST` | `/api/ai/preview-case` | Dry-run generation (no writes) |
| `GET` | `/api/ai/stories` | Read story manifest |
| `DELETE` | `/api/ai/stories/:id` | Remove a variant |

---

## Docker: full stack (editor + backend + Ollama)

Brings up editor UI, backend, and Ollama in containers:

```bash
pnpm docker:up
```

Stop:

```bash
pnpm docker:down
```

Compose profiles in `docker-compose.yml`:

| Profile | Services |
|---------|----------|
| `ollama` | Ollama only (`pnpm docker:ollama:up`) |
| `full` | `editor-app` + `editor-backend` + `ollama` (`pnpm docker:up`) |

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
