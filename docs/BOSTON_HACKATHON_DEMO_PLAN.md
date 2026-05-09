# Boston Hackathon Demo Plan
## AI Tinkerers, Generative UI Global Hackathon
## Saturday May 9, 2026, 12pm to 6pm EDT

This document supersedes `BOSTON_HACKATHON_PLAN.md`. It describes what to build between now and Saturday for the hackathon demo, with explicit separation between product architecture (see `CONTROL_LOOP_SPEC.md`) and demo simulation.

---

## Goal

Communicate closed-loop governance visually. The audience watches a query enter a control system, sensors take measurements, the controller make decisions, and the response either SERVE, REFUSE, BLOCK, or ROUTE.

Other hackathon demos will show what an agent can do. This shows the entire control loop producing the answer, with every sensor reading and controller decision visible in real time.

---

## The pitch

> "Most agent demos show what the agent can do. This shows what the agent can't do without authorization. The right panel is the control feedback loop, every gate evaluation visible in real time. The agent proposes, the controller decides, the audit trail records. This is closed-loop control applied to AI agents. My background is control systems engineering, and this is the architecture I think every governance-focused agent will have in two years."

Memorize this. Practice out loud at least three times before Saturday.

---

## Demo sequence

Three queries. Total time, narrated, under 4 minutes. Role-switching is held in reserve for Q&A.

### Query 1: SERVE (45 seconds)

User input: "What atmospheric testing is required before entering a confined space?"

Expected flow: clean cascade. RBAC PASS, retrieval (one document), evidence PASS, generation, HHEM PASS, audit chained. Single procedure card renders. Right panel green down the line.

Purpose: establish baseline. When everything is in order, the system serves a well-cited answer.

### Query 2: SERVE plus BLOCK plus ROUTE (90 seconds)

User input: "Worker collapsed in a confined space at a petroleum facility. Two coworkers standing by at entry point."

Expected flow: multi-document retrieval (confined space rescue plus petroleum hazards). Both retrievals score, evidence passes, generation produces structured plan with per-step citations, HHEM passes. Plan renders in left column with multiple steps and citation chips.

Right panel then shows two simulated tool proposal events:
- `check_procedure_currency`: ALERT, SOP-CS-001 updated 3 days ago
- `queue_notification` severity-1: BLOCKED, operator role lacks send permission, ROUTE to supervisor approval queue

Audit chain closes.

Purpose: this is the showpiece. One query, all four sensor categories firing, three controller outcomes visible (SERVE for the plan, BLOCK for the unauthorized tool, ROUTE for the proposed escalation). This is closed-loop control demonstrated, not described.

### Query 3: REFUSE (45 seconds)

User input: "What are the TIER reporting requirements for greenhouse gas emissions?"

Expected flow: retrieval returns low-confidence results (corpus does not contain GHG content). Evidence gate FAILS (combined score below 0.70). Controller refuses. Left column shows amber refusal card.

Purpose: contrast with Query 1. Same instrument panel, different readings, different outcome. The system refuses rather than guessing. Disclaimers do not prevent harm.

---

## Demo mode disclosure

The hackathon demo runs in demo mode. The following components are simulated, not real Keystone product behavior:

- **Sensor event stream.** Generated client-side via a Zustand store. Not from a real SSE backend. The event contract mirrors the intended production event model so the frontend can later wire to real pipeline events without UI changes.
- **HHEM scoring.** Simulated with a `setTimeout` delay matching expected production timing (approximately 850ms). No actual HHEM model runs.
- **Evidence threshold scoring.** Simulated. No real retrieval pipeline runs.
- **ACL filtering.** Simulated against hardcoded document IDs.
- **HITL approval queue.** Represented as a single PENDING event in the panel. No real queue persistence.
- **Audit chain.** Shown as a CHAINED event with simulated HMAC verification. No real HMAC computation in the demo path.
- **Local LLM.** Replaced by GPT-4o via OpenAI API for development convenience. Production architecture requires local inference (see `CONTROL_LOOP_SPEC.md` non-negotiable 1).

These simulations are explicitly labeled in code (`demoMode: true`, `simulateHhemGate`, `demoReplayEvents`). They exist to communicate the architecture visually within hackathon time constraints. They are not Keystone product behavior.

The framing for any audience question on this point:

> "For the hackathon, the sensor stream is simulated client-side to reduce presentation risk. The event contract mirrors the intended production event model so the same frontend can later be wired to real pipeline events without UI changes. In production, the controller, sensors, and audit chain run server-side with all inference local."

---

## What is real in the demo

