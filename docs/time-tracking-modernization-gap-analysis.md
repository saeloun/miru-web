# Time Tracking Modernization Gap Analysis

## Scope
This document covers the active `/time-tracking` flow and compares it to modern expectations from Harvest-style time tracking tools.

## What Was Fixed In This Iteration
- Fixed a runtime crash in `TimeTracking` view switching caused by missing `Button` import.
- Fixed billability mapping in entry creation/editing:
  - billable project -> `unbilled`
  - non-billable project -> `non_billable`
- Fixed week/day/month consistency by normalizing date keys (`YYYY-MM-DD` vs formatted dates).
- Fixed weekly total calculation so it reflects real entries instead of showing `00:00` due to key mismatch.
- Added resilient date parsing in `TimeEntriesDisplay` for multiple company date formats.
- Added always-visible day/week/month toggles and active view state markers.
- Enabled timer discoverability by adding a visible `Start Timer` launcher in `FloatingTimer`.
- Integrated `FloatingTimer` into the active legacy `TimeTracking` route and wired post-save refresh.
- Improved weekday selector reliability for weekend/today detection across date formats.

## Validation Completed
- `mise exec -- timeout 30 bin/vite build` passes after each JS/TS change.
- `spec/system/time_tracking/add_entry_spec.rb` passes:
  - add entry in week view
  - cross-view visibility (week/day/month)
  - add entry from month flow

## Harvest-Style Parity Review

### P0 (Critical Functionality Gaps)
- Timer-to-entry linkage is still weak:
  - timer exists and can now start, but the main page does not yet present a unified quick start/stop/save experience in the same interaction model as add-entry.
- Entry flow fragmentation:
  - two overlapping entry patterns exist (`EntryForm` inline and `ModernTimeEntryForm` modal), increasing behavior drift and UX inconsistency.
- Missing explicit optimistic feedback around save/edit/delete:
  - user feedback relies on render updates and toasts; no strong inline status for pending or failed row-level actions.

### P1 (Major UX/Product Gaps)
- No clear “recent projects/tasks” quick-add path:
  - Harvest-style speed depends on fast repetition of recent client-project-task combinations.
- No strong keyboard-first entry path:
  - limited support for rapid entry via keyboard-only workflows.
- Period context is basic:
  - totals are present, but there is no stronger breakdown view (billable vs non-billable, daily burn overview, etc.) in the active screen.

### P2 (Quality and Consistency Gaps)
- Time tracking architecture duplication:
  - `TimeTracking/*` and `TimesheetEntries/*` overlap significantly, increasing maintenance risk.
- System specs around time tracking are inconsistent/outdated in places:
  - some specs fail due setup/auth/test-data issues and do not consistently validate current UI behavior.

### P3 (Nice-to-Have)
- Micro-interactions can be further refined (shortcut hints, smoother state transitions, smarter empty states).
- Better mobile parity for timer + quick-add workflow.

## Recommended Execution Plan
1. Unify on one entry UX (keep one primary form path and one timer path).
2. Add recent-project/task quick-add chips to reduce clicks.
3. Add robust row-level loading/error feedback for save/edit/delete.
4. Normalize and stabilize time-tracking system specs around current UI behavior.
5. Consolidate duplicate time-tracking component stacks to reduce regressions.
