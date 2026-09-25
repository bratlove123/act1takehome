---
name: act1-secrets
description: >-
  Act1 secrets: EXTERNAL_API_KEY (FX stub), OCEANS_X_API_KEY (MPA proxy), and
  OCEANS_X_ACCESS_KEY (portal gate) — server-side only — never logged or sent
  to the client. Use when touching currency.js, oceansx.js, env vars, or
  CI/Vercel secret wiring.
---

# Act1 secrets

## Rules

- Read secrets only on the server (`backend/services/currency.js`, `backend/services/oceansx.js`, `backend/services/oceansxAccess.js`).
- Never `console.log` keys or include them in errors/responses.
- Missing `EXTERNAL_API_KEY` → `MISSING_EXTERNAL_API_KEY` / HTTP 503.
- Missing `OCEANS_X_API_KEY` → `MISSING_OCEANS_X_API_KEY` / HTTP 503.
- Missing `OCEANS_X_ACCESS_KEY` → `MISSING_OCEANS_X_ACCESS_KEY` / HTTP 503 on Oceans-X routes.
- Oceans-X portal gate: client sends `x-oceans-x-access-key` (user-entered); server compares to `OCEANS_X_ACCESS_KEY` with timing-safe equal. Unlock via `POST /api/oceansx/unlock`.
- Oceans-X query auth: `apikey: <OCEANS_X_API_KEY>` (+ `Authorization: Bearer` for PANS/GD).
- Optional PANS headers: `OCEANS_X_AUTHENTICATOR_NAME` / `OCEANS_X_AUTHENTICATOR_VALUE` → `authenticator_name` / `authenticator_value`.

## Env surfaces

| Surface | Source |
|---------|--------|
| Local | `.env` (gitignored) from `.env.example` |
| CI (PR) | `secrets.EXTERNAL_API_KEY`, `secrets.OCEANS_X_API_KEY`, `secrets.OCEANS_X_ACCESS_KEY` (fallback test keys on forks) |
| Prod | Vercel project env; set `OCEANS_X_ACCESS_KEY` alongside other secrets |

Required secrets: `DATABASE_URL`, `EXTERNAL_API_KEY`, `OCEANS_X_API_KEY`, `OCEANS_X_ACCESS_KEY` — never commit, never send the env values to the client (access key is only verified server-side after user types it).
