"use client";

import { AuditEntry, getAuditLog } from "@/lib/governance";

interface AuditPanelProps {
  refreshKey: number;
}

export function AuditPanel({ refreshKey }: AuditPanelProps) {
  const entries = getAuditLog();

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 text-sm">
          Audit Trail ({entries.length} entries)
        </h2>
        <span className="text-xs text-gray-400">Hash-chained, append-only</span>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {entries.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-400">
            No actions recorded yet. Ask the agent to do something.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {[...entries].reverse().map((entry) => (
              <AuditRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AuditRow({ entry }: { entry: AuditEntry }) {
  return (
    <div className="px-4 py-2.5 text-xs hover:bg-gray-50">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-mono text-gray-400">{entry.id}</span>
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
            entry.authorized
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {entry.authorized ? "AUTHORIZED" : "DENIED"}
        </span>
        <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px]">
          {entry.userRole}
        </span>
        <span className="ml-auto text-gray-400">
          {new Date(entry.timestamp).toLocaleTimeString()}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-gray-600">{entry.toolName}</span>
        <span className="text-gray-400 truncate">{entry.result}</span>
      </div>
    </div>
  );
}
