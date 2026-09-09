/**
 * Oceans-X (MPA) API client.
 * Uses OCEANS_X_API_KEY server-side only — never log or return the key.
 */

const BASE_URL = "https://oceans-x.mpa.gov.sg/api/v1";

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

async function queryOceansX(payload) {
  const apiKey = getApiKey();
  const pathAndQuery = buildUpstream(payload);
  const url = `${BASE_URL}${pathAndQuery}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      apikey: apiKey,
    },
  });

  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }

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

module.exports = { queryOceansX, buildUpstream, BASE_URL };
