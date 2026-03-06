# CI Orchestration API Plan

## 1) Purpose
Build a reusable, secure CI orchestration layer on top of GitHub Actions so multiple repositories can consume one standardized pipeline control API instead of maintaining custom privileged workflow logic per repo.

This document is planning-only. It defines architecture, controls, rollout, and success criteria. It does not include implementation code.

## 2) Current Baseline (What Already Exists)
- Repo-level CI with two jobs:
- `Build / Lint / Audit (PR-safe)` for pull requests and main pushes.
- `RLS Smoke (Privileged)` for trusted contexts only.
- Least-privilege workflow token (`permissions: contents: read`).
- Privileged secrets isolated in GitHub Environment `supabase-ci`.
- Secret validation step that fails early if required variables are missing.
- Local and CI gates aligned: `lint`, `build`, `audit`, and `test:rls`.

This is a strong foundation and should become the reference policy model for the orchestration project.

## 3) Problem Statement
- Teams duplicate CI YAML and security controls across repos.
- Secret governance becomes inconsistent at scale.
- Privileged workflow policies can drift.
- Auditability is fragmented repo-by-repo.
- Operational visibility is low without centralized run metadata.

## 4) Target Outcomes
- Reusable CI orchestration API for GitHub-based repos.
- Central policy enforcement before workflow dispatch.
- Strong separation between PR-safe and privileged pipelines.
- Centralized audit trail for trigger decisions and outcomes.
- Faster onboarding of new repositories to secure CI defaults.

## 5) Scope (MVP v1)
- API endpoints to trigger and inspect workflows.
- Policy allowlists for repository, workflow, and branch.
- Secure GitHub integration using GitHub App or scoped token.
- Standard workflow templates for PR-safe and privileged jobs.
- Audit events for request, policy decision, dispatch, and completion.

## 6) Out of Scope (v1)
- Deployment orchestration across cloud providers.
- Custom runner autoscaling.
- Monorepo dependency graph optimization.
- Full policy-as-code engine with custom DSL.
- Cross-VCS support (GitLab/Bitbucket) in v1.

## 7) High-Level Architecture
### Components
- `ci-gateway` service:
- Receives authenticated requests from internal users/systems.
- Validates request against policy.
- Dispatches GitHub workflows.
- Returns normalized run metadata.
- Records audit events.

- `policy module`:
- Enforces allowlists and privileged workflow constraints.
- Rejects untrusted refs for privileged workflows.
- Validates required fields and workflow inputs.

- `github adapter`:
- Encapsulates GitHub API calls:
- workflow dispatch
- run status retrieval
- optional logs/artifacts links

- `audit store`:
- Persist trigger metadata, decision reason, and run outcome.
- Can start with append-only JSON/file or simple table, then move to durable DB.

### Request Flow
1. Caller sends request to `POST /v1/runs`.
2. Service authenticates caller and resolves identity.
3. Policy check runs:
- repo allowed?
- workflow allowed?
- ref allowed for requested workflow class?
4. If allowed, dispatch workflow via GitHub API.
5. Return accepted response with run correlation ID.
6. Caller polls `GET /v1/runs/:id` for status.
7. Service emits structured audit logs for all steps.

## 8) Security Model
### Identity and Access
- Caller auth required for every API request.
- Recommended: short-lived internal token or OIDC-backed service auth.
- Role-based permissions:
- `viewer`: read run status for permitted repos.
- `operator`: trigger PR-safe workflows.
- `privileged-operator`: trigger privileged workflows for approved refs only.
- `admin`: manage policy configuration.

### GitHub Authentication
- Preferred: GitHub App with repo-scoped installation and minimal permissions.
- Temporary fallback: fine-grained PAT with strict scope and short rotation cycle.

### Policy Controls
- Allowlist repositories explicitly.
- Allowlist workflow files explicitly.
- Allowlist branches/tags per workflow class.
- Hard-block privileged workflow triggers from PR refs.
- Require environment-based secrets for privileged workflows.

### Secret Handling
- Secrets stay in GitHub Environments, not passed through API payloads.
- API never returns sensitive values.
- API logs must redact headers/tokens/secrets.

### Blast Radius Reduction
- Top-level least privilege for workflow tokens.
- No `pull_request_target` usage for untrusted code execution.
- Privileged runs gated by environment approval controls.

## 9) API Contract (MVP)
### `POST /v1/runs`
Purpose:
- Trigger a known workflow on a known repo/ref if policy allows.

Input:
- `owner` (string)
- `repo` (string)
- `workflow_id` (string; file name or workflow ID)
- `ref` (string; branch/tag)
- `inputs` (object, optional)
- `run_class` (enum: `pr-safe` or `privileged`)

Output:
- `request_id`
- `accepted` boolean
- `policy_decision` (`allow` or `deny`)
- `reason` (machine-readable)
- `workflow_run` metadata if accepted

