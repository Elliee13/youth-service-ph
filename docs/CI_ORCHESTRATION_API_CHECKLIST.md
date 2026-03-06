# CI Orchestration API Execution Checklist

Use this checklist during implementation to keep scope, security, and rollout aligned with the plan.

## 1) Planning Gate
- [ ] MVP scope approved.
- [ ] Non-goals confirmed.
- [ ] Pilot repositories selected.
- [ ] KPIs and success criteria agreed.

## 2) Security Gate
- [ ] Threat model reviewed.
- [ ] Auth model selected for callers.
- [ ] GitHub auth method selected (GitHub App preferred).
- [ ] Policy default mode is deny-by-default.
- [ ] Secret redaction strategy documented.
- [ ] Incident escalation contacts documented.

## 3) API Contract Gate
- [ ] `POST /v1/runs` contract finalized.
- [ ] `GET /v1/runs/:owner/:repo/:run_id` contract finalized.
- [ ] Error codes and reason taxonomy defined.
- [ ] Idempotency and retry behavior defined.

## 4) Policy Gate
- [ ] Repo allowlist implemented.
- [ ] Workflow allowlist implemented.
- [ ] Branch/ref allowlist implemented.
- [ ] Privileged run class blocked for untrusted refs.
- [ ] Policy decision logging includes allow/deny reason.

## 5) GitHub Integration Gate
- [ ] Workflow dispatch path works for PR-safe run class.
- [ ] Workflow dispatch path works for privileged run class.
- [ ] Run status retrieval is normalized.
- [ ] API failures mapped to safe user-facing errors.

## 6) Observability Gate
- [ ] Structured logs in place.
- [ ] Request ID/correlation ID in every operation.
- [ ] Audit records include requester + policy decision + run metadata.
- [ ] Basic metrics emitted (success/fail/latency).

## 7) Reliability Gate
- [ ] Timeouts set for outbound GitHub API calls.
- [ ] Bounded retries implemented where safe.
- [ ] Backoff strategy documented.
- [ ] Health endpoint and readiness checks available.

## 8) Workflow Standardization Gate
- [ ] Shared PR-safe template ready.
- [ ] Shared privileged template ready.
- [ ] Onboarding instructions for consuming repos ready.
- [ ] Branch protection check requirements documented.

## 9) Pilot Gate
- [ ] Pilot repo 1 onboarded.
- [ ] Pilot repo 2 onboarded.
- [ ] Deny policy tested with intentional bad requests.
- [ ] Privileged environment gating verified.
- [ ] Pilot metrics captured and reviewed.

## 10) Production Readiness Gate
- [ ] RBAC reviewed.
- [ ] Secret access paths reviewed.
- [ ] Runbooks tested.
- [ ] Rollback and kill-switch plan validated.
- [ ] Ownership and on-call responsibilities assigned.

## 11) Post-Launch
- [ ] 30-day review completed.
- [ ] Security review completed.
- [ ] Backlog for v2 prioritized.
- [ ] Documentation updated with lessons learned.
