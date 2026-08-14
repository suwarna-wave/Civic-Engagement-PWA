# Tracker — Swatantra Aawaj — Koshi

## Project Context

Demo-First PWA for civic participation in Koshi Province. The current goal is a polished, self-contained client demonstration. Future production architecture remains Online-First with Supabase PostgreSQL/Auth/Realtime/RLS and Sparrow SMS OTP.

## Current Architecture State

The homepage is a dependency-free interactive demo backed by curated in-repo fixtures and isolated browser `localStorage` persistence. It imports no Supabase, service-role, Sparrow, or OTP code. The PWA caches the UI shell and exposes a branded offline fallback. Existing production prototypes remain in the repository but are deferred and unreachable from the demo homepage.

## Completed Tasks

- Reframed canonical documentation for Demo-First now / Online-First production later
- Replaced the OTP-gated homepage with a client-ready civic dashboard
- Added responsive desktop sidebar, mobile header, and bottom navigation
- Added curated Koshi idea feed, filters, search, support/oppose voting, sharing, saving, and empty states
- Added interactive community polls with animated results
- Added an idea composer with categories and anonymous presentation
- Added activity and citizen profile views
- Added local demo persistence and one-click reset
- Added install guidance, branded PWA metadata, generated app icons, and redesigned offline fallback
- Removed runtime Google Font dependency from the demo shell
- Preserved Supabase/RLS/OTP prototype code for the future production phase
- Passed ESLint, strict TypeScript production build, PWA worker generation, and desktop/mobile visual inspection
- Added validation and automatic recovery for malformed browser demo state
- Added civic lifecycle states, supporter goals, and per-idea progress milestones
- Added verified official-response presentation and clear demo-only disclaimers
- Added an accessible idea-detail experience with locally persistent constructive discussion
- Added deep-linkable idea details with browser-history synchronization
- Reframed Activity as Community Impact with participation and action metrics
- Replaced the secondary install promotion with a clearer voice → review → action explainer
- Passed final lint, strict TypeScript/PWA production build, and desktop/mobile visual inspection for the expanded experience

## Pending Tasks

1. Conduct stakeholder walkthrough and collect copy/branding feedback
2. Optionally add Nepali/English language switching after copy approval
3. Add final client-provided logo or brand assets if supplied
4. Choose a demo deployment target and configure HTTPS hosting
5. Later: provision Supabase and begin the controlled production transition gate
6. Later: implement geographic onboarding, live polls/moderation, and audited OTP

## Security/Vulnerability Checklist

- [x] Demo homepage has no backend or secret dependency
- [x] Demo user content renders through React text interpolation; no unsafe HTML
- [x] Demo persistence is clearly isolated and resettable
- [x] No analytics, tracking pixels, or third-party runtime fonts
- [x] Existing service-role and Sparrow modules remain server-only and unreachable from the demo UI
- [x] Demo UI does not claim mock actions reached a real government system
- [x] Issue details repeat a clear demo-only government-submission disclaimer
- [x] Locally persisted comments are validated before hydration and rendered as React text
- [x] Full offline mutation sync remains absent
- [ ] Run live RLS/advisor/penetration checks only after a Supabase project is provisioned
- [ ] Resolve synthetic-email auth-provider bridge before production authentication
- [ ] Validate Sparrow 10-digit receiver formatting before production OTP smoke test

## Next Immediate Step

Rehearse the expanded client walkthrough using the README demo script and collect stakeholder feedback on civic status language, official-response tone, and Nepali localization priority.
