# Swatantra Aawaj — Koshi

A polished, installable civic-engagement demo for Koshi Province, Nepal.

## Current mode: client demo

The app currently runs as a self-contained demonstration with realistic sample content. It intentionally does **not** require Supabase, Sparrow SMS, environment variables, or an internet connection after the PWA shell is cached.

The demo includes:

- Responsive mobile, tablet, and desktop navigation
- Curated regional idea feed with filters and search
- Interactive support/oppose voting
- Visible idea lifecycle states, support goals, and progress milestones
- Verified official-response presentation
- Idea detail view with constructive local discussion
- Shareable/deep-linkable idea detail URLs
- Community polls with animated results
- Idea composer with anonymous-post preview
- Activity and citizen profile views
- Browser-local demo persistence and one-click reset
- Installable PWA shell and branded offline fallback
- Accessible controls, reduced-motion support, and safe-area handling

Demo interactions are stored only in `localStorage`. This is cosmetic demo persistence—not an offline synchronization system and not production data storage.

## Run locally

Use Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No `.env.local` file is required.

## Test the installable PWA

Service-worker generation is disabled during development. Use the production server:

```bash
npm run build
npm run start
```

Open `http://localhost:3000`, install the app from the browser menu, and use the browser’s offline mode to verify the cached shell.

## Demo script

1. Start on **Home** and explain the Ward 10 regional context.
2. Filter ideas with **Trending**, **Nearby**, and **Official**.
3. Support an idea and show the immediate score change.
4. Open an idea with an official response and walk through its support goal, milestones, and discussion.
5. Add a constructive comment and show that it persists locally.
6. Open **Polls**, vote, and show the result distribution.
7. Select **Share an idea**, publish a new idea, and show it at the top of the feed.
8. Show **Activity** for aggregate community impact and the citizen **Profile**.
9. Use **Reset demo** before the next presentation.

## Future production phase

Supabase PostgreSQL, RLS, Realtime, Sparrow OTP, geographic onboarding, and administrative moderation remain the intended production architecture. Existing backend prototypes are retained under `src/app/actions`, `src/lib/supabase`, `src/lib/otp`, `src/hooks`, and `supabase/`, but the demo homepage does not import or execute them.

Production integration must follow [ProjectsDescription.md](ProjectsDescription.md), [AGENTS.md](AGENTS.md), and the security requirements recorded in [tracker.md](tracker.md).

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Run the demo in development mode |
| `npm run lint` | Run Next.js ESLint checks |
| `npm run build` | Create the production/PWA build |
| `npm run start` | Serve the production build |
