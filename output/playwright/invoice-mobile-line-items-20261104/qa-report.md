# Mobile invoice line items

Verified locally. The shared public/client mobile view used six desktop table headers above four body cells, placing rates under the Date heading and clipping Quantity into Total. It now uses the same labeled-card pattern as the existing admin preview, with semantic `dl`/`dt`/`dd` pairs for date, rate, duration and total. Existing currency, duration and total helpers are unchanged; waived styling still applies only to the item total. The sole caller's unused header prop was removed.

- A native Brave regression failed before repair because Quantity exceeded its header cell. The permanent regression additionally checks the exact date/rate/duration/total label-value pairs.
- All five focused invoice-layout examples passed after repair. The final related Razorpay settings, payment flow, client invoice and layout run passed **38 examples, zero failures**.
- A subsequent additional waived-mobile example passed: payment is disabled, the total is struck through and the rate is not. Production source was unchanged after the 38-example run; this was an additional test only, not a claimed 39-example full rerun.
- The required Vite command, a forced `RAILS_ENV=test` asset build, ESLint, Prettier, RuboCop and diff checks passed.
- Local Qwen on the newly configured M5 route returned `NO_FINDINGS` on supplied source. That static advisory result is not council approval or live-provider proof. Codex executed the browser checks independently.

| State | Screenshot |
| --- | --- |
| Clipped and misaligned mobile table | [Before](before/line-items-390.png) |
| Public mobile invoice | [After](after/line-items-390.png) |
| Signed-in client mobile invoice | [After](after/client-390.png) |
| Waived invoice, disabled Pay | [After](after/waived-line-items-390.png) |

All four retained images were visually inspected. Fixtures are synthetic, the owned Rails/PostgreSQL stack and headless Brave harness are local, and external network access was denied. No production write, bank connection, email or transfer occurred.

Receipts: `/tmp/miru-invoice-mobile-items-red-20261104.log`, `/tmp/miru-invoice-mobile-items-green-20261104.log`, `/tmp/miru-invoice-mobile-items-adjacent-browser-20261104.log`, `/tmp/miru-invoice-mobile-items-waived-20261104.log`. Permanent coverage: `spec/system/invoices/address_layout_spec.rb`.

Remaining: current-head reviews/CI, investigation of the separate admin issue-date row, live provider acceptance, light theme and native UPI-app handoff. This report does not establish production or PDF readiness.
