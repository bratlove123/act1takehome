/**
 * Oceans-X (MPA) API client.
 * Uses OCEANS_X_API_KEY server-side only — never log or return the key.
 */

const BASE_URL = "https://oceans-x.mpa.gov.sg/api/v1";
const PANS_PATH = "/port-clearance-data/1.0.0/clearance-requests";
/** GD lives under /api (not /api/v1) per Oceans-X docs. */
const GD_URL =
  "https://oceans-x.mpa.gov.sg/api/port-clearance-submission/1.0.0/gd-requests";
const GD_PATH = "/port-clearance-submission/1.0.0/gd-requests";

function getApiKey() {
  const key = process.env.OCEANS_X_API_KEY;
  if (!key) {
    const err = new Error("Oceans-X API is unavailable");
    err.code = "MISSING_OCEANS_X_API_KEY";
    err.status = 503;
    throw err;
  }
  return key;
}

function authHeaders() {
  const apiKey = getApiKey();
  const headers = {
    Accept: "application/json",
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
  };
  const authenticatorName = process.env.OCEANS_X_AUTHENTICATOR_NAME;
  if (authenticatorName) {
    headers.authenticator_name = authenticatorName;
  }
  const authenticatorValue = process.env.OCEANS_X_AUTHENTICATOR_VALUE;
  if (authenticatorValue) {
    headers.authenticator_value = authenticatorValue;
  }
  return headers;
}

/**
 * Build upstream path + query from a structured query payload.
 * category: cert | arrival | departure
 * mode: imo | callsign | vessel | date | hours | last
 */
function buildUpstream({ category, mode, params = {} }) {
  const p = params;

  if (category === "cert") {
    const qs = new URLSearchParams({
      gdvno: p.gdvno || "",
      certificateno: p.certificateno || "",
    });
    if (mode === "imo") {
      return `/vessel/portclearance/1.0.0/imonumber/${encodeURIComponent(p.imonumber)}?${qs}`;
    }
    if (mode === "callsign") {
      return `/vessel/portclearance/1.0.0/callsign/${encodeURIComponent(p.callsign)}?${qs}`;
    }
    if (mode === "vessel") {
      return `/vessel/portclearance/1.0.0/vesselname/${encodeURIComponent(p.vesselname)}?${qs}`;
    }
  }

  if (category === "arrival") {
    if (mode === "last") {
      return `/vessel/arrivaldeclaration/1.0.0/last/vesselname/${encodeURIComponent(p.vesselname)}`;
    }
    if (mode === "imo") {
      return `/vessel/arrivaldeclaration/1.0.0/imonumber/${encodeURIComponent(p.imonumber)}`;
    }
    if (mode === "callsign") {
      return `/vessel/arrivaldeclaration/1.0.0/callsign/${encodeURIComponent(p.callsign)}`;
    }
    if (mode === "vessel") {
      return `/vessel/arrivaldeclaration/1.0.0/vesselname/${encodeURIComponent(p.vesselname)}`;
    }
    if (mode === "date") {
      return `/vessel/arrivaldeclaration/1.0.0/bydate?date=${encodeURIComponent(p.date)}`;
    }
    if (mode === "hours") {
      const qs = new URLSearchParams({
        datetime: p.datetime,
        hours: String(p.hours),
      });
      return `/vessel/arrivaldeclaration/1.0.0/pastNhours?${qs}`;
    }
  }

  if (category === "departure") {
    if (mode === "imo") {
      return `/vessel/departuredeclaration/1.0.0/imonumber/${encodeURIComponent(p.imonumber)}`;
    }
    if (mode === "callsign") {
      return `/vessel/departuredeclaration/1.0.0/callsign/${encodeURIComponent(p.callsign)}`;
    }
    if (mode === "vessel") {
      return `/vessel/departuredeclaration/1.0.0/vesselname/${encodeURIComponent(p.vesselname)}`;
    }
    if (mode === "date") {
      return `/vessel/departuredeclaration/1.0.0/bydate?date=${encodeURIComponent(p.date)}`;
    }
    if (mode === "hours") {
      const qs = new URLSearchParams({
        datetime: p.datetime,
        hours: String(p.hours),
      });
      return `/vessel/departuredeclaration/1.0.0/pastNhours?${qs}`;
    }
  }

  const err = new Error("Invalid Oceans-X query");
  err.status = 400;
  throw err;
}

async function parseResponse(res) {
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  return body;
}

async function queryOceansX(payload) {
  const pathAndQuery = buildUpstream(payload);
  const url = `${BASE_URL}${pathAndQuery}`;

  const res = await fetch(url, {
    method: "GET",
    headers: authHeaders(),
  });

  const body = await parseResponse(res);

  if (!res.ok) {
    const err = new Error(
      (body && (body.message || body.error || body.description)) ||
        `Oceans-X upstream error (${res.status})`
    );
    err.status = res.status;
    err.upstream = body;
    throw err;
  }

  return {
    upstreamPath: pathAndQuery,
    data: body,
  };
}

/**
 * Submit Port Clearance (PANS) — POST clearance-requests.
 * Body is forwarded as-is; secrets stay server-side only.
 */
async function submitPortClearance(payload) {
  if (!payload || typeof payload !== "object") {
    const err = new Error("Request body is required");
    err.status = 400;
    throw err;
  }
  if (payload.submitPANS !== "Y") {
    const err = new Error('submitPANS must be "Y" (only value supported in v1.0.0)');
    err.status = 400;
    throw err;
  }

  const url = `${BASE_URL}${PANS_PATH}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await parseResponse(res);

  if (!res.ok) {
    const err = new Error(
      (body && (body.message || body.error || body.description)) ||
        `PANS submit failed (${res.status})`
    );
    err.status = res.status;
    err.upstream = body;
    throw err;
  }

  return {
    upstreamPath: PANS_PATH,
    status: res.status,
    data: body,
  };
}

/**
 * Submit General Declaration (GD) — POST gd-requests.
 * Body is forwarded as-is; secrets stay server-side only.
 */
async function submitGeneralDeclaration(payload) {
  if (!payload || typeof payload !== "object") {
    const err = new Error("Request body is required");
    err.status = 400;
    throw err;
  }
  if (!payload.arrDepCode || !["A", "D", "C"].includes(payload.arrDepCode)) {
    const err = new Error("arrDepCode must be one of A, D, C");
    err.status = 400;
    throw err;
  }

  const res = await fetch(GD_URL, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await parseResponse(res);
  const location = res.headers.get("location") || res.headers.get("Location");

  if (!res.ok) {
    const err = new Error(
      (body && (body.message || body.error || body.description)) ||
        `GD submit failed (${res.status})`
    );
    err.status = res.status;
    err.upstream = body;
    throw err;
  }

  return {
    upstreamPath: GD_PATH,
    status: res.status,
    location: location || undefined,
    data: body,
  };
}

module.exports = {
  queryOceansX,
  submitPortClearance,
  submitGeneralDeclaration,
  buildUpstream,
  BASE_URL,
  PANS_PATH,
  GD_PATH,
  GD_URL,
};
