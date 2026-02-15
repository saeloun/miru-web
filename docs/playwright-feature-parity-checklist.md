# Playwright Feature Parity Checklist

This tracker maps current Rails `spec/system` coverage to recommended Playwright system specs for major-upgrade parity validation.

## Status Legend
- `Covered`: Existing system spec appears to fully cover the functionality.
- `Partial`: Some coverage exists, but key user paths/edges are missing.
- `Missing`: No direct end-to-end coverage found.

## Authentication & Session
| Priority | Playwright Spec | Parity Status | Existing Coverage (RSpec System) | Notes |
|---|---|---|---|---|
| P0 | `playwright/auth/sign_in_valid_credentials.spec.ts` | Covered | `spec/system/users/login_spec.rb` | Keep as smoke in PW.
| P0 | `playwright/auth/sign_in_invalid_credentials.spec.ts` | Partial | `spec/system/users/login_spec.rb` | Expand error-state assertions.
| P0 | `playwright/auth/sign_out.spec.ts` | Covered | `spec/system/users/logout_spec.rb` | Include redirect + session invalidation.
| P0 | `playwright/auth/sign_up.spec.ts` | Covered | `spec/system/users/signup_spec.rb` | Add email uniqueness edge.
| P0 | `playwright/auth/email_confirmation_valid_token.spec.ts` | Covered | `spec/system/users/email_confirmations_spec.rb` | Add expiry edge.
| P0 | `playwright/auth/email_confirmation_invalid_or_expired_token.spec.ts` | Partial | `spec/system/users/email_confirmations_spec.rb` | Token expiry cases are critical.
| P0 | `playwright/auth/forgot_password_request.spec.ts` | Covered | `spec/system/users/forgot_password_spec.rb` | Validate flash + mail trigger UI.
| P0 | `playwright/auth/reset_password_valid_token.spec.ts` | Covered | `spec/system/users/reset_password_spec.rb` | Add post-reset auto-login check.
| P0 | `playwright/auth/reset_password_invalid_or_expired_token.spec.ts` | Partial | `spec/system/users/reset_password_spec.rb` | Missing expiry + reused token check.
| P1 | `playwright/auth/protected_route_redirect.spec.ts` | Missing | N/A | Critical for SPA/route guard parity.
| P1 | `playwright/auth/session_timeout_reauth.spec.ts` | Missing | N/A | Upgrade risk with cookie/session libs.
| P2 | `playwright/auth/oauth_google_happy_path.spec.ts` | Missing | N/A | Add if OAuth enabled in env.

## App Shell, Navigation & Routing
| Priority | Playwright Spec | Parity Status | Existing Coverage (RSpec System) | Notes |
|---|---|---|---|---|
| P0 | `playwright/app/sidebar_navigation_links.spec.ts` | Covered | `spec/system/navigation_spec.rb` | Validate all primary nav entries.
| P0 | `playwright/app/mobile_navigation_drawer.spec.ts` | Partial | `spec/system/navigation_spec.rb` | Need responsive/mobile assertions.
| P0 | `playwright/app/spa_deep_links_core_pages.spec.ts` | Missing | N/A | Guard against route fallback regressions.
| P0 | `playwright/app/non_api_path_refresh_fallback.spec.ts` | Missing | N/A | Required due prior catch-all routing issue.
| P1 | `playwright/app/not_found_route.spec.ts` | Missing | N/A | Add user-friendly 404 check.
| P1 | `playwright/app/global_toasts_and_error_banner.spec.ts` | Missing | N/A | Common parity break after JS upgrades.
| P1 | `playwright/app/browser_console_no_errors_core_flows.spec.ts` | Missing | N/A | Mandatory parity guard for runtime crashes.
| P2 | `playwright/app/accessibility_smoke_core_pages.spec.ts` | Missing | N/A | Add `axe` pass for key pages.

## Dashboard
| Priority | Playwright Spec | Parity Status | Existing Coverage (RSpec System) | Notes |
|---|---|---|---|---|
| P0 | `playwright/dashboard/render_company_pulse_and_cards.spec.ts` | Covered | `spec/system/dashboard_spec.rb` | Keep key heading/metrics assertions.
| P0 | `playwright/dashboard/widget_navigation_links.spec.ts` | Partial | `spec/system/dashboard_spec.rb` | Ensure each widget routes correctly.
| P1 | `playwright/dashboard/date_filter_updates_metrics.spec.ts` | Missing | N/A | Needed for behavior parity.
| P1 | `playwright/dashboard/empty_state_new_workspace.spec.ts` | Missing | N/A | High-value onboarding path.
| P1 | `playwright/dashboard/role_based_widget_visibility.spec.ts` | Missing | N/A | RBAC parity risk.

