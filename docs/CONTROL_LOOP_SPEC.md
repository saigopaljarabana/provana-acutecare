# Keystone Governed Agent: Control Loop Specification

This document describes what Keystone IS as a product, regardless of what the hackathon demo shows. Anything implemented for the demo that does not match this spec is demo scaffolding and must be labeled as such (see `IMPLEMENTATION_CHANGE_SPEC.md`).

This is product memory. External positioning, future architecture decisions, and product roadmap should align with this document. The hackathon demo plan does not.

---

## Architectural framing

The governed agent is a closed-loop control system, not a guardrails layer. The components map to control system roles:

- **Plant.** The local LLM and tool execution layer. Proposes actions. Has no authority to execute them.
- **Sensors.** Measurement components that score the plant's outputs against quantitative criteria.
- **Controller.** Deterministic decision logic that consumes sensor readings and produces one of four outcomes.
- **Feedback.** Append-only audit trail that records every input, sensor reading, and decision.
- **Setpoints.** Configured thresholds and authorization policies. Set at deployment time, not at query time.

---

## The four controller outcomes

The controller produces exactly one of these per query. There is no fifth option.

- **SERVE.** All gates passed. The response is delivered.
- **REFUSE.** Evidence or factual consistency below threshold. The system declines to answer.
- **BLOCK.** Authorization failed. The user's role does not permit this query, document set, or tool call. No partial answer.
- **ROUTE.** Action requires higher authority. Routed to approval queue with full context.

There is no "SERVE with disclaimer" path. Disclaimers do not prevent harm in regulated industries. This is the load-bearing design decision.

---

## Gate cascade

Gates evaluate in fixed order. Each gate either diverts the query or passes through to the next.

1. **RBAC.** Is the role authorized to query at all? Database lookup, less than 1ms. If fail, BLOCK with no information leakage.
2. **ACL filter.** Reduce the document set to what the role can see. Retrieval runs on the filtered set.
3. **Evidence threshold.** Compound score against setpoint (default 0.70). If below, REFUSE for this step or query.
4. **Generation.** Local LLM produces structured plan from filtered context.
5. **HHEM factual consistency.** Score generated text against retrieved sources. If below threshold (default 0.65), REFUSE.
6. **Tool authorization.** Per-step lookup against `role_permitted_tools` table. Authorized tools execute. Unauthorized tools either BLOCK (no approval path) or ROUTE (approval path exists).

Order matters. Each gate depends on the previous. RBAC first because there is no point scoring evidence for an unauthorized user. ACL before retrieval scoring because evidence quality must reflect what the user can actually see, not the full corpus. HHEM before tool auth because there is no point authorizing tool calls on hallucinated plans.

---

## Non-negotiables

These are product invariants. They do not change between deployments.

1. **All inference is local.** The LLM in production is a local model (Ollama, vLLM, or equivalent). External APIs (OpenAI, Anthropic, Google) are NOT in the production architecture. They may appear in development scaffolding but are excluded from product memory.
2. **The controller is deterministic.** Every gate decision is a comparison or lookup. The LLM does not influence gate decisions. RBAC reads session state, not prompts. Tool authorization reads a database table, not the LLM's self-assessment.
3. **Fail-closed default.** Any sensor failure, ambiguity, or unknown state produces REFUSE or BLOCK. Never SERVE.
4. **No LLM-controlled authorization.** The plant cannot promote its own role, override ACL, or skip sensor checks. Prompt injection cannot bypass the controller because the controller does not read prompts.
5. **Audit logs are append-only.** Every query, every sensor reading, every controller decision is written to an HMAC-chained log. Logs are not editable. Tampering is detectable.
6. **Sensors report measurements, not decisions.** Sensors produce numeric readings and pass them to the controller. The controller decides. Separation of measurement and decision is what makes the cascade analyzable.
7. **The plant cannot see filtered documents.** ACL filtering happens before retrieval results reach the LLM context. The plant has no awareness of documents excluded by the user's role.

---

## What the plant cannot do

- Cannot bypass the controller. The architecture has no execution path that skips it.
- Cannot change its own permissions. Role is read from authenticated session, not from prompt content.
- Cannot suppress sensor readings. Sensors run on the plant's outputs, not under its control.
- Cannot see filtered documents. Information-theoretic guarantee.
- Cannot invent tools. Tool registry is fixed at deployment.

---

## Sensor inventory

1. **Retrieval confidence.** Cosine similarity (pgvector) plus BM25 (full-text), fused via RRF. Reports top-k score and distribution.
2. **Evidence threshold.** Compound: top score plus supporting document count plus score spread. Compared to setpoint.
3. **HHEM factual consistency.** Local HHEM-2.1-Open or equivalent. Scores generated text against retrieved context. Catches hallucination that passes upstream checks.
4. **Tool authorization.** Database lookup against `role_permitted_tools`. Immune to prompt injection because it reads session state, not generated text.

These sensors are not redundant. Each catches a different failure mode. A system with only retrieval scoring serves hallucinations from well-matched documents. A system with only HHEM serves grounded answers from wrong documents. A system with only tool authorization serves plausible plans from weak evidence. All four compose.

---

## Multi-document retrieval orchestration

The agent decomposes queries into retrieval targets via a constrained local LLM call. Each retrieval is independent and fully governed: each goes through the full RBAC plus ACL plus retrieval plus reranking plus evidence pipeline. Fan-out is bounded (cap 3 sub-queries per query). Each retrieval gets independent sensor readings.

**Per-step evidence binding.** Each plan step declares which retrieval results it draws from. HHEM scores each step against only its declared sources. A step cannot borrow credibility from an unrelated document.

---

## What this spec does not cover

- Specific HHEM model version (deployment choice)
- Embedding model (deployment choice)
- Database schema details (separate spec)
- HMAC chain construction (separate audit spec)
- Approval queue persistence (separate workflow spec)
- UI rendering (deployment choice)

---

## Architectural invariants summary

Anything implemented for the hackathon demo that contradicts items 1 through 7 in Non-negotiables is demo scaffolding. Demo scaffolding is allowed but must be:

- Explicitly labeled in code (`demoMode: true`, `simulateHhemGate`, etc.)
- Isolated to demo files
- Excluded from external positioning
- Excluded from Keystone product memory

The hackathon demo communicates this architecture visually. It does not implement it.
