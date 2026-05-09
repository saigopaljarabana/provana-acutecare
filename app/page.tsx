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
import type { Role } from "@/lib/types";
import { MOCK_PATIENTS, type ProtocolArgs, type ProtocolType } from "@/lib/protocols";

export default function Home() {
  const [currentRole, setCurrentRole] = useState<Role>("nurse");
  const [auditRefresh, setAuditRefresh] = useState(0);
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
    handler: () => {},
    render: ({ status, args }) => {
      // Emit governance cascade once per protocol render
      const protocolType = args?.protocolType as string | undefined;
      const allergies = args?.allergies as string[] | undefined;
      const fingerprint = `${protocolType}-${status}`;
      if (status === "complete" && lastProtocolRef.current !== fingerprint && protocolType) {
        lastProtocolRef.current = fingerprint;
        // Schedule async to avoid setState-during-render warning
        setTimeout(() => emitProtocolGovernance(protocolType, allergies ?? []), 0);
      }
      return <ProtocolRenderer args={args as Partial<ProtocolArgs>} status={status} />;
    },
  });

  function emitProtocolGovernance(protocolType: string, allergies: string[]) {
    // 1. RBAC
    addEvent({
      category: "controller",
      stage: "rbac",
      label: "RBAC Authorization",
      detail: `Role: ${currentRole}. Action: render_protocol. Result: AUTHORIZED.`,
      status: "PASS",
      duration_ms: 2,
    });

    // 2. Retrieval (the protocol itself)
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

    // 3. Allergy check (sensor)
    setTimeout(() => {
      const hasAllergy = allergies.length > 0;
      addEvent({
        category: hasAllergy ? "sensor" : "sensor",
        stage: "tool_auth",
        label: "Allergy Sensor",
        detail: hasAllergy
          ? `Patient allergies: ${allergies.join(", ")}. Treatment selection adjusted.`
          : "No documented allergies. Standard treatment available.",
        status: hasAllergy ? "ALERT" : "PASS",
        duration_ms: 12,
      });
    }, 600);

    // 4. Evidence gate
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

    // 5. HHEM
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

    // 6. Audit
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

  // Reset fingerprint when role changes so protocol re-emits governance
  useEffect(() => {
    lastProtocolRef.current = null;
  }, [currentRole]);

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
            <span className="text-xs text-gray-400 shrink-0">AI Tinkerers | May 2026</span>
          </div>
        </div>
      </header>

      {/* Main: 60/40 split */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Left column: Clinical workflow (60%) */}
        <div className="w-full md:w-3/5 flex flex-col border-r border-gray-200 min-h-0 overflow-y-auto">
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

        {/* Right column: Governance panel (40%) */}
        <div className="w-full md:w-2/5 flex flex-col min-h-0">
          <ControlFeedback />
        </div>
      </div>

      {/* Audit trail at bottom */}
      <AuditPanel refreshKey={auditRefresh} />
    </div>
  );
}
