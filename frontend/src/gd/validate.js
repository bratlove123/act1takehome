const ISO_DT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

function req(v, label, max) {
  const s = v == null ? "" : String(v).trim();
  if (!s) return `${label} is required`;
  if (max && s.length > max) return `${label} must be ≤ ${max} characters`;
  return null;
}

function optMax(v, label, max) {
  const s = v == null ? "" : String(v).trim();
  if (s && max && s.length > max) return `${label} must be ≤ ${max} characters`;
  return null;
}

function isoDt(v, label, required = true) {
  const s = String(v || "").trim();
  if (!s) return required ? `${label} is required` : null;
  if (!ISO_DT_RE.test(s)) return `${label} must be YYYY-MM-DDThh:mm:ssZ`;
  return null;
}

function numRange(v, label, { required = true, max } = {}) {
  const s = String(v ?? "").trim();
  if (!s) return required ? `${label} is required` : null;
  const n = Number(s);
  if (!Number.isFinite(n)) return `${label} must be a number`;
  if (max != null && n > max) return `${label} must be ≤ ${max}`;
  return null;
}

function collect(errs) {
  return errs.filter(Boolean);
}

export const STEPS = [
  { id: "overview", title: "Overview" },
  { id: "ship", title: "Ship" },
  { id: "agent", title: "Agent" },
  { id: "portCall", title: "Port Call" },
  { id: "itinerary", title: "Itinerary" },
  { id: "purpose", title: "Purpose of Call" },
  { id: "extra", title: "Extra Requirements" },
  { id: "review", title: "Review & Submit" },
];

const PURPOSE_CODES = ["0", "1", "2", "3", "4", "5", "6", "7"];
const OTHER_PURPOSE = ["SI", "SO", "TOW", "TOU", "RP", "OT"];

function validatePurposeEntry(p, index) {
  const label = `Purpose #${index + 1}`;
  const errs = [];
  const code = String(p.primaryPurposeOfCallCoded || "").trim();
  if (!PURPOSE_CODES.includes(code)) {
    errs.push(`${label}: primary purpose code is required (0–7)`);
    return errs;
  }
  if (code === "0") {
    const other = String(p.otherPurpose || "").trim();
    if (!OTHER_PURPOSE.includes(other)) {
      errs.push(`${label}: otherPurpose is required when purpose is 0`);
    } else {
      if (other === "TOW") {
        errs.push(req(p.otherTowVessel, `${label} otherTowVessel`, 100));
      }
      if (other === "TOU") {
        errs.push(req(p.otherTouVessel, `${label} otherTouVessel`, 100));
      }
      if (other === "SI" || other === "SO") {
        errs.push(req(p.arrivalMotherGdv, `${label} arrivalMotherGdv`, 17));
      }
    }
  }
  if (code === "6") {
    const yards = p.shipyardLocation || [];
    if (!yards.length) {
      errs.push(`${label}: at least one shipyard location is required for purpose 6`);
    } else {
      yards.forEach((y, yi) => {
        errs.push(
          optMax(y.shipyardLocationCode, `${label} yard #${yi + 1} code`, 5),
          optMax(y.shipyardLocation, `${label} yard #${yi + 1} description`, 40)
        );
        if (
          !String(y.shipyardLocationCode || "").trim() &&
          !String(y.shipyardLocation || "").trim()
        ) {
          errs.push(`${label} yard #${yi + 1}: enter code or description`);
        }
      });
    }
  }
  return collect(errs);
}

export function validateStep(stepId, form) {
  switch (stepId) {
    case "overview":
      return collect([
        !["A", "D", "C"].includes(String(form.arrDepCode || "").trim())
          ? "arrDepCode must be A, D, or C"
          : null,
        optMax(form.remarks, "Remarks", 511),
      ]);
    case "ship":
      return collect([
        req(form.ship.shipImoNumber, "IMO number", 7),
        req(form.ship.shipName, "Ship name", 70),
      ]);
    case "agent":
      return collect([
        optMax(
          form.agentAtPort.agentIdentificationNumber,
          "Agent identification number",
          17
        ),
      ]);
    case "portCall":
      return collect([
        isoDt(form.portCall.eta, "ETA"),
        isoDt(form.portCall.etd, "ETD", false),
        optMax(form.portCall.nameOfMaster, "Name of master", 70),
        numRange(form.portCall.numberOfCrew, "Number of crew", {
          required: false,
          max: 9999,
        }),
        numRange(form.portCall.numberOfPassengers, "Number of passengers", {
          required: false,
          max: 99999999,
        }),
      ]);
    case "itinerary": {
      const errs = collect([
        req(form.itinerary.lastPortOfCallCoded, "Last port of call code", 5),
        optMax(form.itinerary.nextPortOfCallCoded, "Next port of call code", 5),
      ]);
      (form.itinerary.previousPortsOfCall || []).forEach((p, i) => {
        errs.push(
          ...collect([
            optMax(p.previousPortOfCallName, `Previous port #${i + 1} name`, 256),
          ])
        );
      });
      return errs;
    }
    case "purpose": {
      const list = form.extraPortRequirements.purposeOfCall || [];
      if (!list.length) return ["At least one purpose of call is required"];
      return list.flatMap((p, i) => validatePurposeEntry(p, i));
    }
    case "extra": {
      const e = form.extraPortRequirements;
      const hasBunker = (e.purposeOfCall || []).some(
        (p) => String(p.primaryPurposeOfCallCoded || "").trim() === "3"
      );
      const errs = collect([
        optMax(e.locationOnArrivalName, "Location on arrival name", 50),
        optMax(e.locationOnArrivalCode, "Location on arrival code", 10),
        numRange(e.arrivalTotalCargoOnBoard, "Arrival total cargo", {
          required: false,
          max: 99999999,
        }),
        numRange(e.departureTotalCargoOnBoard, "Departure total cargo", {
          required: false,
          max: 99999999,
        }),
        optMax(e.departureNameOfMaster, "Departure name of master", 70),
        numRange(e.departureNumberOfCrew, "Departure number of crew", {
          required: false,
          max: 9999,
        }),
        numRange(e.departureNumberOfPassenger, "Departure number of passengers", {
          required: false,
          max: 99999999,
        }),
        numRange(e.nextPortOfCallNumberOfPerson, "Next port number of persons", {
          required: false,
          max: 99999999,
        }),
        optMax(e.nextPortOfCallName, "Next port of call name", 255),
        optMax(e.nextPortOfCallOthersReason, "Next port others reason", 255),
        optMax(e.nextPortOfCallOthersLocation, "Next port others location", 255),
        optMax(e.companyUEN, "Company UEN", 10),
        isoDt(e.datetimeOfReport, "Datetime of report", false),
        numRange(e.cstCentistoke, "CST centistoke", { required: false }),
      ]);
      if (hasBunker) {
        errs.push(
          ...collect([
            req(e.gradeOfBunkers, "Grade of bunkers", 3),
            numRange(e.bunkerQuantityTaken, "Bunker quantity taken", {
              required: true,
              max: 999,
            }),
          ])
        );
      }
      return errs;
    }
    case "review":
      return [];
    default:
      return [];
  }
}

export function validateAll(form) {
  const out = {};
  for (const s of STEPS) {
    if (s.id === "review") continue;
    const errs = validateStep(s.id, form);
    if (errs.length) out[s.id] = errs;
  }
  return out;
}
