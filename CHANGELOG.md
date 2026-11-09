# Changelog

## [3.3.0] - 2026-11-09

### Added

- **Approve consultant leave before payroll.** Configure a reconciled opening, earned leave and borrowing limits, then record explicit paid, unpaid, advance, deferred, waived or correction decisions for missing hours.
- **Review leave at year end and exit.** Keep outstanding advances, deferred cases and cash recoveries visible, with private review notices and recorded decisions.
- **Read approved leave in India payroll reports.** Retain paid leave and opening, accrued, advance, deferred and closing balances in the approved report and accounts email.
- **Review fees for partial service months.** Record an explicit service-period base fee for joining, leaving or changed terms before leave decisions and payroll approval; fees are never automatically prorated.
- **Record consultant invoice permission.** Consultants can grant or withdraw authorization and read its history, including after exit. Saving permission does not issue an invoice.
- **Confirm changes to bank accounts.** Re-enter the account number when saving primary consultant bank details. Assigned payroll reviewers receive a generic change notice without bank values.
- **Review private billing and tax facts.** Consultants submit declared legal name, address, PAN/GST applicability and private evidence for a separate accounts review before new payments. This does not establish government verification or select tax rates.

### Changed

- **Prepare payroll from approved leave decisions.** Each consultant requires a policy approved by an active owner or admin before a new payroll revision. Changes to attendance, policy or decisions require fresh review; accepted bank reports retain their approved values.
- **Keep existing transfers intact.** Later payroll revisions retain the original approved source, amounts and claims for transfers already started. New transfers and remaining split legs still need current review and source checks. Changed facts can hold an unsent leg; reconcile bank status without bypassing the hold.
- **Back up before deployment.** Take a verified backup and follow the [deployment guide](docs/payroll-pto-ledger.md). After financial adoption, older application versions cannot safely write to the new ledger; the final migration prevents destructive rollback. Use a reviewed forward correction or restore a compatible database and application together.

### Fixed

- **Recover leave adjustments once.** Preserve reservations through partial or uncertain payments, settle against confirmed credit and reopen review after a return, including carried split payments.
- **Keep minute-based pay exact.** Calculate leave quantities and pay from exact minutes so display rounding cannot change a deduction, available balance or payment amount.
- **Preserve historical leave balances.** Prevent backdated decisions and policy changes from spending an already consumed balance or moving an earlier balance into a later month.
- **Reconcile replacement payments safely.** Require a fresh payroll revision when a carried leave reservation loses its original payment, and finish return review only after every affected recovery is resolved.
- **Limit assigned payroll review to eligible consultants.** Keep initial preparation available while rejecting unconfigured or out-of-period subjects before reading their leave facts.
- **Keep opening leave identities consistent.** Validate opening dates independently of the database session's date display format.
- **Keep billing navigation stable.** Profile sections loading in the background no longer move the billing-identity link during a click.

## [3.2.1] - 2026-11-09

### Fixed

- Birthday and work-anniversary reminders recheck corrected profile dates before sending, preventing stale messages and missing-date failures.
- Signing cancellations finish after provider confirmation without duplicate completion records. Document-list and download failures show the appropriate retry guidance.

### Added

- An isolated AMD64 build check and downloadable image archive for the self-hosted signing provider, without publishing or deploying it.

## 3.0.8 - 2026-11-08

### Fixed

- Payment-provider credentials and QuickBooks tokens can keep their encryption key when session signing keys change. Before rotation, securely pin `PROVIDER_CREDENTIALS_ENCRYPTION_SECRET` to the existing signing key as described in `.env.example`. This does not rotate or re-encrypt stored credentials.

## 3.0.7 - 2026-11-08

### Added

