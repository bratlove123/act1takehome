import { accessHeaders, clearStoredAccessKey } from "./oceansxAccess";

const BASE = "/api/oceansx";

async function oceansxFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: accessHeaders({
      "Content-Type": "application/json",
      ...(options.headers || {}),
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (res.status === 401) {
    clearStoredAccessKey();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("oceansx:access-denied"));
    }
    const err = new Error(body.error || "Invalid access key");
    err.status = 401;
    err.code = "ACCESS_DENIED";
    throw err;
  }
  if (!res.ok) {
    const err = new Error(body.error || "Oceans-X request failed");
    err.status = res.status;
    err.upstream = body.upstream || body;
    throw err;
  }
  return body;
}

/**
 * Query Oceans-X via backend proxy (API key stays on the server).
 * @param {{ category: string, mode: string, params: Record<string, string> }} payload
 */
export async function queryOceansX(payload) {
  return oceansxFetch("/query", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Submit Port Clearance (PANS) via backend proxy.
 * @param {object} payload Full PANS request body
 */
export async function submitPortClearance(payload) {
  return oceansxFetch("/clearance-requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Submit General Declaration (GD) via backend proxy.
 * @param {object} payload Full GD request body
 */
export async function submitGeneralDeclaration(payload) {
  return oceansxFetch("/gd-requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
