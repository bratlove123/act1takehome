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

/**
 * Submit Port Clearance (PANS) via backend proxy.
 * @param {object} payload Full PANS request body
 */
export async function submitPortClearance(payload) {
  const res = await fetch(`${BASE}/clearance-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || "PANS submit failed");
    err.status = res.status;
    err.upstream = body.upstream || body;
    throw err;
  }
  return body;
}

/**
 * Submit General Declaration (GD) via backend proxy.
 * @param {object} payload Full GD request body
 */
export async function submitGeneralDeclaration(payload) {
  const res = await fetch(`${BASE}/gd-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || "GD submit failed");
    err.status = res.status;
    err.upstream = body.upstream || body;
    throw err;
  }
  return body;
}
