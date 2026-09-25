const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_DT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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

function email(v, label) {
  const s = String(v || "").trim();
  if (!s) return `${label} is required`;
  if (s.length > 80) return `${label} must be ≤ 80 characters`;
  if (!EMAIL_RE.test(s)) return `${label} must be a valid email`;
  return null;
}

function isoDt(v, label) {
  const s = String(v || "").trim();
  if (!s) return `${label} is required`;
  if (!ISO_DT_RE.test(s)) return `${label} must be YYYY-MM-DDThh:mm:ssZ`;
  return null;
}

function dateOnly(v, label, required = true) {
  const s = String(v || "").trim();
  if (!s) return required ? `${label} is required` : null;
  if (!DATE_RE.test(s)) return `${label} must be YYYY-MM-DD`;
  return null;
}

function numRange(v, label, { required = true, max, decimals } = {}) {
  const s = String(v ?? "").trim();
  if (!s) return required ? `${label} is required` : null;
  const n = Number(s);
  if (!Number.isFinite(n)) return `${label} must be a number`;
  if (max != null && n > max) return `${label} must be ≤ ${max}`;
  if (decimals != null) {
    const parts = s.split(".");
    if (parts[1] && parts[1].length > decimals) {
      return `${label} allows up to ${decimals} decimal place(s)`;
    }
  }
  return null;
}

function yn(v, label) {
  const s = String(v || "").trim();
  if (!s) return `${label} is required`;
  if (!["Y", "N"].includes(s)) return `${label} must be Y or N`;
  return null;
}

function collect(errs) {
  return errs.filter(Boolean);
}

export const STEPS = [
  { id: "overview", title: "Overview" },
  { id: "agent", title: "Agent at Port" },
  { id: "portCall", title: "Port Call" },
  { id: "ship", title: "Ship" },
  { id: "security", title: "Security Officer" },
  { id: "itinerary", title: "Itinerary" },
  { id: "extra", title: "Extra Requirements" },
  { id: "review", title: "Review & Submit" },
];

