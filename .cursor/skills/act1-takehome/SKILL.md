---
name: act1-takehome
description: >-
  Act1 take-home spine and project map: monorepo layout, backend Express+Postgres
  vs frontend React+Vite+Tailwind, API contract, local/Docker/Vercel run modes,
  CI/CD, and where to edit for backend or frontend tasks. Use when implementing,
  reviewing, or navigating any Act1 feature, bug, or acceptance criteria.
---

# Act1 take-home spine

## Quick routing — backend or frontend?

| Task type | Start here | Also check |
|-----------|------------|------------|
| New/changed API endpoint | `backend/routes/items.js` | `backend/data/items.js`, `backend/services/currency.js` |
| DB schema / queries / seed | `backend/db/` | `backend/data/items.js`, `.cursor/skills/act1-postgres/` |
| Secrets / `priceEur` / FX stub | `backend/services/currency.js` | `.cursor/skills/act1-secrets/` |
| UI / styling / client state | `frontend/src/App.jsx`, `frontend/src/components/` | `frontend/src/api.js`, `frontend/src/index.css` |
| API client (fetch helpers) | `frontend/src/api.js` | Must match backend route paths |
| Deploy / Vercel / Neon | `vercel.json`, `api/index.js` | `.cursor/skills/act1-vercel-neon/` |
| CI / PR gates / deploy | `.github/workflows/` | `.cursor/skills/act1-ci/` |
| All-in-one Docker demo | `Dockerfile.allinone` | `README.md` Option 2 |
| Backend-only Docker (CI) | `backend/Dockerfile` | PR workflow `docker build` step |

**Rule of thumb:** backend owns persistence + business logic + enrichment; frontend owns display + user interaction. Filtering/pagination currently live in the **route layer** (`backend/routes/items.js`), not in SQL.

---

## Repo layout

```
act1/
├── backend/                 # Express API (CommonJS)
│   ├── server.js            # App entry; exports `app` for Vercel; listens when run directly
│   ├── routes/items.js      # HTTP handlers — filter, paginate, enrich responses
│   ├── data/items.js        # Data store: getAll, getById, create, updateStock (async pg)
│   ├── services/currency.js # EXTERNAL_API_KEY stub → priceEur enrichment
│   ├── db/
│   │   ├── pool.js          # pg.Pool from DATABASE_URL
│   │   ├── migrate.js       # Applies backend/db/migrations/*.sql
│   │   ├── seed.js          # Applies backend/db/seed/*.sql
│   │   ├── migrations/      # SQL migration artifacts
│   │   └── seed/            # Idempotent seed SQL
│   ├── test/                # node:test + supertest
│   ├── Dockerfile           # CI image build (not Vercel runtime)
│   └── package.json         # scripts: dev, migrate, seed, db:setup, lint, test, build
│
├── frontend/                # React + Vite + Tailwind (ESM)
│   ├── src/
│   │   ├── main.jsx         # React mount; imports index.css
│   │   ├── App.jsx          # Page state: search, category, page, stock toggle
│   │   ├── api.js           # fetchItems, createItem, toggleItemStock
│   │   ├── index.css        # Tailwind v4 (@import "tailwindcss")
│   │   └── components/
│   │       └── ItemList.jsx # Table UI, badges, loading/empty states
│   ├── vite.config.js       # Dev proxy /api → localhost:4000; @tailwindcss/vite
│   ├── test/                # node:test (api client shape)
│   └── package.json         # scripts: dev, build, lint, test
│
├── api/index.js             # Vercel serverless entry → re-exports backend/server app
├── vercel.json              # Static frontend + /api/* rewrites
├── docker-compose.yml       # Local Postgres 16 (Option 1 dev)
├── Dockerfile.allinone      # Postgres + migrate + API + built frontend in one container
├── .github/workflows/
│   ├── ci.yml               # PR: lint, test, build, docker build
│   └── deploy.yml           # main only: migrate/seed prod DB, vercel deploy
├── .env.example             # Committed placeholders only
├── README.md                # Run instructions (Option 1 local, Option 2 all-in-one)
└── NOTES.md                 # Schema, secrets, infra tradeoffs
```

Load sibling skills for depth: `act1-postgres`, `act1-secrets`, `act1-vercel-neon`, `act1-ci`.

---

## Request flow