## Clients
| Priority | Playwright Spec | Parity Status | Existing Coverage (RSpec System) | Notes |
|---|---|---|---|---|
| P0 | `playwright/clients/list_columns_and_values.spec.ts` | Covered | `spec/system/clients/index_spec.rb` | Includes key table labels/parity text.
| P0 | `playwright/clients/search.spec.ts` | Covered | `spec/system/clients/search_spec.rb` | Add no-results assertions.
| P0 | `playwright/clients/create.spec.ts` | Covered | `spec/system/clients/create_spec.rb` | Add duplicate validation.
| P0 | `playwright/clients/edit.spec.ts` | Covered | `spec/system/clients/edit_spec.rb` | Add canceled-edit behavior.
| P0 | `playwright/clients/delete.spec.ts` | Covered | `spec/system/clients/delete_spec.rb` | Include destructive-confirmation flow.
| P0 | `playwright/clients/hours_logged_filtering.spec.ts` | Covered | `spec/system/clients/hours_logged_spec.rb` | Validate timeframe persistence.
| P0 | `playwright/clients/overdue_outstanding_calculation.spec.ts` | Covered | `spec/system/clients/overdue_and_outstanding_calucluation_spec.rb` | Ensure rounding/currency format.
| P1 | `playwright/clients/payment_reminder_send.spec.ts` | Covered | `spec/system/clients/due_invoice_payment_reminder_spec.rb` | Add API failure handling path.
| P1 | `playwright/clients/pagination_sorting.spec.ts` | Missing | N/A | Common list parity gap.
| P1 | `playwright/clients/empty_state_and_cta.spec.ts` | Partial | `spec/system/clients/index_spec.rb` | Ensure restored legacy copy is locked.

## Projects
| Priority | Playwright Spec | Parity Status | Existing Coverage (RSpec System) | Notes |
|---|---|---|---|---|
| P0 | `playwright/projects/list_and_columns.spec.ts` | Covered | `spec/system/projects/index_spec.rb` | Includes hours + project/client parity.
| P0 | `playwright/projects/search.spec.ts` | Covered | `spec/system/projects/search_spec.rb` | Ensure project+client query behavior.
| P0 | `playwright/projects/create.spec.ts` | Covered | `spec/system/projects/create_spec.rb` | Add required-field errors.
| P0 | `playwright/projects/edit.spec.ts` | Covered | `spec/system/projects/edit_spec.rb` | Include assignment changes.
| P0 | `playwright/projects/delete_or_archive.spec.ts` | Covered | `spec/system/projects/delete_spec.rb` | Validate list refresh after deletion.
| P0 | `playwright/projects/add_team_member.spec.ts` | Covered | `spec/system/projects/add_team_member_spec.rb` | Add duplicate-member prevention.
| P1 | `playwright/projects/details_page_load_and_tabs.spec.ts` | Partial | `spec/system/projects/index_spec.rb` | Needs deeper details coverage.
| P1 | `playwright/projects/empty_state_and_cta.spec.ts` | Partial | `spec/system/projects/index_spec.rb` | Lock parity text and CTA behavior.

## Time Tracking
| Priority | Playwright Spec | Parity Status | Existing Coverage (RSpec System) | Notes |
|---|---|---|---|---|
| P0 | `playwright/time_tracking/main_time_tracking_page.spec.ts` | Covered | `spec/system/time_tracking_spec.rb`, `spec/system/time_tracking/time_tracking_spec.rb` | Consolidate duplicate intent in PW.
| P0 | `playwright/time_tracking/day_view.spec.ts` | Covered | `spec/system/time_tracking/day_view_spec.rb` | Add timezone-sensitive assertions.
| P0 | `playwright/time_tracking/week_view.spec.ts` | Covered | `spec/system/time_tracking/week_view_spec.rb` | Verify weekly totals.
| P0 | `playwright/time_tracking/calendar_view.spec.ts` | Covered | `spec/system/time_tracking/calendar_spec.rb` | Add cross-month navigation checks.
| P0 | `playwright/time_tracking/add_entry.spec.ts` | Covered | `spec/system/time_tracking/add_entry_spec.rb` | Add boundary validation (end before start).
| P0 | `playwright/time_tracking/entries_crud.spec.ts` | Covered | `spec/system/time_tracking/entries_spec.rb`, `spec/system/time_tracking_entry_spec.rb` | Validate edit/delete confirmations.
| P1 | `playwright/time_tracking/billable_toggle_and_totals.spec.ts` | Missing | N/A | Important billing parity check.
| P1 | `playwright/time_tracking/project_client_dependency_dropdowns.spec.ts` | Missing | N/A | Prevent invalid entry combos.
| P1 | `playwright/time_tracking/timer_start_pause_resume_stop.spec.ts` | Missing | N/A | Add if timer mode exists in UI.
| P1 | `playwright/time_tracking/overlap_prevention_validation.spec.ts` | Missing | N/A | High-risk data integrity path.

