# Admin decision records — Task 7 in progress

This increment implements the durable decision workflow from [Sonam's ATS issue #2463](https://github.com/saeloun/miru-web/issues/2463). It does **not** finish Task 7: rejection preview/delivery/automation and due-hold notifications remain next. Nothing here establishes CI, production behavior or live email delivery.

## Implemented behavior

- Admin saves and edits one current draft per application. A draft does not change the stage, cancel work or send mail. The internal reason is separate from future candidate-facing wording.
- Explicit finalization requires a saved, unchanged draft, current application/decision versions and an internal reason. Finalized records cannot be rewritten; an open application can receive a new decision while preserving earlier finalized history.
- Pass moves to Final Decision without creating an offer. Additional Round Required moves to Interview without scheduling a round. Reject closes the application as Rejected. Hold moves to On Hold and requires an active company owner plus a follow-up date today or later in the saved company IANA zone. Finalizing pass/reject/hold closes active assessments and planned interviews, preserving completed history.
- Hold owner identity/name and time zone are saved snapshots. Draft finalization rechecks active membership; the follow-up date is checked against the saved zone rather than the server's UTC calendar day. Historical dates remain valid when time passes.
- A failed interview recommendation moves Interview to **Rejection Pending**, without finalizing rejection, sending candidate mail or cancelling other issued feedback. Original assigned interviewers keep their scoped handover while pending; unrelated staff remain denied and Admin notes remain excluded.
- Creation, draft editing and finalization recover exact accepted intent after a lost response. A changed or stale intent conflicts. The UI retains unsaved wording after conflicts, freezes an unconfirmed request for unchanged retry, and offers an explicit discard/reload. A scoped denial clears the full candidate and private sibling panels.
- Records and accepted intents are encrypted; the new request envelope is filtered. Company/application foreign keys, one-draft uniqueness, tenant request identity and finalized-state constraints apply in PostgreSQL. Permissions and versions are checked inside actor→company→application→decision locks; these operations make no external call.

## Verification

- Initial request RED: **39 examples, 16 failures** before implementation. Final focused decision/feedback requests: **40/0**. All hiring services/requests: **333/0**, including recovery, stale versions, invalid/past/local-date boundaries, departed/foreign owners, foreign applications, closed/finalized records, request identity reuse, parameter filtering and original-reviewer privacy after a fail.
- Five affected native Brave files: **26/0**, including five new decision journeys. Actual desktop/mobile save/finalize, required reason, independent keyboard confirmation, stale wording, accepted-but-lost response recovery and full-page denial pass with CSRF enabled and no console errors. Mobile has no horizontal overflow.
- Initial browser failures were harness errors: the stale Rails fixture needed `reload` before `touch`, and Cuprite's element `send_keys` clicks before typing, toggling a checkbox twice. The corrected check focuses the real node and sends Space through Brave's keyboard protocol. Its isolated check and the final related suite pass; no product retry/timing workaround was added.
- Migration up/down/up passes in a newly created disposable database. The state constraint is validated and the one-draft index is unique. A direct cross-company SQL update is rejected by the composite FK. Recorded decisions make rollback refuse before DDL; the owned database was removed.
- Required development/test Vite builds, two-file frontend lint and fifteen-file Ruby lint pass. TypeScript remains at **329 diagnostics**, with zero normalized additions/removals against the existing baseline. The generic release checker and exact-head council remain separate gates.
- **18 source/test/config/schema fingerprints** match the files used for these checks. Six full browser captures were visually inspected; their checksums are committed alongside them. These are local repository artifacts, not hosted PR image attachments.

Local Qwen supplied bounded read-only advice. Existing optimistic locking and immutable snapshots address its relevant concern; its proposed extra event abstraction and date-ambiguity claim were not adopted. GBrain remained unavailable; the freshly fetched issue and repository plan/spec supplied the requirements.

The generic checker reports lint/build PASS, the same 329 TypeScript diagnostics, and tests INCOMPLETE because it has no Ruby runner for 118 selected files. Those results do not replace the manually run RSpec scopes above. No release check was weakened.

## Captures

- [Saved hold draft](decisions-20261107/decision-hold-draft-desktop.png)
- [Finalized hold and owner](decisions-20261107/decision-hold-finalized-desktop.png)
- [Finalized rejection on mobile](decisions-20261107/decision-rejected-mobile.png)
- [Preserved stale draft](decisions-20261107/decision-stale-draft-desktop.png)
- [Recovered request on mobile](decisions-20261107/decision-recovered-mobile.png)
- [Full-page permission denial](decisions-20261107/decision-permission-denied-desktop.png)
- [SHA256SUMS](decisions-20261107/SHA256SUMS)

The next increment must allow approved rejection mail on an otherwise closed Rejected application only when its current finalized reject decision authorizes it, while all other closed-application sends stay blocked. Automatic delivery must be explicitly enabled and must not sweep old finalized decisions. A new draft must not change an existing finalized hold's due-notice eligibility; only a finalized replacement or stage change does that. Existing SMTP uncertainty/evidence/stopped-worker rules still apply.

No real mail, provider, payment, production database or server configuration changed. Task 7 remains unchecked, followed by offers/onboarding, reporting/retention and the whole-branch review/release audit.
