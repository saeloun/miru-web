# Changelog

## Unreleased

### Added

- UPI payment settings with free Miru-branded QR generation for INR invoices, including public invoice and PDF invoice display
- Falcon server support and a parallel system-spec runner with schema-aware database prep skipping
- CRUD-focused system coverage for invoice editing and time-tracking flows

### Changed

- Invoice creation and editing now guard against duplicate draft line items, preserve zero-value amounts, and clamp totals to zero when the last line item is removed
- Invoice line-item rows now prefer employee first/last names over description-backed fallback text so selected employee names render correctly on new invoices (rendering-only change, no DB impact)
- Invoice line-item rate lookups now resolve project-member hourly rates per project consistently, preventing missing rates when generating invoices across multiple projects or after member-removal workflows
- Time-tracking entry creation no longer shows a duplicate saved entry before refresh when the visible list rehydrates
- Draft invoice line-item inputs now stay visually aligned with the standard invoice row layout while typing a new manual entry
- Client creation forms now mark all required fields consistently and show a live "Missing required fields" summary when the submit button is disabled
- Time-tracking entry flows now rehydrate saved state reliably on the same page and use more stable system-spec selectors
- System-spec support code was consolidated by removing dead helper modules and stabilizing auth/request-capture teardown
- Weekly reminder processing now better distinguishes legacy hour-based timesheet data from minute-based entries to avoid false reminder emails for users who met weekly hour targets
- Mailer layout branding now uses asset helper URLs with production `action_mailer.asset_host` to keep email logo assets resolvable in production mail clients

## 3.0.0 - 2026-03-29

Release owner: `Vipul A M`

### Added

- Render-first production deployment flow, with the `production` branch as the deploy branch for `app.miru.so`
- Render Blueprint support via [`render.yaml`](render.yaml) for one-click infrastructure setup
- Responsive mailer layout and local Rails mailer previews for core outbound emails
- Gravatar and uploaded-avatar fallbacks across the app shell and team surfaces

### Changed

- Dashboard defaults now emphasize year-to-date revenue trends
- Recently updated invoices now sort by `updated_at` descending instead of surfacing stale entries first
- Team listing loads the full production dataset instead of stopping at the first 10 rows
- Payments listing now supports infinite scrolling on larger datasets
- Release docs and repository metadata now reflect the Miru 3.0 release line and Render deployment path

### Removed

- Fly.io deployment configs, review-app scripts, and Fly-specific build hooks from the repository

### Verified

- Focused Rails and frontend test batches
- Vite production build
- Browser verification on the live app at `https://app.miru.so`
