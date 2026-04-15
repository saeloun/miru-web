# QMD For Codex + Gstack

## Purpose
Use `qmd` as a low-token retrieval layer before large agent prompts.

## Verified Commands (2026-04-15)

```sh
# Create collections
npx -y @tobilu/qmd collection add /path/to/notes --name notes
npx -y @tobilu/qmd collection add /path/to/meetings --name meetings

# Add context
npx -y @tobilu/qmd context add qmd://notes "Architecture and product notes"
npx -y @tobilu/qmd context add qmd://meetings "Meeting transcripts and decisions"

# Fast lexical retrieval
npx -y @tobilu/qmd search "token optimization" --json -n 10

# Hybrid retrieval for higher quality
npx -y @tobilu/qmd query "codex token optimization" --files -n 10
npx -y @tobilu/qmd query "codex token optimization" --json -n 5

# Fetch full content from result IDs or paths
npx -y @tobilu/qmd get "#abc123"
npx -y @tobilu/qmd multi-get "qmd://notes/*.md" -l 80
```

## Codex Retrieval Pattern
1. Start with `qmd search ... --json` for fast candidate docs.
2. Switch to `qmd query ... --files` when ranking quality matters.
3. Pull only top files with `qmd get` or `qmd multi-get`.
4. Feed only those excerpts into downstream prompts.

## Gstack Workflow Pattern
1. Keep collections aligned with active project roots.
2. Keep context strings short and high-signal.
3. Use `--files` for plan/review skills when you only need file targets.
4. Use `--json` for autonomous summarization or evaluation steps.

## Operational Guardrails
- Do not run `qmd collection add/update/embed` in parallel on the same index (SQLite lock risk).
- Do not run first-time `qmd query` in parallel (model download race can fail with `ENOENT`).
- Warm up models once with a single serial `qmd query`.
- Run `qmd embed` after major content updates for better hybrid quality.

## Optional Isolated Test Index
Useful for reproducible local experiments without touching your main index.

```sh
XDG_CONFIG_HOME=/tmp/qmd-config \
XDG_CACHE_HOME=/tmp/qmd-cache \
INDEX_PATH=/tmp/qmd-home/test.sqlite \
npx -y @tobilu/qmd status
```
