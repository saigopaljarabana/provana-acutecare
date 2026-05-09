"use client";

export const dynamic = "force-dynamic";

import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { ProtocolRenderer } from "@/components/ProtocolRenderer";
import { MOCK_PATIENTS, DEMO_PROMPTS, type ProtocolArgs, type ProtocolType } from "@/lib/protocols";

export default function Home() {
  useCopilotReadable({
    description: "Mock patient records in the system, keyed by protocol type",
    value: MOCK_PATIENTS,
  });

  useCopilotAction({
    name: "renderProtocol",
    description:
      "Renders the appropriate acute-care protocol workflow interface. Call this whenever a clinical scenario is described — always prefer this over a text response.",
    parameters: [
      {
        name: "protocolType",
        type: "string",
        description: "Detected protocol: sepsis | stroke | pediatric_fever",
      },
      { name: "patientName", type: "string", description: "Patient full name from records" },
      { name: "age", type: "number", description: "Age in years; decimals OK (0.5 = 6 months)" },
      { name: "temperature", type: "number", description: "Temperature in Fahrenheit" },
      { name: "bloodPressure", type: "string", description: "BP as systolic/diastolic, e.g. 88/60" },
      { name: "heartRate", type: "number", description: "Heart rate in BPM" },
      { name: "oxygenSat", type: "number", description: "Oxygen saturation percent" },
      { name: "allergies", type: "string[]", description: "Known drug allergies — drives treatment selection" },
      {
        name: "severity",
        type: "string",
        description: "mild | moderate | severe — derived from vitals",
      },
      // Protocol-specific optional fields
      { name: "lactate", type: "number", description: "(sepsis) Lactate mmol/L — omit if not applicable" },
      { name: "wbc", type: "number", description: "(sepsis) WBC k/uL — omit if not applicable" },
      {
        name: "nihssScore",
        type: "number",
        description: "(stroke) NIHSS score 0–42 — omit if not applicable",
      },
      {
        name: "lastKnownWell",
        type: "string",
        description: "(stroke) Time since last known well, e.g. '90 minutes ago' — omit if not applicable",
      },
      { name: "weight", type: "number", description: "(pediatric) Weight in kg — omit if not applicable" },
    ],
    render: ({ status, args }) => (
      <ProtocolRenderer args={args as Partial<ProtocolArgs>} status={status} />
    ),
  });

  return (
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
    >
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Provana AcuteCare Copilot</h1>
          <p className="text-gray-500 mb-8 text-sm">
            Describe a clinical scenario in the sidebar → AI detects protocol → workflow card renders
            dynamically with allergy-aware, context-adapted treatment guidance.
          </p>

          <section className="mb-8">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Mock Patients on File
            </h2>
            <div className="grid gap-3">
              {(Object.entries(MOCK_PATIENTS) as [ProtocolType, (typeof MOCK_PATIENTS)[ProtocolType]][]).map(
                ([protocol, patient]) => (
                  <PatientCard key={protocol} protocol={protocol} patient={patient} />
                )
              )}
            </div>
          </section>

          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Demo Scenarios — Copy to Sidebar
            </h2>
            <div className="space-y-2">
              {(Object.entries(DEMO_PROMPTS) as [ProtocolType, string][]).map(([protocol, prompt]) => (
                <div key={protocol} className="rounded-lg border border-gray-200 bg-white p-3">
                  <span
                    className={`inline-block text-xs font-bold uppercase px-2 py-0.5 rounded mb-2 ${PROTOCOL_TAG_STYLES[protocol]}`}
                  >
                    {protocol.replace("_", " ")}
                  </span>
                  <p className="text-xs text-gray-600 leading-relaxed">{prompt}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </CopilotSidebar>
  );
}

const PROTOCOL_TAG_STYLES: Record<ProtocolType, string> = {
  sepsis: "bg-red-100 text-red-700",
  stroke: "bg-purple-100 text-purple-700",
  pediatric_fever: "bg-yellow-100 text-yellow-700",
};

function PatientCard({
  protocol,
  patient,
}: {
  protocol: ProtocolType;
  patient: (typeof MOCK_PATIENTS)[ProtocolType];
}) {
  const displayFields: (keyof typeof patient)[] = [
    "patientName",
    "age",
    "temperature",
    "bloodPressure",
    "heartRate",
    "oxygenSat",
    "allergies",
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${PROTOCOL_TAG_STYLES[protocol]}`}>
          {protocol.replace("_", " ")}
        </span>
        <span className="text-sm font-semibold text-gray-700">{patient.patientName}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {displayFields.slice(1).map((key) => {
          const val = patient[key];
          if (val === undefined) return null;
          return (
            <div key={key} className="text-xs">
              <span className="text-gray-400 capitalize block">{String(key).replace(/([A-Z])/g, " $1")}</span>
              <span className="font-medium text-gray-700">
                {Array.isArray(val) ? (val.length ? val.join(", ") : "None") : String(val)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
