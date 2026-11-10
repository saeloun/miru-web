# Consultant profile completion requests

Synthetic local QA for the 3.6.0 consultant profile-completion feature, prepared from public base `20865d8b10d930e6fa85c77c7c328860d6955339`. This evidence describes local verification before publication. It does not establish production deployment, live email delivery or provider acceptance.

## What this verifies

An owner or the assigned accounts reviewer can request missing bank or billing information from an affected consultant's payroll preparation card. The request goes to that consultant through private mail with workspace-scoped self-service links. Complete consultants remain available for preparation. A request does not approve a bank account, billing facts, consent or a payment.

The committed request and delivery state survive lost responses and queue failures. Delivery rechecks membership, requester permissions and current missing information; stale requests can be skipped. Uncertain attempted delivery is not automatically resent. Review-only pending billing facts and withdrawn invoice consent do not become requests to the consultant.

Billing Identity and Invoice Authorization reject a different workspace in a completion link before fetching private data. Correct-workspace links and existing self, observer and post-exit permissions remain intact.

## Recorded verification

These are separate runs and overlapping subsets, not numbers to add together.

| Owner and run | Actual result |
| --- | --- |
| Backend owner: service/API, delivery/recovery, mailer and related payroll regressions before the final legacy-source guard | 82 examples, 0 failures; includes 16 service/API examples and 12 job/mailer examples |
| Backend owner: final affected service/API after the legacy-source guard | 17 examples, 0 failures; the real invalid historical funding-source case failed before the guard |
| Backend owner: real PostgreSQL contention | Concurrent same-command creation commits one request/enqueue; concurrent delivery sends once under a real two-connection lock |
| Independent root: current combined request, retained-transfer, billing and authorization browser files | 25 examples, 0 failures in one 70.06-second run, with strict console/exception checks |
| UI owner: request flows and retained-transfer regression | 4 browser examples, 0 failures, empty console-error and uncaught-exception collections |
| UI owner: later desktop/mobile action screenshot cases | 2 browser examples, 0 failures; these repeat existing flows for captures |
| Link-guard owner: actual wrong-workspace RED, then guard GREEN | 2 failures before the fix proved private GETs occurred; 2 examples passed after the fix |
| Local migration owner | Down/up and transaction-rollback proof passed; all 5 foreign keys, 3 constraints, other tables and the existing migration ledger were preserved |

Both component development and test Vite builds passed with 9,829 modules before the version stamp; root's required development build also passed with 9,829 modules after stamping 3.6.0. The browser runs used isolated synthetic databases and normal-security headless Brave; unsafe browser flags were rejected. Viewport widths were asserted after sign-in. The local PostgreSQL server version was not recorded in this receipt. Earlier component failure and correction receipts remain in the external QA history; the current combined browser result above is a single successful run.

## Focused commands

Use an isolated test database for the core new backend specs:

```sh
RAILS_ENV=test DATABASE_URL="$QA_DATABASE_URL" rtk mise exec -- bundle exec rspec \
  spec/services/payroll/profile_completion_spec.rb \
  spec/requests/api/v1/payroll_profile_completion_requests_spec.rb \
  spec/jobs/payroll_profile_completion_request_job_spec.rb \
  spec/mailers/payroll_profile_completion_mailer_spec.rb
```

The native specs are `spec/system/responsive/payroll_profile_completion_spec.rb`, `consultant_billing_identity_spec.rb`, `consultant_invoice_authorization_spec.rb` and `payroll_retained_transfers_spec.rb` in the same directory. Local QA loaded an external strict Brave driver helper with `bundle exec rspec -r <normal_brave.rb>`, explicit isolated `DATABASE_URL`, `RAILS_ENV=test`, `CI=1`, `SKIP_VITE_TEST_BUILD=1`, `VITE_RUBY_AUTO_BUILD=false` and `FERRUM_BROWSER_PATH` pointing to Brave. The helper checked browser flags and console/exception events; it is not shipped application code. The focused new guard selector was `--example 'rejects a completion link'`.

Required asset checks were `rtk mise exec -- timeout 30 bin/vite build` and the corresponding test build with `RAILS_ENV=test` and `--mode test`. Builds were serialized between the two UI owners.

## Screenshots

All four are original, unedited captures of synthetic local fixtures, copied byte-for-byte. They contain no real customer or bank information. The action captures show the request control before submission; the queued captures show the recorded request state. A queued label alone is not proof of SMTP delivery.

| File | Pixels | SHA256 |
| --- | --- | --- |
| [Desktop action](profile-request-action-1440.png) | 1440 × 1000 | `931f57028e8204650b9d138e2fecf18fd51c573074e0c7e2dff839145937b756` |
| [Mobile action](profile-request-action-375.png) | 375 × 1000 | `c699e59da18325df37105a9f860edb31fbdcecb11c8b18637d44252a188af3ba` |
| [Desktop queued](profile-request-1440.png) | 1440 × 1000 | `eb93ee743bd541391521e9002934340f62b5ad0cb4e9eb645c1f52aaeaf1c624` |
| [Mobile queued](profile-request-375.png) | 375 × 1000 | `55f248b17f2c4149a2fc6a31e8f92017c167d1ea72357c916e2f248cb3e79962` |

## Limits

Mail assertions used the synthetic test transport, with no external SMTP or real consultant contacted. No live payment, consent grant, tax verification, provider setup, production migration or deployment was performed. Invoice generation and remittance documentation remain separate unfinished work; this feature does not complete every requirement in issue2458.