- Private hiring intake, forms and assignment review; separately confirmed candidate communications with retained attempts and delivery reconciliation; interviews and feedback, approved offers and hire invitations, pipeline reporting, and explicitly approved retention. Forms and retention start disabled; local verification does not establish external-provider or production readiness
- Consultant payroll can now be prepared, reviewed and approved in the app, with reimbursement claims reserved against the run and never prorated, spouse-split transfers, and Mercury approval requests with bank status tracking and INR credit reconciliation. Disabled by default; Mercury writes need a separate server switch and have not been exercised against a real Mercury account
- Razorpay account connection: workspace owners and admins can connect or create a Razorpay account on Razorpay's hosted flow and collect INR invoice payments into it. Off unless `RAZORPAY_OAUTH_ENABLED` and `RAZORPAY_OAUTH_COLLECTIONS_ENABLED` are set; it does not activate Payroll or payouts
- Editable organization profitability plans with saved baselines, monthly capacity/rate/compensation and overhead assumptions, cash/runway scenarios, original source warnings, and authorized expiring CSV exports
- Organization Compensation Burn and Profitability reports for active owners and admins with Pro access, including dated compensation and billing rates, INR/USD conversion, utilization and margin breakdowns, period comparisons, data-readiness counts, and audited expiring CSV downloads
- Private approved-provider salary-slip imports and publication, employee tax-evidence review, consultant payment previews, and a bounded India annual salary/interest tax comparison
- Encrypted employee records, private PAN/contracts, manually recorded payment history, customizable CSV reports, and opt-in birthday/work-anniversary reminders
- UPI payment settings with free Miru-branded QR generation for INR invoices, including public invoice and PDF invoice display
- Razorpay webhook handling for cancelled and expired Payment Links, plus `payout.updated` status refreshes
- Razorpay onboarding docs with exact Payment Links and RazorpayX webhook setup steps
- Miru CLI `invoice create` and matching MCP `miru.invoice.create` support for draft invoice creation from terminal or agent workflows
- Miru CLI installs and upgrades now resolve the latest tagged CLI release instead of the moving `main` branch
- Falcon server support and a parallel system-spec runner with schema-aware database prep skipping
- CRUD-focused system coverage for invoice editing and time-tracking flows

### Changed

- Employee reports batch monthly source queries and preserve exact decimal reimbursement totals; stale-workspace mutations retain their conflict response
- Invoice PDFs keep ordinary-sized line items together, avoid an unnecessary external stylesheet request, and omit document contents from failure logs
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
- Razorpay Payment Settings now copies the production webhook URLs with the required event names for faster dashboard setup

### Fixed

- Manual India handoff refresh now updates the payroll revision, approval status and totals and resets the previous confirmation.
- Purchase analytics and plan purchase alerts are no longer lost when queueing fails or a process dies after a subscription becomes paid. Run the migration and restart the Solid Queue dispatcher to load the new recovery job.

## 3.0.6 - 2026-10-23

### Security

- Upgrade Rails to 8.1.4, Ruby to 4.0.9, Node to 24.22.1 LTS, and Go to 1.26.10; refresh gems and web, docs, and mobile packages.
- Include Ruby's regexp compilation fixes related to GitLab CVE-2026-89078, CVE-2026-93577, CVE-2026-97229, and CVE-2026-110264.
- Upgrade Brakeman and enforce Ruby and all three JavaScript dependency audits in CI.
- Document two narrowly scoped CVE exceptions without published fixes, with a review deadline of 22 November 2026; remove the withdrawn sprintf-js exception.

### Fixed

- Preserve mobile asset loading and CommonJS compatibility with patched image-size and brace-expansion dependencies.

## 3.0.5 - 2026-09-17

### Added

- PayPal invoice payments: connect a PayPal REST app in Payment Settings, accept payments on public and client invoices, and reconcile captures through verified webhooks

### Fixed

- PayPal capture now serializes concurrent checkout returns, rejects stale balances before charging, and safely records already-completed captures for reconciliation
- PayPal connection setup now preserves working credentials through transient API failures and requires a verified webhook before checkout
- Payment settings now enforce CSRF protection, validate PayPal ownership with an immutable reference, and keep payment QR codes readable in dark mode

## 3.0.4 - 2026-09-09

### Fixed

- Malformed multipart uploads no longer crash the request; the reports PDF throttle stops parsing request bodies and `EncodingSanitizer` answers 400 for every `Rack::Multipart` error
- Unverified form posts now fail with 422 instead of a `NoMethodError`, because `ApplicationController` explicitly enables exception-based CSRF protection
- Unknown `bill_status` or `review_status` values from the API return 422 instead of raising
- Database backups retry transient R2 errors with backoff and close their upload file handles

## 3.0.3 - 2026-09-07

### Fixed

- Harvest imports now keep long client and project names distinct when their 30-character prefixes collide

## 3.0.2 - 2026-09-07

### Fixed

- Time-tracking now shows permitted edit and delete actions for PTO and holiday entries, with server-enforced weekly cutoffs for employees

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
