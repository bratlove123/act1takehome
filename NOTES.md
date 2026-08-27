# Notes — Act1 take-home1

## Schema / migration decisions

- Table `items` mirrors the original in-memory model: `id`, `name`, `category`, `price`, `in_stock`.
- SQL uses `in_stock`; the API keeps camelCase `inStock` so the React client barely changes.
- `NUMERIC(10,2)` for money-ish values (good enough for a catalog demo; production would often use integer cents).
- Migrations are ordered SQL files under `backend/db/migrations/`, applied by `db/migrate.js` and recorded in `schema_migrations`. Seed SQL is separate and idempotent (`ON CONFLICT DO NOTHING`) so re-runs in CI/deploy are safe.
- Filtering/pagination stay in the route layer (same behavior as the original array filters), including case-sensitive category matching.

## Secrets (local / CI / deploy)

| Secret | Local | CI (PR) | Production |
|--------|-------|---------|------------|
| `DATABASE_URL` | `.env` (gitignored) → Docker Compose Postgres or Neon | GitHub Actions service Postgres URL (non-secret) + optional Neon for deploy job | Vercel + Neon; also GH secret for migrate-on-deploy |
| `EXTERNAL_API_KEY` | `.env` | `secrets.EXTERNAL_API_KEY` (fallback test key if unset on forks) | Vercel env + GH secret |

- `.env` is gitignored; only `.env.example` is committed.
- The FX stub in `backend/services/currency.js` reads the key server-side, never logs it, and never puts it in JSON responses. Missing key → HTTP 503 with a generic message.
- Derived field: `priceEur` (hardcoded USD→EUR rate `0.92`).

## CI/CD structure

- **PR** (`.github/workflows/ci.yml`): install → migrate/seed against Actions Postgres → lint → test → build frontend+backend → `docker build` backend. Any failure fails the check. No deploy.
- **Merge to `main`** (`.github/workflows/deploy.yml`): migrate/seed against prod `DATABASE_URL`, then `vercel deploy --prod`. Does not run on PRs or non-main branches.

Docker image build remains a PR gate (README requirement). Production serves the app on **Vercel serverless Node**, not that container — intentional tradeoff for free-tier simplicity.

## Infra: Vercel + Neon

- **Why**: Matches “deploy to Vercel”; Neon free-tier Postgres pairs cleanly with `DATABASE_URL` and SSL.
- **Frontend**: Vite static output on Vercel.
- **API**: Express app exported from `backend/server.js`, wrapped by `api/index.js`.
- **Free-tier limits**: Neon compute can suspend when idle (cold start on wake). Vercel hobby has execution-time and bandwidth limits. Neither needs paid infra for this exercise.
- **Teardown**: delete the Vercel project and Neon database/branch when finished; remove GH secrets if the repo is discarded.

Working URL: requires Vercel + Neon credentials (not available in this authoring environment). Use the checklist below; paste the production URL when deploy succeeds.

### Local verification proof (this workspace)

- Postgres migrate/seed applied via `npm run db:setup`
- Backend tests: **7/7 passed** (currency stub + items API with stock flip persistence)
- Frontend lint/test/build: passed (`vite build` → `frontend/dist`)
- Smoke: `GET /health` ok; `priceEur` present; stock flip persisted; API key not in response body
- Docker CLI was not installed on the authoring machine; `docker build` is gated in GitHub Actions CI on PRs

### Deployment checklist (Vercel + Neon)

1. Create a Neon project/database; copy the pooled or direct `DATABASE_URL`.
2. Create a Vercel project from this repo; set env vars `DATABASE_URL` and `EXTERNAL_API_KEY`.
3. Add GitHub Actions secrets: `DATABASE_URL`, `EXTERNAL_API_KEY`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
4. Push to `main` (or merge a PR) and confirm the Deploy workflow is green.
5. Record the URL:

```
https://<your-vercel-app>.vercel.app
```

6. Optional teardown: delete the Vercel project and Neon database; remove GH secrets.
## Code-review flags (pre-existing + leftover)

- Category filter is exact and case-sensitive (commented in the original route).
- `POST /api/items` still has no input validation and uses a mixed promise style.
- CORS is wide open.
- Backend Dockerfile still uses `npm install` (not `npm ci`) and copies the whole context — fine for the exercise, not production-hardened.
- In-memory id scheme (`length + 1`) is gone; `SERIAL` is correct for concurrency.

## AI tooling

Implemented with Cursor Agent against the attached plan. Manually double-checked: export shapes remaining async-compatible, secret non-logging, PR vs main workflow split, and that Vercel uses serverless while Docker stays a CI gate.
