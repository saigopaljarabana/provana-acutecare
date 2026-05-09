"use client";

import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import {
  Role,
  isAuthorized,
  getRequiredRole,
  logAuditEntry,
  getAuditLog,
  ROLE_LABELS,
} from "@/lib/governance";
import {
  lookupProcedure,
  getNotificationTargets,
  generateProcedureUpdate,
} from "@/lib/procedures";

interface GovernedActionsProps {
  currentRole: Role;
  onAuditUpdate: () => void;
}

export function GovernedActions({ currentRole, onAuditUpdate }: GovernedActionsProps) {
  // Share state with the agent
  useCopilotReadable({
    description: "Current user role and permissions",
    value: JSON.stringify({
      role: currentRole,
      roleLabel: ROLE_LABELS[currentRole],
      canLookupProcedures: isAuthorized(currentRole, "lookup_procedure"),
      canQueueNotifications: isAuthorized(currentRole, "queue_notification"),
      canDraftUpdates: isAuthorized(currentRole, "draft_procedure_update"),
    }),
  });

  useCopilotReadable({
    description: "Audit trail of all agent actions in this session",
    value: JSON.stringify(getAuditLog()),
  });

  // Tool 1: Lookup Procedure (any role)
  useCopilotAction({
    name: "lookup_procedure",
    description:
      "Look up a safety procedure from the governed knowledge base. " +
      "Available to all roles. Returns cited procedure with source document reference.",
    parameters: [
      {
        name: "query",
        type: "string",
        description: "The safety question or incident description to look up",
        required: true,
      },
    ],
    handler: async ({ query }) => {
      const authorized = isAuthorized(currentRole, "lookup_procedure");
      if (!authorized) {
        const entry = logAuditEntry(currentRole, "lookup_procedure", false, query, "DENIED");
        onAuditUpdate();
        return `ACCESS DENIED: ${ROLE_LABELS[currentRole]} role cannot look up procedures. Required: ${getRequiredRole("lookup_procedure")}.`;
      }

      const result = lookupProcedure(query);
      if (!result) {
        const entry = logAuditEntry(currentRole, "lookup_procedure", true, query, "NO_MATCH - FAIL_CLOSED");
        onAuditUpdate();
        return "INSUFFICIENT EVIDENCE: No matching procedure found. The system refuses to generate an answer without supporting evidence.";
      }

      logAuditEntry(currentRole, "lookup_procedure", true, query, `APPROVED - ${result.document}`);
      onAuditUpdate();
      return JSON.stringify(result);
    },
    render: ({ status, result, args }) => {
      if (status === "inProgress") {
        return (
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 my-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-blue-700 font-medium">
                Checking authorization and retrieving procedure...
              </span>
            </div>
          </div>
        );
      }

      if (!result) return null;

      // Check if it was a denial
      if (typeof result === "string" && result.startsWith("ACCESS DENIED")) {
        return (
          <div className="border border-red-300 bg-red-50 rounded-lg p-4 my-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-600 text-lg">&#x26D4;</span>
              <span className="font-semibold text-red-800">Access Denied</span>
            </div>
            <p className="text-sm text-red-700">{result}</p>
          </div>
        );
      }

      // Check for fail-closed
      if (typeof result === "string" && result.startsWith("INSUFFICIENT")) {
        return (
          <div className="border border-amber-300 bg-amber-50 rounded-lg p-4 my-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-amber-600 text-lg">&#x26A0;</span>
              <span className="font-semibold text-amber-800">Fail-Closed: Insufficient Evidence</span>
            </div>
            <p className="text-sm text-amber-700">
              No matching procedure found. The system refuses to answer rather than guess.
            </p>
          </div>
        );
      }

      // Parse and display the procedure
      try {
        const proc = JSON.parse(result);
        return (
          <div className="border border-emerald-300 bg-white rounded-lg p-4 my-2 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-emerald-600 text-lg">&#x2705;</span>
              <span className="font-semibold text-emerald-800">Approved Guidance</span>
              <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                Score: {proc.confidenceScore}
              </span>
            </div>
            <h3 className="font-bold text-gray-900 mb-1">{proc.title}</h3>
            <p className="text-xs text-gray-500 mb-3">
              {proc.document} | {proc.section} | Effective: {proc.effectiveDate}
            </p>
            <pre className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 p-3 rounded mb-3">
              {proc.content}
            </pre>
            <div className="border-t pt-2">
              <p className="text-xs font-medium text-gray-500 mb-1">Citations:</p>
              {proc.citations.map((c: string, i: number) => (
                <p key={i} className="text-xs text-gray-600 pl-2">
                  [{i + 1}] {c}
                </p>
              ))}
            </div>
          </div>
        );
      } catch {
        return <div className="text-sm text-gray-600 my-2">{result}</div>;
      }
    },
  });

  // Tool 2: Queue Notification (supervisor+)
  useCopilotAction({
    name: "queue_notification",
    description:
      "Send emergency notifications to incident response personnel. " +
      "RESTRICTED: Requires supervisor or admin role. Operators cannot send notifications.",
    parameters: [
      {
        name: "message",
        type: "string",
        description: "The notification message to send",
        required: true,
      },
      {
        name: "priority",
        type: "string",
        description: "Priority level: routine, urgent, or emergency",
        required: true,
      },
    ],
    handler: async ({ message, priority }) => {
      const authorized = isAuthorized(currentRole, "queue_notification");
      if (!authorized) {
        logAuditEntry(currentRole, "queue_notification", false, message, "DENIED");
        onAuditUpdate();
        return `ACCESS DENIED: Notification dispatch requires ${getRequiredRole("queue_notification")} role or higher. Current role: ${ROLE_LABELS[currentRole]}.`;
      }

      const targets = getNotificationTargets();
      logAuditEntry(
        currentRole,
        "queue_notification",
        true,
        `${priority}: ${message}`,
        `SENT to ${targets.length} recipients`
      );
      onAuditUpdate();
      return JSON.stringify({ sent: true, priority, targets, message });
    },
    render: ({ status, result }) => {
      if (status === "inProgress") {
        return (
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 my-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-blue-700 font-medium">
                Verifying notification authorization...
              </span>
            </div>
          </div>
        );
      }

      if (!result) return null;

      if (typeof result === "string" && result.startsWith("ACCESS DENIED")) {
        return (
          <div className="border border-red-300 bg-red-50 rounded-lg p-4 my-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-600 text-lg">&#x26D4;</span>
              <span className="font-semibold text-red-800">Notification Blocked</span>
            </div>
            <p className="text-sm text-red-700">{result}</p>
          </div>
        );
      }

      try {
        const data = JSON.parse(result);
        return (
          <div className="border border-blue-300 bg-white rounded-lg p-4 my-2 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-blue-600 text-lg">&#x1F4E8;</span>
              <span className="font-semibold text-blue-800">Notifications Dispatched</span>
              <span className={`ml-auto text-xs px-2 py-0.5 rounded ${
                data.priority === "emergency"
                  ? "bg-red-100 text-red-700"
                  : data.priority === "urgent"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-gray-100 text-gray-700"
              }`}>
                {data.priority?.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-700 mb-3">{data.message}</p>
            <div className="space-y-1">
              {data.targets?.map((t: { name: string; role: string; channel: string }, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="w-2 h-2 bg-green-400 rounded-full" />
                  {t.name} ({t.role}) via {t.channel}
                </div>
              ))}
            </div>
          </div>
        );
      } catch {
        return <div className="text-sm text-gray-600 my-2">{result}</div>;
      }
    },
  });

  // Tool 3: Draft Procedure Update (admin only)
  useCopilotAction({
    name: "draft_procedure_update",
    description:
      "Create a draft update to an existing procedure. " +
      "RESTRICTED: Requires admin role. The draft must be reviewed and approved by a document custodian.",
    parameters: [
      {
        name: "procedure",
        type: "string",
        description: "The procedure to update",
        required: true,
      },
      {
        name: "proposed_change",
        type: "string",
        description: "Description of the proposed change",
        required: true,
      },
    ],
    handler: async ({ procedure, proposed_change }) => {
      const authorized = isAuthorized(currentRole, "draft_procedure_update");
      if (!authorized) {
        logAuditEntry(currentRole, "draft_procedure_update", false, procedure, "DENIED");
        onAuditUpdate();
        return `ACCESS DENIED: Procedure updates require ${getRequiredRole("draft_procedure_update")} role. Current role: ${ROLE_LABELS[currentRole]}.`;
      }

      const draft = generateProcedureUpdate(procedure, proposed_change);
      logAuditEntry(
        currentRole,
        "draft_procedure_update",
        true,
        `${procedure}: ${proposed_change}`,
        `DRAFT CREATED: ${draft.draftId}`
      );
      onAuditUpdate();
      return JSON.stringify(draft);
    },
    render: ({ status, result }) => {
      if (status === "inProgress") {
        return (
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 my-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-blue-700 font-medium">
                Verifying procedure update authorization...
              </span>
            </div>
          </div>
        );
      }

      if (!result) return null;

      if (typeof result === "string" && result.startsWith("ACCESS DENIED")) {
        return (
          <div className="border border-red-300 bg-red-50 rounded-lg p-4 my-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-600 text-lg">&#x26D4;</span>
              <span className="font-semibold text-red-800">Update Blocked</span>
            </div>
            <p className="text-sm text-red-700">{result}</p>
          </div>
        );
      }

      try {
        const data = JSON.parse(result);
        return (
          <div className="border border-purple-300 bg-white rounded-lg p-4 my-2 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-purple-600 text-lg">&#x1F4DD;</span>
              <span className="font-semibold text-purple-800">Draft Created</span>
              <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-mono">
                {data.draftId}
              </span>
            </div>
            <p className="text-sm text-gray-700">{data.summary}</p>
            <p className="text-xs text-gray-400 mt-2">
              Requires custodian review before publication. Separation of duties enforced.
            </p>
          </div>
        );
      } catch {
        return <div className="text-sm text-gray-600 my-2">{result}</div>;
      }
    },
  });

  return null; // This component only registers actions
}