## Invoices
| Priority | Playwright Spec | Parity Status | Existing Coverage (RSpec System) | Notes |
|---|---|---|---|---|
| P0 | `playwright/invoices/index_filters_and_search.spec.ts` | Covered | `spec/system/invoices/index_spec.rb` | Add status-pill counts parity.
| P0 | `playwright/invoices/generate_invoice.spec.ts` | Covered | `spec/system/invoices/generate_invoice_spec.rb` | Ensure draft + publish flows.
| P0 | `playwright/invoices/edit_invoice_line_items.spec.ts` | Covered | `spec/system/invoices/edit_invoice_spec.rb` | Add tax/discount rounding checks.
| P0 | `playwright/invoices/send_invoice.spec.ts` | Covered | `spec/system/invoices/send_invoice_spec.rb` | Add API failure path.
| P0 | `playwright/invoices/send_reminder.spec.ts` | Covered | `spec/system/invoices/send_reminder_spec.rb` | Add retry behavior.
| P0 | `playwright/invoices/invoice_history_timeline.spec.ts` | Covered | `spec/system/invoices/invoice_history_spec.rb` | Validate sequence timestamps.
| P0 | `playwright/invoices/pdf_download.spec.ts` | Covered | `spec/system/invoice_pdf_download_spec.rb` | Compare critical totals in PDF.
| P0 | `playwright/invoices/multi_currency_invoice.spec.ts` | Covered | `spec/system/multi_currency_invoice_spec.rb` | Must lock conversion display parity.
| P1 | `playwright/invoices/public_invoice_view.spec.ts` | Missing | N/A | Validate unauthenticated invoice view.
| P1 | `playwright/invoices/public_invoice_invalid_link.spec.ts` | Missing | N/A | Ensure proper error state.
| P1 | `playwright/invoices/status_transition_draft_sent_paid_overdue.spec.ts` | Partial | `spec/system/invoices/index_spec.rb`, `spec/system/invoices/invoice_history_spec.rb` | Needs explicit transition matrix.
| P1 | `playwright/invoices/partial_payment_balance_updates.spec.ts` | Missing | N/A | Critical for financial parity.
| P1 | `playwright/invoices/cancel_void_rules.spec.ts` | Missing | N/A | Add if supported by product rules.

## Payments
| Priority | Playwright Spec | Parity Status | Existing Coverage (RSpec System) | Notes |
|---|---|---|---|---|
| P0 | `playwright/payments/list.spec.ts` | Covered | `spec/system/payments/list_spec.rb`, `spec/system/payments/index_spec.rb` | Keep as smoke and detail test.
| P0 | `playwright/payments/create_manual_payment.spec.ts` | Covered | `spec/system/payments/create_spec.rb` | Add validation failures.
| P1 | `playwright/payments/stripe_checkout_success.spec.ts` | Missing | N/A | Required if Stripe checkout is active.
| P1 | `playwright/payments/stripe_checkout_cancel.spec.ts` | Missing | N/A | Critical negative path.
| P1 | `playwright/payments/record_payment_updates_invoice_balance.spec.ts` | Missing | N/A | Cross-module parity validation.
| P2 | `playwright/payments/refund_or_reversal.spec.ts` | Missing | N/A | Add only if feature exists.

