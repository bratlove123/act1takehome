/** Default General Declaration (GD) form — sample values from API docs. */

export function emptyShipyard() {
  return {
    shipyardLocationCode: "",
    shipyardLocation: "",
  };
}

export function emptyPurposeOfCall(code = "1") {
  return {
    primaryPurposeOfCallCoded: code,
    otherPurpose: "",
    otherTouVessel: "",
    otherTowVessel: "",
    arrivalMotherGdv: "",
    shipyardLocation: [],
  };
}

export function emptyPreviousPort() {
  return { previousPortOfCallName: "" };
}

export function createDefaultGdForm() {
  return {
    arrDepCode: "C",
    remarks: "Combined GD",
    agentAtPort: {
      agentIdentificationNumber: "SGPORT-PM-12345",
    },
    portCall: {
      eta: "2026-02-08T06:30:00Z",
      etd: "2026-02-11T18:00:00Z",
      nameOfMaster: "Captain Lars Eriksson",
      numberOfCrew: "24",
      numberOfPassengers: "5",
    },
    ship: {
      shipImoNumber: "9106601",
      shipName: "CHINA ACT TEST",
    },
    itinerary: {
      lastPortOfCallCoded: "THBKK",
      nextPortOfCallCoded: "HKHKG",
      previousPortsOfCall: [{ previousPortOfCallName: "Bangkok" }],
    },
    extraPortRequirements: {
      locationOnArrivalName: "TPT BERTH 1",
      locationOnArrivalCode: "T01",
      arrivalTotalCargoOnBoard: "38500",
      departureTotalCargoOnBoard: "42300",
      departureNameOfMaster: "Captain Lars Eriksson",
      departureNumberOfCrew: "23",
      departureNumberOfPassenger: "4",
      nextPortOfCallNumberOfPerson: "27",
      nextPortOfCallName: "Hong Kong",
      nextPortOfCallOthersReason: "",
      nextPortOfCallOthersLocation: "",
      companyUEN: "199801234K",
      datetimeOfReport: "2026-02-08T04:00:00Z",
      gradeOfBunkers: "DF",
      bunkerQuantityTaken: "600",
      cstCentistoke: "180",
      purposeOfCall: [
        {
          primaryPurposeOfCallCoded: "0",
          otherPurpose: "TOW",
          otherTouVessel: "",
          otherTowVessel: "TUG NEPTUNE IMO 8765432",
          arrivalMotherGdv: "",
          shipyardLocation: [],
        },
        {
          primaryPurposeOfCallCoded: "3",
          otherPurpose: "",
          otherTouVessel: "",
          otherTowVessel: "",
          arrivalMotherGdv: "",
          shipyardLocation: [],
        },
        {
          primaryPurposeOfCallCoded: "6",
          otherPurpose: "",
          otherTouVessel: "",
          otherTowVessel: "",
          arrivalMotherGdv: "",
          shipyardLocation: [
            {
              shipyardLocationCode: "SGSIN",
              shipyardLocation: "Sembcorp Marine Admiralty Yard",
            },
          ],
        },
      ],
    },
  };
}

function str(v) {
  if (v == null) return "";
  return String(v).trim();
}

