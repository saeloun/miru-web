# Bank-change notice delivery plan

1. Add a failing focused spec for a persisted contractor bank edit producing no private accounts notice.
2. Add a minimal constrained journal, transactional producer and private mail job with delivery-time authorization and periodic queued/stale recovery. Reuse current memberships, payroll reviewer assignment and mail transport conventions. Keep all bank values out of notice records/jobs/mail/logs.
3. Independently verify rollback/no-op/recipient/privacy/delivery states, unchanged primary bank confirmation and accepted-credit behavior. Use separate synthetic databases for backend, requests and native browser work.
4. Verify actual self-edit and mail in desktop/mobile browser with screenshots. Review the final diff, exact-head councils, lint and hosted CI, then push a reviewable PR with evidence. Do not claim production delivery or live mail.
