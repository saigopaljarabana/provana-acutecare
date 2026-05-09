"use client";

import { useState } from "react";
import { AllergyAlert, resolveAntibiotic } from "./AllergyAlert";
import { BundleChecklist } from "./BundleChecklist";
import type { GovernedAction } from "@/lib/types";

export type GovernanceResult = {
  outcome: "AUTHORIZED" | "BLOCKED" | "ROUTED";
  message?: string;
};

export interface RuntimeProtocolProps {
  protocolType?: string;
  patientName?: string;
  age?: number;
  temperature?: number;
  bloodPressure?: string;
  heartRate?: number;
  oxygenSat?: number;
  allergies?: string[];
  severity?: string;
  lactate?: number;
  wbc?: number;
  nihssScore?: number;
  lastKnownWell?: string;
  weight?: number;
  status?: string;
  onAction?: (action: GovernedAction) => GovernanceResult;
}

// ─────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────

function Vital({ label, value, alert }: { label: string; value: string; alert: boolean }) {
  return (
    <div
      className={`rounded-lg p-2.5 text-center border ${
        alert ? "bg-red-50 border-red-300" : "bg-gray-50 border-gray-200"
      }`}
    >
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-sm font-bold ${alert ? "text-red-700" : "text-gray-700"}`}>{value}</p>
    </div>
  );
}

function LoadingPulse() {
  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-400 animate-pulse">
      <div className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" />
      <div className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0.1s]" />
      <div className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0.2s]" />
      <span>Analyzing...</span>
    </div>
  );
}

type ActionState = "idle" | "AUTHORIZED" | "BLOCKED" | "ROUTED";

function ActionButton({
  label,
  action,
  onAction,
  variant = "primary",
}: {
  label: string;
  action: GovernedAction;
  onAction?: (action: GovernedAction) => GovernanceResult;
  variant?: "primary" | "warning" | "danger";
}) {
  const [state, setState] = useState<ActionState>("idle");
  const [message, setMessage] = useState("");

  const colorIdle = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    warning: "bg-orange-500 hover:bg-orange-600 text-white",
    danger:  "bg-red-600 hover:bg-red-700 text-white",
  }[variant];

  function handleClick() {
    if (!onAction || state !== "idle") return;
    const result = onAction(action);
    setState(result.outcome);
    setMessage(result.message ?? "");
    // Reset after 4 seconds so the button is reusable in the demo
    setTimeout(() => { setState("idle"); setMessage(""); }, 4000);
  }

  if (state === "AUTHORIZED") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-400 px-3 py-2">
        <span className="text-green-600 font-bold text-sm">✓</span>
        <div>
          <p className="text-xs font-bold text-green-800 uppercase">Authorized</p>
          {message && <p className="text-xs text-green-700">{message}</p>}
        </div>
      </div>
    );
  }

  if (state === "BLOCKED") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-400 px-3 py-2">
        <span className="text-red-600 font-bold text-sm">⛔</span>
        <div>
          <p className="text-xs font-bold text-red-800 uppercase">Blocked</p>
          {message && <p className="text-xs text-red-700">{message}</p>}
        </div>
      </div>
    );
  }

  if (state === "ROUTED") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-orange-50 border border-orange-400 px-3 py-2">
        <span className="text-orange-600 font-bold text-sm">→</span>
        <div>
          <p className="text-xs font-bold text-orange-800 uppercase">Routed</p>
          {message && <p className="text-xs text-orange-700">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={!onAction}
      className={`w-full rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
        onAction ? colorIdle : "bg-gray-200 text-gray-400 cursor-not-allowed"
      }`}
    >
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────
// SEPSIS — fully polished
// ─────────────────────────────────────────────
function SepsisRenderer(p: RuntimeProtocolProps) {
  const allergies = p.allergies ?? [];
  const bp = p.bloodPressure ?? "120/80";
  const systolic = parseInt(bp.split("/")[0] ?? "120");
  const isShock = systolic < 90 || p.severity === "severe";
  const isLoading = p.status === "inProgress" || p.status === "executing";

  const { drug, dose, allergyDriven } = resolveAntibiotic(
    allergies,
    "Piperacillin-Tazobactam",
    "4.5g IV q6h"
  );

  return (
    <div className="rounded-2xl border-2 border-red-500 bg-white shadow-xl overflow-hidden w-full">
      {/* Header */}
      <div className="bg-red-600 px-4 py-3 flex items-center gap-2">
        <span className="text-xl">🚨</span>
        <div className="flex-1">
          <p className="text-white font-bold text-sm leading-tight">SEPSIS ALERT</p>
          <p className="text-red-200 text-xs">SEP-1 Bundle Initiated</p>
        </div>
        {isLoading ? (
          <LoadingPulse />
        ) : (
          <span
            className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${
              p.severity === "severe"
                ? "bg-red-900 text-red-200"
                : "bg-red-100 text-red-700"
            }`}
          >
            {p.severity ?? "moderate"}
          </span>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Patient */}
        <div className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
          <div>
            <p className="text-xs text-gray-500">Patient</p>
            <p className="text-sm font-semibold text-gray-800">
              {p.patientName ?? "Unknown"}, {p.age !== undefined ? `${p.age}y` : "—"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Protocol</p>
            <p className="text-xs font-mono text-gray-600">SEP-1</p>
          </div>
        </div>

        {/* Vitals */}
        <div className="grid grid-cols-3 gap-2">
          <Vital label="Temp" value={`${p.temperature ?? "—"}°F`} alert={(p.temperature ?? 0) > 101} />
          <Vital label="BP" value={bp} alert={systolic < 90} />
          <Vital label="HR" value={`${p.heartRate ?? "—"}`} alert={(p.heartRate ?? 0) > 100} />
          <Vital label="SpO₂" value={`${p.oxygenSat ?? "—"}%`} alert={(p.oxygenSat ?? 100) < 95} />
          {p.lactate !== undefined && (
            <Vital label="Lactate" value={`${p.lactate} mmol/L`} alert={p.lactate > 2} />
          )}
          {p.wbc !== undefined && (
            <Vital label="WBC" value={`${p.wbc}k`} alert={p.wbc > 12 || p.wbc < 4} />
          )}
        </div>

        {/* Allergy mutation */}
        {allergies.length > 0 && <AllergyAlert allergies={allergies} />}

        {/* Treatment panel */}
        <div
          className={`rounded-xl border-2 p-3 ${
            allergyDriven ? "border-orange-400 bg-orange-50" : "border-green-400 bg-green-50"
          }`}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-base">💊</span>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              Antibiotic Order
              {allergyDriven && (
                <span className="ml-1.5 text-orange-600 normal-case font-semibold">
                  (allergy-adjusted)
                </span>
              )}
            </p>
          </div>
          <p className="text-base font-bold text-gray-900">{drug}</p>
          <p className="text-sm text-gray-600 mt-0.5">{dose}</p>
          <p className="text-xs text-gray-400 mt-1 mb-3">Administer within 1 hour of diagnosis</p>
          <ActionButton
            label={`Order ${drug}`}
            action="order_antibiotics"
            onAction={p.onAction}
            variant="primary"
          />
        </div>

        {/* Vasopressor banner */}
        {isShock && (
          <div className="rounded-xl border-2 border-orange-400 bg-orange-50 p-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="text-base">⚡</span>
              <p className="text-xs font-bold text-orange-800 uppercase">Vasopressor Indicated</p>
            </div>
            <p className="text-sm font-semibold text-orange-900">Norepinephrine</p>
            <p className="text-xs text-orange-700">0.01–3 mcg/kg/min IV — titrate to MAP ≥65</p>
            <ActionButton
              label="Activate MTP / Vasopressor Order"
              action="activate_mtp"
              onAction={p.onAction}
              variant="warning"
            />
          </div>
        )}

        {/* Fluid order */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 flex items-center gap-3">
          <span className="text-xl">💧</span>
          <div>
            <p className="text-sm font-bold text-blue-900">30 mL/kg Crystalloid Bolus</p>
            <p className="text-xs text-blue-600">Lactated Ringer's preferred over NS</p>
          </div>
        </div>

        {/* Escalate */}
        <ActionButton
          label="Escalate to Attending"
          action="escalate_to_doctor"
          onAction={p.onAction}
          variant="danger"
        />

        <BundleChecklist protocolType="sepsis_bundle" patientSeverity={p.severity} />
        <p className="text-xs text-gray-400 text-center">AI-generated • Not for clinical use</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// STROKE — lightweight mock
// ─────────────────────────────────────────────
function StrokeRenderer(p: RuntimeProtocolProps) {
  const bp = p.bloodPressure ?? "120/80";
  const systolic = parseInt(bp.split("/")[0] ?? "120");
  const nihss = p.nihssScore ?? 0;
  const lkwHours = (() => {
    const m = (p.lastKnownWell ?? "").match(/(\d+(?:\.\d+)?)\s*(hour|hr|minute|min)/i);
    if (!m) return null;
    const v = parseFloat(m[1]);
    return /min/i.test(m[2]) ? v / 60 : v;
  })();
  const tpaEligible =
    lkwHours !== null && lkwHours <= 4.5 && nihss >= 4 && nihss <= 25 && systolic <= 185;
  const isLoading = p.status === "inProgress" || p.status === "executing";

  return (
    <div className="rounded-2xl border-2 border-purple-500 bg-white shadow-xl overflow-hidden w-full">
      <div className="bg-purple-700 px-4 py-3 flex items-center gap-2">
        <span className="text-xl">🧠</span>
        <div className="flex-1">
          <p className="text-white font-bold text-sm">CODE STROKE</p>
          <p className="text-purple-200 text-xs">Acute Ischemic Protocol</p>
        </div>
        {isLoading && <LoadingPulse />}
      </div>

      <div className="p-4 space-y-3">
        {/* Patient */}
        <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
          <p className="text-xs text-gray-500">Patient</p>
          <p className="text-sm font-semibold text-gray-800">
            {p.patientName ?? "Unknown"}, {p.age !== undefined ? `${p.age}y` : "—"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Vital label="NIHSS" value={`${nihss}`} alert={nihss >= 5} />
          <Vital label="BP" value={bp} alert={systolic > 180} />
          <Vital label="SpO₂" value={`${p.oxygenSat ?? "—"}%`} alert={(p.oxygenSat ?? 100) < 94} />
          <Vital label="HR" value={`${p.heartRate ?? "—"}`} alert={false} />
        </div>

        {p.lastKnownWell && (
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
            <p className="text-xs text-purple-600 font-semibold uppercase">Last Known Well</p>
            <p className="text-sm font-bold text-purple-900 mt-0.5">{p.lastKnownWell}</p>
          </div>
        )}

        {p.allergies && p.allergies.length > 0 && (
          <AllergyAlert allergies={p.allergies} compact />
        )}

        {/* tPA eligibility + action */}
        <div
          className={`rounded-xl p-3 border-2 space-y-2 ${
            tpaEligible ? "bg-green-50 border-green-500" : "bg-red-50 border-red-400"
          }`}
        >
          <p className={`text-sm font-bold ${tpaEligible ? "text-green-800" : "text-red-700"}`}>
            {tpaEligible ? "✅ tPA CANDIDATE" : "❌ tPA NOT indicated"}
          </p>
          {tpaEligible && (
            <p className="text-xs text-green-700">
              Alteplase 0.9 mg/kg IV (max 90 mg) — 10% bolus, rest over 60 min
            </p>
          )}
          {systolic > 185 && (
            <p className="text-xs text-orange-700">
              ⚠️ Treat hypertension to &lt;185/110 before tPA
            </p>
          )}
          {lkwHours !== null && lkwHours > 4.5 && (
            <p className="text-xs text-red-600">
              {lkwHours.toFixed(1)}h from last known well — outside 4.5h window
            </p>
          )}
          {tpaEligible && (
            <ActionButton
              label="Authorize tPA (Alteplase)"
              action="order_tpa"
              onAction={p.onAction}
              variant="danger"
            />
          )}
        </div>

        <ActionButton
          label="Escalate to Attending"
          action="escalate_to_doctor"
          onAction={p.onAction}
          variant="warning"
        />

        <BundleChecklist protocolType="stroke_code" />
        <p className="text-xs text-gray-400 text-center">AI-generated • Not for clinical use</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PEDIATRIC FEVER — lightweight mock
// ─────────────────────────────────────────────
function PediatricRenderer(p: RuntimeProtocolProps) {
  const age = p.age ?? 0;
  const ageMonths = Math.round(age * 12);
  const isHighRisk = age < 0.25;
  const weight = p.weight;
  const isLoading = p.status === "inProgress" || p.status === "executing";

  const antipyreticDose = weight
    ? `Acetaminophen ${(weight * 15).toFixed(0)} mg q4-6h`
    : "Acetaminophen 15 mg/kg q4-6h";

  const antibioticDose = isHighRisk
    ? weight
      ? `Ampicillin ${(weight * 50).toFixed(0)} mg IV q6h + Gentamicin ${(weight * 4).toFixed(1)} mg IV q24h`
      : "Ampicillin + Gentamicin IV"
    : weight
    ? `Ceftriaxone ${Math.min(weight * 50, 2000).toFixed(0)} mg IV`
    : "Ceftriaxone 50 mg/kg IV (max 2g)";

  const borderColor = isHighRisk ? "border-red-500" : "border-amber-500";
  const headerBg = isHighRisk ? "bg-red-600" : "bg-amber-500";

  return (
    <div className={`rounded-2xl border-2 ${borderColor} bg-white shadow-xl overflow-hidden w-full`}>
      <div className={`${headerBg} px-4 py-3 flex items-center gap-2`}>
        <span className="text-xl">🌡️</span>
        <div className="flex-1">
          <p className="text-white font-bold text-sm">PEDIATRIC FEVER</p>
          <p className={`text-xs ${isHighRisk ? "text-red-200" : "text-yellow-100"}`}>
            {isHighRisk ? "⚠️ High-Risk Age Group" : "Standard Evaluation"}
          </p>
        </div>
        {isLoading && <LoadingPulse />}
      </div>

      <div className="p-4 space-y-3">
        <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
          <p className="text-xs text-gray-500">Patient</p>
          <p className="text-sm font-semibold text-gray-800">
            {p.patientName ?? "Unknown"}, {ageMonths}mo
            {weight && <span className="text-gray-500 ml-2">{weight} kg</span>}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Vital label="Temp" value={`${p.temperature ?? "—"}°F`} alert={(p.temperature ?? 0) > 100.4} />
          <Vital label="HR" value={`${p.heartRate ?? "—"}`} alert={(p.heartRate ?? 0) > 150} />
          <Vital label="SpO₂" value={`${p.oxygenSat ?? "—"}%`} alert={(p.oxygenSat ?? 100) < 95} />
          <Vital label="Weight" value={weight ? `${weight} kg` : "—"} alert={false} />
        </div>

        {isHighRisk && (
          <div className="rounded-xl border-2 border-red-400 bg-red-50 p-3">
            <p className="text-xs font-bold text-red-700 uppercase">Full Sepsis Workup Required</p>
            <p className="text-xs text-red-600 mt-1">LP + blood Cx + UA — do not defer antibiotics &gt;1h</p>
          </div>
        )}

        {/* Dosing + order button */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
          <p className="text-xs font-bold text-gray-600 uppercase">Weight-Based Dosing</p>
          <p className="text-xs font-semibold text-gray-800">{antipyreticDose}</p>
          <p className="text-xs font-semibold text-gray-800">{antibioticDose}</p>
          <ActionButton
            label="Order Antibiotics"
            action="order_antibiotics"
            onAction={p.onAction}
            variant="primary"
          />
        </div>

        <ActionButton
          label="Escalate to Attending"
          action="escalate_to_doctor"
          onAction={p.onAction}
          variant="warning"
        />

        <BundleChecklist protocolType="pediatric_fever" />
        <p className="text-xs text-gray-400 text-center">AI-generated • Not for clinical use</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main router
// ─────────────────────────────────────────────
export function ProtocolRenderer(props: RuntimeProtocolProps) {
  const type = props.protocolType;

  if (!type) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
        Awaiting protocol detection...
      </div>
    );
  }

  if (type === "sepsis" || type === "sepsis_bundle") return <SepsisRenderer {...props} />;
  if (type === "stroke" || type === "stroke_code") return <StrokeRenderer {...props} />;
  if (type === "pediatric_fever") return <PediatricRenderer {...props} />;

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
      Unknown protocol: <span className="font-mono font-semibold">{type}</span>
    </div>
  );
}
