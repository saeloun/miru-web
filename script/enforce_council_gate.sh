#!/usr/bin/env bash
set -euo pipefail

if [[ "${SKIP_COUNCIL_GATE:-}" == "1" ]]; then
  echo "Council gate bypassed via SKIP_COUNCIL_GATE=1"
  exit 0
fi

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
GSTACK_BIN="${GSTACK_BIN:-}"

if [[ -z "$GSTACK_BIN" ]]; then
  if [[ -d "$ROOT/.agents/skills/gstack/bin" ]]; then
    GSTACK_BIN="$ROOT/.agents/skills/gstack/bin"
  elif [[ -d "$HOME/.claude/skills/gstack/bin" ]]; then
    GSTACK_BIN="$HOME/.claude/skills/gstack/bin"
  elif [[ -d "$HOME/.codex/skills/gstack/bin" ]]; then
    GSTACK_BIN="$HOME/.codex/skills/gstack/bin"
  fi
fi

if [[ -z "$GSTACK_BIN" || ! -x "$GSTACK_BIN/gstack-slug" ]]; then
  echo "ERROR: gstack binaries not found; cannot enforce council gate."
  echo "Set GSTACK_BIN or install gstack skills, then retry."
  exit 1
fi

eval "$("$GSTACK_BIN/gstack-slug" 2>/dev/null || true)"
GSTACK_HOME="${GSTACK_HOME:-$HOME/.gstack}"

if [[ -z "${SLUG:-}" || -z "${BRANCH:-}" ]]; then
  echo "ERROR: Unable to resolve gstack slug/branch for council gate."
  exit 1
fi

REVIEW_LOG="$GSTACK_HOME/projects/$SLUG/$BRANCH-reviews.jsonl"
HEAD_SHA="$(git rev-parse HEAD)"
HEAD_SHORT="$(git rev-parse --short HEAD)"

if [[ "${1:-}" == "--pre-push" ]]; then
  while read -r LOCAL_REF LOCAL_SHA REMOTE_REF REMOTE_SHA; do
    [[ "$LOCAL_REF" == "(delete)" ]] && continue
    PUSHED_COMMIT="$(git rev-parse --verify "${LOCAL_SHA}^{commit}" 2>/dev/null)" || PUSHED_COMMIT=""
    if [[ "$PUSHED_COMMIT" != "$HEAD_SHA" ]]; then
      echo "ERROR: Ref $LOCAL_REF object $LOCAL_SHA does not resolve to reviewed commit $HEAD_SHA (PUSH_HEAD_MISMATCH)." >&2
      echo "Push the current branch with git push, or check out and review the intended branch before retrying." >&2
      exit 1
    fi
  done
fi

if [[ ! -f "$REVIEW_LOG" ]]; then
  echo "ERROR: Council gate failed."
  echo "No review log found at: $REVIEW_LOG"
  echo "Run /autoplan (or /plan-eng-review + /plan-design-review + /plan-devex-review) for commit $HEAD_SHORT."
  exit 1
fi

set +e
CHECK_OUTPUT="$(
  ruby -rjson -e '
    file, head_sha = ARGV
    required = %w[plan-eng-review plan-design-review plan-devex-review]
    valid_statuses = %w[clean clear]
    entries = []

    File.foreach(file) do |line|
      line = line.strip
      next if line.empty?
      begin
        parsed = JSON.parse(line)
      rescue JSON::ParserError
        next
      end
      entries << parsed
    end

    entries.reverse!
    result = {}

    required.each do |skill|
      matched = entries.find do |entry|
        next false unless entry["skill"] == skill
        commit = (entry["commit_full"] || entry["commit"]).to_s
        next false if commit.empty?
        head_sha.start_with?(commit)
      end
      result[skill] = matched && (
        valid_statuses.include?(matched["status"].to_s.downcase) ||
        (skill == "plan-design-review" &&
          matched["commit_full"] == head_sha &&
          matched["status"] == "not_applicable" &&
          matched["applicability"] == "no_ui_scope" &&
          matched["applicability_complete"] == true &&
          matched["ui_review_completed"] == false &&
          matched["unresolved"].eql?(0))
      )
    end

    required.each { |skill| puts "#{skill}=#{result[skill] ? "ok" : "missing"}" }
    exit(result.values.all? ? 0 : 2)
  ' "$REVIEW_LOG" "$HEAD_SHA"
)"
CHECK_STATUS=$?
set -e

echo "$CHECK_OUTPUT" | while IFS= read -r line; do
  [[ -n "$line" ]] && echo "Council gate: $line"
done

if [[ $CHECK_STATUS -ne 0 ]]; then
  echo "ERROR: Council gate failed for commit $HEAD_SHORT."
  echo "Required clean reviews missing for this exact commit."
  echo "Run /autoplan or all three reviews, then push again."
  exit 1
fi

echo "Council gate passed for commit $HEAD_SHORT."
