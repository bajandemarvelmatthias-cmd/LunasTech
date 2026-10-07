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

### #17
**Date:** 2026-10-06
**Milestone:** Visual redesign to the human's screenshots (amends #6 and the style rules in ux-ui-guidelines.md)

**Context:**
The human supplied screenshots of a separate prototype (split-screen login and sign up, customer overview, admin overview, left sidebar) and asked for them to be applied to this project. They conflicted with #6 (no sidebar, no separate desktop design), the no-gradient rule, and the three-size type scale. The conflicts were listed and two directions offered: A, restyle inside the existing guidelines; B, follow the screenshots and update the guidelines. The AI recommended A.

**Options Considered:**
- A: Restyle within the guidelines, keep the top bar, no role toggle.
- B: Follow the screenshots and amend the guidelines and this log.

**Community Consensus:**
Not searched. The human chose B explicitly.

**Decision:**
Option B. Phones keep the bottom tab bar. From md up the tabs move to a fixed left sidebar (width --size-sidebar), the header holds the breadcrumb and account actions. Login and sign up share one split-screen layout (brand panel from lg up) with a Log in / Sign up tab switch. Login has a Customer / Admin choice that only picks which workspace opens first: admin status still comes from profiles.role (#3) and the database enforces every write. A non-admin who picks Admin lands in the customer workspace with a notice. Admins get an Overview page and a Preview customer / Back to admin switch. Overview pages are new: customer (welcome, hero, three stats, device list) and admin (four counts, latest guides). Tokens added: accent-soft, brand, brand-light, brand-text, text-xl (2.5rem, the permitted fourth size, used for hero headlines), size-sidebar, shadow-card. Accent changed from #15803d to #1d6b4f. Gradients are allowed only on the brand panel and the customer hero. Everything else (400/600 weights, 8px and 16px radius tokens, no glows, no single-side borders, Phosphor icons, no emoji) is unchanged.

**Consequences:**
- #6's "no sidebar, no separate desktop design" no longer holds at md and up. Phone design is unchanged in structure.
- The screenshots' full name and confirm password fields on sign up, Saved guides, Device Diagnosis, Devices, Diagnosis rules, Customers and Reports pages were not built: no backing tables or screens exist yet.
- Stat cards, hero and the list on the admin overview use shadow-card; the screenshots' extra card nesting was not copied (no card inside a card).
- Typecheck passes. ESLint and a browser run were not possible in the build environment. Not run against a live Supabase project.

### #18
**Date:** 2026-10-06
**Milestone:** Login and sign up redesign from the second design file (amends #17)

**Context:**
The human supplied a newer design export (split-screen auth with heading block, tabs, Google button, email divider, full name and confirm password on sign up, legal line, no Customer / Admin choice) and said it is for the login and sign up pages.

**Options Considered:**
- A: Copy every element of the design, including the Google button, full name field and the prototype access note.
- B: Apply the layout and look, and leave out elements the project cannot back yet.

**Community Consensus:**
Not searched. Chosen by recommendation.

**Decision:**
Option B. Applied: story panel with eyebrow, headline, feature cards and note; form side with eyebrow, title, subtitle, Log in / Sign up tabs, confirm password on sign up, legal line, Log in to LunasTech / Create my account buttons. The Customer / Admin choice from #17 is removed because the new design has none; admins still open in the admin workspace (profiles.role, #3) and can switch with Preview customer. Left out: Continue with Google (social login is not in the brief, and the Google provider is not set up in Supabase), Full name (handle_new_user() only creates the profile row, so saving a name needs a migration), Keep me signed in (Supabase already keeps the session), and the Prototype access note (authentication is real). Decorative grid, radial glow and ring shadows were not copied (no glows); the outlined ring and one gradient on the brand panel were.

**Consequences:**
- Adding Google sign-in later needs the provider enabled in Supabase plus one button; adding Full name needs a migration that reads display_name from signup metadata.
- Auth text sizes follow the project tokens, not the design file's 8 to 12px sizes.
- Typecheck passes. Not run in a browser or against a live Supabase project.

### #19
**Date:** 2026-10-06
**Milestone:** Customer dashboard from the third design file (amends #17)

**Context:**
The human supplied a design export for the customer dashboard and asked whether it fits the tech stack. The export is plain CSS with local state, localStorage and stock photos. This project is React, Tailwind tokens and Supabase. The human asked for the AI's recommendation.

**Options Considered:**
- A: Port the export as is (its CSS, mock data, localStorage, photos).
- B: Rebuild the layout and look in this project's stack and use real data wherever a table already exists.

**Community Consensus:**
Not searched. Chosen by recommendation.

**Decision:**
Option B. The Overview page now has: greeting by time of day, hero, four stat cards (published guides, simulations passed, guides completed, learning level), device cards with real guide counts that open that device's symptoms, three latest published guides that open the guide itself, and a diagnosis banner. The "diagnosis" is the existing device, symptom, guides flow; no second diagnosis feature was built (constraints.md #3). Customer tabs are renamed Repair Guides and My Progress. The sidebar bottom shows a start prompt (customers only) and the signed-in account. GuidesFlow takes an optional start route; opening from the dashboard remounts the flow so it starts there, and Back returns to the device list. One query, fetchPublishedGuides(), feeds the counts and cards; no schema change.

**Consequences:**
- Not built, because nothing backs them yet: Saved Guides (needs a table), a separate Simulations page (simulations are reached by finishing a guide), search, notifications, help dialog, guide photos (no image column), the community avatars line, "Try a simulation" button on the hero.
- The design's Beginner/Explorer labels are not used; the page shows the numeric level the database calculates.
- Opening guides from the dashboard resets the Guides flow, so a half-finished browse is lost.
- Typecheck passes. Not run in a browser or against a live Supabase project; ESLint not run.

### #20
**Date:** 2026-10-06
**Milestone:** Admin dashboard from the fourth design file (amends #17)

**Context:**
The human supplied a design export for the admin dashboard (Overview, Repair guides, Devices, Diagnosis rules, Simulations, Customers, Reports, with add, edit and delete dialogs) and asked whether it fits the tech stack, then said to go with the AI's recommendation and build it. The export is plain CSS with local state, localStorage and sample data. This project is React, Tailwind tokens and Supabase, and an admin area already exists (decisions #14 to #17).

**Options Considered:**
- A: Port the export as is (its CSS, sample data, localStorage).
- B: Rebuild the layout and look in this project's stack and use real data wherever a table already exists, as in #19.

**Community Consensus:**
Not searched. Chosen by recommendation, following #19.

**Decision:**
Option B. No schema change, no new dependency, no token change. Admin tabs: Overview, Guides, Simulations, Devices, Customers.
- Overview: four count cards that open their page (guides with published and draft split, devices with symptom count, simulations with published and attempt counts, customers), latest five guides (a row opens that guide), a guide readiness ring (percent published, pass rate of completed simulation attempts, Review drafts or Manage guides), Export report (CSV of the counts), Create guide.
- Guides: all guides with All / Published / Draft filter, search, type, status and created date. Same editor as before.
- Simulations: all simulations with guide, step count, attempt count, status, created date; a row opens the existing simulation editor. New simulation asks which guide it belongs to, then opens the same editor.
- Devices: device types with symptom and guide counts, and a Symptoms list below. Add device and Add symptom are the only writes (device_types and symptoms admin policies already allow them).
- Customers: read-only list of profiles (display name, role, learning level, joined), search.
The design's tables were drawn as lists that read as tables from md up, because the guidelines say a table is a container and not to nest it in a card. Status uses the existing soft accent and secondary surface, not the design's amber, red and grey badges. A centered modal (components/ui/Modal.tsx, native dialog element) is used for the add dialogs, per the modal rule.

**Consequences:**
- Not built, because nothing backs them: Diagnosis rules (condition, recommendation, safety warning; the symptom and guide flow is the existing diagnosis, constraints.md #3), device manufacturer, category and notes, guide difficulty, estimated time and cover image, customer email and Suspend (emails live in auth.users, status has no column), Reports as its own page (its numbers are on the overview and in Export report), Help and resources, the "Local prototype" label and the Demo badge (data is real), the Preview card in the sidebar (the header already has Preview customer).
- Delete is not offered for guides (unpublish instead, #14), devices or symptoms (guides and symptoms reference them), or simulations. Rename is not offered for devices or symptoms.
- Guides, Simulations, Devices and Customers reload on every visit. Leaving the guide or simulation editor through a sidebar tab discards unsaved edits without the prompt that the editor's own Back button shows.
- Five admin tabs on the phone bottom bar: the label "Simulations" is close to the width of one column on a 390px screen. Not checked on a device.
- Customers loads the newest 1000 profiles (the API row limit). Search covers the loaded rows only; the list says when it is truncated.
- guide_progress is readable only by its owner, so completion counts across customers are not shown.
- Simulation counts read step ids because only id, position, prompt and options are readable columns (#3).
- Typecheck passes. ESLint and a build were not possible in the build environment (Windows-only binaries in node_modules), and nothing was run in a browser or against a live Supabase project.

### #21
**Date:** 2026-10-06
**Milestone:** Separate admin and customer access (amends #17)

**Context:**
Decision #17 let an admin open the customer workspace with "Preview customer" and return with "Back to admin". The human asked that admins have access only to the admin dashboard and customers only to the customer dashboard.

**Options Considered:**
- A: Keep Preview customer for admins.
- B: Remove it. The role read from profiles.role picks one workspace and nothing in the app switches it.

**Community Consensus:**
Not searched. The human asked for B directly.

**Decision:**
Option B. App.tsx now has two components, AdminWorkspace and CustomerWorkspace, and SignedIn renders exactly one after reading profiles.role. Nothing is shown until the role is known, so an admin never sees a customer screen first. If the role cannot be read, neither workspace opens: the screen shows an error with Try again. Preview customer and Back to admin are removed. Log out stays top right in both.

**Consequences:**
- An admin can no longer see what a customer sees from inside the app. Check the customer screens with a second, non-admin account.
- This is a display rule. What each role may read or write is still enforced only by row level security (#3); a customer who somehow opened an admin screen would still be refused by the database.
- Roles are still changed only in the Supabase dashboard or with the service key.
- SidebarFooter's onStart is now optional (the admin footer has no start prompt).
- Typecheck passes. Not run in a browser or against a live Supabase project.

### #22
**Date:** 2026-10-06
**Milestone:** Guide photos and card details (amends #20)

**Context:**
Decision #20 left out guide difficulty, estimated time and cover image because no table backed them. The human supplied a screenshot of a photo-card guide catalog and asked for the repair guides to be designed like it, with admins able to add pictures so customers enjoy browsing.

**Options Considered:**
- A: Store photos as links the admin pastes.
- B: Upload photos to a Supabase Storage bucket from the guide editor.

**Community Consensus:**
Not searched. Chosen by recommendation.

**Decision:**
Option B, with a schema change the human asked for (migration 20261006000000_guide_images.sql, to be run in the Supabase SQL editor).
- guides: optional difficulty (easy, moderate, hard), estimated_minutes and cover_image_path. guide_steps: optional image_path.
- Storage bucket guide-images: public by URL (random file names), JPG/PNG/WebP, 5 MB limit, only admins can upload (policy uses is_admin()).
- Admin guide editor: Cover photo, Difficulty, Estimated time, and a photo on each step. A picked photo is shrunk to 1600 px and uploaded at once; Save stores its path. Admin guide list shows a thumbnail.
- Customer guide list shows photo cards (cover, kind, title, difficulty, time, step count). The guide screen shows the cover on top and each step's photo. Guides without photos show a neutral tile in lists and nothing on the guide screen. The device, symptom, guide flow is unchanged.

**Consequences:**
- Run the migration before using the new app code; the app reads the new columns.
- Replacing or removing a photo leaves the old file in storage (admins cannot delete files; no delete policy). Files are small after shrinking.
- Anyone with a photo's URL can view it, including photos of drafts. Photos are not secret.
- No new dependency, no token change. Typecheck passes (with the tsconfig baseUrl deprecation silenced; that warning exists without this change). Not run in a browser or against a live Supabase project.

### #23
**Date:** 2026-10-06
**Milestone:** Guide list, guide description and device details from the admin design screenshots (amends #20, #22)

**Context:**
The human supplied admin design screenshots (Create guide, Create device, Devices, Repair guides, Simulations, Customers, Diagnosis rules) and chose the AI's recommendation, expecting database changes.

**Options Considered:**
- A: Restyle only, no database change.
- B: Restyle plus the missing fields (guide description, device manufacturer, category, notes, status).
- C: B plus a Diagnosis rules page.

**Community Consensus:**
Not searched. Chosen by recommendation.

**Decision:**
Option B (migration 20261006010000_catalog_fields.sql, run in the Supabase SQL editor).
- guides.description (optional), shown under the title on the customer guide screen.
- device_types: manufacturer, category (smartphones, laptops, tablets, game consoles), notes, status (active or archived). Archived devices are hidden from customers; admins still see them.
- Admin Guides list gains a Difficulty column. Admin Devices page gains All / Active / Archived tabs, search, a category icon, and an edit dialog (rename, manufacturer, category, notes, status). Devices are archived, never deleted.
- Not built: Diagnosis rules (the symptom and guide flow is the diagnosis, constraints.md #3; reverses #20 only if the human asks for it), Add demo customer, customer email and Suspend (emails live in auth.users, no status column), guide "Planned repair steps" (steps are added as written), cover image by URL (upload from #22 replaces it), a Delete button (#14). Simulations and Customers keep their current layout, which already matches the screenshots.

**Consequences:**
- Run the migration before using the new app code; the app reads the new columns.
- Customer device list now filters on device_types.status; the guide editor's New symptom device picker uses the same list, so archived devices are not offered there.
- Typecheck passes. Not run in a browser or against a live Supabase project.

### #24
**Date:** 2026-10-06
**Milestone:** Guide form laid out like the Create guide design (amends #22, #23)

**Context:**
The human supplied the Create guide dialog from the design export (title, device / model and category, difficulty, estimated time, planned repair steps, description, cover image URL, publication status, Cancel and Save guide) and asked for that setup.

**Options Considered:**
- A: Show it as a pop-up over the guides list.
- B: Keep the guide editor as a page (it also holds the steps and their photos) and lay out its fields like the design.

**Community Consensus:**
Not searched. Chosen by recommendation.

**Decision:**
Option B. No schema change, no new dependency.
- Device / model is a choice of the existing devices; Device category shows that device's category and is not editable (it follows the device). The symptom list is filtered to the chosen device, because every guide belongs to a symptom. New symptom adds one to the chosen device.
- Planned repair steps adds empty steps or removes steps from the end when the field loses focus (a new guide starts with four). Add step and Remove step are gone from this form.
- Cover photo is an upload (#22), not a URL. Guide type (small fix or major repair) stays because the database requires it.
- Publication status is chosen in the form and applied with Save guide, which saves first. The separate Publish / Move to drafts link is gone from the guide form (the simulation form still has it).
- The form is a wider column (max-w-2xl) inside the admin page.

**Consequences:**
- Saving still needs every step to have a title and an instruction; lower Planned repair steps to drop empty ones.
- Removing steps with text or a photo asks for confirmation.
- Typecheck passes. Not run in a browser or against a live Supabase project.

### #25
**Date:** 2026-10-06
**Milestone:** Edit guide opens the same dialog as Create guide (amends #24)

**Context:**
Clicking a guide in the list opened a different page (the step editor) from the Create guide dialog, with a different layout and fields. The human asked that editing look and work the same as creating.

**Options Considered:**
- A: Edit opens the Create guide dialog, filled with the guide's current values. Steps stay in the step editor, one click away.
- B: Make the step editor page copy the dialog's layout.

**Community Consensus:**
Not searched. Chosen to match the human's request with the least new UI.

**Decision:**
Option A. No schema change and no new component.
- A row in the guides list, and the pencil on the admin Overview, open the dialog with the heading "Edit guide." and the same fields as Create guide.
- Save guide saves the fields and the publication status, closes the dialog and refreshes the list. The guide's steps are passed through unchanged, so nothing is deleted or rewritten.
- Planned repair steps shows the current number of steps and cannot be changed here. Edit steps (bottom left) opens the existing step editor, which also holds Simulations.
- Difficulty keeps "Not set" for guides that have none, so saving does not invent one. Guide type is kept as stored.
- Publishing a guide with no steps is refused, as in the step editor.
- As in Create guide, typing a device or symptom that does not exist yet creates it. Typing a different device name moves the guide to that device; it does not rename the old one (rename it on the Devices page).

**Consequences:**
- The step editor page is still titled "Edit guide." It is now only reached from Create guide and Edit steps; rename it (for example "Guide steps") if two screens with one title is confusing.
- Typecheck passes. Not run in a browser or against a live Supabase project.

### #26
**Date:** 2026-10-06
**Milestone:** Permanent delete for devices that have no guides (amends #20, #23)

**Context:**
The Devices page only archived a device, using a bin icon. The human asked that deleting a device really deletes it.

**Options Considered:**
- A: Delete for good only when the device has no guides. A device with guides stays archive-only.
- B: Delete the device together with its guides, steps, simulations and users' progress.
- C: Keep archive only and make the message clearer.

**Community Consensus:**
Not searched. Chosen by the human (option 1).

**Decision:**
Option A. No schema change.
- The bin icon on a device with no guides asks "Delete X permanently?" (naming how many symptoms go with it) and deletes the device and its symptoms.
- A device with guides shows an archive icon instead (restore icon when already archived), so the bin always means delete and the archive icon always means archive.
- The database is the safety net: a guide's symptom cannot be deleted while a guide uses it (on delete restrict), so a delete that races with a new guide is refused and the screen says so.
- An archived device with no guides can be deleted with the bin; to bring one back, set its Status to Active in Edit device.
- B was rejected: it would erase guides and users' progress, against decision #14.

**Consequences:**
- A deleted device cannot be restored. Customers' saved or finished work is never affected, because a device with no guides has none.
- Guides are still never deleted.
- Typecheck passes. Not run in a browser or against a live Supabase project.

### #27
**Date:** 2026-10-06
**Milestone:** Deleting a device with guides archives it (amends #26)

**Context:**
#26 showed a bin for devices without guides and a separate archive icon for devices with guides. The human asked that deleting a device that has guides creates an archive instead.

**Options Considered:**
- A: One bin icon for every device. With no guides it deletes for good; with guides it archives.
- B: Keep the two icons from #26.

**Community Consensus:**
Not searched. Chosen by the human's request.

**Decision:**
Option A. No schema change.
- Bin on a device with guides: "X has N guides, so it can't be deleted. Archive it instead?" Confirming archives the device. Customers no longer see it; its guides are kept.
- Bin on a device with no guides: permanent delete, as in #26.
- An archived device with guides shows the restore icon. It appears under the Archived filter and in Edit device.
- If a guide was added after the page loaded, the refused delete falls back to archiving and says so.

**Consequences:**
- The archive icon from #26 is gone. The bin means "delete, or archive when guides exist"; the dialog says which.
- Typecheck passes. Not run in a browser or against a live Supabase project.

### #28
**Date:** 2026-10-06
**Milestone:** Permanent delete for archived devices, including their guides (amends #14, #26, #27)

**Context:**
#27 archives a device that has guides and never deletes it. The human asked that a device already in the archive can be deleted permanently, with a warning that asks them to be sure.

**Options Considered:**
- A: An archived device can be deleted for good. With no guides, one confirmation. With guides, they are deleted too and the admin must type the device name.
- B: Only archived devices with no guides can be deleted; ones with guides stay archived.

**Community Consensus:**
Not searched. Chosen by the human's request.

**Decision:**
Option A. No schema change. This is the first time the app deletes guides, so it amends #14 ("guides are never deleted") for this one path.
- An archived device shows a restore icon and a bin ("Delete permanently").
- Both cases use a yes / no confirmation (OK / Cancel). No guides: "Delete X permanently? ... This can't be undone."
- With guides: the message says how many guides go, and that their simulations and every customer's progress go with them. The human asked for a plain yes / no instead of typing the device name.
- The app deletes the device's guides first, then the device. Deleting a guide cascades to its steps, simulations, attempts, results, progress and saved marks.
- Active devices are unchanged (#27): the bin archives when guides exist.

**Consequences:**
- Customers lose their progress and attempts on those guides. It cannot be undone, and one OK click is enough to confirm it.
- Photos uploaded for the deleted guides stay in the guide-images storage bucket; the app does not remove them.
- If deleting the guides works but deleting the device fails, the guides stay deleted and the device stays archived; the screen shows an error and the admin can try again.
- Typecheck passes. Not run in a browser or against a live Supabase project.

### #29
**Date:** 2026-10-06
**Milestone:** Manufacturer on devices (amends #23)

**Context:**
Migration 20261006010000 already added device_types.manufacturer, but no screen set or showed it. The human asked for a manufacturer field when adding a device.

**Decision:**
No schema change and no new component.
- Add device and Edit device have an optional Manufacturer field (text, for example Apple), above Category.
- The Devices list shows the manufacturer under the device name when one is set.
- Devices created from the Create guide dialog have no manufacturer; set it in Edit device.
- Archiving, restoring and deleting keep the manufacturer as it was.

**Consequences:**
- Existing devices have no manufacturer until one is entered.
- The customer screens do not show it yet.
- Typecheck passes. Not run in a browser or against a live Supabase project.

### #30
**Date:** 2026-10-08
**Milestone:** My Progress redesign and profile button (amends #11, #20)

**Context:**
The human supplied a design for My Progress and asked that the top-right Log out become a user profile button.

**Decision:**
- My Progress now has: eyebrow and headline, three stat cards (simulations passed, guides completed, learning level), a learning journey panel with a progress bar and a "Keep practicing" button that opens Repair Guides, then the existing Guides and Simulations lists. The page is wide, like Overview. StatCard gained a `stacked` option for the icon-on-top layout.
- The bar shows guides completed out of guides started. It does not show distance to the next level, so level thresholds stay only in the database (#4, #11).
- Log out is replaced by a profile button (ProfileMenu): the user's initials open a small menu with name, email, account type and Log out. It is used in both workspaces and in the account error screen.

**Consequences:**
- Not built, because nothing backs them yet: "Guides saved" stat, Beginner/Explorer labels, search, notification bell, student workspace pill.
- There is still no profile page; the button opens a menu only.
- Typecheck passes. Not run in a browser or against a live Supabase project; ESLint not run.