## Expenses
| Priority | Playwright Spec | Parity Status | Existing Coverage (RSpec System) | Notes |
|---|---|---|---|---|
| P0 | `playwright/expenses/list_filters.spec.ts` | Covered | `spec/system/expenses/index_spec.rb` | Add empty state assertions.
| P0 | `playwright/expenses/create_edit_delete_crud.spec.ts` | Missing | N/A | No explicit CRUD system specs found.
| P1 | `playwright/expenses/receipt_upload_preview_remove.spec.ts` | Missing | N/A | High-value user path.
| P1 | `playwright/expenses/category_project_linking.spec.ts` | Missing | N/A | Ensures reporting consistency.

## Reports
| Priority | Playwright Spec | Parity Status | Existing Coverage (RSpec System) | Notes |
|---|---|---|---|---|
| P0 | `playwright/reports/index_navigation.spec.ts` | Covered | `spec/system/reports/index_spec.rb` | Ensure all report cards route correctly.
| P0 | `playwright/reports/outstanding_overdue_report.spec.ts` | Covered | `spec/system/outstanding_overdue_reports_spec.rb` | Add export if available.
| P1 | `playwright/reports/time_entry_report.spec.ts` | Missing | N/A | Needs data correctness assertions.
| P1 | `playwright/reports/revenue_by_client_report.spec.ts` | Missing | N/A | High business-impact report.
| P1 | `playwright/reports/total_hours_report.spec.ts` | Missing | N/A | Required parity for billing.
| P1 | `playwright/reports/accounts_aging_report.spec.ts` | Missing | N/A | Required finance parity.
| P1 | `playwright/reports/payments_report.spec.ts` | Missing | N/A | Completes report set.
| P1 | `playwright/reports/shared_filters_date_client_project.spec.ts` | Missing | N/A | Cross-report consistency.

## Team & Members
| Priority | Playwright Spec | Parity Status | Existing Coverage (RSpec System) | Notes |
|---|---|---|---|---|
| P0 | `playwright/team/list_and_details.spec.ts` | Covered | `spec/system/teams/index_spec.rb`, `spec/system/teams/details_spec.rb` | Keep table + drawer/detail checks.
| P0 | `playwright/team/create_member_or_team.spec.ts` | Covered | `spec/system/teams/create_spec.rb` | Add invalid invite email path.
| P0 | `playwright/team/edit_role_permissions.spec.ts` | Covered | `spec/system/teams/edit_spec.rb` | Verify permission effect in UI.
| P0 | `playwright/team/delete_member_or_team.spec.ts` | Covered | `spec/system/teams/delete_spec.rb` | Ensure guardrails for last admin.
| P0 | `playwright/team/members_management.spec.ts` | Covered | `spec/system/teams/members_spec.rb` | Add pagination/search if present.
| P1 | `playwright/team/invite_acceptance_flow.spec.ts` | Missing | N/A | End-to-end invitation parity.
| P1 | `playwright/team/role_based_visibility_matrix.spec.ts` | Missing | N/A | Prevent RBAC regressions.

## Settings, Profile, Organization
| Priority | Playwright Spec | Parity Status | Existing Coverage (RSpec System) | Notes |
|---|---|---|---|---|
| P0 | `playwright/settings/profile_view_edit.spec.ts` | Covered | `spec/system/profile/settings_spec.rb` | Verify all editable fields persist.
| P0 | `playwright/settings/employment_details.spec.ts` | Covered | `spec/system/employment_details/index_spec.rb`, `spec/system/employment_details/edit_spec.rb` | Include required fields validations.
| P0 | `playwright/settings/leaves_management.spec.ts` | Covered | `spec/system/settings/leaves_spec.rb` | Add entitlement edge cases.
| P0 | `playwright/settings/holidays_management.spec.ts` | Covered | `spec/system/settings/holidays_spec.rb`, `spec/system/holidays_management_spec.rb` | Consolidate duplicate intent.
| P0 | `playwright/settings/organization_settings.spec.ts` | Covered | `spec/system/settings/organization_spec.rb` | Admin-only visibility checks.
| P0 | `playwright/settings/payment_settings.spec.ts` | Covered | `spec/system/settings/payment_spec.rb` | Add failure handling for provider calls.
| P1 | `playwright/settings/company_workspace_edit.spec.ts` | Covered | `spec/system/companies/edit_spec.rb`, `spec/system/companies/index_spec.rb` | Add workspace switch if available.
| P1 | `playwright/settings/company_workspace_create.spec.ts` | Covered | `spec/system/companies/create_spec.rb` | Validate permission boundaries.
| P1 | `playwright/settings/notification_preferences.spec.ts` | Missing | N/A | Not explicitly covered.
| P1 | `playwright/settings/device_session_management.spec.ts` | Missing | N/A | Not explicitly covered.

