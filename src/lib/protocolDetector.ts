import type { DetectedProtocol, ProtocolType, Severity } from "./types";

interface ProtocolRule {
  type: ProtocolType;
  keywords: RegExp[];
  requireAll?: boolean;
}

const PROTOCOL_RULES: ProtocolRule[] = [
  {
    type: "sepsis_bundle",
    keywords: [
      /sepsis|septic shock|sep-1/i,
      /hypoten|lactate|bacteremia/i,
      /(fever|febrile|temp).{0,40}(hypoten|low bp|shock)/i,
    ],
    requireAll: false,
  },
  {
    type: "stroke_code",
    keywords: [
      /stroke|cva|tia/i,
      /aphasia|dysarthria|facial droop|arm weakness|hemiplegia/i,
      /nihss|last known well|tpa|alteplase/i,
      /(sudden|acute).{0,30}(weakness|paralysis|numbness|visual)/i,
    ],
    requireAll: false,
  },
  {
    type: "pediatric_fever",
    keywords: [
      /pediatric|infant|neonate|toddler|child|baby|\b\d+.?(month|week|day).?old/i,
    ],
    requireAll: true,
  },
];

function deriveSeverity(prompt: string): Severity {
  if (/shock|critical|arrest|intubat|icu|severe/i.test(prompt)) return "severe";
  if (/moderate|worsen|deteriorat/i.test(prompt)) return "moderate";
  return "moderate";
}

function findTriggerKeywords(prompt: string, patterns: RegExp[]): string[] {
  return patterns
    .flatMap((p) => {
      const m = prompt.match(p);
      return m ? [m[0]] : [];
    })
    .slice(0, 4);
}

export function detectProtocol(prompt: string): DetectedProtocol | null {
  for (const rule of PROTOCOL_RULES) {
    const matchCount = rule.keywords.filter((k) => k.test(prompt)).length;
    const threshold = rule.requireAll ? rule.keywords.length : 1;

    if (matchCount >= threshold) {
      const triggers = findTriggerKeywords(prompt, rule.keywords);
      return {
        type: rule.type,
        severity: deriveSeverity(prompt),
        confidence: matchCount >= 2 ? "high" : "medium",
        triggerKeywords: triggers,
      };
    }
  }

  // Fallback: fever alone → sepsis if hypotension/tachycardia mentioned
  if (/(fever|febrile)/i.test(prompt) && /(bp|pressure|rate|tachycard)/i.test(prompt)) {
    return {
      type: "sepsis_bundle",
      severity: "moderate",
      confidence: "low",
      triggerKeywords: ["fever", "hemodynamic concern"],
    };
  }

  return null;
}
