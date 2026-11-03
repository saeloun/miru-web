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

This verifies a local UI fix, not a deployment, provider integration or the whole
ATS feature. The separate company-lock review comment and develop conflict remain
open. These screenshots contain synthetic records and synthetic private links.
