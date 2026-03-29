# AGENTS.md

This file is the source of truth for AI assistant behavior in this repository. If guidance conflicts elsewhere, prefer this file.

Scope: entire repository.

## Critical Rules

1. Never fake results. Do not claim something works unless you actually verified it.
2. For UI changes, verify in a real browser on the running app.
3. For JavaScript or TypeScript changes, always run `mise exec -- timeout 30 bin/vite build` before handoff.
4. Use `mise exec --` for runtime-sensitive commands.
5. Never add AI or tool attribution to git commits.
6. Do not interact with external systems like GitHub comments without explicit user approval.
7. Keep changes minimal, focused, and aligned with existing repo patterns.
8. If a change is verified and there is no explicit reason to hold it back, commit and push it instead of letting the working tree drift.
9. Do not stop after a trivial sub-step when the user asked for a larger verified batch. Keep going until the batch is done, there is a real blocker, or the next action would be risky without user input.
10. Do not pause just to summarize progress when the requested implementation batch is still in flight. Execute the next obvious step immediately and only report once a real verification checkpoint or blocker exists.
11. Before pushing a new commit, cancel stale in-progress GitHub Actions runs for the current branch so CI does not pile up redundant runs.
12. When working on production or a live cutover, verify the exact target environment and dataset before making changes. Never assume Render, Fly, local, subset, and raw production are aligned.
13. Do not switch a live domain onto sanitized subset data. Before any domain cutover, confirm whether the target is using a raw production restore or a demo subset and state that explicitly.
14. If a restored database is missing schema expected by the current branch, fix the restore process by running branch migrations. Do not treat manual schema patching as the solution.
15. Reuse or close long-running shell processes. Do not let the workspace accumulate runaway exec sessions when a simpler fresh command or a reused session will do.

## Repo-Specific Workflow

- Use `apply_patch` for manual file edits.
- Prefer `rg` for search.
- Run focused specs for files you change.
- For browser-facing fixes, verify on the local app with Playwright or PinchTab.
- Do not claim a React or JS crash is fixed unless the affected page is loaded successfully in the browser and checked for errors.
- Commit verified changes promptly when asked.
- When a user gives a sequence like "finish A, then do B", complete A and immediately continue into B without waiting for another "continue" message.
- On SPA pages, prefer settled route checks over generic `networkidle` when the app is known to keep background requests alive.
- When touching a dirty tree, preserve unrelated verified work already in flight. Do not revert broad user-requested batches just to simplify your own change.
- If a user reports a live production bug, reproduce it on the real domain when practical before declaring the root cause.

## Local Development

- Primary local app URL: `http://127.0.0.1:3000`
- Development stack is normally run through Foreman with `Procfile.dev`.
- Preferred local test login when available:
  - `vipul@saeloun.com / password`

## Testing Expectations

- Run the smallest relevant test set first, then widen if needed.
- For frontend changes:
  - `mise exec -- timeout 30 bin/vite build`
- For Ruby changes:
  - run focused `rspec` files related to the touched code
- For authorization or role changes:
  - verify with real user flows in the browser when practical
- For production-facing changes:
  - verify the live health endpoint
  - verify the intended user flow in the browser on the real domain when possible
  - check Sentry for fresh unresolved issues after the change if the work touched a live incident or cutover path
- For list pages and report surfaces:
  - verify loaded counts, ordering, and continued loading behavior in the browser
  - do not assume an API sort change fixed the UI if the frontend can still re-sort or truncate the data
- For mailer changes:
  - run focused mailer specs
  - verify rendered previews in the browser for representative desktop and mobile widths

## Code Standards

- Follow existing Rails and React patterns in this repo.
- Do not add code comments unless explicitly asked.
- Keep controllers thin and move business logic to models/services where appropriate.
- Respect existing authorization patterns unless the task is to change them.

## Git

- Work on the current branch.
- Do not amend or rewrite history unless explicitly requested.
- Do not commit unrelated changes.
- Before committing, inspect `git status --short` so you know whether you are committing into a large verified batch or a narrow isolated fix.

## Compatibility

`CLAUDE.md` may exist for tool compatibility, but `AGENTS.md` remains the source of truth.

## Production And Deploy Discipline

- Render deploys from the branch image build, not from git tags alone. Do not assume creating a tag ships anything by itself.
- When syncing env vars from another environment into Render, treat `RAILS_MASTER_KEY` as branch-image specific. Do not blindly overwrite it just because other env vars should match.
- For raw production restores on Render:
  - restore the fresh production dump
  - run branch schema migrations
  - do not run `data:migrate` unless explicitly requested
  - do not run subset normalization
  - verify the target user can actually log in afterward
- For sanitized subset restores:
  - never present them as real production
  - if used for QA or screenshots, say so plainly
- For Active Storage and R2 work:
  - verify a sample of actual blob keys, not just config values
  - do not claim storage parity unless the files actually exist in the active bucket
- Before domain cutover:
  - verify custom-domain health
  - verify email/password login
  - verify Google OAuth callback configuration
  - verify mailer links and any host-based metadata if those were touched

## Browser QA Notes

- Use real credentials only when necessary and keep the scope narrow.
- If browser automation fails on third-party auth or mailbox access, state the blocker plainly instead of pretending the end-to-end flow passed.
- For production QA matrices, prefer one-user-per-flow verification over a single giant brittle browser script.
- Capture screenshots for meaningful verification checkpoints, not just for busywork.
