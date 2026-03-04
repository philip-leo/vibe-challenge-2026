# Project Context

## Current Status
Fishing game is live on `main`. New centered pond scene is implemented locally and build-passing.

## Latest Session (Mar 4, 2026, 16:46 WET)
- Added two brand assets and integrated them into gameplay visuals:
  - top header now includes a ZKsync logo mark (`public/zksync-foam.svg`)
  - caster icon now uses Zeek Cat logo (`public/zeek-cat.svg`)
- Upgraded pond composition:
  - added clearer stylized rod + line + hook hanging over the pond
- Added special catch mechanic:
  - Zeek Cat appears every ~3rd to 5th successful catch
  - Zeek Cat catch weight is fixed at `1000.00 kg`
  - Zeek Cat appears in catch spotlight, ledger, and daily-best card with logo image
- Build gate result:
  - `npm run build` succeeded on Next.js 16.1.6

## Latest Session (Mar 4, 2026, 16:40 WET)
- Added catch/miss outcome cinematics with no mechanic changes:
  - successful catch now shows a front-and-center spotlight card before ledger commit
  - miss now shows bold red/sad failure card for clearer feedback
- Catch flow update:
  - catch is displayed first
  - ledger entry and daily-best update are committed after a short delay
- UX guardrail:
  - `Cast` button is now active only in `idle` to prevent interrupting outcome animations
- Build gate result:
  - `npm run build` succeeded on Next.js 16.1.6

## Latest Session (Mar 4, 2026, 16:34 WET)
- Upgraded bite alert visibility with no logic changes:
  - full-screen pulse flash during `bite`
  - pond-local glow pulse during `bite`
  - animated `BITE!` badge on scene card
  - `Catch!/Reel` button now strongly pulses and glows on `bite`
- State machine and game rules unchanged (visual signal only).
- Build gate result:
  - `npm run build` succeeded on Next.js 16.1.6

## Latest Session (Mar 4, 2026, 16:31 WET)
- Verified production HTML already contains the centered pond scene and updated copy.
- Applied desktop controls fix:
  - removed `md:sticky` from the action bar
  - controls are now fixed to bottom on desktop as well as mobile
- Build gate result:
  - `npm run build` succeeded on Next.js 16.1.6

## Latest Session (Mar 4, 2026, 16:28 WET)
- Updated visual direction without changing mechanics:
  - kept pure timing state machine exactly as-is
  - removed any "zone required" messaging
- Replaced global ambient fish background with a **centered pond scene card**:
  - pixel-style caster and watcher figures at pond edges
  - cast line and bobber visualization over the pond
  - subtle fish swim animation contained within the pond
- Kept existing gameplay + control flow intact:
  - `Cast` / `Catch!` behavior unchanged
  - bite window logic unchanged
  - ZK Ledger + daily biggest catch intact
- Build gate result:
  - `npm run build` succeeded on Next.js 16.1.6

## Latest Session (Mar 4, 2026, 16:23 WET)
- Removed threshold-zone dependency from catch success and restored pure timing gameplay:
  - bite + quick catch = success
  - early/late catch = miss
- Implemented **Mempool Aquarium** background:
  - low-opacity, blurred fish emojis drifting behind frosted cards
  - CSS keyframes (`zkSwimLTR`, `zkSwimRTL`) for continuous ambient motion
- Implemented **ZK Ledger** panel:
  - replaced "Latest Catch" style block with transaction-like rows
  - row fields: timestamp, emoji/species, tx hash, weight, and `Verified` status badge
  - monospace styling for ledger/tx metadata
- Build gate result:
  - `npm run build` succeeded on Next.js 16.1.6

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
