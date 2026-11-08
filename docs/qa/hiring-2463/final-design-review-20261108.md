# Whole-branch design review — 8 November 2026

Review target: `feature/sonam-release-integration-20261104` against the supplied fresh `origin/develop` base `10e457e1d0cd`, including the working-tree assignment email, scoped interviewer notes and continuous ATS journey. The baseline contains 106 branch commits and 1,005 changed files; this is a targeted whole-product risk review, not a claim to have read every changed line.

**Current status: both original P2 findings are resolved. A fresh native seven-pass re-review is clear at 8/10 on the fingerprinted runtime below. Final commit identity and its external council entry remain pending.**

## Scope, gates and evidence

The skill's initial scope gate uses its explicit-target exception: this invocation names the literal branch diff and base. The coordinator subsequently clarified all seven passes, text only, with mockups skipped, and authorized one bounded configured Claude Code design consultation. Those are current delegated task requirements, not fabricated human menu answers. The real skill-start output reports `SESSION_KIND: interactive`; it was not changed to spawned. After the initial review, the coordinator assigned the two bounded remedies and focused browser verification. No production action or unrelated source edit was performed.

Calibration: repository `AGENTS.md`, [DESIGN.md](../../../DESIGN.md), the approved ATS/document designs, the 103-row [acceptance matrix](acceptance-matrix-20261108.md) and current QA reports. DESIGN.md specifies Operational Calm, semantic tokens, role-appropriate actions, explicit financial status, mobile-safe workflows, visible focus and a 40px minimum touch target. Existing 44px hiring/document treatments meet that contract. Its 14px app-body scale is an explicit product convention; the generic skill's marketing typography rules do not justify a branch-wide cosmetic rewrite.

The review read the changed UI inventory, recent history, prior design-review artifact and relevant gstack learnings. Prior regressions checked for recurrence include whole-parent clearing after child access denial, stale invitation versions, keyboard checkbox double toggling and ambiguous provider completion. Private candidate panels now clear; two remaining denial-navigation and deadline-label problems are identified below.

Primary evidence includes actual synthetic screenshots inspected in this invocation:

- [Mercury unknown outcome](../../qa-evidence/mercury-payroll/07-outcome-unknown.png) and [mobile payroll](../../qa-evidence/mercury-payroll/11-mobile.png): distinct approval, bank state, credit and unknown recovery.
- [Employee records mobile](../employee-profiles-2461/records-mobile.png): unknown values, scoped documents, manual-payment history and report controls.
- [Mobile PDF placement](../generic-document-signing-2462/verification-20261107/signature-placement-mobile.png) and [unverified signed artifact](../generic-document-signing-2462/verification-20261107/short-signed-document-rejected-375.png): keyboard instructions, field geometry and unavailable-download warning.
- [Assigned interviewer notes](notes-20261108/notes-assigned-reviewer-mobile.png), [assignment no-access state](assignment-email-20261108/assignment-mail-access-denied-mobile.png), [candidate assignment](assignment-email-20261108/assignment-mail-private-portal-mobile.png), assignment preview/retry/delivery captures and the [continuous two-PDF handoff](full-journey-20261108/08-linked-generic-two-pdf-fields.png).

The primary reviewer also inspected current candidate-message, form/assessment expiry, application-denial, hiring navigation/overview/deletion, Mercury preflight/request and Razorpay recovery sources. Existing [profile](../employee-profiles-2461/README.md), [document](../generic-document-signing-2462/verification-20261107.md), [payment review](../../qa-evidence/razorpay-payment-review-20261103.md) and [Task 9](pipeline-retention-20261108.md) reports retain their historical source attribution. Screenshots alone do not establish permissions or byte integrity; the linked request/browser checks provide separate evidence.

