# Miru Time Tracking Roadmap

## Goal

Make Miru the fastest time tracker for service teams that also need invoicing, billing, and operations in the same product.

This is not a clone project.

It is a catch-up-and-surpass plan:

- match the speed features people expect from leading time trackers
- match the billing handoff people expect from service business tools
- use Miru's existing invoicing and operations surface to beat both of them in one workflow

## Product Thesis

The best dedicated trackers win on speed.

The best service-business tools win on making tracked time feel connected to revenue.

Miru should win on both:

- start tracking in one click
- fill a missing day or week in seconds
- review what is billable without hunting
- move tracked work into invoicing without cleanup

That is the whole game.

## Current Miru Position

Miru already has more foundation than the UI currently communicates:

- week and month views
- inline desktop timer
- manual entry form
- weekly bulk row editing
- duplicate last entry
- recent entry shortcuts
- copy last week flow
- invoices and billing in the same product
- AI-tool metadata support on CLI time entries
- mobile Expo scaffold with Today and Week preview directions

The weak spots are still obvious:

- the desktop page is still too split between timer, day, and week modes
- repeat work is faster than before, but still not one-motion fast
- day review is serviceable, not delightful
- invoice handoff still feels like a separate system
- manager workflows are still relatively thin

## What Strong Time Tracking Products Get Right

Based on common product patterns across mature tools:

- favorites and recent combinations
- timer-first capture
- day, week, and calendar switching
- reminders and manager visibility
- simple copy behavior for repeated work
- invoice generation from tracked time

## Capability Matrix

### Fast Capture

Leading products:

- timer on the main page
- fast manual entry
- recent or favorite client/project pairs
- resume or duplicate familiar work
- notes without modal churn

Miru now:

- inline desktop timer
- desktop entry form
- recent shortcuts
- duplicate last entry

Miru gap:

- favorites pinning
- one-click resume from existing entry rows
- tighter timer-to-entry bridge
- stronger day-first compact mode

### Weekly Speed

Leading products:

- copy recent rows
- copy last week patterns
- bulk week entry without feeling like spreadsheet punishment

Miru now:

- weekly rows
- copy last week
- week navigation

Miru gap:

- smarter week templates
- faster row creation
- keyboard-first duration flow
- cleaner all-week review

### Review And Visibility

Leading products:

- clear day total
- clear week total
- easier all-entries review
- approvals and reminders

Miru now:

- totals
- employee switch
- daily entry cards

Miru gap:

- all entries review mode
- missing-time visibility
- approvals
- reminder loop

### Billing Handoff

Leading products:

- obvious billable state
- invoice from tracked time
- less cleanup before draft invoice

Miru now:

- billable state exists
- invoices are already in product

Miru gap:

- review tracked time by client/project before invoicing
- invoice draft from selected entries
- cleaner service/task mapping into invoice lines

## Review Outcomes

### Product

- keep the scope selective
- optimize for the full daily workflow, not feature bingo
- frame Miru as the fastest path from tracked work to invoice

### Design

- keep the timer visible
- keep the selected day explicit
- keep shortcuts above the fold
- put day review before the heavier weekly editor

See [time-tracking-design-shotgun.md](/Users/sward/saeloun/miru-web/docs/time-tracking-design-shotgun.md) for the concrete layout variants and recommended desktop wireframe.

### Engineering

- build on the existing `TimeTracking` surface
- keep controllers thin
- add billing handoff logic in services/models, not the controller layer
- add smaller focused endpoints only when the current bootstrap payload becomes the bottleneck

### Main Risks

- duplicating state between timer, day list, and week rows
- over-fetching when switching days and employees
- making the page denser without making it faster
- shipping invoice handoff without a stable billable-selection model

## Phase Plan

## Phase 1, Fast Capture Parity

### Scope

- sticky inline timer
- recent shortcuts
- favorite shortcuts
- duplicate last entry
- resume timer from entry row
- stronger day summary and date clarity

### Success Criteria

- repeat entry in under 10 seconds
- timer start in one click
- resume familiar work without reselecting client and project

## Phase 2, Weekly Power-User Parity

### Scope

- copy last week rows
- copy selected row patterns
- faster row add flow
- keyboard-first duration editing
- compact all-week review drawer

### Success Criteria

- a full week can be filled without modal churn
- repeated client/project rows feel one-action, not seven-action

## Phase 3, Billing Parity

### Scope

- unbilled tracked time review by client and project
- select tracked time and generate invoice draft
- clear billed, unbilled, non-billable states
- map service/task to invoice line cleanly

### Success Criteria

- owner can go from tracked time to invoice draft in one intentional flow
- no spreadsheet cleanup before invoice generation

## Phase 4, Team Management Parity

### Scope

- reminders
- submit timesheet
- approve timesheet
- manager review queue
- overdue indicators

### Success Criteria

- admins can spot missing time quickly
- team members know what still needs submission

## Phase 5, Ecosystem And Migration

### Scope

- CSV import helper for external migrations
- task and issue deep links on entries
- MCP and desktop-capture aware entry metadata
- mobile Today and Week coverage

### Success Criteria

- migration into Miru is low-friction
- people can start time near where they work

## Immediate Next Build

The next batch should stay small and brutal:

1. favorites on top of recent shortcuts
2. resume timer from an existing entry row
3. all-entries review mode for the active week

That is enough to materially change how fast Miru feels without turning this into a rewrite.

## Non-Goals Right Now

- full desktop native app
- literal competitor clone
- approvals, reminders, browser extension, invoice bridge, and mobile parity all in one implementation batch

That would be scope cosplay.

## Release Framing

Frame this publicly as:

`Miru Time Tracking 3.1: faster capture, faster repeat work, faster billing`

Not:

`We made time tracking faster`

Users care about time saved, not feature bingo.
