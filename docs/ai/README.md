# AI + Gstack Docs Hub

This directory is the operational source of truth for AI-assisted engineering work in Miru.

## Who This Is For

- Engineers using Codex, Claude Code, or gstack skills on this repo.
- Reviewers validating production-facing fixes and deploy safety.
- Builders running repeatable QA and release checks.

## Fast Start

1. Read [workflow.md](workflow.md) for repo-safe Git and runtime behavior.
2. Read [testing.md](testing.md) for required verification commands.
3. Read [production.md](production.md) before deploy, restore, or live validation.
4. Read [razorpay.md](razorpay.md) before changing Razorpay payments, webhooks, or payouts.
5. Use [qmd-codex-gstack.md](qmd-codex-gstack.md) for low-token retrieval workflows.

## Recommended Command Sequence

```bash
# 1) Focused test first
rtk mise exec -- bundle exec rspec <focused_spec_file>

# 2) Frontend build guardrail
rtk mise exec -- timeout 30 bin/vite build

# 3) Production endpoint health check
curl -I https://app.miru.so/health

# 4) Browser verification for changed flow
# (Playwright/gstack browse flow with screenshots)
```

## Deploy-Safety Checklist

- Validate `/health` on live domain.
- Validate target user flow in browser on live domain.
- Validate no new console errors on changed pages.
- For SPA deploy safety, confirm no forced logout on transient API `401` when `_me` is valid.
- Capture screenshots for issue or PR verification comments.

## Documentation Access

- Hosted docs: `https://docs.miru.so`
- App shortcut: `https://app.miru.so/docs`
