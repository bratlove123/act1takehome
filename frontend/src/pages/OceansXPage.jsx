import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { queryOceansX } from "../oceansxApi";

const CATEGORY_META = {
  cert: {
    title: "Port Clearance Certificate Query",
    desc: "Fetch official clearance cert data by CallSign, IMO Number, or Vessel Name.",
    basePath: "/api/v1/vessel/portclearance/1.0.0",
  },
  arrival: {
    title: "Vessel Arrival Declaration Query",
    desc: "Access arrival declarations by CallSign, Date, IMO, Vessel Name, Past 'N' Hours, or last by name.",
    basePath: "/api/v1/vessel/arrivaldeclaration/1.0.0",
  },
  departure: {
    title: "Vessel Departure Declaration Query",
    desc: "Access departure declarations by CallSign, Date, IMO, Vessel Name, or Past 'N' Hours.",
    basePath: "/api/v1/vessel/departuredeclaration/1.0.0",
  },
};

const MODE_LABELS = {
  imo: "IMO Number",
  callsign: "CallSign",
  vessel: "Vessel Name",
  date: "Date",
  hours: "Past N Hours",
  last: "Last by Name",
};

const DEFAULTS = {
  imonumber: "9762156",
  callsign: "PKJQ",
  vesselname: "RADJA SAMUDERA ABADI",
  gdvno: "850524",
  certificateno: "E84204",
  date: "2024-01-23",
  datetime: "2024-01-24 00:00:00",
  hours: "24",
};

function modesForCategory(category) {
  if (category === "cert") return ["imo", "callsign", "vessel"];
  if (category === "arrival") return ["imo", "callsign", "vessel", "date", "hours", "last"];
  return ["imo", "callsign", "vessel", "date", "hours"];
}

function pickField(obj, keys) {
  if (!obj || typeof obj !== "object") return "";
  for (const k of keys) {
    if (obj[k] != null && obj[k] !== "") return String(obj[k]);
  }
  return "";
}

/** Normalize Oceans-X arrival payloads into table rows. */
function normalizeRecords(data) {
  if (data == null) return [];
  let list = data;
  if (typeof data === "object" && !Array.isArray(data)) {
    list =
      data.data ||
      data.results ||
      data.records ||
      data.items ||
      data.ArrivalDeclaration ||
      [data];
  }
  if (!Array.isArray(list)) list = [list];

  return list.map((row, idx) => {
    const r = row && typeof row === "object" ? row : { value: row };
    const vp =
      r.vesselParticulars && typeof r.vesselParticulars === "object"
        ? r.vesselParticulars
        : {};

    return {
      id: idx,
      vesselName:
        pickField(vp, ["vesselName", "VesselName"]) ||
        pickField(r, ["vesselName", "vessel_name", "VesselName", "name"]),
      callsign:
        pickField(vp, ["callSign", "callsign", "CallSign"]) ||
        pickField(r, ["callSign", "callsign", "CallSign"]),
      imo:
        pickField(vp, ["imoNumber", "imonumber", "IMO"]) ||
        pickField(r, ["imoNumber", "imonumber", "imo"]),
      flag: pickField(vp, ["flag", "Flag"]) || pickField(r, ["flag", "Flag"]),
      location: pickField(r, ["location", "Location"]),
      grid: pickField(r, ["grid", "Grid"]),
      purpose: pickField(r, ["purpose", "Purpose"]),
      agent: pickField(r, ["agent", "Agent"]),
      reportedArrivalTime: pickField(r, [
        "reportedArrivalTime",
        "ReportedArrivalTime",
        "arrivalTime",
      ]),
      crew: r.crew == null ? "—" : String(r.crew),
      pax: r.pax == null ? "—" : String(r.pax),
      raw: r,
    };
  });
}

