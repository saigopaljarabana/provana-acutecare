# Provana AcuteCare Copilot — Handoff Document

## What this project is

A 6-hour hackathon generative UI demo. A clinician types a clinical scenario into a chat sidebar. The AI detects the protocol (sepsis, stroke, pediatric fever), then dynamically renders an operational workflow card inside the chat — with allergy-aware treatment mutations.

**Core demo sentence:**
> Prompt → AI reasoning → `useCopilotAction` → React component renders live in chat

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS |
| AI integration | CopilotKit 1.57 |
| LLM backend | Anthropic claude-sonnet-4-6 |
| Data | Hardcoded mock only — no database, no auth |

---

## How to run

```bash
# 1. Add your API key to .env.local
ANTHROPIC_API_KEY=sk-ant-...

# 2. Start
npm run dev

# 3. Open http://localhost:3000
# CopilotKit sidebar opens automatically — paste a demo prompt below.
```

---

## Demo prompts (copy into sidebar)

**Sepsis:**
> 56-year-old febrile hypotensive patient. Temp 103.2°F, BP 88/60, HR 118. Sepsis alert triggered. Penicillin allergy documented. Lactate 2.8.

**Stroke:**
> 72-year-old woman with sudden right-sided weakness and aphasia. Last known well 90 minutes ago. NIHSS 14. BP 185/110. Aspirin allergy.

**Pediatric fever:**
> 6-month-old infant, 7.5 kg, with fever of 104.1°F and heart rate 155. Ill-appearing, no focal source identified.

---

## File structure

```
provana-acutecare/
│
├── app/
│   ├── layout.tsx                  # Wraps app with <CopilotKit runtimeUrl="/api/copilotkit">
│   ├── page.tsx                    # Main page: useCopilotAction + CopilotSidebar
│   └── api/copilotkit/route.ts     # Backend: CopilotRuntime + AnthropicAdapter
│
├── src/                            # Clinical runtime layer
│   ├── lib/
│   │   ├── types.ts                # Shared contract — both layers import from here
│   │   ├── protocolDetector.ts     # Keyword-based protocol detection
│   │   └── patientContext.ts       # Mock patient store (3 patients)
│   └── components/
│       ├── ProtocolRenderer.tsx    # Main orchestrator — routes to sepsis/stroke/pediatric
│       ├── AllergyAlert.tsx        # Allergy flag + treatment mutation UI
│       └── BundleChecklist.tsx     # Interactive click-to-check checklist
│
├── components/                     # CopilotKit bridge (thin wrappers only)
│   └── ProtocolRenderer.tsx        # Maps useCopilotAction args → src/components/ProtocolRenderer
│
└── lib/
    └── protocols.ts                # Protocol types, mock data, demo prompts
```

---

## How the CopilotKit rendering pipeline works

```
User types prompt in sidebar
        ↓
CopilotKit sends prompt + patient context to claude-sonnet-4-6
        ↓
AI detects protocol, calls tool: renderProtocol({ protocolType: "sepsis", ... })
        ↓
useCopilotAction render() fires — args stream in progressively
        ↓
<ProtocolRenderer> renders inside the chat as args fill in
        ↓
Clinician sees a live workflow card with allergy-adjusted treatment
```

Key code in `app/page.tsx`:

```tsx
useCopilotAction({
  name: "renderProtocol",
  available: "disabled",        // required for render-only actions in CopilotKit 1.57+
  parameters: [
    { name: "protocolType", type: "string", description: "sepsis | stroke | pediatric_fever" },
    { name: "patientName",  type: "string" },
    { name: "age",          type: "number" },
    { name: "temperature",  type: "number" },
    { name: "bloodPressure",type: "string" },
    { name: "heartRate",    type: "number" },
    { name: "oxygenSat",    type: "number" },
    { name: "allergies",    type: "string[]" },
    { name: "severity",     type: "string", description: "mild | moderate | severe" },
    { name: "lactate",      type: "number" },   // sepsis
    { name: "nihssScore",   type: "number" },   // stroke
    { name: "lastKnownWell",type: "string" },   // stroke
    { name: "weight",       type: "number" },   // pediatric
  ],
  render: ({ status, args }) => (
    <ProtocolRenderer {...args} status={status} />
  ),
});
```

`status === "inProgress"` while streaming (shows loading pulse). `status === "complete"` when all args are filled.

`useCopilotReadable` passes all 3 mock patients as context so the AI can pull vitals automatically.

---

## Shared types contract — `src/lib/types.ts`

```ts
type ProtocolType = "sepsis_bundle" | "stroke_code" | "pediatric_fever"
type Severity     = "mild" | "moderate" | "severe"
type AgeGroup     = "neonate" | "young_infant" | "infant" | "child" | "adult" | "elderly"

interface VitalSigns {
  temperatureF: number
  bloodPressure: string       // "systolic/diastolic"
  heartRate: number
  oxygenSat: number
  lactate?: number
  wbc?: number
  nihssScore?: number
  lastKnownWell?: string
}

interface PatientContext {
  id: string
  name: string
  ageYears: number
  weightKg?: number
  allergies: string[]
  vitals: VitalSigns
  clinicalNotes?: string
}

interface DetectedProtocol {
  type: ProtocolType
  severity: Severity
  confidence: "high" | "medium" | "low"
  triggerKeywords: string[]
}
```

Both the governance layer and runtime layer import from here. Do not restructure without coordinating.

---

## Protocol detection — `src/lib/protocolDetector.ts`

```ts
detectProtocol(prompt: string): DetectedProtocol | null
```

