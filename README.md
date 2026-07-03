# ⚡ Momentum

**The social accountability platform for building better habits.**

Momentum helps small groups stay consistent together — track daily habits and streaks, submit progress reports, give each other peer feedback, and climb a real accountability leaderboard. Built with Next.js 16 and Supabase.

---

## Features

- **Habit tracking** — daily/weekly habits with streaks and a year-long activity heatmap.
- **Accountability groups** — create or join groups via a shareable invite link; each group has members, roles, and a leaderboard.
- **Daily progress reports** — log hours, tasks, mood, and productivity, with photo/video evidence uploads.
- **Peer reviews** — threaded comments and reactions on group members' reports.
- **Real accountability score** — a 0–100 metric computed from daily submissions, habit consistency, goal completion, peer participation, and missed commitments.
- **Group leaderboard** — ranks members by score, with real streaks, weekly consistency, and honest badges (top performer, longest streak, most improved).
- **Weekly reviews** — an auto-generated recap of each completed week plus an editable reflection.
- **Group challenges** — time-boxed goals ("log 20 reports in 30 days") with a live progress leaderboard.
- **Achievements** — personal milestones that unlock from real activity.
- **Notifications** — in-app bell for comments, reactions, joins, progress updates, and reminders.
- **Reminders** — daily in-app nudges plus optional web push (installable PWA).
- **Analytics** — weekly/monthly charts of hours, habits, and productivity.
- **Polish** — light/dark themes, first-run onboarding checklist, and a mobile-friendly, installable PWA.

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| Language | TypeScript, React 19 |
| Backend | [Supabase](https://supabase.com) — Postgres, Auth, Storage, RLS |
| Styling | Tailwind CSS v4, CSS variables for theming |
| State/cache | Zustand (persisted stale-while-revalidate caches) |
| Charts | Recharts |
| Animation | Framer Motion |
| Notifications | Sonner (toasts), Web Push (VAPID) |
| Hosting | Vercel |

## Getting started

### 1. Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project

### 2. Install

```bash
npm install
```

### 3. Environment

Copy the example and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase → Settings → API |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web push | `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | Web push | Server-only |
| `VAPID_SUBJECT` | Web push | e.g. `mailto:you@example.com` |
| `SUPABASE_SERVICE_ROLE_KEY` | Push cron | Server-only — **never** expose to the client |
| `CRON_SECRET` | Push cron | Bearer token Vercel Cron sends to the push route |

### 4. Database

In the Supabase SQL Editor, run the migrations in [`supabase/migrations/`](supabase/migrations) **in numerical order** (`001` → `016`). They set up the schema, RLS policies, storage buckets, and the SQL functions/triggers powering scores, leaderboards, reminders, reviews, and challenges. All are idempotent (safe to re-run).

### 5. Auth configuration

In Supabase → Authentication → URL Configuration, set your **Site URL** and add **Redirect URLs** for both local (`http://localhost:3000/**`) and production (`https://your-app.vercel.app/**`). For Google sign-in, add your Supabase callback (`https://<project-ref>.supabase.co/auth/v1/callback`) to the Google Cloud OAuth client.

### 6. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Project structure

```
src/
  app/
    (dashboard)/        # authenticated app: dashboard, groups, habits,
                        # progress, reviews, analytics, notifications, profile
    api/cron/           # scheduled route (push reminders)
    auth/ login/ signup/ forgot-password/ join/
    manifest.ts icon.svg apple-icon.tsx   # PWA + icons
  lib/
    dal/                # data access layer (Supabase queries per domain)
    supabase/           # browser + server clients
    *-store.ts          # persisted Zustand caches (user, groups, habits)
  components/ui/        # shared UI primitives
supabase/migrations/    # ordered SQL migrations
```

Routing follows Next.js App Router conventions — auth is enforced by [`src/proxy.ts`](src/proxy.ts) (Next 16's renamed middleware).

## Deployment

Deployed on **Vercel**. Push to `master` to trigger a deploy. Set all environment variables in the Vercel project settings, and make sure the Supabase **Site URL / Redirect URLs** point at your production domain. The push-reminder cron is configured in [`vercel.json`](vercel.json).

---

Built for people who get more done when someone's watching. 🎯
