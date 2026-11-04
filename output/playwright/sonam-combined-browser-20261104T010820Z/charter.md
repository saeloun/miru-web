# Combined Sonam browser regression charter

Target: local Miru candidate `a7ad6d274`, plus the owned test-fixture/capture
changes in this run. No application or frontend source changes are planned.

Use the documented RSpec/Cuprite framework with headless Brave, an isolated
synthetic PostgreSQL database and a sandbox permitting localhost only. Browser
login, profile/report edits, invoice actions, provider returns and downloads use
fictional records. Provider HTTP and mail delivery remain test doubles. No
personal browser, production data, live provider account, real email or transfer
is permitted. Testserver port: 3130.

## Contracts

1. A genuinely short signed PDF fails native reconciliation and the editor shows
   the verification failure without offering a signed download or cancellation.
2. Employees see only their own signed archives; admin/consultant/client profile
   downloads produce the exact archived bytes at desktop/mobile widths.
3. Staff can edit their own personal/family/bank data while salary and admin
   controls remain protected. Report edits persist, CSV downloads match selected
   columns, and workspace/employee changes clear private state.
4. Existing Razorpay onboarding/payment holds, Mercury returns, invoice dates and
   ATS forms/private assessment downloads retain their tested behavior together.

Run the strengthened archive failure scenario first, then the explicitly listed
combined system specs. Check browser exceptions, each scenario's console and
overflow assertions, durable records and actual downloaded-file hashes. Capture
new screenshots in this fresh directory and inspect representative states.

Force-build test assets before starting an owned testserver to avoid stale Vite
manifests. Browser exploration is bounded to 900 seconds; a timed-out or blocked
scenario remains unverified. Do not change assertions merely to obtain green.
Production/provider acceptance, screen-reader testing and a complete visual or
performance audit are outside these automated regression contracts.
