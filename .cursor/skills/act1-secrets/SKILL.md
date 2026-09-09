---
name: act1-secrets
description: >-
  Act1 secrets: EXTERNAL_API_KEY (FX stub) and OCEANS_X_API_KEY (MPA proxy)
  server-side only — never logged or sent to the client. Use when touching
  currency.js, oceansx.js, env vars, or CI/Vercel secret wiring.
---

# Act1 secrets

## Rules

- Read secrets only on the server (`backend/services/currency.js`, `backend/services/oceansx.js`).
- Never `console.log` keys or include them in errors/responses.
- Missing `EXTERNAL_API_KEY` → `MISSING_EXTERNAL_API_KEY` / HTTP 503.
- Missing `OCEANS_X_API_KEY` → `MISSING_OCEANS_X_API_KEY` / HTTP 503.
- Oceans-X auth header: `apikey: <OCEANS_X_API_KEY>` (not Authorization Bearer).

## Env surfaces

| Surface | Source |
|---------|--------|
| Local | `.env` (gitignored) from `.env.example` |
| CI (PR) | `secrets.EXTERNAL_API_KEY`, `secrets.OCEANS_X_API_KEY` (fallback test keys on forks) |
| Prod | Vercel project env; Deploy workflow syncs from GitHub secrets |

Required secrets: `DATABASE_URL`, `EXTERNAL_API_KEY`, `OCEANS_X_API_KEY` — never commit, never send to the client.
