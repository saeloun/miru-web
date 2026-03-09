# Miru CLI

Miru CLI is the command-line interface for Miru.

It works for:

- humans in a terminal
- shell scripts
- AI agents acting as a user

Full documentation lives in [docs/miru-cli.md](/Users/sward/saeloun/miru-web/docs/miru-cli.md).

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/saeloun/miru-web/main/tools/miru-cli/install.sh | bash
```

For local development:

```bash
cd tools/miru-cli
mise exec -- env GOBIN="$HOME/.local/bin" go install ./cmd/miru
```

## Quick Start

Hosted Miru:

```bash
miru login --email user@example.com --password your-password
```

Local or self-hosted Miru:

```bash
miru login --base-url http://127.0.0.1:9000 --email user@example.com --password your-password
```

Find a project id, then create time:

```bash
miru project list --search solar
miru time create --project-id 2 --duration 30 --date 2026-03-09 --note "CLI entry"
```

## Commands

```bash
miru help
miru version
miru upgrade
miru login --email <email> --password <password>
miru login --base-url <url> --email <email> --password <password>
miru logout
miru whoami
miru config show
miru config set-base-url --url <url>
miru capabilities
miru client list [--query <term>]
miru project list [--search <term>]
miru expense list [--query <term>]
miru expense create --amount <amount> --date <YYYY-MM-DD> --category-id <id> [--vendor-id <id>] [--description <text>] [--type <business|personal>]
miru invoice list [--query <term>] [--page <page>] [--per <count>] [--status <status>]
miru invoice show --id <id>
miru invoice send --id <id> --recipients <email1,email2> [--subject <text>] [--message <text>]
miru payment list [--query <term>]
miru payment show --id <id>
miru time list --from <YYYY-MM-DD> --to <YYYY-MM-DD>
miru time create --project-id <id> --duration <minutes> --date <YYYY-MM-DD> [--note <text>] [--bill-status <status>]
miru time update --id <id> --project-id <id> --duration <minutes> --date <YYYY-MM-DD> [--note <text>] [--bill-status <status>]
miru time delete --id <id>
```

## Session Behavior

- credentials live in `~/.config/miru/config.json`
- the CLI uses a dedicated server-issued CLI token
- sessions last 7 days
- each successful request refreshes the session for another 7 days

## Current Scope

Version `0.1.0` supports:

- client listing
- expense list/create
- project listing
- time list/create/update/delete
- invoice list/show/send
- payment list/show
