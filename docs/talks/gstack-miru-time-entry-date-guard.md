# Gstack Talk Demo: Miru Time Entry Date Guard

## Demo Goal

Show the full gstack loop on a real product problem in Miru:

- start from user pain
- compare against a real product people already trust
- define a tiny feature with sharp scope
- review the plan with gstack
- implement
- QA in browser
- ship

This should feel like one tight product loop, not a vague AI coding demo.

## The Real User Problem

The bug is simple and relatable:

- a user was adding time for last week
- the UI was not clear enough about the active target date
- they accidentally added entries for this week instead

That is a good demo problem because it is:

- real
- visible
- easy to explain in 20 seconds
- small enough to finish live

## The Small Feature

Build a `Week Date Guard` for Miru time tracking.

The point is clarity, not a full spreadsheet rewrite.

### In Scope

- show the exact active week range at the top
  - example: `This week: 23 – 29 Mar 2026`
- show the exact selected save date near the entry form
  - example: `Saving to Fri, Mar 27, 2026`
- add quick jumps
  - `Today`
  - `This week`
  - `Last week`
- make the selected day visually obvious
- show a small saved state after entry save
  - example: `Saved just now`

### Out of Scope

- no full Harvest-style spreadsheet rebuild
- no timer redesign
- no database changes unless absolutely required
- no new permissions work
- no month-view rewrite

## Why This Is The Right Demo

This is the whole game:

- it is product work, not toy work
- it has obvious before and after screenshots
- it is small enough to review, implement, test, and deploy in one session
- it shows that gstack is about compressing the whole build loop, not just generating code

## Harvest Inspiration

I inspected Harvest at `https://saeloun.harvestapp.com/time/week`.

Artifacts:

- `output/playwright/harvest-time-week.png`
- `output/playwright/harvest-time-week-add-row.png`
- `output/playwright/harvest-time-week-grid.png`

### What Harvest Does Well

- the active period is impossible to miss
  - `This week: 23 – 29 Mar 2026`
- the view modes are obvious
  - `Day`, `Week`, `Calendar`
- the add-row flow is tiny
  - choose project/task, then save
- the grid makes each target day explicit
  - weekday plus date for every column
- save feedback is immediate
  - `Saved.`
  - `Last saved at 10:05am`
- the currently active day stands out visually

### What To Borrow

- strong week-range label
- strong selected-day visibility
- tiny saved-state confirmation
- one-click time navigation

### What Not To Borrow

- do not copy Harvest visually
- do not rebuild the full weekly spreadsheet
- do not turn Miru into a clone

Borrow the clarity, not the whole product.

## Likely Miru Files

These are the highest-signal files for the live implementation:

- `app/javascript/src/components/TimeTracking/index.tsx`
- `app/javascript/src/components/TimeTracking/Header.tsx`
- `app/javascript/src/components/TimeTracking/WeekDaySelector.tsx`
- `app/javascript/src/components/TimeTracking/EntryDetailsModal.tsx`
- `app/javascript/src/components/TimeTracking/EntryForm.tsx`
- `app/javascript/src/components/TimeTracking/ModernTimeEntryForm.tsx`

Useful context:

- `docs/time-tracking-modernization-gap-analysis.md`

## Acceptance Criteria

The demo is successful if:

1. a user can always see which week they are editing
2. a user can always see the exact date a new entry will save to
3. switching to last week is one click, not guesswork
4. after save, the page confirms what happened
5. the behavior works in real browser checks
6. dark and light mode both stay clean

## The Gstack Flow

This is the recommended live sequence.

### Step 1: Frame The Problem

Use gstack to turn the vague complaint into a sharp product problem.

Command:

```text
/office-hours
```

Prompt:

```text
Miru has a real time tracking UX problem. A user tried to add time for last week and accidentally logged time for this week because the active target date was not clear enough. I want a tiny feature that makes the active week and save date unmistakable, without rebuilding the full time tracking experience.
```

Expected output:

- clearer problem statement
- smallest useful wedge
- constraints

### Step 2: Write The Plan

Create a short plan file before coding.

Suggested plan sections:

- problem
- user impact
- in scope
- out of scope
- acceptance criteria
- verification plan

### Step 3: Engineering Review

Command:

```text
/plan-eng-review
```

Prompt:

```text
Review this plan for a small Miru time-tracking feature: strong week-range header, explicit selected save date, Today/This week/Last week shortcuts, and small saved-state feedback. Keep scope tight and prefer existing components.
```

Expected output:

- likely files
- edge cases
- risks
- test plan

### Step 4: Design Review

Command:

```text
/plan-design-review
```

Prompt:

```text
Review this Miru time-tracking plan. The goal is clearer week/date context, inspired by Harvest, without copying Harvest. Prefer clarity, low friction, and visual restraint.
```

Expected output:

- hierarchy suggestions
- spacing and emphasis advice
- what to avoid

### Step 5: Implement

Now code the smallest complete version.

Good demo discipline:

- one branch
- one feature
- one tight set of files
- frequent browser verification

### Step 6: QA

Command:

```text
/qa
```

Prompt:

```text
QA the Miru time-tracking week/date clarity update. Focus on switching between this week and last week, verifying the selected save date, and checking dark/light mode.
```

Expected output:

- any remaining bugs
- screenshots
- final health read

### Step 7: Review

Command:

```text
/review
```

Focus:

- date math mistakes
- timezone mistakes
- state mismatch between selected day and save target
- regressions in week/month switching

### Step 8: Ship

Command:

```text
/ship
```

Then after deploy:

```text
/canary
```

## Live Demo Script

### Opening

Say:

> We are not doing a fake AI todo app. This is a real Miru bug. A user tried to log time for last week and accidentally logged it for this week.

### Show The Reference

Show Harvest:

- week range is obvious
- active date is obvious
- entry flow is calm

Then say:

> We do not need all of Harvest. We need the one thing that stops the mistake.

### Show The Plan

Say:

> We are adding a Week Date Guard. Nothing more.

Then show:

- exact week label
- exact save date
- quick week jumps
- saved state

### Build

Show the gstack review flow quickly:

- office-hours
- eng review
- design review

Then implement.

### Verify

Show:

- local browser before/after
- employee flow
- last week selection
- saved confirmation

### Close

Say:

> The leverage is not that AI writes code. The leverage is that the whole loop gets compressed: problem, plan, critique, implementation, QA, and ship.

## Demo Timing

If you have 10 minutes:

- 1 min problem
- 1 min Harvest inspiration
- 2 min gstack planning/review
- 3 min implementation walkthrough
- 2 min QA/browser verification
- 1 min wrap-up

If you have 20 minutes:

- do the same flow slower
- include one bug found during QA and fix it live

## Recommended Next Step

Use this exact feature for the talk.

It is small, real, visible, and strong enough to show what gstack is actually for.
