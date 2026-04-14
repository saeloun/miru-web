# Repo Workflow

## Git

- Work on the current branch.
- Do not amend or rewrite history unless explicitly requested.
- Do not commit unrelated changes.
- Before committing, inspect `git status --short` so you know whether you are committing into a large verified batch or a narrow isolated fix.

## GitHub

- When fixing a bug that has a GitHub issue, post a comment on the issue with the commit SHA, what was fixed, and how it was verified.
- Close the issue after verification.
- Do not interact with other external systems without explicit user approval.

## Runtime

- Reuse or close long-running shell processes.
- Do not let the workspace accumulate runaway exec sessions when a simpler fresh command or reused session will do.
