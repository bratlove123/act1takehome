const express = require("express");
const router = express.Router();
const { queryOceansX, buildUpstream } = require("../services/oceansx");

/**
 * POST /api/oceansx/query
 * Body: { category, mode, params }
 * Proxies Oceans-X with OCEANS_X_API_KEY — key never returned to client.
 */
router.post("/query", async (req, res) => {
  try {
    const { category, mode, params } = req.body || {};
    if (!category || !mode) {
      return res.status(400).json({ error: "category and mode are required" });
    }

    // Validate path preview without calling upstream when possible
    try {
      buildUpstream({ category, mode, params: params || {} });
    } catch (err) {
      return res.status(err.status || 400).json({ error: err.message });
    }

    const result = await queryOceansX({
      category,
      mode,
      params: params || {},
    });

    res.json({
      status: "ok",
      category,
      mode,
      upstreamPath: result.upstreamPath,
      data: result.data,
    });
  } catch (err) {
    if (err.code === "MISSING_OCEANS_X_API_KEY") {
      return res.status(503).json({ error: "Oceans-X API is unavailable" });
    }
    const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 502;
    res.status(status).json({
      error: err.message || "Oceans-X request failed",
      upstream: err.upstream || undefined,
    });
  }
});

/**
 * GET /api/oceansx/preview?category=&mode=&...
 * Returns the upstream path that would be called (no network).
 */
router.get("/preview", (req, res) => {
  try {
    const { category, mode, ...rest } = req.query;
    const path = buildUpstream({
      category,
      mode,
      params: rest,
    });
    res.json({ method: "GET", path: `/api/v1${path}` });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

module.exports = router;
