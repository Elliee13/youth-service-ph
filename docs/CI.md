# CI Security Setup

This repo uses two CI jobs:
- `build_and_lint` (PR-safe): runs on `pull_request` and `push` without secrets.
- `rls_smoke` (privileged): runs only on `push` to `main` (or `workflow_dispatch`) and uses protected Environment secrets.

## Required GitHub setup

1. Create Environment: `supabase-ci`  
   GitHub: `Settings -> Environments -> New environment`

2. Add required reviewers to `supabase-ci`  
   This forces approval before privileged jobs can access secrets.

3. Add Environment secrets (not repository secrets) under `supabase-ci`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `TEST_ADMIN_EMAIL`
   - `TEST_ADMIN_PASSWORD`
   - `TEST_CHAPTER_EMAIL`
   - `TEST_CHAPTER_PASSWORD`
   - `TEST_VOLUNTEER_EMAIL` (optional)
   - `TEST_VOLUNTEER_PASSWORD` (optional)

4. Restrict deployment branches for `supabase-ci` to `main` only.

Result:
- PRs cannot access service-role secrets.
- Privileged RLS regression checks run only in trusted contexts with approval.

## CI Orchestration Planning Docs

For the platform-level CI Orchestration API initiative, see:
- [CI Orchestration API Plan](./CI_ORCHESTRATION_API_PLAN.md)
- [CI Orchestration API Execution Checklist](./CI_ORCHESTRATION_API_CHECKLIST.md)
