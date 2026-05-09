"use client";

import type { ProtocolArgs } from "@/lib/protocols";
import { Vital, PatientBadge, AllergyBadge, Checklist } from "./protocol-ui";

type Props = Partial<ProtocolArgs> & { status?: string };

function getAntibiotic(allergies: string[]): { drug: string; note?: string } {
  const lower = allergies.map((a) => a.toLowerCase());
  if (lower.includes("penicillin") && lower.includes("carbapenem")) {
    return { drug: "Azithromycin 500mg IV + Vancomycin 25mg/kg IV", note: "PCN + carbapenem allergy" };
  }
  if (lower.includes("penicillin")) {
    return { drug: "Meropenem 1g IV q8h", note: "Penicillin allergy — avoiding beta-lactams" };
  }
  return { drug: "Piperacillin-Tazobactam 4.5g IV q6h" };
}

function needsVasopressors(bp: string, severity: string): boolean {
  const systolic = parseInt(bp?.split("/")?.[0] ?? "120");
  return systolic < 90 || severity === "severe";
}

export function SepsisCard({
  patientName,
  age,
  temperature,
  bloodPressure = "120/80",
  heartRate,
  oxygenSat,
  lactate,
  wbc,
  allergies = [],
  severity = "moderate",
  status,
}: Props) {
  const { drug, note } = getAntibiotic(allergies);
  const vasopressors = needsVasopressors(bloodPressure, severity);
  const isLoading = status === "inProgress" || status === "executing";

  return (
    <div className="rounded-xl border-2 border-red-500 bg-red-50 p-4 shadow-lg w-full max-w-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🚨</span>
        <h2 className="text-red-700 font-bold text-sm">SEPSIS — SEP-1 Protocol</h2>
        {isLoading && (
          <span className="ml-auto text-xs text-gray-400 animate-pulse">analyzing...</span>
        )}
      </div>

      <PatientBadge name={patientName} age={age} />

      <div className="grid grid-cols-2 gap-2 mb-3">
        <Vital label="Temp" value={`${temperature}°F`} alert={(temperature ?? 0) > 101} />
        <Vital label="BP" value={bloodPressure} alert={parseInt(bloodPressure) < 90} />
        <Vital label="HR" value={`${heartRate} bpm`} alert={(heartRate ?? 0) > 100} />
        <Vital label="SpO₂" value={`${oxygenSat}%`} alert={(oxygenSat ?? 100) < 95} />
        {lactate !== undefined && (
          <Vital label="Lactate" value={`${lactate} mmol/L`} alert={lactate > 2} />
        )}
        {wbc !== undefined && (
          <Vital label="WBC" value={`${wbc}k`} alert={wbc > 12 || wbc < 4} />
        )}
      </div>

      <AllergyBadge allergies={allergies} />

      <div className="bg-green-50 border border-green-300 rounded-lg p-3 mb-2">
        <p className="text-xs font-semibold text-green-700 uppercase mb-1">Empiric Antibiotic</p>
        <p className="text-sm font-bold text-green-800">{drug}</p>
        {note && <p className="text-xs text-green-600 mt-1">{note}</p>}
      </div>

      {vasopressors && (
        <div className="bg-orange-50 border border-orange-300 rounded-lg p-2 mb-2">
          <p className="text-xs font-semibold text-orange-700">
            ⚡ Vasopressor indicated if MAP &lt;65 mmHg
          </p>
          <p className="text-xs text-orange-600">Norepinephrine 0.01–3 mcg/kg/min</p>
        </div>
      )}

      {severity === "severe" && lactate !== undefined && lactate > 4 && (
        <div className="bg-red-100 border border-red-400 rounded-lg p-2 mb-2">
          <p className="text-xs font-bold text-red-700">Critical: Lactate &gt;4 — Septic Shock</p>
        </div>
      )}

      <Checklist
        items={[
          "Blood cultures ×2 before antibiotics",
          "30 mL/kg crystalloid bolus",
          "Lactate repeat in 2h",
          "Urine output monitoring (target ≥0.5 mL/kg/h)",
          "Broad-spectrum antibiotics within 1h",
        ]}
      />

      <div className="mt-3 text-xs text-gray-400 text-center">AI-generated • Not for clinical use</div>
    </div>
  );
}
