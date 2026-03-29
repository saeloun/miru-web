# Miru Time Tracking Design Shotgun

## Goal

Explore three real UI directions for Miru time tracking before another large implementation batch.

This is not three random mockups.

These are three product bets:

- timer-first
- week-first
- day-first

## Variant A, Timer Cockpit

### First Viewport

- week header and totals
- sticky inline timer card
- favorite and recent shortcuts
- selected day summary

### Layout

```text
[ week controls ] [ total ]

[ timer ]
[ favorites ] [ recents ]

[ selected day summary ]
[ day entries ]

[ weekly rows ]
```

### Best For

- agencies actively tracking throughout the day
- people who bounce between timer and notes

### Strength

Feels like Miru has an operating system, not just a form.

### Risk

Week editing becomes secondary unless the lower section is still strong.

## Variant B, Week Grid Pro

### First Viewport

- week header
- compact timer
- dense weekly row table

### Layout

```text
[ week controls ] [ timer ] [ total ]

[ weekly rows table ]
[ selected day drawer ]
```

### Best For

- consultants who fill timesheets in batches
- power users already comfortable with dense time-entry layouts

### Strength

Fastest for retrospective bulk entry.

### Risk

Looks powerful, feels heavier, and can scare casual users.

## Variant C, Day Stack

### First Viewport

- week header
- selected day with exact save target
- recent shortcuts
- day entries

### Layout

```text
[ week controls ] [ total ]

[ saving to Tue, Mar 31 ]
[ shortcuts ]
[ day entries ]

[ timer ]
[ weekly rows ]
```

### Best For

- people fixing yesterday or today
- teams adopting Miru from simpler tools

### Strength

Easiest to understand immediately.

### Risk

The power-user weekly story can feel buried.

## Recommendation

Choose a hybrid:

- Variant A shell
- Variant C content hierarchy

That means:

- timer stays visible and important
- selected day stays explicit
- shortcuts sit above the fold
- day entries come before the heavy weekly editor

## Concrete Desktop Wireframe

```text
[ Today ] [ Last week ]     [ Mar 31 - Apr 6, 2026 ]     [ Total 32:40 ]

[ timer | project | note | start/pause/stop ]

[ favorites ] [ recent shortcuts ] [ duplicate last ]

[ Saving to Wed, Apr 2 ]
[ Day total 5:30 ] [ 3 entries ]
[ entry stack ]

[ Weekly rows ]
```

## Concrete Mobile Wireframe

```text
[ timer ]
[ Today total ]
[ shortcuts ]
[ today's entries ]
[ week strip ]
```

## What To Build First

1. Favorites layer above recents.
2. Resume timer from an existing row.
3. All-entries review mode for the current week.

If those three land well, the rest of the parity roadmap gets easier.
