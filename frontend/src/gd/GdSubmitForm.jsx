import { useMemo, useState } from "react";
import { submitGeneralDeclaration } from "../oceansxApi";
import {
  buildGdPayload,
  createDefaultGdForm,
  emptyPreviousPort,
  emptyPurposeOfCall,
  emptyShipyard,
} from "./defaults";
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

const OTHER_PURPOSE_OPTIONS = [
  { value: "SI", label: "SI — Shipped in as cargo" },
  { value: "SO", label: "SO — Shipped out as cargo" },
  { value: "TOW", label: "TOW — Towed by" },
  { value: "TOU", label: "TOU — Towing" },
  { value: "RP", label: "RP — Recreation/Pleasure" },
  { value: "OT", label: "OT — Others" },
];

const BUNKER_GRADE_OPTIONS = [
  { value: "D", label: "D" },
  { value: "DF", label: "DF" },
  { value: "DFG", label: "DFG" },
];

const inputCls =
  "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const labelCls = "mb-1 block text-xs font-medium text-slate-400";
const errCls = "mt-1 text-xs text-rose-400";

function Field({ label, required, error, children, hint }) {
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

export default function GdSubmitForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(() => createDefaultGdForm());
  const [errors, setErrors] = useState([]);
  const [fieldHints, setFieldHints] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const stepMeta = STEPS[step];
  const payloadPreview = useMemo(() => buildGdPayload(form), [form]);
  const hasBunkerPurpose = (form.extraPortRequirements.purposeOfCall || []).some(
    (p) => p.primaryPurposeOfCallCoded === "3"
  );

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
      const body = buildGdPayload(form);
      const res = await submitGeneralDeclaration(body);
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

  function addPreviousPort() {
    update("itinerary.previousPortsOfCall", [
      ...form.itinerary.previousPortsOfCall,
      emptyPreviousPort(),
    ]);
  }

  function removePreviousPort(idx) {
    update(
      "itinerary.previousPortsOfCall",
      form.itinerary.previousPortsOfCall.filter((_, i) => i !== idx)
    );
  }

  function addPurpose() {
    update("extraPortRequirements.purposeOfCall", [
      ...form.extraPortRequirements.purposeOfCall,
      emptyPurposeOfCall("1"),
    ]);
  }

  function removePurpose(idx) {
    update(
      "extraPortRequirements.purposeOfCall",
      form.extraPortRequirements.purposeOfCall.filter((_, i) => i !== idx)
    );
  }

  function addShipyard(purposeIdx) {
    const list = form.extraPortRequirements.purposeOfCall[purposeIdx].shipyardLocation || [];
    update(`extraPortRequirements.purposeOfCall.${purposeIdx}.shipyardLocation`, [
      ...list,
      emptyShipyard(),
    ]);
  }

  function removeShipyard(purposeIdx, yardIdx) {
    const list = form.extraPortRequirements.purposeOfCall[purposeIdx].shipyardLocation || [];
    update(
      `extraPortRequirements.purposeOfCall.${purposeIdx}.shipyardLocation`,
      list.filter((_, i) => i !== yardIdx)
    );
  }

  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-800/40">
      <div className="border-b border-slate-700/60 px-4 py-4 sm:px-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Submit General Declaration (GD)
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              POST /api/port-clearance-submission/1.0.0/gd-requests · step {step + 1} of{" "}
              {STEPS.length}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setForm(createDefaultGdForm());
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
            <Field label="Arrival / Departure code" required hint="A Arrival · D Departure · C Combined">
              <RadioGroup
                name="arrDepCode"
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
                  placeholder="e.g. Combined GD"
                  onChange={(e) => update("remarks", e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>
        )}

        {stepMeta.id === "ship" && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="IMO number" required hint="Max 7 characters">
              <TextInput
                value={form.ship.shipImoNumber}
                maxLength={7}
                placeholder="9106601"
                onChange={(v) => update("ship.shipImoNumber", v)}
              />
            </Field>
            <Field label="Ship name" required hint="Max 70 characters">
              <TextInput
                value={form.ship.shipName}
                maxLength={70}
                placeholder="CHINA ACT TEST"
                onChange={(v) => update("ship.shipName", v)}
              />
            </Field>
          </div>
        )}

        {stepMeta.id === "agent" && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Agent identification number"
              hint="digitalport / portbase user ID (max 17)"
            >
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
            <Field label="ETA (UTC)" required hint="YYYY-MM-DDThh:mm:ssZ">
              <TextInput
                value={form.portCall.eta}
                placeholder="2026-02-08T06:30:00Z"
                onChange={(v) => update("portCall.eta", v)}
              />
            </Field>
            <Field label="ETD (UTC)" hint="YYYY-MM-DDThh:mm:ssZ">
              <TextInput
                value={form.portCall.etd}
                placeholder="2026-02-11T18:00:00Z"
                onChange={(v) => update("portCall.etd", v)}
              />
            </Field>
            <Field label="Name of master">
              <TextInput
                value={form.portCall.nameOfMaster}
                maxLength={70}
                placeholder="Captain Lars Eriksson"
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
          </div>
        )}

        {stepMeta.id === "itinerary" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Last port of call code" required hint="UN/LOCODE e.g. THBKK">
                <TextInput
                  value={form.itinerary.lastPortOfCallCoded}
                  maxLength={5}
                  placeholder="THBKK"
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
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Previous ports of call</h3>
                <button
                  type="button"
                  onClick={addPreviousPort}
                  className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 ring-1 ring-slate-700 hover:bg-slate-800"
                >
                  Add port
                </button>
              </div>
              <div className="space-y-3">
                {form.itinerary.previousPortsOfCall.map((p, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-3 rounded-lg border border-slate-700/60 p-4 sm:flex-row sm:items-end"
                  >
                    <div className="flex-1">
                      <Field label={`Port name #${i + 1}`}>
                        <TextInput
                          value={p.previousPortOfCallName}
                          maxLength={256}
                          placeholder="Bangkok"
                          onChange={(v) =>
                            update(`itinerary.previousPortsOfCall.${i}.previousPortOfCallName`, v)
                          }
                        />
                      </Field>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePreviousPort(i)}
                      className="rounded-md px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {form.itinerary.previousPortsOfCall.length === 0 ? (
                  <p className="text-xs text-slate-500">No previous ports added (optional).</p>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {stepMeta.id === "purpose" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">
                At least one purpose of call is required. Conditional fields appear based on code.
              </p>
              <button
                type="button"
                onClick={addPurpose}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 ring-1 ring-slate-700 hover:bg-slate-800"
              >
                Add purpose
              </button>
            </div>

            {form.extraPortRequirements.purposeOfCall.map((p, i) => (
              <div
                key={i}
                className="space-y-4 rounded-lg border border-slate-700/60 p-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Purpose #{i + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removePurpose(i)}
                    disabled={form.extraPortRequirements.purposeOfCall.length <= 1}
                    className="rounded-md px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Primary purpose of call" required>
                    <Select
                      value={p.primaryPurposeOfCallCoded}
                      onChange={(v) =>
                        update(
                          `extraPortRequirements.purposeOfCall.${i}.primaryPurposeOfCallCoded`,
                          v
                        )
                      }
                      options={PURPOSE_OPTIONS}
                    />
                  </Field>

                  {p.primaryPurposeOfCallCoded === "0" ? (
                    <>
                      <Field label="Other purpose" required>
                        <Select
                          value={p.otherPurpose}
                          onChange={(v) =>
                            update(`extraPortRequirements.purposeOfCall.${i}.otherPurpose`, v)
                          }
                          placeholder="Select…"
                          options={OTHER_PURPOSE_OPTIONS}
                        />
                      </Field>
                      {p.otherPurpose === "TOW" ? (
                        <Field label="Towed-by vessel" required>
                          <TextInput
                            value={p.otherTowVessel}
                            maxLength={100}
                            placeholder="TUG NEPTUNE IMO 8765432"
                            onChange={(v) =>
                              update(
                                `extraPortRequirements.purposeOfCall.${i}.otherTowVessel`,
                                v
                              )
                            }
                          />
                        </Field>
                      ) : null}
                      {p.otherPurpose === "TOU" ? (
                        <Field label="Towing vessel" required>
                          <TextInput
                            value={p.otherTouVessel}
                            maxLength={100}
                            placeholder="Tug name"
                            onChange={(v) =>
                              update(
                                `extraPortRequirements.purposeOfCall.${i}.otherTouVessel`,
                                v
                              )
                            }
                          />
                        </Field>
                      ) : null}
                      {p.otherPurpose === "SI" || p.otherPurpose === "SO" ? (
                        <Field label="Arrival mother GDV" required>
                          <TextInput
                            value={p.arrivalMotherGdv}
                            maxLength={17}
                            placeholder="Mother vessel GDV"
                            onChange={(v) =>
                              update(
                                `extraPortRequirements.purposeOfCall.${i}.arrivalMotherGdv`,
                                v
                              )
                            }
                          />
                        </Field>
                      ) : null}
                    </>
                  ) : null}
                </div>

                {p.primaryPurposeOfCallCoded === "6" ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Shipyard locations
                      </h4>
                      <button
                        type="button"
                        onClick={() => addShipyard(i)}
                        className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 ring-1 ring-slate-700 hover:bg-slate-800"
                      >
                        Add yard
                      </button>
                    </div>
                    {(p.shipyardLocation || []).map((y, yi) => (
                      <div
                        key={yi}
                        className="grid gap-3 rounded-lg border border-slate-800 bg-slate-900/40 p-3 md:grid-cols-2"
                      >
                        <Field label="Shipyard location code">
                          <TextInput
                            value={y.shipyardLocationCode}
                            maxLength={5}
                            placeholder="SGSIN"
                            onChange={(v) =>
                              update(
                                `extraPortRequirements.purposeOfCall.${i}.shipyardLocation.${yi}.shipyardLocationCode`,
                                v
                              )
                            }
                          />
                        </Field>
                        <Field label="Shipyard location description">
                          <TextInput
                            value={y.shipyardLocation}
                            maxLength={40}
                            placeholder="Sembcorp Marine Admiralty Yard"
                            onChange={(v) =>
                              update(
                                `extraPortRequirements.purposeOfCall.${i}.shipyardLocation.${yi}.shipyardLocation`,
                                v
                              )
                            }
                          />
                        </Field>
                        <div className="md:col-span-2">
                          <button
                            type="button"
                            onClick={() => removeShipyard(i, yi)}
                            className="text-xs text-rose-400 hover:underline"
                          >
                            Remove yard
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {stepMeta.id === "extra" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Location on arrival name">
                <TextInput
                  value={form.extraPortRequirements.locationOnArrivalName}
                  maxLength={50}
                  placeholder="TPT BERTH 1"
                  onChange={(v) => update("extraPortRequirements.locationOnArrivalName", v)}
                />
              </Field>
              <Field label="Location on arrival code">
                <TextInput
                  value={form.extraPortRequirements.locationOnArrivalCode}
                  maxLength={10}
                  placeholder="T01"
                  onChange={(v) => update("extraPortRequirements.locationOnArrivalCode", v)}
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
              <Field label="Departure name of master">
                <TextInput
                  value={form.extraPortRequirements.departureNameOfMaster}
                  maxLength={70}
                  placeholder="Captain Lars Eriksson"
                  onChange={(v) => update("extraPortRequirements.departureNameOfMaster", v)}
                />
              </Field>
              <Field label="Departure number of crew">
                <TextInput
                  value={form.extraPortRequirements.departureNumberOfCrew}
                  placeholder="23"
                  onChange={(v) => update("extraPortRequirements.departureNumberOfCrew", v)}
                />
              </Field>
              <Field label="Departure number of passengers">
                <TextInput
                  value={form.extraPortRequirements.departureNumberOfPassenger}
                  placeholder="4"
                  onChange={(v) =>
                    update("extraPortRequirements.departureNumberOfPassenger", v)
                  }
                />
              </Field>
              <Field label="Next port number of persons">
                <TextInput
                  value={form.extraPortRequirements.nextPortOfCallNumberOfPerson}
                  placeholder="27"
                  onChange={(v) =>
                    update("extraPortRequirements.nextPortOfCallNumberOfPerson", v)
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
              <Field label="Next port others reason">
                <TextInput
                  value={form.extraPortRequirements.nextPortOfCallOthersReason}
                  maxLength={255}
                  placeholder="Optional reason"
                  onChange={(v) =>
                    update("extraPortRequirements.nextPortOfCallOthersReason", v)
                  }
                />
              </Field>
              <Field label="Next port others location">
                <TextInput
                  value={form.extraPortRequirements.nextPortOfCallOthersLocation}
                  maxLength={255}
                  placeholder="Optional location"
                  onChange={(v) =>
                    update("extraPortRequirements.nextPortOfCallOthersLocation", v)
                  }
                />
              </Field>
              <Field label="Company UEN" hint="Singapore company UEN only">
                <TextInput
                  value={form.extraPortRequirements.companyUEN}
                  maxLength={10}
                  placeholder="199801234K"
                  onChange={(v) => update("extraPortRequirements.companyUEN", v)}
                />
              </Field>
              <Field label="Datetime of report (UTC)" hint="YYYY-MM-DDThh:mm:ssZ">
                <TextInput
                  value={form.extraPortRequirements.datetimeOfReport}
                  placeholder="2026-02-08T04:00:00Z"
                  onChange={(v) => update("extraPortRequirements.datetimeOfReport", v)}
                />
              </Field>
              <Field label="CST centistoke">
                <TextInput
                  value={form.extraPortRequirements.cstCentistoke}
                  placeholder="180"
                  onChange={(v) => update("extraPortRequirements.cstCentistoke", v)}
                />
              </Field>
            </div>

            {hasBunkerPurpose ? (
              <div className="rounded-lg border border-slate-700/60 p-4">
                <h3 className="mb-3 text-sm font-semibold text-white">
                  Bunker details (required when purpose includes 3)
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Grade of bunkers" required hint="D, DF, or DFG">
                    <Select
                      value={form.extraPortRequirements.gradeOfBunkers}
                      onChange={(v) => update("extraPortRequirements.gradeOfBunkers", v)}
                      placeholder="Select…"
                      options={BUNKER_GRADE_OPTIONS}
                    />
                  </Field>
                  <Field label="Bunker quantity taken" required>
                    <TextInput
                      value={form.extraPortRequirements.bunkerQuantityTaken}
                      placeholder="600"
                      onChange={(v) =>
                        update("extraPortRequirements.bunkerQuantityTaken", v)
                      }
                    />
                  </Field>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Bunker grade / quantity fields appear when a purpose of call is &quot;3 — Taking
                Bunkers&quot;.
              </p>
            )}
          </div>
        )}

        {stepMeta.id === "review" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              Review the JSON payload below, then submit. Upstream returns HTTP 201 with a
              submission ID (also in the Location header).
            </p>
            <pre className="max-h-96 overflow-auto rounded-lg border border-slate-700 bg-slate-950 p-4 font-mono text-xs text-emerald-400">
              {JSON.stringify(payloadPreview, null, 2)}
            </pre>
            {submitResult ? (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                <p className="font-medium">Submitted successfully</p>
                {submitResult.location ? (
                  <p className="mt-1 font-mono text-xs">Location: {submitResult.location}</p>
                ) : null}
                <pre className="mt-2 max-h-48 overflow-auto font-mono text-xs text-emerald-200">
                  {JSON.stringify(submitResult.data, null, 2)}
                </pre>
              </div>
            ) : null}
            {submitError ? (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                <p className="font-medium">{submitError.message}</p>
                {submitError.upstream ? (
                  <pre className="mt-2 max-h-48 overflow-auto font-mono text-xs text-rose-200">
                    {JSON.stringify(submitError.upstream, null, 2)}
                  </pre>
                ) : null}
              </div>
            ) : null}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-700/60 pt-4">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 ring-1 ring-slate-700 hover:bg-slate-800 disabled:opacity-40"
          >
            Back
          </button>
          <div className="flex gap-2">
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
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Submit General Declaration"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
