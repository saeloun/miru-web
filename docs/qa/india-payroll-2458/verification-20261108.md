# India accounts handoff verification

Synthetic local verification for the next #2458 payroll unit. This is not bank acceptance or a production deployment.

## Behavior

An owner explicitly confirms the confidential accounts mailbox and Indian beneficiary, then queues the immutable approved report. Duplicate clicks return the same handoff. Delivery attempts are durable, claimed once and recovered without resending unknown outcomes. Only assigned active accounts can record actual INR credits. Partial credits retain claims; full credit settles only that consultant's exact reservations once. Claim discrepancies preserve the actual credit and expose settlement blocked. Full-credit replay can retry settlement safely.

The report includes hours/days, fees, adjustments/withholding, itemized claims, legal entity and full beneficiary details in readable text/HTML. The application masks the account. Paid-leave classification is explicitly unavailable where the source does not supply it; it is never invented. India funding no longer shows Mercury onboarding controls.

## Evidence

- Domain/payroll regression checkpoint: 186 examples, zero failures. After small service extraction and session-key-independent reference hashing, domain + API: 29 examples, zero failures. These overlap; do not add the counts.
- Delivery/mail/privacy + existing hiring transport regressions: 57 examples, zero failures. Includes actual Solid Queue persisted ID-only job/claim/perform and real local SMTP, duplicate/concurrent workers, no SMTP inside a transaction, and SMTP QUIT failure after DATA acceptance held uncertain.
- Final review fixes and bank-confirmation regression: 51 domain/API/delivery/mail examples, zero failures (43 domain/delivery/mail plus eight API examples). Native Brave: six examples, zero failures, including the unchanged Mercury return regression. Real owner send, assigned-accounts partial/full credit, uncertain-delivery reconciliation/retry, actionable bank/date validation, stale-bank reconfirmation, receipt settlement, no console errors, and actual rendered email at 1400/390px. Seven regenerated screenshots below contain synthetic data only.
- Required `rtk mise exec -- timeout 30 bin/vite build` and test-mode asset build passed. Project TypeScript still reports its existing 329 errors; no new Payroll error was reported. Compare normalized paths against the existing baseline before calling the whole type check clean.
- Whole-project Reek passed. Focused Ruby lint passed. Brakeman has the same two weak warnings as the unchanged develop tree (`pg_searchable.rb` and `signature_request_reviews_controller.rb`), no new warning/error.
- Schema dump/load preserves financial-history triggers. Direct SQL mutation, real concurrent credit/revision/compensation and reference replay are exercised.
- Broad backend checkpoint: 6,166 examples, nine failures, 54 pending. All nine were the historical Mercury rollback spec: it removes the new India tables while current runtime guards still require them. The fixture now installs/removes that independent runtime dependency around its historical Mercury DDL checks; all nine rerun with zero failures. No production guard was weakened. A full green exact-head CI run is still required before merge; the focused rerun is not represented as a clean full-suite result.

## Review sources

Claude Opus 5.5 completed the read-only design review (session `d93321f5-75a0-4edf-9c4b-afaf8d5173ff`). Its full-report digest, company-wide normalized credit reference, exact reservation scope, split readiness and lock-order corrections were addressed. The later broader source-review attempt timed out after 240 seconds; it is not a clean review.

Kimi completed the read-only design/source map (`f6407264-8dfa-4262-90dc-cdde4508f0fb`): Mercury-only guards and financial serialization were addressed; the possible duplicate-period concern is constrained by the existing unique company/period/currency run and India INR-only readiness. An uncommitted branch-only review had no diff, so it provided no additional coverage. Local Qwen supplied bounded test/credit proposals; invalid and unrelated suggestions were rejected rather than accepted as proof.

Claude also completed a bounded actual-source critique (session `7ec06305-cc55-46a4-9e7d-bf016552af42`, four supplied files, no runtime access). Its framework-default drift concern was addressed with explicit domain-separated HMAC-SHA256 and a pre-send key-configuration check; Unicode reference formatting now normalizes with NFKC. Its proposed cap would discard actual overpayment evidence, contrary to the approved design and visible overpayment display. Its reservation, missing-key and JSON-type concerns were checked against the complete Workflow/Snapshot/report/expense source and existing executable cases; omitted context explains those claims. Generic DB/programmer failures remain failures. The immutable-ciphertext maintenance limit below is real and documented. An independent native engineering reviewer checked all eight dispositions. The broader committed Kimi review timed out after 180 seconds; it is not a clean source review.

