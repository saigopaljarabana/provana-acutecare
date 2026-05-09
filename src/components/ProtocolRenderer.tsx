"use client";

import { useState, useEffect, useRef } from "react";
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
  onAuthorized?: (action: GovernedAction, detail: string) => void;
}

// ─────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────

function useProtocolClock() {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());
  useEffect(() => {
    const id = setInterval(
      () => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)),
      1000
    );
    return () => clearInterval(id);
  }, []);
  const m = Math.floor(elapsed / 60);
  const s = (elapsed % 60).toString().padStart(2, "0");
  return `${m}m ${s}s`;
}

// ─────────────────────────────────────────────
// Skeleton loader — shown while AI streams args
// ─────────────────────────────────────────────

function SkeletonBar({ w = "full" }: { w?: string }) {
  return <div className={`h-3 bg-gray-200 rounded animate-pulse w-${w}`} />;
}

function CardSkeleton({ color }: { color: string }) {
  return (
    <div className={`rounded-2xl border-2 ${color} bg-white shadow-xl overflow-hidden w-full`}>
      <div className="bg-gray-300 animate-pulse px-4 py-3 h-14" />
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-gray-200 p-2.5 space-y-1.5">
              <SkeletonBar w="1/2" />
              <SkeletonBar w="3/4" />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <SkeletonBar w="full" />
          <SkeletonBar w="5/6" />
          <SkeletonBar w="4/6" />
        </div>
        <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Vitals
// ─────────────────────────────────────────────

function Vital({
  label,
  value,
  alert,
  unit,
}: {
  label: string;
  value: string;
  alert: boolean;
  unit?: string;
}) {
  return (
    <div
      className={`rounded-lg p-2.5 text-center border relative overflow-hidden transition-colors ${
        alert ? "bg-red-50 border-red-300" : "bg-gray-50 border-gray-200"
      }`}
    >
      {alert && (
        <span className="absolute inset-0 rounded-lg border-2 border-red-400 animate-ping opacity-20 pointer-events-none" />
      )}
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-sm font-bold ${alert ? "text-red-700" : "text-gray-700"}`}>
        {value}
        {unit && <span className="text-xs font-normal ml-0.5">{unit}</span>}
      </p>
    </div>
  );
}

function ProtocolClock({ label, clock }: { label: string; clock: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-black/20 rounded px-2 py-0.5">
      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
      <span className="text-white text-xs font-mono font-semibold">
        {label} {clock}
      </span>
    </div>
  );
}

function LoadingPulse() {
  return (
    <div className="flex items-center gap-1.5 text-xs text-white/70 animate-pulse">
      <div className="h-1.5 w-1.5 rounded-full bg-white animate-bounce" />
      <div className="h-1.5 w-1.5 rounded-full bg-white animate-bounce [animation-delay:0.1s]" />
      <div className="h-1.5 w-1.5 rounded-full bg-white animate-bounce [animation-delay:0.2s]" />
      <span>Analyzing...</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// ActionButton — confirm → tweak → execute
// ─────────────────────────────────────────────

type ActionState = "idle" | "confirming" | "AUTHORIZED" | "BLOCKED" | "ROUTED";

function ActionButton({
  label,
  action,
  onAction,
  onAuthorized,
  detail,
  variant = "primary",
  doseOptions,
}: {
  label: string;
  action: GovernedAction;
  onAction?: (action: GovernedAction) => GovernanceResult;
  onAuthorized?: (action: GovernedAction, detail: string) => void;
  detail: string;
  variant?: "primary" | "warning" | "danger";
  doseOptions?: string[];
}) {
  const [state, setState] = useState<ActionState>("idle");
  const [selectedDose, setSelectedDose] = useState(doseOptions?.[0] ?? "");
  const [resultMsg, setResultMsg] = useState("");
  const [pendingResult, setPendingResult] = useState<GovernanceResult | null>(null);

  const idleColor = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white border-blue-700",
    warning: "bg-orange-500 hover:bg-orange-600 text-white border-orange-600",
    danger:  "bg-red-600 hover:bg-red-700 text-white border-red-700",
  }[variant];

  const confirmBg = {
    primary: "border-blue-300 bg-blue-50",
    warning: "border-orange-300 bg-orange-50",
    danger:  "border-red-300 bg-red-50",
  }[variant];

  const confirmText = {
    primary: "text-blue-800",
    warning: "text-orange-800",
    danger:  "text-red-800",
  }[variant];

  function handleClick() {
    if (!onAction || state !== "idle") return;
    const result = onAction(action);
    if (result.outcome === "BLOCKED" || result.outcome === "ROUTED") {
      setState(result.outcome);
      setResultMsg(result.message ?? "");
      setTimeout(() => { setState("idle"); setResultMsg(""); }, 5000);
      return;
    }
    // AUTHORIZED: store result and show confirm panel (don't call onAction again)
    setPendingResult(result);
    setState("confirming");
  }

  function handleConfirm() {
    if (!pendingResult) return;
    setState(pendingResult.outcome);
    setResultMsg(pendingResult.message ?? "");
    if (pendingResult.outcome === "AUTHORIZED" && onAuthorized) {
      onAuthorized(action, detail);
    }
    setPendingResult(null);
    setTimeout(() => { setState("idle"); setResultMsg(""); }, 5000);
  }

  function handleCancel() {
    setState("idle");
    setPendingResult(null);
  }

  if (state === "confirming") {
    return (
      <div className={`rounded-xl border-2 ${confirmBg} p-3 space-y-3`}>
        <div>
          <p className={`text-xs font-bold uppercase tracking-wide ${confirmText}`}>
            Confirm Order
          </p>
          {detail && (
            <p className={`text-sm font-semibold mt-0.5 ${confirmText}`}>{detail}</p>
          )}
        </div>

        {/* Dose tweak */}
        {doseOptions && doseOptions.length > 1 && (
          <div>
            <p className="text-xs text-gray-500 mb-1.5 font-medium">Adjust dose:</p>
            <div className="flex flex-col gap-1">
              {doseOptions.map((d) => (
                <label
                  key={d}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 cursor-pointer transition-colors ${
                    selectedDose === d
                      ? "border-blue-400 bg-white"
                      : "border-gray-200 bg-white/60 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name={`dose-${action}`}
                    value={d}
                    checked={selectedDose === d}
                    onChange={() => setSelectedDose(d)}
                    className="accent-blue-600"
                  />
                  <span className="text-xs font-medium text-gray-800">{d}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            className="flex-1 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold uppercase py-2 transition-colors"
          >
            ✓ Confirm
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold uppercase py-2 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (state === "AUTHORIZED") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-green-50 border-2 border-green-400 px-3 py-2.5">
        <span className="text-green-600 font-bold text-base">✓</span>
        <div>
          <p className="text-xs font-bold text-green-800 uppercase tracking-wide">Order Placed</p>
          {resultMsg && <p className="text-xs text-green-700 mt-0.5">{resultMsg}</p>}
        </div>
      </div>
    );
  }

  if (state === "BLOCKED") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-red-50 border-2 border-red-400 px-3 py-2.5">
        <span className="text-red-600 font-bold text-base">⛔</span>
        <div>
          <p className="text-xs font-bold text-red-800 uppercase tracking-wide">Access Denied</p>
          {resultMsg && <p className="text-xs text-red-700 mt-0.5">{resultMsg}</p>}
        </div>
      </div>
    );
  }

  if (state === "ROUTED") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-orange-50 border-2 border-orange-400 px-3 py-2.5">
        <span className="text-orange-500 font-bold text-base">→</span>
        <div>
          <p className="text-xs font-bold text-orange-800 uppercase tracking-wide">Routed</p>
          {resultMsg && <p className="text-xs text-orange-700 mt-0.5">{resultMsg}</p>}
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={!onAction}
      className={`w-full rounded-lg px-3 py-2.5 text-xs font-bold uppercase tracking-wide border transition-all active:scale-95 ${
        onAction ? idleColor : "bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed"
      }`}
    >
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────
// SEPSIS
// ─────────────────────────────────────────────

function SepsisRenderer(p: RuntimeProtocolProps) {
  const allergies = p.allergies ?? [];
  const bp = p.bloodPressure ?? "120/80";
  const systolic = parseInt(bp.split("/")[0] ?? "120");
  const isShock = systolic < 90 || p.severity === "severe";
  const isLoading = p.status === "inProgress" || p.status === "executing";
  const clock = useProtocolClock();

  const { drug, dose, allergyDriven } = resolveAntibiotic(
    allergies,
    "Piperacillin-Tazobactam",
    "4.5g IV q6h"
  );

  const criticalCount = [
    (p.temperature ?? 0) > 101,
    systolic < 90,
    (p.heartRate ?? 0) > 110,
    (p.lactate ?? 0) > 2,
  ].filter(Boolean).length;

  // Show skeleton until at least vitals are filled
  if (isLoading && !p.temperature && !p.heartRate) {
    return <CardSkeleton color="border-red-500" />;
  }

  // Dose options for confirm/tweak step
  const doseOptions = allergyDriven
    ? [`${dose} (allergy-adjusted)`, `${dose.replace("q8h", "q12h")} (renal adj.)`]
    : [dose, "3.375g IV q6h (renal adj.)", "4.5g IV q4h (severe)"];

  return (
    <div className="rounded-2xl border-2 border-red-500 bg-white shadow-xl overflow-hidden w-full">
      <div className={`px-4 py-3 flex items-center gap-2 ${isShock ? "bg-red-700" : "bg-red-600"}`}>
        <span className="text-xl">🚨</span>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-tight">SEPSIS ALERT — SEP-1</p>
          <p className="text-red-200 text-xs truncate">
            {p.patientName ?? "Unknown"}{p.age !== undefined ? `, ${p.age}y` : ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {isLoading ? <LoadingPulse /> : <ProtocolClock label="SEP-1" clock={clock} />}
          <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
            p.severity === "severe" ? "bg-red-900 text-red-200" : "bg-red-100 text-red-700"
          }`}>
            {p.severity ?? "moderate"}
          </span>
        </div>
      </div>

      {criticalCount >= 2 && (
        <div className="bg-red-100 border-b border-red-300 px-4 py-1.5 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <p className="text-xs font-bold text-red-700 uppercase tracking-wide">
            {criticalCount} critical vitals — immediate intervention required
          </p>
        </div>
      )}

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <Vital label="Temp" value={`${p.temperature ?? "—"}°F`} alert={(p.temperature ?? 0) > 101} />
          <Vital label="BP" value={bp} alert={systolic < 90} />
          <Vital label="HR" value={`${p.heartRate ?? "—"}`} unit="bpm" alert={(p.heartRate ?? 0) > 100} />
          <Vital label="SpO₂" value={`${p.oxygenSat ?? "—"}%`} alert={(p.oxygenSat ?? 100) < 95} />
          {p.lactate !== undefined && (
            <Vital label="Lactate" value={`${p.lactate}`} unit="mmol/L" alert={p.lactate > 2} />
          )}
          {p.wbc !== undefined && (
            <Vital label="WBC" value={`${p.wbc}k`} alert={p.wbc > 12 || p.wbc < 4} />
          )}
        </div>

        {allergies.length > 0 && <AllergyAlert allergies={allergies} />}

        {/* Treatment — confirm + tweak inline */}
        <div className={`rounded-xl border-2 p-3 space-y-3 ${
          allergyDriven ? "border-orange-400 bg-orange-50" : "border-green-400 bg-green-50"
        }`}>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span>💊</span>
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
            <p className="text-sm text-gray-600">{dose}</p>
            <p className="text-xs text-gray-400 mt-0.5">Administer within 1 hour of diagnosis</p>
          </div>
          <ActionButton
            label={`Order ${drug}`}
            action="order_antibiotics"
            onAction={p.onAction}
            onAuthorized={p.onAuthorized}
            detail={`${drug} ${dose} ordered for ${p.patientName ?? "patient"}`}
            variant="primary"
            doseOptions={doseOptions}
          />
        </div>

        {isShock && (
          <div className="rounded-xl border-2 border-orange-400 bg-orange-50 p-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <span>⚡</span>
              <p className="text-xs font-bold text-orange-800 uppercase">Vasopressor Indicated</p>
            </div>
            <p className="text-sm font-semibold text-orange-900">Norepinephrine</p>
            <p className="text-xs text-orange-700">0.01–3 mcg/kg/min IV — titrate to MAP ≥65</p>
            <ActionButton
              label="Activate Vasopressor Protocol"
              action="activate_mtp"
              onAction={p.onAction}
              onAuthorized={p.onAuthorized}
              detail={`Norepinephrine vasopressor activated for ${p.patientName ?? "patient"}, MAP target ≥65`}
              variant="warning"
              doseOptions={[
                "0.01 mcg/kg/min (start low)",
                "0.05 mcg/kg/min (moderate shock)",
                "0.1 mcg/kg/min (severe shock)",
              ]}
            />
          </div>
        )}

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 flex items-center gap-3">
          <span className="text-xl">💧</span>
          <div>
            <p className="text-sm font-bold text-blue-900">30 mL/kg Crystalloid Bolus</p>
            <p className="text-xs text-blue-600">Lactated Ringer's preferred over NS</p>
          </div>
        </div>

        <ActionButton
          label="Escalate to Attending"
          action="escalate_to_doctor"
          onAction={p.onAction}
          onAuthorized={p.onAuthorized}
          detail={`Sepsis case escalated to Attending for ${p.patientName ?? "patient"}, severity ${p.severity ?? "high"}`}
          variant="danger"
        />

        <BundleChecklist protocolType="sepsis_bundle" patientSeverity={p.severity} />
        <p className="text-xs text-gray-400 text-center">AI-generated • Not for clinical use</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// STROKE
// ─────────────────────────────────────────────

function StrokeRenderer(p: RuntimeProtocolProps) {
  const bp = p.bloodPressure ?? "120/80";
  const systolic = parseInt(bp.split("/")[0] ?? "120");
  const nihss = p.nihssScore ?? 0;
  const isLoading = p.status === "inProgress" || p.status === "executing";
  const clock = useProtocolClock();

  const lkwHours = (() => {
    const m = (p.lastKnownWell ?? "").match(/(\d+(?:\.\d+)?)\s*(hour|hr|minute|min)/i);
    if (!m) return null;
    const v = parseFloat(m[1]);
    return /min/i.test(m[2]) ? v / 60 : v;
  })();

  const tpaEligible =
    lkwHours !== null && lkwHours <= 4.5 && nihss >= 4 && nihss <= 25 && systolic <= 185;
  const windowRemaining = lkwHours !== null ? Math.max(0, 4.5 - lkwHours) : null;

  if (isLoading && !p.nihssScore && !p.bloodPressure) {
    return <CardSkeleton color="border-purple-500" />;
  }

  return (
    <div className="rounded-2xl border-2 border-purple-500 bg-white shadow-xl overflow-hidden w-full">
      <div className="bg-purple-700 px-4 py-3 flex items-center gap-2">
        <span className="text-xl">🧠</span>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm">CODE STROKE</p>
          <p className="text-purple-200 text-xs truncate">
            {p.patientName ?? "Unknown"}{p.age !== undefined ? `, ${p.age}y` : ""}
          </p>
        </div>
        <div className="shrink-0">
          {isLoading ? <LoadingPulse /> : <ProtocolClock label="Stroke" clock={clock} />}
        </div>
      </div>

      {windowRemaining !== null && (
        <div className={`px-4 py-1.5 border-b flex items-center gap-2 ${
          windowRemaining < 1
            ? "bg-red-100 border-red-300"
            : "bg-purple-50 border-purple-200"
        }`}>
          <span className={`h-2 w-2 rounded-full ${windowRemaining < 1 ? "bg-red-500 animate-pulse" : "bg-purple-400"}`} />
          <span className={`text-xs font-bold ${windowRemaining < 1 ? "text-red-700" : "text-purple-700"}`}>
            tPA window: {windowRemaining < 1
              ? "CRITICAL — < 1 hour remaining"
              : `${windowRemaining.toFixed(1)}h remaining`}
          </span>
        </div>
      )}

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Vital label="NIHSS" value={`${nihss}`} alert={nihss >= 5} />
          <Vital label="BP" value={bp} alert={systolic > 180} />
          <Vital label="SpO₂" value={`${p.oxygenSat ?? "—"}%`} alert={(p.oxygenSat ?? 100) < 94} />
          <Vital label="HR" value={`${p.heartRate ?? "—"}`} unit="bpm" alert={false} />
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

        <div className={`rounded-xl p-3 border-2 space-y-2 ${
          tpaEligible ? "bg-green-50 border-green-500" : "bg-red-50 border-red-400"
        }`}>
          <p className={`text-sm font-bold ${tpaEligible ? "text-green-800" : "text-red-700"}`}>
            {tpaEligible ? "✅ tPA CANDIDATE" : "❌ tPA NOT indicated"}
          </p>
          {tpaEligible && (
            <p className="text-xs text-green-700">
              Alteplase 0.9 mg/kg IV (max 90 mg) — 10% bolus over 1 min, remainder over 60 min
            </p>
          )}
          {systolic > 185 && (
            <p className="text-xs text-orange-700">
              ⚠️ Treat BP to &lt;185/110 before administering tPA
            </p>
          )}
          {lkwHours !== null && lkwHours > 4.5 && (
            <p className="text-xs text-red-600">
              {lkwHours.toFixed(1)}h since last known well — outside 4.5h window
            </p>
          )}
          {tpaEligible && (
            <ActionButton
              label="Authorize tPA"
              action="order_tpa"
              onAction={p.onAction}
              onAuthorized={p.onAuthorized}
              detail={`Alteplase 0.9 mg/kg authorized for ${p.patientName ?? "patient"}, last known well ${p.lastKnownWell ?? "within window"}`}
              variant="danger"
              doseOptions={[
                "0.9 mg/kg IV (standard — max 90mg)",
                "0.6 mg/kg IV (low-dose — select studies)",
              ]}
            />
          )}
        </div>

        <ActionButton
          label="Escalate to Attending"
          action="escalate_to_doctor"
          onAction={p.onAction}
          onAuthorized={p.onAuthorized}
          detail={`Stroke case escalated to Attending for ${p.patientName ?? "patient"}, NIHSS ${p.nihssScore ?? "unknown"}`}
          variant="warning"
        />

        <BundleChecklist protocolType="stroke_code" />
        <p className="text-xs text-gray-400 text-center">AI-generated • Not for clinical use</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PEDIATRIC FEVER
// ─────────────────────────────────────────────

function PediatricRenderer(p: RuntimeProtocolProps) {
  const age = p.age ?? 0;
  const ageMonths = Math.round(age * 12);
  const isHighRisk = age < 0.25;
  const weight = p.weight;
  const isLoading = p.status === "inProgress" || p.status === "executing";
  const clock = useProtocolClock();

  const antipyreticDose = weight
    ? `Acetaminophen ${(weight * 15).toFixed(0)} mg q4-6h`
    : "Acetaminophen 15 mg/kg q4-6h";

  const antibioticDrug = isHighRisk ? "Ampicillin + Gentamicin" : "Ceftriaxone";
  const antibioticDose = isHighRisk
    ? weight
      ? `Ampicillin ${(weight * 50).toFixed(0)} mg IV q6h + Gentamicin ${(weight * 4).toFixed(1)} mg IV q24h`
      : "Ampicillin 50 mg/kg IV q6h + Gentamicin 4 mg/kg IV q24h"
    : weight
    ? `${Math.min(weight * 50, 2000).toFixed(0)} mg IV once`
    : "50 mg/kg IV (max 2g)";

  const abxDoseOptions = isHighRisk
    ? [antibioticDose, "Ampicillin + Gentamicin (meningitis dosing — consult ID)"]
    : [
        antibioticDose,
        weight ? `${Math.min(weight * 100, 4000).toFixed(0)} mg IV (meningitis dose)` : "100 mg/kg IV (meningitis dose)",
      ];

  if (isLoading && !p.temperature && !p.heartRate) {
    return <CardSkeleton color="border-amber-500" />;
  }

  return (
    <div className={`rounded-2xl border-2 ${isHighRisk ? "border-red-500" : "border-amber-500"} bg-white shadow-xl overflow-hidden w-full`}>
      <div className={`${isHighRisk ? "bg-red-600" : "bg-amber-500"} px-4 py-3 flex items-center gap-2`}>
        <span className="text-xl">🌡️</span>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm">PEDIATRIC FEVER</p>
          <p className={`text-xs ${isHighRisk ? "text-red-200" : "text-yellow-100"} truncate`}>
            {p.patientName ?? "Unknown"}, {ageMonths}mo{weight ? ` · ${weight} kg` : ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {isLoading ? <LoadingPulse /> : <ProtocolClock label="Peds" clock={clock} />}
          {isHighRisk && (
            <span className="text-xs font-bold bg-red-900 text-red-200 px-2 py-0.5 rounded-full">
              HIGH RISK
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Vital label="Temp" value={`${p.temperature ?? "—"}°F`} alert={(p.temperature ?? 0) > 100.4} />
          <Vital label="HR" value={`${p.heartRate ?? "—"}`} unit="bpm" alert={(p.heartRate ?? 0) > 150} />
          <Vital label="SpO₂" value={`${p.oxygenSat ?? "—"}%`} alert={(p.oxygenSat ?? 100) < 95} />
          <Vital label="Weight" value={weight ? `${weight} kg` : "—"} alert={false} />
        </div>

        {isHighRisk && (
          <div className="rounded-xl border-2 border-red-400 bg-red-50 p-3">
            <p className="text-xs font-bold text-red-700 uppercase">Full Sepsis Workup Required</p>
            <p className="text-xs text-red-600 mt-1">
              LP + blood Cx + UA — do not defer antibiotics &gt;1h
            </p>
          </div>
        )}

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
          <p className="text-xs font-bold text-gray-600 uppercase">Weight-Based Dosing</p>
          <p className="text-xs text-gray-700">{antipyreticDose}</p>
          <p className="text-xs font-semibold text-gray-800">{antibioticDrug} · {antibioticDose}</p>
          <ActionButton
            label={`Order ${antibioticDrug}`}
            action="order_antibiotics"
            onAction={p.onAction}
            onAuthorized={p.onAuthorized}
            detail={`${antibioticDose} ordered for ${p.patientName ?? "infant"}, weight ${p.weight ?? "?"} kg`}
            variant="primary"
            doseOptions={abxDoseOptions}
          />
        </div>

        <ActionButton
          label="Escalate to Attending"
          action="escalate_to_doctor"
          onAction={p.onAction}
          onAuthorized={p.onAuthorized}
          detail={`Pediatric fever case escalated to Attending for ${p.patientName ?? "infant"}, age ${p.age ?? "?"} y`}
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
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
        <p className="text-sm text-gray-400">Describe a patient scenario in the chat</p>
        <p className="text-xs text-gray-400 mt-1">Protocol card renders here automatically</p>
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
