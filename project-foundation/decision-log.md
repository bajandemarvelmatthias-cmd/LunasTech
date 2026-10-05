# decision-log.md

---
## AI RULES — READ FULLY BEFORE ANY ACTION
---

1. Read all existing entries before suggesting anything already decided.
2. Never re-debate a logged decision. If it needs revisiting → flag it,
   don't silently override it.
3. At every major milestone → add an entry before continuing.
4. Before logging anything, apply this filter — if ALL three are false, skip it:
   - Hard to reverse?
   - Affects other parts of the system?
   - Confusing without an explanation?
5. Before presenting options at a milestone → search current community
   consensus on each direction. Present findings, then wait for human
   decision before logging.
6. If two directions were discussed with the human → both get logged,
   with the reason the chosen path was taken.

---
## DECISION ENTRIES
---

### #1
**Date:** 2026-10-05
**Milestone:** Project start - technology stack

**Context:**
The product is a progressive web app for about 5000 users, with login,
guides, simulations, learning progress and an admin area. The UI uses
shadcn, which requires React. A frontend build approach and a database
had to be chosen.

**Options Considered:**
- Frontend A: Vite + React + TypeScript, service worker via vite-plugin-pwa
- Frontend B: Next.js (with a PWA plugin such as Serwist)
- Database A: SQLite on a single server
- Database B: PostgreSQL (managed hosting)

**Community Consensus:**
(searched 2026-10-05)
- Frontend: Vite has effectively replaced Create React App as the
  default React build tool. Next.js adds server rendering and can
  support offline PWAs, but one developer team reported it added
  friction for a fully offline PWA and moved to plain React.
- Database: one 2026 comparison favors SQLite for single-server apps
  under roughly 10,000 daily active users, and PostgreSQL once
  concurrent writes, multiple servers or a larger team are involved.
  Another guide calls PostgreSQL the default pick in 2026. Managed
  PostgreSQL costs roughly $20 to $25 a month, with free tiers available.

**Decision:**
Frontend A (Vite + React + TypeScript) and Database B (PostgreSQL),
with a Node + TypeScript backend. Chosen because the app does not need
server rendering, and learning progress and simulation results are
written continuously, so PostgreSQL avoids a later migration.
The human accepted this on 2026-10-05.

**Consequences:**
- shadcn is configured to use Phosphor icons instead of its default
  icon set, and to use the project's design tokens (8px/16px radius,
  400/600 weights, no gradients).
- Offline behavior is handled by the service worker, not by the server.
- PostgreSQL needs a hosted instance; SQLite remains a fallback only
  if the human prefers a single-server setup.
- Backend framework and auth approach are still to be decided.

---
