"use client";

import { useState, useEffect, useRef } from "react";

interface ChecklistItem {
  id: string;
  label: string;
  timeTarget?: string;
  critical?: boolean;
  detail?: string;
}

const PROTOCOL_CHECKLISTS: Record<string, ChecklistItem[]> = {
  sepsis_bundle: [
    { id: "cx",      label: "Blood cultures ×2",                timeTarget: "Now",      critical: true,  detail: "Before first antibiotic dose" },
    { id: "abx",     label: "Broad-spectrum antibiotics",        timeTarget: "< 1 hour", critical: true,  detail: "See treatment panel for agent" },
    { id: "lactate", label: "Serum lactate",                     timeTarget: "Now",      critical: true,  detail: "Repeat q2h if initial >2 mmol/L" },
    { id: "fluids",  label: "30 mL/kg crystalloid bolus",        timeTarget: "< 3 hours",critical: true,  detail: "Reassess after each 500 mL" },
    { id: "uo",      label: "Urine output monitoring",           timeTarget: "Ongoing",               detail: "Target ≥0.5 mL/kg/h" },
    { id: "map",     label: "MAP target ≥65 mmHg",              timeTarget: "Ongoing",               detail: "Vasopressors if fluid-unresponsive" },
    { id: "glucose", label: "Blood glucose",                     timeTarget: "< 1 hour",              detail: "Target 140–180 mg/dL" },
    { id: "consult", label: "Notify attending / ICU",            timeTarget: "Now",      critical: true },
  ],
  stroke_code: [
    { id: "ct",    label: "Stat CT head (non-contrast)",  timeTarget: "< 25 min", critical: true },
    { id: "cta",   label: "CTA head & neck",              timeTarget: "< 45 min", critical: true },
    { id: "ecg",   label: "12-lead ECG",                  timeTarget: "< 10 min" },
    { id: "labs",  label: "INR, PTT, CBC, BMP, glucose",  timeTarget: "< 45 min", critical: true },
    { id: "neuro", label: "Neurology consult",            timeTarget: "< 15 min", critical: true },
    { id: "npo",   label: "NPO — swallow screen first",   timeTarget: "Now" },
    { id: "iv",    label: "2× large-bore IV access",      timeTarget: "Now" },
  ],
  pediatric_fever: [
    { id: "ua",    label: "Urinalysis + urine culture",          timeTarget: "Now",      critical: true },
    { id: "cx",    label: "Blood culture ×2",                    timeTarget: "< 30 min" },
    { id: "cbc",   label: "CBC, CMP, CRP, procalcitonin",        timeTarget: "< 30 min" },
    { id: "iv",    label: "IV access",                           timeTarget: "Now",      critical: true },
    { id: "temp",  label: "Antipyretic — acetaminophen 15mg/kg", timeTarget: "Now" },
    { id: "wt",    label: "Accurate weight for dosing",          timeTarget: "Now",      critical: true },
    { id: "admit", label: "Admit / observation decision",        timeTarget: "< 2 hours" },
  ],
};

function parseTargetMinutes(timeTarget: string): number | null {
  if (timeTarget === "Now") return 0;
  if (timeTarget === "Ongoing") return null;
  const m = timeTarget.match(/(\d+)\s*(hour|hr|min)/i);
  if (!m) return null;
  const val = parseInt(m[1]);
  return /min/i.test(m[2]) ? val : val * 60;
}

function formatCountdown(remainingMs: number): { label: string; overdue: boolean } {
  const overdue = remainingMs < 0;
  const abs = Math.abs(remainingMs);
  const m = Math.floor(abs / 60000);
  const s = Math.floor((abs % 60000) / 1000);
  return {
    label: overdue ? `-${m}:${s.toString().padStart(2, "0")} overdue` : `${m}:${s.toString().padStart(2, "0")}`,
    overdue,
  };
}

interface BundleChecklistProps {
  protocolType: string;
  patientSeverity?: string;
}

export function BundleChecklist({ protocolType, patientSeverity }: BundleChecklistProps) {
  const items = PROTOCOL_CHECKLISTS[protocolType] ?? [];
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(Date.now());
  const startRef = useRef(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const toggle = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const criticalItems = items.filter((i) => i.critical);
  const criticalDone = criticalItems.filter((i) => checked.has(i.id)).length;
  const criticalPending = criticalItems.filter((i) => !checked.has(i.id));
  const totalDone = checked.size;
  const elapsed = now - startRef.current;

  // Items overdue = critical, unchecked, time elapsed past target
  const overdueCount = criticalPending.filter((i) => {
    const mins = i.timeTarget ? parseTargetMinutes(i.timeTarget) : null;
    if (mins === null) return false;
    return elapsed > mins * 60 * 1000;
  }).length;

  const pct = items.length ? Math.round((totalDone / items.length) * 100) : 0;
  const critPct = criticalItems.length ? Math.round((criticalDone / criticalItems.length) * 100) : 100;

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Protocol Bundle</p>
          {overdueCount > 0 && (
            <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full animate-pulse">
              {overdueCount} overdue
            </span>
          )}
        </div>

        {/* Progress bars */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-14 shrink-0">Critical</span>
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${critPct === 100 ? "bg-green-500" : "bg-red-500"}`}
                style={{ width: `${critPct}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-600 w-8 text-right">
              {criticalDone}/{criticalItems.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-14 shrink-0">Total</span>
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-400 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-600 w-8 text-right">
              {pct}%
            </span>
          </div>
        </div>
      </div>

      {/* Items */}
      <ul className="divide-y divide-gray-50">
        {items.map((item) => {
          const done = checked.has(item.id);
          const targetMins = item.timeTarget ? parseTargetMinutes(item.timeTarget) : null;
          const hasCountdown = targetMins !== null && !done;
          const remainingMs = hasCountdown ? targetMins * 60 * 1000 - elapsed : 0;
          const countdown = hasCountdown ? formatCountdown(remainingMs) : null;
          const isOverdue = countdown?.overdue ?? false;

          return (
            <li
              key={item.id}
              onClick={() => toggle(item.id)}
              className={`flex items-start gap-3 px-4 py-2.5 cursor-pointer transition-colors select-none ${
                done
                  ? "bg-green-50"
                  : isOverdue && item.critical
                  ? "bg-red-50"
                  : "hover:bg-gray-50"
              }`}
            >
              {/* Checkbox */}
              <div
                className={`mt-0.5 flex-shrink-0 h-4 w-4 rounded border-2 flex items-center justify-center transition-all ${
                  done
                    ? "bg-green-500 border-green-500"
                    : isOverdue && item.critical
                    ? "border-red-500 animate-pulse"
                    : item.critical
                    ? "border-red-400"
                    : "border-gray-300"
                }`}
              >
                {done && <span className="text-white text-xs leading-none">✓</span>}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-semibold ${done ? "text-green-700 line-through" : "text-gray-800"}`}>
                    {item.label}
                  </span>
                  {item.critical && !done && (
                    <span className={`text-xs font-bold uppercase ${isOverdue ? "text-red-600" : "text-red-400"}`}>
                      {isOverdue ? "OVERDUE" : "critical"}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {item.timeTarget && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        done
                          ? "text-green-600 bg-green-100"
                          : isOverdue
                          ? "text-red-700 bg-red-100 font-bold"
                          : item.critical
                          ? "text-red-600 bg-red-50"
                          : "text-gray-500 bg-gray-100"
                      }`}
                    >
                      {countdown
                        ? countdown.label
                        : item.timeTarget}
                    </span>
                  )}
                  {item.detail && !isOverdue && (
                    <span className="text-xs text-gray-400 truncate">{item.detail}</span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