Native design/DX discovery reviews found actionable India blocker text, history touch size, mobile email item readability, safe render-failure correlation and reproducible commands. These are corrected and get fresh source/browser checks; discovery findings are preserved rather than rewritten as clean history.

The final native engineering pass also caught bank details changing between preview and owner confirmation. Masked preview `bank_version` is now required as POST `expected_bank_digest`; stale/missing versions conflict before persistence or idempotent return. A changed preview version clears the confirmation/mailbox. Domain and API regressions prove bank A cannot silently authorize bank B; the browser must show B and require a fresh owner confirmation. Validation errors retain their actionable instructions, while conflicts/unknown request outcomes refresh durable state and permission revocation clears the displayed handoff.

## Reproducing the checks

The proving runs used isolated local PostgreSQL test databases. Set `RAILS_ENV=test`, `DB_HOST=127.0.0.1`, `DB_USER=postgres`, `DB_PASS=postgres`, `DB_POOL=8`, `DISABLE_BOOTSNAP=1`, `SKIP_VITE_TEST_BUILD=1` and `CI=1` in the child process. Never point these suites at shared or production data: their database cleaner deletes test rows.

```sh
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/miru_india_delivery_test_20261108 rtk mise exec -- bundle exec rspec spec/services/payroll/india_handoff_spec.rb spec/services/payroll/india_delivery_spec.rb spec/mailers/payroll_india_mailer_spec.rb spec/requests/api/v1/payroll_india_handoffs_spec.rb
rtk mise exec -- timeout 30 bin/vite build
RAILS_ENV=test rtk mise exec -- timeout 30 bin/vite build
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/miru_india_browser_test_20261108 CAPYBARA_SERVER_PORT=3134 FERRUM_BROWSER_PATH='/Applications/Brave Browser.app/Contents/MacOS/Brave Browser' INDIA_PAYROLL_SHOTS=docs/qa/india-payroll-2458/screenshots rtk mise exec -- bundle exec rspec spec/system/responsive/india_payroll_handoff_spec.rb
```

The delivery spec's two `uses real local SMTP` cases and `executes durable Solid Queue intent` case exercise the real local transport/queue; they do not contact provider accounts. The schema immutability test runs after schema load as well as migration. Full-backend runs use the isolated API database and `bundle exec rspec spec --exclude-pattern 'spec/system/**/*'`.

## Key maintenance

Preserve the configured Active Record deterministic key used by the versioned bank-reference HMAC across session-key rotation and deploys. Never replace it without an audited reference-index migration. Immutable financial rows deliberately reject ordinary ciphertext updates: before retiring any previous encryption key, perform controlled privileged re-encryption with plaintext-equivalence verification and restore the history triggers. Standard `record.encrypt` alone is not the maintenance procedure. Rails documents primary-key rotation and its separate deterministic-encryption limit in the [Active Record Encryption guide](https://guides.rubyonrails.org/active_record_encryption.html#rotating-keys).

## Screenshots

- [Owner report confirmation](screenshots/owner-ready-desktop.png)
- [Changed bank requires fresh confirmation](screenshots/owner-bank-reconfirmation-desktop.png)
- [Delivered, awaiting manual payment](screenshots/owner-awaiting-payment-desktop.png)
- [Partial credit on mobile](screenshots/accounts-partial-mobile.png)
- [Fully credited on mobile](screenshots/accounts-credited-mobile.png)
- [Actual email on desktop](screenshots/confidential-email-1400.png)
- [Actual email on mobile](screenshots/confidential-email-390.png)

## Required remaining work

This unit does not enable Razorpay Payroll or prove Mercury payment scope/bank credit. Live email/provider account setup, production deployment, PTO accrual/paid-leave classification, consultant legal/tax consent and invoices, remittance documents and returned-payment replacement remain separate work. No live money, credentials, DNS or infrastructure changed during these checks. Existing pending acceptance contracts are retained unless corresponding executable proof exists; the full #2458 issue is not complete.
