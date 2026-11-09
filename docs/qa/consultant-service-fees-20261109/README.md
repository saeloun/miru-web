# Reviewed consultant service-period fees

These original Brave screenshots use synthetic local fixtures. They are not production payroll, bank acceptance or statutory tax evidence.

- [Mobile fee review](screenshots/service-fee-input-mobile.png): explicit INR 50,000 base for the recorded service period, separate from the INR 100,000 contractual monthly fee.
- [Frozen reviewed basis](screenshots/reviewed-period-basis-desktop.png): INR 50,000 before eight approved unpaid hours across 80 scheduled hours yields INR 45,000.
- [Stale source keeps the draft](screenshots/stale-period-draft-desktop.png): saving is disabled until the changed service details are refreshed.

`spec/system/responsive/payroll_service_fees_spec.rb` passes five native cases with no console errors or JavaScript exceptions. The desktop/mobile approval journeys assert 1440/375-pixel widths after each sign-in, require both approvals, and create no payment instruction or India handoff. Other cases cover stale context, the shared leave dialog, and a committed save whose response was lost: refresh and retry preserve the original review ID without duplicating it.

Request and mail specs cover tenant/role/CSRF boundaries, exact input, private responses, escaped frozen report fields and filtered request logs. Domain and independent-connection specs cover stale commands, immutable SQL history, scoped recovery releases and actor-bound replay. The acceptance ledger retains the remaining unimplemented issue-wide cases.
