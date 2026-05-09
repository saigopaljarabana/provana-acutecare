export type ProtocolType = "sepsis" | "stroke" | "pediatric_fever";
export type Severity = "mild" | "moderate" | "severe";

export interface ProtocolArgs {
  protocolType: ProtocolType;
  patientName: string;
  age: number;
  temperature: number;
  bloodPressure: string;
  heartRate: number;
  oxygenSat: number;
  allergies: string[];
  severity: Severity;
  // sepsis
  lactate?: number;
  wbc?: number;
  // stroke
  nihssScore?: number;
  lastKnownWell?: string;
  // pediatric
  weight?: number;
}

export const MOCK_PATIENTS: Record<ProtocolType, Omit<ProtocolArgs, "protocolType">> = {
  sepsis: {
    patientName: "John Doe",
    age: 56,
    temperature: 103.2,
    bloodPressure: "88/60",
    heartRate: 118,
    oxygenSat: 94,
    allergies: ["Penicillin"],
    lactate: 2.8,
    wbc: 18.5,
    severity: "severe",
  },
  stroke: {
    patientName: "Mary Smith",
    age: 72,
    temperature: 98.6,
    bloodPressure: "185/110",
    heartRate: 88,
    oxygenSat: 97,
    allergies: ["Aspirin"],
    nihssScore: 14,
    lastKnownWell: "90 minutes ago",
    severity: "severe",
  },
  pediatric_fever: {
    patientName: "Emma Johnson",
    age: 0.5,
    temperature: 104.1,
    bloodPressure: "90/55",
    heartRate: 155,
    oxygenSat: 98,
    allergies: [],
    weight: 7.5,
    severity: "moderate",
  },
};

export const DEMO_PROMPTS: Record<ProtocolType, string> = {
  sepsis:
    "56-year-old febrile hypotensive patient. Temp 103.2°F, BP 88/60, HR 118. Sepsis alert triggered. Penicillin allergy documented. Lactate 2.8.",
  stroke:
    "72-year-old woman with sudden right-sided weakness and aphasia. Last known well 90 minutes ago. NIHSS 14. BP 185/110. Aspirin allergy.",
  pediatric_fever:
    "6-month-old infant, 7.5 kg, with fever of 104.1°F and heart rate 155. Ill-appearing, no focal source identified.",
};