function numOrOmit(v) {
  const s = str(v);
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function buildPurposeEntry(p) {
  const code = str(p.primaryPurposeOfCallCoded);
  const entry = { primaryPurposeOfCallCoded: code };

  if (code === "0") {
    const other = str(p.otherPurpose);
    if (other) entry.otherPurpose = other;
    if (other === "TOW" && str(p.otherTowVessel)) {
      entry.otherTowVessel = str(p.otherTowVessel);
    }
    if (other === "TOU" && str(p.otherTouVessel)) {
      entry.otherTouVessel = str(p.otherTouVessel);
    }
    if ((other === "SI" || other === "SO") && str(p.arrivalMotherGdv)) {
      entry.arrivalMotherGdv = str(p.arrivalMotherGdv);
    }
  }

  if (code === "6") {
    const yards = (p.shipyardLocation || [])
      .map((y) => {
        const loc = {};
        if (str(y.shipyardLocationCode)) loc.shipyardLocationCode = str(y.shipyardLocationCode);
        if (str(y.shipyardLocation)) loc.shipyardLocation = str(y.shipyardLocation);
        return Object.keys(loc).length ? loc : null;
      })
      .filter(Boolean);
    if (yards.length) entry.shipyardLocation = yards;
  }

  return entry;
}

/** Build API payload: coerce numbers, drop empty optional strings. */
export function buildGdPayload(form) {
  const e = form.extraPortRequirements;
  const hasBunkerPurpose = (e.purposeOfCall || []).some(
    (p) => str(p.primaryPurposeOfCallCoded) === "3"
  );

  const extra = {
    purposeOfCall: (e.purposeOfCall || []).map(buildPurposeEntry),
  };

  const optStr = (key, max) => {
    const v = str(e[key]);
    if (v) extra[key] = max ? v.slice(0, max) : v;
  };
  const optNum = (key) => {
    const n = numOrOmit(e[key]);
    if (n !== undefined) extra[key] = n;
  };

  optStr("locationOnArrivalName", 50);
  optStr("locationOnArrivalCode", 10);
  optNum("arrivalTotalCargoOnBoard");
  optNum("departureTotalCargoOnBoard");
  optStr("departureNameOfMaster", 70);
  optNum("departureNumberOfCrew");
  optNum("departureNumberOfPassenger");
  optNum("nextPortOfCallNumberOfPerson");
  optStr("nextPortOfCallName", 255);
  optStr("nextPortOfCallOthersReason", 255);
  optStr("nextPortOfCallOthersLocation", 255);
  optStr("companyUEN", 10);
  optStr("datetimeOfReport");
  optNum("cstCentistoke");

  if (hasBunkerPurpose) {
    if (str(e.gradeOfBunkers)) extra.gradeOfBunkers = str(e.gradeOfBunkers).slice(0, 3);
    const qty = numOrOmit(e.bunkerQuantityTaken);
    if (qty !== undefined) extra.bunkerQuantityTaken = qty;
  }

  const agentId = str(form.agentAtPort?.agentIdentificationNumber);
  const previousPorts = (form.itinerary.previousPortsOfCall || [])
    .map((p) => {
      const name = str(p.previousPortOfCallName);
      return name ? { previousPortOfCallName: name.slice(0, 256) } : null;
    })
    .filter(Boolean);

  const payload = {
    arrDepCode: str(form.arrDepCode),
    ship: {
      shipImoNumber: str(form.ship.shipImoNumber),
      shipName: str(form.ship.shipName),
    },
    portCall: {
      eta: str(form.portCall.eta),
    },
    itinerary: {
      lastPortOfCallCoded: str(form.itinerary.lastPortOfCallCoded),
    },
    extraPortRequirements: extra,
  };

  const remarks = str(form.remarks);
  if (remarks) payload.remarks = remarks.slice(0, 511);

  if (agentId) {
    payload.agentAtPort = { agentIdentificationNumber: agentId.slice(0, 17) };
  }

  if (str(form.portCall.etd)) payload.portCall.etd = str(form.portCall.etd);
  if (str(form.portCall.nameOfMaster)) {
    payload.portCall.nameOfMaster = str(form.portCall.nameOfMaster).slice(0, 70);
  }
  const crew = numOrOmit(form.portCall.numberOfCrew);
  if (crew !== undefined) payload.portCall.numberOfCrew = crew;
  const pax = numOrOmit(form.portCall.numberOfPassengers);
  if (pax !== undefined) payload.portCall.numberOfPassengers = pax;

  if (str(form.itinerary.nextPortOfCallCoded)) {
    payload.itinerary.nextPortOfCallCoded = str(form.itinerary.nextPortOfCallCoded);
  }
  if (previousPorts.length) payload.itinerary.previousPortsOfCall = previousPorts;

  return payload;
}
