# Swatantra Aawaj — Koshi

## Product vision

Swatantra Aawaj is a welcoming civic participation platform for Koshi Province, Nepal. It gives citizens one clear place to surface local ideas, understand public priorities, participate in regional polls, and follow community progress.

The experience should feel trustworthy, human, modern, and useful—not bureaucratic. Geographic context must always be visible, anonymous participation must feel safe, and every primary interaction must be understandable without training.

## Current delivery phase: demo-first PWA

The immediate product goal is a client-ready, high-fidelity PWA demonstration. This phase deliberately postpones live infrastructure so the interaction design, product story, and visual direction can be evaluated first.

### Demo requirements

- Launch without credentials, setup screens, or external services.
- Present realistic but fictional Koshi civic content.
- Demonstrate feed discovery, support/oppose voting, issue status, official response, progress milestones, constructive discussion, polls, idea creation, anonymous presentation, activity, and profile flows.
- Work elegantly across mobile and desktop layouts.
- Be installable and cache the application shell for offline startup.
- Persist demo interactions locally and offer an obvious reset action.
- Clearly label the experience as a demo; never imply mock actions reached a government system.

### Demo data boundary

The current homepage is a Client Component backed by curated in-repo fixtures. User interactions are saved to browser `localStorage` only so a presenter can move between screens without losing state.

This local persistence is not a production datastore, mutation queue, sync engine, or conflict-resolution layer. It must be removed or strictly isolated when live Supabase integration begins.

### Current demo journeys

1. **Explore local ideas** — browse, search, and filter a Ward 10 / Biratnagar feed.
2. **Express support** — apply instant support or opposition and see the score respond.
3. **Answer a poll** — select one option and view the community distribution.
4. **Share an idea** — compose a categorized idea and optionally present it anonymously.
5. **Track civic progress** — follow support goals, acknowledgement, review milestones, official responses, and planned action.
6. **Discuss constructively** — open an idea, review a representative conversation, and add a locally persisted demo comment.
7. **Understand collective impact** — review aggregate participation and action metrics alongside relevant updates.
8. **Review citizen context** — see geography, demo contribution stats, install, and reset controls.

## Future delivery phase: production platform

After the product demo is approved, the app returns to the canonical Online-First Real-Time architecture below.

### Production architecture

- Supabase PostgreSQL is the primary source of truth.
- Supabase Auth sessions are established through secure, rate-limited Sparrow SMS OTP flows.
- Supabase Realtime keeps regional feeds and counters fresh.
- PostgreSQL RLS enforces RBAC and geographic isolation.
- Optimistic UI provides immediate feedback and rolls back on failed mutations.
- The PWA caches the UI shell only.

Full offline mutation synchronization remains out of scope. Do not introduce Dexie, IndexedDB queues, Background Sync mutation engines, LWW conflict systems, or tombstone propagation as a sync architecture.

### Production RBAC

| Role | Scope | Capabilities |
|---|---|---|
| Super Admin | Koshi Province | Role assignment, policy oversight, analytics, strictly governed anonymous-author access |
| Admin | Assigned district/local level/ward | Moderate content, publish official updates, and manage regional polls |
| User | Verified home geography | Publish ideas, vote, answer polls, and optionally post anonymously |

### Geographic hierarchy

Production profiles bind to District → Local Level → Ward. Koshi’s 14 districts are Bhojpur, Dhankuta, Ilam, Jhapa, Khotang, Morang, Okhaldhunga, Panchthar, Sankhuwasabha, Solukhumbu, Sunsari, Taplejung, Tehrathum, and Udayapur.

### Anonymous posting

- Anonymous feed payloads must not include a public author identifier.
- Production authorship stays in `post_authorship`, separate from `posts`.
- Only the author and Super Admin may read the protected link under RLS.
- Regional Admins must never receive anonymous-author identity.

### Production security gates

Before any demo interaction is connected to live services:

1. Apply and independently review schema/RLS migrations.
2. Provision Supabase keys without exposing elevated secrets to Client Components.
3. Resolve the current synthetic-email OTP session bridge before disabling Supabase’s Email provider.
4. Validate Sparrow destination formatting, OTP expiry, attempt caps, and phone/IP rate limits.
5. Add server-side validation and authorization to every mutation.
6. Run live RLS cross-role and cross-region tests.
7. Replace demo fixtures/local persistence with authenticated queries and mutations.

## Technology

| Layer | Current demo | Future production |
|---|---|---|
| Framework | Next.js 14 App Router, strict TypeScript | Same |
| Styling | Tailwind CSS, custom responsive design system | Same |
| State | Curated fixtures + isolated `localStorage` | Supabase + Realtime fetch layer |
| Auth | None; demo citizen persona | Sparrow OTP → secure Supabase session |
| PWA | App-shell cache and offline fallback | Same; no offline mutation sync |
| Authorization | Not applicable to fictional local data | PostgreSQL RLS + three-tier RBAC |

## Explicit non-goals for the demo

- Real citizen authentication or identity verification
- Real submission to a municipality or government body
- Live analytics or moderation
- Real geolocation
- Backend persistence or cross-device synchronization
- Production security claims based on local mock data

## Source-of-truth order

1. This document defines product phase and architecture.
2. `AGENTS.md` defines implementation governance and security boundaries.
3. `tracker.md` records current implementation state and the next task.
4. `README.md` is the operator-facing run and demo guide.
