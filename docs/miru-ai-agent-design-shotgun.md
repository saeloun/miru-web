# Miru AI Agent Design Shotgun

## Goal

Explore a few real UI directions for agent work inside Miru.

Not moodboards.

Not random pretty screens.

Real operating surfaces for:

- reviewing agent work
- approving or rejecting it
- moving approved work into invoices

## The Job To Be Done

An owner needs to answer four things fast:

1. what work just came in
2. which work is trustworthy
3. which work is billable
4. how to turn that into an invoice without doing admin twice

If the UI makes those steps feel like three products stitched together, it loses.

## Variant A, Mixed Feed Ledger

### Idea

Keep humans and agents in one time-tracking feed.

Agent entries look like enhanced time rows, not a separate product.

### Layout

- main feed stays the default surface
- each row shows:
  - actor
  - client and project
  - duration
  - note
  - review state
  - billing state
  - proof
- top filter bar:
  - `All`
  - `Humans`
  - `Agents`
  - `Pending Review`
  - `Approved`
  - `Ready to Invoice`

### Why It Wins

- least cognitive overhead
- easiest migration from current Miru
- makes agent work feel normal, not bolted on

### Risk

- mixed rows can get noisy if the metadata row is too loud
- owners may miss the review queue if nothing pulls attention to pending items

### Score

- clarity: `8/10`
- implementation risk: `8/10`
- speed: `9/10`

## Variant B, Review Inbox

### Idea

Time tracking stays as-is, but agent work gets a focused inbox.

Think of it like a moderation lane for billable machine labor.

### Layout

- left rail:
  - `Pending Review`
  - `Approved`
  - `Rejected`
  - `Ready to Invoice`
- center list:
  - agent rows
- right detail panel:
  - proof
  - run metadata
  - note
  - client and project
  - approve or reject

### Why It Wins

- strongest review focus
- easiest place to show proof and metadata without clutter
- good for teams with high agent volume

### Risk

- feels like a second product area
- weakens the “one ledger” story
- more UI surface to build before users feel value

### Score

- clarity: `9/10`
- implementation risk: `6/10`
- speed: `6/10`

## Variant C, Invoice Conveyor

### Idea

Start from money, not time.

Show approved agent work as a staging area that flows directly into invoice creation.

### Layout

- billing page gets an `Agent Work` lane
- grouped cards by client
- expand to see project, agent, duration, and proof
- checkbox selection feeds invoice draft builder

### Why It Wins

- very legible for owners who care mostly about billing
- strongest value story for Miru pricing

### Risk

- too late in the workflow
- weak for trust-building because review happens after the fact
- hides agent work from the main time-tracking habit loop

### Score

- clarity: `7/10`
- implementation risk: `7/10`
- speed: `7/10`

## Recommendation

Choose a hybrid:

- Variant A as the default operating surface
- one focused queue from Variant B for `Pending Review`
- invoice handoff from Variant C

That gives Miru one clear story:

- work appears in the ledger
- review happens in one focused queue
- approved work flows into invoice draft selection

That is the whole game.

## The Winning Screen Set

### Screen 1, Time Tracking Feed

Purpose:

- see mixed human and agent work in one ledger
- scan what is pending and what is ready

Keep:

- compact rows
- filter chips
- obvious actor badge
- obvious review state

### Screen 2, Pending Review Queue

Purpose:

- give owners a fast approval lane

Keep:

- only pending items by default
- quick approve and reject
- inline proof and run metadata

### Screen 3, Invoice Draft Builder

Purpose:

- convert approved agent work into invoice drafts

Keep:

- grouped selection by client and project
- visible totals before draft creation
- agent contribution visible but secondary to client billing context

## Visual Direction

### Hierarchy

- first line: actor + state
- second line: client / project + duration + date
- third line: note
- fourth line: provider, run, proof

### Tone

- serious and operational
- less “AI magic”
- more “auditable work record”

### Avoid

- giant provider logos
- glowing futuristic badges
- separate full-screen debug views
- walls of metadata

## Mobile Constraint

This should collapse into stacked cards cleanly.

If a design only works as a wide desktop table, it is wrong for the long-term product.

## What To Build First

1. mixed-feed row treatment for agent entries
2. `Pending Review` filter
3. approve and reject actions inline
4. approved-to-invoice handoff

Ship that before building a larger review console.
