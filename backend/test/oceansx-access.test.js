const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { assertAccessKey } = require("../services/oceansxAccess");

describe("oceansxAccess assertAccessKey", () => {
  it("rejects when OCEANS_X_ACCESS_KEY is missing", () => {
    const prev = process.env.OCEANS_X_ACCESS_KEY;
    delete process.env.OCEANS_X_ACCESS_KEY;
    try {
      assert.throws(() => assertAccessKey("anything"), (err) => {
        assert.equal(err.code, "MISSING_OCEANS_X_ACCESS_KEY");
        assert.equal(err.status, 503);
        return true;
      });
    } finally {
      if (prev === undefined) delete process.env.OCEANS_X_ACCESS_KEY;
      else process.env.OCEANS_X_ACCESS_KEY = prev;
    }
  });

  it("rejects wrong key", () => {
    const prev = process.env.OCEANS_X_ACCESS_KEY;
    process.env.OCEANS_X_ACCESS_KEY = "correct-portal-key";
    try {
      assert.throws(() => assertAccessKey("wrong"), (err) => {
        assert.equal(err.status, 401);
        return true;
      });
    } finally {
      if (prev === undefined) delete process.env.OCEANS_X_ACCESS_KEY;
      else process.env.OCEANS_X_ACCESS_KEY = prev;
    }
  });

  it("accepts matching key", () => {
    const prev = process.env.OCEANS_X_ACCESS_KEY;
    process.env.OCEANS_X_ACCESS_KEY = "correct-portal-key";
    try {
      assert.doesNotThrow(() => assertAccessKey("correct-portal-key"));
    } finally {
      if (prev === undefined) delete process.env.OCEANS_X_ACCESS_KEY;
      else process.env.OCEANS_X_ACCESS_KEY = prev;
    }
  });
});
