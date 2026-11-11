# Employee report month: company timezone

Unedited synthetic screenshots captured on 11 November 2026 in Asia/Kolkata, using a fresh normal-security Brave profile and the local test app. All identities and records are fictional; these are not production captures.

For a New York company at server time `2026-07-01T00:30:00Z`, the report month correctly displays **June 2026**. The API also passes India and prefixed Rails Mumbai timezone cases where the company month is July before UTC enters July. Saving, creating and deleting report definitions preserves a chosen May month and an explicitly cleared month.

Verification: 19 request examples and 14 browser examples passed, with zero console errors or uncaught exceptions. Required and test-mode Vite builds passed. The browser spec uses a native input value setter and bubbling input event for the changed month because Cuprite 0.17's text setter does not support `input[type=month]`; it immediately asserts the field value before the report actions.

Initial local driver-bootstrap failures and the unsupported month-fill attempt remain recorded in the local handoff. The final browser run selected the existing CI driver alias to preserve the explicit Brave connection; no application behavior or assertion was relaxed.

| Screenshot | Size | SHA256 |
| --- | --- | --- |
| [Desktop](employee-report-company-month-desktop.png) | 1440 × 4845 | `1da0e77736b031d8ffd6bd6b304a94c9fd5dbce0a3041fcd3f980bb6fc48ac83` |
| [Mobile](employee-report-company-month-mobile.png) | 375 × 7853 | `3048de3f1ca0d6927f14ca0096d1c3c89893d97b9613722312d0706b25c5e123` |

The full-page images include the report controls near the bottom. They do not establish production deployment, payroll calculation accuracy or historical salary reporting.