export function validateStep(stepId, form) {
  switch (stepId) {
    case "overview":
      return collect([
        form.submitPANS !== "Y" ? 'submitPANS must be "Y"' : null,
        optMax(form.remarks, "Remarks", 511),
        form.arrDepCode && !["A", "D", "C"].includes(form.arrDepCode)
          ? "arrDepCode must be A, D, or C"
          : null,
      ]);
    case "agent": {
      const a = form.agentAtPort;
      return collect([
        req(a.agentName, "Agent name", 96),
        email(a.agentEmail, "Agent email"),
        req(a.agentMobileNumber, "Agent mobile", 15),
        req(a.agentFaxNumber, "Agent fax", 15),
        optMax(a.agentContactName, "Contact name", 70),
        optMax(a.agentLandlineNumber, "Landline", 50),
        optMax(a.agentIdentificationNumber, "Agent ID", 17),
      ]);
    }
    case "portCall": {
      const p = form.portCall;
      const purposes = Array.isArray(p.primaryPurposeOfCallCoded)
        ? p.primaryPurposeOfCallCoded
        : [];
      const errs = collect([
        req(p.cargoBriefDescription, "Cargo description", 150),
        yn(p.dangerousGoodsCarriedIndicator, "Dangerous goods indicator"),
        isoDt(p.eta, "ETA"),
        isoDt(p.etd, "ETD"),
        req(p.portOfArrivalCoded, "Port of arrival code", 9),
        req(p.portFacilityCoded, "Port facility code", 5),
        purposes.length === 0 ? "Select at least one purpose of call" : null,
        purposes.some((c) => !/^[0-7]$/.test(c))
          ? "Purpose codes must be 0–7"
          : null,
        purposes.includes("0")
          ? req(p.miscellaneousPurposeRemarks, "Miscellaneous purpose remarks", 80)
          : optMax(p.miscellaneousPurposeRemarks, "Miscellaneous purpose remarks", 80),
        optMax(p.nameOfMaster, "Name of master", 70),
        optMax(p.securityOtherMattersToReport, "Security other matters", 80),
        numRange(p.numberOfCrew, "Number of crew", { required: false }),
        numRange(p.numberOfPassengers, "Number of passengers", { required: false }),
      ]);
      return errs;
    }
    case "ship": {
      const s = form.ship;
      return collect([
        req(s.shipImoNumber, "IMO number", 10),
        req(s.shipName, "Ship name", 35),
        req(s.shipCallSign, "Call sign", 8),
        req(s.shipFlagStateCoded, "Flag state code", 2),
        numRange(s.shipGrossTonnage, "Gross tonnage"),
        numRange(s.shipSatelliteServiceNumber, "Satellite service number"),
        req(s.shipTypeCoded, "Ship type code", 2),
        req(s.shipCompanyName, "Ship company", 96),
        numRange(s.shipMMSI, "MMSI"),
        numRange(s.airDraft, "Air draft"),
        !["1", "2", "3"].includes(String(s.shipCurrentSecurityLevel))
          ? "Security level must be 1, 2, or 3"
          : null,
        yn(s.validISSCertificate, "Valid ISS certificate"),
        req(s.issuingAuthorityISSCertificate, "ISS issuing authority", 80),
        dateOnly(s.expiryDateISSCertificate, "ISS expiry"),
        yn(s.validCLCCertificate, "Valid CLC certificate"),
        req(s.issuingAuthorityCLCertificate, "CLC issuing authority", 80),
        dateOnly(s.expiryDateCLCertificate, "CLC expiry"),
        yn(s.validBCCCertificate, "Valid BCC certificate"),
        req(s.issuingAuthorityBCCCertificate, "BCC issuing authority", 80),
        dateOnly(s.expiryDateBCCCertificate, "BCC expiry"),
      ]);
    }
    case "security": {
      const o = form.securityOfficer;
      return collect([
        req(o.companySecurityOfficerName, "CSO name", 80),
        req(o.companySecurityOfficerMobileNumber, "CSO mobile", 15),
      ]);
    }
    case "itinerary": {
      const it = form.itinerary;
      const errs = collect([
        optMax(it.lastPortOfCallCoded, "Last port code", 5),
        optMax(it.nextPortOfCallCoded, "Next port code", 5),
        it.previousPortsOfCall.length !== 10
          ? "Exactly 10 previous ports of call are required"
          : null,
        it.shipToShipActivities.length < 1
          ? "At least 1 ship-to-ship activity is required"
          : null,
        it.shipToShipActivities.length > 5
          ? "Maximum 5 ship-to-ship activities"
          : null,
      ]);
      it.previousPortsOfCall.forEach((p, i) => {
        const n = i + 1;
        errs.push(
          ...collect([
            req(p.previousPortOfCallName, `Port ${n} name`, 35),
            req(p.previousPortOfCallCoded, `Port ${n} code`, 5),
            req(p.previousPortFacilityName, `Port ${n} facility`, 30),
            dateOnly(p.previousPortFacilityCallStartDate, `Port ${n} start`),
            dateOnly(p.previousPortFacilityCallEndDate, `Port ${n} end`),
            !["SL1", "SL2", "SL3"].includes(p.shipSecurityLevelInAPreviousPortCoded)
              ? `Port ${n} security level must be SL1/SL2/SL3`
              : null,
            optMax(
              p.shipAdditionalSecurityMeasuresDescription,
              `Port ${n} security measures`,
              80
            ),
          ])
        );
      });
      it.shipToShipActivities.forEach((a, i) => {
        const n = i + 1;
        errs.push(
          ...collect([
            req(a.shipToShipActivity, `STS ${n} activity`, 80),
            dateOnly(a.shipToShipActivityStartDate, `STS ${n} start`),
            dateOnly(a.shipToShipActivityEndDate, `STS ${n} end`),
            req(a.shipToShipActivityLocationName, `STS ${n} location`, 30),
            optMax(a.shipToShipActivityLocationLatitude, `STS ${n} latitude`, 15),
            optMax(a.shipToShipActivityLocationLongitude, `STS ${n} longitude`, 15),
            optMax(a.shipSecurityMeasures, `STS ${n} security measures`, 80),
          ])
        );
      });
      return errs;
    }
    case "extra": {
      const e = form.extraPortRequirements;
      const errs = collect([
        numRange(e.vesselArrivalDraftFwd, "Draft fwd", { max: 99.9, decimals: 1 }),
        numRange(e.vesselArrivalDraftMid, "Draft mid", { max: 99.9, decimals: 1 }),
        numRange(e.vesselArrivalDraftAft, "Draft aft", { max: 99.9, decimals: 1 }),
        email(e.shipEmailAddress, "Ship email"),
        !["N", "S", "E", "W"].includes(e.shipArrivingFrom)
          ? "Arriving from must be N/S/E/W"
          : null,
        yn(e.contractedSecurityPersonnelIndicator, "Contracted security"),
        yn(e.refugeesStowawaysRescuesFromSeaIndicator, "Refugees/stowaways"),
        yn(e.armsAndAmmunitionIndicator, "Arms & ammunition"),
        req(e.armsAndAmmunitionTypeAndQuantity, "Arms type & quantity", 80),
        !["Y", "N", "A"].includes(e.strongRoomIndicator)
          ? "Strong room must be Y, N, or A"
          : null,
        e.strongRoomIndicator === "Y"
          ? req(e.strongRoomLocation, "Strong room location", 40)
          : null,
        !["N", "H", "A", "M", "B"].includes(e.greenShipProgramme)
          ? "Green ship programme is invalid"
          : null,
        yn(e.ibwmcIndicator, "IBWMC indicator"),
        yn(e.bwmsOperationalIndicator, "BWMS operational"),
        req(e.locationOfReportPort, "Report port", 20),
        yn(e.unmannedAircraftInPortIndicator, "Unmanned aircraft"),
        isoDt(e.datetimeOfReport, "Datetime of report"),
        req(e.pansSubmitterName, "PANS submitter name", 35),
        req(e.pansSubmitterPosition, "PANS submitter position", 20),
      ]);

      if (e.sulphurMethodOfCompliance === "E") {
        if (!["O", "C", "H"].includes(e.typeOfScrubber)) {
          errs.push("Scrubber type required when method is E");
        }
        if (e.typeOfScrubber === "O") {
          errs.push(yn(e.sufficientCompliantFuelIndicator, "Sufficient compliant fuel"));
          if (e.sufficientCompliantFuelIndicator === "N") {
            errs.push(yn(e.procurementOfFuelIndicator, "Procurement of fuel"));
          }
        }
      }
      if (e.sulphurMethodOfCompliance === "C") {
        const fuels = Array.isArray(e.typeOfCompliantFuelOil)
          ? e.typeOfCompliantFuelOil
          : [];
        if (fuels.length === 0) errs.push("Compliant fuel type is required");
        if (fuels.includes("0")) errs.push(req(e.otherFuel, "Other fuel", 150));
      }
      if (e.sulphurMethodOfCompliance === "N") {
        errs.push(yn(e.completedFonarIndicator, "Completed FONAR"));
        if (e.completedFonarIndicator === "Y") {
          errs.push(yn(e.disposalOfNonCompliantFuel, "Disposal of non-compliant fuel"));
          if (e.disposalOfNonCompliantFuel === "N") {
            errs.push(yn(e.procureCompliantFuel, "Procure compliant fuel"));
          }
        }
        if (e.completedFonarIndicator === "N") {
          errs.push(yn(e.nonCompliantFuelBDN, "Non-compliant fuel BDN"));
          if (e.nonCompliantFuelBDN === "N") {
            errs.push(req(e.reasonForNoFonarOthers, "Reason for no FONAR", 150));
          }
        }
      }

      if (e.otherPurpose === "TOW") {
        errs.push(req(e.otherTowVessel, "Towed-by vessel", 100));
      }
      if (e.otherPurpose === "TOU") {
        errs.push(req(e.otherTouVessel, "Towing vessel", 100));
      }
      if (e.otherPurpose === "SI" || e.otherPurpose === "SO") {
        errs.push(req(e.arrivalMotherGdv, "Arrival mother GDV", 17));
      }

      return collect(errs);
    }
    case "review":
      return [];
    default:
      return [];
  }
}

export function validateAll(form) {
  const all = {};
  for (const step of STEPS) {
    if (step.id === "review") continue;
    const errs = validateStep(step.id, form);
    if (errs.length) all[step.id] = errs;
  }
  return all;
}
