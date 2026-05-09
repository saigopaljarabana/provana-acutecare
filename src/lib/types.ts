// Shared contract — governance layer and runtime layer both depend on this.
// Do not restructure without coordinating with the governance layer.

export type ProtocolType = "sepsis_bundle" | "stroke_code" | "pediatric_fever";
export type Severity = "mild" | "moderate" | "severe";
export type AgeGroup = "neonate" | "young_infant" | "infant" | "child" | "adult" | "elderly";

export interface VitalSigns {
  temperatureF: number;
  bloodPressure: string; // "systolic/diastolic"
  heartRate: number;
  oxygenSat: number;
  lactate?: number;
  wbc?: number;
  nihssScore?: number;
  lastKnownWell?: string;
  respiratoryRate?: number;
}

export interface PatientContext {
  id: string;
  name: string;
  ageYears: number;
  weightKg?: number;
  allergies: string[];
  vitals: VitalSigns;
  clinicalNotes?: string;
}

export interface DetectedProtocol {
  type: ProtocolType;
  severity: Severity;
  confidence: "high" | "medium" | "low";
  triggerKeywords: string[];
}

export interface ProtocolRenderProps {
  protocol: DetectedProtocol;
  patient: PatientContext;
  status?: "loading" | "complete";
}

export interface ChecklistItem {
  id: string;
  label: string;
  timeTarget?: string;
  critical?: boolean;
}

export interface TreatmentRecommendation {
  drug: string;
  dose: string;
  route: string;
  note?: string;
  allergyDriven?: boolean;
}
