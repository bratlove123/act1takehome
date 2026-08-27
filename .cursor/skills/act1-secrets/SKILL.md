---
name: act1-secrets
description: >-
  Act1 secrets and FX stub: EXTERNAL_API_KEY server-side only, never logged or
  sent to the client; priceEur enrichment. Use when touching currency.js,
  env vars, or response serialization.
---

# Act1 secrets + FX stub

## Rules

- Read `EXTERNAL_API_KEY` only on the server (`backend/services/currency.js`).
- Never `console.log` the key or include it in errors/responses.
- Missing key → throw with `code: MISSING_EXTERNAL_API_KEY` / HTTP 503 with a generic message.
- Stub returns hardcoded `USD_TO_EUR = 0.92`; enrich items with `priceEur`.

## Env surfaces

| Surface | Source |
|---------|--------|
| Local | `.env` (gitignored) from `.env.example` |
| CI | GitHub Actions secrets / job env |
| Prod | Vercel project env + Neon `DATABASE_URL` |

`DATABASE_URL` is the other required secret — same rules (no commit, no client exposure).
