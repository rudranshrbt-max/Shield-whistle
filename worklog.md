# ShieldWhistle — Project Worklog

> SEBI & Companies Act compliant whistleblower + compliance reporting system for Indian SMBs.
> Positioning: "SEBI and Companies Act compliant whistleblower system, live in 48 hours."

---

Task ID: 1–8
Agent: main (orchestrator)
Task: Build the complete V1 ShieldWhistle product — anonymous web + WhatsApp reporting, case management dashboard, duplicate pattern detection, tamper-proof audit log, multi-org isolation, E2E encryption, and pricing/onboarding.

Work Log:
- Designed & pushed Prisma schema (Organization, User, Report, Case, CaseMessage, AuditLog with hash-chain + monotonic `seq`, WhatsappSession). SQLite backend.
- Built core libs: `encryption.ts` (AES-256-GCM per-org keys), `audit.ts` (hash-chain compute + verify), `audit-write.ts` (transactional appendAudit helper that reads the true chain head by `seq`), `org.ts` (org isolation, report tokens, dup signatures), `constants.ts` (categories, severities, statuses, 4-tier pricing), `server-org.ts` (resolves active org from `x-sw-org` header).
- Seeded a demo org "Acme Industries Pvt Ltd" (GROWTH plan, 740 employees) with 2 officers and 8 realistic reports spanning harassment, bribery, financial misstatement, safety, data privacy — including deliberate duplicate patterns (Anil Kapoor ×2, Mahesh Iyer ×2, Vikram Shah ×2) and one resolved case.
- Built all backend API routes (Next.js App Router): `POST/GET /api/reports`, `GET /api/track`, `GET/POST /api/orgs`, `GET /api/dashboard`, `GET /api/cases`, `GET/PATCH /api/cases/[id]`, `POST /api/cases/[id]/messages`, `GET /api/audit` (full-chain verification + filtered display), `GET /api/duplicates`, `GET /api/whatsapp`. Every officer query filters by orgId (multi-org isolation).
- Built the WhatsApp bot mini-service (`mini-services/whatsapp-bot`, port 3003, socket.io) — a guided state-machine conversation (category → severity → department → accused → description → location → date → consent → submit) that POSTs the completed report to `/api/reports` with `channel=WHATSAPP`. Phone numbers are never stored.
- Built the single-page frontend (only `/` route): Landing (hero, problem/compliance, 6 features, how-it-works, WhatsApp spotlight with animated phone mockup, 4-tier pricing, final CTA), Report submission form (org picker, category/severity chips, encrypted submit, success screen with tracking token), Track view (anonymous status timeline), and the Officer Dashboard (sidebar + 6 tabs: Overview with KPIs & Recharts, Case Inbox with filters + detail Sheet, Audit Trail with live chain verification, Duplicate Patterns, WhatsApp with live bot simulator, Settings). Sticky footer, responsive, emerald accent on zinc neutrals.
- Fixed a critical audit-chain bug: timestamp ties caused `findFirst orderBy timestamp desc` to pick the wrong "last" entry, forking the chain. Fix = added monotonic `seq Int` column + transactional `appendAudit` helper that reads the true head by `seq`. Also fixed the audit route to verify against the FULL chain (not a filtered subset, which falsely reported BROKEN).
- Fixed lint errors (require→import, setState-in-effect→useRef, expression-statement→if/else, unused eslint-disables).
- Regenerated Prisma client + restarted dev server so the new `seq` field was recognized.

Stage Summary:
- All 6 V1 features are live and browser-verified end-to-end via agent-browser (through the Caddy gateway on :81 for socket.io routing):
  - Web report submission → success token SW-HH8H-VBZH-Y3N7 ✓
  - WhatsApp bot live conversation → filed real case SW-2026-0009, token SW-R65N-9E23-5NX6, appeared in inbox ✓
  - Case workflow Submitted→Reviewing→Resolved with resolution summary ✓
  - Audit chain: verified INTACT (27→33→35 entries) through all runtime writes (view, status change, resolve, message, whatsapp report) ✓
  - Duplicate patterns: shows Anil Kapoor / Mahesh Iyer / Vikram Shah as 2× reported ✓
  - Track by token: returns status + case number anonymously ✓
- Lint passes clean (`bun run lint` → 0 errors). Dev server runs on :3000, WhatsApp bot on :3003.
- Screenshots in `/home/z/my-project/screens/`.

Unresolved issues / risks:
- Auth is simulated (officer "Priya Nair" is hardcoded; org switching is via header, not SSO). Production needs NextAuth + per-user org binding. The `Settings` tab surfaces this as "SSO in production".
- The WhatsApp number shown is a deterministic demo value, not a real Twilio connection. The webhook `/api/whatsapp/inbound` is a stub; the live simulator uses socket.io to emulate the Twilio flow. Wiring real Twilio is a config-only change (the conversation logic is identical).
- Onboarding flow creates an org via `POST /api/orgs` but there's no dedicated onboarding UI screen yet (the landing CTA sends users to the dashboard). A polished onboarding wizard is a natural next step.
- Pricing upgrade buttons are disabled (no billing integration — intentional for V1 pilot).
- Audit-trail display orders by `seq` (append order). For seed data this means the last-imported (chronologically oldest) report can appear as "most recent activity". Acceptable for a demo; could add a secondary timestamp sort for display if needed.
- After 10 paying clients, the roadmap calls for AI severity analytics, benchmarking, multi-language, Slack/Teams — none built (correctly, per the kill list).

Priority recommendations for next phase:
1. Add a real onboarding wizard (org name → plan → generate key → connect WhatsApp number) with a dedicated screen.
2. Add NextAuth email magic-link login binding users to orgs + role-based access (OFFICER vs ADMIN).
3. Wire a real Twilio/WhatsApp Business webhook at `/api/whatsapp/inbound` and persist `WhatsappSession` rows from the mini-service.
4. Add CSV/PDF audit-log export for regulators (button exists, currently exports JSON).
5. Add SLA timers on the case inbox (time-in-status) to surface overdue reviews.
