#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

lane="${1:-}"

if [[ -z "$lane" ]]; then
  echo "usage: script/autoresearch/run.sh <docs_consistency|frontend_build>" >&2
  exit 1
fi

mkdir -p docs/experiments tmp/autoresearch
timestamp="$(date +"%Y-%m-%dT%H-%M-%S")"
log_file="docs/experiments/${timestamp}-${lane}.md"
tmp_file="tmp/autoresearch/${timestamp}-${lane}.txt"
status="PASS"

run_docs_consistency() {
  local required=(
    "AGENTS.md"
    "docs/ai/testing.md"
    "docs/ai/production.md"
    "docs/ai/workflow.md"
    "docs/ai/autoresearch-plan.md"
  )
  local missing=()
  local file

  for file in "${required[@]}"; do
    if [[ ! -f "$file" ]]; then
      missing+=("$file")
    fi
  done

  {
    echo "Required files"
    printf '%s\n' "${required[@]}"
    echo
    echo "Load on demand references"
    rg -n "docs/ai/testing.md|docs/ai/production.md|docs/ai/workflow.md" AGENTS.md
  } >"$tmp_file"

  if (( ${#missing[@]} > 0 )); then
    {
      echo
      echo "Missing files"
      printf '%s\n' "${missing[@]}"
    } >>"$tmp_file"
    status="FAIL"
  fi
}

run_frontend_build() {
  if ! mise exec -- timeout 30 bin/vite build >"$tmp_file" 2>&1; then
    status="FAIL"
  fi
}

case "$lane" in
  docs_consistency)
    run_docs_consistency
    ;;
  frontend_build)
    run_frontend_build
    ;;
  *)
    echo "unknown lane: $lane" >&2
    exit 1
    ;;
esac

{
  echo "# Autoresearch Experiment"
  echo
  echo "- Timestamp: $timestamp"
  echo "- Lane: $lane"
  echo "- Status: $status"
  echo
  echo "## Output"
  echo
  echo '```text'
  cat "$tmp_file"
  echo '```'
} >"$log_file"

echo "$log_file"

if [[ "$status" != "PASS" ]]; then
  exit 1
fi
