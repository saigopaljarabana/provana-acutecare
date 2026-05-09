"use client";

import { useState } from "react";
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { Role } from "@/lib/governance";
import { GovernedActions } from "@/components/GovernedActions";
import { AuditPanel } from "@/components/AuditPanel";
import { RoleSwitcher } from "@/components/RoleSwitcher";

export default function Home() {
  const [currentRole, setCurrentRole] = useState<Role>("operator");
  const [auditRefresh, setAuditRefresh] = useState(0);

  const handleAuditUpdate = () => {
    setAuditRefresh((prev) => prev + 1);
  };

  return (
    <CopilotSidebar
      defaultOpen={true}
      instructions={`You are an incident response agent for a fire department.
You have three tools available, but each tool requires authorization based on the user's role.
ALWAYS attempt to use the appropriate tool. Do NOT skip tool usage.

CRITICAL RULES:
1. ALWAYS check authorization by calling the tool. The tool will enforce access control.
2. If a tool returns ACCESS DENIED, explain what role is required and why.
3. If lookup_procedure returns INSUFFICIENT EVIDENCE, do NOT make up an answer. Report the refusal.
4. For notifications, determine priority from context (emergency for life safety, urgent for time-sensitive, routine for informational).
5. Every action you take is logged in the audit trail. Mention this to the user.

Available tools by role:
- operator: lookup_procedure only
- supervisor: lookup_procedure + queue_notification  
- admin: all tools including draft_procedure_update

The current user role is provided in context. Respect it.`}
      labels={{
        title: "Governed Incident Agent",
        initial:
          "I'm your incident response agent. I can look up safety procedures, send notifications, and draft procedure updates. All actions are governed by your role and logged to an audit trail.\n\nTry: \"Confined space collapse at Site 7, one worker down\"",
      }}
    >
      <GovernedActions
        currentRole={currentRole}
        onAuditUpdate={handleAuditUpdate}
      />
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                Governed Incident Response
              </h1>
              <p className="text-xs text-gray-500">
                Agentic interface with per-action authorization and audit trail
              </p>
            </div>
            <div className="text-xs text-gray-400">
              AI Tinkerers Hackathon | May 2026
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto p-6 space-y-4">
          <RoleSwitcher
            currentRole={currentRole}
            onRoleChange={setCurrentRole}
          />

          <AuditPanel refreshKey={auditRefresh} />

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
            <h2 className="font-semibold text-gray-900 text-sm mb-2">
              Demo Script
            </h2>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex gap-2">
                <span className="font-mono bg-blue-50 text-blue-700 px-1.5 rounded">1</span>
                <span>As <strong>Operator</strong>: &quot;Confined space collapse at Site 7, one worker down&quot;</span>
              </div>
              <div className="flex gap-2">
                <span className="font-mono bg-blue-50 text-blue-700 px-1.5 rounded">2</span>
                <span>As <strong>Operator</strong>: &quot;Send emergency notification to all supervisors&quot; (will be denied)</span>
              </div>
              <div className="flex gap-2">
                <span className="font-mono bg-blue-50 text-blue-700 px-1.5 rounded">3</span>
                <span>Switch to <strong>Supervisor</strong>, same request (will succeed)</span>
              </div>
              <div className="flex gap-2">
                <span className="font-mono bg-blue-50 text-blue-700 px-1.5 rounded">4</span>
                <span>As <strong>Operator</strong>: &quot;What medication dose should I give?&quot; (fail-closed: no evidence)</span>
              </div>
              <div className="flex gap-2">
                <span className="font-mono bg-blue-50 text-blue-700 px-1.5 rounded">5</span>
                <span>Show audit trail: every action, every role check, every decision</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </CopilotSidebar>
  );
}