function buildEndpointPreview(category, mode, form) {
  const base = CATEGORY_META[category].basePath;
  if (category === "cert") {
    const qs = `?gdvno=${encodeURIComponent(form.gdvno)}&certificateno=${encodeURIComponent(form.certificateno)}`;
    if (mode === "imo") return `${base}/imonumber/${form.imonumber || "{imo}"}${qs}`;
    if (mode === "callsign") return `${base}/callsign/${form.callsign || "{callsign}"}${qs}`;
    return `${base}/vesselname/${encodeURIComponent(form.vesselname || "{name}")}${qs}`;
  }
  if (mode === "last") return `${base}/last/vesselname/${encodeURIComponent(form.vesselname || "{name}")}`;
  if (mode === "imo") return `${base}/imonumber/${form.imonumber || "{imo}"}`;
  if (mode === "callsign") return `${base}/callsign/${form.callsign || "{callsign}"}`;
  if (mode === "vessel") return `${base}/vesselname/${encodeURIComponent(form.vesselname || "{name}")}`;
  if (mode === "date") return `${base}/bydate?date=${form.date || "{date}"}`;
  return `${base}/pastNhours?datetime=${encodeURIComponent(form.datetime || "{datetime}")}&hours=${form.hours || "{hours}"}`;
}

function buildParams(category, mode, form) {
  const params = {};
  if (mode === "imo") params.imonumber = form.imonumber.trim();
  if (mode === "callsign") params.callsign = form.callsign.trim();
  if (mode === "vessel" || mode === "last") params.vesselname = form.vesselname.trim();
  if (mode === "date") params.date = form.date.trim();
  if (mode === "hours") {
    params.datetime = form.datetime.trim();
    params.hours = form.hours.trim();
  }
  if (category === "cert") {
    params.gdvno = form.gdvno.trim();
    params.certificateno = form.certificateno.trim();
  }
  return params;
}

function FlagBadge({ flag }) {
  if (!flag) return <span className="text-slate-500">—</span>;
  return (
    <span className="inline-flex items-center rounded border border-slate-600 bg-slate-900/80 px-2 py-0.5 font-mono text-xs text-slate-200">
      {flag}
    </span>
  );
}

function formatPurpose(purpose) {
  if (!purpose) return "—";
  // MPA purpose is a CSV of Y/N flags; show compact form
  return String(purpose).replace(/,+$/, "");
}

