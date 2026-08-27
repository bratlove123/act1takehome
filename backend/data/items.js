const { query } = require("../db/pool");

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    inStock: row.in_stock,
  };
}

async function getAll() {
  const { rows } = await query(
    "SELECT id, name, category, price, in_stock FROM items ORDER BY id ASC"
  );
  return rows.map(mapRow);
}

async function getById(id) {
  const { rows } = await query(
    "SELECT id, name, category, price, in_stock FROM items WHERE id = $1",
    [id]
  );
  return mapRow(rows[0]);
}

async function create(item) {
  const { rows } = await query(
    `INSERT INTO items (name, category, price, in_stock)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, category, price, in_stock`,
    [
      item.name,
      item.category,
      item.price,
      item.inStock !== undefined ? item.inStock : true,
    ]
  );
  return mapRow(rows[0]);
}

/**
 * Flip inStock, or set explicitly when `inStock` is a boolean.
 */
async function updateStock(id, inStock) {
  let result;
  if (typeof inStock === "boolean") {
    result = await query(
      `UPDATE items SET in_stock = $2
       WHERE id = $1
       RETURNING id, name, category, price, in_stock`,
      [id, inStock]
    );
  } else {
    result = await query(
      `UPDATE items SET in_stock = NOT in_stock
       WHERE id = $1
       RETURNING id, name, category, price, in_stock`,
      [id]
    );
  }
  return mapRow(result.rows[0]);
}

module.exports = { getAll, getById, create, updateStock };
