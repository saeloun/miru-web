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

## Repo-Specific Workflow

- Use `apply_patch` for manual file edits.
- Prefer `rg` for search.
- Run focused specs for files you change.
- For browser-facing fixes, verify on the local app with Playwright or PinchTab.
- Do not claim a React or JS crash is fixed unless the affected page is loaded successfully in the browser and checked for errors.
- Commit verified changes promptly when asked.
- When a user gives a sequence like "finish A, then do B", complete A and immediately continue into B without waiting for another "continue" message.

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

## Code Standards

- Follow existing Rails and React patterns in this repo.
- Do not add code comments unless explicitly asked.
- Keep controllers thin and move business logic to models/services where appropriate.
- Respect existing authorization patterns unless the task is to change them.

## Git

- Work on the current branch.
- Do not amend or rewrite history unless explicitly requested.
- Do not commit unrelated changes.

## Compatibility

`CLAUDE.md` may exist for tool compatibility, but `AGENTS.md` remains the source of truth.
