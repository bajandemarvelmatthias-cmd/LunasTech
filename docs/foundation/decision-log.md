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

### #2
**Date:** 2026-10-05
**Milestone:** Backend approach (after hosting was named: Vercel and Supabase)

**Context:**
The human already uses Vercel and Supabase. The stack in #1 assumed a
separate Node + TypeScript backend and an undecided host and login method.

**Options Considered:**
- A: Supabase for database, login, roles and app logic. Vercel only hosts the app.
- B: A custom Node API on top of Supabase.
- C: Custom login code.

**Community Consensus:**
(searched 2026-10-05) Supabase Auth with row level security is the common
choice for apps of this size. Many projects add a Node API on top, mainly
for custom server logic.

**Decision:**
Option A. Supabase Auth handles signup, login and sessions. User and admin
roles are enforced by row level security. Step scoring and learning level
go in database functions first. Vercel serverless functions are added later
only if something cannot live in the database. B and C are rejected: no
custom server logic is needed yet, and custom login adds risk with no gain.

**Consequences:**
- Supersedes the Node backend and undecided auth/host in #1. The database
  is still PostgreSQL, hosted by Supabase.
- server/ and shared/ folders are not created. supabase/migrations/ holds
  the database setup. Types will come from the database.
- client/.env.example lists the two Supabase values the app needs.
- The free plan pauses after a week of inactivity. See open-questions.md #1.

### #3
**Date:** 2026-10-05
**Milestone:** Database schema

**Context:**
Tables and security rules were needed for profiles, devices, symptoms,
guides, simulations and progress. The first proposal could not score a
step because simulation steps had no answer options.

**Options Considered:**
- A: Clients write scores, attempts and level directly, protected by row level security.
- B: Clients only call database functions; scoring and level are computed in the database.

**Community Consensus:**
Not searched. Chosen by recommendation and accepted by the human.

**Decision:**
Option B. Schema file: supabase/migrations/20261005000000_initial_schema.sql.
Simulation steps hold options, correct_option and feedback. Signed-in users
cannot read correct_option or feedback (column privileges); the scoring
function reads them. Admins read them through admin_simulation_steps().
Users can change only their display name. Role and learning_level cannot be
changed from the app. A is rejected: a client could award itself full marks.

**Consequences:**
- Clients call start_simulation(simulation_id) and submit_answer(attempt_id, step_id, chosen).
- Admin inserts into simulation_steps cannot use "return the new row" for the hidden columns.
- Roles are changed only in the Supabase dashboard or with the service key.
- The migration has not been run or tested yet.

### #4
**Date:** 2026-10-05
**Milestone:** Scoring and learning level

**Context:**
The brief requires automatic step scoring with immediate feedback and an
automatic learning level, but gave no rules.

**Options Considered:**
- A: Simple fixed rules: multiple-choice steps, points by number of tries, level from passed simulations.
- B: Weighted or timed scoring with streaks and difficulty weighting.

**Community Consensus:**
Not searched. Chosen by recommendation and accepted by the human.

**Decision:**
Option A. Each step is multiple choice with one correct answer. Correct on
the first try is 2 points, on the second try 1 point. A second wrong answer
shows the answer and scores 0. A step must be resolved before the next.
A simulation passes at 80% or more of (steps x 2) points. Learning level
counts each passed simulation once (small fix 1 point, major repair 2):
level 0 below 1 point, 1 at 1, 2 at 3, 3 at 6, 4 at 10 or more. The database
recalculates it each time an attempt completes. B is rejected: the brief does
not ask for it and each rule adds maintenance.

**Consequences:**
- Thresholds and the 80% pass mark live in one function each (recalculate_learning_level, submit_answer) and are easy to change.
- A retaken simulation never adds level points twice.
- Timing, streaks and difficulty weighting are out of scope.

### #5
**Date:** 2026-10-05
**Milestone:** Visual identity (before any UI)

