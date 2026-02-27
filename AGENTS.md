# Vibe Challenge 2026

Live coding competition at the Matter Labs Lisbon offsite — March 4, 2026.
Build, design, and deploy a website from scratch in 1 hour using AI tooling.

## Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Hosting:** Vercel (auto-deploy on push to `main`)

## Deploy Workflow

```
# Edit code locally → push → Vercel auto-deploys in ~30s
git add -A && git commit -m "description" && git push origin main
```

- **Live URL:** https://vibe-challenge-2026.vercel.app
- **Repo:** https://github.com/philip-leo/vibe-challenge-2026

## Conventions

- **Tailwind-first:** Use utility classes. Avoid custom CSS unless absolutely necessary.
- **App Router:** All pages in `app/`. Use `page.tsx` for routes, `layout.tsx` for shared layouts.
- **Components:** Create in `app/components/` when reuse is needed. Keep flat — no deep nesting.
- **TypeScript:** Use it, but don't over-type. `any` is fine in a sprint.
- **Images:** Put in `public/`. Use Next.js `<Image>` component.

## Competition Mode

This is a **timed competition**. The following rules override normal best practices:

1. **Ship > Perfect.** Working code that's live beats elegant code that isn't.
2. **Iterate fast.** Push early, push often. Don't batch changes.
3. **No over-engineering.** No state management libraries, no ORMs, no complex abstractions.
4. **Inline is fine.** Keeping things in fewer files is faster than perfect separation.
5. **Tailwind patterns for speed:**
   - Hero: `flex flex-col items-center justify-center min-h-screen`
   - Card: `rounded-xl shadow-lg p-6 bg-white`
   - Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
   - Nav: `flex items-center justify-between p-4`
   - Button: `px-4 py-2 rounded-lg font-medium transition-colors`
6. **If stuck for >2 min, simplify the approach.**

## Context Files

- `.ai/context.md` — Current project state. Update during the competition.
- `CLAUDE.md` — Pointer for Claude Code / Codex.
