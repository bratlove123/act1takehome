import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiSrc = readFileSync(join(__dirname, "../src/api.js"), "utf8");

describe("frontend api client", () => {
  it("exposes toggleItemStock via PATCH", () => {
    assert.match(apiSrc, /toggleItemStock/);
    assert.match(apiSrc, /method:\s*["']PATCH["']/);
    assert.match(apiSrc, /\/stock/);
  });
});
