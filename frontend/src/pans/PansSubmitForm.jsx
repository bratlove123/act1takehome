import { useMemo, useState } from "react";
import { submitPortClearance } from "../oceansxApi";
import { buildPansPayload, createDefaultPansForm, emptySts } from "./defaults";
import { STEPS, validateAll, validateStep } from "./validate";

const PURPOSE_OPTIONS = [
  { value: "0", label: "0 — Other Afloat Activities" },
  { value: "1", label: "1 — Loading/Discharging Cargo" },
  { value: "2", label: "2 — Embarking/Disembarking Passengers" },
  { value: "3", label: "3 — Taking Bunkers" },
  { value: "4", label: "4 — Taking Ship's Supplies" },
  { value: "5", label: "5 — Changing Crew" },
  { value: "6", label: "6 — Repair/Docking/Outfitting" },
  { value: "7", label: "7 — Offshore Support Vessel" },
];

const FUEL_OPTIONS = [
  { value: "0", label: "0 — Others" },
  { value: "1", label: "1 — LSFO" },
  { value: "2", label: "2 — MGO" },
  { value: "3", label: "3 — LNG" },
];

const inputCls =
  "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const labelCls = "mb-1 block text-xs font-medium text-slate-400";
const errCls = "mt-1 text-xs text-rose-400";

