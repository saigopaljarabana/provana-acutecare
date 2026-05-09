// Hardcoded procedure responses for the hackathon.
// In production Keystone, these come from the governed retrieval pipeline.
// Here we simulate the retrieval result with pre-built responses.

export interface ProcedureResult {
  title: string;
  document: string;
  section: string;
  effectiveDate: string;
  content: string;
  citations: string[];
  confidenceScore: number;
}

export interface NotificationTarget {
  name: string;
  role: string;
  channel: string;
}

const PROCEDURES: Record<string, ProcedureResult> = {
  "confined_space_collapse": {
    title: "Confined Space Emergency Response",
    document: "OHS-CS-003 Confined Space Entry and Rescue",
    section: "Section 7.2: Emergency Collapse Protocol",
    effectiveDate: "2025-11-15",
    content:
      "1. Sound alarm and call 911 immediately.\n" +
      "2. Do NOT enter the space without SCBA and rescue harness.\n" +
      "3. Assign a safety watch at the entry point.\n" +
      "4. Deploy retrieval system (tripod + winch) if available.\n" +
      "5. Begin atmospheric monitoring of the space.\n" +
      "6. Notify site supervisor and incident commander.\n" +
      "7. Prepare casualty staging area upwind of entry.",
    citations: [
      "OHS-CS-003, Section 7.2, para 1-7 (effective 2025-11-15)",
      "Alberta OHS Code Part 5: Confined Spaces, Section 50",
    ],
    confidenceScore: 0.91,
  },
  "atmospheric_testing": {
    title: "Atmospheric Testing Requirements",
    document: "OHS-CS-003 Confined Space Entry and Rescue",
    section: "Section 4.1: Pre-Entry Atmospheric Testing",
    effectiveDate: "2025-11-15",
    content:
      "Before any confined space entry:\n" +
      "1. Test oxygen levels (19.5% to 23.0% acceptable range).\n" +
      "2. Test for combustible gases (must be below 10% LEL).\n" +
      "3. Test for hydrogen sulfide (below 10 ppm).\n" +
      "4. Test for carbon monoxide (below 25 ppm).\n" +
      "5. Continuous monitoring required during entire entry.\n" +
      "6. All readings logged on Confined Space Entry Permit.",
    citations: [
      "OHS-CS-003, Section 4.1, para 1-6 (effective 2025-11-15)",
      "Alberta OHS Code Part 5, Section 44(1)",
    ],
    confidenceScore: 0.88,
  },
  "mayday_procedure": {
    title: "MAYDAY Declaration and Response",
    document: "OPS-EM-001 Emergency Communications",
    section: "Section 3.1: MAYDAY Protocol",
    effectiveDate: "2026-01-10",
    content:
      "MAYDAY is declared when a firefighter is lost, trapped, or in immediate danger.\n" +
      '1. Activate PASS device and transmit: "MAYDAY MAYDAY MAYDAY."\n' +
      "2. Provide LUNAR report: Location, Unit, Name, Assignment, Resources needed.\n" +
      "3. IC immediately assigns RIT (Rapid Intervention Team).\n" +
      "4. All non-emergency radio traffic ceases.\n" +
      "5. PAR (Personnel Accountability Report) initiated for all crews.",
    citations: [
      "OPS-EM-001, Section 3.1, para 1-5 (effective 2026-01-10)",
    ],
    confidenceScore: 0.94,
  },
};

const NOTIFICATION_TARGETS: NotificationTarget[] = [
  { name: "J. Morrison", role: "Incident Commander", channel: "Radio Ch. 1" },
  { name: "K. Patel", role: "Safety Officer", channel: "Radio Ch. 3" },
  { name: "Dispatch", role: "Communications", channel: "CAD System" },
  { name: "M. Chen", role: "EMS Supervisor", channel: "Radio Ch. 5" },
];

export function lookupProcedure(query: string): ProcedureResult | null {
  const q = query.toLowerCase();
  if (q.includes("collapse") || q.includes("confined space emergency") || q.includes("rescue")) {
    return PROCEDURES["confined_space_collapse"];
  }
  if (q.includes("atmospheric") || q.includes("testing") || q.includes("air quality") || q.includes("gas")) {
    return PROCEDURES["atmospheric_testing"];
  }
  if (q.includes("mayday") || q.includes("lost") || q.includes("trapped")) {
    return PROCEDURES["mayday_procedure"];
  }
  return null;
}

export function getNotificationTargets(): NotificationTarget[] {
  return NOTIFICATION_TARGETS;
}

export function generateProcedureUpdate(
  procedure: string,
  proposedChange: string
): { draftId: string; summary: string } {
  return {
    draftId: `DRAFT-${Date.now().toString(36).toUpperCase()}`,
    summary: `Proposed update to "${procedure}": ${proposedChange}. Requires review and approval by document custodian before publication.`,
  };
}
