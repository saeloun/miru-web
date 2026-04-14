# Miru Autoresearch Plan

## Goal

Build a safe autonomous improvement loop for Miru that can research, propose, verify, and keep only measurable improvements.

## Principles

- Follow Karpathy's `autoresearch` pattern:
  - one narrow editable surface per loop when possible
  - fixed evaluation budget
  - objective metric decides keep or discard
  - every run leaves a durable experiment log
- Follow Tobi's `qmd` pattern:
  - keep repo knowledge in markdown
  - search first, synthesize second
  - use local retrieval instead of reloading giant prompts

## Phase 1

- Define safe improvement lanes:
  - flaky test repair
  - focused docs cleanup
  - frontend crash regression checks
  - small performance wins with measurable before/after checks
- Create one metric per lane:
  - build success
  - focused spec pass rate
  - browser smoke pass rate
  - page-level perf delta

## Phase 2

- Build an experiment runner that:
  - takes a narrow task
  - applies a small patch
  - runs fixed verification
  - keeps the patch only if the metric improves or remains green
  - writes a markdown experiment note after every run

## Phase 3

- Add nightly or scheduled runs for the safest lanes only.
- Keep production, migrations, auth, and billing changes out of autonomous write scope until the loop proves reliable.

## Immediate TODO

- Keep the current manual lanes green:
  - `docs_consistency`
  - `frontend_build`
- Add one browser smoke matrix for the most fragile routes.
- Add the next narrow lane:
  - focused rspec verification
  - frontend smoke hardening
  - docs drift checks with stronger assertions