function Field({
  label,
  required,
  error,
  children,
  hint,
}) {
  return (
    <div>
      <label className={labelCls}>
        {label}
        {required ? <span className="text-rose-400"> *</span> : null}
      </label>
      {children}
      {hint ? <p className="mt-1 text-[11px] text-slate-500">{hint}</p> : null}
      {error ? <p className={errCls}>{error}</p> : null}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, maxLength, type = "text" }) {
  return (
    <input
      type={type}
      value={value ?? ""}
      maxLength={maxLength}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={inputCls}
    />
  );
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className={inputCls}
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

const YN_OPTIONS = [
  { value: "Y", label: "Y — Yes" },
  { value: "N", label: "N — No" },
];

function RadioGroup({ name, value, onChange, options }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={name}>
      {options.map((o) => {
        const id = `${name}-${o.value}`;
        const checked = value === o.value;
        return (
          <label
            key={o.value}
            htmlFor={id}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
              checked
                ? "border-blue-500 bg-blue-500/10 text-white"
                : "border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-600"
            }`}
          >
            <input
              id={id}
              type="radio"
              name={name}
              value={o.value}
              checked={checked}
              onChange={() => onChange(o.value)}
              className="accent-blue-500"
            />
            <span>{o.label}</span>
          </label>
        );
      })}
    </div>
  );
}

function MultiCheck({ values, onChange, options }) {
  const selected = Array.isArray(values) ? values : [];
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((o) => {
        const checked = selected.includes(o.value);
        return (
          <label
            key={o.value}
            className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-300"
          >
            <input
              type="checkbox"
              className="mt-0.5"
              checked={checked}
              onChange={() => {
                if (checked) onChange(selected.filter((v) => v !== o.value));
                else onChange([...selected, o.value]);
              }}
            />
            <span>{o.label}</span>
          </label>
        );
      })}
    </div>
  );
}

function setPath(obj, path, value) {
  const next = structuredClone(obj);
  const parts = path.split(".");
  let cur = next;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const asNum = Number(key);
    if (Array.isArray(cur) && Number.isInteger(asNum) && String(asNum) === key) {
      cur = cur[asNum];
    } else {
      cur = cur[key];
    }
  }
  const last = parts[parts.length - 1];
  const lastNum = Number(last);
  if (Array.isArray(cur) && Number.isInteger(lastNum) && String(lastNum) === last) {
    cur[lastNum] = value;
  } else {
    cur[last] = value;
  }
  return next;
}

export default function PansSubmitForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(() => createDefaultPansForm());
  const [errors, setErrors] = useState([]);
  const [fieldHints, setFieldHints] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const stepMeta = STEPS[step];
  const payloadPreview = useMemo(() => buildPansPayload(form), [form]);

  function update(path, value) {
    setForm((prev) => setPath(prev, path, value));
  }

  function goNext() {
    const errs = validateStep(stepMeta.id, form);
    setErrors(errs);
    if (errs.length) return;
    setErrors([]);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setErrors([]);
    setStep((s) => Math.max(s - 1, 0));
  }

  function goToStep(i) {
    if (i <= step) {
      setErrors([]);
      setStep(i);
      return;
    }
    // validate all prior steps before jumping ahead
    for (let j = 0; j < i; j++) {
      const e = validateStep(STEPS[j].id, form);
      if (e.length) {
        setStep(j);
        setErrors(e);
        return;
      }
    }
    setErrors([]);
    setStep(i);
  }

  async function handleSubmit() {
    const all = validateAll(form);
    if (Object.keys(all).length) {
      const first = STEPS.find((s) => all[s.id]);
      if (first) {
        setStep(STEPS.findIndex((s) => s.id === first.id));
        setErrors(all[first.id]);
      }
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    setSubmitResult(null);
    try {
      const body = buildPansPayload(form);
      const res = await submitPortClearance(body);
      setSubmitResult(res);
    } catch (err) {
      setSubmitError({
        message: err.message,
        upstream: err.upstream,
        details: err.upstream?.details,
      });
      if (Array.isArray(err.upstream?.details)) {
        const hints = {};
        for (const d of err.upstream.details) {
          if (d.field) hints[d.field] = d.error;
        }
        setFieldHints(hints);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function addSts() {
    if (form.itinerary.shipToShipActivities.length >= 5) return;
    update("itinerary.shipToShipActivities", [
      ...form.itinerary.shipToShipActivities,
      emptySts(form.itinerary.shipToShipActivities.length + 1),
    ]);
  }

  function removeSts(idx) {
    const next = form.itinerary.shipToShipActivities.filter((_, i) => i !== idx);
    update("itinerary.shipToShipActivities", next);
  }

  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-800/40">
      {/* Stepper */}
      <div className="border-b border-slate-700/60 px-4 py-4 sm:px-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Submit Port Clearance (PANS)</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              POST /api/v1/port-clearance-data/1.0.0/clearance-requests · step{" "}
              {step + 1} of {STEPS.length}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setForm(createDefaultPansForm());
              setErrors([]);
              setSubmitResult(null);
              setSubmitError(null);
              setFieldHints({});
              setStep(0);
            }}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 ring-1 ring-slate-700 hover:bg-slate-800"
          >
            Reset sample
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goToStep(i)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                i === step
                  ? "bg-blue-600 text-white"
                  : i < step
                    ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
                    : "bg-slate-900 text-slate-500 ring-1 ring-slate-700"
              }`}
            >
              {i + 1}. {s.title}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6 p-4 sm:p-6">
        {errors.length > 0 ? (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            <p className="font-medium">Please fix the following:</p>
            <ul className="mt-1 list-disc pl-5 text-xs">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {Object.keys(fieldHints).length > 0 ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
            Upstream field errors:
            <ul className="mt-1 list-disc pl-5">
              {Object.entries(fieldHints).map(([k, v]) => (
                <li key={k}>
                  <code className="text-amber-300">{k}</code>: {v}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {stepMeta.id === "overview" && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Submit PANS" required hint='v1.0.0 only accepts "Y"'>
              <RadioGroup
                name="submitPANS"
                value={form.submitPANS}
                onChange={(v) => update("submitPANS", v)}
                options={[{ value: "Y", label: "Y — Submit to PANS" }]}
              />
            </Field>
            <Field label="Arrival / Departure code" hint="A Arrival · D Departure · C Combined">
              <Select
                value={form.arrDepCode}
                onChange={(v) => update("arrDepCode", v)}
                options={[
                  { value: "A", label: "A — Arrival" },
                  { value: "D", label: "D — Departure" },
                  { value: "C", label: "C — Combined" },
                ]}
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Remarks" hint="Max 511 characters">
                <textarea
                  rows={3}
                  maxLength={511}
                  value={form.remarks}
                  placeholder="e.g. Arrival port call with bunkering and crew change"
                  onChange={(e) => update("remarks", e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>
        )}

        {stepMeta.id === "agent" && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Agent name" required>
              <TextInput
                value={form.agentAtPort.agentName}
                maxLength={96}
                placeholder="Example Maritime Services Pte Ltd"
                onChange={(v) => update("agentAtPort.agentName", v)}
              />
            </Field>
            <Field label="Contact name">
              <TextInput
                value={form.agentAtPort.agentContactName}
                maxLength={70}
                placeholder="Example Agent"
                onChange={(v) => update("agentAtPort.agentContactName", v)}
              />
            </Field>
            <Field label="Email" required>
              <TextInput
                type="email"
                value={form.agentAtPort.agentEmail}
                maxLength={80}
                placeholder="agent@example.com.sg"
                onChange={(v) => update("agentAtPort.agentEmail", v)}
              />
            </Field>
            <Field label="Mobile" required>
              <TextInput
                value={form.agentAtPort.agentMobileNumber}
                maxLength={15}
                placeholder="+6591234567"
                onChange={(v) => update("agentAtPort.agentMobileNumber", v)}
              />
            </Field>
            <Field label="Fax" required>
              <TextInput
                value={form.agentAtPort.agentFaxNumber}
                maxLength={15}
                placeholder="+6567891235"
                onChange={(v) => update("agentAtPort.agentFaxNumber", v)}
              />
            </Field>
            <Field label="Landline">
              <TextInput
                value={form.agentAtPort.agentLandlineNumber}
                maxLength={50}
                placeholder="+6567891234"
                onChange={(v) => update("agentAtPort.agentLandlineNumber", v)}
              />
            </Field>
            <Field label="Agent identification number">
              <TextInput
                value={form.agentAtPort.agentIdentificationNumber}
                maxLength={17}
                placeholder="SGPORT-PM-12345"
                onChange={(v) => update("agentAtPort.agentIdentificationNumber", v)}
              />
            </Field>
          </div>
        )}

        {stepMeta.id === "portCall" && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field label="Cargo brief description" required>
                <TextInput
                  value={form.portCall.cargoBriefDescription}
                  maxLength={150}
                  placeholder="Mixed cargo including containerised electronics…"
                  onChange={(v) => update("portCall.cargoBriefDescription", v)}
                />
              </Field>
            </div>
            <Field label="Dangerous goods carried" required>
              <RadioGroup
                name="dangerousGoodsCarriedIndicator"
                value={form.portCall.dangerousGoodsCarriedIndicator}
                onChange={(v) => update("portCall.dangerousGoodsCarriedIndicator", v)}
                options={YN_OPTIONS}
              />
            </Field>
            <Field label="Port of arrival code" required hint="e.g. SGSIN">
              <TextInput
                value={form.portCall.portOfArrivalCoded}
                maxLength={9}
                placeholder="SGSIN"
                onChange={(v) => update("portCall.portOfArrivalCoded", v)}
              />
            </Field>
            <Field label="Port facility code" required hint="e.g. ACBTH">
              <TextInput
                value={form.portCall.portFacilityCoded}
                maxLength={5}
                placeholder="ACBTH"
                onChange={(v) => update("portCall.portFacilityCoded", v)}
              />
            </Field>
            <Field label="ETA (UTC)" required hint="YYYY-MM-DDThh:mm:ssZ">
              <TextInput
                value={form.portCall.eta}
                placeholder="2026-03-10T06:30:00Z"
                onChange={(v) => update("portCall.eta", v)}
              />
            </Field>
            <Field label="ETD (UTC)" required hint="YYYY-MM-DDThh:mm:ssZ">
              <TextInput
                value={form.portCall.etd}
                placeholder="2026-03-13T18:00:00Z"
                onChange={(v) => update("portCall.etd", v)}
              />
            </Field>
            <Field label="Name of master">
              <TextInput
                value={form.portCall.nameOfMaster}
                maxLength={70}
                placeholder="Example Captain"
                onChange={(v) => update("portCall.nameOfMaster", v)}
              />
            </Field>
            <Field label="Number of crew">
              <TextInput
                value={form.portCall.numberOfCrew}
                placeholder="24"
                onChange={(v) => update("portCall.numberOfCrew", v)}
              />
            </Field>
            <Field label="Number of passengers">
              <TextInput
                value={form.portCall.numberOfPassengers}
                placeholder="5"
                onChange={(v) => update("portCall.numberOfPassengers", v)}
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Primary purpose of call" required hint="Select one or more (tilde-joined in payload)">
                <MultiCheck
                  values={form.portCall.primaryPurposeOfCallCoded}
                  options={PURPOSE_OPTIONS}
                  onChange={(v) => update("portCall.primaryPurposeOfCallCoded", v)}
                />
              </Field>
            </div>
            {form.portCall.primaryPurposeOfCallCoded?.includes("0") ? (
              <div className="md:col-span-2">
                <Field label="Miscellaneous purpose remarks" required>
                  <TextInput
                    value={form.portCall.miscellaneousPurposeRemarks}
                    maxLength={80}
                    placeholder="Specify other afloat activities"
                    onChange={(v) => update("portCall.miscellaneousPurposeRemarks", v)}
                  />
                </Field>
              </div>
            ) : null}
            <div className="md:col-span-2">
              <Field label="Security other matters to report">
                <TextInput
                  value={form.portCall.securityOtherMattersToReport}
                  maxLength={80}
                  placeholder="Enhanced security measures…"
                  onChange={(v) => update("portCall.securityOtherMattersToReport", v)}
                />
              </Field>
            </div>
          </div>
        )}

        {stepMeta.id === "ship" && (
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["shipImoNumber", "IMO number", "9567890", 10, true],
              ["shipName", "Ship name", "MV NORDIC VOYAGER", 35, true],
              ["shipCallSign", "Call sign", "OJAB2", 8, true],
              ["shipFlagStateCoded", "Flag state (ISO-2)", "SG", 2, true],
              ["shipTypeCoded", "Ship type code", "BA", 2, true],
              ["shipCompanyName", "Ship company", "Example Shipping Company", 96, true],
              ["shipGrossTonnage", "Gross tonnage", "48750", null, true],
              ["shipSatelliteServiceNumber", "Satellite service no.", "76543210987654", null, true],
              ["shipMMSI", "MMSI", "230123456", null, true],
              ["airDraft", "Air draft (m)", "52.3", null, true],
            ].map(([key, label, ph, max, req]) => (
              <Field key={key} label={label} required={req}>
                <TextInput
                  value={form.ship[key]}
                  maxLength={max || undefined}
                  placeholder={ph}
                  onChange={(v) => update(`ship.${key}`, v)}
                />
              </Field>
            ))}
            <Field label="Current security level" required>
              <Select
                value={form.ship.shipCurrentSecurityLevel}
                onChange={(v) => update("ship.shipCurrentSecurityLevel", v)}
                options={[
                  { value: "1", label: "1" },
                  { value: "2", label: "2" },
                  { value: "3", label: "3" },
                ]}
              />
            </Field>
            {["ISS", "CLC", "BCC"].map((code) => {
              const validKey = `valid${code}Certificate`;
              const authKey =
                code === "CLC"
                  ? "issuingAuthorityCLCertificate"
                  : `issuingAuthority${code}Certificate`;
              const expKey =
                code === "CLC"
                  ? "expiryDateCLCertificate"
                  : `expiryDate${code}Certificate`;
              return (
                <div key={code} className="md:col-span-2 grid gap-4 rounded-lg border border-slate-700/60 p-4 md:grid-cols-3">
                  <Field label={`Valid ${code} certificate`} required>
                    <RadioGroup
                      name={validKey}
                      value={form.ship[validKey]}
                      onChange={(v) => update(`ship.${validKey}`, v)}
                      options={YN_OPTIONS}
                    />
                  </Field>
                  <Field label={`${code} issuing authority`} required>
                    <TextInput
                      value={form.ship[authKey]}
                      maxLength={80}
                      placeholder="Issuing authority"
                      onChange={(v) => update(`ship.${authKey}`, v)}
                    />
                  </Field>
                  <Field label={`${code} expiry (YYYY-MM-DD)`} required>
                    <TextInput
                      type="date"
                      value={form.ship[expKey]}
                      onChange={(v) => update(`ship.${expKey}`, v)}
                    />
                  </Field>
                </div>
              );
            })}
          </div>
        )}

        {stepMeta.id === "security" && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Company security officer name" required>
              <TextInput
                value={form.securityOfficer.companySecurityOfficerName}
                maxLength={80}
                placeholder="Example Security Officer"
                onChange={(v) =>
                  update("securityOfficer.companySecurityOfficerName", v)
                }
              />
            </Field>
            <Field label="CSO mobile" required>
              <TextInput
                value={form.securityOfficer.companySecurityOfficerMobileNumber}
                maxLength={15}
                placeholder="+358401234567"
                onChange={(v) =>
                  update("securityOfficer.companySecurityOfficerMobileNumber", v)
                }
              />
            </Field>
          </div>
        )}

        {stepMeta.id === "itinerary" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Last port of call code" hint="UN/LOCODE e.g. THLCH">
                <TextInput
                  value={form.itinerary.lastPortOfCallCoded}
                  maxLength={5}
                  placeholder="THLCH"
                  onChange={(v) => update("itinerary.lastPortOfCallCoded", v)}
                />
              </Field>
              <Field label="Next port of call code" hint="UN/LOCODE e.g. HKHKG">
                <TextInput
                  value={form.itinerary.nextPortOfCallCoded}
                  maxLength={5}
                  placeholder="HKHKG"
                  onChange={(v) => update("itinerary.nextPortOfCallCoded", v)}
                />
              </Field>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-white">
                Previous ports of call (exactly 10)
              </h3>
              <div className="space-y-4">
                {form.itinerary.previousPortsOfCall.map((p, i) => (
                  <div
                    key={i}
                    className="grid gap-3 rounded-lg border border-slate-700/60 bg-slate-900/40 p-4 md:grid-cols-4"
                  >
                    <p className="md:col-span-4 text-xs font-medium text-blue-400">
                      Port #{i + 1}
                    </p>
                    <Field label="Name" required>
                      <TextInput
                        value={p.previousPortOfCallName}
                        maxLength={35}
                        placeholder="Laem Chabang"
                        onChange={(v) =>
                          update(`itinerary.previousPortsOfCall.${i}.previousPortOfCallName`, v)
                        }
                      />
                    </Field>
                    <Field label="Code" required>
                      <TextInput
                        value={p.previousPortOfCallCoded}
                        maxLength={5}
                        placeholder="THLCH"
                        onChange={(v) =>
                          update(`itinerary.previousPortsOfCall.${i}.previousPortOfCallCoded`, v)
                        }
                      />
                    </Field>
                    <Field label="Facility" required>
                      <TextInput
                        value={p.previousPortFacilityName}
                        maxLength={30}
                        placeholder="KEPPEL TUAS RFLS PIERW"
                        onChange={(v) =>
                          update(`itinerary.previousPortsOfCall.${i}.previousPortFacilityName`, v)
                        }
                      />
                    </Field>
                    <Field label="Security level" required>
                      <Select
                        value={p.shipSecurityLevelInAPreviousPortCoded}
                        onChange={(v) =>
                          update(
                            `itinerary.previousPortsOfCall.${i}.shipSecurityLevelInAPreviousPortCoded`,
                            v
                          )
                        }
                        options={[
                          { value: "SL1", label: "SL1" },
                          { value: "SL2", label: "SL2" },
                          { value: "SL3", label: "SL3" },
                        ]}
                      />
                    </Field>
                    <Field label="Start date" required>
                      <TextInput
                        type="date"
                        value={p.previousPortFacilityCallStartDate}
                        onChange={(v) =>
                          update(
                            `itinerary.previousPortsOfCall.${i}.previousPortFacilityCallStartDate`,
                            v
                          )
                        }
                      />
                    </Field>
                    <Field label="End date" required>
                      <TextInput
                        type="date"
                        value={p.previousPortFacilityCallEndDate}
                        onChange={(v) =>
                          update(
                            `itinerary.previousPortsOfCall.${i}.previousPortFacilityCallEndDate`,
                            v
                          )
                        }
                      />
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="Additional security measures">
                        <TextInput
                          value={p.shipAdditionalSecurityMeasuresDescription}
                          maxLength={80}
                          placeholder="Enhanced screening…"
                          onChange={(v) =>
                            update(
                              `itinerary.previousPortsOfCall.${i}.shipAdditionalSecurityMeasuresDescription`,
                              v
                            )
                          }
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">
                  Ship-to-ship activities (1–5)
                </h3>
                <button
                  type="button"
                  onClick={addSts}
                  disabled={form.itinerary.shipToShipActivities.length >= 5}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
                >
                  + Add activity
                </button>
              </div>
              <div className="space-y-4">
                {form.itinerary.shipToShipActivities.map((a, i) => (
                  <div
                    key={i}
                    className="grid gap-3 rounded-lg border border-slate-700/60 bg-slate-900/40 p-4 md:grid-cols-3"
                  >
                    <div className="md:col-span-3 flex items-center justify-between">
                      <p className="text-xs font-medium text-blue-400">STS #{i + 1}</p>
                      {form.itinerary.shipToShipActivities.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeSts(i)}
                          className="text-xs text-rose-400 hover:text-rose-300"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                    <div className="md:col-span-3">
                      <Field label="Activity" required>
                        <TextInput
                          value={a.shipToShipActivity}
                          maxLength={80}
                          placeholder="Bunkering operation…"
                          onChange={(v) =>
                            update(`itinerary.shipToShipActivities.${i}.shipToShipActivity`, v)
                          }
                        />
                      </Field>
                    </div>
                    <Field label="Start" required>
                      <TextInput
                        type="date"
                        value={a.shipToShipActivityStartDate}
                        onChange={(v) =>
                          update(
                            `itinerary.shipToShipActivities.${i}.shipToShipActivityStartDate`,
                            v
                          )
                        }
                      />
                    </Field>
                    <Field label="End" required>
                      <TextInput
                        type="date"
                        value={a.shipToShipActivityEndDate}
                        onChange={(v) =>
                          update(
                            `itinerary.shipToShipActivities.${i}.shipToShipActivityEndDate`,
                            v
                          )
                        }
                      />
                    </Field>
                    <Field label="Location name" required>
                      <TextInput
                        value={a.shipToShipActivityLocationName}
                        maxLength={30}
                        placeholder="Western Petroleum"
                        onChange={(v) =>
                          update(
                            `itinerary.shipToShipActivities.${i}.shipToShipActivityLocationName`,
                            v
                          )
                        }
                      />
                    </Field>
                    <Field label="Latitude">
                      <TextInput
                        value={a.shipToShipActivityLocationLatitude}
                        maxLength={15}
                        placeholder="03 10' N"
                        onChange={(v) =>
                          update(
                            `itinerary.shipToShipActivities.${i}.shipToShipActivityLocationLatitude`,
                            v
                          )
                        }
                      />
                    </Field>
                    <Field label="Longitude">
                      <TextInput
                        value={a.shipToShipActivityLocationLongitude}
                        maxLength={15}
                        placeholder="104 25' E"
                        onChange={(v) =>
                          update(
                            `itinerary.shipToShipActivities.${i}.shipToShipActivityLocationLongitude`,
                            v
                          )
                        }
                      />
                    </Field>
                    <Field label="Security measures">
                      <TextInput
                        value={a.shipSecurityMeasures}
                        maxLength={80}
                        placeholder="Security level 1…"
                        onChange={(v) =>
                          update(`itinerary.shipToShipActivities.${i}.shipSecurityMeasures`, v)
                        }
                      />
                    </Field>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {stepMeta.id === "extra" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Draft fwd (m)" required hint="Max 99.9">
                <TextInput
                  value={form.extraPortRequirements.vesselArrivalDraftFwd}
                  placeholder="12.5"
                  onChange={(v) => update("extraPortRequirements.vesselArrivalDraftFwd", v)}
                />
              </Field>
              <Field label="Draft mid (m)" required>
                <TextInput
                  value={form.extraPortRequirements.vesselArrivalDraftMid}
                  placeholder="12.8"
                  onChange={(v) => update("extraPortRequirements.vesselArrivalDraftMid", v)}
                />
              </Field>
              <Field label="Draft aft (m)" required>
                <TextInput
                  value={form.extraPortRequirements.vesselArrivalDraftAft}
                  placeholder="12.9"
                  onChange={(v) => update("extraPortRequirements.vesselArrivalDraftAft", v)}
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Ship email" required>
                <TextInput
                  type="email"
                  value={form.extraPortRequirements.shipEmailAddress}
                  placeholder="vessel@example.com"
                  onChange={(v) => update("extraPortRequirements.shipEmailAddress", v)}
                />
              </Field>
              <Field label="Arriving from" required>
                <Select
                  value={form.extraPortRequirements.shipArrivingFrom}
                  onChange={(v) => update("extraPortRequirements.shipArrivingFrom", v)}
                  options={[
                    { value: "N", label: "N — North" },
                    { value: "S", label: "S — South" },
                    { value: "E", label: "E — East" },
                    { value: "W", label: "W — West" },
                  ]}
                />
              </Field>
              <Field label="Contracted security personnel" required>
                <RadioGroup
                  name="contractedSecurityPersonnelIndicator"
                  value={form.extraPortRequirements.contractedSecurityPersonnelIndicator}
                  onChange={(v) =>
                    update("extraPortRequirements.contractedSecurityPersonnelIndicator", v)
                  }
                  options={YN_OPTIONS}
                />
              </Field>
              <Field label="Refugees / stowaways / rescues" required>
                <RadioGroup
                  name="refugeesStowawaysRescuesFromSeaIndicator"
                  value={form.extraPortRequirements.refugeesStowawaysRescuesFromSeaIndicator}
                  onChange={(v) =>
                    update("extraPortRequirements.refugeesStowawaysRescuesFromSeaIndicator", v)
                  }
                  options={YN_OPTIONS}
                />
              </Field>
              <Field label="Arms & ammunition on board" required>
                <RadioGroup
                  name="armsAndAmmunitionIndicator"
                  value={form.extraPortRequirements.armsAndAmmunitionIndicator}
                  onChange={(v) =>
                    update("extraPortRequirements.armsAndAmmunitionIndicator", v)
                  }
                  options={YN_OPTIONS}
                />
              </Field>
              <Field label="Arms type & quantity" required>
                <TextInput
                  value={form.extraPortRequirements.armsAndAmmunitionTypeAndQuantity}
                  maxLength={80}
                  placeholder="None"
                  onChange={(v) =>
                    update("extraPortRequirements.armsAndAmmunitionTypeAndQuantity", v)
                  }
                />
              </Field>
              <Field label="Strong room" required>
                <RadioGroup
                  name="strongRoomIndicator"
                  value={form.extraPortRequirements.strongRoomIndicator}
                  onChange={(v) => update("extraPortRequirements.strongRoomIndicator", v)}
                  options={[
                    { value: "Y", label: "Y — Yes" },
                    { value: "N", label: "N — No" },
                    { value: "A", label: "A — N/A" },
                  ]}
                />
              </Field>
              {form.extraPortRequirements.strongRoomIndicator === "Y" ? (
                <Field label="Strong room location" required>
                  <TextInput
                    value={form.extraPortRequirements.strongRoomLocation}
                    maxLength={40}
                    placeholder="Upper Deck, Starboard side"
                    onChange={(v) => update("extraPortRequirements.strongRoomLocation", v)}
                  />
                </Field>
              ) : null}
              <Field label="Green ship programme" required>
                <Select
                  value={form.extraPortRequirements.greenShipProgramme}
                  onChange={(v) => update("extraPortRequirements.greenShipProgramme", v)}
                  options={[
                    { value: "N", label: "N — No" },
                    { value: "H", label: "H — Zero emission (e.g. Hydrogen)" },
                    { value: "A", label: "A — Zero carbon (e.g. Ammonia)" },
                    { value: "M", label: "M — Low-carbon CF ≤ 1.375" },
                    { value: "B", label: "B — Low-carbon 1.375 < CF ≤ 2.750" },
                  ]}
                />
              </Field>
              <Field label="IBWMC indicator" required>
                <RadioGroup
                  name="ibwmcIndicator"
                  value={form.extraPortRequirements.ibwmcIndicator}
                  onChange={(v) => update("extraPortRequirements.ibwmcIndicator", v)}
                  options={YN_OPTIONS}
                />
              </Field>
              <Field label="BWMS operational" required>
                <RadioGroup
                  name="bwmsOperationalIndicator"
                  value={form.extraPortRequirements.bwmsOperationalIndicator}
                  onChange={(v) => update("extraPortRequirements.bwmsOperationalIndicator", v)}
                  options={YN_OPTIONS}
                />
              </Field>
            </div>

            <div className="rounded-lg border border-slate-700/60 p-4">
              <h3 className="mb-3 text-sm font-semibold text-white">Sulphur compliance</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Method of compliance">
                  <Select
                    value={form.extraPortRequirements.sulphurMethodOfCompliance}
                    onChange={(v) => update("extraPortRequirements.sulphurMethodOfCompliance", v)}
                    placeholder="Select…"
                    options={[
                      { value: "E", label: "E — Scrubber" },
                      { value: "C", label: "C — Compliant fuel ≤ 0.50%" },
                      { value: "N", label: "N — Non-compliant > 0.50%" },
                    ]}
                  />
                </Field>
                {form.extraPortRequirements.sulphurMethodOfCompliance === "E" ? (
                  <Field label="Type of scrubber" required>
                    <Select
                      value={form.extraPortRequirements.typeOfScrubber}
                      onChange={(v) => update("extraPortRequirements.typeOfScrubber", v)}
                      options={[
                        { value: "O", label: "O — Open Loop" },
                        { value: "C", label: "C — Closed Loop" },
                        { value: "H", label: "H — Hybrid" },
                      ]}
                    />
                  </Field>
                ) : null}
                {form.extraPortRequirements.typeOfScrubber === "O" ? (
                  <Field label="Sufficient compliant fuel" required>
                    <RadioGroup
                      name="sufficientCompliantFuelIndicator"
                      value={form.extraPortRequirements.sufficientCompliantFuelIndicator}
                      onChange={(v) =>
                        update("extraPortRequirements.sufficientCompliantFuelIndicator", v)
                      }
                      options={YN_OPTIONS}
                    />
                  </Field>
                ) : null}
                {form.extraPortRequirements.sufficientCompliantFuelIndicator === "N" ? (
                  <Field label="Will procure fuel" required>
                    <RadioGroup
                      name="procurementOfFuelIndicator"
                      value={form.extraPortRequirements.procurementOfFuelIndicator}
                      onChange={(v) =>
                        update("extraPortRequirements.procurementOfFuelIndicator", v)
                      }
                      options={YN_OPTIONS}
                    />
                  </Field>
                ) : null}
                {form.extraPortRequirements.sulphurMethodOfCompliance === "C" ? (
                  <div className="md:col-span-2">
                    <Field label="Type of compliant fuel oil" required>
                      <MultiCheck
                        values={form.extraPortRequirements.typeOfCompliantFuelOil}
                        options={FUEL_OPTIONS}
                        onChange={(v) =>
                          update("extraPortRequirements.typeOfCompliantFuelOil", v)
                        }
                      />
                    </Field>
                  </div>
                ) : null}
                {form.extraPortRequirements.typeOfCompliantFuelOil?.includes("0") ? (
                  <div className="md:col-span-2">
                    <Field label="Other fuel description" required>
                      <TextInput
                        value={form.extraPortRequirements.otherFuel}
                        maxLength={150}
                        placeholder="Describe other fuel"
                        onChange={(v) => update("extraPortRequirements.otherFuel", v)}
                      />
                    </Field>
                  </div>
                ) : null}
                {form.extraPortRequirements.sulphurMethodOfCompliance === "N" ? (
                  <>
                    <Field label="Completed FONAR" required>
                      <RadioGroup
                        name="completedFonarIndicator"
                        value={form.extraPortRequirements.completedFonarIndicator}
                        onChange={(v) =>
                          update("extraPortRequirements.completedFonarIndicator", v)
                        }
                        options={YN_OPTIONS}
                      />
                    </Field>
                    {form.extraPortRequirements.completedFonarIndicator === "Y" ? (
                      <Field label="Disposal of non-compliant fuel" required>
                        <RadioGroup
                          name="disposalOfNonCompliantFuel"
                          value={form.extraPortRequirements.disposalOfNonCompliantFuel}
                          onChange={(v) =>
                            update("extraPortRequirements.disposalOfNonCompliantFuel", v)
                          }
                          options={YN_OPTIONS}
                        />
                      </Field>
                    ) : null}
                    {form.extraPortRequirements.disposalOfNonCompliantFuel === "N" ? (
                      <Field label="Procure compliant fuel" required>
                        <RadioGroup
                          name="procureCompliantFuel"
                          value={form.extraPortRequirements.procureCompliantFuel}
                          onChange={(v) =>
                            update("extraPortRequirements.procureCompliantFuel", v)
                          }
                          options={YN_OPTIONS}
                        />
                      </Field>
                    ) : null}
                    {form.extraPortRequirements.completedFonarIndicator === "N" ? (
                      <>
                        <Field label="Non-compliant fuel BDN" required>
                          <RadioGroup
                            name="nonCompliantFuelBDN"
                            value={form.extraPortRequirements.nonCompliantFuelBDN}
                            onChange={(v) =>
                              update("extraPortRequirements.nonCompliantFuelBDN", v)
                            }
                            options={YN_OPTIONS}
                          />
                        </Field>
                        {form.extraPortRequirements.nonCompliantFuelBDN === "N" ? (
                          <Field label="Reason for no FONAR" required>
                            <TextInput
                              value={form.extraPortRequirements.reasonForNoFonarOthers}
                              maxLength={150}
                              placeholder="Explain why FONAR was not completed"
                              onChange={(v) =>
                                update("extraPortRequirements.reasonForNoFonarOthers", v)
                              }
                            />
                          </Field>
                        ) : null}
                      </>
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Report latitude">
                <TextInput
                  value={form.extraPortRequirements.locationOfReportLat}
                  maxLength={15}
                  placeholder="03 10' N"
                  onChange={(v) => update("extraPortRequirements.locationOfReportLat", v)}
                />
              </Field>
              <Field label="Report longitude">
                <TextInput
                  value={form.extraPortRequirements.locationOfReportLong}
                  maxLength={15}
                  placeholder="104 25' E"
                  onChange={(v) => update("extraPortRequirements.locationOfReportLong", v)}
                />
              </Field>
              <Field label="Report port (UN/LOCODE)" required>
                <TextInput
                  value={form.extraPortRequirements.locationOfReportPort}
                  maxLength={20}
                  placeholder="SGSIN"
                  onChange={(v) => update("extraPortRequirements.locationOfReportPort", v)}
                />
              </Field>
              <Field label="Datetime of report (UTC)" required>
                <TextInput
                  value={form.extraPortRequirements.datetimeOfReport}
                  placeholder="2026-03-10T04:00:00Z"
                  onChange={(v) => update("extraPortRequirements.datetimeOfReport", v)}
                />
              </Field>
              <Field label="Unmanned aircraft in port" required>
                <RadioGroup
                  name="unmannedAircraftInPortIndicator"
                  value={form.extraPortRequirements.unmannedAircraftInPortIndicator}
                  onChange={(v) =>
                    update("extraPortRequirements.unmannedAircraftInPortIndicator", v)
                  }
                  options={YN_OPTIONS}
                />
              </Field>
              <Field label="PANS submitter name" required>
                <TextInput
                  value={form.extraPortRequirements.pansSubmitterName}
                  maxLength={35}
                  placeholder="Example Agent"
                  onChange={(v) => update("extraPortRequirements.pansSubmitterName", v)}
                />
              </Field>
              <Field label="PANS submitter position" required>
                <TextInput
                  value={form.extraPortRequirements.pansSubmitterPosition}
                  maxLength={20}
                  placeholder="Ship Agent"
                  onChange={(v) => update("extraPortRequirements.pansSubmitterPosition", v)}
                />
              </Field>
              <Field label="Arrival total cargo (MT)">
                <TextInput
                  value={form.extraPortRequirements.arrivalTotalCargoOnBoard}
                  placeholder="38500"
                  onChange={(v) =>
                    update("extraPortRequirements.arrivalTotalCargoOnBoard", v)
                  }
                />
              </Field>
              <Field label="Departure total cargo (MT)">
                <TextInput
                  value={form.extraPortRequirements.departureTotalCargoOnBoard}
                  placeholder="42300"
                  onChange={(v) =>
                    update("extraPortRequirements.departureTotalCargoOnBoard", v)
                  }
                />
              </Field>
              <Field label="Next port of call name">
                <TextInput
                  value={form.extraPortRequirements.nextPortOfCallName}
                  maxLength={255}
                  placeholder="Hong Kong"
                  onChange={(v) => update("extraPortRequirements.nextPortOfCallName", v)}
                />
              </Field>
              <Field label="Other purpose">
                <Select
                  value={form.extraPortRequirements.otherPurpose}
                  onChange={(v) => update("extraPortRequirements.otherPurpose", v)}
                  placeholder="None"
                  options={[
                    { value: "SI", label: "SI — Shipped in as cargo" },
                    { value: "SO", label: "SO — Shipped out as cargo" },
                    { value: "TOW", label: "TOW — Towed by" },
                    { value: "TOU", label: "TOU — Towing" },
                    { value: "RP", label: "RP" },
                  ]}
                />
              </Field>
              {form.extraPortRequirements.otherPurpose === "TOW" ? (
                <Field label="Towed-by vessel" required>
                  <TextInput
                    value={form.extraPortRequirements.otherTowVessel}
                    maxLength={100}
                    placeholder="Tug name"
                    onChange={(v) => update("extraPortRequirements.otherTowVessel", v)}
                  />
                </Field>
              ) : null}
              {form.extraPortRequirements.otherPurpose === "TOU" ? (
                <Field label="Towing vessel" required>
                  <TextInput
                    value={form.extraPortRequirements.otherTouVessel}
                    maxLength={100}
                    placeholder="Tow vessel name"
                    onChange={(v) => update("extraPortRequirements.otherTouVessel", v)}
                  />
                </Field>
              ) : null}
              {["SI", "SO"].includes(form.extraPortRequirements.otherPurpose) ? (
                <Field label="Arrival mother GDV" required>
                  <TextInput
                    value={form.extraPortRequirements.arrivalMotherGdv}
                    maxLength={17}
                    placeholder="Mother GDV number"
                    onChange={(v) => update("extraPortRequirements.arrivalMotherGdv", v)}
                  />
                </Field>
              ) : null}
            </div>
          </div>
        )}

        {stepMeta.id === "review" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              Review the JSON payload below, then submit. Secrets are applied by the server —
              never sent from the browser.
            </p>
            <pre className="max-h-96 overflow-auto rounded-lg border border-slate-700 bg-slate-950 p-4 font-mono text-xs text-emerald-400">
              {JSON.stringify(payloadPreview, null, 2)}
            </pre>
            {submitResult ? (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                <p className="font-medium">Submitted successfully</p>
                <pre className="mt-2 overflow-auto text-xs">
                  {JSON.stringify(submitResult, null, 2)}
                </pre>
              </div>
            ) : null}
            {submitError ? (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                <p className="font-medium">{submitError.message}</p>
                {submitError.upstream ? (
                  <pre className="mt-2 overflow-auto text-xs">
                    {JSON.stringify(submitError.upstream, null, 2)}
                  </pre>
                ) : null}
              </div>
            ) : null}
          </div>
        )}

        {/* Nav buttons */}
        <div className="flex items-center justify-between border-t border-slate-700/60 pt-4">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 ring-1 ring-slate-700 disabled:opacity-40"
          >
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit Port Clearance"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
