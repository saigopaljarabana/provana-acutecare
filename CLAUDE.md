@AGENTS.md

# Provana AcuteCare Copilot — Claude Reference

## What this project is

6-hour hackathon demo. Generative UI: clinician types a scenario → AI detects protocol → React workflow card renders live inside a CopilotKit chat sidebar. Allergy-aware treatment mutation is the key visual demo moment.

**Not a production healthcare system. Hardcoded mock data only. No database, no auth.**

---

## The one thing that must always work

```
Prompt → AI (claude-sonnet-4-6) → useCopilotAction → ProtocolRenderer renders in sidebar
```

Do not break this pipeline. Test after every significant change.

---

## Tech stack

- Next.js 16 App Router, Tailwind CSS
- CopilotKit 1.57 (`@copilotkit/react-core`, `@copilotkit/react-ui`, `@copilotkit/runtime`)
- Anthropic SDK (`@anthropic-ai/sdk`), model: `claude-sonnet-4-6`
- `.env.local` needs `ANTHROPIC_API_KEY=sk-ant-...`

---

## File ownership

### I own (clinical runtime layer)
```
src/lib/types.ts              ← shared contract, coordinate before changing
src/lib/protocols.ts          ← protocol metadata and mock data
src/lib/protocolDetector.ts   ← keyword detection function
src/lib/patientContext.ts     ← 3 mock patients
src/components/ProtocolRenderer.tsx   ← main orchestrator
src/components/AllergyAlert.tsx       ← allergy mutation UI
src/components/BundleChecklist.tsx    ← interactive checklist
src/components/ProtocolHeader.tsx
src/components/ActionPanel.tsx
```

### Teammate owns (governance + control layer)
```
app/page.tsx         ← DO NOT MODIFY without coordination
app/layout.tsx       ← DO NOT MODIFY without coordination
app/api/copilotkit/route.ts
```

### Bridge file (thin, no clinical logic)
```
components/ProtocolRenderer.tsx   ← maps useCopilotAction args → src/components/ProtocolRenderer
```

---

## CopilotKit wiring — critical facts

### 1. useCopilotAction must have a handler
Render-only actions (no `handler`) throw `"Invalid action configuration"` during prerender.
**Always add `handler: async () => {}` even if it does nothing.**

```tsx
useCopilotAction({
  name: "renderProtocol",
  // NO available: "disabled" — that hides the tool from the AI
  parameters: [...],
  handler: async () => {},          // required — fixes prerender + keeps tool in AI's list
  render: ({ status, args }) => <ProtocolRenderer {...args} status={status} />,
});
```

### 2. `available: "disabled"` breaks the pipeline
Setting `available: "disabled"` removes the tool from the AI's tool list → AI can't call it → "Not Found" at runtime. **Never use it.**

### 3. CSS import required
`layout.tsx` must import `"@copilotkit/react-ui/styles.css"` or the sidebar won't render.

### 4. runtimeUrl must match
`<CopilotKit runtimeUrl="/api/copilotkit">` in `layout.tsx` must match the route at `app/api/copilotkit/route.ts`.

### 5. Route must export POST
`app/api/copilotkit/route.ts` must export `export const POST = async (req) => { ... }`.

---

## Protocol detection (`src/lib/protocolDetector.ts`)

```ts
detectProtocol(prompt: string): DetectedProtocol | null
```

Keyword matching, priority order:
1. **sepsis_bundle** — any of: `sepsis`, `septic`, `lactate`, `qsofa` OR fever + hypotension together
2. **stroke_code** — any of: `stroke`, `aphasia`, `nihss`, `tpa`, `sudden weakness`
3. **pediatric_fever** — BOTH: infant/child keyword AND fever keyword (requires both)

Returns `null` if no protocol detected.

---

## Mock patients (`src/lib/patientContext.ts`)

| Patient | Protocol | Key demo flags |
|---------|----------|----------------|
| John Doe, 56y | sepsis_bundle | BP 88/60, Temp 103.2°F, Lactate 2.8, **Penicillin allergy** |
| Mary Smith, 72y | stroke_code | NIHSS 14, BP 185/110, LKW 90min, **Aspirin allergy** |
| Emma Johnson, 6mo | pediatric_fever | Temp 104.1°F, HR 155, 7.5kg, no allergies |

---

## ProtocolRenderer behavior (`src/components/ProtocolRenderer.tsx`)

Props are `Partial<RuntimeProtocolProps>` — all fields optional so streaming args don't crash.

- `protocolType === "sepsis" || "sepsis_bundle"` → `<SepsisRenderer>` (fully polished)
- `protocolType === "stroke" || "stroke_code"` → `<StrokeRenderer>` (lightweight mock)
- `protocolType === "pediatric_fever"` → `<PediatricRenderer>` (lightweight mock)

---

## AllergyAlert mutation logic

Input: `allergies: ["Penicillin"]`

Renders:
1. Yellow banner — "DRUG ALLERGY ON FILE: Penicillin"
2. Mutation card:
   - Left (red, strikethrough): `Piperacillin-Tazobactam` — CONTRAINDICATED
   - Arrow →
   - Right (green): `Meropenem 1g IV q8h` — SELECTED
3. Reason line: "Beta-lactam cross-reactivity risk"

`resolveAntibiotic(allergies, defaultDrug, defaultDose)` exported for use in treatment panels.

Supported mutations: Penicillin, Carbapenem, Sulfonamide.

---

## Shared types contract (`src/lib/types.ts`)

```ts
type ProtocolType = "sepsis_bundle" | "stroke_code" | "pediatric_fever"
type Severity     = "mild" | "moderate" | "severe"

interface PatientContext { id, name, ageYears, weightKg, allergies, vitals }
interface VitalSigns { temperatureF, bloodPressure, heartRate, oxygenSat, lactate?, nihssScore?, lastKnownWell?, ... }
interface DetectedProtocol { type, severity, confidence, triggerKeywords }
```

Both governance layer and runtime layer import from here. Coordinate before changing.

---

## Dynamic UI mutations

| Patient data | What changes in the UI |
|---|---|
| `allergies: ["Penicillin"]` | AllergyAlert renders; Pip-Tazo crossed out → Meropenem selected; "allergy-adjusted" on treatment panel |
| `severity: "severe"` | Vasopressor banner appears in sepsis card |
| `bloodPressure: "80/50"` (systolic < 90) | Vasopressor banner triggers independently of severity |
| `age: 0.08` (neonate, < 1 month) | Red header; "HIGH-RISK AGE" banner; LP in checklist |

---

## Demo prompts

**Sepsis (triggers allergy mutation):**
> 56-year-old febrile hypotensive patient. Temp 103.2°F, BP 88/60, HR 118. Sepsis alert triggered. Penicillin allergy documented. Lactate 2.8.

**Stroke:**
> 72-year-old woman with sudden right-sided weakness and aphasia. Last known well 90 minutes ago. NIHSS 14. BP 185/110. Aspirin allergy.

**Pediatric fever:**
> 6-month-old infant, 7.5 kg, with fever of 104.1°F and heart rate 155. Ill-appearing, no focal source identified.
