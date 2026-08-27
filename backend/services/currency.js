/**
 * Stub for a third-party FX / pricing API.
 * Uses EXTERNAL_API_KEY server-side only — never log or return the key.
 */

const USD_TO_EUR = 0.92;

/**
 * Stand-in for calling an external conversion service.
 * Validates that a credential is configured, then returns a hardcoded rate.
 */
function fetchUsdToEurRate() {
  const apiKey = process.env.EXTERNAL_API_KEY;
  if (!apiKey) {
    const err = new Error("Currency conversion is unavailable");
    err.code = "MISSING_EXTERNAL_API_KEY";
    err.status = 503;
    throw err;
  }

  // Mock outbound call: credential would be sent as Authorization, never logged.
  void apiKey;
  return { rate: USD_TO_EUR, currency: "EUR" };
}

function convertUsdToEur(priceUsd) {
  const { rate, currency } = fetchUsdToEurRate();
  return {
    priceEur: Number((Number(priceUsd) * rate).toFixed(2)),
    currency,
    rate,
  };
}

function enrichItem(item) {
  if (!item) return item;
  const { priceEur } = convertUsdToEur(item.price);
  return { ...item, priceEur };
}

function enrichItems(items) {
  return items.map(enrichItem);
}

module.exports = {
  convertUsdToEur,
  enrichItem,
  enrichItems,
  USD_TO_EUR,
};
