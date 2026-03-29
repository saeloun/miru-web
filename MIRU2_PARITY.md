# Miru 2.0 (PR #1996) — Parity Checklist (develop vs miru-2-0-upgrade)

Goal: **All legacy functionality and pages from `develop` must work on `miru-2-0-upgrade`**, even if UI is redesigned.

## How we’ll run this
- Build a page/flow inventory from `develop`
- Verify each item on `miru-2-0-upgrade`
- For every mismatch: create a bugfix commit + update PR #1996 with milestone notes

## Inventory (initial)

### Auth / Session
- [ ] Sign in
- [ ] Sign out
- [ ] Forgot password
- [ ] Email confirmation

### Core entities
- [ ] Clients: list, show, create, edit, archive/delete
- [ ] Projects: list, show, create, edit
- [ ] Team members / roles

### Time tracking
- [ ] Add time entry
- [ ] Calendar views load (month/week/day if present)
- [ ] Filters (employee/project/client)

### Invoices
- [ ] Create invoice
- [ ] Edit invoice line items
- [ ] Send invoice
- [ ] PDF generation/download
- [ ] Payments applied / status updates

### Reports
- [ ] Time entry report
- [ ] Payment report
- [ ] Accounts aging report

### Settings
- [ ] Organization settings
- [ ] Payment settings (Stripe)
- [ ] Devices
- [ ] Preferences / notifications

## Route-level diffs noticed (from config/routes.rb)
- `miru-2-0-upgrade` adds: Avo (`mount_avo`), `/health`, `/pghero` (owner-only), `/analytics/*` (authorized-only)
- `miru-2-0-upgrade` removes: `draw(:internal_api)` (migrated to `draw(:api)` only)

## Next concrete step
- Generate a full route list on both branches and diff (`bin/rails routes`).
- Crawl UI entrypoints and map React routes to pages.
- Start a manual smoke pass for the P0 flows: login → clients → projects → time tracking → invoices → PDF.
