const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
require("dotenv").config();

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

/**
 * Integration-style API tests.
 * Skipped unless DATABASE_URL and EXTERNAL_API_KEY are set (CI provides them).
 */
const hasDb = Boolean(process.env.DATABASE_URL);
const hasKey = Boolean(process.env.EXTERNAL_API_KEY);

describe("items API", { skip: !hasDb || !hasKey }, () => {
  let app;

  before(() => {
    // Fresh require after env is present
    delete require.cache[require.resolve("../server")];
    app = require("../server");
  });

  after(async () => {
    const { endPool } = require("../db/pool");
    await endPool();
  });

  it("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "ok");
  });

  it("GET /api/items returns enriched items", async () => {
    const res = await request(app).get("/api/items?limit=5");
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length > 0);
    assert.equal(typeof res.body.data[0].priceEur, "number");
    assert.equal(
      JSON.stringify(res.body).includes(process.env.EXTERNAL_API_KEY),
      false
    );
  });

  it("PATCH /api/items/:id/stock flips and persists", async () => {
    const list = await request(app).get("/api/items?limit=1");
    const item = list.body.data[0];
    const before = item.inStock;

    const patched = await request(app).patch(`/api/items/${item.id}/stock`);
    assert.equal(patched.status, 200);
    assert.equal(patched.body.inStock, !before);

    const again = await request(app).get(`/api/items/${item.id}`);
    assert.equal(again.status, 200);
    assert.equal(again.body.inStock, !before);

    // restore
    await request(app).patch(`/api/items/${item.id}/stock`);
  });
});