/** Format local time as yyyy-MM-dd HH:mm:ss for Oceans-X pastNhours. */
function formatOceansDateTime(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

function countRecords(data) {
  return normalizeRecords(data).length;
}

export default function OceansXPage() {
  const category = "arrival";
  const [mode, setMode] = useState("hours");
  const [form, setForm] = useState({
    ...DEFAULTS,
    datetime: formatOceansDateTime(),
    hours: "24",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [jsonPayload, setJsonPayload] = useState(null);
  const [kpi, setKpi] = useState({
    arrivals: null,
    departures: null,
    arrivalsError: null,
    departuresError: null,
    loading: true,
    asOf: null,
  });

  const availableModes = modesForCategory(category);
  const endpointPreview = useMemo(
    () => buildEndpointPreview(category, mode, form),
    [category, mode, form]
  );
  const rows = useMemo(
    () => (result ? normalizeRecords(result.data) : []),
    [result]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadPast24h() {
      const datetime = formatOceansDateTime();
      const hours = "24";
      setKpi((prev) => ({ ...prev, loading: true, asOf: datetime }));
      setForm((prev) => ({ ...prev, datetime, hours }));

      const [arrivalsRes, departuresRes] = await Promise.allSettled([
        queryOceansX({
          category: "arrival",
          mode: "hours",
          params: { datetime, hours },
        }),
        queryOceansX({
          category: "departure",
          mode: "hours",
          params: { datetime, hours },
        }),
      ]);

      if (cancelled) return;

      const next = {
        arrivals: null,
        departures: null,
        arrivalsError: null,
        departuresError: null,
        loading: false,
        asOf: datetime,
      };

      if (arrivalsRes.status === "fulfilled") {
        next.arrivals = countRecords(arrivalsRes.value.data);
        // Seed the main table with past-24h arrivals on first load
        setResult(arrivalsRes.value);
        setMode("hours");
      } else {
        next.arrivalsError =
          arrivalsRes.reason?.message || "Failed to load arrivals";
      }

      if (departuresRes.status === "fulfilled") {
        next.departures = countRecords(departuresRes.value.data);
      } else {
        next.departuresError =
          departuresRes.reason?.message || "Failed to load departures";
      }

      setKpi(next);
    }

    loadPast24h();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setJsonOpen(false);
    try {
      const params = buildParams(category, mode, form);
      const res = await queryOceansX({ category, mode, params });
      setResult(res);
    } catch (err) {
      setResult(null);
      setError(err.message || "Query failed");
      if (err.upstream) {
        setJsonPayload({ error: err.message, upstream: err.upstream });
        setJsonOpen(true);
      }
    } finally {
      setLoading(false);
    }
  }

  function viewJson(row) {
    setJsonPayload(row ? row.raw : result);
    setJsonOpen(true);
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 antialiased">
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-600 p-2 text-white">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 15.5V14h16v1.5c0 .83-.67 1.5-1.5 1.5h-13A1.5 1.5 0 014 15.5zM6 12l2-5h8l2 5H6zm7-7a1 1 0 10-2 0v1h2V5z" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white">
                OCEANS-X <span className="font-normal text-blue-500">PortClear</span>
              </span>
              <span className="block text-xs text-slate-400">
                Maritime Port Authority Clearance Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
              <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              API Live Stream Active
            </span>
            <Link
              to="/"
              className="rounded-md bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 ring-1 ring-slate-700 transition hover:bg-slate-700"
            >
              Item Catalog
            </Link>
            <span
              className="hidden items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white sm:inline-flex"
              title="API key is held server-side (OCEANS_X_API_KEY)"
            >
              API Key (server)
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* KPI strip — live past-24h counts */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/60 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Arrivals (Past 24h)
              </span>
              <span className="text-blue-400">↓</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-white">
              {kpi.loading ? "…" : kpi.arrivalsError ? "—" : kpi.arrivals}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {kpi.arrivalsError
                ? kpi.arrivalsError
                : kpi.asOf
                  ? `Query past N hours · as of ${kpi.asOf}`
                  : "Query past N hours"}
            </div>
          </div>

          <div className="rounded-xl border border-slate-700/60 bg-slate-800/60 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Departures (Past 24h)
              </span>
              <span className="text-indigo-400">↑</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-white">
              {kpi.loading ? "…" : kpi.departuresError ? "—" : kpi.departures}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {kpi.departuresError
                ? kpi.departuresError
                : kpi.asOf
                  ? `Query past N hours · as of ${kpi.asOf}`
                  : "Query past N hours"}
            </div>
          </div>
        </div>

        {/* Tabs — arrivals only */}
        <div className="flex space-x-8 border-b border-slate-800 text-sm font-medium">
          <button
            type="button"
            className="flex items-center gap-2 border-b-2 border-blue-500 pb-3 text-blue-400"
          >
            Vessel Arrival Declarations
          </button>
        </div>

        {/* Query builder */}
        <div className="rounded-xl border border-slate-700/80 bg-slate-800/40 p-6">
          <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {CATEGORY_META[category].title}
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">{CATEGORY_META[category].desc}</p>
            </div>
            <div className="flex flex-wrap rounded-lg border border-slate-700 bg-slate-900/80 p-1">
              {availableModes.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                    mode === m
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {MODE_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSearch} className="grid grid-cols-1 gap-4 md:grid-cols-12">
            {(mode === "imo") && (
              <div className="md:col-span-8">
                <label className="mb-1 block text-xs font-medium text-slate-400">IMO Number</label>
                <input
                  value={form.imonumber}
                  onChange={(e) => updateField("imonumber", e.target.value)}
                  placeholder="e.g. 9762156"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}
            {mode === "callsign" && (
              <div className="md:col-span-8">
                <label className="mb-1 block text-xs font-medium text-slate-400">CallSign</label>
                <input
                  value={form.callsign}
                  onChange={(e) => updateField("callsign", e.target.value)}
                  placeholder="e.g. PKJQ"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}
            {(mode === "vessel" || mode === "last") && (
              <div className="md:col-span-8">
                <label className="mb-1 block text-xs font-medium text-slate-400">Vessel Name</label>
                <input
                  value={form.vesselname}
                  onChange={(e) => updateField("vesselname", e.target.value)}
                  placeholder="e.g. RADJA SAMUDERA ABADI"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}
            {mode === "date" && (
              <div className="md:col-span-8">
                <label className="mb-1 block text-xs font-medium text-slate-400">Date (yyyy-MM-dd)</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => updateField("date", e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}
            {mode === "hours" && (
              <>
                <div className="md:col-span-5">
                  <label className="mb-1 block text-xs font-medium text-slate-400">
                    Datetime (yyyy-MM-dd HH:mm:ss)
                  </label>
                  <input
                    value={form.datetime}
                    onChange={(e) => updateField("datetime", e.target.value)}
                    placeholder="2024-01-24 00:00:00"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="mb-1 block text-xs font-medium text-slate-400">Hours</label>
                  <select
                    value={form.hours}
                    onChange={(e) => updateField("hours", e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                  >
                    {["6", "10", "12", "24", "48"].map((h) => (
                      <option key={h} value={h}>
                        Past {h} Hours
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {category === "cert" && (
              <>
                <div className="md:col-span-4">
                  <label className="mb-1 block text-xs font-medium text-slate-400">GDV No</label>
                  <input
                    value={form.gdvno}
                    onChange={(e) => updateField("gdvno", e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="mb-1 block text-xs font-medium text-slate-400">
                    Certificate No
                  </label>
                  <input
                    value={form.certificateno}
                    onChange={(e) => updateField("certificateno", e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            <div className={`flex items-end ${category === "cert" ? "md:col-span-4" : "md:col-span-4"}`}>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Querying…" : "Query API Endpoint"}
              </button>
            </div>
          </form>

          <div className="mt-4 flex items-center gap-2 border-t border-slate-800 pt-3 font-mono text-xs text-slate-400">
            <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-400">
              GET
            </span>
            <span className="break-all">{endpointPreview}</span>
          </div>
        </div>

        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
          >
            {error}
          </div>
        ) : null}

        {/* Results */}
        <div className="overflow-hidden rounded-xl border border-slate-700/80 bg-slate-800/40">
          <div className="flex items-center justify-between border-b border-slate-700/60 px-6 py-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              Clearance & Declaration Records
            </h3>
            <div className="flex items-center gap-3">
              {result ? (
                <button
                  type="button"
                  onClick={() => viewJson(null)}
                  className="text-xs font-medium text-blue-400 hover:text-blue-300"
                >
                  View full JSON
                </button>
              ) : null}
              <span className="text-xs text-slate-400">Data updated every 1 hour</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="border-b border-slate-700/60 bg-slate-900/60 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-6 py-3">Vessel Name</th>
                  <th className="px-6 py-3">CallSign</th>
                  <th className="px-6 py-3">IMO</th>
                  <th className="px-6 py-3">Flag</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3">Agent</th>
                  <th className="px-6 py-3">Reported Arrival</th>
                  <th className="px-6 py-3">Purpose</th>
                  <th className="px-6 py-3">Crew / Pax</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-10 text-center text-slate-400">
                      Loading Oceans-X response…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-10 text-center text-slate-400">
                      {result
                        ? "No tabular fields found — open full JSON to inspect the payload."
                        : "Run a query to load records from Oceans-X."}
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="transition-colors hover:bg-slate-800/50">
                      <td className="whitespace-nowrap px-6 py-4 font-medium text-white">
                        {row.vesselName || "—"}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-300">
                        {row.callsign || "—"}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-300">
                        {row.imo || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <FlagBadge flag={row.flag} />
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-300">
                        {row.location || "—"}
                        {row.grid ? (
                          <span className="ml-1 text-slate-500">({row.grid})</span>
                        ) : null}
                      </td>
                      <td className="max-w-[12rem] truncate px-6 py-4 text-slate-300" title={row.agent}>
                        {row.agent || "—"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-300">
                        {row.reportedArrivalTime || "—"}
                      </td>
                      <td
                        className="max-w-[8rem] truncate px-6 py-4 font-mono text-xs text-slate-400"
                        title={row.purpose}
                      >
                        {formatPurpose(row.purpose)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-300">
                        {row.crew} / {row.pax}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => viewJson(row)}
                          className="text-xs font-medium text-blue-400 hover:text-blue-300"
                        >
                          View JSON
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {jsonOpen && jsonPayload ? (
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="flex items-center gap-2 font-mono text-sm font-bold text-white">
                Raw API Payload Response
              </h4>
              <button
                type="button"
                onClick={() => setJsonOpen(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close [X]
              </button>
            </div>
            <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-emerald-400">
              {JSON.stringify(jsonPayload, null, 2)}
            </pre>
          </div>
        ) : null}
      </main>
    </div>
  );
}