The coordinator's earlier assembled checkpoint reports **860 related backend examples and 160 combined native Brave examples, zero failures**. The later whole-backend result is **6,127 examples, zero failures, 59 pending**, separately run by the coordinator. Counts overlap earlier checkpoints; pending examples are not passes. The continuous synthetic [journey proof](full-journey-20261108/journey-proof.json) records one candidate/application, actual durable queue completion, local SMTP subjects and authorized private-download hashes. It closes the earlier composed-journey evidence gap locally, without establishing real inbox/provider/production setup. The new seven-case UI regression proof below is independent of the earlier combined-browser count; the final expanded run belongs in the coordinator's exact-source release evidence.

For final identity comparison, `/tmp/miru-final-design-runtime-fingerprints-20261108.json` records 327 changed runtime paths, including deleted-path markers. The canonical runtime-set SHA256 is `f41981ba1127aecdbaae9d31b173559faedade96e52057154326a167f334cea6`. This identifies the source snapshot; it does not imply line-by-line review coverage of all 327 files. Commit-blob comparison must precede a clean entry. The tracked report is completed before commit; final SHA binding belongs in external review metadata, avoiding circular tracked-document edits.

## Step 0 — initial assessment

Initial impression: **8/10**. Existing workflows are implemented with detailed local evidence rather than unspecified screens. A 10 would require terminal source identity, resolved material findings and broader fresh accessibility/assistive-technology coverage; it would not mean production certification.

What already exists: reusable tokenized Button/Input/Label/Alert primitives, role-specific app navigation, private standalone candidate portals, explicit preview/confirm actions, durable attempt history, read-only issued versions, generic PDF field controls, searchable bounded pickers and parent-level access-denial clearing. No replacement design system or information architecture is proposed.

## Original confirmed findings and verified dispositions

### D1 — P2, resolved: hard candidate cutoffs omitted the time zone

`AssessmentPortal.tsx:307` renders the assignment deadline using bare `toLocaleString()`; `Portal.tsx:346` does the same for form-link expiry. The actual candidate screenshot shows a hard cutoff such as “Due 11/5/2026, 5:30:00 PM” without its zone. The link expires at that instant and unsent answers remain local to the page. A candidate cannot confidently reconcile that display with an emailed UTC deadline, another browser's zone or travel.

Minimum remedy: label the existing displayed instant with its actual browser IANA zone/offset, consistently on both candidate surfaces. Preserve the same absolute deadline, server enforcement, saved drafts and private capability exchange. The offer portal already shows its applicable zone and does not need a redesigned expiry flow. Verify visible zone text and exact instant on the real candidate pages, including 375px containment. This restores the accepted clear-time-zone requirement; it is not permission to change deadlines or company policy.

Disposition: both surfaces now show the actual browser IANA zone inline and expose the unchanged absolute instant through semantic `time[datetime]`. No helper, portal dependency or server deadline changed. The first browser regression failed on the missing time element before the fix. The final case checks both visible IANA labels and exact parsed instant equality. [Assignment cutoff](design-remedies-20261108/candidate-assignment-zoned-mobile.png) and [form expiry](design-remedies-20261108/candidate-form-zoned-expiry-mobile.png) were visually inspected at 375px.

### D2 — P2, resolved: access denial retained management actions and generic Retry

`ApplicationDetail.tsx:92–104` renders Retry for every failure, including confirmed access denial. `Hiring/index.tsx:329–376` still shows Manage roles, Hiring overview, Communication settings, Email inbox, Add application, Assignment library and Interview panel after private content is cleared. The actual no-access screenshot confirms the combination.

Server authorization and parent clearing protect the private data; this finding is a role-clarity/recovery defect, not evidence of a successful unauthorized action. A revoked Admin or non-hiring staff member sees actions they cannot use and a Retry label suggesting a transient failure. Minimum remedy: distinguish access denial from recoverable loading failures and remove unavailable management navigation/actions for that state, with a safe route back to permitted work. Keep Retry for actual transient errors and retain whole-page private clearing. Verify both a removed Admin and network-error recovery; do not broaden hiring permissions.

