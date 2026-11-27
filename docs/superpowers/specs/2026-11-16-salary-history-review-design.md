# Review uncertain salary history before using it

Status: implemented locally, with [synthetic browser verification recorded on 26 November](../../qa/profile-current-salary-2461/README.md); pushed-head CI, production inventory and controlled rollout remain required. Follow-up to #2461 and PR #2533.

## Problem and intent

Older Miru callbacks retained replaced future salary rows. The same rows can also represent legitimate independent history. The current PR reproduces an abandoned 2,000 salary appearing instead of 1,000, but cannot safely infer which old rows to discard. Keep every salary payload and effective date intact; make the uncertainty visible and let an authorized administrator resolve it.

## Approaches

The proposed approach is an audited salary-history review in the employee-record area. It gives accounts a usable repair path and protects future upgrades. An operator-only inventory and manual database repair would require less UI, but leaves ordinary admins unable to resolve the problem. Inferring cancellation from timestamps would silently discard potentially valid history and is rejected.

The implementation follows the choices below. No individual legacy salary decision is inferred or automatically approved.

## Behavior

Add nullable `reviewed_at` metadata to compensation versions, with no default or automatic legacy backfill. Existing rows remain unresolved. New explicit declarations from the two existing authorized writers are acknowledged within their employment-lock transaction. A snapshot of previously stored legacy settings is not a new declaration and remains unresolved.

While any active unresolved row remains for an employee, the shared salary resolver reports `compensation_history_requires_review`. The profile shows “Salary history needs administrator review” instead of claiming an uncertain current amount. Salary settings remain editable. Report compensation costs remain unavailable with that flag; they are never zero or guessed. Merely entering a new correction does not acknowledge old rows. Acknowledging an undated row does not invent a salary effective date.

This conservative initial gate also affects legitimate legacy rows until reviewed. Positive historical report audits may be shown as context, but are not used for an automatic migration pass.

## Admin review

Use the existing employee-record owner/admin management permission and current-company scope, without a Pro requirement. The existing report configuration permission requires Pro and must not leave free workspaces unable to resolve a salary warning. This does not make the rest of Pro analytics available for free.

Provide one salary-history review page in the employee-record area, reachable from the profile warning and authorized report warnings. Owners/admins can review retained historical employments in their company as well as current ones; this route exposes salary history only, without opening unrelated personal or bank data. Employee self-service sees the warning but cannot review or read the admin history payload.

For one employment, show active versions and require a decision on every unresolved ID: retain or mark as abandoned. Already reviewed rows are read-only context. Submit the expected complete active-ID set along with the decisions.

Inside the existing employment lock, recheck authorization, workspace and the exact active-ID set. Reject missing, duplicate, overlapping, foreign or stale IDs without changes. Retained rows receive `reviewed_at`; abandoned rows receive `superseded_at`. Preserve original row IDs, encrypted salary values and effective dates. Record actor, company and affected IDs only, atomically with the decisions. Audit failure rolls back everything.

No new role, dependency, generic approval framework, provider call or automatic data repair is needed.

## Verification and rollout

Cover the same legacy A/B/C rows with both valid-B and abandoned-B decisions; incomplete decisions, cross-employment/workspace access, stale submissions, audit rollback and ordinary fresh scheduling. Include free-workspace owners/admins, denied employee reviewers, and retained historical employments. Check profile and report readers against the same result. Retain the existing blank/null, intentional-clear, correction and company-timezone regressions. Verify the admin form and employee warning in a real browser.

Apply metadata migrations before new readers and stop old writers during activation. Perform the production inventory/review before enabling affected financial calculations. Keep schema forward on a code rollback: dropping supersession/review metadata after it has been used would lose decisions. This design authorizes no production repair or deployment by itself.
