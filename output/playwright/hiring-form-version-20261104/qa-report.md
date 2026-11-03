# Candidate form version refresh

Based on published ATS head `1593440809407bc59e00cdd92e3b281b1bc6c86e`.

The candidate form panel now observes the parent application's version, matching
the assignment panel. Saving a screening decision refreshes the form version
before a new private link is issued, without requiring a manual refresh.

## Verification

- Before the fix: the new desktop and mobile browser examples both failed;
  the form creation request returned HTTP 409 after screening was saved.
- After the fix: candidate form and screening browser specs passed together:
  **9 examples, 0 failures**, using real headless Brave, a dedicated synthetic
  PostgreSQL database and a network sandbox allowing localhost only.
- Covered screening-to-form creation at 1440px and 390px, genuine concurrent
  edits retaining HTTP conflict recovery, link replacement/revocation, exact
  resume download, delayed form responses and unsaved screening choices.
- Browser console/exception checks were empty; the two new viewport checks
  found no horizontal overflow. No email was delivered.
- Required Vite build and forced test-asset build completed successfully.
- Desktop/mobile screenshots were opened and inspected:
  [desktop](screening-to-form-1440.png), [mobile](screening-to-form-390.png).

## Develop integration

Merged current `origin/develop` locally, retaining hiring delivery recovery every
five minutes and purchase delivery recovery every ten minutes in both default
and production configuration. Added the missing hiring schedule assertion.

- Combined recovery specs: **92 examples, 0 failures** (schedule, purchase
  durability/queue integration, hiring receipt and acknowledgement recovery).
- Required Vite build and forced test build passed after integration.
- The same nine form/screening browser examples passed after integration.

## Overlapping responses

A fresh independent source review identified an error-clearing race. Holding a
successful screening response until form creation had failed reproduced the
disappearing conflict alert (**1 example, 1 failure**). Automatic version refresh
now waits for idle, successful state; errors require an explicit refresh. Stale
form versions disable mutations and dialog confirmation.

The final form/screening suite passed **10 examples, 0 failures** with empty
console/exception checks, including this controlled overlap and successful
manual recovery. The desktop/mobile screenshots were captured again on this
version. The suggested screening overwrite was checked against its separate
edit-version state; screening does not submit the parent's observed version.

This verifies local changes, not a deployment, provider integration or the whole
ATS feature. The separate company-lock review comment remains open. Screenshots
contain synthetic records and synthetic private links.
