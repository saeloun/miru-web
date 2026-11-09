# Consultant invoice authorization

Original Brave screenshots use synthetic local accounts and no production data:

- [Unchecked mobile confirmation](screenshots/not-granted-mobile.png): no visit, refresh or profile edit grants consent.
- [Withdrawn mobile authorization](screenshots/withdrawn-mobile.png): withdrawal preserves both receipts and requires a new explicit grant to authorize again.
- [Read-only administrator](screenshots/admin-read-only-desktop.png): authorized reviewers inspect status and receipts without proxy controls.

`spec/system/responsive/consultant_invoice_authorization_spec.rb` passes ten cases with zero console errors/JavaScript exceptions. It asserts true1440/375-pixel widths, explicit grant/withdraw/regrant, admin and assigned-accounts read-only access, post-exit and payroll-disabled withdrawal, source conflicts, committed lost-response retry, an obsolete grant replay after withdrawal, changed wording before an uncommitted retry, and22 paginated receipts without duplicates.

The wording regression was reproduced in the actual browser before correction: refreshing new wording while a prior request was ambiguous left the old affirmation checked. The corrected form clears affirmation on every statement digest change while preserving the original pending command for confirmation.

Current backend19/0 passes on migrated and fresh-schema PostgreSQL16 databases with identical catalog guards. The API and existing employee-profile compatibility suite passes32/0 on a separately owned database. Earlier overlapping API/native test attempts and capture-helper failures are excluded from this proof. Hosted CI, production PostgreSQL15 rehearsal, actual invoice issuance and live payment acceptance remain separate checks.