**Context:**
The guidelines require references before building UI, and green was chosen
as the accent family. The shade and typeface were open. The placeholder
green (#16a34a) gave only 3.3:1 contrast with white text.

**Options Considered:**
- Accent A: #15803d deep green, white text (5.0:1)
- Accent B: #58cc02 (Duolingo Feather Green), dark text needed (white is 2.1:1)
- Accent C: #9fe870 (Wise lime), dark text needed (9.5:1)
- Typeface A: Inter, bundled. Typeface B: system font stack.

**Community Consensus:**
(searched 2026-10-05) References: iFixit (guide format: introduction, then
one step at a time with 4:3 photos), Duolingo (green for active and done,
grey for locked; its shadows and heavy type rejected), Wise (one green used
for buttons and accents only, surface contrast instead of shadows). Sources
were written summaries of these design systems, not their actual screens,
except Duolingo's official color page.

**Decision:**
Accent A (#15803d, pressed #166534, white text) and Typeface A (Inter,
weights 400 and 600, bundled for offline use). Chosen because B and C force
dark text on buttons, and Inter is the closest free match to the clean look
of the references. The human approved this on 2026-10-05.

**Consequences:**
- Tokens in client/src/index.css are final for color and font. Changing them needs approval.
- The accent is used only for buttons, active states and progress, per the 60/30/10 rule.
- The app icon is still open (open-questions.md #3).

### #6
**Date:** 2026-10-05
**Milestone:** Platform layout (before any UI)

**Context:**
The brief calls for a mobile-based app delivered as a progressive web app.
The question was whether the website and the installed app need separate
designs, and whether desktop gets its own layout.

**Options Considered:**
- A: One responsive site, phone first, scaled up for desktop, installable as a PWA.
- B: A phone design plus a separate desktop design.

**Community Consensus:**
Not searched. Chosen by recommendation and accepted by the human.

**Decision:**
Option A. Navigation is a bottom tab bar on phones and a top bar on wider
screens, per ux-ui-guidelines.md. No sidebar and no separate desktop design.
The installed app is the same site. B is rejected: two designs double the
build and testing work for no stated need.

**Consequences:**
- Every screen is designed and checked at phone width first, then desktop.
- Auth and other single-purpose screens use a centered column at every width.
- The layout shell changes its navigation by breakpoint but keeps fixed header dimensions.

### #7
**Date:** 2026-10-05
**Milestone:** Signup and login (first UI)

**Context:**
The brief requires signup and login. The guidelines require a flow type and
references before building. Whether users must confirm their email changes
the signup flow, so it had to be decided first.

**Options Considered:**
- A: Email confirmation required. Signup ends on a "Check your email" screen and the account works after the link is opened.
- B: No confirmation for now. The account works at once; confirmation is added before launch.

**Community Consensus:**
(searched 2026-10-05) References were written summaries, not the actual screens: Google sign-in (one focused task per screen), Basecamp (email and password only), and sign-up guides covering show-password, visible forgot-password link, no autofocus, large tap targets. Social login is common in the references but is not in the brief.

**Decision:**
Option A. Email and password only. Minimum password length 8. Sign up and Log in are separate screens linked by one text link each. Social login is left out. Forgot password is not built yet, so the screens have no link to it; it is the next auth task. The human approved email confirmation on 2026-10-05.

**Consequences:**
- The Supabase project must have "Confirm email" on, with the site URL in Supabase's redirect allow-list (see architecture-notes.md, Auth configuration).
- Supabase's built-in sender allows 2 emails per hour for the whole project, so signup breaks under real use until an SMTP provider is set (open-questions.md #14).
- Password minimum is enforced in the app (8). The Supabase project setting defaults to 6 and should be raised to 8 so both agree.
- A login attempt on an unconfirmed account moves to the "Check your email" screen with a resend button (60 second wait).
- Signing up with an address that already exists shows an "account already exists" message.
- Components are plain Tailwind built on the tokens. shadcn is not installed yet, so they can be swapped later (decision #1).


### #8
**Date:** 2026-10-06
**Milestone:** Forgot password and reset

**Context:**
Decision #7 left forgot password as the next auth task. The flow needs a
way to ask for a link and a screen that sets the new password after the
link is opened.

**Options Considered:**
- A: Supabase reset email. The link signs the user in and the app shows a "Reset password" screen before anything else.
- B: Emailed one-time code typed into the app (needs a custom email template and a code entry screen).

**Community Consensus:**
Not searched. Chosen by recommendation; follows the same email-link pattern as signup (#7). Reference screens for this task were not collected.

**Decision:**
Option A. Login has one "Forgot password?" link under the password field.
"Forgot password" asks for an email and sends the link. The existing
"Check your email" screen is reused with a purpose (signup or recovery), so
there is one resend implementation. The reset screen asks for a new password
(minimum 8) and saves it. The reset message does not say whether the address
has an account. B is rejected: it adds a template change and an extra screen
for no stated need.

**Consequences:**
- AuthProvider exposes `recovering` and `finishRecovery`. It is set from `type=recovery` in the link or from the PASSWORD_RECOVERY event.
- The reset link signs the user in. If they leave without saving a new password, they stay signed in with the old password unchanged.
- The failed-link message is now generic ("That link is invalid or has expired...") because it covers both confirmation and reset links.
- Reset emails share the 2-per-hour limit (open-questions.md #14) and the same redirect allow-list as signup.
- Not tested against a live Supabase project.

### #9
**Date:** 2026-10-06
**Milestone:** Guides (device, symptom, matching guides, guide steps)

**Context:**
The brief requires picking a device and symptom, getting matching guides for
small fixes and major repairs, and saving progress automatically. No router
is installed, no tab bar is needed with one destination, and the database
already holds everything (no schema change).

**Options Considered:**
- A: One linear flow: Device, Symptom, matching guides, then the guide one step at a time. State-based, no router.
- B: Add a router so every screen has its own address and the browser back button works.

**Community Consensus:**
Not searched. Reference screens were not collected for this milestone (the human asked to proceed); the layout follows iFixit's one-step-at-a-time guide format already approved in #5.

**Decision:**
Option A. When exactly one guide matches a symptom it opens at once (no choice
needed). Steps show one at a time with a progress bar; the position is saved on
every step change and an unfinished guide resumes where it stopped. Finish
stamps completed_at. A completed guide restarts at step 1. B is deferred: it
needs a new dependency (no install was allowed this session).

**Consequences:**
- The browser back button leaves the app instead of going back one screen. Revisit with a router before launch.
- Only published guides are shown to users, even to admins.
- The device_types table is seeded; symptoms, guides and guide_steps are empty, so every list shows its empty message until rows exist (admin screens or SQL).
- Offline caching of opened guides is not built yet and is still required by the brief.
- Simulations are not linked from a guide yet.
- Not tested against a live Supabase project.

### #10
**Date:** 2026-10-06
**Milestone:** Simulations (step scoring and feedback screen)

**Context:**
Decisions #3 and #4 fixed the scoring in database functions. The screen
had to start an attempt, show steps, send answers and show the result without
ever holding or computing a correct answer.

**Options Considered:**
- A: Finishing a guide opens its simulation automatically when there is exactly one; a list when there are several; nothing when there are none.
- B: A separate "Start simulation" button on a completion screen after each guide.

**Community Consensus:**
Not searched. Chosen by recommendation (automation first, constraints.md #2).

**Decision:**
Option A. Each step is one question with radio options and a "Check answer" button. The app sends only the option index to submit_answer and shows what comes back: correct or not, points, feedback, and on a second wrong answer the correct option. A first wrong answer disables that option so the second try is a different choice. At the last step the result screen shows Passed or Not passed, points out of steps x 2, and the learning level returned by the database. Not passed offers "Try again", which starts a new attempt. An unfinished attempt resumes at the first unresolved step. B is rejected: it adds a button for a step the system can take.

**Consequences:**
- The app never computes score, pass or level. It only displays the database's answer.
- Leaving mid-simulation keeps the attempt; reopening resumes it. If the first try was already used, the screen says the first answer was wrong, without naming which option.
- Options are assumed to be plain text strings (open-questions.md #16).
- Not tested against a live Supabase project. submit_answer and start_simulation have also never been run (migration untested).
- The result screen shows the learning level, but there is no progress screen yet.

### #11
**Date:** 2026-10-06
**Milestone:** Progress screen and navigation

**Context:**
Progress is the second destination, so decision #6 (bottom tab bar on phones,
top bar on wider screens) now applies. The level and results are calculated
in the database; the screen only has to show them.

**Options Considered:**
- A: Two tabs, Guides and Progress. The learning level is the screen's headline, followed by lists of guides and simulations the user has touched. The app does not calculate points to the next level.
- B: Also show points and the distance to the next level.

**Community Consensus:**
Not searched. Chosen by recommendation.

**Decision:**
Option A. Tab icons are Phosphor BookOpen (Guides) and ChartLineUp (Progress), always shown with their text label. The Progress tab has no title repeating its name (ux-ui-guidelines.md, label rules). Guides stays mounted when switching tabs so the user keeps their place; Progress reloads on each visit. B is rejected: it would copy the level thresholds from the database into the app, giving two places to change (decision #4 keeps them in one function).

**Consequences:**
- Navigation lives in Shell and shows only when signed in; auth screens keep the centered column with no navigation.
- A guide shows "Completed" or its saved step number. A simulation shows Passed if any finished attempt passed, otherwise Not passed.
- Admin navigation is not added yet. It joins the tab list when the admin area is built.
- Not tested against a live Supabase project; the embedded titles in the queries rely on the foreign keys in the migration.

### #12
**Date:** 2026-10-06
**Milestone:** Offline guide caching

**Context:**
The brief requires previously opened guides to work offline. The service worker already caches the app shell (vite-plugin-pwa defaults), but guide content comes from Supabase and was not stored.

**Options Considered:**
- A: Service worker runtime caching (workbox NetworkFirst) of the four read-only content tables: device_types, symptoms, guides, guide_steps. No screen changes.
- B: App-level cache (IndexedDB or localStorage) written inside features/guides/api.ts, read back when a request fails.

**Community Consensus:**
Not searched. Chosen by recommendation (automation first, constraints.md #2; no new dependency, no new UI).

**Decision:**
Option A. Configured in client/vite.config.ts. Online, the newest content is fetched and saved; offline or after 5 seconds without an answer, the saved copy is used. Anything opened once is available offline, with no download button. Progress, profile and simulation requests are never cached. The offline read of guide_progress falls back to "start at step 1" only when the browser reports it is offline. B is rejected: it duplicates what the service worker already does and puts caching code in every fetch function.

**Consequences:**
- The urlPattern function is copied into the service worker as text. It must not use variables defined outside it, and its table names must match features/guides/api.ts.
- Only screens the user opened while online are available offline. A device or symptom list never visited has no saved copy.
- Saved guide content stays on the device after sign out (it is not personal data).
- Progress cannot be saved offline; the existing "Progress could not be saved" message appears. Finishing a guide offline does not open the simulation.
- Not testable here: the uploaded node_modules holds Windows-only binaries, so no build or service worker run was done. Typecheck passes. Test with `npm run build && npm run preview`, open a guide, then go offline in DevTools.
- Installing the app from a phone still needs the icon (open-questions.md #3).

### #13
**Date:** 2026-10-06
**Milestone:** Browser back button

**Context:**
Decision #9 deferred a router and noted that the back button leaves the app. Open-questions #16 still blocks the admin screens, so this was the one unblocked milestone left. No install can be run in the build environment.

**Options Considered:**
- A: Keep the screen stack in state and mirror it in the browser history (History API). Back goes back one screen. No new dependency, URLs unchanged.
- B: Add react-router so every screen has its own URL. Needs a new dependency, a vercel.json rewrite for direct links, and screens that load their device, symptom, guide or simulation from the URL instead of receiving it whole.

**Community Consensus:**
Not searched. Chosen by recommendation (smallest change that fixes the stated problem).

**Decision:**
Option A. New hook lib/useHistoryStack.ts, used by GuidesFlow. Each push adds a history entry; the on-screen Back and the browser back both remove one screen; leaving a finished simulation returns to the first screen in one step. B is deferred, not rejected: it is the way to get shareable links and reload-in-place, and the brief asks for neither.

**Consequences:**
- Reloading returns to the device list, as before. There are no deep links.
- A forward navigation to a screen that no longer exists is undone automatically.
- Tabs are not history entries. Pressing back while on the Progress tab removes a hidden Guides screen; the user sees it when they return to Guides.
- Pressing back on the first Guides screen leaves the app, as browsers normally do.
- AuthFlow screens still have no back-button support. Not done, not requested.
- Typecheck passes. Not run in a browser.

### #14
**Date:** 2026-10-06
**Milestone:** Admin area, guides only

**Context:**
The brief requires that an admin can publish guides and scenarios. Open question #16 (the shape of simulation_steps.options) blocks the simulation part, so the human was offered a guides-only first step and asked for my recommendation, which was to build it. #16 stays open and nothing here touches simulations.

**Options Considered:**
- A: An Admin tab, shown only to admins, with a list of all guides (drafts included) and one editor: title, symptom, kind, steps, Save, Publish or Move to drafts, plus a small "New symptom" form (the symptoms table starts empty and every guide needs one).
- B: Manage content in the Supabase dashboard or SQL until the full admin is built.

**Community Consensus:**
Not searched. Chosen by recommendation (the brief's "done" list requires an admin, and the schema already has the admin policies, so no schema change).

**Decision:**
Option A. Admin status is read from profiles.role to show the tab; the database policies (is_admin()) enforce every write. Publishing is a human action: Publish saves first, then sets status; it needs at least one step. Steps can be edited in place, added at the end, or removed from the end only. That keeps unique (guide_id, position) safe without a database function; reordering or removing from the middle needs one and is a schema change, so it was not done. No delete for guides (unpublish instead). B is rejected: the brief asks for an admin screen.

**Consequences:**
- Simulation admin (scenarios, options, correct answer, feedback) is not built. It needs #16 answered and admin_simulation_steps(). Until then, simulations are created in SQL.
- New components: components/ui/TextArea and Select; ListScreen gained an optional action slot.
- The Admin flow does not follow the browser back button (it would clash with the Guides stack that is mounted at the same time). It has its own Back.
- Leaving the editor discards unsaved edits without asking.
- Roles are still set only in the Supabase dashboard (decision #3). The first admin must be set there.
- Admin queries on guides, symptoms and guide_steps pass through the offline cache from #12; online responses are always fresh.
- Not run against a live Supabase project (the migration is still untested). Typecheck passes.

### #15
**Date:** 2026-10-06
**Milestone:** Admin area, simulations

**Context:**
Decision #14 left simulation admin out because open-questions #16 (the shape of simulation_steps.options) was unanswered. The human did not answer it, twice, and asked for the AI's recommendation each time. The recommendation (plain text strings) matches what the simulation screen already assumed. This is recorded in open-questions.md as delegated, not as the human's own answer.

**Options Considered:**
- A: Build the simulation admin now with plain text options, as a screen reached from the guide editor ("Simulations").
- B: Keep creating simulations in SQL until the human answers #16.

**Community Consensus:**
Not searched. Chosen by recommendation (the brief's "done" list needs admins to publish scenarios).

**Decision:**
Option A. From a saved guide: Simulations, then a list of that guide's simulations, then an editor (title; steps with a question, 2 to 6 text options, the correct answer, feedback; Save; Publish or Move to drafts). Same step rules as #14: edit in place, add at the end, remove from the end. Admins read answers through admin_simulation_steps(); inserts and updates on simulation_steps never ask for the row back (hidden columns, #3). The editor enforces the database limits (2 to 6 options, correct answer one of them). B is rejected: the human asked twice to continue and the change is easy to undo.

**Consequences:**
- If the human later says options have another shape, only the admin editor and the simulation screen change.
- Users see a simulation only when it and its guide are both published. The admin screens do not warn about a published simulation under a draft guide.
- A published simulation that already has attempts can be edited. Changing its steps or correct answer affects later attempts only through the database functions; old results are not rewritten.
- Removing a step that has results deletes those results (foreign key on delete cascade). The editor does not warn.
- Opening Simulations from the guide editor discards unsaved guide edits.
- Not run against a live Supabase project; the migration is still untested. Typecheck passes.

### #16
**Date:** 2026-10-06
**Milestone:** Admin safety prompts (amends the consequences of #14 and #15)

**Context:**
Decisions #14 and #15 listed three gaps: leaving an admin editor discards unsaved edits silently, opening Simulations from the guide editor does the same, and removing a simulation step deletes users' results for it without warning. The human asked to continue with the AI's recommendations.

**Options Considered:**
- A: The browser's built-in confirm dialog at those points. No new component.
- B: A custom confirmation modal component.

**Community Consensus:**
Not searched. Chosen by recommendation (smallest change, familiar platform pattern).

**Decision:**
Option A. "Discard your unsaved changes?" when leaving either editor or opening Simulations with unsaved edits. "Removing this step also deletes users' results for it. Remove anyway?" when saving a simulation that drops saved steps. B is deferred: switch to it if the native dialog looks out of place.

**Consequences:**
- The first two items in #14 and #15's lists no longer apply; the step-removal warning replaces the third. A published simulation under a draft guide still gets no hint.
- Admin editors track unsaved edits in a ref set by the form and read by the screen's Back button. A new editing path must call the form's touch/edited helper or it will not count as unsaved.
- Typecheck passes. Not run in a browser.
