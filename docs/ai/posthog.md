# Miru product analytics

Set `POSTHOG_HOST` to the HTTPS instance URL and `POSTHOG_PROJECT_TOKEN` to the
Miru project's public capture token on both web and worker processes. A personal
API key must never be used here. Missing either setting disables this integration.
The layout supplies the public settings at runtime; a frontend rebuild is not
needed to change projects.

The browser uses the official `posthog-js` SDK for SPA pageviews, masked
autocapture, web vitals, exceptions, session replay, heatmaps, surveys and
feature-flag evaluation. Enable replay, heatmaps, dead-click capture, web vitals,
exception capture and surveys in the project's settings. Product tours require
a published tour, and experiments require a flag and a defined goal. These
controls do not change Miru's plan permissions.

Use `https://app.miru.so` for both the project's app URL and recording domain.
The current receiver expects recording domains as full URLs; a bare hostname
silently disables replay in the public SDK configuration. Verify that replay
configuration is returned with Miru's Origin header and disabled for an unrelated
origin before enabling capture in production.

Publish the optional feedback widget only on the intended product routes. Keep
authentication, payroll, employee records, signing and hiring review pages out
of survey targeting. Paid Cloud-only features and separately configured AI or
messaging providers are not enabled by installing the browser SDK.

People use `miru:user:<id>` and the `company` group uses `miru:company:<id>`.
Names, emails and client/invoice content are excluded from backend capture.
Replay masks text, attributes and inputs, blocks documents and media, and stops
on authentication, profile, settings, team, payroll, employee, hiring and shared
invoice pages. Network bodies, headers and console recording are disabled. Event and
replay URLs lose query strings and fragments. Do Not Track is respected.
Heatmap URL keys and initial/previous-page pathnames are sanitized too. Visits to
different records still count separately while exported URLs use `:id` placeholders.

The official `posthog-rails` integration captures Rails and background-job
exceptions. Exception messages, source snippets, request parameters and absolute
source paths are removed; exception types and source locations remain useful for
grouping. Backend exceptions use the same authenticated user identity as the
browser, or the non-person `miru:backend` identity.

PostHog Logs receives structured controller, SQL-operation, Active Job and mailer
notifications through the official OpenTelemetry exporter. SDK batching and its
6,000-record per-minute cap bound forwarding. The log filter keeps operation
metadata and authenticated user/workspace IDs. SQL statements, job arguments,
request parameters, raw messages and arbitrary `Rails.logger` output are excluded.
Browser navigation also produces a `miru.page_view` structured log with a sanitized
URL and SDK session/person correlation. Console capture remains off.
Structured notifications use the SDK's debug threshold to include SQL operation
names; forwarding the Rails logger remains disabled. Web-vitals metrics retain
numeric values and discard attribution objects that can contain navigation URLs.

Test mode disables SDK network calls. Missing runtime settings also leave the
Rails SDK uninitialized. Both web and worker processes need the settings and a
restart when enabled.

An HTTPS configuration error names `POSTHOG_HOST`: correct the instance URL and
restart web and worker, or unset the setting to disable PostHog. For a capture
HTTP error, check collector health, the host and the public project capture token.
Delivery makes at most five attempts with the same UUID; inspect failed jobs after
those attempts. Response bodies and credentials are excluded from error messages.

Existing Rails product events supply workspace/client/project creation,
time entries, invoices, payments, invitations, expenses and imports. The existing
tracking service supplies signup attribution, trials and subscription conversion.
Delivery uses Active Job after commit, retries failures and reuses the job UUID
for deduplication. Only approved property keys reach the queue or PostHog.

Build a **Miru growth** dashboard with:

- Signup to activation: `user_signup` → `workspace_created` → `project_created`
  → `time_entry_created`.
- Sales: `trial_started` → `subscription_checkout_started` →
  `subscription_purchased`, broken down by signup UTM source and campaign.
- Invoicing: `invoice_created` → `invoice_sent` → `payment_recorded`.
- Weekly active users and retention from `time_entry_created`.
- Browser exceptions and replay links for the failing routes.

Subscription conversion events without a user belong to the company identity;
analyze the sales funnel by company rather than treating those as user events.
Financial payment events describe use of Miru's invoicing feature; they are not
Miru subscription revenue. No historical events are backfilled automatically.

## Self-hosting

Deploy and verify the receiver before enabling capture in Miru. PostHog's
current official hobby stack has about 47 services and a published requirement
of 16 GB RAM. A shared app host needs additional capacity for its existing apps.

Deploy the current official hobby stack with its proxy bound to a free loopback
port behind the existing TLS proxy, rather than taking ports 80/443. Remove the
upstream development port publications for databases and internal services.
Keep its volumes and secrets separate from the Rails apps and configure backups
before relying on it. Self-hosting has no PostHog support guarantee; some AI
features also need separately configured provider credentials.

References: [self-hosting](https://posthog.com/docs/self-host),
[capture API](https://posthog.com/docs/api/capture),
[replay privacy](https://posthog.com/docs/session-replay/privacy).

## Local checks

Use an isolated local database for the new job/subscriber specs and the existing
subscription purchase delivery specs. Run the required `timeout 30 bin/vite build`,
focused TypeScript checking, ESLint and RuboCop.

With a local app on port 3179 configured for the synthetic token `phc_synthetic`
and host `https://posthog.example.test`, run `node scripts/qa/posthog.test.mjs`.
It uses Brave, intercepts analytics locally, and checks signup rendering, URL
redaction, user/workspace identity, guest reset, disabled configuration and an
unavailable analytics server. It inspects recorder payloads for masked inputs and
text, stops replay on a sensitive SPA transition, and checks exclusion on actual
HR and payroll routes. These are local SDK checks, not proof that a
PostHog server ingested an event.
