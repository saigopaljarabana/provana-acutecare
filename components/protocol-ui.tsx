"use client";

export function Vital({ label, value, alert }: { label: string; value: string; alert: boolean }) {
  return (
    <div
      className={`rounded p-2 text-center ${alert ? "bg-red-100 border border-red-300" : "bg-white border border-gray-200"}`}
    >
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`font-bold text-sm ${alert ? "text-red-700" : "text-gray-700"}`}>{value}</p>
    </div>
  );
}

export function PatientBadge({ name, age, ageSuffix }: { name?: string; age?: number; ageSuffix?: string }) {
  return (
    <div className="mb-3 bg-white rounded-lg p-3 border border-gray-200">
      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Patient</p>
      <p className="font-semibold text-gray-800">
        {name ?? "Unknown"}, {age !== undefined ? `${age}${ageSuffix ?? "y"}` : "—"}
      </p>
    </div>
  );
}

export function AllergyBadge({ allergies }: { allergies: string[] }) {
  if (!allergies.length) return null;
  return (
    <div className="mb-3 bg-yellow-50 border border-yellow-300 rounded-lg p-2">
      <p className="text-xs font-semibold text-yellow-700">⚠️ ALLERGIES: {allergies.join(", ")}</p>
    </div>
  );
}

export function Checklist({ items }: { items: string[] }) {
  return (
    <div className="mt-3 border border-gray-200 rounded-lg p-3 bg-white">
      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Protocol Checklist</p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2 text-xs text-gray-700">
            <span className="text-gray-400">☐</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
