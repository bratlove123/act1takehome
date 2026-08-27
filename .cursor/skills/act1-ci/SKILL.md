---
name: act1-ci
description: >-
  Act1 GitHub Actions: PR workflow lint/test/build/docker; deploy
  workflow only on push to main with secrets. Use when editing
  .github/workflows or CI secrets.
---

# Act1 CI/CD

## PR (`.github/workflows/ci.yml`)

Triggers: `pull_request` → `main` only.

Must: install, migrate/seed against service Postgres, lint, test, build both packages, `docker build ./backend`. Fail the job if any step fails. **No deploy.**

## Deploy (`.github/workflows/deploy.yml`)

Triggers: `push` to `main` only (not every branch, not PRs).

Needs secrets: `DATABASE_URL`, `EXTERNAL_API_KEY`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
