# Miru 3.0 Launch Readiness

## Goal

Miru 3.0 should launch when a real software agency can switch core billing operations without fear.

That means:

- sign in and onboard the team
- track time every day
- review and correct time entries
- generate invoices from tracked work
- collect payments
- trust that data, roles, and reports are stable

This is a launch checklist for switchability and trust, not raw feature parity.

## Launch Definition

Miru 3.0 is launch-ready when these statements are true:

- the core product works on the real production dataset
- the common migration path is understandable and low-friction
- production deploys are boring
- Sentry is quiet on core flows
- the product is good enough that a technical services team can adopt it without feeling reckless

## Core Launch Scorecard

Each area should be marked:

- `green`: ready
- `yellow`: acceptable with known limits
- `red`: launch blocker

### 1. Auth And Access

Must be true:

- email and password login works on `https://app.miru.so`
- logout works
- invited users can sign in
- role-based access is correct for owner, admin, employee, and client
- Google OAuth works if it is publicly exposed at launch

Blockers:

- login failures
- dashboard boot failures caused by auth/session issues
- role leakage across companies or users
- broken invite flows

### 2. Time Tracking

Must be true:

- users can add, edit, and delete time entries
- timer start, pause, stop, and save work
- old timesheet entries load without serialization errors
- PTO and holidays render correctly
- weekly review is usable
- core list ordering and selected-day behavior are stable
- CLI time tracking works for real user accounts

Blockers:

- missing or disappearing entries
- invalid entry flows on normal inputs
- broken timer save path
- inability to view historical entries
- PTO and holiday rows missing from the timesheet surface

### 3. Projects And Clients

Must be true:

- project and client lists load
- search works
- authorization scope is correct
- team members can log against the projects they should see

Blockers:

- empty or partial lists caused by bugs, not permissions
- wrong project scope
- create or update failures on normal inputs

### 4. Invoicing

Must be true:

- invoices list loads on production data
- ordering is correct
- search works
- recently updated section feels sane and readable
- invoice creation path works
- invoice actions work
- historical invoices remain accessible

Blockers:

- list truncation without recovery
- wrong ordering for normal business use
- invoice creation or send failures
- broken historical invoice views

### 5. Payments

Must be true:

- payments list loads
- pagination or infinite loading continues to work on large datasets
- payment details are visible
- Stripe-backed payment settings function on the intended launch path

Blockers:

- payments page fails on production data
- payment list silently truncates
- broken payment visibility for owners/admins

### 6. Dashboard

Must be true:

- dashboard loads without `500`
- summary cards are not obviously wrong because of backend failure
- YTD framing is coherent
- key widgets load on production data

Blockers:

- dashboard API `500`
- zeroed metrics caused by backend regressions
- JS crashes on the main dashboard route

### 7. Reports

Must be true:

- time, revenue, invoice, and aging reports load for the intended launch roles
- report filters behave consistently
- large datasets do not break the route

Blockers:

- report routes crash
- report data is obviously incomplete or mis-scoped

### 8. Imports, Exports, And Migration

Must be true:

- the main migration path is documented
- importers for the chosen launch incumbents work on representative data
- exported data is usable enough that customers do not feel trapped

Blockers:

- importer corrupts or silently drops core records
- migration instructions are incomplete or misleading

### 9. API And CLI

Must be true:

- API endpoints backing core flows are stable
- Miru CLI login works on hosted production
- `whoami`, `project list`, and time-entry workflows function for real accounts
- CLI auth/session behavior is understandable

Blockers:

- CLI cannot authenticate reliably
- create/delete cycle fails for valid user scope
- production API regressions on core endpoints

### 10. Deploy, Ops, And Recovery

Must be true:

- health endpoint is reliable
- production deploy from the correct branch is understood
- DB backups run on schedule
- restore process is documented and realistic
- Sentry triage is part of launch verification

Blockers:

- no recent verified backups
- deploy target ambiguity
- inability to restore production data safely

## Go And No-Go Rules

### Go

Launch if all of these are true:

- auth is `green`
- time tracking is `green`
- invoicing is `green`
- payments is at least `yellow`
- dashboard is at least `yellow`
- no `red` issue exists in the top seven categories
- production health is green
- recent production Sentry issues are triaged or resolved for core flows

### No-Go

Do not launch if any of these are true:

- login or invitation flow is unstable
- time entries can disappear, fail to save, or fail to load
- invoice list or invoice creation is unreliable
- production dashboard is returning `500`
- production data cannot be trusted after deploy
- importer path is misleading enough to create migration risk
- there is no recent verified backup and restore story

## Launch Freeze

During launch prep:

- stop adding broad new surfaces
- allow only:
  - blocker fixes
  - migration-path work
  - CLI and docs fixes
  - deploy and observability fixes

Do not expand scope into:

- mobile parity
- agent billing rollout
- crypto or Bitcoin payments
- broad ecosystem integrations
- cosmetic side quests outside core routes

## Daily Launch Loop

Run this every launch-prep day:

1. check `https://app.miru.so/health`
2. run the production launch matrix on the real domain
3. verify one real owner flow
4. verify one real admin or employee flow
5. verify invoicing and payments on production data
6. check Sentry for fresh unresolved core-flow issues
7. fix blockers before starting new feature work

## Recommended Verification Commands

Production health:

```bash
curl -s https://app.miru.so/health
```

Launch matrix:

```bash
mise exec -- ./bin/verify-launch-matrix
```

Production launch matrix:

```bash
LAUNCH_MATRIX_BASE_URL=https://app.miru.so mise exec -- ./bin/verify-launch-matrix
```

CLI hosted verification:

```bash
miru login --base-url https://app.miru.so --email user@example.com --password '...'
miru whoami
miru project list
miru time list --from 2026-03-01 --to 2026-03-31
```

## What Launch Is Not

Launch is not:

- copying every feature from every incumbent
- proving a broad future roadmap
- shipping every post-launch idea before trust is earned

Launch is:

- one stable, credible switching point for technical services teams

## Post-Launch Expansion

After launch stability is real, then expand into:

- agent-ledger billing
- mobile app wedge
- deeper importers
- richer reports
- workflow automation and ecosystem adapters

That order matters.
