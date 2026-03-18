Progress Report (2026-03-06)

Summary
- Public, admin, and chapter-head zones are now structurally separated.
- Staff users sign in through `/staff` and are redirected directly into `/admin` or `/chapter-head`.
- Public volunteer accounts are required before opening membership/chapter forms or signing up for opportunities.
- Staff dashboards were hardened against stuck loading, stalled mutations, and misleading empty states.
- Volunteer signup now writes through a hardened Supabase Edge Function with rate limiting and duplicate protection.
- CI is active with PR-safe checks and privileged Supabase RLS smoke coverage.

Current Working Areas
- Public pages:
  - Home
  - Programs
  - Program detail
  - Membership and Chapter
  - Volunteer Opportunities
  - Contact
  - Register
  - My Account
- Staff pages:
  - Admin dashboard
  - Admin programs
  - Admin chapters
  - Admin opportunities
  - Admin volunteers
  - Admin settings
  - Chapter-head dashboard
  - Chapter-head opportunities
  - Chapter-head volunteers
  - Chapter-head reports

Major Completed Changes

1. Route and layout separation
- Added:
  - `PublicLayout`
  - `AdminLayout`
  - `ChapterHeadLayout`
- Public header no longer appears inside staff pages.
- Staff users are redirected out of public routes into their dashboard zone.

2. Staff auth flow cleanup
- Staff sign-in moved to `/staff`.
- Public header no longer exposes staff dashboard CTA.
- Staff sign-in redirects directly by role:
  - admin -> `/admin`
  - chapter head -> `/chapter-head`

3. Public volunteer account flow
- `/register` now serves as the public account entry point.
- `/my-account` supports saved volunteer profile data and signup history.
- Membership/chapter forms and volunteer signup now require a signed-in public account first.

4. Volunteer signup hardening
- Signup submits through `supabase/functions/volunteer-signup/index.ts`
- Added:
  - duplicate protection
  - rate limiting
  - optional captcha support
  - safe error responses
- Staff volunteer views depend on production RLS policies being aligned.

5. Staff dashboard UI
- Admin and chapter-head pages now use SaaS-style shells.
- Added sidebar navigation and route-backed staff pages.
- Added volunteers and reports pages for staff context.

6. Reliability patch v1
- Added scoped mutation flags for staff forms.
- Added request timeouts.
- Added alive guards for async handlers.
- Replaced all-or-nothing admin hydration with partial-safe refresh.
- Added persistent error states and retry buttons for volunteer/report pages.

7. CI and security
- GitHub Actions CI now runs:
  - lint
  - build
  - audit
  - privileged RLS smoke test on protected environment
- Environment:
  - `supabase-ci`

Recent Production Finding
- Production volunteer signups were being inserted correctly.
- Staff pages initially could not read them because production was missing staff read policies on `public.volunteer_signups`.
- Required policy migration:
  - `20260306103000_staff_read_volunteer_signups.sql`

Important Files
- Routing:
  - `src/app/router.tsx`
- Auth:
  - `src/auth/AuthProvider.tsx`
  - `src/auth/RequireRole.tsx`
  - `src/pages/SignIn.tsx`
  - `src/pages/Register.tsx`
  - `src/pages/MyAccount.tsx`
- Public flow:
  - `src/pages/MembershipChapter.tsx`
  - `src/pages/VolunteerOpportunities.tsx`
  - `src/components/auth/AuthRequiredDialog.tsx`
- Staff dashboards:
  - `src/pages/AdminDashboard.tsx`
  - `src/pages/AdminVolunteers.tsx`
  - `src/pages/ChapterHeadDashboard.tsx`
  - `src/pages/ChapterHeadVolunteers.tsx`
  - `src/pages/ChapterHeadReports.tsx`
- APIs:
  - `src/lib/public.api.ts`
  - `src/lib/admin.api.ts`
  - `src/lib/storage.ts`
  - `src/lib/async.ts`
- Supabase:
  - `supabase/functions/volunteer-signup/index.ts`
  - `supabase/migrations/`
- CI:
  - `.github/workflows/ci.yml`
  - `docs/CI.md`
  - `scripts/rls-smoke.ts`

Current Status
- `npm run lint` passes
- `npm run build` passes
- `npm run test:rls` is available for privileged verification

Next Recommended Checks
- Confirm production Supabase migrations are fully aligned with repo.
- Confirm production `volunteer-signup` edge function is current.
- Run a full manual regression on:
  - public account creation
  - volunteer signup
  - admin volunteer visibility
  - chapter-head volunteer visibility
  - image upload
  - staff dashboard save/delete flows
