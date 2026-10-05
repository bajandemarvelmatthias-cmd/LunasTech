# project-brief.md

---
## AI RULES — READ FULLY BEFORE ANY ACTION
---

1. Read this entire file first. If any section is blank → stop and ask.
2. Automate before building UI. Only surface controls when human judgment is required.
3. Uncertain mid-build → pause, state why, offer two directions, wait for input.
4. All decisions must serve the intent defined below. Flag conflicts, never override silently.
5. Before touching anything → map all connected files and dependencies first.
6. At each major milestone — before, not after — confirm direction with the human before continuing.

---
## PROJECT REFERENCE
---

**Project Name:**
Mobile-Based Device Repair Simulation and Decision Support Application

**The Problem:**
People with a broken phone, tablet or computer don't know how to fix it
and have no guided way to learn.

**The Goal:**
Help users learn to fix their own devices. For a problem such as a broken
phone LCD, the system guides them through the fix and teaches them how to
repair it themselves.

**Who It's For:**
People who have a problem with their own mobile phone, desktop or tablet
and don't know how to fix it. Target scale: about 5000 users.
(Total registered vs concurrent is unconfirmed - see open-questions.md #1.)

**Automation Expectations:**
Automatic (no user input):
- Suggest matching repair guides from the chosen device and symptom
- Score each simulation step and give immediate feedback
- Save progress and record completed simulations
- Work out the user's learning level
- Cache previously opened guides for offline use

Requires human decision or confirmation:
- Which device and symptom to start from
- Choosing a guide when several match
- Confirming that a step is done
- Admin only: approving and publishing guides and scenarios

**What Done Looks Like:**
- A user can sign up and log in
- A user can pick a device and symptom and get matching steps for both
  small fixes and major repairs
- A user can complete a simulation, get feedback, and see their learning
  level rise
- An admin can publish guides and scenarios
- The installed PWA opens previously viewed guides offline

**What This Is NOT:**
- No selling parts, repairs or replacement products
- No live technician chat or remote repair service
- No camera-based AI diagnosis
- No native iOS or Android app (it is a progressive web app)
- No copying iFixit's content; only following its format
- Not teaching hardware beyond phones, tablets and computers

**Open Questions Before Starting:**
None blocking. Active questions are tracked in open-questions.md.