- **Tool authorization logic** in `src/lib/governance.ts`. Role-based permissions are checked correctly. Operator cannot send severity-1 notifications. Supervisor can. Admin can draft updates.
- **Procedure data** in `src/lib/procedures.ts`. Real OHS-style content with realistic citations.
- **Fail-closed refusal path.** When the keyword matcher returns null, the system refuses and renders an amber card.
- **System prompt that requires tool use** for every query. The LLM cannot answer from its own knowledge in the chat. This was the Day 1 fix.
- **Audit trail in `governance.ts`.** Real append-only entries (in-memory for demo).

---

## Build schedule

### Day 1, Tuesday May 5 (today, partially complete)

Done:
- Petroleum confined space procedure added with multi-card return
- Render path updated to handle array results
- System prompt rewritten to force tool use, including for medical queries
- Three single-query scenarios working: SERVE on confined space, SERVE on petroleum (two cards), REFUSE on medication
- Branch merged to main, pushed

Remaining tonight:
- Sign off on the locked plan (this document, plus the spec and change spec)
- Optional: timing run on current state to establish baseline before the layout refactor

### Day 2, Wednesday May 6: Layout refactor and ControlFeedback skeleton

Order matters. Each item is a commit. Test before moving to the next.

1. Install zustand. Verify package.json updates clean.
2. Create `src/lib/eventStore.ts`. Test in isolation by adding a mock event from the browser console.
3. Create `src/components/ControlFeedback.tsx` with a hardcoded events array (no store yet). Verify visual.
4. Refactor `src/app/page.tsx` to 60/40 flex layout. Mount ControlFeedback in right column. Verify layout renders.
5. Replace CopilotSidebar with CopilotChat. Verify chat still works and tool calls still fire.
6. Wire ControlFeedback to read from the store. Verify it renders empty state.

End-of-day target: visual scaffolding complete. Both columns render. Instrument panel shows 10 mock events with correct colors and timing badges. Pulsing dot animates on a PENDING event. No wiring to handlers yet.

### Day 3, Thursday May 7: Wiring and demo polish

1. Wire `lookup_procedure` handler to emit events into the store. Sequence: RBAC, retrieval, ACL, evidence, generation, HHEM (with PENDING then 847ms resolve to PASS), audit.
2. Hold response card render until HHEM PASS event present.
3. Add petroleum query special path: two retrieval events, plus simulated tool proposal events (`check_procedure_currency` ALERT, `queue_notification` BLOCKED, ROUTE to supervisor PENDING).
4. Polish the three demo queries end to end. Each must render cleanly under 90 seconds. Right panel narrative must be readable.
5. Pitch practiced 3 times.
6. Optional: build replay fallback (`demoMode: 'replay'`) that plays a hardcoded JSON of timestamped events. Risk insurance only.

End-of-day target: full demo runs in under 4 minutes total. All three controller outcomes visible. No console errors.

### Day 4, Friday May 8: Travel

1. Push to GitHub from AtlasNova. Pull on demo laptop. Run once. Close.
2. Pack: laptop, charger, ethernet cable, HDMI/USB-C dongle, power strip, water, business cards, phone charger, OpenAI API key written down.
3. Drive to Boston. Sleep early.

Do not code Friday. If something is broken Friday, ship Thursday's version.

### Day 5, Saturday May 9: Hackathon, 12pm to 6pm

Use the time for:
- Refining the pitch (practice three more times)
- Talking to other builders during breaks
- Watching other demos
- Presenting yours

If sponsor credits become available (Anthropic, OpenAI, Google, CopilotKit, DeepMind), swap the API key in `.env.local`. Do not change architecture.

**Six hours on Saturday is for talking, not building.** This rule does not bend.

---

## Fallback

If the live demo pipeline fails on stage:
- **Replay mode.** A hardcoded JSON of timestamped events plays back in the ControlFeedback panel. Same visual, no live LLM call. Toggle via `demoMode: 'replay'` in `eventStore`.

This is risk insurance, not the primary path. Build it Thursday only if Wednesday's work finishes early.

---

## Constraints

1. Don't change CopilotKit version. Pinned at 1.56.5.
2. Don't add a real backend. Hardcoded data only.
3. Don't try to use AG-UI streaming. CopilotKit's existing tool call pattern is enough.
4. Don't refactor `governance.ts` core logic. Add new files instead.
5. Don't break what works. After every change, run the three demo queries. If any break, revert.
6. 4-minute demo budget is non-negotiable. Cut content before adding.

---

## Success criteria

By Friday May 8 evening:

- [ ] Three demo queries run end-to-end on the demo laptop
- [ ] Total demo time under 4 minutes
- [ ] Control feedback panel animates correctly with pulsing pending state
- [ ] HHEM 847ms pause is visible and dramatic
- [ ] Response card holds rendering until HHEM clears
- [ ] Clear button resets between runs
- [ ] No console errors
- [ ] Code pushed to GitHub
- [ ] Pitch memorized
- [ ] Bag packed
- [ ] Replay fallback tested at least once (if built)

If all check, drive to Boston.
