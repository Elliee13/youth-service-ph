# Youth Service Philippines - System Documentation

## 1. Overview

Youth Service Philippines (YSP) is a single-page application for:

- public discovery of programs, chapters, and volunteer opportunities
- public volunteer account registration and signup history
- staff-only content and operations management
- secure volunteer signup submission through a Supabase Edge Function

The codebase uses a React frontend, Supabase backend services, and GitHub Actions CI with RLS smoke coverage.

## 2. Technology Stack

Frontend:
- React 19.2.0
- TypeScript 5.9.3
- Vite 7.2.4
- React Router DOM 7.11.0
- Tailwind CSS 4.1.18
- GSAP 3.14.2
- Three.js 0.182.0
- shadcn-style primitives using Radix + class-variance-authority

Backend and infrastructure:
- Supabase Auth
- Supabase Postgres with RLS
- Supabase Storage
- Supabase Edge Functions
- Vercel for frontend hosting
- GitHub Actions for CI

## 3. Current Project Structure

```text
src/
  app/
    providers.tsx
    router.tsx
    RouteError.tsx
  auth/
    AuthProvider.tsx
    AuthContext.ts
    RequireRole.tsx
    auth.types.ts
    useAuth.ts
  components/
    auth/
      AuthRequiredDialog.tsx
    cms/
      CmsShell.tsx
      DataTable.tsx
      Field.tsx
      FormActions.tsx
    layout/
      PublicLayout.tsx
      AdminLayout.tsx
      ChapterHeadLayout.tsx
      Header.tsx
      Footer.tsx
    ui/
      shadcn/
        alert-dialog.tsx
        badge.tsx
        button.tsx
        card.tsx
        dialog.tsx
        dropdown-menu.tsx
        input.tsx
        label.tsx
        separator.tsx
        table.tsx
        textarea.tsx
  hooks/
  lib/
    admin.api.ts
    async.ts
    env.ts
    profile.service.ts
    public.api.ts
    storage.ts
    supabase.ts
    supabase.types.ts
    utils.ts
  pages/
    Home.tsx
    Programs.tsx
    ProgramDetail.tsx
    MembershipChapter.tsx
    VolunteerOpportunities.tsx
    Contact.tsx
    Register.tsx
    MyAccount.tsx
    SignIn.tsx
    AdminDashboard.tsx
    AdminVolunteers.tsx
    ChapterHeadDashboard.tsx
    ChapterHeadVolunteers.tsx
    ChapterHeadReports.tsx
  styles/
    globals.css
supabase/
  functions/
    volunteer-signup/
      index.ts
  migrations/
scripts/
  rls-smoke.ts
.github/
  workflows/
    ci.yml
```

## 4. Route Architecture

Route zones are split deliberately.

### Public zone
Rendered through `src/components/layout/PublicLayout.tsx`

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
- public header/footer render here
- staff users are redirected out of this zone directly into their dashboard

### Admin zone
Rendered through `src/components/layout/AdminLayout.tsx`
Protected by `RequireRole("admin")`

Routes:
- `/admin`
- `/admin/programs`
- `/admin/chapters`
- `/admin/opportunities`
- `/admin/volunteers`
- `/admin/settings`

### Chapter head zone
Rendered through `src/components/layout/ChapterHeadLayout.tsx`
Protected by `RequireRole("chapter_head")`

Routes:
- `/chapter-head`
- `/chapter-head/opportunities`
- `/chapter-head/volunteers`
- `/chapter-head/reports`

## 5. Authentication and Authorization

### Public accounts
Public volunteer accounts are created and managed via:
- `/register`
- `/my-account`

Capabilities:
- sign up with email/password
- sign in with email/password
- sign in with Google
- persist volunteer profile data in `public.users`
- view own signup history

### Staff accounts
Staff users authenticate through `/staff`.

Current redirect behavior:
- `admin` -> `/admin`
- `chapter_head` -> `/chapter-head`

If the authenticated user:
- has no profile row
- or has an unsupported role

then the app signs them out and shows a generic non-leaky error.

### Auth provider behavior
`src/auth/AuthProvider.tsx` currently:
- bootstraps session on app load
- syncs profile from Supabase session
- avoids reintroducing global route blocking on `TOKEN_REFRESHED`
- clears persisted app/auth state when the build id changes

### Route protection
`src/auth/RequireRole.tsx` gates staff-only routes.

Important:
- public routes are not protected by `RequireRole`
- only `/admin/*` and `/chapter-head/*` are protected

## 6. Public User Flow Changes

### Membership and chapter forms
Page:
- `src/pages/MembershipChapter.tsx`

Current behavior:
- membership application and chapter proposal open in new tabs
- both actions now require a signed-in public account first
- if logged out, the app opens `AuthRequiredDialog`

### Volunteer opportunity signup
Page:
- `src/pages/VolunteerOpportunities.tsx`

Current behavior:
- logged-out users cannot open the signup modal directly
- clicking `Sign Up Now` shows `AuthRequiredDialog`
- logged-in public users can open the signup modal and submit

### Auth prompt destination
Dialog:
- `src/components/auth/AuthRequiredDialog.tsx`

Links:
- `/register#create-account`
- `/register#sign-in`

## 7. Staff Dashboard Features

### Admin dashboard
Main page:
- `src/pages/AdminDashboard.tsx`

