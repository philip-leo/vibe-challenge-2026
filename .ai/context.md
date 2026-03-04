# Project Context

## Current Status
Fishing game is live on `main`. A visual catch-threshold upgrade is implemented locally and build-passing.

## Latest Session (Mar 4, 2026, 16:11 WET)
- Added a visual fishing-line timing mini-game to `app/page.tsx`:
  - moving bobber indicator on a vertical line
  - highlighted target threshold zone
  - bite state now requires pressing catch while bobber is inside zone
- Updated interaction copy and CTA:
  - bite prompt now explains zone timing
  - `Reel` button becomes `Catch!` during bite window
- Outcome logic updated:
  - bite + outside threshold => miss
  - bite + inside threshold => fish catch
- Build gate result:
  - `npm run build` succeeded on Next.js 16.1.6

## Latest Session (Mar 4, 2026, 16:04 WET)
- Implemented a full mobile-first fishing game in `app/page.tsx`.
- Core gameplay shipped:
  - `Cast` -> wait for random bite window -> `Reel`
  - Catch/miss outcomes with timer-based interaction
  - Weighted fish rarity table (`common`, `rare`, `legendary`)
- "Biggest Catch of the Day" shipped with per-device daily persistence:
  - localStorage key format: `fishing:best:<YYYY-MM-DD>`
- Mobile-first UX shipped:
  - fixed bottom action bar on phones
  - safe-area bottom padding (`env(safe-area-inset-bottom)`)
  - large touch targets (`h-14`) and single-column phone layout
- Build gate result:
  - `npm run build` succeeded on Next.js 16.1.6
- Note:
  - Playwright viewport automation hung in this sandbox (`npm exec playwright-cli --help`), so mobile verification was simplified to responsive implementation + successful production build.

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
- **Prompt:** TBD (revealed live on stage)
- **Deliverable:** Public website URL for co-workers to try and vote on

## What Is In Progress
Nothing — project is in standby until competition day.

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
1. Competition starts — receive the prompt
2. User shares a v0 template link → Claude extracts source via browser
3. Build and iterate rapidly, push to `main` for production deploys
4. Push frequently for continuous deployment