Pure keyword matching. Priority order:
1. **Sepsis** — any of: `sepsis`, `septic`, `lactate`, `qsofa`, OR fever + hypotension together
2. **Stroke** — any of: `stroke`, `aphasia`, `nihss`, `tpa`, `sudden weakness`, `facial droop`
3. **Pediatric fever** — BOTH: child/infant keyword AND fever keyword (requires both)

Derives severity from: `shock`, `critical`, `severe` → severe; otherwise moderate.

---

## Mock patients — `src/lib/patientContext.ts`

| ID | Name | Age | Protocol | Key flags |
|----|------|-----|----------|-----------|
| P-001 | John Doe | 56y | sepsis_bundle | BP 88/60, Temp 103.2°F, Lactate 2.8, **Penicillin allergy** |
| P-002 | Mary Smith | 72y | stroke_code | NIHSS 14, BP 185/110, LKW 90min, **Aspirin allergy** |
| P-003 | Emma Johnson | 6mo | pediatric_fever | Temp 104.1°F, HR 155, 7.5 kg, no allergies |

---

## AllergyAlert — `src/components/AllergyAlert.tsx`

The visual mutation is the key UX demo moment.

**`<AllergyAlert allergies={["Penicillin"]} />`** renders:

```
⚠️ DRUG ALLERGY ON FILE
   Penicillin

┌─ PROTOCOL MUTATION — Penicillin allergy ─────────┐
│  [CONTRAINDICATED]      →      [SELECTED]         │
│  Piperacillin-Tazobactam  →  Meropenem 1g IV q8h  │
│  (crossed out, red)          (green)               │
│  Beta-lactam cross-reactivity risk                 │
└───────────────────────────────────────────────────┘
```

Supported allergy mutations:
- Penicillin → Piperacillin-Tazobactam ❌ → Meropenem 1g IV q8h ✅
- Carbapenem → Meropenem ❌ → Vancomycin + Aztreonam ✅
- Sulfonamide → TMP-SMX ❌ → Clindamycin ✅

Also exports `resolveAntibiotic(allergies, defaultDrug, defaultDose)` utility used by ProtocolRenderer.

---

## BundleChecklist — `src/components/BundleChecklist.tsx`

Interactive click-to-complete checklist. Per-protocol items:

**Sepsis (8 items):** Blood cultures, Antibiotics within 1h, Lactate, 30mL/kg fluid bolus, MAP monitoring, Glucose, Urine output, ICU notify

**Stroke (7 items):** CT head, CTA, ECG, Labs (INR/PTT/CBC/BMP), Neurology consult, NPO, IV access

**Pediatric (7 items):** UA + culture, Blood culture, CBC/CMP/CRP, IV access, Antipyretic, Weight, Admit decision

Each item has: label, time target, critical flag (red border if unchecked), detail hint. Progress bar shows critical and total completion %.

---

## ProtocolRenderer — `src/components/ProtocolRenderer.tsx`

Routes by `protocolType`. Props accept CopilotKit args (all optional, safe during streaming).

### Sepsis — fully polished

- Patient header + severity badge (red = severe)
- Vitals grid — 6 values, red highlight when critical
- AllergyAlert with full before/after mutation card
- Treatment panel: resolved antibiotic + "allergy-adjusted" label if applicable
- **Vasopressor banner**: appears automatically if BP systolic < 90 OR severity = "severe"
- Fluid order card (30mL/kg crystalloid)
- Interactive BundleChecklist

### Stroke — lightweight mock

- Key vitals: NIHSS, BP, SpO₂, HR
- Last Known Well display
- tPA eligibility: parses LKW time string → checks ≤4.5h window + NIHSS 4–25 + BP ≤185
- Banner: green ✅ with dose, or red ❌ with specific reason why ineligible
- BundleChecklist

### Pediatric — lightweight mock

- Patient card with age in months + weight
- High-risk badge: < 3 months = red "CRITICAL", older = yellow
- Weight-based dosing: acetaminophen and antibiotic doses calculated from kg
- Full workup warning for neonates/young infants
- BundleChecklist

---

## Dynamic mutation behavior summary

| Input | UI change |
|-------|-----------|
| `allergies: ["Penicillin"]` | AllergyAlert renders; Pip-Tazo crossed out → Meropenem selected; "allergy-adjusted" label on treatment panel |
| `severity: "severe"` | Vasopressor banner appears; severity badge turns dark red |
| `age: 0.08` (neonate) | Red header; "HIGH-RISK AGE GROUP" banner; LP added to checklist; full sepsis workup warning |
| `bloodPressure: "80/50"` | Vasopressor banner triggers (systolic < 90); BP vital highlighted red |

---

## Known technical notes for teammates

1. **`available: "disabled"` is required** on `useCopilotAction` when using render-only (no handler). CopilotKit 1.57 throws `"Invalid action configuration"` without it — this is a breaking change from earlier versions.

2. **`@copilotkit/react-ui/styles.css`** must be imported in `layout.tsx` for the sidebar to render correctly.

3. **`components/ProtocolRenderer.tsx`** (root-level) is just a bridge. It does nothing except map CopilotKit args to `src/components/ProtocolRenderer`. All clinical logic lives in `src/`.

4. The `src/lib/types.ts` is the shared contract. The governance layer should import `PatientContext`, `DetectedProtocol`, and `ProtocolType` from there — not define their own.

5. The AI system prompt is set via the `instructions` prop on `<CopilotSidebar>` in `page.tsx`. It instructs the AI to always call `renderProtocol` rather than responding in text.
