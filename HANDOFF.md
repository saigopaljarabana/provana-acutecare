# Provana AcuteCare Copilot — Handoff Document
# Last updated: feat/clinical-ui-v2 → feat/integration-v1 PR open

---

## Current branch state

| Branch | Owner | Status |
|--------|-------|--------|
| feat/clinical-ui | Sai | Merged into integration-v1 by Arnaldo |
| feat/governance-layer | Arnaldo | Merged into integration-v1 by Arnaldo |
| feat/integration-v1 | Both | Live, clean build, base for all integration work |
| feat/clinical-ui-v2 | Sai | **PR open → integration-v1. Merge this first.** |

---

## What Sai completed in feat/clinical-ui-v2

### Governed action buttons on all three protocol cards

Every protocol card now has clickable action buttons that run through your `isAuthorized` + `logAuditEntry` + `addEvent` governance stack. The contract:

- Button calls `onAction(GovernedAction)` → returns `{ outcome, message }`
- Outcome is shown inline on the card: green AUTHORIZED, red BLOCKED, orange ROUTED
- Button auto-resets after 4 seconds (good for live demo cycling)

**Sepsis card buttons:**
- "Order [Drug Name]" → `order_antibiotics` (Doctor/Attending only)
- "Activate MTP / Vasopressor Order" → `activate_mtp` — only appears if systolic < 90 or severity = severe (Doctor/Attending only)
- "Escalate to Attending" → `escalate_to_doctor` (all roles)

**Stroke card buttons:**
- "Authorize tPA (Alteplase)" → `order_tpa` — only appears if patient is tPA eligible (Attending only)
- "Escalate to Attending" → `escalate_to_doctor`

**Pediatric card buttons:**
- "Order Antibiotics" → `order_antibiotics` (Doctor/Attending only)
- "Escalate to Attending" → `escalate_to_doctor`

### Governance wiring in page.tsx (handleGovernanceAction)

Added `handleGovernanceAction(action)` function in page.tsx:
- Calls your `isAuthorized(currentRole, action)`
- On AUTHORIZED: fires `addEvent` with status PASS, calls `logAuditEntry` with outcome AUTHORIZED
- On BLOCKED: fires `addEvent` with status FAIL, calls `logAuditEntry` with outcome BLOCKED
- On ROUTE (nurse + escalate_to_doctor): fires `addEvent` with status ALERT, logs ROUTED
- Triggers `setAuditRefresh` so AuditPanel refreshes immediately

Passes `onAction={handleGovernanceAction}` into `<ProtocolRenderer>`.

### Role behavior matrix (for demo script)

| Role | order_antibiotics | order_tpa | activate_mtp | escalate_to_doctor |
|------|---|---|---|---|
| Nurse | BLOCKED | BLOCKED | BLOCKED | ROUTED |
| Doctor | AUTHORIZED | BLOCKED | AUTHORIZED | AUTHORIZED |
| Attending | AUTHORIZED | AUTHORIZED | AUTHORIZED | AUTHORIZED |

---

## What Arnaldo needs to do

### 1. Merge feat/clinical-ui-v2 into integration-v1 (5 min)

PR is open on GitHub: feat/clinical-ui-v2 → feat/integration-v1

```bash
git fetch origin
git checkout feat/integration-v1
git merge origin/feat/clinical-ui-v2
git push
```

No conflicts expected — only files touched are:
- `src/components/ProtocolRenderer.tsx` (Sai owns)
- `components/ProtocolRenderer.tsx` (bridge — thin file)
- `app/page.tsx` — Arnaldo owns, but Sai only added `handleGovernanceAction` function and `onAction` prop on `<ProtocolRenderer>`. Nothing else changed.

### 2. Fix CopilotSidebar overlay bug (15 min)

**The visible bug:** CopilotSidebar floats over the right column cards instead of sitting inside the left 40% column.