## Cross-Cutting Critical Parity Specs
| Priority | Playwright Spec | Parity Status | Existing Coverage (RSpec System) | Notes |
|---|---|---|---|---|
| P0 | `playwright/regression/console_errors_none_on_core_flows.spec.ts` | Missing | N/A | Must fail on JS runtime errors.
| P0 | `playwright/regression/api_401_403_404_422_ui_handling.spec.ts` | Missing | N/A | Validate user-facing error behavior.
| P0 | `playwright/regression/list_pagination_sort_search_consistency.spec.ts` | Missing | N/A | Across clients/projects/invoices/expenses.
| P0 | `playwright/regression/date_currency_locale_formatting.spec.ts` | Missing | N/A | Upgrade-sensitive formatting parity.
| P1 | `playwright/regression/file_upload_limits_and_errors.spec.ts` | Missing | N/A | Include expense/invoice attachments.
| P1 | `playwright/regression/background_job_status_feedback.spec.ts` | Missing | N/A | Validate UI polling/notifications.
| P1 | `playwright/regression/browser_matrix_chromium_firefox_webkit_smoke.spec.ts` | Missing | N/A | Detect browser-specific regressions.
| P2 | `playwright/regression/mobile_responsive_core_flows.spec.ts` | Missing | N/A | Add iPhone/Pixel viewport validation.

## Suggested Implementation Order
1. Build all `P0` specs first (block release).
2. Build all `P1` specs for confidence completion.
3. Add `P2` specs for hardening and long-term quality.

## Immediate High-Value Backlog (first 20 to implement)
1. `playwright/auth/protected_route_redirect.spec.ts`
2. `playwright/app/spa_deep_links_core_pages.spec.ts`
3. `playwright/app/non_api_path_refresh_fallback.spec.ts`
4. `playwright/app/browser_console_no_errors_core_flows.spec.ts`
5. `playwright/clients/pagination_sorting.spec.ts`
6. `playwright/projects/details_page_load_and_tabs.spec.ts`
7. `playwright/time_tracking/billable_toggle_and_totals.spec.ts`
8. `playwright/time_tracking/project_client_dependency_dropdowns.spec.ts`
9. `playwright/time_tracking/overlap_prevention_validation.spec.ts`
10. `playwright/invoices/public_invoice_view.spec.ts`
11. `playwright/invoices/public_invoice_invalid_link.spec.ts`
12. `playwright/invoices/status_transition_draft_sent_paid_overdue.spec.ts`
13. `playwright/invoices/partial_payment_balance_updates.spec.ts`
14. `playwright/payments/stripe_checkout_success.spec.ts`
15. `playwright/payments/stripe_checkout_cancel.spec.ts`
16. `playwright/expenses/create_edit_delete_crud.spec.ts`
17. `playwright/reports/time_entry_report.spec.ts`
18. `playwright/reports/revenue_by_client_report.spec.ts`
19. `playwright/team/invite_acceptance_flow.spec.ts`
20. `playwright/regression/api_401_403_404_422_ui_handling.spec.ts`

## Tracking Fields Template
Use this row template when executing:

```md
| Spec | Priority | Owner | Status | Blocked By | Parity Gap | Last Run | Evidence |
|---|---|---|---|---|---|---|---|
| playwright/module/example.spec.ts | P0 | @owner | Not Started | - | Missing feature parity for ... | - | - |
```

## Runner Assignment (Capybara vs Playwright vs Both)

Use this section as the execution source of truth.

### Assignment Rules
- `Capybara`: Rails-heavy workflows, server-rendered boundaries, auth/session, core CRUD already stable in `spec/system`.
- `Playwright`: SPA route behavior, browser console/runtime errors, responsive behavior, JS-intensive interactions, cross-browser risk.
- `Both`: Mission-critical smoke paths where backend + frontend regression risk is high.

