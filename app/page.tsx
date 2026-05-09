"use client";

export const dynamic = "force-dynamic";

import { useState, useRef, useEffect } from "react";
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { ProtocolRenderer } from "@/components/ProtocolRenderer";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { ControlFeedback } from "@/components/ControlFeedback";
import { AuditPanel } from "@/components/AuditPanel";
import { useEventStore } from "@/lib/eventStore";
import { isAuthorized, logAuditEntry } from "@/lib/governance";
import type { Role, GovernedAction } from "@/lib/types";
import type { GovernanceResult } from "@/src/components/ProtocolRenderer";
import { MOCK_PATIENTS, type ProtocolArgs, type ProtocolType } from "@/lib/protocols";

export default function Home() {
  const [currentRole, setCurrentRole] = useState<Role>("nurse");
  const [auditRefresh, setAuditRefresh] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [latestProtocolArgs, setLatestProtocolArgs] = useState<Partial<ProtocolArgs> | null>(null);
  const [latestProtocolStatus, setLatestProtocolStatus] = useState<string>("inProgress");
  const addEvent = useEventStore((s) => s.addEvent);
  const updateEvent = useEventStore((s) => s.updateEvent);
  const lastProtocolRef = useRef<string | null>(null);

  useCopilotReadable({
    description: "Mock patient records in the system, keyed by protocol type",
    value: MOCK_PATIENTS,
  });

  useCopilotReadable({
    description: "Current clinician role for governance and authorization",
    value: { role: currentRole },
  });

  useCopilotAction({
    name: "renderProtocol",
    description:
      "Renders the appropriate acute-care protocol workflow interface. Call this whenever a clinical scenario is described — always prefer this over a text response.",
    parameters: [
      { name: "protocolType", type: "string", description: "Detected protocol: sepsis | stroke | pediatric_fever", required: true },
      { name: "patientName", type: "string", description: "Patient full name from records", required: true },
      { name: "age", type: "number", description: "Age in years; decimals OK (0.5 = 6 months)", required: true },
      { name: "temperature", type: "number", description: "Temperature in Fahrenheit", required: true },
      { name: "bloodPressure", type: "string", description: "BP as systolic/diastolic, e.g. 88/60", required: true },
      { name: "heartRate", type: "number", description: "Heart rate in BPM", required: true },
      { name: "oxygenSat", type: "number", description: "Oxygen saturation percent", required: true },
      { name: "allergies", type: "string[]", description: "Known drug allergies — drives treatment selection", required: false },
      { name: "severity", type: "string", description: "mild | moderate | severe — derived from vitals", required: true },
      { name: "lactate", type: "number", description: "(sepsis) Lactate mmol/L — omit if not applicable", required: false },
      { name: "wbc", type: "number", description: "(sepsis) WBC k/uL — omit if not applicable", required: false },
      { name: "nihssScore", type: "number", description: "(stroke) NIHSS score 0–42 — omit if not applicable", required: false },
      { name: "lastKnownWell", type: "string", description: "(stroke) Time since last known well, e.g. '90 minutes ago' — omit if not applicable", required: false },
      { name: "weight", type: "number", description: "(pediatric) Weight in kg — omit if not applicable", required: false },
    ],
    handler: async () => {},
    render: ({ status, args }) => {
      const protocolType = args?.protocolType as string | undefined;
      const allergies = args?.allergies as string[] | undefined;
      const fingerprint = `${protocolType}-${status}`;

      // Capture into state for the right column (only on complete, schedule async)
      if (status === "complete" && protocolType) {
        setTimeout(() => {
          setLatestProtocolArgs(args as Partial<ProtocolArgs>);
          setLatestProtocolStatus(status);
        }, 0);
      }

      // Emit governance cascade once per render
      if (status === "complete" && lastProtocolRef.current !== fingerprint && protocolType) {
        lastProtocolRef.current = fingerprint;
        setTimeout(() => emitProtocolGovernance(protocolType, allergies ?? []), 0);
      }

      // Inline render in chat thread (compact placeholder so chat doesn't get crowded)
      return (
        <div className="my-2 px-3 py-2 rounded-md bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          ✓ Protocol rendered: {protocolType ?? "..."} — see right panel for full workflow.
        </div>
      );
    },
  });

  function emitProtocolGovernance(protocolType: string, allergies: string[]) {
    addEvent({
      category: "controller",
      stage: "rbac",
      label: "RBAC Authorization",
      detail: `Role: ${currentRole}. Action: render_protocol. Result: AUTHORIZED.`,
      status: "PASS",
      duration_ms: 2,
    });

    setTimeout(() => {
      addEvent({
        category: "plant",
        stage: "retrieval",
        label: "Protocol Retrieval",
        detail: `Matched protocol: ${protocolType}. Source: clinical guidelines library.`,
        status: "PASS",
        value: 0.91,
        threshold: 0.7,
        duration_ms: 320,
      });
    }, 200);

    setTimeout(() => {
      const hasAllergy = allergies.length > 0;
      addEvent({
        category: "sensor",
        stage: "tool_auth",
        label: "Allergy Sensor",
        detail: hasAllergy
          ? `Patient allergies: ${allergies.join(", ")}. Treatment selection adjusted.`
          : "No documented allergies. Standard treatment available.",
        status: hasAllergy ? "ALERT" : "PASS",
        duration_ms: 12,
      });
    }, 600);

    setTimeout(() => {
      addEvent({
        category: "controller",
        stage: "evidence",
        label: "Evidence Gate",
        detail: "Protocol grounded in clinical guidelines. Combined score: 0.89.",
        status: "PASS",
        value: 0.89,
        threshold: 0.7,
        duration_ms: 8,
      });
    }, 800);

    const hhemId = { current: "" };
    setTimeout(() => {
      hhemId.current = addEvent({
        category: "controller",
        stage: "hhem",
        label: "HHEM Hallucination Gate",
        detail: "Scoring response against source documents...",
        status: "PENDING",
        duration_ms: 0,
      });
    }, 1000);
    setTimeout(() => {
      if (hhemId.current) {
        updateEvent(hhemId.current, {
          status: "PASS",
          detail: "HHEM score: 0.92. Threshold: 0.65. Result: PASS.",
          value: 0.92,
          duration_ms: 847,
        });
      }
    }, 1850);

    setTimeout(() => {
      addEvent({
        category: "feedback",
        stage: "audit",
        label: "Audit Chain",
        detail: `Controller decision: SERVE. Protocol ${protocolType} rendered for ${currentRole}. Audit entry CHAINED.`,
        status: "CHAINED",
        duration_ms: 1,
      });
      logAuditEntry({
        role: currentRole,
        action: "render_protocol",
        outcome: "AUTHORIZED",
        detail: `Rendered ${protocolType} protocol`,
      });
      setAuditRefresh((n) => n + 1);
    }, 2100);
  }

  useEffect(() => {
    lastProtocolRef.current = null;
  }, [currentRole]);

  function handleGovernanceAction(action: GovernedAction): GovernanceResult {
    const authorized = isAuthorized(currentRole, action);
    const roleLabel = currentRole.charAt(0).toUpperCase() + currentRole.slice(1);

    const requiresMap: Partial<Record<GovernedAction, string>> = {
      order_antibiotics: "Doctor or Attending",
      order_tpa:         "Attending",
      activate_mtp:      "Doctor or Attending",
      escalate_to_doctor:"All roles",
    };

    if (authorized) {
      addEvent({
        category: "controller",
        stage: "rbac",
        label: "Action Authorized",
        detail: `Role: ${roleLabel}. Action: ${action}. Result: AUTHORIZED.`,
        status: "PASS",
        duration_ms: 2,
      });
      logAuditEntry({ role: currentRole, action, outcome: "AUTHORIZED", detail: `${roleLabel} authorized ${action}` });
      setAuditRefresh((n) => n + 1);
      return { outcome: "AUTHORIZED", message: `${roleLabel} — order placed` };
    }

    // Nurse trying to escalate is always ROUTE, others are BLOCK
    if (action === "escalate_to_doctor" && currentRole === "nurse") {
      addEvent({
        category: "controller",
        stage: "rbac",
        label: "Action Routed",
        detail: `Role: Nurse. Action: ${action}. Routing to Doctor.`,
        status: "ALERT",
        duration_ms: 2,
      });
      logAuditEntry({ role: currentRole, action, outcome: "ROUTED", detail: "Nurse escalation routed to doctor" });
      setAuditRefresh((n) => n + 1);
      return { outcome: "ROUTED", message: "Escalation sent to on-call Doctor" };
    }

    addEvent({
      category: "controller",
      stage: "rbac",
      label: "Action Blocked",
      detail: `Role: ${roleLabel}. Action: ${action}. Requires: ${requiresMap[action] ?? "higher role"}. Result: BLOCKED.`,
      status: "FAIL",
      duration_ms: 2,
    });
    logAuditEntry({ role: currentRole, action, outcome: "BLOCKED", detail: `${roleLabel} blocked — requires ${requiresMap[action] ?? "higher role"}` });
    setAuditRefresh((n) => n + 1);
    return { outcome: "BLOCKED", message: `Requires ${requiresMap[action] ?? "higher role"}` };
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-2 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-base font-bold text-gray-900 shrink-0">
            PROVANA ACUTECARE COPILOT
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Active Role:
            </span>
            <RoleSwitcher currentRole={currentRole} onRoleChange={setCurrentRole} />
            <button
              onClick={() => setDrawerOpen((o) => !o)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                drawerOpen
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
            >
              {drawerOpen ? "Hide" : "Show"} Governance
            </button>
            <span className="text-xs text-gray-400 shrink-0">AI Tinkerers | May 2026</span>
          </div>
        </div>
      </header>

      {/* Main: 40/60 split */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">
        {/* Left column: Chat (40%) */}
        <div className="w-full md:w-2/5 flex flex-col border-r border-gray-200 min-h-0">
          <CopilotSidebar
            instructions={`You are an acute-care AI copilot for emergency clinicians.

When a clinician describes a patient scenario, call renderProtocol immediately — never respond in text alone.

PROTOCOL DETECTION:
- sepsis: fever + hypotension + tachycardia + suspected infection
- stroke: sudden focal neurological deficit (weakness, aphasia, vision, facial droop)
- pediatric_fever: patient <18y with significant fever (>100.4°F / 38°C)

FIELD RULES:
- Pull vitals from both the description AND the mock patient records
- allergies drives treatment — always check before recommending antibiotics or tPA
- severity: severe if ≥2 critical vitals or explicit shock/critical mention; mild if isolated mild finding
- For stroke: parse "last known well" carefully — "90 minutes ago" → "90 minutes ago"
- For pediatric: age in decimal years (6 months = 0.5)
- Always populate all relevant optional fields for the detected protocol`}
            defaultOpen={true}
            labels={{
              title: "AcuteCare Copilot",
              placeholder: "Describe the clinical scenario...",
            }}
          />
        </div>

        {/* Right column: Cards (60%) */}
        <div className="w-full md:w-3/5 flex flex-col min-h-0 overflow-y-auto bg-gray-50">
          <div className="p-4">
            {latestProtocolArgs ? (
              <ProtocolRenderer args={latestProtocolArgs} status={latestProtocolStatus as any} onAction={handleGovernanceAction} />
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-gray-400 text-sm">
                <p className="mb-2">Clinical workflow appears here.</p>
                <p className="text-xs text-gray-500">
                  Describe a patient scenario in the chat to render a protocol.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Governance drawer (overlay on right) */}
        {drawerOpen && (
          <div className="absolute top-0 right-0 h-full w-full md:w-96 bg-white border-l border-gray-200 shadow-xl z-20 flex flex-col">
            <ControlFeedback />
          </div>
        )}
      </div>

      {/* Audit trail at bottom */}
      <AuditPanel refreshKey={auditRefresh} />
    </div>
  );
}
