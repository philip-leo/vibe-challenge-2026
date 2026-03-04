# Session Log — 2026-03-04 Fishing Line Threshold Visualization

## Request
Add visual stimulus to the bite interaction:
- show a fishing line style visualization
- define a threshold zone
- require quick catch input while indicator is inside that threshold

## Changes Made

### 1) Added visual timing mechanic in `app/page.tsx`
- Introduced a vertical line visualizer with:
  - moving bobber indicator (`linePosition`)
  - randomized threshold zone (`targetZone`)
  - clear active/standby states in UI
- Added `TargetZone` type and helper:
  - `createTargetZone()` creates randomized, bounded catch zone

### 2) Updated gameplay logic
- On cast:
  - initializes bobber motion and random target zone
- On bite:
  - user sees explicit instruction to catch within green zone
- On reel/catch:
  - success only if bobber is inside threshold during bite
  - outside threshold during bite now resolves to miss

### 3) Motion system
- Added interval-driven bobber movement with boundary bounces and velocity jitter.
- Movement runs only during `line_out` and `bite` phases.
- Motion/timers are cleared on state reset and unmount.

### 4) UX copy update
- Action button label changes from `Reel` to `Catch!` during bite window.
- Added helper text under visualizer clarifying win condition.

## Validation
- `npm run build` passed successfully.

## Notes
- Feature was implemented as an extension to the existing mobile-first game UI.
- No route changes and no backend/API changes.