### Authentication & Session
| Spec | Runner |
|---|---|
| `playwright/auth/sign_in_valid_credentials.spec.ts` | Both |
| `playwright/auth/sign_in_invalid_credentials.spec.ts` | Capybara |
| `playwright/auth/sign_out.spec.ts` | Capybara |
| `playwright/auth/sign_up.spec.ts` | Capybara |
| `playwright/auth/email_confirmation_valid_token.spec.ts` | Capybara |
| `playwright/auth/email_confirmation_invalid_or_expired_token.spec.ts` | Capybara |
| `playwright/auth/forgot_password_request.spec.ts` | Capybara |
| `playwright/auth/reset_password_valid_token.spec.ts` | Capybara |
| `playwright/auth/reset_password_invalid_or_expired_token.spec.ts` | Capybara |
| `playwright/auth/protected_route_redirect.spec.ts` | Playwright |
| `playwright/auth/session_timeout_reauth.spec.ts` | Both |
| `playwright/auth/oauth_google_happy_path.spec.ts` | Playwright |

### App Shell, Navigation & Routing
| Spec | Runner |
|---|---|
| `playwright/app/sidebar_navigation_links.spec.ts` | Both |
| `playwright/app/mobile_navigation_drawer.spec.ts` | Playwright |
| `playwright/app/spa_deep_links_core_pages.spec.ts` | Playwright |
| `playwright/app/non_api_path_refresh_fallback.spec.ts` | Playwright |
| `playwright/app/not_found_route.spec.ts` | Playwright |
| `playwright/app/global_toasts_and_error_banner.spec.ts` | Playwright |
| `playwright/app/browser_console_no_errors_core_flows.spec.ts` | Playwright |
| `playwright/app/accessibility_smoke_core_pages.spec.ts` | Playwright |

### Dashboard
| Spec | Runner |
|---|---|
| `playwright/dashboard/render_company_pulse_and_cards.spec.ts` | Both |
| `playwright/dashboard/widget_navigation_links.spec.ts` | Playwright |
| `playwright/dashboard/date_filter_updates_metrics.spec.ts` | Both |
| `playwright/dashboard/empty_state_new_workspace.spec.ts` | Playwright |
| `playwright/dashboard/role_based_widget_visibility.spec.ts` | Playwright |

### Clients
| Spec | Runner |
|---|---|
| `playwright/clients/list_columns_and_values.spec.ts` | Both |
| `playwright/clients/search.spec.ts` | Both |
| `playwright/clients/create.spec.ts` | Capybara |
| `playwright/clients/edit.spec.ts` | Capybara |
| `playwright/clients/delete.spec.ts` | Capybara |
| `playwright/clients/hours_logged_filtering.spec.ts` | Both |
| `playwright/clients/overdue_outstanding_calculation.spec.ts` | Both |
| `playwright/clients/payment_reminder_send.spec.ts` | Both |
| `playwright/clients/pagination_sorting.spec.ts` | Playwright |
| `playwright/clients/empty_state_and_cta.spec.ts` | Both |

### Projects
| Spec | Runner |
|---|---|
| `playwright/projects/list_and_columns.spec.ts` | Both |
| `playwright/projects/search.spec.ts` | Both |
| `playwright/projects/create.spec.ts` | Capybara |
| `playwright/projects/edit.spec.ts` | Capybara |
| `playwright/projects/delete_or_archive.spec.ts` | Capybara |
| `playwright/projects/add_team_member.spec.ts` | Both |
| `playwright/projects/details_page_load_and_tabs.spec.ts` | Playwright |
| `playwright/projects/empty_state_and_cta.spec.ts` | Both |

### Time Tracking
| Spec | Runner |
|---|---|
| `playwright/time_tracking/main_time_tracking_page.spec.ts` | Both |
| `playwright/time_tracking/day_view.spec.ts` | Both |
| `playwright/time_tracking/week_view.spec.ts` | Both |
| `playwright/time_tracking/calendar_view.spec.ts` | Both |
| `playwright/time_tracking/add_entry.spec.ts` | Both |
| `playwright/time_tracking/entries_crud.spec.ts` | Both |
| `playwright/time_tracking/billable_toggle_and_totals.spec.ts` | Playwright |
| `playwright/time_tracking/project_client_dependency_dropdowns.spec.ts` | Playwright |
| `playwright/time_tracking/timer_start_pause_resume_stop.spec.ts` | Playwright |
| `playwright/time_tracking/overlap_prevention_validation.spec.ts` | Both |

