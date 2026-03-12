# Youth Service Philippines - Codebase Study Guide

Last updated: 2026-03-06

## 1. Project Summary

Youth Service Philippines (YSP) is a full-stack volunteer and chapter management platform built as a React single-page application with Supabase as the backend platform.

The system supports three user contexts:
- Public visitors: browse programs, chapters, volunteer opportunities, and contact details.
- Public volunteer accounts: register, sign in, maintain profile information, and sign up for volunteer opportunities.
- Staff users: `admin` and `chapter_head`, each with role-scoped dashboard access.

Core business purpose:
- showcase programs
- display chapter network information
- publish volunteer opportunities
- collect volunteer signups
- allow staff to manage content and operations

## 2. Technology Stack

### Frontend
- React `19.2.0`
- TypeScript `5.9.3`
- Vite `7.2.4`
- React Router DOM `7.11.0`
- Tailwind CSS `4.1.18`
- GSAP `3.14.2`
- Three.js `0.182.0`
- shadcn-style UI primitives using Radix UI components

### UI / component utilities
- `@radix-ui/react-alert-dialog`
- `@radix-ui/react-dialog`
- `@radix-ui/react-dropdown-menu`
- `@radix-ui/react-label`
- `@radix-ui/react-separator`
- `@radix-ui/react-slot`
- `class-variance-authority`
- `clsx`
- `tailwind-merge`
- `lucide-react`

### Backend / platform
- Supabase Auth
- Supabase Postgres
- Supabase Row Level Security (RLS)
- Supabase Storage
- Supabase Edge Functions

### CI / DevOps
- GitHub Actions
- Vercel for frontend hosting
- Supabase CLI for migrations and remote database synchronization

## 3. High-Level Architecture

Architecture style:
- SPA frontend on Vercel
- Supabase as BaaS backend
- direct browser-to-Supabase reads for allowed data
- privileged public write flow moved behind an Edge Function for protection

System boundaries:
- Vercel hosts the frontend only
- Supabase hosts:
  - database
  - auth
  - storage
  - edge functions
- GitHub Actions enforces quality gates and RLS smoke tests

## 4. Route and Layout Architecture

The application is split into route zones.

### Public zone
Layout:
- `src/components/layout/PublicLayout.tsx`

Routes:
- `/`
- `/programs`
- `/programs/:id`
- `/membership-and-chapter`
- `/volunteer-opportunities`
- `/contact`
- `/register`
- `/my-account`
- `/staff`

Behavior:
- Public header and footer render here.
- Authenticated staff users are redirected out of public pages into their dashboard zone.

### Admin zone
Layout:
- `src/components/layout/AdminLayout.tsx`

Routes:
- `/admin`
- `/admin/programs`
- `/admin/chapters`
- `/admin/opportunities`
- `/admin/volunteers`
- `/admin/settings`

Protection:
- `RequireRole("admin")`

### Chapter head zone
Layout:
- `src/components/layout/ChapterHeadLayout.tsx`

Routes:
- `/chapter-head`
- `/chapter-head/opportunities`
- `/chapter-head/volunteers`
- `/chapter-head/reports`

Protection:
- `RequireRole("chapter_head")`

## 5. Authentication and Authorization Logic

### Auth provider
Primary file:
- `src/auth/AuthProvider.tsx`

Responsibilities:
- bootstraps Supabase session on app load
- listens to `onAuthStateChange`
- syncs staff profile from `public.profiles`
- maintains current session, user, profile, and loading state
- clears stale persisted app/auth state when build id changes

### User categories
1. Public volunteer account
- created through `/register`
- stored in `public.users`
- can sign up for volunteer opportunities
- can view own volunteer signup history

2. Staff admin
- authenticated through `/staff`
- requires `profiles.role = 'admin'`
- redirected to `/admin`

3. Staff chapter head
- authenticated through `/staff`
- requires `profiles.role = 'chapter_head'`
- redirected to `/chapter-head`
- scoped to `profiles.chapter_id`

### Authorization model
Authorization is enforced in multiple layers:
- route protection via `src/auth/RequireRole.tsx`
- database RLS in Supabase
- scoped queries in dashboard code
- security-definer helper functions in SQL such as `is_admin()` and `my_chapter_id()`

Important design point:
- UI checks improve UX, but data protection depends on Supabase RLS.

## 6. Public User Flow

### Public browsing
Visitors can browse:
- programs
- chapters
- volunteer opportunities
- contact page

### Public account creation
Route:
- `/register`