### `GET /v1/runs/:owner/:repo/:run_id`
Purpose:
- Return normalized run status from GitHub.

Output:
- `status`
- `conclusion`
- `html_url`
- `created_at`, `updated_at`

### `GET /health`
Purpose:
- Liveness/readiness endpoint.

## 10) Policy Baseline (Initial Rules)
- Privileged workflows allowed only on:
- `push` to `main`
- explicit trusted manual dispatch
- Privileged workflows require:
- environment assignment
- required environment secrets present
- optional required reviewers in environment protection
- PR-safe workflows:
- may run on pull requests
- must not reference privileged secrets

## 11) Standard Workflow Strategy
- Keep reusable templates for:
- `pr-safe` gates: `npm ci`, `lint`, `build`, `audit`.
- `privileged` gates: integration/security smoke tests using environment secrets.
- Repositories consume templates and pass minimal repo-specific inputs.
- Ensure required checks are enforced in branch protection rules.

## 12) Rollout Plan
### Phase 0: Design and Decisions
- Finalize API schema, policy rules, and auth approach.
- Write ADRs for key decisions.

### Phase 1: MVP Service
- Implement trigger/status endpoints and policy checks.
- Integrate with GitHub API.
- Add structured logs and audit records.

### Phase 2: Pilot Repos
- Onboard 2 to 3 repos with different complexity.
- Validate policy enforcement and developer UX.
- Measure timing and reliability.

### Phase 3: Governance and Hardening
- Add stronger RBAC, rotation policies, and incident playbooks.
- Add dashboards and alerting.
- Expand to more teams.

## 13) Acceptance Criteria
- PR-safe and privileged workflows are clearly separated.
- No privileged secret access from untrusted contexts.
- Every dispatch has a recorded policy decision.
- Unauthorized trigger requests are blocked with explicit reasons.
- Onboarded repos can use shared workflow pattern with minimal custom YAML.

## 14) Operational Runbooks
### Runbook: Trigger Denied
- Check policy logs for denial reason.
- Confirm repo/workflow/ref allowlists.
- Confirm caller role permits requested run class.

### Runbook: Privileged Run Fails for Missing Secrets
- Confirm environment name match.
- Confirm secret keys exist in environment scope.
- Confirm branch restriction and reviewer approval flow.

### Runbook: GitHub API Failure
- Confirm app installation/permissions.
- Retry with bounded exponential backoff.
- Surface actionable error code to caller.

## 15) Risk Register
- Risk: API token abuse.
- Mitigation: strict RBAC, short-lived tokens, request logging, rate limits.

- Risk: policy misconfiguration allows unsafe trigger.
- Mitigation: default deny, explicit allowlists, change reviews, dry-run mode.

- Risk: secret leakage in logs.
- Mitigation: redact sensitive headers/fields, log scanning, minimal log detail.

- Risk: single service outage.
- Mitigation: health checks, retry strategy, graceful degradation.

## 16) Metrics and KPIs
- Lead time to onboard a new repo.
- Percentage of repos using standard workflows.
- Privileged run success rate.
- Mean time to diagnose CI failures.
- Number of policy denials by reason.
- Number of secret-access violations prevented.

## 17) Governance Model
- Change control for policy updates with mandatory review.
- Quarterly access review for caller roles and GitHub app permissions.
- Incident review for any privileged failure or policy bypass attempt.
- Documentation update required for every policy change.

## 18) Project Structure Recommendation (When Implementation Starts)
- `platform/ci-gateway/`
- `docs/ci-gateway/`
- `workflows/templates/` (or dedicated shared workflow repo)

Keep this project isolated from app runtime code to avoid coupling and reduce blast radius.

## 19) Environment and Secret Requirements (Planned)
For repos using privileged tests similar to current setup:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TEST_ADMIN_EMAIL`
- `TEST_ADMIN_PASSWORD`
- `TEST_CHAPTER_EMAIL`
- `TEST_CHAPTER_PASSWORD`
- optional volunteer test credentials

Store these in GitHub Environment secrets, not repo secrets.

## 20) Decision Log (Initial)
- Decision: Keep existing repo CI untouched while planning platform.
- Rationale: avoid destabilizing current release process.

- Decision: Design policy-first API before coding.
- Rationale: security model must be explicit before implementation.

- Decision: Keep privileged execution environment-gated.
- Rationale: minimizes secret exposure risk in untrusted contexts.

## 21) Next Planning Artifacts
- `ADR-001`: GitHub App vs fine-grained token.
- `ADR-002`: Policy storage location and versioning.
- `ADR-003`: Audit storage backend choice.
- `Threat model`: abuse scenarios and control mapping.
- `SLO draft`: availability and response-time targets for API.

## 22) Immediate Next Steps
1. Review this plan and approve MVP scope.
2. Confirm auth strategy (GitHub App preferred).
3. Approve policy baseline rules.
4. Approve pilot repo list and success metrics.
5. Start implementation only after these are agreed.
