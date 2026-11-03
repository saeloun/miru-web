# Invoice identity and billing layout QA

Status: verified locally, with release and provider acceptance still open.

Public and client invoices now show complete company and billing addresses without internal scrollboxes or fixed-height clipping. Their shared mobile view reuses the existing billed-to component instead of omitting the client identity, address and EIN. The admin preview wraps unbroken company names. Free organizations no longer query Pro-only client analytics; paid organizations retain the card and successful query. The existing plan-access helper and authorization policy are preserved.

## Evidence

- The first fixture exceeded the company's real 30-character name limit. It was corrected to a valid 30-character unbroken name; that setup failure is not counted as a product reproduction.
- The corrected browser regression failed all three initial public/client/admin examples. It reproduced clipped addresses, omitted mobile billing details, the admin mobile heading overflow and forbidden analytics requests for free organizations.
- The final regression passed four examples, each at 1400px and 390px, including a paid-admin positive case. Console errors and uncaught exceptions are checked; text geometry is checked against its local document containers and document horizontal overflow is rejected.
- The final combined Razorpay settings, payment flow, client invoice detail and address-layout run passed **37 examples, zero failures**. These include the existing console-error positive control and payment-hold actions.
- ESLint, Prettier, RuboCop and `git diff --check` passed. The required `rtk mise exec -- timeout 30 bin/vite build` passed. A forced `RAILS_ENV=test` build produced `public/vite-test` assets for the browser run. An earlier mode-only command wrote development assets or skipped the build and is not used as proof of test-bundle freshness.
- All eight final desktop/mobile screenshots below were visually inspected. All accounts, documents and contact details are generated fixtures. External network access was denied; no production writes, emails or transfers occurred.

| Surface | Confirmed before | After desktop | After mobile |
| --- | --- | --- | --- |
| Public invoice | [Desktop](confirmed-before/public-1400.png), [mobile](confirmed-before/public-390.png) | [Desktop](after/public-1400.png) | [Mobile](after/public-390.png) |
| Client invoice | [Desktop](confirmed-before/client-1400.png), [mobile](confirmed-before/client-390.png) | [Desktop](after/client-1400.png) | [Mobile](after/client-390.png) |
| Free admin invoice | [Desktop](confirmed-before/admin-1400.png), [mobile](confirmed-before/admin-390.png) | [Desktop](after/admin-1400.png) | [Mobile](after/admin-390.png) |
| Paid admin invoice | Positive contract added after repair | [Desktop](after/pro_admin-1400.png) | [Mobile](after/pro_admin-390.png) |

Local receipts: `/tmp/miru-invoice-address-confirmed-red-20261104.log`, `/tmp/miru-invoice-address-green-20261104.log`, `/tmp/miru-invoice-address-adjacent-browser-20261104.log`. The permanent regression is `spec/system/invoices/address_layout_spec.rb`; the fixture and ownership boundaries are in [charter.md](charter.md).

## Limits and follow-ups

This is scoped native browser verification in the existing headless Brave/Capybara harness. Aside is absent; no browser/framework or personal-session import was installed. The full gstack exploratory checkpoint/deadline protocol and whole-application health rubric were not run, so no overall health score is claimed.

The public/client mobile line-item table still has crowded columns; this is visible in the retained captures and needs a separate correction. The admin preview's issue-date row is empty in these synthetic captures and needs investigation. Separate PDF templates, light theme, other viewport sizes, native UPI-app handoff and live provider acceptance are outside this run. Current-head council, CI and production verification remain required.

Local Qwen's first combined proposal exceeded its response limit. Smaller proposals needed correction for retained fixed heights and invented field names; its later follow-up returned HTTP 404. Codex applied the reviewed patch and independently executed the checks. No helper claim substitutes for test evidence.
