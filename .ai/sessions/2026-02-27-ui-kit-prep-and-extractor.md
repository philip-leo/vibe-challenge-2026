# Session: UI-Kit Prep Branch + v0 Extractor — Feb 27, 2026

## Goal
Implement a dual-track setup:
1) Keep `main` minimal
2) Create a ready UI-kit prep branch
3) Add a reliable v0 extraction CLI for fast competition workflows

## Branch and Safety Steps
- Preserved current test-run WIP with commit on `codex/test-run-logo-particles`
- Stashed temporary untracked artifacts
- Switched to `main`
- Created `codex/ui-kit-prep`

## Implemented on `codex/ui-kit-prep`
- Lean UI baseline:
  - Installed `clsx`, `tailwind-merge`, `class-variance-authority`, `@radix-ui/react-slot`, `lucide-react`
  - Added `lib/utils.ts` with `cn()`
  - Added `components/ui/button.tsx`
  - Added `components/ui/card.tsx`
  - Added Tailwind v4-compatible shadcn token setup to `app/globals.css`
  - Added Geist Sans / Geist Mono CDN `<link>` tags to `app/layout.tsx`
  - Added `images.remotePatterns` in `next.config.ts`
- v0 extractor CLI:
  - Added `scripts/v0-extract.mjs`
  - Added npm script: `v0:extract`
  - Supports `--method auto|http|playwright`
  - `auto` does HTTP-first discovery, then Playwright fallback
  - Dumps to `output/v0/<slug>/` and writes `metadata.json`
  - Includes actionable failure messages
- Competition operations:
  - Added `.ai/competition-playbook.md` with 4 paste-ready prompts
  - Added one-line pointer in `AGENTS.md`

## Validation
- `npm run build` passed
- `npm run v0:extract -- https://v0.app/templates/logo-particles-v0-aws-AdFqYlEFVdC --slug logo-particles-smoke --method auto`
  - Passed
  - Extracted:
    - `aws-logo-path.ts`
    - `vercel-logo-particles.tsx`
  - `metadata.json` confirms `discoverMethod: "playwright"` (fallback path exercised)
- `npm run v0:extract -- https://v0.app/templates/logo-particles-v0-aws-AdFqYlEFVdC --slug logo-particles-http-only --method http`
  - Failed as expected with clear guidance to retry `auto` or `playwright`

## Notes
- Added `.gitignore` entries for `output/`, `.playwright-cli/`, and `next-env.d.ts` to keep branch hygiene clean.
- Three.js/R3F intentionally not preinstalled (kept optional by strategy).
