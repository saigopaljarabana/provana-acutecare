import type { ProtocolType, ChecklistItem, TreatmentRecommendation } from "./types";

export interface ProtocolMeta {
  label: string;
  shortLabel: string;
  color: {
    border: string;
    header: string;
    headerText: string;
    badge: string;
  };
  icon: string;
  demandRoles: string[];
}

export const PROTOCOL_META: Record<ProtocolType, ProtocolMeta> = {
  sepsis_bundle: {
    label: "Sepsis — SEP-1 Bundle",
    shortLabel: "SEPSIS",
    icon: "🚨",
    color: {
      border: "border-red-500",
      header: "bg-red-600",
      headerText: "text-white",
      badge: "bg-red-100 text-red-700",
    },
    demandRoles: ["nurse", "doctor", "attending"],
  },
  stroke_code: {
    label: "Code Stroke — Acute Ischemic Protocol",
    shortLabel: "STROKE",
    icon: "🧠",
    color: {
      border: "border-purple-500",
      header: "bg-purple-700",
      headerText: "text-white",
      badge: "bg-purple-100 text-purple-700",
    },
    demandRoles: ["doctor", "attending"],
  },
  pediatric_fever: {
    label: "Pediatric Fever Protocol",
    shortLabel: "PEDS FEVER",
    icon: "🌡️",
    color: {
      border: "border-amber-500",
      header: "bg-amber-500",
      headerText: "text-white",
      badge: "bg-amber-100 text-amber-700",
    },
    demandRoles: ["nurse", "doctor", "attending"],
  },
};

export const SEPSIS_CHECKLIST: ChecklistItem[] = [
  { id: "cx",      label: "Blood cultures ×2",               timeTarget: "Now",      critical: true  },
  { id: "abx",     label: "Broad-spectrum antibiotics",       timeTarget: "< 1 hour", critical: true  },
  { id: "lactate", label: "Serum lactate",                    timeTarget: "Now",      critical: true  },
  { id: "fluids",  label: "30 mL/kg crystalloid bolus",       timeTarget: "< 3 hrs",  critical: true  },
  { id: "uo",      label: "Urine output monitoring (Foley)",  timeTarget: "Ongoing"                   },
  { id: "map",     label: "MAP target ≥65 mmHg",             timeTarget: "Ongoing"                   },
  { id: "glucose", label: "Blood glucose check",              timeTarget: "< 1 hour"                  },
  { id: "icu",     label: "Notify attending / ICU",           timeTarget: "Now",      critical: true  },
];

export const STROKE_CHECKLIST: ChecklistItem[] = [
  { id: "ct",    label: "Stat CT head (non-contrast)",  timeTarget: "< 25 min", critical: true },
  { id: "cta",   label: "CTA head & neck",              timeTarget: "< 45 min", critical: true },
  { id: "ecg",   label: "12-lead ECG",                  timeTarget: "< 10 min"                 },
  { id: "labs",  label: "INR, PTT, CBC, BMP, glucose",  timeTarget: "< 45 min", critical: true },
  { id: "neuro", label: "Neurology consult",            timeTarget: "< 15 min", critical: true },
  { id: "npo",   label: "NPO — swallow screen first",   timeTarget: "Now"                      },
  { id: "iv",    label: "2× large-bore IV access",      timeTarget: "Now"                      },
];

export const PEDS_FEVER_CHECKLIST: ChecklistItem[] = [
  { id: "ua",    label: "Urinalysis + urine culture",          timeTarget: "Now",      critical: true },
  { id: "cx",    label: "Blood culture ×2",                   timeTarget: "< 30 min"                },
  { id: "cbc",   label: "CBC, CMP, CRP, procalcitonin",       timeTarget: "< 30 min"                },
  { id: "iv",    label: "IV access",                          timeTarget: "Now",      critical: true },
  { id: "wt",    label: "Accurate weight for dosing",         timeTarget: "Now",      critical: true },
  { id: "temp",  label: "Acetaminophen 15 mg/kg",             timeTarget: "Now"                      },
  { id: "admit", label: "Admit / observation decision",       timeTarget: "< 2 hrs"                  },
];

export function getChecklist(protocolType: ProtocolType): ChecklistItem[] {
  switch (protocolType) {
    case "sepsis_bundle":    return SEPSIS_CHECKLIST;
    case "stroke_code":      return STROKE_CHECKLIST;
    case "pediatric_fever":  return PEDS_FEVER_CHECKLIST;
  }
}

export function resolveTreatment(
  protocolType: ProtocolType,
  allergies: string[]
): TreatmentRecommendation {
  const lower = allergies.map((a) => a.toLowerCase());

  if (protocolType === "sepsis_bundle") {
    if (lower.includes("penicillin") && lower.includes("carbapenem")) {
      return { drug: "Vancomycin + Aztreonam", dose: "25 mg/kg IV + 2g IV q6h", route: "IV", allergyDriven: true, note: "Full beta-lactam allergy" };
    }
    if (lower.includes("penicillin")) {
      return { drug: "Meropenem", dose: "1g IV q8h", route: "IV", allergyDriven: true, note: "Penicillin allergy — avoiding Pip-Tazo" };
    }
    return { drug: "Piperacillin-Tazobactam", dose: "4.5g IV q6h", route: "IV", allergyDriven: false };
  }

  if (protocolType === "stroke_code") {
    if (lower.includes("alteplase")) {
      return { drug: "Tenecteplase", dose: "0.25 mg/kg IV (max 25mg)", route: "IV", allergyDriven: true, note: "Alteplase allergy — alternative thrombolytic" };
    }
    return { drug: "Alteplase (tPA)", dose: "0.9 mg/kg IV (max 90mg)", route: "IV", allergyDriven: false };
  }

  if (protocolType === "pediatric_fever") {
    if (lower.includes("cephalosporin")) {
      return { drug: "Azithromycin", dose: "10 mg/kg IV (max 500mg)", route: "IV", allergyDriven: true, note: "Cephalosporin allergy" };
    }
    return { drug: "Ceftriaxone", dose: "50 mg/kg IV (max 2g)", route: "IV", allergyDriven: false };
  }

  return { drug: "—", dose: "—", route: "IV", allergyDriven: false };
}
