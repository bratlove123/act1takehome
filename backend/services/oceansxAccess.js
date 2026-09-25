/**
 * Portal access gate for Oceans-X pages/API.
 * Compares client-provided key to OCEANS_X_ACCESS_KEY (server-side only).
 * Never log or return the expected key.
 */

const crypto = require("crypto");

const HEADER = "x-oceans-x-access-key";

function getExpectedAccessKey() {
  const key = process.env.OCEANS_X_ACCESS_KEY;
  if (!key) {
    const err = new Error("Oceans-X access is not configured");
    err.code = "MISSING_OCEANS_X_ACCESS_KEY";
    err.status = 503;
    throw err;
  }
  return key;
}

/**
 * Timing-safe compare of provided access key to env.
 * @param {string} provided
 */
function assertAccessKey(provided) {
  const expected = getExpectedAccessKey();
  const a = Buffer.from(String(provided ?? ""), "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    const err = new Error("Invalid access key");
    err.code = "INVALID_OCEANS_X_ACCESS_KEY";
    err.status = 401;
    throw err;
  }
}

function readAccessKeyFromRequest(req) {
  const header = req.get(HEADER);
  if (header) return header;
  if (req.body && typeof req.body.accessKey === "string") return req.body.accessKey;
  return "";
}

/**
 * Express middleware — requires valid access key on every Oceans-X API call.
 */
function requireOceansXAccess(req, res, next) {
  try {
    assertAccessKey(readAccessKeyFromRequest(req));
    next();
  } catch (err) {
    if (err.code === "MISSING_OCEANS_X_ACCESS_KEY") {
      return res.status(503).json({ error: "Oceans-X access is not configured" });
    }
    return res.status(401).json({ error: "Invalid access key" });
  }
}

module.exports = {
  HEADER,
  assertAccessKey,
  getExpectedAccessKey,
  readAccessKeyFromRequest,
  requireOceansXAccess,
};
