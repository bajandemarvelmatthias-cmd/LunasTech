# architecture-notes.md

---
## AI RULES — READ FULLY BEFORE ANY ACTION
---

1. Read this entire file before proposing any structure, modifying
   any file, or debugging anything.
2. Project scale drives everything. Read the Scale field first.
   Do not propose a structure that exceeds what the scale requires.
3. Before touching any file → identify all files connected to it.
   This map is your reference. If a connection is not listed here,
   find it before proceeding — do not assume it is isolated.
4. If the structure evolves during the build → update this file.
   An outdated map is worse than no map.
5. Never create folders or layers that the current scale does not
   justify. Do not over-architect small projects. Do not under-
   structure large ones.

---
## SCALE — READ THIS FIRST
---

**Project Scale:**
[ ] Small — single purpose, few screens, one developer
[x] Medium — multiple features, growing complexity, needs modularity
[ ] Large — multi-module, many contributors, long-term maintenance

**Scale Guidelines the AI must follow:**

Small → near-flat structure. Minimal subfolders. Group only what
        genuinely needs grouping. No layers for their own sake.

Medium → feature-based grouping. Each feature owns its files.
         Shared utilities in one place. Clear separation of concerns
         without over-engineering.

Large → fully modular. Domain-driven. Each module is independently
        navigable. Explicit dependency boundaries. Documented entry
        points for every major section.

---
## PROJECT REFERENCE
---

**Project Type:**
Progressive web app (installable, offline-capable) on Supabase, hosted on Vercel

