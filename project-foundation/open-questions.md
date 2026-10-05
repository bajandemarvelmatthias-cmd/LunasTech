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
| 1 | Is "5000 users" the total number of registered users, or the number using the app at the same time? This decides database sizing and hosting. | Architecture approval | [ ] |
| 2 | What does "minimalist" mean for this project: fewer elements, more whitespace, no decoration, muted colors, typography-led, or a mix? Which accent color should be used? | Before any UI is built | [ ] |

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
| 5 | Technology stack? | Vite + React + TypeScript PWA, Node + TypeScript backend, PostgreSQL. See decision-log.md #1 | Project start |

---