Capabilities:
- create, update, delete programs
- upload program images
- create, update, delete chapters
- create, update, delete volunteer opportunities
- update site settings

Additional page:
- `src/pages/AdminVolunteers.tsx`
  - read volunteer signup data
  - signup metrics
  - signup log table

### Chapter head dashboard
Main page:
- `src/pages/ChapterHeadDashboard.tsx`

Capabilities:
- create, update, delete opportunities scoped to own chapter

Additional pages:
- `src/pages/ChapterHeadVolunteers.tsx`
- `src/pages/ChapterHeadReports.tsx`

These pages are scoped by the chapter head’s `chapter_id`.

## 8. Reliability Hardening

Staff pages were patched to avoid production states where:
- save gets stuck in `Saving...`
- cancel becomes unusable
- route changes leave stale or empty data
- fetch failures render as fake empty success

Implemented:
- scoped mutation flags instead of a single page-wide busy flag
- `withTimeout()` helper in `src/lib/async.ts`
- mounted/alive guards for async handlers
- `Promise.allSettled()` hydration in admin dashboard
- explicit `loading / error / empty / ready` query states on:
  - `AdminVolunteers`
  - `ChapterHeadVolunteers`
  - `ChapterHeadReports`

Files:
- `src/lib/async.ts`
- `src/lib/storage.ts`
- `src/pages/AdminDashboard.tsx`
- `src/pages/ChapterHeadDashboard.tsx`
- `src/pages/AdminVolunteers.tsx`
- `src/pages/ChapterHeadVolunteers.tsx`
- `src/pages/ChapterHeadReports.tsx`

## 9. Volunteer Signup Architecture

### Browser entry point
`src/lib/public.api.ts`
- `signUpForOpportunity(input)`

### Server-side writer
`supabase/functions/volunteer-signup/index.ts`

Current behavior:
- validates input
- normalizes email
- rate limits by IP and email hash
- optionally verifies Cloudflare Turnstile
- inserts into `public.volunteer_signups` using service role
- returns safe JSON errors

### Duplicate protection
- DB uniqueness on `(opportunity_id, lower(email))`
- duplicate response maps to:
  - code: `unique_signup`
  - message: `Already applied for this opportunity.`

### Anti-spam
- honeypot field in signup modal
- message length cap
- server-side rate limiting
- optional captcha

## 10. Data Model Overview

### `profiles`
- `id`
- `role`
- `chapter_id`
- `created_at`

### `users`
Public volunteer profile data:
- `id`
- `full_name`
- `email`
- `phone`

### `programs`
- `id`
- `title`
- `description`
- `image_url`
- `created_at`

### `chapters`
- `id`
- `name`
- `description`
- `location`
- `contact_name`
- `contact_email`
- `contact_phone`
- `created_at`

### `volunteer_opportunities`
- `id`
- `event_name`
- `event_date`
- `chapter_id`
- `sdgs`
- `contact_details`
- `created_at`

### `volunteer_signups`
- `id`
- `opportunity_id`
- `user_id`
- `full_name`
- `email`
- `phone`
- `message`
- `created_at`
- additive hardening fields in production migration path:
  - `created_from_ip`
  - `user_agent`

### `site_settings`
Singleton row:
- `id = true`
- `projects_count`
- `chapters_count`
- `members_count`
- `contact_email`
- `contact_facebook`
- `contact_mobile`
- `updated_at`

## 11. Environment Variables

### Frontend
Required:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Optional:

```env
VITE_APP_BUILD_ID=...
```

### Edge function / privileged runtime
Expected by `volunteer-signup`:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALLOWED_ORIGINS`
- `TURNSTILE_SECRET_KEY` (optional)
- `REQUIRE_TURNSTILE` (optional)

## 12. CI and Verification

Workflow:
- `.github/workflows/ci.yml`

Jobs:
- PR-safe:
  - `npm ci`
  - `npm run lint`
  - `npm run build`
  - `npm audit --audit-level=high`
- privileged:
  - `npm run test:rls`

Protected environment:
- `supabase-ci`

Smoke test:
- `scripts/rls-smoke.ts`

What it validates:
- anon public reads
- anon write denial
- admin CRUD ability
- chapter head own-chapter opportunity scoping
- volunteer own-signup visibility

See also:
- `docs/CI.md`

## 13. Deployment Notes

### Frontend
Host:
- Vercel

SPA fallback:
- `vercel.json`

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Important separation
Vercel deploys:
- frontend only

Vercel does not deploy:
- Supabase migrations
- Supabase Edge Functions

Those must be deployed separately.

### Production alignment requirement
For volunteer signup and staff volunteer views to work correctly in production:
- Vercel env vars must point to the correct Supabase project
- the `volunteer-signup` edge function must be deployed to that project
- staff read policies for `volunteer_signups` must exist in production

## 14. Known Operational Risks

- Large JS bundle warning still appears in production build
- frontend and Supabase deployments can drift if pushed separately without verification
- staff volunteer views depend on production RLS being aligned with repo migrations

## 15. Recommended Commands

```bash
npm ci
npm run dev
npm run lint
npm run build
npm run test:rls
```

Supabase:

```bash
npx --yes supabase db push
```

## 16. Related Docs

- `README.md`
- `progressreport.md`
- `VOLUNTEER_SIGNUP_FEATURE.md`
- `docs/CI.md`
- `SPECIFICATION_EVALUATION.md`
