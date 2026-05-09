"use client";

interface SepsisAlertCardProps {
  patientName?: string;
  age?: number;
  temperature?: number;
  bloodPressure?: string;
  heartRate?: number;
  oxygenSat?: number;
  lactate?: number;
  allergies?: string[];
  recommendedAntibiotic?: string;
  status?: "inProgress" | "complete" | "executing";
}

export function SepsisAlertCard({
  patientName = "John Doe",
  age = 56,
  temperature = 103.2,
  bloodPressure = "88/60",
  heartRate = 118,
  oxygenSat = 94,
  lactate = 2.8,
  allergies = ["Penicillin"],
  recommendedAntibiotic = "Meropenem 1g IV q8h",
  status,
}: SepsisAlertCardProps) {
  const isLoading = status === "inProgress" || status === "executing";

  return (
    <div className="rounded-xl border-2 border-red-500 bg-red-50 p-4 shadow-lg w-full max-w-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-red-600 text-xl">🚨</span>
        <h2 className="text-red-700 font-bold text-base">SEPSIS ALERT — SEP-1 Protocol</h2>
        {isLoading && (
          <span className="ml-auto text-xs text-gray-400 animate-pulse">analyzing...</span>
        )}
      </div>

      <div className="mb-3 bg-white rounded-lg p-3 border border-red-200">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Patient</p>
        <p className="font-semibold text-gray-800">{patientName}, {age}y</p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <Vital label="Temp" value={`${temperature}°F`} alert={temperature > 101} />
        <Vital label="BP" value={bloodPressure} alert={true} />
        <Vital label="HR" value={`${heartRate} bpm`} alert={heartRate > 100} />
        <Vital label="SpO₂" value={`${oxygenSat}%`} alert={oxygenSat < 95} />
        <Vital label="Lactate" value={`${lactate} mmol/L`} alert={lactate > 2} />
      </div>

      {allergies.length > 0 && (
        <div className="mb-3 bg-yellow-50 border border-yellow-300 rounded-lg p-2">
          <p className="text-xs font-semibold text-yellow-700">⚠️ ALLERGIES: {allergies.join(", ")}</p>
        </div>
      )}

      <div className="bg-green-50 border border-green-300 rounded-lg p-3">
        <p className="text-xs font-semibold text-green-700 uppercase mb-1">Recommended Antibiotic</p>
        <p className="text-sm font-bold text-green-800">{recommendedAntibiotic}</p>
      </div>

      <div className="mt-3 text-xs text-gray-400 text-center">
        AI-generated • Not for clinical decision making
      </div>
    </div>
  );
}

function Vital({ label, value, alert }: { label: string; value: string; alert: boolean }) {
  return (
    <div className={`rounded p-2 text-center ${alert ? "bg-red-100 border border-red-300" : "bg-white border border-gray-200"}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`font-bold text-sm ${alert ? "text-red-700" : "text-gray-700"}`}>{value}</p>
    </div>
  );
}
