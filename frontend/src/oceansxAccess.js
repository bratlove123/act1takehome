const STORAGE_KEY = "oceansx_access_key";
const ACCESS_HEADER = "x-oceans-x-access-key";

export function getStoredAccessKey() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function setStoredAccessKey(key) {
  try {
    sessionStorage.setItem(STORAGE_KEY, key);
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearStoredAccessKey() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function accessHeaders(extra = {}) {
  const key = getStoredAccessKey();
  const headers = { ...extra };
  if (key) headers[ACCESS_HEADER] = key;
  return headers;
}

/**
 * Verify access key with the server and store it on success.
 * @param {string} accessKey
 */
export async function unlockOceansX(accessKey) {
  const res = await fetch("/api/oceansx/unlock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessKey }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || "Invalid access key");
    err.status = res.status;
    throw err;
  }
  setStoredAccessKey(accessKey);
  return body;
}

export { ACCESS_HEADER, STORAGE_KEY };
