# Miru Time Tracking Parity Plan

## Goal

Make Miru time tracking competitive with Harvest and FreshBooks for agencies and small service teams.

This does not mean copying every screen. It means matching the workflows people actually depend on:

- start time instantly
- log time in bulk at the end of the day or week
- reuse the same project rows repeatedly
- review what was tracked without hunting
- move time into billing without cleanup work

## Current Miru Position

Miru already has a stronger base than it looks:

- week and month views
- manual entry form
- bulk weekly row editing
- desktop inline web timer
- mobile Expo scaffold
- invoice and billing system in the same product
- AI-tool metadata support on CLI time entries

What is still weak is speed and repeatability.

The current pain is not "Miru cannot track time."

The pain is:

- too many clicks to log common work
- weak reuse of yesterday and last week patterns
- timer is new, but the rest of the flow still behaves like manual data entry
- day review is less obvious than in Harvest or FreshBooks
- billing handoff is not yet tight enough

## What Harvest And FreshBooks Do Well

Based on current public product/help docs:

- Harvest leans into favorites, fast timer starts, day/week/calendar views, reminders, approvals, and continuously saved timesheets.
- FreshBooks leans into day/week/month entry, copy-the-last-timesheet behavior, timer persistence, team review, and invoice generation directly from tracked time.

Useful references:

- Harvest tracking time: https://support.getharvest.com/hc/en-us/articles/26871883335821-Tracking-time-in-Harvest
- Harvest tracking members: https://support.getharvest.com/hc/en-us/articles/360048181612-Members-Tracking-time
- Harvest reminders: https://support.getharvest.com/hc/en-us/articles/360058596112-Timesheet-reminders
- FreshBooks tracking time: https://support.freshbooks.com/hc/en-us/articles/225525527-How-do-I-track-my-time
- FreshBooks redesigned time tracking: https://www.freshbooks.com/hub/feature-news/redesigned-time-tracking-experience
- FreshBooks invoice from time tracking: https://support.freshbooks.com/hc/en-us/articles/227602308-How-do-I-generate-an-invoice

## Parity Matrix

### Fast Capture

Harvest / FreshBooks:

- timer on the main time page
- manual entry in day and week flows
- recent or favorite project combinations
- resume from an existing entry
- fast note entry

Miru now:

- inline desktop timer
- manual entry
- weekly row editing

Miru gap:

- recent combos
- resume and duplicate shortcuts
- true day-first compact flow

### Repetition And Weekly Speed

Harvest / FreshBooks:

- copy recent rows or timesheet structure
- duplicate familiar work without reselecting everything
- fast week navigation

Miru now:

- week selector
- weekly bulk rows

Miru gap:

- copy last week rows
- duplicate prior entry into selected day
- faster entry presets

### Review And Team Visibility

Harvest / FreshBooks:

- easy all-entries review
- team rollups
- visible day and week totals
- approvals and reminders

Miru now:

- totals exist
- admin employee switch exists

Miru gap:

- cleaner all-entries review
- reminders
- approval workflow polish

### Billing Handoff

Harvest / FreshBooks:

- tracked time converts cleanly into invoice lines
- billable vs non-billable is obvious
- review before invoicing is straightforward

Miru now:

- invoices and subscriptions already exist in-product
- billable status exists on entries

Miru gap:

- time-to-invoice bridge needs to feel intentional
- service/task-type to invoice mapping is still weak

## Recommendation

Do not chase literal parity feature-by-feature.

Build "best fast-path parity" first.

That means:

1. Match the speed features users feel every day.
2. Tighten billing handoff next.
3. Only then expand approvals, reminders, and integrations.

This is the right wedge because users judge time tracking in the first 20 seconds, not in the admin settings.

## Plan Review Verdict

### CEO Review

Selective expansion.

The 10-star product is not "Miru but with every Harvest menu item."

It is:

- the fastest way for a services team to capture work
- the cleanest path from tracked work to invoice
- one product instead of disconnected timer plus billing tools

### Engineering Review

Do not rewrite time tracking.

Use the existing `TimeTracking` surface as the control center and add missing primitives in small batches:

- presets and recent combinations
- row duplication
- week copy
- all-entries review mode
- billable review and invoice handoff

That keeps blast radius manageable and verification real.

## Phase Plan

## Phase 1: Fast Capture Parity

Ship this first.

### Features

- recent project/task shortcuts in the entry form
- duplicate last entry into the selected day
- resume timer from an existing entry
- compact day summary under the week selector
- sticky inline timer on desktop
- better date clarity:
  - active week label
  - selected save date
  - last week jump

### Success Criteria

- user can log a repeat entry in under 10 seconds
- user can start a timer from the main time page with one click
- user can reuse yesterday's work without reselecting client and project

## Phase 2: Weekly Power-User Parity

### Features

- copy rows from most recent week
- add multiple rows quickly
- keyboard-first duration entry
- editable recent rows without losing context
- compact all-week review drawer

### Success Criteria

- a user filling a whole week can do it without modal churn
- repeated client/project rows are one action, not seven

## Phase 3: Billing Parity

### Features

- review unbilled tracked time by project and client
- generate invoice draft from selected tracked time
- keep billable, billed, and non-billable status obvious
- task type or service mapping into invoice lines

### Success Criteria

- owner can move from tracked time to invoice draft in one flow
- no spreadsheet-style cleanup needed before invoicing

## Phase 4: Team Management Parity

### Features

- timesheet reminders
- submit and approve timesheets
- manager review queue
- overdue or missing-timesheet indicators

### Success Criteria

- admins can spot missing time without manual checking
- team members know what still needs submission

## Phase 5: Ecosystem Parity

### Features

- browser extension or MCP-aware desktop capture
- issue/task deep links on entries
- import and migration helpers from Harvest/FreshBooks CSV exports
- mobile parity for Today and Week capture flows

### Success Criteria

- teams can adopt Miru without losing existing capture habits
- time can be started where work happens, not only inside Miru

## Immediate Next Build

The next implementation batch should stay small and high-value:

1. Recent project shortcuts in the desktop entry form.
2. Duplicate last entry into selected day.
3. Copy rows from most recent week.

That is enough to materially change how fast Miru feels without turning this into a rewrite.

## Non-Goals Right Now

- full desktop native app
- literal Harvest clone
- literal FreshBooks clone
- approvals, reminders, browser extension, and invoice bridge all in one batch

That would be scope cosplay.

## Release Framing

This should be framed publicly as:

`Miru Time Tracking 3.1: faster capture, faster repeat work, faster billing`

Not:

`We added parity`

Users care about time saved, not feature bingo.