Capabilities:
- sign up with email/password
- sign in with email/password
- sign in with Google

### My Account
Route:
- `/my-account`

Capabilities:
- view and update public volunteer profile
- see own volunteer signup history

### Form gating
Files:
- `src/pages/MembershipChapter.tsx`
- `src/pages/VolunteerOpportunities.tsx`
- `src/components/auth/AuthRequiredDialog.tsx`

Current behavior:
- membership form opening requires a signed-in public account
- chapter proposal form opening requires a signed-in public account
- volunteer opportunity signup requires a signed-in public account
- when logged out, the app shows a popup prompting the user to create an account or log in

## 7. Staff Dashboard Logic

### Admin dashboard
Main file:
- `src/pages/AdminDashboard.tsx`

Main capabilities:
- create, update, delete programs
- upload program images
- create, update, delete chapters
- create, update, delete volunteer opportunities
- update site settings

Related admin page:
- `src/pages/AdminVolunteers.tsx`
  - view volunteer signup metrics
  - inspect volunteer signup rows

### Chapter head dashboard
Main file:
- `src/pages/ChapterHeadDashboard.tsx`

Main capabilities:
- create, update, delete volunteer opportunities for own chapter only

Related pages:
- `src/pages/ChapterHeadVolunteers.tsx`
- `src/pages/ChapterHeadReports.tsx`

Chapter head constraints:
- data is scoped by `chapter_id`
- chapter heads should never see other chapters' opportunities or volunteer signups

## 8. UI / Design System

Current UI system combines:
- custom page composition
- Tailwind utility classes
- shadcn-style primitives in `src/components/ui/shadcn`

Primary primitives used:
- `button`
- `input`
- `textarea`
- `label`
- `card`
- `table`
- `dialog`
- `alert-dialog`
- `dropdown-menu`
- `badge`
- `separator`

Dashboard UI direction:
- SaaS-style staff shells
- left sidebar navigation
- top header bar
- KPI cards
- data tables with row action menus
- confirmation dialogs for destructive actions

## 9. API Layer Design

The frontend uses two main API modules.

### Public API
File:
- `src/lib/public.api.ts`

Main exported functions:
- `getSiteSettings()`
- `listPrograms(limit?)`
- `getProgramById(id)`
- `listChapters(limit?)`
- `listVolunteerOpportunities(limit?)`
- `getMyPublicUser()`
- `updateMyPublicUser(input)`
- `signUpForOpportunity(input)`
- `listMyVolunteerSignups()`

Purpose:
- read public content
- manage the public volunteer profile
- submit volunteer signup through Edge Function
- read the signed-in volunteer's own signup history

### Admin API
File:
- `src/lib/admin.api.ts`

Main exported functions:
- `adminListPrograms()`
- `adminCreateProgram(input)`
- `adminUpdateProgram(id, input)`
- `adminDeleteProgram(id)`
- `adminListChapters()`
- `adminCreateChapter(input)`
- `adminUpdateChapter(id, input)`
- `adminDeleteChapter(id)`
- `listOpportunities(chapterId?)`
- `createOpportunity(input)`
- `updateOpportunity(id, input)`
- `deleteOpportunity(id)`
- `getSiteSettingsRow()`
- `updateSiteSettingsRow(input)`
- `listVolunteerSignups()`
- `listVolunteerSignupsByOpportunityIds(opportunityIds)`

Purpose:
- provide CRUD access for staff dashboards
- rely on RLS to authorize actual data operations

### Storage API
File:
- `src/lib/storage.ts`

Main responsibility:
- upload program images to Supabase Storage

## 10. Volunteer Signup Architecture

This is one of the most important parts of the system from a security perspective.

### Old approach
- browser inserted directly into `public.volunteer_signups`

### Current approach
1. Frontend calls `signUpForOpportunity()`.
2. `signUpForOpportunity()` invokes Supabase Edge Function `volunteer-signup`.
3. The Edge Function validates, rate-limits, optionally verifies captcha, and writes using service role.
4. Staff dashboards later read signups via RLS-scoped queries.

### Edge Function file
- `supabase/functions/volunteer-signup/index.ts`

Security hardening in the function:
- CORS allowlist using `ALLOWED_ORIGINS`
- only `POST` and `OPTIONS`
- 8 KB payload size guard
- consistent JSON response contract
- duplicate detection mapped to `unique_signup`
- safe generic error messages
- service-role insert
- optional Cloudflare Turnstile validation

