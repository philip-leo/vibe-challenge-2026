# Competition Playbook

## Prompt 1: Kickoff Boot + Readiness
```text
We’re about to start the live Vibe Challenge session.
Do not build features yet.

Phase 0: Boot + Readiness (max 5 minutes)
1) Read AGENTS.md and .ai/context.md.
2) Verify environment and readiness:
   - source setup.sh
   - npm install
   - npm run build
   - git checkout main
   - git status --short --branch
3) Confirm: current branch, build status, blockers, and production URL.
4) Prepare a short “Prompt Intake Plan” for when I paste the official prompt:
   - Restate objective + deliverable
   - Extract constraints/phases/acceptance criteria
   - Classify approach (UI-heavy, data/backend-heavy, mixed, unknown)
   - Recommend execution strategy + first 3 milestones with timeboxes
   - Top 3 risks + fallback plan
5) Stop after Phase 0 and wait.

I will paste the official prompt below.
```

## Prompt 2: Post-Prompt Intake + Plan
```text
Official prompt is now provided above.

Run Phase 1: Prompt Intake + Execution Plan (max 5 minutes, no coding yet).
1) Parse the prompt into:
   - Goal
   - Required deliverables
   - Explicit constraints
   - Implicit assumptions
   - Success criteria
2) Identify whether this is UI-heavy, data/backend-heavy, mixed, or unclear, and explain why in 3-5 bullets.
3) Propose exactly one execution strategy with:
   - 3-5 milestones
   - Timebox per milestone (fit within the 60-minute window)
   - What gets deployed first (fastest viable version)
   - What is optional stretch
4) Include a concrete fallback path if the primary strategy gets blocked.
5) List any critical unknowns as assumptions and proceed with reasonable defaults.

Then start Phase 2 immediately: implement milestone 1 and report progress in short updates.
```

## Prompt 3: Midway Checkpoint
```text
Checkpoint review (time now: <MM:SS elapsed>).
Compare actual progress vs plan and return:

1) Completed milestones (done/not done)
2) Remaining required milestones (must-ship only)
3) ETA per remaining milestone + total ETA
4) On-time confidence: High / Medium / Low
5) If confidence is not High: exact cuts to make now (ordered)
6) Next 10-minute action list (concrete, no fluff)

If behind schedule, switch to survival mode immediately and optimize for shipping the minimum viable deliverable.
```

## Prompt 4: T-15 Recovery
```text
T-15 recovery mode.
We have ~15 minutes left. Give the minimum guaranteed-to-ship plan:
- final scope
- next 10 minutes of execution
- final 5-minute deploy/verify checklist
- explicit deferrals
Then execute it immediately.
```
