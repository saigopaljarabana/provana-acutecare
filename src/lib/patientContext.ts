import type { PatientContext, ProtocolType } from "./types";

export const MOCK_PATIENTS: Record<ProtocolType, PatientContext> = {
  sepsis_bundle: {
    id: "P-001",
    name: "John Doe",
    ageYears: 56,
    weightKg: 82,
    allergies: ["Penicillin"],
    clinicalNotes: "Sepsis alert triggered. Febrile, hypotensive on arrival.",
    vitals: {
      temperatureF: 103.2,
      bloodPressure: "88/60",
      heartRate: 118,
      oxygenSat: 94,
      lactate: 2.8,
      wbc: 18.5,
      respiratoryRate: 24,
    },
  },
  stroke_code: {
    id: "P-002",
    name: "Mary Smith",
    ageYears: 72,
    weightKg: 65,
    allergies: ["Aspirin"],
    clinicalNotes: "Sudden right-sided weakness and expressive aphasia.",
    vitals: {
      temperatureF: 98.6,
      bloodPressure: "185/110",
      heartRate: 88,
      oxygenSat: 97,
      nihssScore: 14,
      lastKnownWell: "90 minutes ago",
    },
  },
  pediatric_fever: {
    id: "P-003",
    name: "Emma Johnson",
    ageYears: 0.5,
    weightKg: 7.5,
    allergies: [],
    clinicalNotes: "6-month-old infant, ill-appearing, no focal infection source.",
    vitals: {
      temperatureF: 104.1,
      bloodPressure: "90/55",
      heartRate: 155,
      oxygenSat: 98,
      respiratoryRate: 42,
    },
  },
};

export function getPatient(type: ProtocolType): PatientContext {
  return MOCK_PATIENTS[type];
}
