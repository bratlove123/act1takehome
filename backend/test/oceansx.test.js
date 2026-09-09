const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { buildUpstream } = require("../services/oceansx");

describe("oceansx buildUpstream", () => {
  it("builds last arrival by vessel name", () => {
    const path = buildUpstream({
      category: "arrival",
      mode: "last",
      params: { vesselname: "RADJA SAMUDERA ABADI" },
    });
    assert.match(path, /\/last\/vesselname\/RADJA/);
  });

  it("builds port clearance by IMO with query params", () => {
    const path = buildUpstream({
      category: "cert",
      mode: "imo",
      params: {
        imonumber: "9762156",
        gdvno: "850524",
        certificateno: "E84204",
      },
    });
    assert.match(path, /\/imonumber\/9762156\?/);
    assert.match(path, /gdvno=850524/);
    assert.match(path, /certificateno=E84204/);
  });

  it("builds departure pastNhours", () => {
    const path = buildUpstream({
      category: "departure",
      mode: "hours",
      params: { datetime: "2025-07-27 00:00:00", hours: "24" },
    });
    assert.match(path, /\/pastNhours\?/);
    assert.match(path, /hours=24/);
  });
});
