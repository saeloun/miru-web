# Miru Mobile Execution Plan

## Objective

Ship a focused Expo app for iOS and Android that solves the highest-value mobile workflows without rewriting the web app.

This plan assumes the product direction in [miru-mobile-expo-plan.md](/Users/sward/saeloun/miru-web/docs/miru-mobile-expo-plan.md).

## What Already Exists

The good news is that Miru is not starting from zero.

Existing backend surfaces already cover most of the first wedge:

- session login and `me` in [sessions_controller.rb](/Users/sward/saeloun/miru-web/app/controllers/api/v1/users/sessions_controller.rb)
- workspace list and switching in [workspaces_controller.rb](/Users/sward/saeloun/miru-web/app/controllers/api/v1/workspaces_controller.rb)
- aggregated time tracking data in [time_tracking_controller.rb](/Users/sward/saeloun/miru-web/app/controllers/api/v1/time_tracking_controller.rb)
- CRUD for entries in [timesheet_entry_controller.rb](/Users/sward/saeloun/miru-web/app/controllers/api/v1/timesheet_entry_controller.rb)

This matters. It means v1 is mostly an app-shell and contract-hardening project, not a backend rewrite.

## Engineering Verdict

The plan is viable.

The trap is trying to make it clever too early.

The right architecture is:

- Rails remains the source of truth
- Expo app under `apps/mobile`
- minimal shared code
- explicit mobile API contract
- narrow offline queue only for time entries

The wrong architecture is:

- porting the existing web component tree
- building a massive shared UI package
- attempting full offline sync
- shipping desktop and mobile in the same motion

## Current Gaps

### 1. Mobile Auth Contract Is Not Explicit Yet

In [sessions_controller.rb](/Users/sward/saeloun/miru-web/app/controllers/api/v1/users/sessions_controller.rb), auth already branches for:

- default web
- `miru-desktop`
- `miru-cli`

That is useful, but there is no explicit `miru-mobile` flow yet.

Decision:

- add `app=miru-mobile`
- keep password login first
- treat passkeys and TOTP as phase-two hardening unless native support is clean

### 2. Timer State Needs a Single Source of Truth

Time tracking data is returned via [time_tracking_controller.rb](/Users/sward/saeloun/miru-web/app/controllers/api/v1/time_tracking_controller.rb), but the execution plan should not assume timer state is reliable enough for multi-device use without an explicit contract.

Decision:

- define one timer-state resource
- define one conflict rule
- define device reconciliation behavior before building UI

### 3. Time Entry APIs Need Mobile Semantics

[timesheet_entry_controller.rb](/Users/sward/saeloun/miru-web/app/controllers/api/v1/timesheet_entry_controller.rb) already supports CRUD, but mobile needs stricter guarantees around:

- duplicate retries
- archived project failures
- stale workspace switching
- timezone-safe work dates

Decision:

- harden response shapes
- document failure modes
- add idempotency strategy for offline replay

### 4. Aggregated Time Tracking Payload May Be Too Web-Shaped

[time_tracking_controller.rb](/Users/sward/saeloun/miru-web/app/controllers/api/v1/time_tracking_controller.rb) returns a broad bundle of clients, employees, entries, holidays, leave types, and projects.

That is fine for the web page.

It may be too heavy for the mobile startup path.

Decision:

- keep using it for initial beta if performance is acceptable
- if startup feels slow, split into lighter mobile endpoints:
  - bootstrap
  - week entries
  - project picker data

## Recommended Repo Shape

Start simple:

```text
apps/
  mobile/
    app/
    src/
      api/
      auth/
      features/
      storage/
      ui/
      utils/
```

Do not reorganize the existing web app now.

That is a separate project. Not this one.

## Proposed Mobile Stack

- Expo
- React Native
- Expo Router
- TanStack Query
- SecureStore for auth tokens
- AsyncStorage or SQLite-backed queue for offline pending entries
- Sentry for mobile crash reporting
- Expo Notifications for reminders

## Phase 0, Contract Hardening

This phase should happen before the first real mobile screen is polished.

### Auth

- support `app=miru-mobile`
- define login response shape
- define token persistence and logout semantics
- define unsupported flow behavior for passkeys and TOTP

### Workspace

- verify workspace list and switching contract
- verify current workspace is always present in `me`

### Time Tracking

- document `from` and `to` formats for mobile
- verify timezone handling for `work_date`
- verify `time_tracking#index` startup payload size on real prod-like data

### Timesheet Entries

- define create and update failure cases
- add idempotency key approach for offline replay
- decide whether create returns canonical server entry every time

### Owner Summary

- identify smallest invoice and payment summary payload needed for mobile
- avoid bringing desktop billing surfaces into the app

## Phase 1, Internal Beta Build

### Screen 1, Sign In

Must do:

- email and password
- loading and error states
- workspace-aware success path

Do not do:

- social login first
- passkeys first

### Screen 2, Today

Must do:

- running timer state
- start timer
- stop timer
- recent projects
- quick resume

### Screen 3, Week

Must do:

- unmistakable week label
- unmistakable selected day
- list of entries for selected day
- create and edit entry
- pending offline badge

### Screen 4, More

Must do:

- workspace switcher
- profile basics
- logout

Owner-only add-on:

- invoice and payment summary cards

## Offline Model

Keep this brutally narrow.

Queue only:

- create time entry
- update recent time entry

Do not queue:

- deletes in the first pass
- timer sessions across complex multi-device conflicts
- invoices, payments, or billing actions

Queue item fields:

- local id
- idempotency key
- workspace id
- action type
- payload
- created at
- retry count
- last error

Replay rules:

- ordered replay
- exponential backoff
- visible pending state
- visible failed state with retry

## API Work Items

### Required

1. Add `miru-mobile` auth branch.
2. Add or document token-auth `me` contract.
3. Validate workspace switch flow from mobile.
4. Validate entry create and update with explicit mobile date formats.
5. Add idempotency support for mobile entry writes if current contract is insufficient.

### Optional

1. Add a lightweight mobile bootstrap endpoint.
2. Add a lightweight owner summary endpoint.
3. Add a timer-state endpoint if current tracking payload is too broad.

## Test Plan

### Backend

- request specs for `miru-mobile` auth
- request specs for workspace switch
- request specs for time entry create and update with idempotency behavior
- request specs for date parsing and timezone edge cases

### Mobile

- Expo smoke on iOS and Android
- sign-in flow
- timer start and stop
- manual entry create
- offline create and replay
- workspace switch

### Dogfood

- internal team uses the app for one real work week
- measure sync failures
- collect cases where users still fall back to the website

## Build Order

Week 1:

- scaffold Expo app
- auth shell
- token storage
- workspace bootstrap

Week 2:

- Today screen
- Week screen read path
- entry create and edit

Week 3:

- offline queue
- retry states
- owner summary

Week 4:

- push reminders
- crash tracking
- internal beta polish

## Design Review Outcome

The design should not mirror the web sidebar and dense tables.

The app should feel like:

- a timer
- a weekly logbook
- a sync-aware notebook

The first three visual truths on every important screen should be:

1. what day this action affects
2. whether time is running
3. whether the action is safely saved

## Risks That Can Kill This

- auth complexity expands and blocks v1
- timer state behaves differently across devices
- offline replay duplicates entries
- startup payload is too slow on weak mobile networks
- scope creeps into invoices, billing, and reports

## Recommendation

Start with a four-screen employee app.

Get it into real hands fast.

If dogfooding shows strong usage, expand.

If not, keep Miru web as the main app and stop pretending every product needs native parity.
