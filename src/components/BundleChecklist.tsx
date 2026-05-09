"use client";

import { useState } from "react";

interface ChecklistItem {
  id: string;
  label: string;
  timeTarget?: string;
  critical?: boolean;
  detail?: string;
}

const PROTOCOL_CHECKLISTS: Record<string, ChecklistItem[]> = {
  sepsis_bundle: [
    { id: "cx", label: "Blood cultures ×2", timeTarget: "Now", critical: true, detail: "Before first antibiotic dose" },
    { id: "abx", label: "Broad-spectrum antibiotics", timeTarget: "< 1 hour", critical: true, detail: "See treatment panel for agent selection" },
    { id: "lactate", label: "Serum lactate", timeTarget: "Now", critical: true, detail: "Repeat q2h if initial >2 mmol/L" },
    { id: "fluids", label: "30 mL/kg crystalloid bolus", timeTarget: "< 3 hours", critical: true, detail: "NS or LR — reassess after each 500 mL" },
    { id: "uo", label: "Urine output monitoring", timeTarget: "Ongoing", detail: "Target ≥0.5 mL/kg/h — consider Foley" },
    { id: "map", label: "MAP target ≥65 mmHg", timeTarget: "Ongoing", detail: "Vasopressors if not responsive to fluids" },
    { id: "glucose", label: "Blood glucose", timeTarget: "< 1 hour", detail: "Target 140–180 mg/dL" },
    { id: "consult", label: "Notify attending / ICU", timeTarget: "Now", critical: true },
  ],
  stroke_code: [
    { id: "ct", label: "Stat CT head (non-contrast)", timeTarget: "< 25 min", critical: true },
    { id: "cta", label: "CTA head & neck", timeTarget: "< 45 min", critical: true },
    { id: "ecg", label: "12-lead ECG", timeTarget: "< 10 min" },
    { id: "labs", label: "INR, PTT, CBC, BMP, glucose", timeTarget: "< 45 min", critical: true },
    { id: "neuro", label: "Neurology consult", timeTarget: "< 15 min", critical: true },
    { id: "npo", label: "NPO — swallow screen first", timeTarget: "Now" },
    { id: "iv", label: "2 large-bore IV access", timeTarget: "Now" },
  ],
  pediatric_fever: [
    { id: "ua", label: "Urinalysis + urine culture", timeTarget: "Now", critical: true },
    { id: "cx", label: "Blood culture ×2", timeTarget: "< 30 min" },
    { id: "cbc", label: "CBC, CMP, CRP, procalcitonin", timeTarget: "< 30 min" },
    { id: "iv", label: "IV access", timeTarget: "Now", critical: true },
    { id: "temp", label: "Antipyretic — acetaminophen 15mg/kg", timeTarget: "Now" },
    { id: "wt", label: "Accurate weight for dosing", timeTarget: "Now", critical: true },
    { id: "admit", label: "Admit / observation decision", timeTarget: "< 2 hours" },
  ],
};

interface BundleChecklistProps {
  protocolType: string;
  patientSeverity?: string;
}

export function BundleChecklist({ protocolType, patientSeverity }: BundleChecklistProps) {
  const items = PROTOCOL_CHECKLISTS[protocolType] ?? [];
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const criticalItems = items.filter((i) => i.critical);
  const criticalDone = criticalItems.filter((i) => checked.has(i.id)).length;
  const totalDone = checked.size;

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
        <div>
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Protocol Bundle</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {criticalDone}/{criticalItems.length} critical • {totalDone}/{items.length} total
          </p>
        </div>
        <div className="flex items-center gap-1">
          <div
            className={`h-2 rounded-full transition-all duration-500 bg-green-400`}
            style={{ width: `${Math.max((totalDone / items.length) * 60, 4)}px` }}
          />
          <span className="text-xs font-semibold text-gray-600">
            {Math.round((totalDone / items.length) * 100)}%
          </span>
        </div>
      </div>

      {/* Items */}
      <ul className="divide-y divide-gray-50">
        {items.map((item) => {
          const done = checked.has(item.id);
          return (
            <li
              key={item.id}
              onClick={() => toggle(item.id)}
              className={`flex items-start gap-3 px-4 py-2.5 cursor-pointer transition-colors select-none ${
                done ? "bg-green-50" : "hover:bg-gray-50"
              }`}
            >
              {/* Checkbox */}
              <div
                className={`mt-0.5 flex-shrink-0 h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${
                  done ? "bg-green-500 border-green-500" : item.critical ? "border-red-400" : "border-gray-300"
                }`}
              >
                {done && <span className="text-white text-xs leading-none">✓</span>}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs font-semibold ${done ? "text-green-700 line-through" : "text-gray-800"}`}
                  >
                    {item.label}
                  </span>
                  {item.critical && !done && (
                    <span className="text-xs font-bold text-red-600 uppercase">critical</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.timeTarget && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        done
                          ? "text-green-600 bg-green-100"
                          : item.critical
                          ? "text-red-700 bg-red-100"
                          : "text-gray-500 bg-gray-100"
                      }`}
                    >
                      {item.timeTarget}
                    </span>
                  )}
                  {item.detail && (
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