### Frontend anti-spam layer
File:
- `src/components/volunteer/SignUpModal.tsx`

Implemented protections:
- honeypot field
- input normalization
- message length cap
- duplicate error mapping

### Database anti-spam layer
Implemented through migrations:
- unique index on `(opportunity_id, lower(email))`
- insert policies separated for `anon` and `authenticated`
- message length hardening and rate-limit support fields in migration path

## 11. Database and Core Tables

### `profiles`
Purpose:
- staff authorization profile

Key fields:
- `id`
- `role`
- `chapter_id`
- `created_at`

### `users`
Purpose:
- public volunteer profile data

Key fields:
- `id`
- `full_name`
- `email`
- `phone`

### `programs`
Purpose:
- public programs catalog

Key fields:
- `id`
- `title`
- `description`
- `image_url`
- `created_at`

### `chapters`
Purpose:
- chapter directory and chapter contact details

Key fields:
- `id`
- `name`
- `description`
- `location`
- `contact_name`
- `contact_email`
- `contact_phone`
- `created_at`

### `volunteer_opportunities`
Purpose:
- volunteer events and opportunity records

Key fields:
- `id`
- `event_name`
- `event_date`
- `chapter_id`
- `sdgs`
- `contact_details`
- `created_at`

### `volunteer_signups`
Purpose:
- submissions from volunteers for opportunities

Key fields:
- `id`
- `opportunity_id`
- `user_id`
- `full_name`
- `email`
- `phone`
- `message`
- `created_at`
- additive hardening fields in production path:
  - `created_from_ip`
  - `user_agent`

### `site_settings`
Purpose:
- singleton global settings row used for public counts and contact details

Key fields:
- `id = true`
- `projects_count`
- `chapters_count`
- `members_count`
- `contact_email`
- `contact_facebook`
- `contact_mobile`
- `updated_at`

## 12. RLS and Security Model

The system depends heavily on Supabase RLS.

### Public read model
Public content tables are readable to `anon` and `authenticated` where appropriate:
- `chapters`
- `programs`
- `site_settings`
- `volunteer_opportunities`

### Staff write model
Admin writes are protected using `is_admin()` checks.

### Chapter head write model
Chapter heads can create/update/delete opportunities only for their own chapter using:
- `profiles.role = 'chapter_head'`
- `chapter_id = my_chapter_id()`

### Volunteer signup read model
- volunteers can read their own signups
- admins can read all signups
- chapter heads can read signups only for opportunities within their chapter

Important real-world lesson from production:
- if migrations are not pushed to the live Supabase project, frontend behavior may look correct while staff data visibility fails due to missing policies

## 13. Reliability and Production Hardening

A reliability patch was added after observing production issues such as:
- admin mutations stuck in `Saving...`
- cancel buttons becoming unusable
- route changes followed by empty-looking staff pages
- fetch failures rendering as empty states instead of explicit errors

### Reliability fixes applied
Files:
- `src/lib/async.ts`
- `src/lib/storage.ts`
- `src/pages/AdminDashboard.tsx`
- `src/pages/ChapterHeadDashboard.tsx`
- `src/pages/AdminVolunteers.tsx`
- `src/pages/ChapterHeadVolunteers.tsx`
- `src/pages/ChapterHeadReports.tsx`

Implemented patterns:
- scoped mutation states instead of one global page-wide busy flag
- `withTimeout()` helper for long-running async work
- alive/mounted guards to prevent stale state updates after route changes
- `Promise.allSettled()` for partial-safe admin dashboard hydration
- explicit query states:
  - `loading`
  - `error`
  - `empty`
  - `ready`
- persistent inline retry UI on staff volunteer and reports pages

## 14. CI / Quality Gates

Workflow file:
- `.github/workflows/ci.yml`

### PR-safe job
Runs on `pull_request` without secrets:
- `npm ci`
- `npm run lint`
- `npm run build`
- `npm audit --audit-level=high`

### Privileged job
Runs on `push` to `main` and manual dispatch:
- `npm run test:rls`

Protected environment:
- `supabase-ci`

Why it matters:
- PRs do not get service-role secrets
- production-like RLS regression checks run only in trusted contexts

### RLS smoke test
Script:
- `scripts/rls-smoke.ts`

What it verifies:
- anon can read public tables
- anon cannot write protected tables
- admin can do allowed CRUD
- chapter head is scoped to own chapter
- volunteer can insert and read own signups

## 15. Deployment Model

### Frontend deployment
Host:
- Vercel

Important file:
- `vercel.json`

