#!/usr/bin/env node
/**
 * Idempotent seed: runs SQL under db/seed/.
 * Seed SQL uses ON CONFLICT DO NOTHING so re-runs are safe.
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { getPool, endPool } = require("./pool");

const SEED_DIR = path.join(__dirname, "seed");

async function seed() {
  const pool = getPool();
  const client = await pool.connect();
  try {
    const files = fs
      .readdirSync(SEED_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const filename of files) {
      const sql = fs.readFileSync(path.join(SEED_DIR, filename), "utf8");
      await client.query(sql);
      console.log(`seed  ${filename}`);
    }

    console.log("Seed complete.");
  } finally {
    client.release();
    await endPool();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
