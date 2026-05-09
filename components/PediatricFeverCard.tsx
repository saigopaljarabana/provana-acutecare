"use client";

import type { ProtocolArgs } from "@/lib/protocols";
import { Vital, AllergyBadge, Checklist } from "./protocol-ui";

type Props = Partial<ProtocolArgs> & { status?: string };

type AgeGroup = "neonate" | "young_infant" | "infant" | "child";

function getAgeGroup(ageYears: number): AgeGroup {
  if (ageYears < 0.083) return "neonate";       // < 1 month
  if (ageYears < 0.25) return "young_infant";   // 1–3 months
  if (ageYears < 1) return "infant";            // 3–12 months
  return "child";
}

function getUrgency(ageGroup: AgeGroup, temp: number): "critical" | "high" | "moderate" {
  if (ageGroup === "neonate" || ageGroup === "young_infant") return "critical";
  if (temp >= 104) return "high";
  return "moderate";
}

function getEmpiricalTreatment(
  ageGroup: AgeGroup,
  weight: number,
  allergies: string[]
): { drug: string; dose?: string; note?: string } {
  const lower = allergies.map((a) => a.toLowerCase());
  if (ageGroup === "neonate" || ageGroup === "young_infant") {
    return {
      drug: "Ampicillin + Gentamicin IV",
      dose: weight
        ? `Amp ${(weight * 50).toFixed(0)}mg IV q6h / Gent ${(weight * 4).toFixed(1)}mg IV q24h`
        : undefined,
      note: "Full sepsis evaluation required before antibiotics",
    };
  }
  if (lower.includes("cephalosporin")) {
    return { drug: "Azithromycin 10mg/kg IV (max 500mg)", note: "Cephalosporin allergy" };
  }
  return {
    drug: "Ceftriaxone 50mg/kg IV (max 2g)",
    dose: weight ? `Dose: ${Math.min(weight * 50, 2000).toFixed(0)}mg IV` : undefined,
    note: "If bacterial source suspected",
  };
}

const URGENCY_STYLES = {
  critical: { border: "border-red-600", bg: "bg-red-50", text: "text-red-700" },
  high: { border: "border-orange-500", bg: "bg-orange-50", text: "text-orange-700" },
  moderate: { border: "border-yellow-500", bg: "bg-yellow-50", text: "text-yellow-700" },
};

export function PediatricFeverCard({
  patientName,
  age = 0,
  temperature = 98.6,
  bloodPressure = "90/55",
  heartRate,
  oxygenSat,
  weight,
  allergies = [],
  severity = "moderate",
  status,
}: Props) {
  const ageGroup = getAgeGroup(age);
  const urgency = getUrgency(ageGroup, temperature);
  const { drug, dose, note } = getEmpiricalTreatment(ageGroup, weight ?? 10, allergies);
  const ageMonths = Math.round(age * 12);
  const isLoading = status === "inProgress" || status === "executing";
  const styles = URGENCY_STYLES[urgency];

  const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
    neonate: "Neonate (<1mo)",
    young_infant: "Young Infant (1–3mo)",
    infant: "Infant (3–12mo)",
    child: "Child (>12mo)",
  };

  const checklist: string[] =
    ageGroup === "neonate" || ageGroup === "young_infant"
      ? [
          "Lumbar puncture (CSF Cx, cell count, glucose)",
          "Blood culture ×2",
          "Urinalysis + urine culture",
          "CBC, BMP, CRP, procalcitonin",
          "Chest X-ray",
          "Admit for IV antibiotics + observation",
        ]
      : [
          "Urinalysis + urine culture",
          "Blood culture if ill-appearing",
          "CBC, CRP",
          "Identify fever source before antibiotics",
          "Acetaminophen 15mg/kg q4-6h",
          weight ? `Ibuprofen ${(weight * 10).toFixed(0)}mg q6-8h (if >6mo)` : "Ibuprofen 10mg/kg q6-8h (if >6mo)",
        ];

  return (
    <div className={`rounded-xl border-2 ${styles.border} ${styles.bg} p-4 shadow-lg w-full max-w-sm`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🌡️</span>
        <h2 className={`font-bold text-sm ${styles.text}`}>
          PEDIATRIC FEVER — {urgency.toUpperCase()}
        </h2>
        {isLoading && (
          <span className="ml-auto text-xs text-gray-400 animate-pulse">analyzing...</span>
        )}
      </div>

      <div className="mb-3 bg-white rounded-lg p-3 border border-gray-200">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Patient</p>
        <p className="font-semibold text-gray-800">
          {patientName ?? "Unknown"}, {ageMonths}mo
        </p>
        <div className="flex gap-3 mt-1">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles.bg} ${styles.text} border ${styles.border}`}>
            {AGE_GROUP_LABELS[ageGroup]}
          </span>
          {weight && <span className="text-xs text-gray-500">{weight} kg</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <Vital label="Temp" value={`${temperature}°F`} alert={temperature > 100.4} />
        <Vital label="HR" value={`${heartRate} bpm`} alert={(heartRate ?? 0) > 150} />
        <Vital label="BP" value={bloodPressure} alert={false} />
        <Vital label="SpO₂" value={`${oxygenSat}%`} alert={(oxygenSat ?? 100) < 95} />
      </div>

      <AllergyBadge allergies={allergies} />

      {(ageGroup === "neonate" || ageGroup === "young_infant") && (
        <div className="mb-2 bg-red-100 border-2 border-red-500 rounded-lg p-2">
          <p className="text-xs font-bold text-red-700">⚠️ HIGH-RISK AGE — Full workup required</p>
          <p className="text-xs text-red-600 mt-1">Do NOT defer antibiotics &gt;1h after cultures</p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-2">
        <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Empiric Antibiotic</p>
        <p className="text-sm font-bold text-gray-800">{drug}</p>
        {dose && <p className="text-xs text-gray-600 mt-1">{dose}</p>}
        {note && <p className="text-xs text-gray-400 mt-1">{note}</p>}
      </div>

      <Checklist items={checklist} />

      <div className="mt-3 text-xs text-gray-400 text-center">AI-generated • Not for clinical use</div>
    </div>
  );
}
