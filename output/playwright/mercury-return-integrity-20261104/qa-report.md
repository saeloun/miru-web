# Returned Mercury wire integrity — 4 November 2026

A recorded return could be overwritten by a later provider snapshot. With old credit still recorded, `pending` or `sent` falsely completed the payment group again. Five focused regressions failed before correction, including duplicate `group_fully_credited` events.

The transaction update now preserves a recorded return under the existing row lock. A bound wire's valid reversal takes precedence regardless of list ordering; unrelated or ambiguous adverse transactions create recoverable holds instead. Unlinkable transactions cannot supply the payroll wire's status. Incomplete transaction lists hold completion and retain any valid reversal of the already-bound wire. Recoverable read holds are distinct from terminal bank-activity holds; a complete pending snapshot cannot restore already-recorded credit, and closed transfers reject later status mutation. Manual bank-credit evidence remains separate from provider status. No amounts, original credit entries or reimbursement settlements are reversed automatically.

## Evidence

- **175 related service/request/job/concurrency examples passed in one final run**, including 34 new service cases: subsequent statuses, partial credit/shortfall actions, persistent holds, unrelated and ambiguous unbound transactions, manual bank proof, ordering of multiple reversals, incomplete lists, safe no-funds release and repeated closed-transfer reads.
- The two unrelated-reversal regressions and two incomplete-list regressions also failed before their respective corrections. An older test was updated to require a hold for an unlinkable reversal rather than incorrectly recording a return; its prohibition on credit remains asserted.
- **1 permanent real-Brave browser example passed** at 1400px and 390px after the final source changes. It signs in with synthetic fixture credentials, loads the payroll review, clicks the real CSRF-protected bank refresh action and verifies `Returned`, hidden credit/shortfall actions, unchanged credit, no full completion, no console exceptions/errors and no horizontal overflow.
- The browser test waits for the actual provider-read count; it does not use sleeps or bypass requests.
- RuboCop, Reek and diff checks passed. No JavaScript or dependency changed.

Both final screenshots were inspected: [desktop](returned-after-refresh-1400.png), [mobile](returned-after-refresh-390.png).

The tests use an isolated native PostgreSQL database and synthetic provider stubs. External network access is denied for the test process. This is focused native-browser QA, not a completed gstack exploratory score or live provider acceptance.

## Review and limits

Four native Claude source reviews identified provenance, ambiguous unbound reversals, order-dependent return detection, temporary holds blocking safe no-funds releases, stale snapshots clearing real failure holds and an unlinkable-status fallback. These were reproduced and corrected with regressions. The final review's requested fallback deletion passed six strengthened/new checks that failed beforehand. A reported joined test excerpt was checked against the actual file; its original transaction-identity assertion is intact. Timestamp updates, returned-state display precedence and the actual browser driver were checked from current source/runtime. These source reviews are advisory and do not satisfy the exact-commit council gate.

This adds partial issue #2458 section 12 coverage. Independent shortfall approval, returned-funds replacement, reimbursement reversal, invoice/remittance workflows, transaction webhooks and other stale-transition cases remain open. Production behavior, real Mercury responses and current-head CI are unverified. No bank transfer, new provider connection, real email or production change occurred.
