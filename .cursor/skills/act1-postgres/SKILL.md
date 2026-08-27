---
name: act1-postgres
description: >-
  Act1 PostgreSQL data layer: schema, SQL migrations, seed, pg pool, and async
  items store mapping in_stock to inStock. Use when changing backend/db,
  backend/data/items.js, or DATABASE_URL setup.
---

# Act1 Postgres data layer

## Schema

`items(id SERIAL PK, name TEXT, category TEXT, price NUMERIC(10,2), in_stock BOOLEAN)`

API JSON uses camelCase `inStock`; SQL uses `in_stock`.

## Layout

- `backend/db/migrations/*.sql` — applied by `backend/db/migrate.js` via `schema_migrations`
- `backend/db/seed/*.sql` — idempotent (`ON CONFLICT DO NOTHING`)
- `backend/db/pool.js` — `pg.Pool` from `DATABASE_URL`
- Scripts: `npm run migrate|seed|db:setup` in `backend/`

## Store API (`backend/data/items.js`)

- `getAll()`, `getById(id)`, `create(item)` — async, same shapes as before
- `updateStock(id, inStock?)` — flip when `inStock` omitted; set when boolean

Local: `docker compose up -d` then `cd backend && npm run db:setup`.
