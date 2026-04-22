---
name: miru-mcp
description: Use Miru MCP safely from AI agents with Pro-gate awareness, namespaced tools, and write-safe defaults (`dry_run`, `idempotency_key`).
---

# Miru MCP Skill

Use this skill when an agent needs to access Miru through MCP.

WHY: standardize safe, predictable agent behavior for Miru MCP.
RISK: write tools can mutate billing/time data, so write safety conventions must be followed.

## Quick Rules

1. Ensure workspace is Pro-eligible and MCP is enabled.
2. Use only `miru.*` tools.
3. Call `miru.capabilities` first.
4. For write tools, use `dry_run: true` on first pass and include `idempotency_key` on retryable writes.
5. Never call `miru.invoice.send` without explicit user confirmation.

## Compatibility

- Use the SDK compatibility policy in `docs/miru-mcp.md` as the single source of truth.
- `dry_run` and `idempotency_key` are client safety conventions in Miru MCP docs.

## Canonical Guide

For full setup, tool coverage, verification commands, and risk notes, use:

- `docs/miru-mcp.md`

## Verification

- Focused MCP specs pass.
- MCP RuboCop checks pass.
- `mcp-focused` CI job is green.
