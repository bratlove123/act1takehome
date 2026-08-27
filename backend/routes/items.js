const express = require("express");
const router = express.Router();
const store = require("../data/items");
const { enrichItem, enrichItems } = require("../services/currency");

function handleCurrencyError(err, res) {
  if (err.code === "MISSING_EXTERNAL_API_KEY") {
    return res.status(503).json({ error: "Currency conversion is unavailable" });
  }
  throw err;
}

// GET /api/items?search=&category=&page=&limit=
router.get("/", async (req, res) => {
  try {
    const { search, category, page = 1, limit = 5 } = req.query;
    let results = await store.getAll();

    if (search) {
      results = results.filter((i) =>
        i.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (category) {
      // NOTE: exact match, case-sensitive.
      results = results.filter((i) => i.category === category);
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const start = (pageNum - 1) * limitNum;
    const paged = results.slice(start, start + limitNum);

    res.json({
      data: enrichItems(paged),
      total: results.length,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    try {
      return handleCurrencyError(err, res);
    } catch {
      res.status(500).json({ error: "Failed to fetch items" });
    }
  }
});

// GET /api/items/:id
router.get("/:id", async (req, res) => {
  try {
    const item = await store.getById(parseInt(req.params.id, 10));
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json(enrichItem(item));
  } catch (err) {
    try {
      return handleCurrencyError(err, res);
    } catch {
      res.status(500).json({ error: "Failed to fetch item" });
    }
  }
});

// PATCH /api/items/:id/stock
router.patch("/:id/stock", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const requested =
      req.body && typeof req.body.inStock === "boolean"
        ? req.body.inStock
        : undefined;
    const updated = await store.updateStock(id, requested);
    if (!updated) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json(enrichItem(updated));
  } catch (err) {
    try {
      return handleCurrencyError(err, res);
    } catch {
      res.status(500).json({ error: "Failed to update stock" });
    }
  }
});

// POST /api/items
// Written in an older .then/.catch style, no input validation.
router.post("/", (req, res) => {
  Promise.resolve()
    .then(async () => {
      const newItem = await store.create(req.body);
      res.status(201).json(enrichItem(newItem));
    })
    .catch((err) => {
      if (err.code === "MISSING_EXTERNAL_API_KEY") {
        return res
          .status(503)
          .json({ error: "Currency conversion is unavailable" });
      }
      res.status(500).json({ error: "Failed to create item" });
    });
});

module.exports = router;
