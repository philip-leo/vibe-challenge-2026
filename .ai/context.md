# Project Context

## Current Status
Mock competition run in progress on `codex/mock-run-2026-02-27`. Milestone 4 polish is complete for prompt "Send Money in Lisbon", and build passes.

## Live URL
- **Production (main):** https://vibe-challenge-2026.vercel.app
- **Preview (test-run):** https://vibe-challenge-2026-git-test-run-philips-projects-753f9fbd.vercel.app

## Repository
https://github.com/philip-leo/vibe-challenge-2026

## Stack
Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + Vercel

## Dependencies Installed (test-run branch)
- shadcn/ui: class-variance-authority, clsx, tailwind-merge, @radix-ui/react-slot, lucide-react
- Three.js: three, @react-three/fiber, @react-three/drei, @types/three

## Competition
- **Date:** Wednesday, March 4, 2026, 15:45–17:00
- **Format:** 1-hour live coding, screen shared on Google Meet
- **Prompt:** Rehearsal prompt in use: "Build a Send Money in Lisbon demo app with fake wallet flow"
- **Deliverable:** Public website URL for co-workers to try and vote on

## What Is In Progress
Sample run execution for the Lisbon transfer demo prompt (currently at final pre-deploy stage).

## Latest Mock Run Update (Feb 27, 2026)
- Branch: `codex/mock-run-2026-02-27` (main intentionally preserved)
- Phase 1 completed: prompt parsed, constraints and success criteria captured, 60-minute milestone plan defined
- Phase 2 started:
  - Milestone 1 completed in `app/page.tsx`
  - Added Lisbon-themed app shell
  - Added fake wallet connect/disconnect UI with randomized mock address
  - Added wallet status panel (state, short address, demo balance)
  - Milestone 2 completed in `app/page.tsx`
  - Added recipient + amount form with inline validation and quick amount chips
  - Added mocked transfer submission state with generated reference ID
  - Milestone 3 completed in `app/page.tsx`
  - Added three-step success timeline (`Queued` → `Validating` → `Settled`)
  - Added timed timeline progression with per-step timestamps
  - Added in-flight state handling and "New Transfer" reset action after settlement
  - Milestone 4 completed in `app/page.tsx`
  - Improved helper-text logic (single clear status message)
  - Added quick recipient chips for faster demo flow
  - Added transfer preview details (fee, ETA, total debit)
  - Added timeline progress bar and disabled editing while transfer is in flight
  - Live local preview verified at `http://localhost:3001`
- Validation:
  - `npm run build` succeeded on branch after Milestone 1 changes
  - `npm run build` succeeded again after Milestone 2 changes
  - `npm run build` succeeded again after Milestone 3 changes
  - `npm run build` succeeded again after Milestone 4 changes

## Key Learnings from Test Runs

### v0 Template Workflow
The zip download from v0 only contains scaffolding (globals.css, layout, shadcn components). The actual creative component lives in the preview iframe. Extraction workflow:
1. User shares the v0 template link (e.g. `https://v0.app/templates/...`)
2. Claude opens in browser, finds preview iframe URL via JS (`document.querySelectorAll('iframe')`)
3. Opens the `*.vusercontent.net` preview URL in a new tab
4. Extracts full source via `get_page_text` from the RSC payload
5. Adapts the component (text, colors, layout) and integrates into project

### Environment Gotchas
- **Google Fonts proxy block:** `next/font/google` fails at build time. Use CDN `<link>` tags in layout.tsx `<head>` instead — fonts load client-side.
- **Image downloads blocked:** `curl` to external image hosts (Unsplash etc.) gets 403 from proxy. Use remote URLs via `next/image` with `remotePatterns` in next.config.ts — Next.js fetches server-side on Vercel.
- **Tailwind v3 → v4:** v0 templates use `@tailwind base/components/utilities` (v3). Project uses `@import "tailwindcss"` (v4). Adapt with `@theme inline` block for CSS variable mappings.
- **Dynamic imports for client components:** Three.js and Canvas components need `dynamic(() => import("./component"), { ssr: false })`.

### Vercel Deploy Behavior
- Push to `main` → production deploy (~30s)
- Push to any other branch → preview deploy (also ~30s, separate URL)
- Preview URLs follow pattern: `vibe-challenge-2026-git-{branch}-philips-projects-753f9fbd.vercel.app`

## Files Overview (test-run branch)
- `app/page.tsx` — Dynamic imports HeroPong (current hero)
- `app/hero-pong.tsx` — Canvas Pong game with pixel-art "HELLO WORLD" / "ML LISBON OFFSITE"
- `app/vibe-blocks.tsx` — Three.js 3D block letters spelling "VIBE" (from first test run, not currently imported)
- `app/layout.tsx` — Geist fonts via CDN links, dark mode enabled
- `app/globals.css` — Tailwind v4 with shadcn CSS variables (`@theme inline`)
- `components/ui/button.tsx`, `card.tsx` — shadcn components
- `lib/utils.ts` — `cn()` helper
- `components.json` — shadcn config
- `next.config.ts` — Unsplash remote patterns

## Next Immediate Goals
1. Push branch and verify preview URL
2. Decide if this run should be merged/cherry-picked later or kept as rehearsal-only
