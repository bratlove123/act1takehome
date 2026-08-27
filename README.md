# Take-Home Exercise: Item Catalog (Database + CI/CD + Deployment)

Express API + React (Vite) frontend with Postgres-backed catalog, stock toggle,
server-side FX enrichment, GitHub Actions CI/CD, and Vercel + Neon deploy.

## Stack

- **Frontend**: React + Vite (`frontend/`)
- **Backend**: Express + `pg` (`backend/`)
- **Database**: PostgreSQL (local Docker Compose or Neon)
- **Deploy**: Vercel (static + serverless API) + Neon Postgres
- **CI**: GitHub Actions (PR checks + main-only deploy)

## Prerequisites

- Node.js 20+
- Docker (for local Postgres, for `docker build` of the backend, and for the all-in-one image)

## Environment

```bash
cp .env.example .env
# edit DATABASE_URL / EXTERNAL_API_KEY as needed
```

Never commit `.env`. Secrets for CI/deploy live in GitHub Actions / Vercel.

## Running the app

Pick one of the two flows below.

### Option 1 — Local dev (hot-reload frontend, Postgres in Docker)

Best for day-to-day development: Vite dev server with HMR, backend restarts on save, Postgres in a container.

1. **Database** — start Postgres via Docker Compose:

    ```bash
    docker compose up -d
    ```

2. **Backend** — install, migrate/seed, run:

    ```bash
    cd backend
    npm install
    npm run db:setup   # migrate + seed
    npm run dev        # API on http://localhost:4000
    ```

3. **Frontend** — in a new terminal:

    ```bash
    cd frontend
    npm install
    npm run dev        # http://localhost:5173 (proxies /api → :4000)
    ```

Open http://localhost:5173.

Teardown:

```bash
docker compose down       # keep DB volume
docker compose down -v    # also wipe the act1_pgdata volume
```

### Option 2 — All-in-one Docker image (Postgres + migrations + API + built frontend)

Best for a single-command demo or CI-like smoke test. One container runs Postgres, applies migrations/seed, then starts the Express server which also serves the built React bundle on the same port.

Build once:

```bash
docker build -f Dockerfile.allinone -t act1-allinone .
```

Run:

```bash
docker run --rm --name act1-allinone \
  -p 4000:4000 \
  -v act1_pgdata:/var/lib/postgresql/data \
  act1-allinone
```

Then open http://localhost:4000 — the React app is served on `/`, the API on `/api/items`, health on `/health`.

Notes:

- The `-v act1_pgdata:...` volume persists Postgres data across runs. Drop it for a fresh DB every time.
- Override env at runtime, e.g. `-e EXTERNAL_API_KEY=… -e POSTGRES_PASSWORD=…`.
- If host port 4000 is already taken, remap it: `-p 4001:4000` and open http://localhost:4001.
- Stop with `Ctrl+C` (or `docker stop act1-allinone` from another terminal). `--rm` cleans up the container on exit.

## Scripts

| Location | Script | Purpose |
|----------|--------|---------|
| backend | `db:setup` | migrate + seed |
| backend | `lint` / `test` / `build` | CI gates |
| frontend | `lint` / `test` / `build` | CI gates |

## Features added

1. Postgres schema + SQL migrations/seed; `backend/data/items.js` queries Postgres.
2. `PATCH /api/items/:id/stock` + UI toggle (no full page reload).
3. `EXTERNAL_API_KEY` drives a server-side FX stub; responses include `priceEur` (key never logged or sent to the client).
4. PR workflow: lint, test, build, docker build. Deploy workflow: merge to `main` only.
5. Vercel + Neon (see `NOTES.md`).

## Submission notes

See [NOTES.md](./NOTES.md) for schema tradeoffs, secrets handling, CI rationale, and infra limits.