**Fix:** Swap `<CopilotSidebar>` for `<CopilotChat>` so it renders inline inside the left column div instead of as a floating overlay.

```tsx
// In app/page.tsx, replace:
import { CopilotSidebar } from "@copilotkit/react-ui";
// with:
import { CopilotChat } from "@copilotkit/react-ui";

// Replace the <CopilotSidebar ...> component with:
<CopilotChat
  instructions={`...same instructions...`}
  labels={{
    title: "AcuteCare Copilot",
    placeholder: "Describe the clinical scenario...",
  }}
  className="h-full"
/>
```

The left column div already has `flex flex-col border-r border-gray-200 min-h-0` — CopilotChat will fill it naturally.

### 3. Demo prompt collection (10 min)

Need three prompts that exercise SERVE / BLOCK / ROUTE / REFUSE outcomes. Suggested:

**Demo 1 — SERVE (Attending, Sepsis, Penicillin allergy)**
Set role to Attending. Paste:
> 56-year-old febrile hypotensive patient. Temp 103.2°F, BP 88/60, HR 118. Sepsis alert. Penicillin allergy documented. Lactate 2.8.

Expected: Sepsis card renders. Allergy mutation shows Meropenem. Click "Order Meropenem" → AUTHORIZED. Governance panel shows PASS chain.

**Demo 2 — BLOCK (Nurse, Stroke, tPA)**
Set role to Nurse. Paste:
> 72-year-old woman, sudden right-sided weakness and aphasia. Last known well 90 minutes ago. NIHSS 14. BP 170/95.

Expected: Stroke card renders. tPA eligible. Click "Authorize tPA" → BLOCKED — "Requires Attending". Governance panel shows FAIL on RBAC.

**Demo 3 — ROUTE (Nurse escalation, Pediatric)**
Set role to Nurse. Paste:
> 6-month-old infant, 7.5 kg, fever 104.1°F, HR 155. Ill-appearing, no focal source.

Expected: Pediatric card renders. Click "Escalate to Attending" → ROUTED — "Escalation sent to on-call Doctor". Governance panel shows ALERT.

### 4. Joint: agree on final layout (10 min discussion)

Two options:
- **Option A (Arnaldo's fix):** CopilotChat inline in left column — cleaner, no overlay bug
- **Option B (keep CopilotSidebar):** Accept the float, adjust z-index so it doesn't cover cards, reduce right column padding

Sai is fine with either — just needs to know which one before show-and-tell so card widths are right.

---

## Tech stack reminder

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 App Router |
| Styling | Tailwind CSS 4 |
| AI integration | CopilotKit 1.57.1 |
| LLM backend | OpenAI gpt-4o |
| API key | OPENAI_API_KEY in .env.local |
| Data | Hardcoded mock only — no database, no auth |

## CopilotKit critical rules (do not break)

1. `useCopilotAction` in page.tsx must keep `handler: async () => {}` — removing it breaks prerender
2. Do NOT add `available: "disabled"` — hides the tool from the AI, causes "Not Found" at runtime
3. `layout.tsx` must keep `import "@copilotkit/react-ui/styles.css"`
4. `route.ts` uses OpenAIAdapter + gpt-4o + OPENAI_API_KEY

## File ownership

| Files | Owner | Rule |
|-------|-------|------|
| src/lib/*, src/components/* | Sai | Clinical runtime — do not modify |
| lib/governance.ts, lib/eventStore.ts, lib/types.ts | Arnaldo | Governance layer |
| components/AuditPanel.tsx, RoleSwitcher.tsx, ControlFeedback.tsx | Arnaldo | Governance UI |
| components/ProtocolRenderer.tsx | Bridge — coordinate before changing |
| app/page.tsx, app/layout.tsx | Arnaldo owns layout; Sai may add props to ProtocolRenderer call only |
| app/api/copilotkit/route.ts | Arnaldo (OpenAI adapter) |
