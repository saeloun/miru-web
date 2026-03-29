# Changelog

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