### Invoices
| Spec | Runner |
|---|---|
| `playwright/invoices/index_filters_and_search.spec.ts` | Both |
| `playwright/invoices/generate_invoice.spec.ts` | Both |
| `playwright/invoices/edit_invoice_line_items.spec.ts` | Both |
| `playwright/invoices/send_invoice.spec.ts` | Both |
| `playwright/invoices/send_reminder.spec.ts` | Both |
| `playwright/invoices/invoice_history_timeline.spec.ts` | Both |
| `playwright/invoices/pdf_download.spec.ts` | Capybara |
| `playwright/invoices/multi_currency_invoice.spec.ts` | Both |
| `playwright/invoices/public_invoice_view.spec.ts` | Playwright |
| `playwright/invoices/public_invoice_invalid_link.spec.ts` | Playwright |
| `playwright/invoices/status_transition_draft_sent_paid_overdue.spec.ts` | Both |
| `playwright/invoices/partial_payment_balance_updates.spec.ts` | Both |
| `playwright/invoices/cancel_void_rules.spec.ts` | Capybara |

### Payments
| Spec | Runner |
|---|---|
| `playwright/payments/list.spec.ts` | Both |
| `playwright/payments/create_manual_payment.spec.ts` | Both |
| `playwright/payments/stripe_checkout_success.spec.ts` | Playwright |
| `playwright/payments/stripe_checkout_cancel.spec.ts` | Playwright |
| `playwright/payments/record_payment_updates_invoice_balance.spec.ts` | Both |
| `playwright/payments/refund_or_reversal.spec.ts` | Capybara |

### Expenses
| Spec | Runner |
|---|---|
| `playwright/expenses/list_filters.spec.ts` | Both |
| `playwright/expenses/create_edit_delete_crud.spec.ts` | Both |
| `playwright/expenses/receipt_upload_preview_remove.spec.ts` | Playwright |
| `playwright/expenses/category_project_linking.spec.ts` | Both |

### Reports
| Spec | Runner |
|---|---|
| `playwright/reports/index_navigation.spec.ts` | Both |
| `playwright/reports/outstanding_overdue_report.spec.ts` | Both |
| `playwright/reports/time_entry_report.spec.ts` | Both |
| `playwright/reports/revenue_by_client_report.spec.ts` | Both |
| `playwright/reports/total_hours_report.spec.ts` | Both |
| `playwright/reports/accounts_aging_report.spec.ts` | Both |
| `playwright/reports/payments_report.spec.ts` | Both |
| `playwright/reports/shared_filters_date_client_project.spec.ts` | Both |

### Team & Members
| Spec | Runner |
|---|---|
| `playwright/team/list_and_details.spec.ts` | Both |
| `playwright/team/create_member_or_team.spec.ts` | Both |
| `playwright/team/edit_role_permissions.spec.ts` | Both |
| `playwright/team/delete_member_or_team.spec.ts` | Both |
| `playwright/team/members_management.spec.ts` | Both |
| `playwright/team/invite_acceptance_flow.spec.ts` | Playwright |
| `playwright/team/role_based_visibility_matrix.spec.ts` | Playwright |

### Settings, Profile, Organization
| Spec | Runner |
|---|---|
| `playwright/settings/profile_view_edit.spec.ts` | Both |
| `playwright/settings/employment_details.spec.ts` | Both |
| `playwright/settings/leaves_management.spec.ts` | Both |
| `playwright/settings/holidays_management.spec.ts` | Both |
| `playwright/settings/organization_settings.spec.ts` | Both |
| `playwright/settings/payment_settings.spec.ts` | Both |
| `playwright/settings/company_workspace_edit.spec.ts` | Both |
| `playwright/settings/company_workspace_create.spec.ts` | Both |
| `playwright/settings/notification_preferences.spec.ts` | Playwright |
| `playwright/settings/device_session_management.spec.ts` | Playwright |

### Cross-Cutting Regression
| Spec | Runner |
|---|---|
| `playwright/regression/console_errors_none_on_core_flows.spec.ts` | Playwright |
| `playwright/regression/api_401_403_404_422_ui_handling.spec.ts` | Both |
| `playwright/regression/list_pagination_sort_search_consistency.spec.ts` | Both |
| `playwright/regression/date_currency_locale_formatting.spec.ts` | Both |
| `playwright/regression/file_upload_limits_and_errors.spec.ts` | Both |
| `playwright/regression/background_job_status_feedback.spec.ts` | Playwright |
| `playwright/regression/browser_matrix_chromium_firefox_webkit_smoke.spec.ts` | Playwright |
| `playwright/regression/mobile_responsive_core_flows.spec.ts` | Playwright |
