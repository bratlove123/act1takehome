const { Pool } = require("pg");

let pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    pool = new Pool({
      connectionString,
      // Neon and many hosted Postgres providers require SSL in production.
      ssl:
        process.env.PGSSL === "false"
          ? false
          : connectionString.includes("localhost") ||
              connectionString.includes("127.0.0.1")
            ? false
            : { rejectUnauthorized: false },
    });
  }
  return pool;
}

async function query(text, params) {
  return getPool().query(text, params);
}

async function endPool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { getPool, query, endPool };
