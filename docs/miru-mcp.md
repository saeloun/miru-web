---
title: Miru MCP Server and Client
description: Setup and usage guide for Miru MCP over HTTP and stdio, including Pro gating, security, tool coverage, and distribution.
sidebar_position: 6
---

# Miru MCP Server and Client

Miru ships an MCP implementation built on the Ruby SDK (`mcp` gem, `~> 0.13.0`) with both server and client integration points inside this repository.

## What Ships In This Repo

- HTTP MCP endpoint: `POST/GET/DELETE /mcp`
- MCP stdio server entrypoint: `bin/miru-mcp`
- Ruby client wrapper: `app/services/mcp/miru/client.rb` (`MCP::Miru::Client`)
- Tool catalog + namespaced tools: `app/mcp/**`

All tools are namespaced under `miru.*`.

## SDK Version Policy

- Current SDK pin: `mcp ~> 0.13.0` (Ruby SDK)
- Supported range in this repo: `0.13.x`
- Why pinned:
  - we avoid unnecessary package churn and keep server/client behavior stable for shipped tool schemas
  - we do not publish a separate `miru-mcp` gem today; compatibility is enforced in-repo
- On SDK upgrades, run:
  - focused MCP specs
  - `bundle exec bundler-audit check --update`
  - CI compatibility job for MCP-focused specs
- Upgrade checklist:
  - bump `Gemfile` and `Gemfile.lock`
    - `gem "mcp", "~> 0.13.0"` (or next approved target)
  - run focused MCP specs and route/RuboCop checks
  - update this document if protocol/tool behavior changes
- Rollback path:
  - revert the SDK bump commit
  - redeploy previous release
  - re-run focused MCP specs to confirm recovery
- If a security advisory affects `mcp`, patch/bump promptly and update this document in the same PR.

Example CI compatibility check:

```bash
bundle install
bundle exec ruby -e "require 'mcp'; puts MCP::VERSION"
bundle exec rspec spec/mcp/tool_catalog_spec.rb spec/mcp/server_factory_spec.rb spec/requests/api/v1/mcp/handle_spec.rb
```

## Feature Availability

MCP is Pro-gated at the workspace level:

- allowed: paid workspaces, active trials, billing-exempt workspaces
- blocked: free workspaces without trial

When blocked, `/mcp` returns HTTP `403` with JSON-RPC error code `-32003` and `error.data.error = "forbidden_feature"`.

## Required Environment Variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `MCP_SERVER_ENABLED` | `true` | Global on/off switch for HTTP MCP endpoint |
| `MCP_ALLOWED_ORIGINS` | empty | Comma/space-separated allowed Origins for browser-based MCP clients |
| `MIRU_MCP_TOKEN` | none | Required only for stdio mode (`bin/miru-mcp`) |

Notes:

- If `MCP_SERVER_ENABLED=false`, endpoint returns HTTP `404` with JSON-RPC code `-32004`.
- If `MCP_ALLOWED_ORIGINS` is unset, allowed origin defaults to the current request base URL.
- If `Origin` header is provided and not allowed, endpoint returns HTTP `403` with code `-32001`.

## Authentication

MCP uses existing Miru bearer auth. Use a Miru CLI session token:

```bash
miru login --base-url https://app.miru.so --email user@example.com --password '***'
miru config token
```

Use that token as:

```text
Authorization: Bearer <cli_token>
```

Token naming in examples:

- `MIRU_CLI_TOKEN` is the canonical token value from `miru login`.
- `bin/miru-mcp` expects `MIRU_MCP_TOKEN`.
- In practice, set `MIRU_MCP_TOKEN="$MIRU_CLI_TOKEN"` for stdio usage.

## HTTP MCP Usage

Endpoint:

```text
https://<your-miru-host>/mcp
```

Example initialize request:

```bash
curl -sS https://app.miru.so/mcp \
  -H "Authorization: Bearer $MIRU_CLI_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "MCP-Protocol-Version: 2025-03-26" \
  -H "MCP-Method: initialize" \
  -d '{
    "jsonrpc":"2.0",
    "id":"init-1",
    "method":"initialize",
    "params":{
      "protocolVersion":"2025-03-26",
      "capabilities":{},
      "clientInfo":{"name":"miru-docs-example","version":"1.0.0"}
    }
  }'
```

## stdio MCP Usage

Run from a checkout of this repo:

```bash
cd /path/to/miru-web
export MIRU_ROOT="$(pwd)"
export MIRU_CLI_TOKEN="<token-from-miru-config>"
MIRU_MCP_TOKEN="$MIRU_CLI_TOKEN" bin/miru-mcp
```

If token is missing, the command exits with:

```text
MIRU_MCP_TOKEN is required for stdio MCP mode
```

Example generic MCP client config:

```json
{
  "mcpServers": {
    "miru": {
      "command": "${MIRU_ROOT}/bin/miru-mcp",
      "env": {
        "MIRU_MCP_TOKEN": "${MIRU_CLI_TOKEN}"
      }
    }
  }
}
```

## Ruby SDK Client Usage

