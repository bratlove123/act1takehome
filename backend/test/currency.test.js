const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  convertUsdToEur,
  enrichItem,
  USD_TO_EUR,
} = require("../services/currency");

describe("currency stub", () => {
  it("converts USD to EUR with hardcoded rate when key is set", () => {
    process.env.EXTERNAL_API_KEY = "test-key-not-for-production";
    const result = convertUsdToEur(100);
    assert.equal(result.priceEur, Number((100 * USD_TO_EUR).toFixed(2)));
    assert.equal(result.currency, "EUR");
  });

  it("enriches an item with priceEur", () => {
    process.env.EXTERNAL_API_KEY = "test-key-not-for-production";
    const enriched = enrichItem({
      id: 1,
      name: "Widget",
      category: "Electronics",
      price: 10,
      inStock: true,
    });
    assert.equal(enriched.priceEur, Number((10 * USD_TO_EUR).toFixed(2)));
    assert.equal(enriched.price, 10);
  });

  it("fails closed when EXTERNAL_API_KEY is missing", () => {
    delete process.env.EXTERNAL_API_KEY;
    assert.throws(() => convertUsdToEur(10), (err) => {
      assert.equal(err.code, "MISSING_EXTERNAL_API_KEY");
      assert.equal(err.status, 503);
      return true;
    });
  });

  it("does not embed the API key in enriched output", () => {
    const secret = "super-secret-key-value";
    process.env.EXTERNAL_API_KEY = secret;
    const enriched = enrichItem({
      id: 2,
      name: "Cable",
      category: "Electronics",
      price: 5,
      inStock: false,
    });
    const serialized = JSON.stringify(enriched);
    assert.equal(serialized.includes(secret), false);
  });
});
