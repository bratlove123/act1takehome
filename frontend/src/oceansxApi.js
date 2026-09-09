const BASE = "/api/oceansx";

/**
 * Query Oceans-X via backend proxy (API key stays on the server).
 * @param {{ category: string, mode: string, params: Record<string, string> }} payload
 */
export async function queryOceansX(payload) {
  const res = await fetch(`${BASE}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || "Oceans-X query failed");
    err.status = res.status;
    err.upstream = body.upstream;
    throw err;
  }
  return body;
}
