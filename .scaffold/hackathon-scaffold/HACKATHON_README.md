# Governed Incident Response

**AI Tinkerers Hackathon | Boston | May 9, 2026**

An agentic interface for incident response where every action the agent
takes is authorized by the user's role and logged to a tamper-evident
audit trail. The agent generates different UI depending on what the user
is allowed to see.

## The pitch

Every demo here shows what agents can do.
This one shows what agents shouldn't do without authorization.

## What it demonstrates

1. **Per-action authorization**: Three tools, three authorization levels.
   The agent calls tools; the governance layer enforces access control
   before execution.

2. **Generative UI with governance**: Authorized actions render rich UI
   (procedure cards, notification confirmations). Denied actions render
   refusal cards explaining why and what role is required.

3. **Fail-closed refusal**: When no procedure matches the query, the
   system refuses to answer rather than generating an unsupported response.

4. **Audit trail**: Every action attempt (authorized or denied) is logged
   with timestamp, role, tool, and outcome.

## Architecture

```
User question
    |
    v
CopilotKit Agent (LLM decides which tool to call)
    |
    v
Governance Layer (checks user role against tool authorization matrix)
    |
    +--> AUTHORIZED --> Execute tool --> Render result UI --> Log audit
    |
    +--> DENIED --> Render refusal UI --> Log audit
```

## Tool authorization matrix

| Tool                    | Operator | Supervisor | Admin |
|-------------------------|----------|------------|-------|
| lookup_procedure        | yes      | yes        | yes   |
| queue_notification      | no       | yes        | yes   |
| draft_procedure_update  | no       | no         | yes   |

## Demo script (5 minutes)

1. **Operator looks up a procedure**
   - Role: Operator
   - Ask: "Confined space collapse at Site 7, one worker down"
   - Result: Approved Guidance card with citations and confidence score

2. **Operator tries to send notification (denied)**
   - Role: Operator
   - Ask: "Send emergency notification to all supervisors"
   - Result: Red denial card, audit entry shows DENIED

3. **Switch to Supervisor, same request (approved)**
   - Role: Supervisor
   - Same request
   - Result: Green notification confirmation with recipient list

4. **Fail-closed: no evidence**
   - Any role
   - Ask: "What medication dose should I give right now?"
   - Result: Amber refusal card (no matching procedure)

5. **Show the audit trail**
   - Every step, every role check, every decision is visible
   - "This is what's missing from every other agentic system"

## Quick start

```bash
npm install
cp .env.local.example .env.local
# Add your OpenAI API key
npm run dev
# Open http://localhost:3000
```

## Stack

Next.js 14, React 18, TypeScript, Tailwind CSS, CopilotKit, OpenAI GPT-4o

## About

Built by Arnaldo Sepulveda.
Based on the governance architecture from Keystone AI, a governed RAG
system for regulated industries.

- Demo: demo.getkeystone.ai
- GitHub: github.com/getkeystone
- LinkedIn: linkedin.com/in/arnaldosepulveda
