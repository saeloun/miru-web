# RTK

Use `rtk` first for shell commands in this repo when it keeps the command clear.

## Defaults

- For runtime-sensitive commands, prefer `rtk mise exec -- <command>`.
- For direct wrappers, prefer repo-safe forms like:
  - `rtk rg ...`
  - `rtk git ...`
  - `rtk rspec ...`
  - `rtk pnpm ...`

## Examples

- Frontend build:
  - `rtk mise exec -- timeout 30 bin/vite build`
- Focused RSpec:
  - `rtk proxy mise exec -- bundle exec rspec spec/path/to/file_spec.rb`
- Runtime version checks:
  - `rtk mise exec -- ruby -v`
  - `rtk mise exec -- node -v`

## Fallback

- If `rtk` obscures useful debugging output or blocks the task, fall back to the direct command and say so plainly.
