/** Default PANS Submit Port Clearance form (sample values from API docs). */

function emptyPreviousPort(seq) {
  return {
    portOfCallSequenceNumber: seq,
    previousPortOfCallName: "",
    previousPortOfCallCoded: "",
    previousPortFacilityName: "",
    previousPortFacilityCallStartDate: "",
    previousPortFacilityCallEndDate: "",
    shipSecurityLevelInAPreviousPortCoded: "SL1",
    shipAdditionalSecurityMeasuresDescription: "",
  };
}

function emptySts(seq) {
  return {
    shipToShipActivitySequenceNumber: seq,
    shipToShipActivity: "",
    shipToShipActivityStartDate: "",
    shipToShipActivityEndDate: "",
    shipToShipActivityLocationName: "",
    shipToShipActivityLocationLatitude: "",
    shipToShipActivityLocationLongitude: "",
    shipSecurityMeasures: "",
  };
}

const SAMPLE_PREVIOUS_PORTS = [
  {
    portOfCallSequenceNumber: 1,
    previousPortOfCallName: "Laem Chabang",
    previousPortOfCallCoded: "THLCH",
    previousPortFacilityName: "KEPPEL TUAS RFLS PIERW",
    previousPortFacilityCallStartDate: "2026-03-05",
    previousPortFacilityCallEndDate: "2026-03-07",
    shipSecurityLevelInAPreviousPortCoded: "SL1",
    shipAdditionalSecurityMeasuresDescription:
      "Enhanced screening of all persons and baggage at all access points",
  },
  {
    portOfCallSequenceNumber: 2,
    previousPortOfCallName: "Port Klang",
    previousPortOfCallCoded: "MYPKG",
    previousPortFacilityName: "KEPPEL TUAS RFLS PIERW",
    previousPortFacilityCallStartDate: "2026-03-08",
    previousPortFacilityCallEndDate: "2026-03-09",
    shipSecurityLevelInAPreviousPortCoded: "SL1",
    shipAdditionalSecurityMeasuresDescription:
      "Continuous CCTV monitoring with 24/7 security control room",
  },
];