Disposition: the Hiring shell registers scoped Axios request/response guards in `useLayoutEffect`, before child passive effects issue their first request. They track requests belonging to the mounted workspace, clear and unmount the whole workspace on authoritative 403 or explicit workspace conflict, and deny plus throw when a successful response belongs to the wrong company. Cleanup ejects both interceptors. The focused denial state has a safe dashboard link and no hiring management navigation or Retry. Ordinary record 404 and transient 503 retain navigation; the 503 case recovers the private page through Retry.

The original child-403 regression failed before implementation. A separate initial-load regression reproduced the passive-effect registration gap before changing registration to `useLayoutEffect`. Final coverage includes initial and child 403, wrong-company success, explicit workspace 409, transient 503 recovery and ordinary 404. The [initial denial](design-remedies-20261108/workspace-initial-access-denied-mobile.png), [revoked access](design-remedies-20261108/workspace-access-denied-mobile.png), [workspace mismatch](design-remedies-20261108/workspace-response-mismatch-mobile.png), [transient Retry](design-remedies-20261108/workspace-transient-retry-mobile.png) and [ordinary missing record](design-remedies-20261108/workspace-missing-record-mobile.png) were visually inspected. No hiring permission or backend authorization changed.

## Initial seven design passes — findings preserved before remedies

### 1. Information architecture — 7/10 → 7/10

The app shell separates operational, financial, personal and organization work. Hiring begins with identity/source/status and reveals screening, assessments, rounds, decisions and offers. Uploaded documents are primary; templates are secondary. Financial preparation, approvals and actual payment requests have distinct sections. The confirmed D2 role-inappropriate actions prevent a clean result. No other material hierarchy issue was found; long operational pages alone do not justify navigation redesign.

Existing accepted flow:

```text
Admin intake → candidate form → explicit assignment → designated review
            → scoped interview/feedback → explicit decision → private offer
            → acceptance → confirmed staff handoff → generic PDF draft

Payroll revision → accounts/final approval → prepared provider request
                 → independent bank approval/status → recorded INR credit
```

### 2. Interaction state coverage — 7/10 → 7/10

| Surface | Loading / empty | Error / partial | Confirmed result |
| --- | --- | --- | --- |
| Hiring overview | Loading text; empty filtered cohort | Invalid-filter recovery; private parent clearing | Paginated cohort and recorded denominators |
| Candidate forms/assignments | Capability exchange/loading; missing values stay missing | Saved/unsaved distinctions; expired/revoked access | Submitted/read-only confirmation |
| Mail | Separate preview and queue | Failed/unknown state; evidence before explicit retry | Accepted-by-transport timestamp, not assumed receipt |
| Payments | Setup/preparation pending | Unknown request, incomplete transaction, capture review | Bank state and INR credit remain separate |
| Documents | Upload/parser loading and draft | Save recovery; partial/unverifiable provider completion | Signed downloads appear only after verified archive |
| Retention | Current deletion review/counts | Active/unknown send blocks; stale review reload | Explicit permanent-deletion result; staff/legal preservation |

D2 incorrectly merges authorization failure with transient error recovery. Otherwise loading, empty, busy, conflict, partial and success states are explicit in inspected sources and QA evidence.

### 3. User journey and trust — 7/10 → 7/10

| Step | User action | Trust requirement | Evidence / gap |
| --- | --- | --- | --- |
| Intake | Admin reviews uncertain email | Receipt accepted is not application certainty | Retained source/review and acknowledgement proof |
| Candidate work | Candidate opens, uploads and submits | Knows deadline and saved/unsaved boundary | D1 omits zone at the hard cutoff |
| Assessment/interview | Assigned staff reviews permitted material | Internal notes remain scoped | Explicit panel notes; general Admin marker absent |
| Communication | Admin previews, queues or reviews unknown mail | Confirmation must not silently resend | Actual local SMTP/evidence/retry journeys |
| Offer/onboarding | Candidate accepts; Admin confirms account/profile | Terms and account consent remain distinct | Continuous local journey and immutable handoff |
| Legal draft | Admin uploads originals and places fields | Draft is not a sent or completed contract | Two actual PDFs, saved draft, no provider-send claim |
| Money | Separate reviewers approve and reconcile | Prepared/requested/sent/credited are distinct | Mercury/Razorpay labels and uncertainty evidence |

