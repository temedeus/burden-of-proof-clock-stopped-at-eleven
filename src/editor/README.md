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
docker compose exec ollama ollama pull ministral-3:3b
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

In the editor, use **Generate Story (AI)** and set the variant count. Uses **Ministral 3B** (`ministral-3:3b`) by default — Mistral’s smallest local model (~3 GB download, ~4 GB RAM while running).

Output:

- `src/data/story/generated/stories/*.json`
- `src/data/story/generated/story_manifest.json`

Requires Ollama at `http://localhost:11434` (local install or Docker stack below).

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API base URL |
| `AI_MODEL` | `ministral-3:3b` | Ollama model name (`AI_MODEL_DEFAULT` also accepted) |
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

Default `ministral-3:3b` needs ~4 GB RAM in Colima. If you hit OOM, give Colima more memory or use `tinyllama` via `AI_MODEL=tinyllama`:

```bash
colima stop
colima start --cpu 4 --memory 8 --disk 40
```

**Model not found (HTTP 404):**

Usually the backend is still running **old code** or the model was never pulled.

```bash
docker compose exec ollama ollama pull ministral-3:3b
pnpm dev:editor:backend
```

Check backend + Ollama alignment:

```bash
curl -s http://localhost:8787/health | python3 -m json.tool
curl -s http://localhost:11434/api/tags
```

`health` should show `"aiModel": "ministral-3:3b"` and `"aiModelReady": true`.

**Note:** `ministral-3` needs a recent Ollama (0.13.1+). Upgrade the Docker image if pull fails: `docker compose pull ollama`.

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

## Cleaning up Docker & Ollama

### Stop running services

```bash
pnpm docker:ollama:down    # Ollama only
pnpm docker:down           # full stack (editor + backend + Ollama)
```

Also press **Ctrl+C** in any terminal running `pnpm dev:editor:full` or `pnpm dev`.

---

### Level 1 — Remove downloaded models only (keep Docker setup)

Deletes all models inside the Ollama volume but keeps the volume/container setup.

**While Ollama is running:**

```bash
docker compose exec ollama ollama list
docker compose exec ollama ollama rm ministral-3:3b
docker compose exec ollama ollama rm tinyllama
docker compose exec ollama ollama rm mistral
# repeat for any other models from `ollama list`
```

**Or wipe the model store in one step** (Ollama can be stopped):

```bash
pnpm docker:ollama:down
docker volume rm clock-stopped-at-eleven_ollama_data
```

If the volume name differs: `docker volume ls | grep ollama`

---

### Level 2 — Reset this project’s Docker (containers + volumes)

Removes containers and **both** compose volumes for this repo (`ollama_data` = all pulled models, `editor_node_modules` = container `node_modules`):

```bash
pnpm docker:clean
```

Equivalent manual command:

```bash
docker compose --profile ollama --profile full down -v --remove-orphans
```

Does **not** remove built images or the `ollama/ollama` base image. After this, run `pnpm docker:ollama:up` and `ollama pull ministral-3:3b` again.

---

### Level 3 — Remove this project’s built images

After Level 2, delete images built for `editor-app` / `editor-backend`:

```bash
docker images --format '{{.Repository}}:{{.Tag}}' | grep clock-stopped-at-eleven | xargs -r docker rmi
```

On macOS without `xargs -r`:

```bash
docker images | grep clock-stopped-at-eleven | awk '{print $3}' | xargs docker rmi 2>/dev/null
```

---

### Level 4 — Remove Ollama image and reclaim all unused Docker disk

**Warning:** affects other Docker projects on your machine, not only this repo.

```bash
pnpm docker:clean
docker rmi ollama/ollama:latest
docker image prune -f
docker volume prune -f
docker builder prune -f
```

Optional aggressive cleanup (unused containers, networks, images):

```bash
docker system prune -a --volumes
```

---

### Native Ollama (not Docker)

If you installed the Ollama app / CLI on macOS:

```bash
ollama list
ollama rm ministral-3:3b
# nuclear — all local models + cache:
rm -rf ~/.ollama
```

---

### Generated story files in the repo (optional)

This is **not** Docker; it only clears AI output under `src/data/`:

```bash
rm -rf src/data/story/generated/stories/*
rm -f src/data/story/generated/story_manifest.json
```

Room/NPC JSON you edited in the editor is **not** removed.

---

### Fresh start checklist

```bash
pnpm docker:clean
docker rmi ollama/ollama:latest 2>/dev/null
pnpm docker:ollama:up
docker compose exec ollama ollama pull ministral-3:3b
pnpm dev:editor:full
```

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
