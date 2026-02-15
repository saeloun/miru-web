# Integration Coverage Matrix (API + E2E)

This matrix tracks parity for integration coverage across API resources and key UI flows.

Legend:
- `full`: CRUD request coverage present
- `partial`: some actions covered, not full CRUD
- `n/a`: resource is not CRUD

## Core CRUD Resources

| Resource | Routes (API v1) | Request Coverage | System/Playwright Coverage | Status | Notes |
|---|---|---|---|---|---|
| clients | index/show/create/update/destroy | yes | yes (`spec/system/clients/*`, `playwright/e2e/clients/*`) | full | Includes invoice sub-endpoints |
| projects | index/show/create/update/destroy | yes | yes (`spec/system/projects/*`, `playwright/e2e/projects/*`) | full | Includes search endpoint |
| invoices | index/show/create/update/destroy/edit + actions | yes | yes (`spec/system/invoices/*`, `playwright/e2e/invoices/*`) | full | Includes send/download/bulk endpoints |
| timesheet_entries | index/create/update/destroy + bulk actions | yes | yes (`spec/system/time_tracking/*`, `playwright/e2e/time-tracking/*`) | full | CRUD + bulk coverage present |
| expenses | index/show/create/update/destroy | yes | yes (`spec/system/expenses/*`, `playwright/e2e/expenses/*`) | full | Added update/destroy request coverage |
| team | index/update/destroy (+details/avatar) | yes | yes (`spec/system/teams/*`, `playwright/e2e/team/*`) | full | Split across team/member endpoints |
| companies | index/create/update (+purge_logo) | yes | yes (`spec/system/companies/*`) | full | No destroy route |
| users/devices | index/show/create/update | yes | partial | full (API), partial (E2E) | CRUD in request specs |
| users/previous_employments | index/show/create/update | yes | partial | full (API), partial (E2E) | CRUD in request specs |
| invitations | create/update/destroy + resend | yes | yes (`playwright/e2e/team/invite.spec.ts`) | full | Added update/destroy/resend request coverage |
| timeoff_entries | index/show/create/update/destroy | partial | partial | partial | Missing request `index/show` specs |
| leaves | resource + nested leave_types | partial | yes (`spec/system/settings/leaves_spec.rb`) | partial | API endpoints not fully covered |

## Non-CRUD / Feature Resources

| Resource | Coverage | Status | Notes |
|---|---|---|---|
| reports (client_revenues, time_entries, outstanding_overdue_invoices, accounts_aging, payments) | request + system + Playwright | good | Download/index coverage present for major report types |
| dashboard | request + system + Playwright | good | overview/stats covered |
| workspaces | request + Playwright | good | index/update covered |
| payment_settings/providers | request + system | good | connect/disconnect/provider update present |
| generate_invoice | request + system | good | generation flows covered |
| profile/addresses | request + system | good | update/index flows covered |
| holidays | request + system + Playwright | good | navigation and update flows covered |
| wise | request | partial | Mainly controller-level request coverage |

## Invoice PDF Coverage

| Layer | Coverage | File(s) |
|---|---|---|
| API download endpoint | yes | `spec/requests/api/v1/invoices/pdf_download_spec.rb`, `spec/requests/api/v1/invoices/download_spec.rb` |
| Internal API download endpoint | yes | `spec/requests/api/internal_api/v1/invoices/download_spec.rb` |
| PDF generation service | yes | `spec/services/pdf_generation/invoice_service_spec.rb`, `spec/services/invoice_payment/pdf_generation_spec.rb` |
| PDF email flow | yes | `spec/services/invoice_payment/pdf_email_spec.rb` |
| Browser/system | yes (file present) | `spec/system/invoice_pdf_download_spec.rb` |
| Playwright E2E | yes | `playwright/e2e/invoice-send-download.spec.ts` |

## Current Gaps To Close Next

1. Add request specs for `timeoff_entries#index` and `timeoff_entries#show`.
2. Expand `leaves`/`leave_types` request suite to explicit CRUD-level parity where routes permit.
3. Stabilize and include invoice PDF browser spec in CI smoke lane (currently heavy/flaky).
4. Promote a second Playwright lane for module-level CRUD parity (clients/projects/invoices/expenses/time-tracking).