**Tech Stack:**
List each layer with the specific technology and version:
- Frontend: Vite + React + TypeScript, shadcn components, Phosphor icons, Inter (bundled via @fontsource-variable/inter), vite-plugin-pwa (versions to be pinned at setup)
- Backend: none of our own. Supabase database functions; Vercel serverless functions only if needed later (decision-log.md #2)
- Database: PostgreSQL on Supabase
- Auth: Supabase Auth; roles enforced with row level security
- Hosting: Vercel (frontend)
- Other: see decision-log.md #1 and #2. Versions are caret ranges in client/package.json and were not verified against the registry.

**Entry Points:**
client/index.html -> client/src/main.tsx -> client/src/App.tsx

**Folder Structure:**
RECONSTRUCTED on 2026-10-05 after the approved structure was lost between
sessions. Confirm or correct.
```
LunasTech/
  .gitignore
  docs/foundation/            project rules and decisions
  supabase/migrations/        20261005000000_initial_schema.sql (approved, not yet run)
  client/
    index.html, vite.config.ts, tsconfig*.json, package.json, .env.example
    public/                   static files (PWA icons go here)
    src/
      main.tsx, App.tsx, index.css (design tokens), vite-env.d.ts
      layout/                 Shell.tsx (fixed header, centered content column)
      components/ui/          Button.tsx, TextField.tsx, BackButton.tsx, ChoiceList.tsx (plain Tailwind on tokens; shadcn not installed)
      features/auth/          AuthProvider, AuthFlow, LoginScreen, SignupScreen, ForgotPasswordScreen, ResetPasswordScreen, CheckEmailScreen, errors.ts, validation.ts
      features/guides/        GuidesFlow, ListScreen, GuideScreen, api.ts, types.ts
      features/simulations/   SimulationList, SimulationScreen, api.ts, types.ts
      features/               progress, admin (empty)
      lib/                    supabase.ts (client), utils.ts (cn helper), useLoad.ts (async loader hook)
```

**Module / Feature Map:**
- auth -> Signup, login, email confirmation, session (Supabase Auth). Built, including forgot and reset password.
- guides -> Device and symptom selection, matching guides, step-by-step guide with saved progress. Built; offline cache not yet.
- simulations -> Step simulation; scoring and feedback come from the submit_answer database function. Built; opened from the end of a guide.
- progress -> Saved progress, completed simulations, learning level
- admin -> Approving and publishing guides and scenarios
- layout -> Persistent header and navigation shell

**Key Dependencies Between Files:**
- src/main.tsx -> depends on -> src/App.tsx, src/index.css, @fontsource-variable/inter
- src/index.css -> defines tokens used by -> every component
- src/lib/supabase.ts -> depends on -> client/.env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- every feature -> depends on -> src/lib/supabase.ts, src/layout
- features/simulations -> depends on -> start_simulation() and submit_answer() in the initial_schema migration (changing their names or return shape breaks it)
- features/simulations/* -> depends on -> tables simulations, simulation_steps (only id, position, prompt, options are readable by users), step_results; features/guides/ListScreen.tsx; lib/useLoad.ts
- features/guides/GuidesFlow.tsx -> depends on -> features/simulations (SimulationList, SimulationScreen); GuideScreen's onFinished leads into them
- features/admin -> depends on -> admin_simulation_steps() and the admin row level security policies
- recalculate_learning_level() -> depends on -> simulation_attempts.passed, guides.kind
- src/App.tsx -> depends on -> features/auth (AuthProvider, AuthFlow, ResetPasswordScreen), features/guides/GuidesFlow, layout/Shell.tsx, components/ui/Button.tsx
- features/guides/api.ts -> depends on -> tables device_types, symptoms, guides, guide_steps, guide_progress in the initial_schema migration (renaming a column breaks it) and the row level security policies on them
- features/guides/GuideScreen.tsx -> depends on -> features/auth/AuthProvider (user id for guide_progress), lib/useLoad.ts
- features/guides/* -> depends on -> components/ui/* (BackButton, ChoiceList, Button), index.css tokens
- features/auth/* -> depends on -> src/lib/supabase.ts, components/ui/*, index.css tokens
- features/auth/CheckEmailScreen.tsx, SignupScreen.tsx and ForgotPasswordScreen.tsx -> depend on -> the Supabase "Confirm email" setting and redirect allow-list (see Auth configuration)
- features/auth/AuthProvider.tsx (recovering, finishRecovery) -> used by -> App.tsx and ResetPasswordScreen; it reads type=recovery from the URL hash and the PASSWORD_RECOVERY event
- features/auth/AuthFlow.tsx -> depends on -> every pre-sign-in screen; CheckEmailScreen takes purpose "signup" or "recovery"
- vite.config.ts -> depends on -> tsconfig.app.json (the "@" alias is defined in both; change both together)

**Auth configuration (Supabase dashboard, not in the repo):**
- Authentication > Sign In / Providers > Email: "Confirm email" on (default on hosted projects). If it is off, signup signs the user in at once and skips the "Check your email" screen.
- Authentication > URL Configuration: Site URL and Redirect URLs must include every address the app runs on (http://localhost:5173 for development, the Vercel address later). Otherwise the confirmation link fails.
- Minimum password length: raise to 8 to match the app (default 6).
- Password reset emails use the same Site URL and Redirect URLs as signup. The "Reset Password" email template must keep the default {{ .ConfirmationURL }} link.
- Email sending: built-in sender, 2 emails per hour for the whole project, until open-questions.md #14 is resolved.

**What Must Never Be Touched Without Human Approval:**
(e.g. auth logic, payment flows, database schema, config files)
- Database schema, row level security rules and the scoring/level functions
- Column privileges on simulation_steps (they hide the correct answers)
- Design tokens in src/index.css (change only with approval)

**Known Fragile Areas:**
Areas of the codebase that have caused bugs before or require
extra care when modified.
- submit_answer(): scoring, step order and attempt completion in one function. The migration is untested.
- Column privileges on simulation_steps: a broad grant added later would expose the answers.

---
## STRUCTURE CHANGE LOG
---
AI: when the structure changes during the build, log it here.

| Date | Change | Reason |
|------|--------|--------|
| 2026-10-05 | Removed server/ and shared/, added supabase/migrations/ | Decision #2 |
| 2026-10-05 | Added initial schema migration with scoring and level functions; removed max_points, added options, correct_option, feedback, tries, passed | Decisions #3 and #4 |
| 2026-10-05 | Accent #15803d and Inter set in tokens; @fontsource-variable/inter added | Decision #5 |
| 2026-10-05 | Added client scaffold written by hand (no install run) | Vite project setup |
| 2026-10-05 | Added features/auth, components/ui/Button + TextField, layout/Shell; App.tsx now renders auth screens or a signed-in placeholder | Decision #7 |
| 2026-10-06 | Added ForgotPasswordScreen and ResetPasswordScreen; CheckEmailScreen gained a purpose prop; AuthProvider gained recovering state | Decision #8 |

---
| 2026-10-06 | Added features/guides, components/ui/BackButton + ChoiceList, lib/useLoad; App.tsx renders GuidesFlow when signed in | Decision #9 |
| 2026-10-06 | Added features/simulations; GuideScreen gained onFinished; GuidesFlow gained simulations and simulation routes | Decision #10 |