export function createDefaultPansForm() {
  const previousPorts = Array.from({ length: 10 }, (_, i) => {
    const sample = SAMPLE_PREVIOUS_PORTS[i];
    if (sample) return { ...sample };
    return {
      ...emptyPreviousPort(i + 1),
      previousPortOfCallName: `Port ${i + 1}`,
      previousPortOfCallCoded: "XXXXX",
      previousPortFacilityName: "KEPPEL TUAS RFLS PIERW",
      previousPortFacilityCallStartDate: `2026-03-${String(10 + i).padStart(2, "0")}`,
      previousPortFacilityCallEndDate: `2026-03-${String(11 + i).padStart(2, "0")}`,
      shipAdditionalSecurityMeasuresDescription: `Additional Security Measure Desc ${i + 1}`,
    };
  });

  return {
    submitPANS: "Y",
    arrDepCode: "A",
    remarks: "Arrival port call with bunkering and crew change operations",
    agentAtPort: {
      agentName: "Example Maritime Services Pte Ltd",
      agentContactName: "Example Agent",
      agentEmail: "exampleagent@examplemaritime.com.sg",
      agentLandlineNumber: "+6567891234",
      agentMobileNumber: "+6591234567",
      agentFaxNumber: "+6567891235",
      agentIdentificationNumber: "SGPORT-PM-12345",
    },
    portCall: {
      cargoBriefDescription:
        "Mixed cargo including containerised electronics, automotive parts, and refrigerated perishable goods",
      dangerousGoodsCarriedIndicator: "Y",
      eta: "2026-03-10T06:30:00Z",
      etd: "2026-03-13T18:00:00Z",
      nameOfMaster: "Example Captain",
      numberOfCrew: "24",
      numberOfPassengers: "5",
      portOfArrivalCoded: "SGSIN",
      portFacilityCoded: "ACBTH",
      primaryPurposeOfCallCoded: ["1", "3"],
      miscellaneousPurposeRemarks: "",
      securityOtherMattersToReport:
        "Enhanced security measures implemented for dangerous goods handling.",
    },
    ship: {
      shipImoNumber: "9567890",
      shipName: "MV NORDIC VOYAGER",
      shipCallSign: "OJAB2",
      shipFlagStateCoded: "SG",
      shipGrossTonnage: "48750",
      shipSatelliteServiceNumber: "76543210987654",
      shipTypeCoded: "BA",
      shipCompanyName: "Example Shipping Company",
      shipMMSI: "230123456",
      airDraft: "52.3",
      shipCurrentSecurityLevel: "1",
      validISSCertificate: "Y",
      issuingAuthorityISSCertificate: "Finnish Transport and Communications Agency",
      expiryDateISSCertificate: "2027-03-14",
      validCLCCertificate: "N",
      issuingAuthorityCLCertificate: "Lloyd Register",
      expiryDateCLCertificate: "2027-12-31",
      validBCCCertificate: "Y",
      issuingAuthorityBCCCertificate: "Finnish Transport and Communications Agency",
      expiryDateBCCCertificate: "2027-06-30",
    },
    securityOfficer: {
      companySecurityOfficerName: "Example Security Officer",
      companySecurityOfficerMobileNumber: "+358401234567",
    },
    itinerary: {
      lastPortOfCallCoded: "THLCH",
      nextPortOfCallCoded: "HKHKG",
      previousPortsOfCall: previousPorts,
      shipToShipActivities: [
        {
          shipToShipActivitySequenceNumber: 1,
          shipToShipActivity:
            "Bunkering operation - receiving 450 MT of LSFO and 150 MT MGO",
          shipToShipActivityStartDate: "2026-03-11",
          shipToShipActivityEndDate: "2026-03-11",
          shipToShipActivityLocationName: "Western Petroleum",
          shipToShipActivityLocationLatitude: "03 10' N",
          shipToShipActivityLocationLongitude: "104 25' E",
          shipSecurityMeasures: "Security level 1 with dedicated fire watch team",
        },
      ],
    },
    extraPortRequirements: {
      vesselArrivalDraftFwd: "12.5",
      vesselArrivalDraftMid: "12.8",
      vesselArrivalDraftAft: "12.9",
      shipEmailAddress: "test@gmail.com",
      shipArrivingFrom: "W",
      contractedSecurityPersonnelIndicator: "Y",
      refugeesStowawaysRescuesFromSeaIndicator: "N",
      armsAndAmmunitionIndicator: "N",
      armsAndAmmunitionTypeAndQuantity: "None",
      strongRoomIndicator: "Y",
      strongRoomLocation: "Upper Deck, Starboard side, Frame 65",
      greenShipProgramme: "N",
      ibwmcIndicator: "Y",
      bwmsOperationalIndicator: "Y",
      sulphurMethodOfCompliance: "C",
      typeOfScrubber: "",
      sufficientCompliantFuelIndicator: "",
      procurementOfFuelIndicator: "",
      typeOfCompliantFuelOil: ["1", "2"],
      otherFuel: "",
      completedFonarIndicator: "",
      disposalOfNonCompliantFuel: "",
      procureCompliantFuel: "",
      nonCompliantFuelBDN: "",
      reasonForNoFonarOthers: "",
      locationOfReportLat: "03 10' N",
      locationOfReportLong: "104 25' E",
      locationOfReportPort: "SGSIN",
      unmannedAircraftInPortIndicator: "N",
      datetimeOfReport: "2026-03-10T04:00:00Z",
      pansSubmitterName: "Example Agent",
      pansSubmitterPosition: "Ship Agent",
      arrivalTotalCargoOnBoard: "38500",
      departureTotalCargoOnBoard: "42300",
      gtChangeIndicator: "0",
      gradeOfBunkers: "DF",
      bunkerQuantityTaken: "600",
      cstCentistoke: "180",
      departureNameOfMaster: "Example Captain",
      departureNumberOfCrew: "24",
      departureNumberOfPassenger: "5",
      nextPortOfCallNumberOfPerson: "29",
      nextPortOfCallName: "Hong Kong",
      nextPortOfCallOthersReason: "",
      nextPortOfCallOthersLocation: "",
      otherPurpose: "",
      otherTouVessel: "",
      otherTowVessel: "",
      arrivalMotherGdv: "",
      companyUEN: "",
    },
  };
}

export { emptyPreviousPort, emptySts };