The deliberate confirmation steps are justified by irreversible contact, money or deletion boundaries. D1 is the material remaining candidate-trust gap. No automatic payment, payroll modification or contract send is implied by onboarding.

### 4. Intentional UI / AI-slop risk — 8/10 → 8/10

Classifier: **OPERATE**, including focused candidate completion surfaces. No marketing hero, decorative feature grid, carousel, generic claim metric or ornamental motion was introduced in inspected scope. Operational sections/cards contain forms, previews, queues or immutable history; they earn their grouping. Their presence is not by itself the “card mosaic instead of workspace” rejection. Violet is the explicitly chosen Miru token, not an unsolicited palette.

| Litmus | Primary assessment |
| --- | --- |
| Product recognizable | YES: Miru shell, domain headings and task identity |
| Clear visual anchor | YES: working form/document/status, not decoration |
| Headline scanability | YES, except the D2 denied-state action hierarchy |
| One job per section | YES in inspected operational panels |
| Cards necessary | YES for grouped editable or versioned work; no cosmetic replacement proposed |
| Motion supports hierarchy | No new authored motion required for these existing operations; no content hidden behind animation |
| Works without decorative shadows | YES |

No hard-rejection pattern or additional P1/P2 finding was established. No unverified compliance, official-tax-form or provider-success claim is accepted by this review.

### 5. Design-system alignment — 8/10 → 8/10

Inspected additions reuse semantic background/card/foreground/border/ring tokens and house form controls. Financial amounts and counts use tabular numerals in the reviewed preflight/facts/overview surfaces. Destructive deletion requires an explicit checkbox and named action; status meaning is textual as well as colored. Existing documented global token/font migration debt is not expanded into this review's scope. No new design-system decision is required.

### 6. Responsive and accessibility — 8/10 → 8/10

Actual 375/390px captures show reflowed forms, wrapping identifiers, explicit labels, large primary actions and accessible document alternatives. Source includes focus-visible rings, labeled regions/alerts/status messages, required-field labels, keyboard PDF movement/resizing and a text-reading fallback. The notes and assignment tests assert no horizontal overflow and no captured console errors. Existing profile/document reports retain their own keyboard/download evidence.

This review did not run a new browser, full screen-reader pass, computed contrast sweep or every locale at every breakpoint. Screenshots cannot certify tab order or screen-reader output. Those are coverage limits, not invented P2 failures or permission to claim WCAG certification. D1 remains a separate clarity problem; D2 remains a role/recovery problem.

### 7. Unresolved decisions — unscored

Two confirmed defects remain open: D1 and D2. No new design remedy was silently adopted or source changed by this reviewer. Independent Claude's question about interviewers seeing criteria/questions is already answered by the accepted round/handover contract: assigned staff need them; that is not a new unresolved decision. Splitting long mobile payroll pages would be a redesign and is not proposed.

## Independent design voice

The authorized fresh read-only configured Claude Code consultation completed within the 180-second bound using **`claude-opus-5-5`**, session `770e5636-7a01-48c4-8aac-577e0ae380ae`. It read all seven requested screenshots, selected hiring source ranges and grep hits; it explicitly did not read every requested finance/document source. Its completion markers are present: `DESIGN_SCORE: 7/10`, `SEVERITY: P2`, `REVIEW_COMPLETE: yes`, `OUTSIDE_STATUS: completed`.

```tool-output
CLAUDE CODE SAYS (design critique)
[P2] A user with no hiring permission still sees every hiring action,
and "Retry" suggests the error is temporary.
[P2] Candidate deadlines show no timezone.
```

