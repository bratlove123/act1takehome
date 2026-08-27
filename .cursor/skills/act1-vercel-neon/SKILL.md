---
name: act1-vercel-neon
description: >-
  Act1 Vercel + Neon deploy: vercel.json, serverless Express via api/index.js,
  Neon DATABASE_URL, migrate on deploy. Use when changing deploy config or
  production env wiring.
---

# Act1 Vercel + Neon

## App shape

- Frontend: Vite build → `frontend/dist` (`vercel.json` `outputDirectory`)
- API: `api/index.js` re-exports Express `app` from `backend/server.js` (listen only when `require.main === module`)
- Rewrites: `/api/*` and `/health` → `/api`

## Database

- Neon free-tier Postgres; set `DATABASE_URL` in Vercel + GitHub secrets.
- Deploy workflow runs `npm run db:setup` against prod `DATABASE_URL` before `vercel deploy`.

## Note

PR CI still `docker build`s `backend/Dockerfile`. Production traffic is Vercel serverless Node, not that image — document in `NOTES.md`.
