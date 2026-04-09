# Miru CLI

## Overview

Miru CLI is the command-line interface for Miru.

It is intended to work equally well for:

- humans working in a terminal
- shell scripts and automation
- AI agents acting on behalf of a user

The CLI does not have a separate permission model. Every command runs with the same access and scoping rules as the authenticated Miru user.

## Install

### Hosted or public install

```bash
curl -fsSL https://raw.githubusercontent.com/saeloun/miru-web/main/tools/miru-cli/install.sh | bash
```

This installs `miru` into `~/.local/bin/miru` using `mise` and Go `1.24.1`.

### Local development install

From the repo:

```bash
cd tools/miru-cli
mise exec -- env GOBIN="$HOME/.local/bin" go install ./cmd/miru
```

## Requirements

- `mise`
- a Miru user account
- access to a Miru instance, hosted or self-hosted

## Authentication

Log in with email and password:

```bash
miru login --email user@example.com --password your-password
```

By default this uses:

```text
https://app.miru.so
```

For local or self-hosted Miru:

```bash
miru login --base-url http://127.0.0.1:9000 --email user@example.com --password your-password
miru config set-base-url --url http://127.0.0.1:9000
```

### Session behavior

- The CLI stores its session in `~/.config/miru/config.json`
- The token is a dedicated CLI bearer token, not the user’s main app token
- The session lasts 7 days
- Every successful CLI request refreshes the expiry for another 7 days
- `miru logout` revokes the server-side CLI session and removes local credentials

## Config

The local config file lives at:

```text
~/.config/miru/config.json
```

Current shape:

```json
{
  "base_url": "https://app.miru.so",
  "token": "..."
}
```

### Config commands

Show current config:

```bash
miru config show
```

Set a different Miru instance:

```bash
miru config set-base-url --url http://127.0.0.1:9000
```

## Command Reference

### Global

#### `miru help`

Shows the available command surface.

#### `miru version`

Prints the installed CLI version.

#### `miru capabilities`

Shows the current supported command set as JSON.

#### `miru whoami`

Fetches the current authenticated user and workspace.

#### `miru logout`

Revokes the CLI session and removes local credentials.

#### `miru upgrade`

Upgrades the CLI.

Behavior:

- when run from a local Miru checkout, it upgrades from that checked-out repo
- otherwise it upgrades from `github.com/saeloun/miru-web/tools/miru-cli/cmd/miru@main`

## Project Commands

### `miru project list`

Lists projects visible to the authenticated user.

Options:

- `--search <term>` filters projects by search term

Examples:

```bash
miru project list
miru project list --search solar
```

Use this command to find the `project_id` required by `miru time create` and `miru time update`.

## Client Commands

### `miru client list`

Lists clients visible to the authenticated user.

Options:

- `--query <term>` optional search term

Examples:

```bash
miru client list
miru client list --query solar
```

## Expense Commands

### `miru expense list`

Lists expenses visible to the authenticated user.

The response also includes `vendors` and `categories`, which provide the ids needed for `miru expense create`.

Options:

- `--query <term>` optional search term

Examples:

```bash
miru expense list
miru expense list --query travel
```

### `miru expense create`

Creates an expense in the current workspace.

Options:

- `--amount <amount>` required
- `--date <YYYY-MM-DD>` required
- `--category-id <id>` required
- `--vendor-id <id>` optional
- `--description <text>` optional
- `--type <business|personal>` optional, defaults to `business`

Examples:

```bash
miru expense create --amount 42.25 --date 2026-03-09 --category-id 3 --description "Lunch with client"
miru expense create --amount 125.50 --date 2026-03-09 --category-id 3 --vendor-id 2 --type business
```

## Time Commands

### `miru time list`

Lists the authenticated user’s timesheet entries for a date range.

Options:

- `--from <YYYY-MM-DD>`
- `--to <YYYY-MM-DD>`

Example:

```bash
miru time list --from 2026-03-01 --to 2026-03-09
```

### `miru time create`

Creates a timesheet entry for the authenticated user.

Options:

- `--project-id <id>` required
- `--duration <minutes>` required
- `--date <YYYY-MM-DD>` required
- `--note <text>` optional
- `--bill-status <status>` optional, defaults to `unbilled`

Example:

```bash
miru time create \
  --project-id 2 \
  --duration 90 \
  --date 2026-03-09 \
  --note "Worked on invoice flow" \
  --bill-status unbilled
```

Example prompt for daily Jira-to-Miru drafting:

```text
Pull all work I did in Jira today, summarize it hour by hour when the issue history supports that, or collapse it into one full-day summary when it does not. Use `miru project list` to find the best matching Miru project, then draft the exact `miru time create` commands I should run. Do not submit anything until I approve the draft.
```

If you want the agent to submit after review, use:

```text
Pull all work I did in Jira today, summarize it hour by hour when the issue history supports that, or collapse it into one full-day summary when it does not. Match each block to the best Miru project, show me the draft first, and only after I approve it run the `miru time create` commands.
```

