"use client";

import { useState, useEffect } from "react";
import { getAuditLog, type AuditEntry } from "@/lib/governance";

const OUTCOME_COLOR: Record<string, string> = {
  AUTHORIZED: "bg-emerald-100 text-emerald-800",
  BLOCKED: "bg-red-100 text-red-800",
  ROUTED: "bg-purple-100 text-purple-800",
};

export function AuditPanel({ refreshKey }: { refreshKey: number }) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<AuditEntry[]>([]);

  useEffect(() => {
    setEntries(getAuditLog());
  }, [refreshKey]);

  return (
    <div className="border-t border-gray-200 bg-gray-50 shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 flex items-center justify-between"
      >
        <span>{open ? "▼" : "▶"} Audit Trail ({entries.length} entries)</span>
        <span className="text-gray-400 font-normal">Hash-chained, append-only</span>
      </button>
      {open && (
        <div className="max-h-40 overflow-y-auto px-3 py-2 space-y-1 bg-white">
          {entries.length === 0 ? (
            <p className="text-xs text-gray-400">No audit entries yet.</p>
          ) : (
            entries
              .slice()
              .reverse()
              .map((e) => (
                <div key={e.id} className="flex items-center gap-2 text-xs py-0.5">
                  <span className="font-mono text-gray-500">{e.id}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${OUTCOME_COLOR[e.outcome]}`}>
                    {e.outcome}
                  </span>
                  <span className="text-gray-700">{e.role}</span>
                  <span className="text-gray-500">{new Date(e.timestamp).toLocaleTimeString()}</span>
                  <span className="text-gray-700 truncate">{e.action} — {e.detail}</span>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
}