/** Convert form state → API JSON (numbers, tilde-joined codes). */
export function buildPansPayload(form) {
  const purposes = Array.isArray(form.portCall.primaryPurposeOfCallCoded)
    ? form.portCall.primaryPurposeOfCallCoded
    : String(form.portCall.primaryPurposeOfCallCoded || "")
        .split("~")
        .filter(Boolean);

  const fuelCodes = Array.isArray(form.extraPortRequirements.typeOfCompliantFuelOil)
    ? form.extraPortRequirements.typeOfCompliantFuelOil
    : String(form.extraPortRequirements.typeOfCompliantFuelOil || "")
        .split("~")
        .filter(Boolean);

  const e = form.extraPortRequirements;
  const num = (v) => {
    if (v === "" || v == null) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const str = (v) => (v == null ? "" : String(v));

  const extra = {
    vesselArrivalDraftFwd: num(e.vesselArrivalDraftFwd),
    vesselArrivalDraftMid: num(e.vesselArrivalDraftMid),
    vesselArrivalDraftAft: num(e.vesselArrivalDraftAft),
    shipEmailAddress: str(e.shipEmailAddress),
    shipArrivingFrom: str(e.shipArrivingFrom),
    contractedSecurityPersonnelIndicator: str(e.contractedSecurityPersonnelIndicator),
    refugeesStowawaysRescuesFromSeaIndicator: str(
      e.refugeesStowawaysRescuesFromSeaIndicator
    ),
    armsAndAmmunitionIndicator: str(e.armsAndAmmunitionIndicator),
    armsAndAmmunitionTypeAndQuantity: str(e.armsAndAmmunitionTypeAndQuantity),
    strongRoomIndicator: str(e.strongRoomIndicator),
    strongRoomLocation: str(e.strongRoomLocation),
    greenShipProgramme: str(e.greenShipProgramme),
    ibwmcIndicator: str(e.ibwmcIndicator),
    bwmsOperationalIndicator: str(e.bwmsOperationalIndicator),
    locationOfReportLat: str(e.locationOfReportLat),
    locationOfReportLong: str(e.locationOfReportLong),
    locationOfReportPort: str(e.locationOfReportPort),
    unmannedAircraftInPortIndicator: str(e.unmannedAircraftInPortIndicator),
    datetimeOfReport: str(e.datetimeOfReport),
    pansSubmitterName: str(e.pansSubmitterName),
    pansSubmitterPosition: str(e.pansSubmitterPosition),
    arrivalTotalCargoOnBoard: num(e.arrivalTotalCargoOnBoard),
    departureTotalCargoOnBoard: num(e.departureTotalCargoOnBoard),
    gtChangeIndicator: num(e.gtChangeIndicator),
    gradeOfBunkers: str(e.gradeOfBunkers),
    bunkerQuantityTaken: num(e.bunkerQuantityTaken),
    cstCentistoke: num(e.cstCentistoke),
    departureNameOfMaster: str(e.departureNameOfMaster),
    departureNumberOfCrew: num(e.departureNumberOfCrew),
    departureNumberOfPassenger: num(e.departureNumberOfPassenger),
    nextPortOfCallNumberOfPerson: num(e.nextPortOfCallNumberOfPerson),
    nextPortOfCallName: str(e.nextPortOfCallName),
    nextPortOfCallOthersReason: str(e.nextPortOfCallOthersReason),
    nextPortOfCallOthersLocation: str(e.nextPortOfCallOthersLocation),
    otherPurpose: str(e.otherPurpose),
    otherTouVessel: str(e.otherTouVessel),
    otherTowVessel: str(e.otherTowVessel),
    arrivalMotherGdv: str(e.arrivalMotherGdv),
    shipyardLocation: [],
    companyUEN: str(e.companyUEN),
  };

  if (e.sulphurMethodOfCompliance) {
    extra.sulphurMethodOfCompliance = str(e.sulphurMethodOfCompliance);
  }
  if (e.sulphurMethodOfCompliance === "E" && e.typeOfScrubber) {
    extra.typeOfScrubber = str(e.typeOfScrubber);
  }
  if (e.typeOfScrubber === "O" && e.sufficientCompliantFuelIndicator) {
    extra.sufficientCompliantFuelIndicator = str(e.sufficientCompliantFuelIndicator);
  }
  if (e.sufficientCompliantFuelIndicator === "N" && e.procurementOfFuelIndicator) {
    extra.procurementOfFuelIndicator = str(e.procurementOfFuelIndicator);
  }
  if (e.sulphurMethodOfCompliance === "C") {
    extra.typeOfCompliantFuelOil = fuelCodes.join("~");
    if (fuelCodes.includes("0")) extra.otherFuel = str(e.otherFuel);
  }
  if (e.sulphurMethodOfCompliance === "N") {
    extra.completedFonarIndicator = str(e.completedFonarIndicator);
    if (e.completedFonarIndicator === "Y") {
      extra.disposalOfNonCompliantFuel = str(e.disposalOfNonCompliantFuel);
      if (e.disposalOfNonCompliantFuel === "N") {
        extra.procureCompliantFuel = str(e.procureCompliantFuel);
      }
    }
    if (e.completedFonarIndicator === "N") {
      extra.nonCompliantFuelBDN = str(e.nonCompliantFuelBDN);
      if (e.nonCompliantFuelBDN === "N") {
        extra.reasonForNoFonarOthers = str(e.reasonForNoFonarOthers);
      }
    }
  }

  return {
    submitPANS: form.submitPANS,
    arrDepCode: form.arrDepCode,
    remarks: form.remarks,
    agentAtPort: { ...form.agentAtPort },
    portCall: {
      ...form.portCall,
      primaryPurposeOfCallCoded: purposes.join("~"),
      numberOfCrew: num(form.portCall.numberOfCrew),
      numberOfPassengers: num(form.portCall.numberOfPassengers),
    },
    ship: {
      ...form.ship,
      shipGrossTonnage: num(form.ship.shipGrossTonnage),
      shipSatelliteServiceNumber: num(form.ship.shipSatelliteServiceNumber),
      shipMMSI: num(form.ship.shipMMSI),
      airDraft: num(form.ship.airDraft),
    },
    securityOfficer: { ...form.securityOfficer },
    itinerary: {
      lastPortOfCallCoded: form.itinerary.lastPortOfCallCoded,
      nextPortOfCallCoded: form.itinerary.nextPortOfCallCoded,
      previousPortsOfCall: form.itinerary.previousPortsOfCall.map((p, i) => ({
        ...p,
        portOfCallSequenceNumber: i + 1,
      })),
      shipToShipActivities: form.itinerary.shipToShipActivities.map((a, i) => ({
        ...a,
        shipToShipActivitySequenceNumber: i + 1,
      })),
    },
    extraPortRequirements: extra,
  };
}
