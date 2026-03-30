# Web Time Tracker Spec

## Goal

The web timer should be the fastest way to capture live work on desktop without leaving the main time-tracking page.

It should feel trustworthy enough for daily use:

- start in one click
- stay visible while work is active
- survive reloads and route changes
- save cleanly into today&apos;s entries
- hand off naturally into week review and invoicing

## Scope

This spec covers the desktop web timer on `/time-tracking`.

It does not cover:

- mobile native timer behavior
- multi-device timer conflict resolution
- background browser notifications
- agent-ingested timer sessions

## Primary User Promise

If a user starts tracking work in the browser, Miru should not make them re-enter that work because of a refresh, a route change, or a small interruption.

## Entry Points

The timer must be reachable from:

- the empty desktop timer card on `/time-tracking`
- the inline active timer card on `/time-tracking`
- the resume action on an existing time entry row

## Required States

The timer must support these states:

1. Pristine
- no active timer
- no elapsed time
- no selected project
- primary CTA: `Start Timer`

2. Running
- elapsed clock updates every second
- primary actions: `Pause`, `Stop`, `Reset`
- selected project and description remain editable

3. Paused
- elapsed clock is frozen
- primary actions: `Resume`, `Stop`, `Reset`
- selected project and description remain editable

4. Save Confirmation
- shown only when elapsed time is greater than zero
- confirms project, duration, and description
- actions: `Discard`, `Save Entry`

## Persistence Rules

The timer state must persist in browser storage with:

- running state
- start timestamp
- elapsed time
- selected project
- project id
- client label
- description

The timer must restore correctly after:

- page reload on `/time-tracking`
- navigating away from `/time-tracking` and coming back in the same browser session
- resuming from an existing entry row

If stored timer data is corrupt, Miru should fall back to a clean timer instead of crashing.

## Save Rules

When the timer is saved:

- the work date is today
- duration is rounded down to whole minutes
- duration must be at least one minute
- project id is required
- bill status is derived from project billable state
- the saved entry appears in the time-tracking review surface without a full page break
- timer storage is cleared

## Review Surface Expectations

After save, the user should be able to verify the result immediately in the same flow:

- the saved note is visible
- the saved project is visible
- day total reflects the new duration
- week review includes the new entry

The broader time-tracking page must also continue to surface:

- regular time entries
- leave entries
- holiday entries
- week totals
- selected-day totals

## Page-Level Compatibility

The timer must not regress these surrounding flows:

- week view add-entry flow
- month view add-entry flow
- recent shortcuts
- duplicate last entry
- copy last week
- admin employee switcher
- leave and holiday review cards

## Locale And Translation Expectations

Time tracking behavior must remain correct when locale defaults change.

At minimum:

- the timer still loads after auth locale detection
- selected project and description still save correctly
- date selection still targets the correct work date
- locale-aware date format changes must not break timer save or restored entry review

## Launch QA Matrix

The timer is not launch-ready unless all of these pass:

1. Start, pause, resume, and reset work on desktop.
2. Timer survives reload on `/time-tracking`.
3. Timer survives navigating away and back.
4. Resume-from-entry starts a running timer with project and note prefilled.
5. Stop and save creates a real time entry for today.
6. Save result appears in the active review surface.
7. Week review still shows time, leave, and holiday rows.
8. No browser console errors on the core flow.
9. Focused system specs and `bin/vite build` are green.

## Verification Sources

The authoritative verification for this feature should come from:

- system specs in `spec/system/time_tracking`
- focused request specs for time-tracking payloads
- browser verification on the running app with screenshots or captures
