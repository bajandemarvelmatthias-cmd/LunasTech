# open-questions.md

---
## AI RULES — READ FULLY BEFORE ANY ACTION
---

1. Read this file at the start of every session and at every
   major milestone.
2. Section 1 questions are hard blockers. Do not write any code
   or make any structural decision until all Section 1 questions
   are answered by the human.
3. Section 2 questions are active blockers. Do not pass the
   milestone they are tagged to without resolving them first.
4. When uncertain mid-build → do not guess. Add a question to
   Section 2 with its milestone tag, flag it to the human, and
   wait for an answer before continuing.
5. When a question is answered → move it to the Resolved log
   at the bottom. Never delete questions — resolved ones become
   part of the project's decision history.
6. Never answer your own questions with assumptions. If a question
   is here, it means a human decision is required.

---
## SECTION 1 — BEFORE STARTING
---
These must all be answered before any code is written.
If any are blank → stop and ask.

All Section 1 questions are answered. See the Resolved log below.

---
## SECTION 2 — ACTIVE DURING BUILD
---
Questions that surfaced mid-project.
Each question is tagged to the milestone where it must be resolved.

| # | Question | Milestone | Answered? |
|---|----------|-----------|-----------|
| 3 | Which app icon for the PWA install? A PLACEHOLDER (flat green square, white L; client/public/icon-192.png, icon-512.png, icon-maskable-512.png) was added on 2026-10-06 so install can be tested. The real icon is still needed before launch: replace those three files, same names and sizes. | Before launch | [ ] |
| 14 | Email delivery for auth: Supabase's built-in sender allows only 2 emails per hour for the whole project (checked 2026-10-05), so email confirmation and password reset will fail once more than a couple of people use them. Which SMTP provider will you use (any provider that sends through SMTP works)? Confirmation itself is decided, see resolved #15. | Before launch | [ ] |

---
## HOW TO ADD A QUESTION (AI instructions)

When you hit uncertainty mid-build:
1. Stop what you are doing
2. Write the question clearly and specifically —
   not "what should I do here?" but "should the user
   profile data be fetched on login or on page load,
   given that X and Y are both affected by this choice?"
3. Tag it to the nearest upcoming milestone
4. Tell the human: "I've added a question to open-questions.md
   before I can continue. See question #[N]."
5. Wait for the answer before proceeding

---
## RESOLVED QUESTIONS
---
Answered questions live here permanently as part of project history.

| # | Question | Answer | Resolved At |
|---|----------|--------|-------------|
| 1 | What is the project's problem, goal and audience? | Problem: people with a broken device who don't know how to fix it and have no guided way to learn. Goal: help users learn to fix their own devices. Audience: people with a broken phone, tablet or computer. | Project start |
| 2 | Platform and scale? | Progressive web app (multi-use), about 5000 users | Project start |
| 3 | Automation, definition of done, and what is out of scope? | Accepted the recommended split, done criteria and exclusions now in project-brief.md | Project start |
| 4 | Icon library and UI component library? | Phosphor icons and shadcn | Project start |
| 5 | Technology stack? | Vite + React + TypeScript PWA, PostgreSQL. Backend revised by decision-log.md #2 (Supabase replaces the Node backend). See #1 and #2 | Project start |

---
| 6 | Is "5000 users" total registered or concurrent? | 5000 registered in total. PostgreSQL stays; SQLite is a logged fallback. | Architecture approval |
| 7 | What does "minimalist" mean for this project? | Whatever ux-ui-guidelines.md says. That file is the definition. | Before any UI is built |
| 8 | Which accent color family? | Green. The exact shade is open, see active question #3. | Before any UI is built |
| 9 | Which database host is used? | Supabase. See decision-log.md #2 | Before the database host is chosen |
| 10 | How is a step scored and how is the learning level calculated? | Multiple-choice steps: 2 points first try, 1 second try, 0 if the answer is shown. Pass at 80%. Level from passed simulations (small fix 1, major repair 2): 0 / 1 / 3 / 6 / 10 points = level 0 to 4. See decision-log.md #4 | Before the scoring function is written |
| 11 | Which Supabase plan for launch? | Free plan. Accepted risk: the project pauses after a week without traffic and must be restored by hand in the dashboard. Revisit if the app goes live to real users. Vercel plan terms are still unchecked. | Before launch |
| 12 | Exact green shade and typeface? | Accent #15803d (pressed #166534) with white text, Inter at weights 400 and 600, bundled. See decision-log.md #5 | Before any UI is built |
| 13 | Mobile or desktop layout? | One responsive site designed for phones first, scaled up for desktop, installable as a PWA. See decision-log.md #6 | Before any UI is built |
| 15 | Do users confirm their email at signup? | Yes. See decision-log.md #7 | Signup and login |
| 16 | Are simulation_steps.options plain text strings (for example ["Replace the screen", "Reset the phone"])? | NOT answered directly. Asked twice (once as a tap question); the human replied "continue your recommendations" both times, so the AI's recommendation was adopted on 2026-10-06: plain text strings. Treat as a delegated default. If real content uses another shape, the simulation screen and the simulation admin editor (features/admin/SimulationAdmin.tsx) both need to change. | Before the admin screens or any real simulation content |
