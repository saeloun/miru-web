# Consultant PTO browser evidence

Actual isolated Brave, synthetic accounts and fixtures only. The latest full native suite passed 16 examples with zero failures and strict console checks. The original three images came from the seven-case PTO suite; the fractional preview came from the 15-case run. The remainder form came from a final targeted rerun after a numeric-formatting class change. All were visually inspected and copied byte-for-byte; they do not show production personal or banking data.

- [Approved split on mobile](screenshots/approved-split-mobile.png): the 60-hour gap is explicitly allocated as 23 unpaid and 37 deferred hours; unresolved quantity is zero.
- [Year-end and exit worklist](screenshots/yearend-exit-worklist.png): a synthetic historical 40-hour negative opening remains visible for threshold, leave-year and exit review after the consultant leaves.
- [Frozen India report email](screenshots/frozen-india-report-mail.png): 150 recorded hours plus 10 approved paid hours preserve the INR 100,000 fee; opening 40 and closing 30 PTO hours are retained in the approved report.
- [Fractional unpaid preview](screenshots/fractional-unpaid-preview.png): 9,001.002 work minutes leave exactly 598.998 unpaid minutes. After approving and reopening the review, the unpaid quantity remains read-only and the INR 100,000 fee prorates to INR 93,760.44.
- [Explicit remainder form](screenshots/explicit-remainder-form.png): the exact 598.998-minute source gap stays visible while an admin enters one paid hour and explicitly assigns the remaining quantity to unpaid leave. The server resolves the remainder without rounding it to decimal hours.

These are local browser proofs. Live provider transfers, delivery to real employees, statutory completeness, consultant invoice generation and production adoption are not certified by screenshots. See [adoption and executable contracts](../../payroll-pto-ledger.md).
