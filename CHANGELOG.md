# Changelog

## Unreleased

### Added

- Falcon server support and a parallel system-spec runner with schema-aware database prep skipping
- CRUD-focused system coverage for invoice editing and time-tracking flows

### Changed

- Invoice creation and editing now guard against duplicate draft line items, preserve zero-value amounts, and clamp totals to zero when the last line item is removed
- Time-tracking entry creation no longer shows a duplicate saved entry before refresh when the visible list rehydrates
- Draft invoice line-item inputs now stay visually aligned with the standard invoice row layout while typing a new manual entry
- Time-tracking entry flows now rehydrate saved state reliably on the same page and use more stable system-spec selectors
- System-spec support code was consolidated by removing dead helper modules and stabilizing auth/request-capture teardown

### Verified

- `mise exec -- timeout 30 bin/vite build`
- `mise exec -- bundle exec rspec spec/system/time_tracking/add_entry_spec.rb -fd`
- `mise exec -- bundle exec rspec spec/system/invoices/create_spec.rb spec/system/invoices/edit_spec.rb -fd`
- `mise exec -- env PARALLEL_TEST_PROCESSORS=16 CONSOLE_LEVEL=error SYSTEM_SPECS_DB_PREP=0 bin/system-specs-parallel`
- `rtk mise exec -- bundle exec rspec spec/system/time_tracking/add_entry_spec.rb -e "adds a time entry from week view with project, duration, and notes" -fd`
- `rtk mise exec -- bundle exec rspec spec/system/time_tracking/add_entry_spec.rb -e "shows selected day total in month view and allows adding entry from the same screen" -fd`
- `rtk mise exec -- bundle exec rspec spec/system/invoices/create_spec.rb:17 -fd`
- `rtk mise exec -- bundle exec rspec spec/system/invoices/create_spec.rb:48 -fd`
- Real browser verification on local `/invoices/new?clientId=1` with no console errors
- Exact production Actions succeeded for `a5a8083ed` and `b1f6a0ec3`

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
