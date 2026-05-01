# AGENTS.md

This file is the source of truth for AI assistant behavior in this repository. If guidance conflicts elsewhere, prefer this file.

Scope: entire repository.

Keep this file short. Treat it as a router for repo-specific rules.

## Core Repo Rules

1. Never fake results. Do not claim something works unless you actually verified it.
2. For UI changes, verify in a real browser on the running app.
3. For JavaScript or TypeScript changes, always run `rtk mise exec -- timeout 30 bin/vite build` before handoff.
4. For runtime-sensitive commands in this repo, prefer `rtk mise exec -- <command>`. If `rtk` blocks the task, fall back and say so plainly.
5. Use `apply_patch` for manual file edits.
6. Run focused specs for files you change before widening scope.
7. For browser-facing fixes, verify on the local app with Playwright or PinchTab.
8. Do not claim a React or JS crash is fixed unless the affected page loads successfully in the browser and is checked for console errors.
9. If a change is verified and there is no explicit reason to hold it back, commit and push it when asked instead of letting the tree drift.
10. Preserve unrelated work in a dirty tree. Do not revert user changes just to simplify your own task.
11. When the user asks for a larger batch, keep going until the batch is done, blocked, or risky without input.
12. When resolving GitHub issues and posting resolution comments (with user approval), include verification images/screenshots as evidence.
13. Before merging any PR, inspect CodeRabbit review feedback and fix every actionable item. Do not merge with unresolved CodeRabbit feedback unless the user explicitly approves deferring a specific item.

## Repo Workflow

- When a user gives a sequence like "finish A, then do B", complete A and continue into B without waiting.
- On SPA pages, prefer settled route checks over generic `networkidle` when background requests stay alive.
- If a user reports a live production bug, reproduce it on the real domain when practical before declaring root cause.

## Local Development

- Primary local app URL: `http://127.0.0.1:3000`
- Development stack is normally run through Foreman with `Procfile.dev`.
- Preferred local test login when available:
  - `vipul@saeloun.com / password`
- For live production verification, local env vars use official Saeloun workspace users, not demo-workspace credentials.

## Load On Demand

- Repo testing rules: `docs/ai/testing.md`
- Production and deploy discipline: `docs/ai/production.md`
- Repo delivery and GitHub workflow rules: `docs/ai/workflow.md`
- Repo RTK usage patterns: `RTK.md`
- Design system source of truth for UI decisions: `DESIGN.md`
- QMD retrieval playbook for Codex + gstack: `docs/ai/qmd-codex-gstack.md`

## Notes

- Follow existing Rails and React patterns in this repo.
- Keep controllers thin and move business logic to models or services where appropriate.
- Respect existing authorization patterns unless the task is to change them.
- Prefer Faker-backed values in factories unless a spec needs a fixed literal.
- Workspace analytics lives under `app/services/analytics`. `Analytics::RevenueForecastService` forecasts collected revenue from successful payments; `AnalyticsReport` stores saved report metadata in `filters` JSONB with `created_by_id`; expense analytics can group by optional `expenses.project_id`.
- If the shell does not have Ruby/Node on PATH, bootstrap repo runtime with local `mise` and run commands as `~/.local/bin/mise exec -- <command>`. Local Postgres in this workspace is reachable at `127.0.0.1:5432` with `postgres/postgres` for development and test tasks.
- `CLAUDE.md` may exist for tool compatibility, but `AGENTS.md` remains the source of truth.