Primary source/visual review confirmed both, with one rationale correction: the management-navigation defect concerns a revoked Admin/staff route, not the standalone assignment-email candidate portal. The full provider response/provenance is retained privately at `/tmp/miru-final-design-claude-response-20261108.json`. Primary and outside critique agree on the two actionable findings. This is one primary review plus one completed external critique; no additional in-host subagent or fictitious independent review is claimed.

The external critique evaluated the pre-remedy source. It was not silently relabeled as a new clean external review after the fixes. Closure below comes from a fresh native review and actual focused regressions. No second Claude consultation was performed or credited.

## Fresh native seven-pass re-review after verified remedies

A fresh actual `plan-design-review` invocation recorded session `91630-1794101313-8ba51b6c`, with the same explicit branch-diff target and coordinator-specified all-seven/text-only scope. The reviewer reread the four changed UI sources, inspected all seven new captures, checked the additional storage-diagnostic and Mercury rollback deltas for UI/claim impact, and reconsidered every dimension across the unchanged financial/document/profile evidence. This is a new inspection after execution, not deletion or relabeling of the original findings. No new unresolved P1/P2 design defect was established.

| Pass | Before → after | Fresh assessment |
| --- | --- | --- |
| 1. Information architecture | 7 → 8 | Denied users now see only the task-specific denial and permitted exit; management/navigation remains available for recoverable or ordinary missing-record states. Existing hiring, financial and document hierarchy is retained. |
| 2. Interaction states | 7 → 9 | First-load and later authoritative denial, wrong workspace, ordinary 404 and transient 503 are separately exercised. Wrong-company responses reject before downstream success effects. Financial uncertainty and incomplete document archives retain their distinct existing states. |
| 3. Journey/trust | 7 → 9 | Both candidate cutoffs explicitly name the displayed zone without changing their absolute instant. The continuous local intake-to-PDF journey remains the accepted path; no implicit mail, payment or contract send was added. |
| 4. Intentional UI | 8 → 8 | Utility language, explicit next actions and functional grouping remain. No decorative redesign, card mosaic, claim metric or mockup was introduced. |
| 5. Design-system alignment | 8 → 8 | Existing tokens/controls are reused. The denial alert receives focus and the exit uses the house Button/Link pattern; candidate time semantics add no competing visual system. |
| 6. Responsive/accessibility | 8 → 8 | All seven cases assert empty console-error collections and 375px containment. Zone text, denied-state focus, readable labels and existing keyboard/document alternatives were inspected. Full screen-reader/contrast/locale certification remains outside this evidence. |
| 7. Unresolved decisions | 2 defects → 0 open | D1/D2 are closed by the named source changes and actual regressions. There are zero new product decisions or unapproved redesign remedies. |

### Exact focused proof and source identity

- Initial RED: two cases, two failures in `/tmp/miru-hiring-design-red-20261108.log`. Initial-load RED: one case, one failure in `/tmp/miru-hiring-design-initial-red-20261108.log`.
- Final GREEN: **seven native Brave examples, zero failures**, 7.9 seconds plus four seconds load, `/tmp/miru-hiring-design-green-20261108.log`. Synthetic isolated database, loopback-only sandbox and port 3135; no real records/provider/email.
- Required development build: `/tmp/miru-hiring-design-vite-dev-20261108.log`. Forced actual Vite test build: `/tmp/miru-hiring-design-vite-test-20261108.log`. Both terminal zero on the frozen source; no build overlapped a browser run.
- Four-file ESLint and Prettier check pass; the focused Ruby spec passes Rubocop. Existing ignored `tailwindConfig` Prettier warnings do not represent a source-format failure. `git diff --check` passes.
- All seven final captures were inspected and have a [SHA256 manifest](design-remedies-20261108/SHA256SUMS). Existing financial/provider captures keep their historical provenance.

