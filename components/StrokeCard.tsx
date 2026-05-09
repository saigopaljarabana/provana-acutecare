"use client";

import type { ProtocolArgs } from "@/lib/protocols";
import { Vital, PatientBadge, AllergyBadge, Checklist } from "./protocol-ui";

type Props = Partial<ProtocolArgs> & { status?: string };

function parseLknHours(lastKnownWell: string): number | null {
  const m = lastKnownWell.match(/(\d+(?:\.\d+)?)\s*(hour|hr|h|minute|min|m)\b/i);
  if (!m) return null;
  const v = parseFloat(m[1]);
  return /min/i.test(m[2]) ? v / 60 : v;
}

function tpaEligibility(
  lastKnownWell: string,
  nihssScore: number,
  age: number,
  allergies: string[],
  systolic: number
): { eligible: boolean; reason: string } {
  const hours = parseLknHours(lastKnownWell);
  if (hours === null) return { eligible: false, reason: "Last known well time unclear" };
  if (hours > 4.5) return { eligible: false, reason: `${hours.toFixed(1)}h since last known well — outside 4.5h window` };
  if (nihssScore < 4) return { eligible: false, reason: "NIHSS <4 — deficit may be too minor" };
  if (nihssScore > 25) return { eligible: false, reason: "NIHSS >25 — severe deficit, high hemorrhage risk" };
  if (systolic > 185) return { eligible: false, reason: "BP must be <185/110 before tPA — treat hypertension first" };
  if (allergies.map((a) => a.toLowerCase()).includes("alteplase")) {
    return { eligible: false, reason: "Alteplase allergy documented" };
  }
  return { eligible: true, reason: `${hours.toFixed(1)}h since last known well — within window` };
}

export function StrokeCard({
  patientName,
  age = 0,
  temperature,
  bloodPressure = "120/80",
  heartRate,
  oxygenSat,
  nihssScore = 0,
  lastKnownWell = "unknown",
  allergies = [],
  severity = "moderate",
  status,
}: Props) {
  const systolic = parseInt(bloodPressure.split("/")?.[0] ?? "120");
  const { eligible, reason } = tpaEligibility(lastKnownWell, nihssScore, age, allergies, systolic);
  const isLoading = status === "inProgress" || status === "executing";

  const tpaWeight = 70; // would come from patient record in production
  const tpaDose = Math.min(tpaWeight * 0.9, 90).toFixed(0);

  return (
    <div className="rounded-xl border-2 border-purple-500 bg-purple-50 p-4 shadow-lg w-full max-w-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🧠</span>
        <h2 className="text-purple-700 font-bold text-sm">STROKE — Code Stroke Protocol</h2>
        {isLoading && (
          <span className="ml-auto text-xs text-gray-400 animate-pulse">analyzing...</span>
        )}
      </div>

      <PatientBadge name={patientName} age={age} />

      <div className="grid grid-cols-2 gap-2 mb-3">
        <Vital label="NIHSS" value={`${nihssScore}`} alert={nihssScore >= 5} />
        <Vital label="BP" value={bloodPressure} alert={systolic > 180} />
        <Vital label="HR" value={`${heartRate} bpm`} alert={false} />
        <Vital label="SpO₂" value={`${oxygenSat}%`} alert={(oxygenSat ?? 100) < 94} />
      </div>

      <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-2">
        <p className="text-xs text-blue-600 font-semibold uppercase mb-1">Last Known Well</p>
        <p className="text-sm font-bold text-blue-800">{lastKnownWell}</p>
      </div>

      <AllergyBadge allergies={allergies} />

      <div
        className={`rounded-lg p-3 mb-2 border-2 ${
          eligible ? "bg-green-50 border-green-400" : "bg-red-50 border-red-300"
        }`}
      >
        <p className={`text-sm font-bold ${eligible ? "text-green-800" : "text-red-700"}`}>
          {eligible ? "✅ tPA CANDIDATE" : "❌ tPA NOT indicated"}
        </p>
        <p className={`text-xs mt-1 ${eligible ? "text-green-600" : "text-red-500"}`}>{reason}</p>
        {eligible && (
          <p className="text-xs text-green-700 mt-1 font-semibold">
            Alteplase {tpaDose}mg IV (10% bolus + 90% over 60min)
          </p>
        )}
        {systolic > 185 && (
          <p className="text-xs text-orange-700 mt-1">⚠️ Labetalol 10–20mg IV to lower BP before tPA</p>
        )}
      </div>

      {nihssScore >= 6 && (
        <div className="bg-purple-100 border border-purple-300 rounded-lg p-2 mb-2">
          <p className="text-xs font-semibold text-purple-700">
            🔬 Consider mechanical thrombectomy if large vessel occlusion on CTA
          </p>
        </div>
      )}

      <Checklist
        items={[
          "Stat CT head (non-contrast)",
          "CTA head & neck",
          "12-lead ECG",
          "INR, PTT, CBC, BMP",
          "Neurology consult — code stroke",
          "NPO until swallow screen",
        ]}
      />

      <div className="mt-3 text-xs text-gray-400 text-center">AI-generated • Not for clinical use</div>
    </div>
  );
}
