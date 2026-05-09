"use client";

interface AllergyMutation {
  allergen: string;
  avoided: string;
  selected: string;
  selectedDose: string;
  route: string;
  reason: string;
}

function computeMutations(allergies: string[]): AllergyMutation[] {
  const lower = allergies.map((a) => a.toLowerCase());
  const mutations: AllergyMutation[] = [];

  if (lower.includes("penicillin")) {
    mutations.push({
      allergen: "Penicillin",
      avoided: "Piperacillin-Tazobactam",
      selected: "Meropenem",
      selectedDose: "1g IV q8h",
      route: "IV",
      reason: "Beta-lactam cross-reactivity risk — carbapenem selected",
    });
  }

  if (lower.includes("carbapenem") || lower.includes("meropenem")) {
    mutations.push({
      allergen: "Carbapenem",
      avoided: "Meropenem / Imipenem",
      selected: "Vancomycin + Aztreonam",
      selectedDose: "25mg/kg IV + 2g IV q6h",
      route: "IV",
      reason: "Full beta-lactam allergy — non-beta-lactam combination",
    } satisfies AllergyMutation);
  }

  if (lower.includes("sulfa") || lower.includes("sulfonamide")) {
    mutations.push({
      allergen: "Sulfonamide",
      avoided: "Trimethoprim-Sulfamethoxazole",
      selected: "Clindamycin",
      selectedDose: "600mg IV q8h",
      route: "IV",
      reason: "Sulfa allergy — alternative Gram-positive coverage",
    } satisfies AllergyMutation);
  }

  return mutations;
}

interface AllergyAlertProps {
  allergies: string[];
  compact?: boolean;
  fdaWarning?: string;
  fdaSource?: boolean;
}

export function AllergyAlert({ allergies, compact = false, fdaWarning, fdaSource }: AllergyAlertProps) {
  if (!allergies.length) return null;

  const mutations = computeMutations(allergies);
  const hasKnownMutations = mutations.length > 0;

  return (
    <div className="space-y-2">
      {/* Allergy flag */}
      <div className="flex items-start gap-2 rounded-lg border-2 border-yellow-400 bg-yellow-50 px-3 py-2">
        <span className="text-base mt-0.5">⚠️</span>
        <div>
          <p className="text-xs font-bold text-yellow-800 uppercase tracking-wide">
            Drug Allergy on File
          </p>
          <p className="text-sm font-semibold text-yellow-900">{allergies.join(" • ")}</p>
        </div>
      </div>

      {/* Mutation cards */}
      {hasKnownMutations &&
        mutations.map((m) => (
          <div
            key={m.allergen}
            className="rounded-lg border border-orange-200 bg-orange-50 p-3"
          >
            <div className="flex items-center gap-1 mb-2">
              <span className="text-xs font-bold text-orange-700 uppercase">
                Protocol Mutation
              </span>
              <span className="text-xs text-orange-500">— {m.allergen} allergy</span>
            </div>

            {!compact && (
              <div className="flex items-center gap-2 mb-2">
                {/* Avoided drug */}
                <div className="flex-1 rounded bg-red-100 border border-red-300 px-2 py-1.5 text-center">
                  <p className="text-xs text-red-500 font-semibold uppercase">Contraindicated</p>
                  <p className="text-xs font-bold text-red-700 line-through">{m.avoided}</p>
                </div>

                <span className="text-gray-400 font-bold">→</span>

                {/* Selected drug */}
                <div className="flex-1 rounded bg-green-100 border border-green-300 px-2 py-1.5 text-center">
                  <p className="text-xs text-green-600 font-semibold uppercase">Selected</p>
                  <p className="text-xs font-bold text-green-800">{m.selected}</p>
                  <p className="text-xs text-green-600">{m.selectedDose}</p>
                </div>
              </div>
            )}

            {compact && (
              <p className="text-xs font-semibold text-orange-800">
                {m.avoided} → <span className="text-green-700">{m.selected} {m.selectedDose}</span>
              </p>
            )}

            <p className="text-xs text-orange-600 italic">{m.reason}</p>
          </div>
        ))}

      {!hasKnownMutations && (
        <p className="text-xs text-yellow-700 pl-1">
          Allergy noted — verify drug selection before administration.
        </p>
      )}

      {/* FDA real-data badge */}
      {fdaWarning && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">FDA Label</span>
            {fdaSource && (
              <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">OpenFDA verified</span>
            )}
          </div>
          <p className="text-xs text-blue-800 leading-relaxed line-clamp-3">{fdaWarning}</p>
        </div>
      )}
    </div>
  );
}

// Utility: get the antibiotic to use given allergies
export function resolveAntibiotic(
  allergies: string[],
  defaultDrug: string,
  defaultDose: string
): { drug: string; dose: string; route: string; allergyDriven: boolean } {
  const mutations = computeMutations(allergies);
  if (mutations.length > 0) {
    return {
      drug: mutations[0].selected,
      dose: mutations[0].selectedDose,
      route: mutations[0].route,
      allergyDriven: true,
    };
  }
  return { drug: defaultDrug, dose: defaultDose, route: "IV", allergyDriven: false };
}