### `miru time update`

Updates one of the authenticated user’s own timesheet entries.

Options:

- `--id <id>` required
- `--project-id <id>` required
- `--duration <minutes>` required
- `--date <YYYY-MM-DD>` required
- `--note <text>` optional
- `--bill-status <status>` optional, defaults to `unbilled`

Example:

```bash
miru time update \
  --id 631 \
  --project-id 2 \
  --duration 45 \
  --date 2026-03-09 \
  --note "Adjusted after review"
```

### `miru time delete`

Deletes one of the authenticated user’s own timesheet entries.

Options:

- `--id <id>` required

Example:

```bash
miru time delete --id 631
```

## Invoice Commands

### `miru invoice list`

Lists invoices visible to the authenticated user.

Options:

- `--query <term>` search term
- `--page <page>` pagination page
- `--per <count>` page size
- `--status <status>` invoice status filter

Examples:

```bash
miru invoice list
miru invoice list --status draft
miru invoice list --query INV0001 --page 1 --per 20
```

### `miru invoice show`

Shows one invoice in detail.

Options:

- `--id <id>` required

Example:

```bash
miru invoice show --id 1
```

### `miru invoice send`

Sends an invoice email.

Options:

- `--id <id>` required
- `--recipients <email1,email2>` required, comma-separated
- `--subject <text>` optional
- `--message <text>` optional

Example:

```bash
miru invoice send \
  --id 1 \
  --recipients client@example.com,finance@example.com \
  --subject "Your invoice from Miru" \
  --message "Please review and pay online."
```

## Payment Commands

### `miru payment list`

Lists payments visible to the authenticated user.

Options:

- `--query <term>` optional search term

Examples:

```bash
miru payment list
miru payment list --query INV0003
```

### `miru payment show`

Shows one payment.

Options:

- `--id <id>` required

Example:

```bash
miru payment show --id 1
```

## Common Workflows

### Check current identity

```bash
miru whoami
```

### Find a project id, then create time

```bash
miru project list --search solar
miru time create --project-id 2 --duration 30 --date 2026-03-09 --note "CLI entry"
```

### Correct a time entry

```bash
miru time list --from 2026-03-09 --to 2026-03-09
miru time update --id 631 --project-id 2 --duration 45 --date 2026-03-09 --note "Adjusted entry"
```

### Send an invoice

```bash
miru invoice list --status draft
miru invoice send --id 1 --recipients client@example.com
```

## Security and Scoping

- CLI requests use a dedicated bearer token
- the CLI session is tied to a user and workspace
- all normal authentication and authorization remain in force
- `client list` respects the authenticated user's normal client visibility
- `expense list` and `expense create` stay restricted to roles already permitted by the app
- `project list`, `invoice list/show/send`, and `payment list/show` all use the same app permissions as the web UI
- `time create` is scoped through `ProjectPolicy::Scope`
- `time update` and `time delete` are scoped to the authenticated user’s own entries in the current workspace
- the CLI cannot impersonate another user when creating time

## API Mapping

- `miru login` -> `POST /api/v1/users/login`
- `miru logout` -> `DELETE /api/v1/cli/session`
- `miru whoami` -> `GET /api/v1/users/_me`
- `miru capabilities` -> `GET /api/v1/cli/capabilities`
- `miru client list` -> `GET /api/v1/cli/clients`
- `miru project list` -> `GET /api/v1/projects`
- `miru expense list` -> `GET /api/v1/cli/expenses`
- `miru expense create` -> `POST /api/v1/cli/expenses`
- `miru invoice list` -> `GET /api/v1/invoices`
- `miru invoice show` -> `GET /api/v1/invoices/:id`
- `miru invoice send` -> `POST /api/v1/invoices/:id/send_invoice`
- `miru payment list` -> `GET /api/v1/payments`
- `miru payment show` -> `GET /api/v1/payments/:id`
- `miru time list` -> `GET /api/v1/timesheet_entry`
- `miru time create` -> `POST /api/v1/cli/timesheet_entries`
- `miru time update` -> `PATCH /api/v1/cli/timesheet_entries/:id`
- `miru time delete` -> `DELETE /api/v1/cli/timesheet_entries/:id`

## Troubleshooting

### `missing CLI credentials: run miru login`

Log in again:

```bash
miru login --email user@example.com --password your-password
```

### Wrong server

Point the CLI at the correct Miru instance:

```bash
miru config set-base-url --url http://127.0.0.1:9000
```

### Need the project id for time entry commands

Use:

```bash
miru project list
miru project list --search <term>
```

### CLI session expired

Run:

```bash
miru login --email user@example.com --password your-password
```

### Upgrade the CLI

Run:

```bash
miru upgrade
```

## Current Scope

Version `0.1.0` currently supports:

- client listing
- expense list/create
- authentication and config management
- project listing
- time list/create/update/delete
- invoice list/show/send
- payment list/show

Planned next:

- client list
- expense create/list
- invoice draft creation
