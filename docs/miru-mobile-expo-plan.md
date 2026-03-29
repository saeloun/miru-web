# Miru Mobile with Expo

## Goal

Build a focused mobile app for the workflows that happen away from a laptop.

Miru web remains the primary surface for invoicing, billing, reports, and workspace administration.

Miru Mobile exists to make time capture fast, reliable, and pleasant on a phone.

## Product Thesis

The highest-frequency user action in Miru is not creating invoices. It is remembering work and logging time before that work disappears from memory.

That is a mobile problem.

The first mobile app should optimize for:

- starting and stopping a timer quickly
- adding time after the fact with low friction
- reviewing the current week
- switching client and project context without getting lost
- capturing work when offline and syncing later

It should not try to replace the entire web app.

## Non-Goals

The first release does not include:

- full invoice creation or editing
- full billing management
- full reports
- full client management
- full team administration
- a desktop-native app

Those remain on the web app until there is clear evidence a native surface materially improves them.

## Why Expo

Expo is the fastest credible path to iOS and Android for this product.

It gives us:

- one codebase for mobile
- good auth and deep-linking support
- push notifications
- camera and file access for later expense capture
- fast internal distribution for dogfooding

It does not force a rewrite of the Rails backend or the web frontend.

## Why Not Desktop Yet

Desktop is not the first problem to solve.

The current desktop web app already handles the admin-heavy workflows well enough.

If desktop demand appears later, the likely value is:

- menu bar timer
- global shortcut capture
- offline timer resilience

If that demand becomes real, a small desktop wrapper should be evaluated separately. It should not be bundled into the first mobile plan.

## User Segments

### Employee

Primary mobile user.

Jobs:

- start a timer in seconds
- log time after a meeting
- review this week
- correct the wrong day before submitting

### Admin or Owner

Secondary mobile user.

Jobs:

- quickly review time activity
- check invoice and payment summary
- approve small operational tasks away from laptop

### Client

Not in scope for v1.

## Release Framing

Working product name:

`Miru Mobile`

Positioning:

`Miru Anywhere`

Promise:

- capture work instantly
- stay accurate while moving
- leave admin and billing to desktop where they belong

## v1 Scope

### Must Have

- sign in
- workspace selection
- current timer state
- start timer
- stop timer
- manual time entry create
- manual time entry edit
- weekly timesheet view
- day selection that is impossible to misread
- project and client selection
- task or note entry
- offline draft queue for time entries
- sync retry on reconnect
- profile and logout

### Should Have

- push reminder to log time
- owner summary card for invoices and payments
- passkey-compatible auth fallback plan
- deep links from email into the app

### Nice to Have

- expense capture from camera
- widgets and shortcuts
- Apple Watch or wearables

## UX Principles

1. The current day and week must be unmistakable.
2. Starting a timer should take one or two taps.
3. Editing the wrong date should feel obvious and safe.
4. The app should feel native, not like a shrunk website.
5. Offline work should never look lost.

## Information Architecture

Primary tabs:

- Today
- Week
- Activity
- More

### Today

- active timer
- recent projects
- quick add entry
- resume recent timer

### Week

- current week strip
- daily totals
- entry list per day
- add and edit entry flows

### Activity

- recent synced actions
- pending offline items
- sync state

### More

- workspace switcher
- profile
- notification settings
- owner summary if role allows it

## Technical Approach

### Backend

Use the existing Rails app as the source of truth.

Add or harden APIs only where current endpoints are not mobile-safe or not mobile-focused.

Required mobile-ready surfaces:

- auth
- current user and workspace
- clients and projects
- timesheet entries
- timer state
- lightweight owner summary

### Mobile App

Create a new Expo app under:

`apps/mobile`

Suggested stack:

- Expo
- React Native
- Expo Router
- TanStack Query
- secure auth token storage
- small shared design token package later if needed

### Shared Code

Do not try to share presentational components between web and mobile.

Share only what has real leverage:

- API types
- validation rules where sensible
- formatting utilities only if portable

### Auth

Support the existing login model first.

Passkeys and complex browser-native flows should be treated as phase-two hardening unless current auth already works cleanly in a native-webview or token flow.

### Offline

v1 offline support should be narrow and reliable:

- queue new time entries
- queue edits to recent entries
- show pending state clearly
- replay in order on reconnect

Do not attempt fully offline invoices, billing, or broad data sync in the first release.

## Data Risks

The biggest mobile failure is silent mismatch between timer state, week selection, and synced entries.

The plan must explicitly handle:

- duplicate submission on reconnect
- timer stop on one device while another device is open
- week boundaries in user timezone
- stale project or client selections
- deleted or archived projects

## Release Plan

### Phase 0

Planning and hardening.

- define mobile API contract
- identify auth gaps
- identify timer-state source of truth
- define offline queue semantics
- confirm analytics events

### Phase 1

Internal dogfood beta.

- employee time tracking flows only
- iOS and Android internal builds
- real team usage for one or two weeks

### Phase 2

Public beta.

- push reminders
- owner summary
- deeper sync edge cases

### Phase 3

Evaluate expansion.

- expense capture
- invoice review
- desktop wrapper only if user demand proves it

## Success Metrics

The launch is successful if these move:

- share of time entries created on mobile
- timer starts per weekly active user
- reduction in late or backfilled entries
- weekly retention of mobile users
- sync failure rate

It is not successful just because installs are high.

## Kill Criteria

Stop expanding the app if:

- mobile usage stays shallow after dogfooding
- offline sync causes trust issues
- users still prefer mobile web for the same flow
- native maintenance cost exceeds the time-capture value

## CEO Review Verdict

Do not build full desktop and mobile parity.

Build the mobile wedge that wins on speed and reliability for time capture.

Keep the desktop web app as the control center.

## Engineering Review Verdict

The plan is good if scope stays narrow.

The biggest engineering risks are:

- auth complexity
- timer state consistency
- offline replay bugs
- trying to share too much UI with the web app

The app should start as a clean Expo app with minimal shared code and a strict API boundary.

## Design Review Verdict

The app should feel like a native time tool, not a port of the web navigation.

The design hierarchy must answer:

1. What day am I logging to?
2. Is my timer running?
3. Did this save or is it still pending?

The product should bias toward calm, focused mobile surfaces with obvious date context and explicit sync state.

## Recommended Next Step

Create the engineering execution plan for:

- Expo app scaffold
- auth contract
- timer and time-entry API contract
- offline queue model
- first three screens