Purpose:
- provides SPA rewrite fallback to `index.html`
- prevents route refresh 404s on nested client-side routes

### Supabase deployment responsibilities
Must be deployed separately from Vercel:
- SQL migrations
- edge functions
- environment secret configuration

### Production alignment requirements
For production to behave correctly, all of these must match the same Supabase project:
- Vercel `VITE_SUPABASE_URL`
- Vercel `VITE_SUPABASE_ANON_KEY`
- pushed migrations
- deployed edge function `volunteer-signup`
- current RLS policies

## 16. Environment Variables

### Frontend required
```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Frontend optional
```env
VITE_APP_BUILD_ID=...
```

Purpose of `VITE_APP_BUILD_ID`:
- helps invalidate stale persisted auth/app state after deployments
- reduces need for users to manually clear site data

### Edge Function / privileged runtime env
Expected by `volunteer-signup`:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALLOWED_ORIGINS`
- `TURNSTILE_SECRET_KEY` optional
- `REQUIRE_TURNSTILE` optional

## 17. Key Project Files to Study

### Architecture and routing
- `src/app/router.tsx`
- `src/components/layout/PublicLayout.tsx`
- `src/components/layout/AdminLayout.tsx`
- `src/components/layout/ChapterHeadLayout.tsx`

### Authentication
- `src/auth/AuthProvider.tsx`
- `src/auth/RequireRole.tsx`
- `src/auth/useAuth.ts`
- `src/lib/profile.service.ts`
- `src/lib/supabase.ts`
- `src/lib/env.ts`

### Public flows
- `src/pages/Register.tsx`
- `src/pages/MyAccount.tsx`
- `src/pages/MembershipChapter.tsx`
- `src/pages/VolunteerOpportunities.tsx`
- `src/components/auth/AuthRequiredDialog.tsx`
- `src/components/volunteer/SignUpModal.tsx`

### Staff flows
- `src/pages/AdminDashboard.tsx`
- `src/pages/AdminVolunteers.tsx`
- `src/pages/ChapterHeadDashboard.tsx`
- `src/pages/ChapterHeadVolunteers.tsx`
- `src/pages/ChapterHeadReports.tsx`

### Backend touchpoints
- `src/lib/public.api.ts`
- `src/lib/admin.api.ts`
- `src/lib/storage.ts`
- `supabase/functions/volunteer-signup/index.ts`
- `supabase/migrations/`

### Operations and CI
- `.github/workflows/ci.yml`
- `scripts/rls-smoke.ts`
- `docs/CI.md`

## 18. Strengths of the Project

Strong points for presentation:
- clear role-based architecture
- meaningful separation between public and staff zones
- strong use of Supabase RLS instead of only client-side checks
- CI includes security-sensitive regression checks
- public signup path hardened behind an Edge Function
- production reliability issues were identified and addressed methodically
- deployment model is practical and modern for a startup or small organization

## 19. Weaknesses / Improvement Areas

Useful to mention honestly in a presentation:
- frontend and Supabase deployments can drift if not coordinated
- large production bundle warning still exists
- some documentation and operational alignment depends on disciplined migration pushing
- additional observability would help with production debugging
- some staff features are still relatively compact and could evolve into more modular sub-pages

## 20. Suggested Presentation Outline

1. Project introduction
2. Problem the platform solves
3. System architecture
4. Tech stack and why each technology was chosen
5. Public user flow
6. Staff user flow
7. Database and security model
8. Volunteer signup hardening
9. Reliability and production fixes
10. CI / deployment pipeline
11. Lessons learned
12. Future improvements

## 21. Short Talking Points for Presentation

- "This project uses a React SPA architecture with Supabase as the backend platform."
- "We separated public routes from staff routes to reduce UI confusion and strengthen access control."
- "Authorization is enforced at both the route level and the database level through RLS."
- "The volunteer signup flow was moved behind a Supabase Edge Function so public writes are validated and rate-limited server-side."
- "We added CI gates, including a privileged RLS smoke test, to catch permission regressions before deployment."
- "We also patched production reliability issues by isolating mutation states, adding async timeouts, and distinguishing loading, error, empty, and ready UI states."

## 22. Commands to Know

Install dependencies:
```bash
npm ci
```

Run development server:
```bash
npm run dev
```

Lint:
```bash
npm run lint
```

Build:
```bash
npm run build
```

Run RLS smoke test:
```bash
npm run test:rls
```

Push Supabase migrations:
```bash
npx --yes supabase db push
```