```
Browser
  → dev: localhost:5173 (Vite) proxies /api → localhost:4000
  → prod: Vercel serves frontend/dist; /api/* → api/index.js (Express serverless)
       → backend/routes/items.js
            → backend/data/items.js (Postgres via backend/db/pool.js)
            → backend/services/currency.js (adds priceEur)
       → Neon or local Postgres (DATABASE_URL)
```

Item JSON shape (API): `{ id, name, category, price, inStock, priceEur }`  
SQL column `in_stock` maps to API `inStock` in `backend/data/items.js`.

---

## API contract (backend ↔ frontend)

| Method | Path | Handler | Frontend client |
|--------|------|---------|-----------------|
| GET | `/health` | `backend/server.js` | — |
| GET | `/api/items?search&category&page&limit` | `routes/items.js` | `fetchItems()` |
| GET | `/api/items/:id` | `routes/items.js` | — (available, unused in UI) |
| POST | `/api/items` | `routes/items.js` | `createItem()` (unused in UI) |
| PATCH | `/api/items/:id/stock` | `routes/items.js` | `toggleItemStock()` |

List response: `{ data: Item[], total, page, limit }`.  
Stock toggle updates local React state in `App.jsx` — no full refetch.

---

## Run modes

**Option 1 — local dev (preferred for frontend/backend work)**
```bash
docker compose up -d
cd backend && npm install && npm run db:setup && npm run dev   # :4000
cd frontend && npm install && npm run dev                       # :5173, proxies /api
```

**Option 2 — all-in-one Docker**
```bash
docker build -f Dockerfile.allinone -t act1-allinone .
docker run --rm -p 4000:4000 -v act1_pgdata:/var/lib/postgresql/data act1-allinone
# App + API both on http://localhost:4000
```

**Production:** Vercel + Neon; see `act1-vercel-neon` skill.

---

## Common tasks

### Add a backend field or endpoint
1. Migration in `backend/db/migrations/` if schema changes → `npm run migrate`
2. Query/mapper in `backend/data/items.js` (keep export names stable)
3. Route in `backend/routes/items.js`; use `enrichItem` / `enrichItems` if returning items
4. Test in `backend/test/`; run `cd backend && npm test`

### Add or change frontend UI
1. API call in `frontend/src/api.js` if new endpoint
2. State/handlers in `frontend/src/App.jsx`
3. Presentation in `frontend/src/components/`; style with Tailwind in `index.css` / className
4. Run `cd frontend && npm run lint && npm test && npm run build`

### Env vars (never commit values)
| Var | Used by |
|-----|---------|
| `DATABASE_URL` | `backend/db/pool.js` |
| `EXTERNAL_API_KEY` | `backend/services/currency.js` |
| `PORT` | `backend/server.js` (default 4000) |
| `PGSSL` | `backend/db/pool.js` (`false` local, omit/true for Neon) |

Copy from `.env.example` → `.env` at repo root (backend loads it via dotenv).

---

## Non-negotiables

- Do not commit secrets. `.env` is gitignored; only `.env.example` with placeholders.
- Keep `getAll` / `getById` / `create` export names in `backend/data/items.js` (async OK).
- PR CI must lint, test, build frontend+backend, and `docker build ./backend` — fail on any error.
- Deploy only on merge/push to `main`, never on `pull_request`.
- `DATABASE_URL` and `EXTERNAL_API_KEY` from env/secrets at runtime — never hardcode or log.
- `EXTERNAL_API_KEY` must never appear in API responses or client bundles.

---

## Verify (by layer)

```bash
# Backend
cd backend && npm run lint && npm test && npm run build

# Frontend
cd frontend && npm run lint && npm test && npm run build

# Backend Docker (CI gate)
docker build -t act1-backend ./backend
```

Integration tests in `backend/test/items-api.test.js` need `DATABASE_URL` + `EXTERNAL_API_KEY` (from `.env` or CI env).

---

## Stack notes

| Layer | Module system | Key deps |
|-------|---------------|----------|
| Backend | CommonJS (`"type": "commonjs"`) | express, cors, pg, dotenv |
| Frontend | ESM (`"type": "module"`) | react, vite, tailwindcss, @tailwindcss/vite |

Do not import backend code into frontend. Production API is wired only through HTTP (`/api/...`) or Vercel rewrite to `api/index.js`.