| Tested path | SHA256 |
| --- | --- |
| `app/javascript/src/components/Hiring/AssessmentPortal.tsx` | `dd063500a91242946c16e460efbb5e7f99480f813bb3ec582e6e61756760a124` |
| `app/javascript/src/components/Hiring/Portal.tsx` | `d72e48c1c1f5f7aa64b2cb1417409dfee79f90ca553f1c1820878c5af514fde3` |
| `app/javascript/src/components/Hiring/api.ts` | `70bb71789374d3f213c5f27d4ac8ea9006b8d721cc8304e6566df4c015f82ef1` |
| `app/javascript/src/components/Hiring/index.tsx` | `610cea6efa2ff40683c297088c5f847b451e68b6150a682d2ce7093f640dd57c` |
| `spec/system/responsive/hiring_design_recovery_spec.rb` | `2c0b1ba534944913561c50d3b221ccbbf1808d8f8eadbd13796541fa9de7257f` |

## Implementation tasks

- [x] **D1 (P2)** — show the actual time zone for candidate assignment deadlines and form expiry; verify both pages at 375px without changing the absolute instant.
- [x] **D2 (P2)** — distinguish denied access from transient failures and remove unavailable hiring-management affordances; verify first/later denial, privacy clearing, wrong workspace and retained transient Retry.

The coordinator explicitly assigned the bounded implementation and regression work after the original review; only the four named UI paths and focused spec changed for these remedies. No central plan, unrelated source or TODOS.md changed. The skill task registry reported no prior design tasks; the fresh completed list records zero remaining tasks. No new product choice is counted as a human approval.

## Not in scope

- Cosmetic redesign, new navigation architecture, page splitting, new features or dependency changes.
- Real inbox/calendar/payment/signature-provider setup, external sends or production commissioning.
- Official tax returns/forms, legal enforceability, accessibility/compliance certification, monitoring, backup erasure/recovery or production financial execution.
- Certifying every changed line, every screen-reader/browser/locale combination, or historical captures as current-head browser runs.

## Design review completion summary

Initial impression 8/10; detailed overall **7/10 before → 8/10 after**, using the lowest of passes 1–6. Two original P2 findings were fixed and independently exercised; zero findings remain open. All seven fresh native passes are complete, zero new product decisions were made, zero mockups were generated under the explicit text-only scope, and zero implementation tasks remain. This saves the complete reviewed report before commit. A clean council entry still requires external final-commit/runtime-blob matching; exact-head engineering/security/CI and production acceptance remain separate.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
| --- | --- | --- | --- | --- | --- |
| CEO | Existing accepted issue/design | Scope | 0 new | Not rerun here | No strategy change proposed |
| Outside design | Authorized configured Claude Code consultation | Independent critique | 1 | Completed on pre-remedy source | Two P2 findings; subsequently closed by native proof, not a fictitious external rerun |
| Engineering/security | Coordinator-owned whole-branch work | Runtime boundaries | 0 by this reviewer | Separate review | No clearance inferred |
| Design | `/plan-design-review`, explicit whole-branch target | UI/UX risk | 1 review, two actual inspection rounds | Native clear on fingerprinted source; final SHA binding pending | Overall 7 → 8/10; two found/two fixed; zero unresolved |
| DX | Separate scope | Maintainer experience | 0 new | Not reviewed here | No clearance inferred |

**OUTSIDE COVERAGE:** configured Claude Code, design phase, completed targeted pre-remedy critique with two P2 findings. Fix closure is fresh native source/browser evidence; no new external final-source clearance is claimed. No provider/production acceptance follows.

**CROSS-MODEL:** primary in-host Codex review plus actual configured Claude Code `claude-opus-5-5`; overlapping D1/D2 findings were independently source-checked. Coverage is targeted, not exhaustive.

**VERDICT:** Native design review clear at 8/10 on the recorded runtime snapshot, with the original findings and fresh verification retained. Compare frozen runtime bytes to the final commit before logging its clean entry. Engineering/security and exact-head release gates remain separate; this is not production approval.
NO UNRESOLVED DECISIONS
