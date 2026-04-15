# Production And Deploy Discipline

## Live Verification

- For production-facing changes, verify the live health endpoint.
- Verify the intended user flow in the browser on the real domain when possible.
- Check Sentry for fresh unresolved issues after changes that touched a live incident or cutover path.

## Render And Restores

- Render deploys from the branch image build, not from git tags alone.
- When syncing env vars from another environment into Render, treat `RAILS_MASTER_KEY` as branch-image specific.
- For raw production restores on Render:
  - restore the fresh production dump
  - run branch schema migrations
  - do not run `data:migrate` unless explicitly requested
  - do not run subset normalization
  - verify the target user can actually log in afterward
- For sanitized subset restores:
  - never present them as real production
  - say so plainly if they are used for QA or screenshots

## Storage And Cutovers

- For Active Storage and R2 work, verify a sample of real blob keys, not just config values.
- Before domain cutover:
  - verify custom-domain health
  - verify email/password login
  - verify Google OAuth callback configuration
  - verify mailer links and any touched host-based metadata

## SPA Deploy Safety

- Treat stale frontend assets as a first-class deploy risk for active sessions.
- Keep deploy-time recovery enabled for Vite preload and lazy-import chunk failures:
  - auto-reload once
  - fall back to a manual reload prompt if auto-reload already happened recently
- Do not map runtime chunk/preload failures to product 404 UI.
- For unexpected `401` responses right after deploy, verify session validity via `/api/v1/users/_me` once before forcing logout.