`MCP::Miru::Client` supports HTTP and stdio transports.

```ruby
# frozen_string_literal: true

client = MCP::Miru::Client.http(
  url: "https://app.miru.so/mcp",
  headers: { "Authorization" => "Bearer #{ENV.fetch('MIRU_CLI_TOKEN')}" }
)

begin
  result = client.call_tool(name: "miru.project.list", arguments: { query: "acme" })
  puts result.content.first.text
ensure
  client.close
end
```

```ruby
# frozen_string_literal: true

client = MCP::Miru::Client.stdio(
  command: "#{ENV.fetch('MIRU_ROOT')}/bin/miru-mcp",
  env: { "MIRU_MCP_TOKEN" => ENV.fetch("MIRU_CLI_TOKEN") }
)

begin
  puts client.call_tool(name: "miru.capabilities").content.first.text
ensure
  client.close
end
```

## Tool Coverage (CLI Parity)

Miru MCP currently supports the same major billing/time primitives as Miru CLI:

| MCP Tool | Mode | Equivalent CLI command |
| --- | --- | --- |
| `miru.capabilities` | read | `miru capabilities` |
| `miru.workspace.whoami` | read | `miru whoami` |
| `miru.project.list` | read | `miru project list` |
| `miru.client.list` | read | `miru client list` |
| `miru.time.list` | read | `miru time list` |
| `miru.time.create` | write | `miru time create` |
| `miru.time.update` | write | `miru time update` |
| `miru.time.delete` | write | `miru time delete` |
| `miru.invoice.list` | read | `miru invoice list` |
| `miru.invoice.create` | write | `miru invoice create` |
| `miru.invoice.show` | read | `miru invoice show` |
| `miru.invoice.send` | write | `miru invoice send` |
| `miru.payment.list` | read | `miru payment list` |
| `miru.payment.show` | read | `miru payment show` |
| `miru.expense.list` | read | `miru expense list` |
| `miru.expense.create` | write | `miru expense create` |

## Write Safety Conventions

Write tools support:

- `dry_run: true` for no-side-effect request previews
- `idempotency_key` for safe retries

Recommended defaults for agents:

1. Call `miru.capabilities` first.
2. Use `dry_run: true` for first draft of write calls.
3. Use stable `idempotency_key` values for retries/replays.

Enforcement note:

- `dry_run` and `idempotency_key` are client-side safety conventions in this release.
- Miru server supports both fields for write flows, and idempotency caching is applied when `idempotency_key` is provided.

## Testing And Verification

Focused MCP specs:

```bash
rtk mise exec -- bundle exec rspec \
  spec/mcp/tool_catalog_spec.rb \
  spec/mcp/server_factory_spec.rb \
  spec/requests/api/v1/mcp/handle_spec.rb
```

Useful checks:

```bash
rtk mise exec -- bundle exec rails routes -g mcp
rtk mise exec -- bundle exec rubocop app/mcp app/controllers/api/v1/mcp_controller.rb app/services/mcp/miru/client.rb spec/mcp spec/requests/api/v1/mcp spec/services/mcp/client_spec.rb
```

PR verification checklist:

- local specs pass:
  - `spec/mcp/tool_catalog_spec.rb`
  - `spec/mcp/server_factory_spec.rb`
  - `spec/requests/api/v1/mcp/handle_spec.rb`
- CI MCP-focused checks pass before merge
- at least one write flow is exercised with `dry_run: true` before enabling production agent writes

## Packaging And Distribution

Current approach:

- server, tools, and Ruby client are bundled in `miru-web`
- stdio distribution is via `bin/miru-mcp` in this repo

This means no extra package publication is required to use MCP today.

Trade-off:

- bundling in `miru-web` keeps shipping simple and avoids extra package-release overhead
- coupling is tighter than a standalone client gem

Minimal external-consumer path (when not running inside `miru-web`):

```ruby
# Gemfile (external Ruby consumer)
gem "mcp", "~> 0.13.0"
```

Then connect to Miru over HTTP MCP (no local Miru server code required).

If you want external package distribution later:

1. Extract `app/mcp/**` + `app/services/mcp/miru/client.rb` into a separate gem (for example `miru-mcp`).
2. Keep `bin/miru-mcp` in that gem for standalone stdio usage.
3. Publish to RubyGems and pin version from `miru-web`.
4. Keep tool schema/version compatibility documented per release.

For now, the recommended production path is to consume MCP directly from this repository and deploy with Miru.

## Risks And Mitigations

- Token leakage:
  - never log `MIRU_CLI_TOKEN` or `MIRU_MCP_TOKEN`
  - inject through secret manager or protected env vars
  - rotate token immediately on suspected exposure
- Entitlement bypass risk:
  - keep Pro gate coverage in request specs (`403`, JSON-RPC `-32003`)
  - verify every MCP write path still requires an authenticated bearer context
- Availability / abuse:
  - apply endpoint rate limits at ingress for `/mcp`
  - monitor request count, error rate, and latency for MCP traffic
  - investigate error spikes before enabling broader client automation
