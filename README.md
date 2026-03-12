# Youth Service Philippines

Youth Service Philippines is a React + Vite + TypeScript web application backed by Supabase. It supports:

- public browsing of programs, chapters, and volunteer opportunities
- public volunteer accounts for faster signup and signup history
- staff-only admin and chapter-head dashboards
- Supabase-backed volunteer signup hardening and RLS validation

## Current Architecture

Frontend:
- React 19
- TypeScript 5.9
- Vite 7
- React Router 7
- Tailwind CSS 4
- shadcn-style UI primitives under `src/components/ui/shadcn`

Backend:
- Supabase Auth
- Supabase Postgres with RLS
- Supabase Storage for program images
- Supabase Edge Function: `volunteer-signup`

CI:
- GitHub Actions
- PR-safe lint/build/audit job
- privileged RLS smoke test on `main` via protected environment secrets

## Route Zones

Public:
- `/`
- `/programs`
- `/programs/:id`
- `/membership-and-chapter`
- `/volunteer-opportunities`
- `/contact`
- `/register`
- `/my-account`
- `/staff`

Staff:
- `/admin`
- `/admin/programs`
- `/admin/chapters`
- `/admin/opportunities`
- `/admin/volunteers`
- `/admin/settings`
- `/chapter-head`
- `/chapter-head/opportunities`
- `/chapter-head/volunteers`
- `/chapter-head/reports`

Notes:
- public pages render through `PublicLayout`
- staff pages render through `AdminLayout` or `ChapterHeadLayout`
- authenticated staff users are redirected out of public routes directly into their dashboard zone

## Public User Flow

Volunteer/public accounts use `/register` and `/my-account`.

Capabilities:
- create account with email/password
- sign in with email/password
- sign in with Google
- maintain saved full name / email / phone
- view volunteer signup history

Public gating:
- membership and chapter form buttons require a signed-in public account
- volunteer opportunity signup requires a signed-in public account
- when logged out, users see an auth-required dialog with links to:
  - `/register#create-account`
  - `/register#sign-in`

## Staff User Flow

Staff sign in through `/staff`.

Behavior:
- `admin` redirects to `/admin`
- `chapter_head` redirects to `/chapter-head`
- unsupported or missing profile roles are signed out with a generic error

Staff roles:
- `admin`
- `chapter_head`

## Reliability Improvements Applied

Staff pages were hardened to prevent stuck loading and misleading empty states.

Implemented:
- scoped mutation states instead of one page-wide busy flag
- request timeouts via `src/lib/async.ts`
- mounted/alive guards to avoid stale state updates after route change
- `Promise.allSettled`-based admin dashboard hydration
- explicit `loading / error / empty / ready` query states on volunteer/report pages

Primary files:
- `src/pages/AdminDashboard.tsx`
- `src/pages/ChapterHeadDashboard.tsx`
- `src/pages/AdminVolunteers.tsx`
- `src/pages/ChapterHeadVolunteers.tsx`
- `src/pages/ChapterHeadReports.tsx`
- `src/lib/storage.ts`

## Volunteer Signup Flow

Public signup no longer inserts directly into the table from the browser.

Current flow:
1. Public UI calls `signUpForOpportunity()` in `src/lib/public.api.ts`
2. That invokes Supabase Edge Function `volunteer-signup`
3. The edge function:
   - validates input
   - applies rate limiting per IP and email hash
   - optionally verifies Turnstile
   - inserts with service role
4. Admin and chapter-head dashboards read signups through RLS-scoped queries

Related files:
- `src/components/volunteer/SignUpModal.tsx`
- `src/lib/public.api.ts`
- `src/lib/admin.api.ts`
- `supabase/functions/volunteer-signup/index.ts`
- `supabase/migrations/20260305143000_volunteer_signup_rate_limit_and_hardening.sql`
- `supabase/migrations/20260306103000_staff_read_volunteer_signups.sql`

## Environment Variables

Required app env:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Optional:

```env
VITE_APP_BUILD_ID=...
```

Runtime behavior:
- app boot compares `VITE_APP_BUILD_ID` (or injected app version) against local persisted state
- on mismatch, stale local auth/app keys are cleared to avoid “clear site data” issues after deploys

## Development

Install:

```bash
npm ci
```

Run:

```bash
npm run dev
```

Quality gates:

```bash
npm run lint
npm run build
npm run test:rls
```

## Deployment

Frontend:
- Vercel static deploy
- SPA rewrite configured in `vercel.json`

Important:
- Vercel deploys only the frontend
- Supabase migrations and edge functions must be deployed separately

Required production alignment:
- Vercel env vars must point to the intended Supabase project
- Supabase migrations must be pushed
- `volunteer-signup` edge function must be deployed

## CI

Workflow:
- `.github/workflows/ci.yml`

Jobs:
- `Build / Lint / Audit (PR-safe)`
- `RLS Smoke (Privileged)`

Protected environment:
- `supabase-ci`

See:
- `docs/CI.md`

## Key Docs

- `DOCUMENTATION.md` — full system documentation
- `progressreport.md` — current implementation snapshot
- `VOLUNTEER_SIGNUP_FEATURE.md` — signup hardening feature notes
- `docs/CI.md` — CI environment setup
- `SPECIFICATION_EVALUATION.md` — spec audit against YSP requirements
